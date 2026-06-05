import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateBookingId(): string {
  // Use 3 bytes of random data for 16.7 million possible combinations,
  // then convert to hex and take first 6 chars for a clean ID.
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `GM-${random}`;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
