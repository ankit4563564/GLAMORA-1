import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Salon } from "@/models/Salon";
import { generateBookingId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const bookings = await Booking.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return NextResponse.json({ bookings });
  } catch {
    return NextResponse.json({ bookings: [] });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const body = await req.json();
  const bookingId = generateBookingId();
  
  try {
    await connectDB();
    
    // Verify salon and price
    const salon = await Salon.findById(body.salonId);
    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }
    
    const realService = (salon.services as any[]).find((s: any) => s.name === body.service.name);
    if (!realService) {
      return NextResponse.json({ error: "Service not found" }, { status: 400 });
    }

    const doc = {
      userId,
      salonId: body.salonId,
      salonName: salon.name,
      service: {
        name: realService.name,
        price: realService.price,
        duration: realService.duration
      },
      date: new Date(body.date),
      timeSlot: body.timeSlot,
      status: "confirmed" as const,
      bookingId,
      paymentMode: "pay_at_salon",
    };

    const booking = await Booking.create(doc);
    return NextResponse.json({ booking, bookingId });
  } catch (err) {
    console.error("Booking error:", err);
    // Demo fallback if DB fails
    const fallbackDoc = {
      userId,
      salonId: body.salonId,
      salonName: body.salonName || "Demo Salon",
      service: body.service,
      date: new Date(body.date),
      timeSlot: body.timeSlot,
      status: "confirmed" as const,
      bookingId,
      paymentMode: "pay_at_salon",
    };
    return NextResponse.json({
      booking: { ...fallbackDoc, _id: "demo" },
      bookingId,
      isDemo: true
    });
  }
}
