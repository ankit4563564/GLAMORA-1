import { connectDB } from "./mongodb";
import { Salon } from "@/models/Salon";
import { SEED_SALONS } from "./seed-data";
import { resolveSalonImages } from "./salon-images";

let seedPromise: Promise<number> | null = null;

export function seedFallbackSalons() {
  return SEED_SALONS.map((s, i) => ({
    ...s,
    _id: `seed-${i}`,
    images: resolveSalonImages(s.images),
  }));
}

/** Insert seed salons if collection is empty (idempotent). */
export async function ensureSalonsSeeded(): Promise<number> {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    try {
      await connectDB();
      const count = await Salon.countDocuments();
      if (count >= 1) return count;
      await Salon.insertMany(SEED_SALONS);
      return SEED_SALONS.length;
    } catch {
      return 0;
    } finally {
      seedPromise = null;
    }
  })();

  return seedPromise;
}
