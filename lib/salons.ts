import { connectDB } from "./mongodb";
import { Salon } from "@/models/Salon";
import { ensureSalonsSeeded, seedFallbackSalons } from "./ensure-seed";
import { SEED_SALONS } from "./seed-data";
import { resolveSalonImages } from "./salon-images";

export type SalonDoc = (typeof SEED_SALONS)[0] & { 
  _id: string;
  coordinates?: { lat: number; lng: number };
};

function mapSalons(
  salons: Array<Record<string, unknown> & { _id: unknown }>
): SalonDoc[] {
  return salons.map((s) => {
    const row = s as Record<string, unknown> & { images?: string[]; coordinates?: any };
    return {
      ...row,
      _id: String(s._id),
      images: resolveSalonImages(row.images),
      coordinates: row.coordinates
    };
  }) as unknown as SalonDoc[];
}

export async function getSalons(filters?: {
  area?: string;
  category?: string;
  minRating?: number;
  maxPrice?: number;
  search?: string;
}): Promise<SalonDoc[]> {
  const hasFilters = Boolean(
    filters?.area ||
      filters?.category ||
      filters?.minRating ||
      filters?.maxPrice ||
      filters?.search
  );

  try {
    await connectDB();
    await ensureSalonsSeeded();

    const query: Record<string, any> = {};
    if (filters?.area) query.area = new RegExp(filters.area, "i");
    if (filters?.minRating) query.rating = { $gte: filters.minRating };
    
    if ((filters?.category && filters.category !== "All") || filters?.maxPrice) {
      const serviceQuery: Record<string, any> = {};
      if (filters?.category && filters.category !== "All") {
        serviceQuery.category = { $regex: new RegExp(`^${filters.category}$`, "i") };
      }
      if (filters?.maxPrice) {
        serviceQuery.price = { $lte: filters.maxPrice };
      }
      query.services = { $elemMatch: serviceQuery };
    }

    if (filters?.search) {
      const term = filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(term, "i");
      query.$or = [
        { name: re },
        { area: re },
        { specialty: re },
        { description: re },
        { tags: re },
        { city: re },
      ];
    }

    const salons = await Salon.find(query)
      .select(
        "name area city rating reviewCount specialty description services images openHours availableSlots priceRange tags sentimentSummary ownerName ownerEmail coordinates"
      )
      .lean();

    if (salons.length > 0) {
      return mapSalons(salons as Array<Record<string, unknown> & { _id: unknown }>);
    }

    if (!hasFilters) {
      return seedFallbackSalons() as SalonDoc[];
    }

    return mapSalons(salons as Array<Record<string, unknown> & { _id: unknown }>);
  } catch {
    let fallback = seedFallbackSalons() as SalonDoc[];

    if (filters?.area) {
      const re = new RegExp(filters.area, "i");
      fallback = fallback.filter((s) => re.test(s.area));
    }
    if (filters?.minRating) {
      fallback = fallback.filter((s) => s.rating >= filters.minRating!);
    }
    if (filters?.maxPrice) {
      fallback = fallback.filter((s) =>
        s.services.some((svc) => svc.price <= filters.maxPrice!)
      );
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      fallback = fallback.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.area.toLowerCase().includes(q) ||
          s.specialty.toLowerCase().includes(q)
      );
    }

    return fallback.length > 0 ? fallback : (seedFallbackSalons() as SalonDoc[]);
  }
}

export async function getSalonById(id: string): Promise<SalonDoc | null> {
  if (id.startsWith("seed-")) {
    const idx = parseInt(id.replace("seed-", ""), 10);
    const s = SEED_SALONS[idx];
    return s ? ({ ...s, _id: id } as SalonDoc) : null;
  }

  try {
    await connectDB();
    await ensureSalonsSeeded();
    const salon = (await Salon.findById(id).lean()) as SalonDoc | null;
    if (salon) {
      const row = salon as SalonDoc & { images?: string[] };
      return {
        ...row,
        _id: String((salon as { _id: unknown })._id),
        images: resolveSalonImages(row.images),
      };
    }
  } catch {
    /* fallback below */
  }

  const idx = SEED_SALONS.findIndex((s) =>
    s.name.toLowerCase().includes(id.toLowerCase())
  );
  if (idx >= 0) {
    return { ...SEED_SALONS[idx], _id: `seed-${idx}` } as SalonDoc;
  }

  try {
    await connectDB();
    const all = await Salon.find().lean();
    const found = all.find((s) => String(s._id) === id);
    if (found) {
      return { ...(found as object), _id: id } as SalonDoc;
    }
  } catch {
    /* ignore */
  }

  return null;
}
