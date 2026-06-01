import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Salon } from "@/models/Salon";
import { SEED_SALONS } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

/** GET /api/seed — idempotent seed. Add ?force=1 to refresh salon data/images. */
export async function GET(req: Request) {
  try {
    await connectDB();
    const force = new URL(req.url).searchParams.get("force") === "1";
    const count = await Salon.countDocuments();
    if (count >= 10 && !force) {
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
