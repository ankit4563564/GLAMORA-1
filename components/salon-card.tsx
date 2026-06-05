"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Heart, Clock, MapPin, CheckCircle, Flame } from "lucide-react";
import { SalonImage } from "@/components/salon-image";
import { resolveSalonImage } from "@/lib/salon-images";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export type SalonCardData = {
  _id: string;
  name: string;
  area: string;
  rating: number;
  reviewCount: number;
  specialty: string;
  priceRange: string;
  images: string[];
  openHours: string;
  isVerified?: boolean;
  isTrending?: boolean;
  coordinates?: { lat: number; lng: number };
};

export function SalonCard({
  salon,
  index,
  userLocation,
}: {
  salon: SalonCardData;
  index: number;
  userLocation?: { lat: number; lng: number } | null;
}) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [distance, setDistance] = useState<string | null>(null);

  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem("glamora-wishlist") || "[]");
    setIsWishlisted(wishlist.includes(salon._id));
  }, [salon._id]);

  useEffect(() => {
    if (userLocation && salon.coordinates) {
      const R = 6371; // Earth radius in km
      const dLat = (salon.coordinates.lat - userLocation.lat) * (Math.PI / 180);
      const dLng = (salon.coordinates.lng - userLocation.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userLocation.lat * (Math.PI / 180)) *
          Math.cos(salon.coordinates.lat * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;
      setDistance(`${d.toFixed(1)} km away`);
    } else if (userLocation) {
        setDistance("Calculated area-wise");
    } else {
        setDistance("Fetching location...");
    }
  }, [userLocation, salon.coordinates]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wishlist = JSON.parse(localStorage.getItem("glamora-wishlist") || "[]");
    let newWishlist;
    if (isWishlisted) {
      newWishlist = wishlist.filter((id: string) => id !== salon._id);
    } else {
      newWishlist = [...wishlist, salon._id];
    }
    localStorage.setItem("glamora-wishlist", JSON.stringify(newWishlist));
    setIsWishlisted(!isWishlisted);
  };

  const isOpen = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 10 && hour < 20; // 10 AM to 8 PM
  };

  // Mock deterministic match based on ID for demo stability
  const matchPercent = 90 + (parseInt(salon._id.slice(-1), 36) % 10);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1A1C29]/40 backdrop-blur-md transition-all hover:border-violet-500/30 hover:bg-[#1A1C29]/60"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <SalonImage
          src={resolveSalonImage(salon.images?.[0])}
          alt={salon.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Reduced overlay opacity as requested (20%) */}
        <div className="absolute inset-0 bg-black/20 transition-opacity group-hover:opacity-10" />

        {/* AI Match Badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-1.5 rounded-full bg-violet-600/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-md border border-white/20">
            <CheckCircle className="h-3 w-3" />
            {matchPercent}% MATCH
          </div>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={toggleWishlist}
          className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-90"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isWishlisted ? "fill-rose-500 text-rose-500" : "text-white"
            }`}
          />
        </button>

        {/* Status & Trending Tags */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${isOpen() ? "bg-emerald-500/80 text-white" : "bg-white/20 text-cream-muted"} backdrop-blur-sm`}>
                <div className={`h-1.5 w-1.5 rounded-full ${isOpen() ? "bg-white animate-pulse" : "bg-white/40"}`} />
                {isOpen() ? "Open Now" : "Closed"}
            </div>
            {salon.isTrending && (
                <div className="flex items-center gap-1 rounded-full bg-gold/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-black shadow-lg">
                    <Flame className="h-3 w-3" />
                    TRENDING
                </div>
            )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
                <h3 className="truncate font-display text-lg text-white group-hover:text-violet-300 transition-colors">
                    {salon.name}
                </h3>
                {salon.isVerified && (
                    <CheckCircle className="h-4 w-4 shrink-0 text-cyan-400 fill-cyan-400/20" />
                )}
            </div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-cream-muted">
              <MapPin className="h-3 w-3 text-violet-400" />
              {salon.area} • {distance}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 border border-white/5">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            <span className="text-sm font-bold text-white">{salon.rating}</span>
          </div>
        </div>

        <div className="mb-4 space-y-2">
            <p className="text-xs text-cream-muted italic">Next slot: Today 3:00 PM</p>
            <p className="line-clamp-1 text-xs text-cream-muted/80">{salon.specialty}</p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-4">
          <p className="font-mono text-sm font-bold text-violet-300">
            {salon.priceRange.split("–")[0]}
          </p>
          <Button size="sm" className="h-9 rounded-xl px-4 text-xs font-bold uppercase tracking-widest" asChild>
            <Link href={`/salons/${salon._id}`}>Book Now</Link>
          </Button>
        </div>
      </div>
      <Link
        href={`/salons/${salon._id}`}
        className="absolute inset-0 z-[1]"
        aria-label={`View ${salon.name}`}
      />
    </motion.article>
  );
}
