import { getSalons, type SalonDoc } from "@/lib/salons";

type SalonFilters = Parameters<typeof getSalons>[0];

let cache: { data: SalonDoc[]; at: number } | null = null;
const TTL_MS = 60_000;

/** Cached salon list for agent (avoids Mongo round-trip on every message). */
export async function getSalonsCached(
  filters?: SalonFilters
): Promise<SalonDoc[]> {
  const hasFilters = Boolean(
    filters?.area ||
      filters?.category ||
      filters?.minRating ||
      filters?.maxPrice ||
      filters?.search
  );

  if (
    !hasFilters &&
    cache &&
    Date.now() - cache.at < TTL_MS
  ) {
    return cache.data;
  }

  const data = await getSalons(filters);
  if (!hasFilters) {
    cache = { data, at: Date.now() };
  }
  return data;
}

export function invalidateSalonCache() {
  cache = null;
}
