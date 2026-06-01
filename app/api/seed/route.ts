import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Salon } from "@/models/Salon";
import { SEED_SALONS } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

/** GET /api/seed — idempotent seed for Vercel first deploy */
export async function GET() {
  try {
    await connectDB();
    const count = await Salon.countDocuments();
    if (count >= 10) {
      return NextResponse.json({ message: "Already seeded", count });
    }
    await Salon.deleteMany({});
    await Salon.insertMany(SEED_SALONS);
    return NextResponse.json({
      message: "Seeded successfully",
      count: SEED_SALONS.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e) },
      { status: 500 }
    );
  }
}
