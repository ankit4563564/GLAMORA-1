import { NextRequest, NextResponse } from "next/server";
import { getSalons } from "@/lib/salons";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const salons = await getSalons({
    area: searchParams.get("area") || undefined,
    category: searchParams.get("category") || undefined,
    minRating: searchParams.get("minRating")
      ? parseFloat(searchParams.get("minRating")!)
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? parseInt(searchParams.get("maxPrice")!, 10)
      : undefined,
    search: searchParams.get("search") || undefined,
  });
  return NextResponse.json({ salons });
}
