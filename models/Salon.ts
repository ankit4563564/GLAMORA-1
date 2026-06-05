import mongoose, { Schema, models, model } from "mongoose";

const ServiceSchema = new Schema(
  {
    name: String,
    price: Number,
    duration: Number,
    category: String,
  },
  { _id: false }
);

const SentimentSchema = new Schema(
  {
    overall: String,
    score: Number,
    topKeywords: [String],
    topBookedService: String,
    peakHours: [{ hour: String, bookings: Number }],
  },
  { _id: false }
);

const SalonSchema = new Schema(
  {
    name: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, default: "Bangalore" },
    rating: { type: Number, required: true },
    reviewCount: { type: Number, default: 0 },
    specialty: String,
    description: String,
    services: [ServiceSchema],
    images: [String],
    openHours: String,
    availableSlots: [String],
    priceRange: String,
    tags: [String],
    sentimentSummary: SentimentSchema,
    ownerName: String,
    ownerEmail: String,
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  { timestamps: true }
);

// Indexes for high-performance searching and filtering
SalonSchema.index({ area: 1 });
SalonSchema.index({ rating: -1 });
SalonSchema.index({ specialty: 1 });
SalonSchema.index({ name: "text", description: "text", tags: "text" });

export const Salon = models.Salon || model("Salon", SalonSchema);
