import { Metadata } from "next";
import SalonsPageClient from "./salons-client";
import { getSalons } from "@/lib/salons";

export const metadata: Metadata = {
  title: "Grooming Marketplace | Glamora Bangalore",
  description: "Browse and book the finest salons, spas, and grooming lounges across Bangalore.",
};

export default async function SalonsPage() {
  const salons = await getSalons();
  
  // Enhance data with demo flags (matching client-side logic for consistency)
  const enhanced = (salons || []).map((s, i) => ({
    ...s,
    isVerified: i % 3 === 0,
    isTrending: i === 1 || i === 4,
    popularity: 100 - i * 5,
  }));

  return <SalonsPageClient initialSalons={enhanced as any} />;
}
