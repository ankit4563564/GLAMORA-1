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

export default function SalonDetailPage({ params, initialSalon }: { params: { id: string }, initialSalon?: Salon }) {
  const [mounted, setMounted] = useState(false);
  const [salon, setSalon] = useState<Salon | null>(initialSalon || null);
  const [tab, setTab] = useState("overview");
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(!initialSalon);

  useEffect(() => {
    setMounted(true);
    if (salon) return;
    
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
      .catch(() => setSalon(null))
      .finally(() => setLoading(false));
  }, [params.id, salon]);

  useEffect(() => {
    if (!salon?.images.length) return;
    const t = setInterval(
      () => setSlide((s) => (s + 1) % salon.images.length),
      4000
    );
    return () => clearInterval(t);
  }, [salon]);

  if (!mounted || loading) {
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
          <div className="absolute bottom-4 left-4 rounded-lg bg-[#1A1C29]/80 px-4 py-2 backdrop-blur border border-white/10">
            <p className="text-xs text-cream-muted">{salon.openHours}</p>
            <p className="font-mono text-sm text-gold">{salon.priceRange}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-white md:text-4xl">
              {salon.name}
            </h1>
            <p className="text-cream-muted">
              {salon.area}, Bangalore · {salon.specialty}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-gold text-gold" />
            <span className="font-mono text-lg text-white">{salon.rating}</span>
            <span className="text-sm text-cream-muted">
              ({salon.reviewCount} reviews)
            </span>
          </div>
        </div>

        <div className="mt-8 flex gap-4 border-b border-white/5">
          {["overview", "services", "reviews", "insights"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-bold uppercase tracking-widest transition-all ${
                tab === t
                  ? "border-b-2 border-violet-500 text-violet-400"
                  : "text-cream-muted hover:text-white"
              }`}
            >
              {t === "insights" ? "AI Insights" : t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <p className="max-w-3xl text-cream-muted leading-relaxed">{salon.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {salon.tags.map((t) => (
                <Badge key={t} className="bg-white/5 text-violet-300 border-white/10">{t}</Badge>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "services" && (
          <div className="mt-6 space-y-8">
            {categories.map((cat) => (
              <div key={cat} className="space-y-4">
                <h3 className="font-display text-xl text-white">{cat}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {salon.services
                    .filter((s) => s.category === cat)
                    .map((svc) => (
                      <div
                        key={svc.name}
                        className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-5 group hover:border-violet-500/30 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-white group-hover:text-gold transition-colors">{svc.name}</p>
                          <p className="font-mono text-[10px] text-cream-muted mt-1 uppercase">
                            {svc.duration} mins · {formatINR(svc.price)}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/book/${salon._id}`}>Book</Link>
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "reviews" && (
          <div className="mt-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-600/10 border border-violet-500/20 px-4 py-1 text-[10px] font-bold text-violet-400 uppercase tracking-widest">
              <Star size={10} className="fill-violet-400" />
              {salon.sentimentSummary.overall} — AI Verified
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {SEED_REVIEWS.map((r) => (
                <div
                  key={r.name}
                  className="rounded-2xl border border-white/5 bg-white/5 p-5"
                >
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-white">{r.name}</p>
                    <p className="text-[10px] text-cream-muted uppercase font-mono">{r.date}</p>
                  </div>
                  <p className="mt-3 text-sm text-cream-muted leading-relaxed">&quot;{r.text}&quot;</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "insights" && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-white/5 bg-white/5 p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-violet-300 mb-4">Sentiment Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {salon.sentimentSummary.topKeywords.map((k) => (
                  <Badge key={k} className="bg-white/5 text-cream border-white/10">{k}</Badge>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-xl bg-violet-600/5 border border-violet-500/10">
                <p className="text-xs text-cream-muted uppercase font-bold tracking-tighter">Most Popular Choice</p>
                <p className="text-lg font-display text-white mt-1">
                  {salon.sentimentSummary.topBookedService}
                </p>
              </div>
            </div>
            <div className="h-64 rounded-3xl border border-white/5 bg-white/5 p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gold mb-4">Peak Activity</h3>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={salon.sentimentSummary.peakHours}>
                  <XAxis dataKey="hour" stroke="#9B9188" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{
                      background: "#1A1C29",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      fontSize: "12px"
                    }}
                  />
                  <Bar dataKey="bookings" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-white/10 bg-[#1A1C29]/95 px-4 py-4 backdrop-blur-xl md:bottom-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="hidden sm:block">
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300">Secure Enclave</p>
            <p className="text-sm text-white font-medium">Confirm your ritual at {salon.name}</p>
          </div>
          <Button size="lg" className="w-full sm:w-auto px-10 bg-violet-600 hover:bg-violet-700" asChild>
            <Link href={`/book/${salon._id}`}>Confirm Appointment</Link>
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
