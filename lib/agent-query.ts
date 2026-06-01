/** Rule-based query parsing — complements location-search.ts */

import {
  extractLocationPhrase,
  isKnownLocationPhrase,
  PARTNER_AREAS,
  resolvePartnerAreas,
} from "./location-search";

function hasWord(q: string, word: string): boolean {
  return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
    q
  );
}

export type ParsedQuery = {
  intent: "search" | "book" | "check_slots" | "recommend" | "general";
  maxPrice?: number;
  locationPhrase: string | null;
  service?: string;
  salonName?: string;
  isDiscovery: boolean;
};

export function parseUserQuery(query: string): ParsedQuery {
  const q = query.toLowerCase();
  const result: ParsedQuery = {
    intent: "general",
    locationPhrase: extractLocationPhrase(query),
    isDiscovery: false,
  };

  if (result.locationPhrase && isKnownLocationPhrase(result.locationPhrase)) {
    result.isDiscovery = true;
    result.intent = "search";
  } else if (result.locationPhrase && !isKnownLocationPhrase(result.locationPhrase)) {
    result.locationPhrase = null;
  }

  if (
    /\b(book|reserve|appointment|schedule)\b/.test(q) &&
    !/\b(find|suggest|recommend|who|which)\b/.test(q)
  ) {
    result.intent = "book";
  } else if (/\b(slot|available|open|free)\b/.test(q)) {
    result.intent = "check_slots";
  } else if (
    /\b(find|suggest|recommend|near|budget|salon|salons|spa|facial|haircut|fade|bridal|live|located|where|show|list)\b/.test(
      q
    )
  ) {
    result.intent = "search";
    result.isDiscovery = true;
  }

  const budgetMatch =
    q.match(/(?:₹|rs\.?|inr\s*)?(\d+)\s*k\b/i) ||
    q.match(/budget\s*(?:is|of)?\s*(\d+)/i) ||
    q.match(/under\s*(?:₹|rs\.?)?\s*(\d+)/i) ||
    q.match(/(\d{3,5})\s*(?:rupees|inr)?/i);
  if (budgetMatch) {
    let n = parseInt(budgetMatch[1], 10);
    if (/k\b/i.test(budgetMatch[0]) && n < 100) n *= 1000;
    result.maxPrice = n;
    result.isDiscovery = true;
    if (result.intent === "general") result.intent = "search";
  }

  for (const area of PARTNER_AREAS) {
    if (q.includes(area.toLowerCase())) {
      result.locationPhrase = result.locationPhrase || area;
      result.isDiscovery = true;
      if (result.intent === "general") result.intent = "search";
    }
  }

  const services = [
    "hydrafacial",
    "fade",
    "bridal",
    "spa",
    "massage",
    "keratin",
    "haircut",
    "groom",
    "facial",
    "nail",
  ];
  for (const s of services) {
    if (hasWord(q, s)) {
      result.service = s;
      result.isDiscovery = true;
      if (result.intent === "general") result.intent = "search";
      break;
    }
  }

  return result;
}

export function expandAreaHint(hint: string): string[] {
  const partners = resolvePartnerAreas(hint);
  return partners.length ? partners : [hint];
}
