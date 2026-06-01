import { NextRequest, NextResponse } from "next/server";
import { getAgentUserId } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { unifiedAgentResponse } from "@/lib/agent-llm";
import { parseUserQuery } from "@/lib/agent-query";
import { getSalonsCached } from "@/lib/salon-cache";
import type { SalonDoc } from "@/lib/salons";
import { connectDB } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { generateBookingId } from "@/lib/utils";
import {
  isKnownLocationPhrase,
  searchSalonsByLocation,
  buildLocationResponse,
} from "@/lib/location-search";
import { resolveSalonImages } from "@/lib/salon-images";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function toSalonCard(s: SalonDoc) {
  return {
    _id: s._id,
    name: s.name,
    area: s.area,
    rating: s.rating,
    priceRange: s.priceRange,
    specialty: s.specialty,
    images: resolveSalonImages(s.images),
  };
}

function findSalonInQuery(query: string, salons: SalonDoc[]): SalonDoc | undefined {
  const q = query.toLowerCase();
  const exact = salons.find((s) => q.includes(s.name.toLowerCase()));
  if (exact) return exact;

  return salons.find((s) =>
    s.name
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .some((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(q))
  );
}

function generalReply(query: string): string {
  const q = query.toLowerCase();
  if (/^(thanks|thank you|ty|ok|okay|cool|great|nice|got it)\b/.test(q.trim())) {
    return "You're welcome. Tell me what you want to do next, and I'll help.";
  }
  if (/\b(price|cost|how much|expensive|cheap)\b/.test(q)) {
    return "Partners range from about ₹400 to ₹15,000 depending on service. Try: “hydrafacial under ₹5000 in HSR Layout”.";
  }
  return 'Share an area or service — e.g. "fade under ₹1200 in Koramangala" or "spas near Whitefield".';
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
      }, { status: 429 });
    }

    const body = await req.json();
    const query = (typeof body.query === "string" ? body.query : "").trim();
    const messageList = Array.isArray(body.messages) ? body.messages : [];
    
    if (!query && messageList.length === 0) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const userQuery = query || (messageList[messageList.length - 1]?.content || "");

    const salons = await getSalonsCached();
    if (salons.length === 0) {
      return NextResponse.json({
        type: "text",
        response: "I'm having trouble connecting to the marketplace. Please try again in a moment.",
      });
    }

    // --- AI FIRST FLOW ---
    const ai = await unifiedAgentResponse(userQuery, messageList, salons);

    if (!ai) {
      // Fallback if AI fails
      const parsed = parseUserQuery(userQuery);
      return NextResponse.json({
        type: "text",
        response: generalReply(userQuery),
      });
    }

    // Process AI intent
    const intent = ai.intent;
    const filters = ai.filters || {};
    const aiMessage = ai.message;

    const locationPhrase = filters.area || null;
    const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : undefined;
    const service = filters.service || undefined;

    const wantsBook = intent === "book" && (filters.salonName || findSalonInQuery(userQuery, salons));

    if (wantsBook) {
      const salon =
        (filters.salonName
          ? salons.find((s) =>
              String(filters.salonName).toLowerCase().includes(s.name.toLowerCase()) ||
              s.name.toLowerCase().includes(String(filters.salonName).toLowerCase())
            )
          : null) || findSalonInQuery(userQuery, salons);

      if (salon) {
        const servicePick =
          salon.services.find((svc) => 
            service ? svc.name.toLowerCase().includes(service.toLowerCase()) : false
          ) ||
          salon.services.find((svc) => svc.price <= (maxPrice ?? Infinity)) ||
          salon.services[0];
          
        const bookingId = generateBookingId();
        const slot = filters.time || "11:30 AM";
        const date = filters.date || new Date().toISOString().split("T")[0];
        
        try {
          await connectDB();
          await Booking.create({
            userId,
            salonId: salon._id,
            salonName: salon.name,
            service: {
              name: servicePick.name,
              price: servicePick.price,
              duration: servicePick.duration,
            },
            date: new Date(date),
            timeSlot: slot,
            status: "confirmed",
            bookingId,
            paymentMode: "pay_at_salon",
          });
        } catch { /* demo fallback */ }

        return NextResponse.json({
          type: "booking",
          response: aiMessage,
          booking: {
            bookingId,
            salonName: salon.name,
            service: servicePick.name,
            date,
            timeSlot: slot,
            price: servicePick.price,
          },
        });
      }
    }

    if (intent === "search" || intent === "recommend" || locationPhrase || service || maxPrice) {
      const search = searchSalonsByLocation(salons, {
        query: userQuery,
        locationPhrase,
        maxPrice,
        service,
        limit: 4,
      });

      let results = search.salons;
      if (results.length === 0 && !locationPhrase) {
        results = [...salons].sort((a, b) => b.rating - a.rating).slice(0, 4);
      }

      return NextResponse.json({
        type: "salons",
        response: aiMessage,
        salons: results.map(toSalonCard),
        meta: {
          searchedLocation: search.locationPhrase,
          matchedAreas: search.partnerAreas,
          exactMatch: search.exactMatch,
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
        response: "I'm momentarily unavailable to chat, but you can still browse the salons below!",
      },
      { status: 200 }
    );
  }
}
