// lib/hairstyles.ts
// Curated list of hairstyles with metadata for matching against face shape and hair type.

export interface Hairstyle {
  id: string;
  name: string;
  // Possible values: "Oval", "Round", "Heart", "Square", "Diamond", "Long"
  suitableFaceShapes: string[];
  // Possible values: "Straight", "Wavy", "Curly", "Coily"
  suitableHairTypes: string[];
  // Reference image (Unsplash ID)
  unsplashPhotoId: string;
}

export const HAIRSTYLES: readonly Hairstyle[] = [
  {
    id: "1",
    name: "Textured Fringe",
    suitableFaceShapes: ["Oval", "Heart", "Long"],
    suitableHairTypes: ["Wavy", "Straight"],
    unsplashPhotoId: "photo-1560066984-138dadb4c035",
  },
  {
    id: "2",
    name: "Fade with Messy Top",
    suitableFaceShapes: ["Oval", "Square", "Round"],
    suitableHairTypes: ["Coily", "Curly", "Wavy"],
    unsplashPhotoId: "photo-1522337360788-8b13dee7a37e",
  },
  {
    id: "3",
    name: "Layered Bob",
    suitableFaceShapes: ["Round", "Oval", "Heart"],
    suitableHairTypes: ["Straight", "Wavy"],
    unsplashPhotoId: "photo-1516975080664-ed2fc6a32983",
  },
  {
    id: "4",
    name: "Pixie Cut",
    suitableFaceShapes: ["Heart", "Oval", "Square"],
    suitableHairTypes: ["Fine", "Straight", "Wavy"],
    unsplashPhotoId: "photo-1503951914875-452162b0f3f1",
  },
  {
    id: "5",
    name: "Classic Quiff",
    suitableFaceShapes: ["Oval", "Square", "Round"],
    suitableHairTypes: ["Straight", "Wavy"],
    unsplashPhotoId: "photo-1622286342621-4bd786c2447c",
  },
  {
    id: "6",
    name: "Beach Waves",
    suitableFaceShapes: ["Oval", "Heart", "Square"],
    suitableHairTypes: ["Wavy", "Curly"],
    unsplashPhotoId: "photo-1521590832167-7bcbfaa6381f",
  },
  {
    id: "7",
    name: "Buzz Cut",
    suitableFaceShapes: ["Oval", "Square"],
    suitableHairTypes: ["Straight", "Wavy", "Curly", "Coily"],
    unsplashPhotoId: "photo-1621605815191-6b01514a29f0",
  },
  {
    id: "8",
    name: "Curtain Bangs",
    suitableFaceShapes: ["Oval", "Round", "Heart", "Long"],
    suitableHairTypes: ["Straight", "Wavy"],
    unsplashPhotoId: "photo-1633681923016-1962d3648a3a",
  },
] as const;

export function hairstyleImageUrl(photoId: string): string {
  const id = photoId.startsWith("photo-") ? photoId : `photo-${photoId}`;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`;
}
