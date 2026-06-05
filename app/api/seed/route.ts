import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Salon } from "@/models/Salon";
import { SEED_SALONS } from "@/lib/seed-data";
import { invalidateSalonCache } from "@/lib/salon-cache";

export const dynamic = "force-dynamic";

/** GET /api/seed — idempotent seed. Add ?force=1 to refresh salon data/images. */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "1";
    const secret = searchParams.get("secret");

    // Strictly require secret for any operation that can wipe data
    if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
      console.warn("[SEED] Unauthorized attempt to access seed endpoint");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const count = await Salon.countDocuments();
    
    // Safety check: if already seeded and not forced, do nothing
    if (count >= 10 && !force) {
      return NextResponse.json({ message: "Already seeded", count });
    }

    // In production, we should be extremely careful with deleteMany
    if (process.env.NODE_ENV === "production" && !force) {
       return NextResponse.json({ error: "Cannot re-seed in production without force flag" }, { status: 403 });
    }

    await Salon.deleteMany({});
    await Salon.insertMany(SEED_SALONS);
    invalidateSalonCache();
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
