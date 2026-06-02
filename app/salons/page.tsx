import { Metadata } from "next";
import SalonsPageClient from "./salons-client";

export const metadata: Metadata = {
  title: "Grooming Marketplace | Glamora Bangalore",
  description: "Browse and book the finest salons, spas, and grooming lounges across Bangalore.",
};

export default function SalonsPage() {
  return <SalonsPageClient />;
}
