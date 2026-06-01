import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAgentModel } from "@/lib/gemini";
import { getSalons } from "@/lib/salons";
import type { SalonDoc } from "@/lib/salons";
import { connectDB } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { generateBookingId } from "@/lib/utils";
import { parseUserQuery } from "@/lib/agent-query";
import {
  extractLocationPhrase,
  searchSalonsByLocation,
  buildLocationResponse,
} from "@/lib/location-search";

export const dynamic = "force-dynamic";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80";

function toSalonCard(s: SalonDoc) {
  return {
    _id: s._id,
    name: s.name,
    area: s.area,
    rating: s.rating,
    priceRange: s.priceRange,
    specialty: s.specialty,
    images: s.images?.length > 0 ? s.images : [DEFAULT_IMAGE],
  };
}

const SYSTEM = `You are Glamora's AI booking assistant for Bangalore, India.
Extract intent and filters. Respond ONLY with JSON:
{
  "intent": "search"|"book"|"check_slots"|"recommend"|"general",
  "filters": { "area": "locality user mentioned", "maxPrice": number|null, "service": string|null, "salonName": string|null },
  "response": "short friendly sentence"
}`;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages } = await req.json();
  const lastUser = [...messages]
    .reverse()
    .find((m: { role: string }) => m.role === "user");
  const query = lastUser?.content?.trim() || "";
  if (!query) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const parsed = parseUserQuery(query);
  const salons = await getSalons();

  if (salons.length === 0) {
    return NextResponse.json({
      type: "text",
      response:
        "Could not load salons. Check MONGODB_URI in .env.local or visit /api/seed once.",
    });
  }

  let geminiFilters: Record<string, string | number> = {};
  let geminiResponse = "";
  let geminiIntent = parsed.intent;

  try {
    const context = salons
      .map((s) => `${s.name} (${s.area}): ${s.specialty}, ₹ services from ${Math.min(...s.services.map((x) => x.price))}`)
      .join("\n");
    const model = getAgentModel();
    const result = await model.generateContent(
      `${SYSTEM}\n\nPartners:\n${context}\n\nUser: ${query}`
    );
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const data = JSON.parse(match[0]) as {
        intent?: string;
        filters?: Record<string, string | number>;
        response?: string;
      };
      if (data.intent) geminiIntent = data.intent as typeof parsed.intent;
      if (data.filters) geminiFilters = data.filters;
      if (data.response) geminiResponse = data.response;
    }
  } catch {
    /* location search works without Gemini */
  }

  const locationPhrase =
    parsed.locationPhrase ||
    (geminiFilters.area ? String(geminiFilters.area) : null) ||
    extractLocationPhrase(query);

  const maxPrice =
    parsed.maxPrice ??
    (geminiFilters.maxPrice ? Number(geminiFilters.maxPrice) : undefined);

  const service = parsed.service || (geminiFilters.service ? String(geminiFilters.service) : undefined);

  const isDiscovery =
    parsed.isDiscovery ||
    Boolean(locationPhrase) ||
    geminiIntent === "search" ||
    geminiIntent === "recommend" ||
    /\b(suggest|find|recommend|salon|near|budget|live|where|location)\b/i.test(query);

  if (geminiIntent === "book") {
    const nameHint = String(geminiFilters.salonName || query).toLowerCase();
    const salon = salons.find((s) => nameHint.includes(s.name.toLowerCase()));
    if (salon) {
      const servicePick =
        salon.services.find((svc) => svc.price <= (maxPrice ?? Infinity)) ||
        salon.services[0];
      const bookingId = generateBookingId();
      const slot = String(geminiFilters.time || "11:30 AM");
      const date =
        String(geminiFilters.date || "") ||
        new Date().toISOString().split("T")[0];
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
      } catch {
        /* demo */
      }
      return NextResponse.json({
        type: "booking",
        response:
          geminiResponse ||
          `Booked at ${salon.name}. Confirmation ${bookingId}.`,
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

  if (isDiscovery) {
    const search = searchSalonsByLocation(salons, {
      query,
      locationPhrase,
      maxPrice,
      service,
      limit: 4,
    });

    let results = search.salons;
    if (results.length === 0) {
      results = [...salons]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);
    }

    const response =
      geminiResponse && !/premium options/i.test(geminiResponse)
        ? geminiResponse
        : buildLocationResponse(search, results.length, maxPrice);

    return NextResponse.json({
      type: "salons",
      response,
      salons: results.map(toSalonCard),
      meta: {
        searchedLocation: search.locationPhrase,
        matchedAreas: search.partnerAreas,
        exactMatch: search.exactMatch,
        totalPartners: salons.length,
      },
    });
  }

  return NextResponse.json({
    type: "text",
    response:
      geminiResponse ||
      'Tell me your area in Bangalore — e.g. "salons near Marathahalli under ₹5000".',
  });
}
