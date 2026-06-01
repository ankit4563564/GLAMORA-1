"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { PageTransition } from "@/components/page-transition";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/utils";

type Booking = {
  bookingId: string;
  salonName: string;
  service: { name: string; price: number };
  date: string;
  timeSlot: string;
  status: string;
};

export default function ProfilePage() {
  const { user } = useUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl text-cream">Profile</h1>
        <p className="mt-2 text-cream-muted">
          {user?.fullName || user?.primaryEmailAddress?.emailAddress}
        </p>

        <h2 className="mt-10 font-display text-xl text-cream">Your Bookings</h2>
        <div className="mt-4 space-y-3">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          {!loading && bookings.length === 0 && (
            <p className="text-cream-muted">No bookings yet. Explore the marketplace.</p>
          )}
          {bookings.map((b) => (
            <div
              key={b.bookingId}
              className="glass-card p-4"
            >
              <p className="font-mono text-sm text-gold">{b.bookingId}</p>
              <p className="font-medium text-cream">{b.salonName}</p>
              <p className="text-sm text-cream-muted">
                {b.service?.name} · {formatINR(b.service?.price || 0)}
              </p>
              <p className="text-xs text-cream-muted">
                {new Date(b.date).toLocaleDateString("en-IN")} · {b.timeSlot} ·{" "}
                {b.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
