"use client";

import { useEffect, useState } from "react";
import { SalonImage } from "@/components/salon-image";
import { resolveSalonImages } from "@/lib/salon-images";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Star } from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SEED_SALONS, SEED_REVIEWS } from "@/lib/seed-data";
import { formatINR } from "@/lib/utils";

type Salon = (typeof SEED_SALONS)[0] & {
  _id: string;
  services: { name: string; price: number; duration: number; category: string }[];
  sentimentSummary: {
    overall: string;
    topKeywords: string[];
    topBookedService: string;
    peakHours: { hour: string; bookings: number }[];
  };
};

export default function SalonDetailPage({ params }: { params: { id: string } }) {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [tab, setTab] = useState("overview");
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idx = params.id.startsWith("seed-")
      ? parseInt(params.id.replace("seed-", ""), 10)
      : -1;
    if (idx >= 0 && SEED_SALONS[idx]) {
      setSalon({
        ...SEED_SALONS[idx],
        _id: params.id,
        images: resolveSalonImages(SEED_SALONS[idx].images),
      } as Salon);
      setLoading(false);
      return;
    }
    fetch("/api/salons")
      .then((r) => r.json())
      .then((d) => {
        const found = d.salons?.find((s: Salon) => s._id === params.id);
        setSalon(found || null);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!salon?.images.length) return;
    const t = setInterval(
      () => setSlide((s) => (s + 1) % salon.images.length),
      4000
    );
    return () => clearInterval(t);
  }, [salon]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-10">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-12 w-1/2" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-cream-muted">Studio not found.</p>
        <Button className="mt-4" asChild>
          <Link href="/salons">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  const categories = Array.from(
    new Set(salon.services.map((s) => s.category))
  );

  return (
    <PageTransition>
      <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-6">
        <div className="relative h-72 overflow-hidden rounded-2xl md:h-96">
          {salon.images.map((img, i) => (
            <SalonImage
              key={`${img}-${i}`}
              src={img}
              alt={salon.name}
              fill
              className={`object-cover transition-opacity duration-700 ${
                i === slide ? "opacity-100" : "opacity-0"
              }`}
              priority={i === 0}
            />
          ))}
          <div className="absolute bottom-4 left-4 rounded-lg bg-bg-primary/80 px-4 py-2 backdrop-blur">
            <p className="text-xs text-cream-muted">{salon.openHours}</p>
            <p className="font-mono text-sm text-gold">{salon.priceRange}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-cream md:text-4xl">
              {salon.name}
            </h1>
            <p className="text-cream-muted">
              {salon.area}, Bangalore · {salon.specialty}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-gold text-gold" />
            <span className="font-mono text-lg text-cream">{salon.rating}</span>
            <span className="text-sm text-cream-muted">
              ({salon.reviewCount} reviews)
            </span>
          </div>
        </div>

        <div className="mt-8 flex gap-4 border-b border-border">
          {["overview", "services", "reviews", "insights"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`pb-3 text-sm capitalize ${
                tab === t
                  ? "border-b-2 border-amber-500 text-amber-400"
                  : "text-cream-muted"
              }`}
            >
              {t === "insights" ? "AI Insights" : t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <p className="max-w-3xl text-cream-muted">{salon.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {salon.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
            <div className="mt-8 flex h-48 items-center justify-center rounded-2xl glass-card text-cream-muted">
              Map — {salon.area}, Bangalore
            </div>
          </motion.div>
        )}

        {tab === "services" && (
          <div className="mt-6 space-y-6">
            {categories.map((cat) => (
              <div key={cat}>
                <h3 className="font-display text-lg text-cream">{cat}</h3>
                <div className="mt-3 space-y-2">
                  {salon.services
                    .filter((s) => s.category === cat)
                    .map((svc) => (
                      <div
                        key={svc.name}
                        className="flex items-center justify-between rounded-xl glass-card p-4"
                      >
                        <div>
                          <p className="text-cream">{svc.name}</p>
                          <p className="font-mono text-xs text-cream-muted">
                            {svc.duration} mins · {formatINR(svc.price)}
                          </p>
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/book/${salon._id}`}>Book This</Link>
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "reviews" && (
          <div className="mt-6 space-y-4">
            <Badge>{salon.sentimentSummary.overall} — AI Verified</Badge>
            {SEED_REVIEWS.map((r) => (
              <div
                key={r.name}
                className="rounded-xl glass-card p-4"
              >
                <div className="flex justify-between">
                  <p className="font-medium text-cream">{r.name}</p>
                  <p className="text-xs text-cream-muted">{r.date}</p>
                </div>
                <p className="mt-2 text-sm text-cream-muted">{r.text}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "insights" && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl glass-card p-5">
              <h3 className="text-sm text-gold">Top Positive Keywords</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {salon.sentimentSummary.topKeywords.map((k) => (
                  <Badge key={k}>{k}</Badge>
                ))}
              </div>
              <p className="mt-4 text-sm text-cream-muted">
                Top-Booked:{" "}
                <span className="text-cream">
                  {salon.sentimentSummary.topBookedService}
                </span>
              </p>
            </div>
            <div className="h-64 rounded-2xl glass-card p-4">
              <h3 className="mb-2 text-sm text-gold">Peak Hours</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={salon.sentimentSummary.peakHours}>
                  <XAxis dataKey="hour" stroke="#9B9188" fontSize={12} />
                  <YAxis stroke="#9B9188" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "#16161A",
                      border: "1px solid #2A2826",
                    }}
                  />
                  <Bar dataKey="bookings" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-border bg-bg-primary/95 px-4 py-3 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-sm text-cream-muted">Secure Appointment</p>
          <Button asChild>
            <Link href={`/book/${salon._id}`}>Book Now</Link>
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
