import mongoose, { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    name: String,
    email: String,
    role: { type: String, enum: ["user", "owner"], default: "user" },
    ownedSalonId: { type: Schema.Types.ObjectId, ref: "Salon" },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
