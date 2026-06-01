import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { parseWithLlm } from "@/lib/agent-llm";
import { parseUserQuery } from "@/lib/agent-query";
import { getSalonsCached } from "@/lib/salon-cache";
import type { SalonDoc } from "@/lib/salons";
import { connectDB } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { generateBookingId } from "@/lib/utils";
import {
  extractLocationPhrase,
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
      .filter((w) => w.length > 3)
      .some((w) => q.includes(w))
  );
}

function needsLlm(parsed: ReturnType<typeof parseUserQuery>, query: string): boolean {
  if (process.env.AGENT_USE_LLM === "false") return false;
  if (parsed.isDiscovery || parsed.intent === "search" || parsed.intent === "recommend") {
    return false;
  }
  if (parsed.intent === "check_slots") return false;
  if (parsed.intent === "book") return false;
  if (/^(hi|hello|hey|namaste|thanks|thank you)\b/i.test(query.trim())) {
    return false;
  }
  return parsed.intent === "general" && query.length > 120;
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
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
  const salons = await getSalonsCached();

  if (salons.length === 0) {
    return NextResponse.json({
      type: "text",
      response:
        "Could not load salons. Check MONGODB_URI or visit /api/seed once.",
    });
  }

  let geminiFilters: Record<string, string | number> = {};
  let geminiResponse = "";
  let geminiIntent = parsed.intent;

  if (needsLlm(parsed, query)) {
    const llm = await parseWithLlm(query, salons);
    if (llm?.intent) geminiIntent = llm.intent as typeof parsed.intent;
    if (llm?.filters) geminiFilters = llm.filters;
    if (llm?.response) geminiResponse = llm.response;
  }

  const locationPhrase =
    parsed.locationPhrase ||
    (geminiFilters.area ? String(geminiFilters.area) : null) ||
    extractLocationPhrase(query);

  const maxPrice =
    parsed.maxPrice ??
    (geminiFilters.maxPrice ? Number(geminiFilters.maxPrice) : undefined);

  const service =
    parsed.service ||
    (geminiFilters.service ? String(geminiFilters.service) : undefined);

  const isDiscovery =
    parsed.isDiscovery ||
    Boolean(locationPhrase) ||
    geminiIntent === "search" ||
    geminiIntent === "recommend" ||
    /\b(suggest|find|recommend|salon|near|budget|live|where|location)\b/i.test(
      query
    );

  if (geminiIntent === "book" || parsed.intent === "book") {
    const salon =
      findSalonInQuery(query, salons) ||
      (geminiFilters.salonName
        ? salons.find((s) =>
            String(geminiFilters.salonName)
              .toLowerCase()
              .includes(s.name.toLowerCase())
          )
        : undefined);

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

  if (/^(hi|hello|hey|namaste)\b/i.test(query.trim())) {
    return NextResponse.json({
      type: "text",
      response:
        "Namaste! Ask for salons by area or budget — e.g. “fade under ₹1200 in Koramangala”.",
    });
  }

  return NextResponse.json({
    type: "text",
    response:
      geminiResponse ||
      'Tell me your area in Bangalore — e.g. "salons near Marathahalli under ₹5000".',
  });
}
