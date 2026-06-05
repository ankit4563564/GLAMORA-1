"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { PageTransition } from "@/components/page-transition";
import { SalonFilters, type FilterState } from "@/components/salon-filters";
import { SalonCard, type SalonCardData } from "@/components/salon-card";
import { SalonCardSkeleton } from "@/components/salon-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { LayoutGrid, Map as MapIcon, Sparkles, TrendingUp, Search, X } from "lucide-react";

const SalonMap = dynamic(() => import("@/components/salon-map"), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-[#1A1C29]/50 rounded-2xl animate-pulse" />
});

const defaultFilters: FilterState = {
  search: "",
  category: "All",
  minRating: 4,
  minPrice: 0,
  maxPrice: 15000,
  areas: [],
};

const SERVICE_CHIPS = ["Haircut", "Hair Color", "Facial", "Bridal Makeup", "Massage", "Manicure", "Pedicure"];

type SortKey = "relevance" | "rating" | "popularity" | "distance" | "price";
type ViewMode = "grid" | "map";

export default function SalonsPageClient({ initialSalons = [] }: { initialSalons?: SalonCardData[] }) {
  const [salons, setSalons] = useState<SalonCardData[]>(initialSalons);
  const [loading, setLoading] = useState(initialSalons.length === 0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeService, setActiveService] = useState<string | null>(null);

  const fetchSalons = useCallback(async (p: number, reset = false) => {
    const res = await fetch(`/api/salons?page=${p}&limit=12`);
    const d = await res.json();
    if (d.salons?.length) {
      // Enhance data with demo flags
      const enhanced = (d.salons || []).map((s: any, i: number) => ({
          ...s,
          isVerified: i % 3 === 0,
          isTrending: i === 1 || i === 4,
          popularity: 100 - (p * 12 + i) * 5,
      }));
      setSalons(prev => reset ? enhanced : [...prev, ...enhanced]);
      setHasMore(enhanced.length === 12);
    } else {
      setHasMore(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (initialSalons.length > 0) return;
    fetchSalons(1, true);
  }, [initialSalons, fetchSalons]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchSalons(next);
  };

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
          }
        );
      } else {
        setSort("relevance");
      }
    }
  }, [sort, userLocation]);

  const filtered = useMemo(() => {
    let list = [...salons];
    
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.area.toLowerCase().includes(q) || s.specialty.toLowerCase().includes(q));
    }

    if (activeService) {
        const q = activeService.toLowerCase();
        list = list.filter(s => s.specialty.toLowerCase().includes(q));
    }

    if (filters.category !== "All") {
      list = list.filter((s) => (s as any).services?.some((svc: any) => svc.category === filters.category || (filters.category === "Men's" && svc.category === "Men's")));
    }

    list = list.filter((s) => s.rating >= filters.minRating);
    
    list = list.filter((s) => {
      const price = parseInt(s.priceRange.replace(/\D/g, "").slice(0, 5)) || 0;
      return price >= filters.minPrice && price <= filters.maxPrice;
    });

    if (filters.areas.length) {
      list = list.filter((s) => filters.areas.includes(s.area));
    }
    
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    if (sort === "popularity") list.sort((a, b) => (b as any).popularity - (a as any).popularity);
    if (sort === "price") {
      list.sort((a, b) => {
        const pa = parseInt(a.priceRange.replace(/\D/g, "").slice(0, 5)) || 0;
        const pb = parseInt(b.priceRange.replace(/\D/g, "").slice(0, 5)) || 0;
        return pa - pb;
      });
    }
    if (sort === "distance" && userLocation) {
      list.sort((a, b) => {
        const distA = Math.sqrt(Math.pow((a.coordinates?.lat || 0) - userLocation.lat, 2) + Math.pow((a.coordinates?.lng || 0) - userLocation.lng, 2));
        const distB = Math.sqrt(Math.pow((b.coordinates?.lat || 0) - userLocation.lat, 2) + Math.pow((b.coordinates?.lng || 0) - userLocation.lng, 2));
        return distA - distB;
      });
    }
    return list;
  }, [salons, filters, sort, userLocation, activeService]);

  const recommended = useMemo(() => salons.filter(s => s.rating >= 4.7).slice(0, 3), [salons]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-4xl text-white">Marketplace</h1>
                    <p className="mt-2 text-cream-muted">Premium grooming lounges across Bangalore</p>
                </div>

                <div className="flex bg-[#1A1C29]/80 rounded-lg p-1 border border-white/5 self-start">
                    <button onClick={() => setViewMode("grid")} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "grid" ? "bg-violet-600 text-white" : "text-cream-muted hover:text-cream"}`}>
                        <LayoutGrid size={14} /> Grid
                    </button>
                    <button onClick={() => setViewMode("map")} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "map" ? "bg-violet-600 text-white" : "text-cream-muted hover:text-cream"}`}>
                        <MapIcon size={14} /> Map
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {SERVICE_CHIPS.map(chip => (
                    <button key={chip} onClick={() => setActiveService(activeService === chip ? null : chip)} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${activeService === chip ? "bg-violet-500/20 border-violet-500 text-violet-300" : "bg-white/5 border-white/10 text-cream-muted hover:border-white/20"}`}>
                        {chip}
                    </button>
                ))}
            </div>
        </div>

        {!loading && viewMode === "grid" && !filters.search && !activeService && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-gold" />
                    <h2 className="font-display text-xl text-white">Recommended for You</h2>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                    {recommended.map((s, i) => (
                        <div key={s._id} className="w-[320px] shrink-0">
                            <SalonCard salon={s} index={i} userLocation={userLocation} />
                        </div>
                    ))}
                </div>
            </motion.section>
        )}

        <div className="flex items-center justify-between mb-8">
            <div className="flex gap-4 text-xs">
                {(["relevance", "rating", "popularity", "distance", "price"] as SortKey[]).map((s) => (
                    <button key={s} type="button" onClick={() => setSort(s)} className={`capitalize transition-colors ${sort === s ? "font-bold text-amber-400" : "text-cream-muted hover:text-cream"}`}>
                        {s === "price" ? "Price" : s}
                    </button>
                ))}
            </div>
            <p className="text-[10px] uppercase tracking-widest text-cream-muted font-bold">{filtered.length} Hubs Found</p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          <SalonFilters filters={filters} onChange={setFilters} onClear={() => setFilters(defaultFilters)} />

          <div className="flex-1">
            {viewMode === "grid" ? (
              <div className="space-y-10">
                <motion.div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3" variants={staggerContainer} initial="hidden" animate={loading ? "hidden" : "show"}>
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => <SalonCardSkeleton key={i} />)
                    : filtered.map((s, i) => <SalonCard key={s._id} salon={s} index={i} userLocation={userLocation} />)
                  }
                </motion.div>
                
                {hasMore && !filters.search && !loading && (
                   <div className="flex justify-center border-t border-white/5 pt-10">
                     <Button variant="outline" size="lg" onClick={loadMore} className="rounded-full px-10">
                       Load More Enclaves
                     </Button>
                   </div>
                )}

                {!loading && filtered.length === 0 && (
                  <div className="py-20 text-center glass-card">
                    <p className="text-cream-muted">No matching enclaves found.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[600px] w-full sticky top-24">
                <SalonMap salons={filtered as any} center={filtered.length > 0 && (filtered[0] as any).coordinates ? [(filtered[0] as any).coordinates.lat, (filtered[0] as any).coordinates.lng] : undefined} />
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
