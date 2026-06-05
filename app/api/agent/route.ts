/** 
 * Agent API Route - Optimized with History & Rationale
 */
import { NextRequest, NextResponse } from "next/server";
import { getAgentUserId } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { unifiedAgentResponse } from "@/lib/agent-llm";
import { getSalonsCached } from "@/lib/salon-cache";
import type { SalonDoc } from "@/lib/salons";
import { connectDB } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { generateBookingId } from "@/lib/utils";
import { searchSalonsByLocation } from "@/lib/location-search";
import { resolveSalonImages } from "@/lib/salon-images";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const agentSchema = z.object({
  query: z.string().optional(),
  messages: z.array(z.object({
    role: z.string(),
    content: z.string(),
    salons: z.array(z.any()).optional(),
  })).optional(),
});

function computeMatchScore(s: SalonDoc, query: string, filters: any) {
  const q = query.toLowerCase();
  let score = 0;
  score += s.rating * 10;
  if (q.includes(s.specialty.toLowerCase())) score += 20;
  if (q.includes(s.area.toLowerCase())) score += 15;
  const matchingTags = s.tags?.filter(t => q.includes(t.toLowerCase())) || [];
  score += matchingTags.length * 5;
  if (filters.service && s.specialty.toLowerCase().includes(filters.service.toLowerCase())) score += 10;
  return Math.min(99, Math.floor(score + 30));
}

function toSalonCard(s: SalonDoc, query: string, filters: any) {
  return {
    _id: s._id,
    name: s.name,
    area: s.area,
    rating: s.rating,
    priceRange: s.priceRange,
    specialty: s.specialty,
    images: resolveSalonImages(s.images),
    matchScore: computeMatchScore(s, query, filters),
    whyRecommended: [
      `Experts in ${s.specialty.toLowerCase()}`,
      s.rating >= 4.7 ? "Top-rated for service quality" : "Highly recommended enclave",
      "Matches your specific preferences"
    ].slice(0, 3)
  };
}

function findSalonByIndex(query: string, messageList: any[]): number | null {
  const q = query.toLowerCase();
  const lastSalonsMsg = [...messageList].reverse().find(m => m.salons && m.salons.length > 0);
  if (!lastSalonsMsg) return null;
  if (/\b(first|1st|number 1)\b/.test(q)) return 0;
  if (/\b(second|2nd|number 2)\b/.test(q)) return 1;
  if (/\b(third|3rd|number 3)\b/.test(q)) return 2;
  if (/\b(fourth|4th|number 4)\b/.test(q)) return 3;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAgentUserId();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    
    if (!rateLimit(ip, 5000).allowed) {
      return NextResponse.json({ type: "text", response: "Just a second, I'm processing your request!" });
    }

    const body = await req.json().catch(() => ({}));
    const validated = agentSchema.parse(body);
    
    const query = (validated.query || "").trim();
    const messageList = validated.messages || [];
    
    if (!query && messageList.length === 0) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const userQuery = query || (messageList[messageList.length - 1]?.content || "");
    const salons = await getSalonsCached();

    if (messageList.length === 0 && (userQuery.toLowerCase().includes("hello") || userQuery.toLowerCase().includes("hi"))) {
      try {
        await connectDB();
        const lastBooking = await Booking.findOne({ userId }).sort({ createdAt: -1 });
        if (lastBooking) {
          const recommended = salons.find(s => s.specialty === lastBooking.service.name) || salons[0];
          return NextResponse.json({
            type: "text",
            response: `Welcome back! Based on your history with ${lastBooking.salonName}, you might enjoy ${recommended.name} in ${recommended.area}. How can I help you today?`,
            salons: [toSalonCard(recommended, "", {})]
          });
        }
      } catch (e) { /* silent fallback */ }
    }

    const ai = await unifiedAgentResponse(userQuery, messageList, salons);
    if (!ai) return NextResponse.json({ type: "text", response: "I'm here to help. Tell me what you're looking for in Bangalore!" });

    const { intent, filters = {}, message: aiMessage } = ai;
    const selectedIdx = findSalonByIndex(userQuery, messageList);
    let targetSalon: SalonDoc | undefined;
    
    if (selectedIdx !== null) {
      const lastSalonsMsg = [...messageList].reverse().find(m => m.salons && m.salons.length > 0);
      const salonId = lastSalonsMsg.salons[selectedIdx]?._id;
      targetSalon = salons.find(s => s._id === salonId);
    } else if (filters.salonName) {
      targetSalon = salons.find(s => s.name.toLowerCase().includes(filters.salonName!.toLowerCase()) || filters.salonName!.toLowerCase().includes(s.name.toLowerCase()));
    }

    if (intent === "book" && targetSalon) {
      const servicePick = targetSalon.services.find(svc => filters.service ? svc.name.toLowerCase().includes(filters.service.toLowerCase()) : false) || targetSalon.services[0];
      const bookingId = generateBookingId();
      const slot = filters.time || "11:30 AM";
      const date = filters.date || new Date().toISOString().split("T")[0];
      try {
        await connectDB();
        await Booking.create({
          userId, salonId: targetSalon._id, salonName: targetSalon.name,
          service: { name: servicePick.name, price: servicePick.price, duration: servicePick.duration },
          date: new Date(date), timeSlot: slot, status: "confirmed", bookingId, paymentMode: "pay_at_salon",
        });
        return NextResponse.json({
          type: "booking", response: aiMessage,
          booking: { bookingId, salonName: targetSalon.name, service: servicePick.name, date, timeSlot: slot, price: servicePick.price }
        });
      } catch (e) { /* fallback */ }
    }

    const search = searchSalonsByLocation(salons, {
      query: userQuery, locationPhrase: filters.area || null,
      maxPrice: filters.maxPrice || undefined, service: filters.service || undefined, limit: 4,
    });

    let results = search.salons;
    if (results.length === 0) results = [...salons].sort((a, b) => b.rating - a.rating).slice(0, 4);

    return NextResponse.json({
      type: "salons", response: aiMessage,
      salons: results.map(s => toSalonCard(s, userQuery, filters))
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    return NextResponse.json({ type: "text", response: "I'm momentarily offline, but feel free to browse our partners below!" }, { status: 200 });
  }
}
