/** 
 * Agent API Route - Optimized for Groq + Google Places + MongoDB
 * Build Trigger: 2026-06-02T23:30:00Z 
 */
import { NextRequest, NextResponse } from "next/server";
import { getAgentUserId } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { unifiedAgentResponse } from "@/lib/agent-llm";
import { connectDB } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { generateBookingId } from "@/lib/utils";
import { searchGoogleSalons, getGooglePhotoUrl, type GoogleSalon } from "@/lib/google-places";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function toSalonCardFromGoogle(s: GoogleSalon) {
  return {
    _id: s.place_id,
    name: s.name,
    area: s.vicinity || s.formatted_address || "Unknown Area",
    rating: s.rating || 0,
    priceRange: "₹₹ (Est.)",
    specialty: s.types?.[0]?.replace(/_/g, " ") || "Salon",
    images: s.photos?.[0] ? [getGooglePhotoUrl(s.photos[0].photo_reference)] : [],
    isGoogle: true
  };
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAgentUserId();
    
    // Rate limit for hackathon cost control
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = rateLimit(ip, 10_000); // 10s window
    if (!limit.allowed) {
      return NextResponse.json({
        type: "text",
        response: "Wait a moment... I'm thinking about your previous request!",
      }, { status: 200 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    const query = (typeof body?.query === "string" ? body.query : "").trim();
    const messageList = Array.isArray(body?.messages) ? body.messages : [];
    
    if (!query && messageList.length === 0) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const userQuery = query || (messageList[messageList.length - 1]?.content || "");

    // --- AI FIRST FLOW (Now prioritizing Groq) ---
    const ai = await unifiedAgentResponse(userQuery, messageList, []);

    if (!ai) {
      return NextResponse.json({
        type: "text",
        response: "I'm having a bit of trouble thinking right now. Could you try asking again?",
      });
    }

    // Process AI intent
    const intent = ai.intent;
    const filters = ai.filters || {};
    const aiMessage = ai.message;

    const locationPhrase = filters.area || null;
    const service = filters.service || "salon";

    // Handle Search / Recommendation with Google Places
    if (intent === "search" || intent === "recommend" || locationPhrase) {
      const googleResults = await searchGoogleSalons(service, locationPhrase || "Bangalore");
      
      return NextResponse.json({
        type: "salons",
        response: aiMessage,
        salons: googleResults.map(toSalonCardFromGoogle),
      });
    }

    // Handle Booking (Still uses MongoDB for the actual record)
    if (intent === "book") {
      const salonName = filters.salonName || "Salon";
      const bookingId = generateBookingId();
      const slot = filters.time || "11:30 AM";
      const date = filters.date || new Date().toISOString().split("T")[0];
      
      try {
        await connectDB();
        await Booking.create({
          userId,
          salonName,
          service: { name: service, price: 1000, duration: 60 },
          date: new Date(date),
          timeSlot: slot,
          status: "confirmed",
          bookingId,
          paymentMode: "pay_at_salon",
        });
      } catch (err) {
        console.error("Booking error:", err);
      }

      return NextResponse.json({
        type: "booking",
        response: aiMessage,
        booking: {
          bookingId,
          salonName,
          service,
          date,
          timeSlot: slot,
          price: 1000,
        },
      });
    }

    // Default: Just chat
    return NextResponse.json({
      type: "text",
      response: aiMessage,
    });

  } catch (error) {
    console.error("Agent route failed", error);
    return NextResponse.json(
      {
        type: "text",
        response: "I'm momentarily unavailable to chat, but you can still search for salons manually!",
      },
      { status: 200 }
    );
  }
}
