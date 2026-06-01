import type { SalonDoc } from "@/lib/salons";

/** Bangalore localities → nearest Glamora partner enclaves (demo geospatial proxy) */
export const LOCALITY_TO_PARTNERS: Record<string, string[]> = {
  kengri: ["Jayanagar", "Electronic City"],
  kengeri: ["Jayanagar", "Electronic City"],
  banashankari: ["Jayanagar", "HSR Layout"],
  basavanagudi: ["Jayanagar", "Malleshwaram"],
  btm: ["HSR Layout", "Koramangala"],
  "btm layout": ["HSR Layout", "Koramangala"],
  bommanahalli: ["HSR Layout", "Electronic City"],
  bellandur: ["HSR Layout", "Whitefield", "Koramangala"],
  marathahalli: ["Whitefield", "Koramangala", "HSR Layout"],
  sarjapur: ["HSR Layout", "Whitefield", "Koramangala"],
  hebbal: ["Sadashivanagar", "Kalyan Nagar", "Malleshwaram"],
  yelahanka: ["Sadashivanagar", "Kalyan Nagar"],
  rajajinagar: ["Malleshwaram", "Sadashivanagar"],
  vijayanagar: ["Malleshwaram", "Jayanagar"],
  "rt nagar": ["Sadashivanagar", "Kalyan Nagar"],
  "r t nagar": ["Sadashivanagar", "Kalyan Nagar"],
  "frazer town": ["Indiranagar", "MG Road"],
  ulsoor: ["Indiranagar", "MG Road"],
  domlur: ["Indiranagar", "MG Road"],
  "cv raman nagar": ["Indiranagar", "Kalyan Nagar"],
  mahadevapura: ["Whitefield", "Koramangala"],
  brookefield: ["Whitefield", "Kalyan Nagar"],
  itpl: ["Whitefield", "Kalyan Nagar"],
  "silk board": ["HSR Layout", "Electronic City", "Koramangala"],
  "jp nagar": ["Jayanagar", "HSR Layout"],
  "j p nagar": ["Jayanagar", "HSR Layout"],
  banerghatta: ["Jayanagar", "HSR Layout", "Electronic City"],
  nagarbhavi: ["Jayanagar", "Malleshwaram"],
  peenya: ["Malleshwaram", "Sadashivanagar"],
  yeshwanthpur: ["Malleshwaram", "Sadashivanagar"],
  indiranagar: ["Indiranagar"],
  koramangala: ["Koramangala"],
  jayanagar: ["Jayanagar"],
  hsr: ["HSR Layout"],
  "hsr layout": ["HSR Layout"],
  "mg road": ["MG Road"],
  malleshwaram: ["Malleshwaram"],
  sadashivanagar: ["Sadashivanagar"],
  "kalyan nagar": ["Kalyan Nagar"],
  whitefield: ["Whitefield"],
  "electronic city": ["Electronic City"],
  ecity: ["Electronic City"],
};

export const PARTNER_AREAS = [
  "Indiranagar",
  "Koramangala",
  "Jayanagar",
  "HSR Layout",
  "MG Road",
  "Malleshwaram",
  "Sadashivanagar",
  "Kalyan Nagar",
  "Whitefield",
  "Electronic City",
];

/** True when phrase maps to a Bangalore partner area or known locality alias. */
export function isKnownLocationPhrase(phrase: string | null): boolean {
  if (!phrase || phrase.trim().length < 3) return false;
  const norm = phrase.toLowerCase().trim();
  if (resolvePartnerAreas(phrase).length > 0) return true;
  for (const key of Object.keys(LOCALITY_TO_PARTNERS)) {
    if (norm.includes(key) || key.includes(norm)) return true;
  }
  return PARTNER_AREAS.some(
    (area) =>
      norm.includes(area.toLowerCase()) || area.toLowerCase().includes(norm)
  );
}

