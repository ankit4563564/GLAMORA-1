import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { generateBookingId } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
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
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const bookingId = generateBookingId();
  const doc = {
    userId,
    salonId: body.salonId,
    salonName: body.salonName,
    service: body.service,
    date: new Date(body.date),
    timeSlot: body.timeSlot,
    status: "confirmed" as const,
    bookingId,
    paymentMode: "pay_at_salon",
  };
  try {
    await connectDB();
    const booking = await Booking.create(doc);
    return NextResponse.json({ booking, bookingId });
  } catch {
    return NextResponse.json({
      booking: { ...doc, _id: "demo" },
      bookingId,
    });
  }
}
