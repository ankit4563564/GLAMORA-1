"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/page-transition";
import { SalonFilters, type FilterState } from "@/components/salon-filters";
import { SalonCard, type SalonCardData } from "@/components/salon-card";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerContainer } from "@/lib/motion";

const defaultFilters: FilterState = {
  search: "",
  category: "All",
  minRating: 4,
  maxPrice: 15000,
  areas: [],
};

type SortKey = "relevance" | "rating" | "price" | "distance";

export default function SalonsPage() {
  const [salons, setSalons] = useState<SalonCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sort, setSort] = useState<SortKey>("relevance");

  useEffect(() => {
    fetch("/api/salons")
      .then((r) => r.json())
      .then((d) => setSalons(d.salons || []))
      .finally(() => setLoading(false));
  }, []);

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
    return list;
  }, [salons, filters, sort]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-display text-4xl text-metallic">Marketplace</h1>
        <p className="mt-2 text-cream-muted">
          Premium grooming lounges across Bangalore
        </p>

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
          <motion.div
            className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
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
        </div>
      </div>
    </PageTransition>
  );
}
