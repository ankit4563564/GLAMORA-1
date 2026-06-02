"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { PageTransition } from "@/components/page-transition";
import { SalonFilters, type FilterState } from "@/components/salon-filters";
import { SalonCard, type SalonCardData } from "@/components/salon-card";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerContainer } from "@/lib/motion";
import { LayoutGrid, Map as MapIcon } from "lucide-react";
import type { Metadata } from "next";

const SalonMap = dynamic(() => import("@/components/salon-map"), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-[#1A1C29]/50 rounded-2xl animate-pulse" />
});

const defaultFilters: FilterState = {
  search: "",
  category: "All",
  minRating: 4,
  maxPrice: 15000,
  areas: [],
};

type SortKey = "relevance" | "rating" | "price" | "distance";
type ViewMode = "grid" | "map";

export default function SalonsPageClient() {
  const [salons, setSalons] = useState<SalonCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetch("/api/salons")
      .then((r) => r.json())
      .then((d) => setSalons(d.salons || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (sort === "distance" && !userLocation) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          },
          (err) => {
            console.error("Location error:", err);
            setSort("relevance");
            alert("Please enable location access for distance sorting.");
          }
        );
      } else {
        setSort("relevance");
        alert("Geolocation is not supported by your browser.");
      }
    }
  }, [sort, userLocation]);

  const filtered = useMemo(() => {
    let list = [...salons];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.area.toLowerCase().includes(q)
      );
    }
    if (filters.category !== "All") {
      list = list.filter((s) =>
        (s as SalonCardData & { services?: { category: string }[] }).services?.some(
          (svc) =>
            svc.category === filters.category ||
            (filters.category === "Men's" && svc.category === "Men's")
        )
      );
    }
    list = list.filter((s) => s.rating >= filters.minRating);
    if (filters.areas.length) {
      list = list.filter((s) => filters.areas.includes(s.area));
    }
    
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    if (sort === "price") {
      list.sort((a, b) => {
        const pa = parseInt(a.priceRange.replace(/\D/g, "").slice(0, 4)) || 0;
        const pb = parseInt(b.priceRange.replace(/\D/g, "").slice(0, 4)) || 0;
        return pa - pb;
      });
    }
    if (sort === "distance" && userLocation) {
      list.sort((a, b) => {
        const distA = Math.sqrt(
          Math.pow((a.coordinates?.lat || 0) - userLocation.lat, 2) +
          Math.pow((a.coordinates?.lng || 0) - userLocation.lng, 2)
        );
        const distB = Math.sqrt(
          Math.pow((b.coordinates?.lat || 0) - userLocation.lat, 2) +
          Math.pow((b.coordinates?.lng || 0) - userLocation.lng, 2)
        );
        return distA - distB;
      });
    }
    return list;
  }, [salons, filters, sort, userLocation]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-metallic">Marketplace</h1>
            <p className="mt-2 text-cream-muted">
              Premium grooming lounges across Bangalore
            </p>
          </div>

          <div className="flex bg-[#1A1C29]/80 rounded-lg p-1 border border-white/5 self-start">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "grid" 
                ? "bg-violet-600 text-white shadow-lg" 
                : "text-cream-muted hover:text-cream"
              }`}
            >
              <LayoutGrid size={14} />
              Grid
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === "map" 
                ? "bg-violet-600 text-white shadow-lg" 
                : "text-cream-muted hover:text-cream"
              }`}
            >
              <MapIcon size={14} />
              Map
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-2 text-sm">
          {(["relevance", "rating", "price", "distance"] as SortKey[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={
                sort === s
                  ? "font-medium text-amber-400 capitalize"
                  : "text-cream-muted capitalize hover:text-cream"
              }
            >
              {s === "price" ? "Price (Low–High)" : s}
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          <SalonFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(defaultFilters)}
          />

          <div className="flex-1">
            {viewMode === "grid" ? (
              <motion.div
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
                variants={staggerContainer}
                initial="hidden"
                animate={loading ? "hidden" : "show"}
              >
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
                    ))
                  : filtered.map((s, i) => <SalonCard key={s._id} salon={s} index={i} />)}
              </motion.div>
            ) : (
              <div className="h-[min(650px,calc(100vh-250px))] min-h-[400px] w-full sticky top-24">
                {loading ? (
                   <Skeleton className="h-full w-full rounded-2xl" />
                ) : (
                  <SalonMap 
                    salons={filtered as any} 
                    center={filtered.length > 0 && (filtered[0] as any).coordinates ? [(filtered[0] as any).coordinates.lat, (filtered[0] as any).coordinates.lng] : undefined}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
