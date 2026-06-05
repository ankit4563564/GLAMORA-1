import { Metadata } from "next";
import { getSalonById } from "@/lib/salons";
import SalonClient from "./salon-client";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const salon = await getSalonById(params.id);
  if (!salon) return { title: "Studio Not Found" };

  return {
    title: `${salon.name} | ${salon.area}`,
    description: `Book an appointment at ${salon.name} in ${salon.area}, Bangalore. ${salon.specialty} specialist.`,
    openGraph: {
      title: salon.name,
      description: salon.specialty,
      images: salon.images,
    },
  };
}

export default async function Page({ params }: { params: { id: string } }) {
  const salon = await getSalonById(params.id);
  if (!salon) notFound();

  // Structured Data (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": salon.name,
    "image": salon.images[0],
    "description": salon.description,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": salon.area,
      "addressRegion": "Bangalore",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": salon.coordinates?.lat,
      "longitude": salon.coordinates?.lng
    },
    "url": `https://glamora-bangalore.vercel.app/salons/${salon._id}`,
    "telephone": "+918000000000",
    "priceRange": salon.priceRange,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": salon.rating,
      "reviewCount": salon.reviewCount
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SalonClient initialSalon={salon as any} />
    </>
  );
}
