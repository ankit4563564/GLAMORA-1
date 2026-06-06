import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Salon } from "@/models/Salon";
import { z } from "zod";

const salonSchema = z.object({
  name: z.string().min(1),
  area: z.string().min(1),
  city: z.string().default("Bangalore"),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().default(0),
  specialty: z.string(),
  description: z.string(),
  services: z.array(z.object({
    name: z.string(),
    price: z.number(),
    duration: z.number(),
    category: z.string(),
  })),
  images: z.array(z.string()),
  openHours: z.string(),
  availableSlots: z.array(z.string()),
  priceRange: z.string(),
  tags: z.array(z.string()),
  ownerName: z.string(),
  ownerEmail: z.string(),
  coordinates: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
});

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    
    // Get salons owned by this user (using ownerEmail for demo)
    const salons = await Salon.find({ ownerEmail: "ankitask46@gmail.com" });
    
    return NextResponse.json({ salons });
  } catch (err) {
    console.error("Failed to fetch owner salons:", err);
    return NextResponse.json({ error: "Failed to fetch salons" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = salonSchema.parse(body);

    await connectDB();
    
    const salon = await Salon.findOneAndUpdate(
      { ownerEmail: "ankitask46@gmail.com" },
      validated,
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, salon });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: err.issues }, { status: 400 });
    }
    console.error("Failed to update salon:", err);
    return NextResponse.json({ error: "Failed to update salon" }, { status: 500 });
  }
}
