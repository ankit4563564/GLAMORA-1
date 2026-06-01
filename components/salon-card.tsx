"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface SalonCardData {
  _id: string;
  name: string;
  area: string;
  rating: number;
  priceRange: string;
  specialty: string;
  images: string[];
}

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80";

export function SalonCard({
  salon,
  index = 0,
}: {
  salon: SalonCardData;
  index?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const src = salon.images?.[0] || PLACEHOLDER;

  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#1A1C29]/40 shadow-glass transition-[border-color,box-shadow] duration-300 hover:border-amber-500/50 hover:shadow-gold-glow"
    >
      <div
        className={cn(
          "absolute inset-0 bg-[#12131C] transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100"
        )}
        aria-hidden
      />
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl opacity-40"
        style={{ backgroundImage: `url(${src})` }}
        aria-hidden
      />
      <Image
        src={src}
        alt={salon.name}
        fill
        className={cn(
          "object-cover transition-transform duration-700 group-hover:scale-110",
          loaded ? "opacity-100" : "opacity-0"
        )}
        sizes="(max-width: 768px) 100vw, 33vw"
        onLoad={() => setLoaded(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-[#0B0C10]/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <Badge className="mb-2">{salon.specialty}</Badge>
        <h3 className="font-display text-xl text-cream">{salon.name}</h3>
        <p className="text-sm text-cream-muted">{salon.area}, Bangalore</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="flex items-center gap-1 text-amber-400">
            <Star className="h-4 w-4 fill-amber-400" />
            <span className="font-mono text-sm">{salon.rating}</span>
          </span>
          <span className="font-mono text-xs text-cream-muted">
            {salon.priceRange}
          </span>
        </div>
        <Button className="relative z-10 mt-4 w-full" size="sm" asChild>
          <Link href={`/book/${salon._id}`}>Book Appointment</Link>
        </Button>
      </div>
      <Link
        href={`/salons/${salon._id}`}
        className="absolute inset-0 z-[1]"
        aria-label={`View ${salon.name}`}
      />
    </motion.article>
  );
}