/** Pull a location phrase from natural language (strict — avoids "interested in X" false positives). */
export function extractLocationPhrase(query: string): string | null {
  const q = query.trim();
  const patterns = [
    /\b(?:near|around|close to)\s+([a-z0-9][a-z0-9\s.'-]{1,40})/i,
    /\b(?:live|stay|located)\s+(?:in|at|near)\s+([a-z0-9][a-z0-9\s.'-]{1,40})/i,
    /\b(?:in|at)\s+([a-z][a-z0-9\s.'-]{2,35})\b/i,
    /\b([a-z0-9][a-z0-9\s.'-]{2,30})\s+(?:area|locality|side)\b/i,
  ];

  for (const re of patterns) {
    const m = q.match(re);
    if (m?.[1]) {
      const phrase = m[1]
        .replace(/\b(bangalore|bengaluru|ka|karnataka)\b/gi, "")
        .replace(/\b(salon|salons|spa|budget|please|suggest|recommend|find)\b/gi, "")
        .trim();
      if (phrase.length >= 3 && isKnownLocationPhrase(phrase)) return phrase;
    }
  }

  const lower = q.toLowerCase();
  for (const key of Object.keys(LOCALITY_TO_PARTNERS)) {
    if (lower.includes(key)) return key;
  }
  for (const area of PARTNER_AREAS) {
    if (lower.includes(area.toLowerCase())) return area;
  }

  return null;
}

export function resolvePartnerAreas(locationPhrase: string): string[] {
  const norm = locationPhrase.toLowerCase().trim();
  if (!norm) return [];

  if (LOCALITY_TO_PARTNERS[norm]) return LOCALITY_TO_PARTNERS[norm];

  for (const [key, partners] of Object.entries(LOCALITY_TO_PARTNERS)) {
    if (norm.includes(key) || key.includes(norm)) return partners;
  }

  for (const area of PARTNER_AREAS) {
    if (norm.includes(area.toLowerCase()) || area.toLowerCase().includes(norm)) {
      return [area];
    }
  }

  return [];
}

function scoreSalon(
  salon: SalonDoc,
  locationPhrase: string | null,
  partnerAreas: string[]
): number {
  let score = salon.rating * 10;
  const blob = [
    salon.name,
    salon.area,
    salon.specialty,
    salon.description,
    salon.city,
    ...(salon.tags || []),
  ]
    .join(" ")
    .toLowerCase();

  if (locationPhrase) {
    const loc = locationPhrase.toLowerCase();
    if (blob.includes(loc)) score += 80;
    if (salon.area.toLowerCase().includes(loc)) score += 100;
    if (partnerAreas.includes(salon.area)) score += 120;
    for (const p of partnerAreas) {
      if (salon.area === p) score += 40;
    }
  }

  return score;
}

export type LocationSearchResult = {
  salons: SalonDoc[];
  locationPhrase: string | null;
  partnerAreas: string[];
  exactMatch: boolean;
};

export function searchSalonsByLocation(
  allSalons: SalonDoc[],
  options: {
    query: string;
    locationPhrase?: string | null;
    maxPrice?: number;
    service?: string;
    limit?: number;
  }
): LocationSearchResult {
  const locationPhrase =
    options.locationPhrase ?? extractLocationPhrase(options.query);
  const partnerAreas = locationPhrase
    ? resolvePartnerAreas(locationPhrase)
    : [];

  let pool = [...allSalons];

  if (options.service) {
    const svc = options.service.toLowerCase();
    const byService = pool.filter((s) =>
      s.services.some(
        (x) =>
          x.name.toLowerCase().includes(svc) ||
          x.category.toLowerCase().includes(svc) ||
          s.specialty.toLowerCase().includes(svc)
      )
    );
    if (byService.length) pool = byService;
  }

  if (options.maxPrice) {
    const byPrice = pool.filter((s) =>
      s.services.some((svc) => svc.price <= options.maxPrice!)
    );
    if (byPrice.length) pool = byPrice;
    else {
      pool = pool.sort(
        (a, b) =>
          Math.min(...a.services.map((x) => x.price)) -
          Math.min(...b.services.map((x) => x.price))
      );
    }
  }

  const scored = pool
    .map((salon) => ({
      salon,
      score: scoreSalon(salon, locationPhrase, partnerAreas),
    }))
    .sort((a, b) => b.score - a.score);

  let exactMatch = false;
  let ranked: SalonDoc[];

  if (locationPhrase && partnerAreas.length) {
    const inArea = scored.filter((x) => partnerAreas.includes(x.salon.area));
    if (inArea.length) {
      ranked = inArea.map((x) => x.salon);
      exactMatch = true;
    } else {
      ranked = scored.map((x) => x.salon);
      exactMatch = false;
    }
  } else if (locationPhrase) {
    const direct = scored.filter(
      (x) =>
        x.salon.area.toLowerCase().includes(locationPhrase.toLowerCase()) ||
        locationPhrase.toLowerCase().includes(x.salon.area.toLowerCase())
    );
    ranked = (direct.length ? direct : scored).map((x) => x.salon);
    exactMatch = direct.length > 0;
  } else {
    ranked = scored.map((x) => x.salon);
  }

  const limit = options.limit ?? 4;
  return {
    salons: ranked.slice(0, limit),
    locationPhrase,
    partnerAreas,
    exactMatch,
  };
}

export function buildLocationResponse(
  result: LocationSearchResult,
  count: number,
  maxPrice?: number
): string {
  const loc = result.locationPhrase;
  const budget = maxPrice
    ? ` within ₹${maxPrice.toLocaleString("en-IN")}`
    : "";

  if (!loc) {
    return `Here are ${count} top-rated premium lounges in Bangalore${budget} — tap a card to book.`;
  }

  if (count === 0) {
    return `No exact partner in "${loc}" yet — browse all Bangalore lounges below.`;
  }

  if (result.exactMatch) {
    return `Found ${count} partner lounge${count === 1 ? "" : "s"} serving ${loc}${budget}. Tap a card to book.`;
  }

  const nearest =
    result.partnerAreas.length > 0
      ? result.partnerAreas.join(", ")
      : "central Bangalore";

  // Check if it's a known city or area outside Bangalore
  const isOutSideBangalore = ["pune", "mumbai", "delhi", "chennai", "hyderabad", "kolkata", "gurgaon", "noida"].some(city => loc.toLowerCase().includes(city));

  if (isOutSideBangalore) {
    return `Glamora currently curates lounges exclusively in Bangalore. While we haven't reached ${loc} yet, here are our top premium partners in Bangalore.`;
  }

  return `No studio directly in "${loc}" — showing ${count} closest premium partners near ${nearest}${budget}.`;
}
