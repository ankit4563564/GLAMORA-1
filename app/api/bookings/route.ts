import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Salon } from "@/models/Salon";
import { generateBookingId, stripHtml } from "@/lib/utils";
import { z } from "zod";

const bookingSchema = z.object({
  salonId: z.string(),
  salonName: z.string(),
  service: z.object({
    name: z.string(),
    price: z.number(),
    duration: z.number(),
  }),
  date: z.string(),
  timeSlot: z.string(),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Booking request body:", body);
    const validated = bookingSchema.parse(body);

    await connectDB();

    // Verify salon exists
    const salon = await Salon.findById(validated.salonId);
    if (!salon) {
      console.error("Salon not found:", validated.salonId);
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    // 1. Conflict Check
    const existing = await Booking.findOne({
      salonId: validated.salonId,
      date: new Date(validated.date),
      timeSlot: validated.timeSlot,
      status: "confirmed",
    });

    if (existing) {
      return NextResponse.json(
        { error: "This slot was just taken. Please choose another time." },
        { status: 409 }
      );
    }

    // 2. Create Booking
    const bookingId = generateBookingId();
    const booking = await Booking.create({
      userId,
      ...validated,
      salonName: stripHtml(validated.salonName),
      date: new Date(validated.date),
      status: "confirmed",
      bookingId,
      paymentMode: "pay_at_salon",
    });

    console.log("Booking created successfully:", bookingId);
    return NextResponse.json({
      success: true,
      bookingId: booking.bookingId,
      id: booking._id
    });

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      console.error("Validation error:", err.issues);
      return NextResponse.json({ error: "Invalid request data", details: err.issues }, { status: 400 });
    }
    console.error("Booking failed:", err);
    return NextResponse.json({ error: "Appointment confirmation failed." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ bookings: [] });

    await connectDB();
    const bookings = await Booking.find({ userId }).sort({ date: -1, timeSlot: -1 });
    return NextResponse.json({ bookings });
  } catch (err) {
    return NextResponse.json({ bookings: [] });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, status, date, timeSlot } = body;

    await connectDB();
    const booking = await Booking.findOne({ _id: id, userId });
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (status) booking.status = status;
    if (date) booking.date = new Date(date);
    if (timeSlot) booking.timeSlot = timeSlot;

    await booking.save();
    return NextResponse.json({ success: true, booking });
  } catch (err) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
