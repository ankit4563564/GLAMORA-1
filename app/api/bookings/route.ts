import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Salon } from "@/models/Salon";
import { generateBookingId } from "@/lib/utils";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

const BookingSchema = z.object({
  salonId: z.string(),
  salonName: z.string().optional(),
  service: z.object({
    name: z.string(),
    price: z.number(),
    duration: z.number(),
  }),
  date: z.string(),
  timeSlot: z.string(),
});

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
  
  const rawBody = await req.json().catch(() => ({}));
  const validation = BookingSchema.safeParse(rawBody);
  
  if (!validation.success) {
    return NextResponse.json({ error: "Invalid booking data", details: validation.error.format() }, { status: 400 });
  }

  const body = validation.data;
  const bookingId = generateBookingId();
  
  try {
    await connectDB();
    
    // Verify salon and price
    const salon = await Salon.findById(body.salonId);
    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }
    
    // Slot locking check
    const existingBooking = await Booking.findOne({
      salonId: body.salonId,
      date: new Date(body.date),
      timeSlot: body.timeSlot,
      status: "confirmed"
    }).maxTimeMS(5000); // 5s query limit

    if (existingBooking) {
      return NextResponse.json({ error: "This slot was just taken. Please choose another time." }, { status: 409 });
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
  } catch (err: any) {
    console.error("Booking error:", err);
    if (err.code === 11000) {
      return NextResponse.json({ error: "This slot was just taken. Please choose another time." }, { status: 409 });
    }
    return NextResponse.json({ error: "Appointment confirmation failed. Please try again." }, { status: 500 });
  }
}
