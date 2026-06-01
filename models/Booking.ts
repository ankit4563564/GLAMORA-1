import mongoose, { Schema, models, model } from "mongoose";

const ServiceEmbed = new Schema(
  {
    name: String,
    price: Number,
    duration: Number,
  },
  { _id: false }
);

const BookingSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    salonId: { type: Schema.Types.ObjectId, ref: "Salon", required: true },
    salonName: String,
    service: ServiceEmbed,
    date: Date,
    timeSlot: String,
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "completed"],
      default: "confirmed",
    },
    bookingId: { type: String, unique: true },
    paymentMode: { type: String, default: "pay_at_salon" },
  },
  { timestamps: true }
);

export const Booking = models.Booking || model("Booking", BookingSchema);
