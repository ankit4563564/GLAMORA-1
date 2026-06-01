import { getSalonById } from "@/lib/salons";
import { BookingFlow } from "@/components/booking-flow";
import { PageTransition } from "@/components/page-transition";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: { salonId: string };
}) {
  const salon = await getSalonById(params.salonId);
  if (!salon) notFound();

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link
          href={`/salons/${params.salonId}`}
          className="text-sm text-cream-muted hover:text-gold"
        >
          ← Back to {salon.name}
        </Link>
        <h1 className="mt-4 font-display text-3xl text-cream">Book Appointment</h1>
        <p className="text-cream-muted">
          {salon.name} · {salon.area}
        </p>
        <div className="mt-8">
          <BookingFlow
            salon={{
              _id: salon._id,
              name: salon.name,
              area: salon.area,
              rating: salon.rating,
              priceRange: salon.priceRange,
              specialty: salon.specialty,
              images: salon.images,
              services: salon.services,
              availableSlots: salon.availableSlots,
            }}
          />
        </div>
      </div>
    </PageTransition>
  );
}
