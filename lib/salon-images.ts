/** Curated Unsplash IDs that load reliably in production. */
const GALLERY = [
  "photo-1560066984-138dadb4c035",
  "photo-1522337360788-8b13dee7a37e",
  "photo-1516975080664-ed2fc6a32983",
  "photo-1503951914875-452162b0f3f1",
  "photo-1622286342621-4bd786c2447c",
  "photo-1521590832167-7bcbfaa6381f",
  "photo-1633681923016-1962d3648a3a",
  "photo-1570172619644-d3b9eb3b0b0b",
  "photo-1616394584738-fc6e612f888b",
  "photo-1512290923902-8a9f81dc236f",
  "photo-1519741497674-611481863552",
  "photo-1487412948497-84dc97e43b0b",
  "photo-1544161515-4ab6ce6db874",
  "photo-1540555700478-4be289fbecef",
  "photo-1515377905703-c4788e51af09",
  "photo-1604654894610-df63bc536371",
] as const;

const BROKEN_URL = /0b6b6b6b6b6b|example\.com|placeholder/i;

export const DEFAULT_SALON_IMAGE = unsplashUrl(GALLERY[0]);

export function unsplashUrl(photoId: string): string {
  const id = photoId.startsWith("photo-") ? photoId : `photo-${photoId}`;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
}

export function resolveSalonImage(
  url?: string | null,
  fallbackIndex = 0
): string {
  if (
    url &&
    url.startsWith("https://") &&
    !BROKEN_URL.test(url)
  ) {
    return url;
  }
  return unsplashUrl(GALLERY[fallbackIndex % GALLERY.length]);
}

export function resolveSalonImages(images?: string[] | null): string[] {
  const cleaned = (images ?? []).filter(
    (u): u is string =>
      typeof u === "string" &&
      u.startsWith("https://") &&
      !BROKEN_URL.test(u)
  );

  if (cleaned.length === 0) {
    return [DEFAULT_SALON_IMAGE];
  }

  return cleaned.map((url, i) => resolveSalonImage(url, i));
}
