import { NextRequest, NextResponse } from "next/server";
import { getSalons } from "@/lib/salons";
import { seedFallbackSalons } from "@/lib/ensure-seed";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const area = searchParams.get("area");
    const category = searchParams.get("category");
    const minRating = searchParams.get("minRating");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const salons = await getSalons({
      area: area || undefined,
      category: category || undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      search: search || undefined,
    });

    const total = salons.length;
    const paginated = salons.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      salons: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (err) {
    console.error("Failed to fetch salons from DB:", err);
    return NextResponse.json({ 
      salons: seedFallbackSalons().slice(0, 12),
      isDemo: true,
      error: "Database connection failed. Showing demo data."
    });
  }
}
