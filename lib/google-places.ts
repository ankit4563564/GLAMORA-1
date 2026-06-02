/** Server-side Google Places API client */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export type GoogleSalon = {
  place_id: string;
  name: string;
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  formatted_address?: string;
  photos?: { photo_reference: string }[];
  types?: string[];
};

/** Search for salons using Google Places Text Search */
export async function searchGoogleSalons(query: string, location?: string): Promise<GoogleSalon[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("GOOGLE_MAPS_API_KEY is not defined");
    return [];
  }

  const searchTerm = location ? `${query} in ${location}` : query;
  
  // Use a broader search if the query is specific like "skin" or "spa"
  const typeParam = query.toLowerCase().includes("skin") ? "" : "&type=beauty_salon";
  
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    searchTerm
  )}${typeParam}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return (data.results || []).slice(0, 5);
  } catch (error) {
    console.error("Google Places Search Error:", error);
    return [];
  }
}

/** Get detailed info for a specific place */
export async function getGooglePlaceDetails(placeId: string) {
  if (!GOOGLE_MAPS_API_KEY) return null;

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_phone_number,formatted_address,opening_hours,website,photos,reviews&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.result || null;
  } catch (error) {
    console.error("Google Place Details Error:", error);
    return null;
  }
}

/** Convert Google Place photo reference to a usable URL */
export function getGooglePhotoUrl(photoReference: string, maxWidth = 400): string {
  if (!GOOGLE_MAPS_API_KEY) return "";
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
}
