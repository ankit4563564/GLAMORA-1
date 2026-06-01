import { NextRequest, NextResponse } from "next/server";
import { getAgentUserId } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { parseWithLlm } from "@/lib/agent-llm";
import { completeText, isTextLlmConfigured } from "@/lib/llm";
import { parseUserQuery } from "@/lib/agent-query";
import { getSalonsCached } from "@/lib/salon-cache";
import type { SalonDoc } from "@/lib/salons";
import { connectDB } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { generateBookingId } from "@/lib/utils";
import {
  extractLocationPhrase,
  isKnownLocationPhrase,
  searchSalonsByLocation,
  buildLocationResponse,
} from "@/lib/location-search";
import { resolveSalonImages } from "@/lib/salon-images";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
const CHAT_TIMEOUT_MS = 6_000;

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

function needsLlm(parsed: ReturnType<typeof parseUserQuery>, query: string): boolean {
  if (process.env.AGENT_USE_LLM === "false") return false;
  if (!isTextLlmConfigured()) return false;
  if (parsed.isDiscovery || parsed.intent === "search" || parsed.intent === "recommend") {
    return false;
  }
  if (parsed.intent === "check_slots") return false;
  if (parsed.intent === "book") return false;
  if (/^(hi|hello|hey|namaste|thanks|thank you)\b/i.test(query.trim())) {
    return false;
  }
  return parsed.intent === "general" && query.length > 30;
}

function isConversationalQuery(
  parsed: ReturnType<typeof parseUserQuery>,
  query: string
): boolean {
  if (parsed.isDiscovery || parsed.intent !== "general") return false;
  if (
    /\b(price|cost|how much|expensive|cheap|hour|timing|open|close|when|help|what can you|how do)\b/i.test(
      query
    )
  ) {
    return false;
  }
  return true;
}

async function chatLikeAssistant(
  query: string,
  messages: Array<{ role?: string; content?: string }>
): Promise<string | null> {
  if (process.env.AGENT_USE_LLM === "false") return null;
  if (!isTextLlmConfigured()) return null;

  const recent = messages
    .filter((m) => m?.role === "user" || m?.role === "assistant")
    .slice(-8)
    .map((m) => `${m.role}: ${m.content || ""}`)
    .join("\n");

  const work = completeText({
    system:
      "You are Glamora's friendly AI concierge. Respond like a normal helpful ChatGPT-style assistant, but stay concise. You can answer general questions, acknowledge thanks, and keep conversation natural. When the user asks about salons, beauty services, booking, prices, or areas, guide them toward Glamora's Bangalore salon marketplace.",
    user: `Recent chat:\n${recent || "No prior chat."}\n\nUser: ${query}`,
    maxTokens: 220,
    temperature: 0.5,
  });

  try {
    return await Promise.race([
      work,
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), CHAT_TIMEOUT_MS)
      ),
    ]);
  } catch {
    return null;
  }
}

function resolveLocationPhrase(
  parsed: ReturnType<typeof parseUserQuery>,
  query: string,
  geminiArea?: string
): string | null {
  const candidates = [
    parsed.locationPhrase,
    geminiArea || null,
    extractLocationPhrase(query),
  ].filter(Boolean) as string[];

  for (const phrase of candidates) {
    if (isKnownLocationPhrase(phrase)) return phrase;
  }
  return null;
}

function generalReply(query: string): string {
  const q = query.toLowerCase();
  if (/^(thanks|thank you|ty|ok|okay|cool|great|nice|got it)\b/.test(q.trim())) {
    return "You're welcome. Tell me what you want to do next, and I'll help.";
  }
  if (/^(hi|hello|hey|namaste)\b/i.test(q.trim())) {
    return "Hi! I can chat normally, or help you find and book Bangalore salons when you need.";
  }
  if (/\b(price|cost|how much|expensive|cheap)\b/.test(q)) {
    return "Partners range from about ₹400 to ₹15,000 depending on service. Try: “hydrafacial under ₹5000 in HSR Layout”.";
  }
  if (/\b(hour|timing|open|close|when)\b/.test(q)) {
    return "Most lounges run 10 AM – 8 PM. Name an area and service to see live-style slots on the book page.";
  }
  if (/\b(help|what can you|how do)\b/.test(q)) {
    return "I find Bangalore salons by area, service, and budget — and can demo-book when you name a lounge. Example: “bridal makeup in Indiranagar”.";
  }
  return 'Share an area or service — e.g. "fade under ₹1200 in Koramangala" or "spas near Whitefield".';
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAgentUserId();

    const body = await req.json();
    const directQuery =
      typeof body.query === "string" ? body.query.trim() : "";
    const messageList = Array.isArray(body.messages) ? body.messages : [];
    const lastUser = [...messageList]
      .reverse()
      .find((m: { role?: string }) => m?.role === "user");
    const fromHistory =
      typeof lastUser?.content === "string"
        ? lastUser.content.trim()
        : typeof lastUser?.text === "string"
          ? lastUser.text.trim()
          : "";
    const query = directQuery || fromHistory;
    if (!query) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const parsed = parseUserQuery(query);
    if (isConversationalQuery(parsed, query)) {
      const response =
        (await chatLikeAssistant(query, messageList)) || generalReply(query);
      return NextResponse.json({ type: "text", response });
    }

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

  const locationPhrase = resolveLocationPhrase(
    parsed,
    query,
    geminiFilters.area ? String(geminiFilters.area) : undefined
  );

  const maxPrice =
    parsed.maxPrice ??
    (geminiFilters.maxPrice ? Number(geminiFilters.maxPrice) : undefined);

  const service =
    parsed.service ||
    (geminiFilters.service ? String(geminiFilters.service) : undefined);

  const wantsBook =
    (parsed.intent === "book" || geminiIntent === "book") &&
    /\b(book|reserve|appointment|schedule)\b/i.test(query);

  const isDiscovery =
    parsed.isDiscovery ||
    parsed.intent === "check_slots" ||
    geminiIntent === "search" ||
    geminiIntent === "recommend" ||
    Boolean(locationPhrase);

  if (wantsBook) {
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

    return NextResponse.json({
      type: "text",
      response: `Which lounge should I book? For example: "Book a fade at The Groom Room tomorrow at 11 AM".`,
    });
  }

  if (parsed.intent === "check_slots" || geminiIntent === "check_slots") {
    const area = locationPhrase || "Bangalore";
    return NextResponse.json({
      type: "text",
      response: `Typical slots near ${area} are 10 AM – 7 PM. Pick a lounge below to see bookable times.`,
    });
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
      response: geminiResponse || generalReply(query),
    });
  } catch (error) {
    console.error("Agent route failed", error);
    return NextResponse.json(
      {
        type: "text",
        response:
          "I could not reach the concierge engine just now. The salon marketplace is still available while I recover.",
      },
      { status: 200 }
    );
  }
}
