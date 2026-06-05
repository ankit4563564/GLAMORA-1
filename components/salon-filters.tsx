"use client";

import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, Star, Filter, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["All", "Hair", "Skin", "Bridal", "Men's", "Spa", "Aesthetics"];
const AREAS = [
  "Indiranagar", "Koramangala", "Jayanagar", "HSR Layout", 
  "MG Road", "Whitefield", "Malleshwaram", "Sadashivanagar", 
  "Kalyan Nagar", "Electronic City",
];

export interface FilterState {
  search: string;
  category: string;
  minRating: number;
  minPrice: number;
  maxPrice: number;
  areas: string[];
}

export function SalonFilters({
  filters,
  onChange,
  onClear,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onClear: () => void;
}) {
  const [openGroups, setOpenGroups] = useState<string[]>(["search", "category", "price", "rating", "areas"]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("glamora-recent-searches") || "[]");
    setRecentSearches(saved);
  }, []);

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    const newRecent = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem("glamora-recent-searches", JSON.stringify(newRecent));
  };

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const activeCount = 
    (filters.category !== "All" ? 1 : 0) + 
    (filters.minRating > 0 ? 1 : 0) + 
    (filters.areas.length > 0 ? 1 : 0) + 
    (filters.minPrice > 0 || filters.maxPrice < 15000 ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      <FilterGroup 
        title="Search" 
        isOpen={openGroups.includes("search")} 
        onToggle={() => toggleGroup("search")}
      >
        <div className="relative">
          <Input
            placeholder="Search salons, services, or styles..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            onKeyDown={(e) => e.key === "Enter" && saveSearch(filters.search)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-muted" />
          
          <AnimatePresence>
            {isSearchFocused && recentSearches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-white/10 bg-[#1A1C29] p-2 shadow-2xl"
              >
                <p className="mb-2 px-2 text-[10px] uppercase tracking-wider text-cream-muted font-bold">Recent Searches</p>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        onChange({ ...filters, search: s });
                        setIsSearchFocused(false);
                      }}
                      className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-cream transition-colors hover:bg-white/10"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </FilterGroup>

      <FilterGroup 
        title="Category" 
        isOpen={openGroups.includes("category")} 
        onToggle={() => toggleGroup("category")}
      >
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ ...filters, category: c })}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                filters.category === c
                  ? "border-amber-500/50 bg-amber-500/15 text-amber-200"
                  : "border-white/10 text-cream-muted hover:border-amber-500/30"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup 
        title="Price Range" 
        isOpen={openGroups.includes("price")} 
        onToggle={() => toggleGroup("price")}
      >
        <div className="space-y-4 pt-2">
          <p className="text-center text-xs font-mono text-gold">
            ₹{filters.minPrice.toLocaleString("en-IN")} – ₹{filters.maxPrice.toLocaleString("en-IN")}
          </p>
          <div className="relative h-6 w-full">
            <input
              type="range"
              min={0}
              max={15000}
              step={500}
              value={filters.minPrice}
              onChange={(e) => {
                const val = Math.min(parseInt(e.target.value), filters.maxPrice - 500);
                onChange({ ...filters, minPrice: val });
              }}
              className="pointer-events-none absolute h-1 w-full appearance-none bg-transparent accent-gold [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
            />
            <input
              type="range"
              min={0}
              max={15000}
              step={500}
              value={filters.maxPrice}
              onChange={(e) => {
                const val = Math.max(parseInt(e.target.value), filters.minPrice + 500);
                onChange({ ...filters, maxPrice: val });
              }}
              className="pointer-events-none absolute h-1 w-full appearance-none bg-transparent accent-gold [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
            />
            <div className="absolute top-2 h-1 w-full rounded-full bg-white/10">
              <div 
                className="absolute h-full rounded-full bg-gold"
                style={{ 
                  left: `${(filters.minPrice / 15000) * 100}%`, 
                  right: `${100 - (filters.maxPrice / 15000) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      </FilterGroup>

      <FilterGroup 
        title="Rating" 
        isOpen={openGroups.includes("rating")} 
        onToggle={() => toggleGroup("rating")}
      >
        <div className="flex flex-col gap-2">
          {[4.8, 4.5, 4, 3].map((r) => (
            <button
              key={r}
              onClick={() => onChange({ ...filters, minRating: r })}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                filters.minRating === r ? "bg-amber-500/10 text-gold" : "text-cream-muted hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    size={14} 
                    className={cn(i < Math.floor(r) ? "fill-gold text-gold" : "text-white/10")} 
                  />
                ))}
                <span className="ml-2 font-medium">{r}+</span>
              </div>
              {filters.minRating === r && <div className="h-1.5 w-1.5 rounded-full bg-gold" />}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup 
        title="Enclave" 
        isOpen={openGroups.includes("areas")} 
        onToggle={() => toggleGroup("areas")}
      >
        <div className="max-h-40 space-y-1 overflow-y-auto pr-2 scrollbar-hide">
          {AREAS.map((area) => (
            <label
              key={area}
              className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-cream-muted transition-colors hover:bg-white/5 hover:text-white"
            >
              <span>{area}</span>
              <input
                type="checkbox"
                checked={filters.areas.includes(area)}
                onChange={(e) => {
                  const areas = e.target.checked
                    ? [...filters.areas, area]
                    : filters.areas.filter((a) => a !== area);
                  onChange({ ...filters, areas });
                }}
                className="h-4 w-4 rounded border-white/20 bg-transparent accent-gold text-gold focus:ring-gold focus:ring-offset-0"
              />
            </label>
          ))}
        </div>
      </FilterGroup>

      <button
        type="button"
        onClick={onClear}
        className="w-full text-center text-xs font-medium text-cream-muted underline hover:text-gold pt-2"
      >
        Clear All Filters
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop View */}
      <aside className="hidden lg:block sticky top-28 w-[280px] shrink-0 glass-card p-5 h-fit max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-hide">
        <FilterContent />
      </aside>

      {/* Mobile Toggle Button */}
      <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 lg:hidden">
        <Button 
          onClick={() => setIsMobileOpen(true)}
          className="h-12 rounded-full px-6 shadow-2xl shadow-violet-900/40 gap-2 font-bold uppercase tracking-widest bg-violet-600 hover:bg-violet-700"
        >
          <Filter size={18} />
          Filters
          {activeCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-violet-700">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile Bottom Sheet */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[70] max-h-[85vh] rounded-t-[32px] border-t border-white/10 bg-[#1A1C29] p-6 pt-2 shadow-2xl lg:hidden"
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-center py-3">
                  <div className="h-1.5 w-12 rounded-full bg-white/10" />
                </div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl text-white">Filters</h2>
                  <button onClick={() => setIsMobileOpen(false)} className="rounded-full bg-white/5 p-2 text-cream-muted">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto pb-10 scrollbar-hide">
                  <FilterContent />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function FilterGroup({ 
  title, 
  children, 
  isOpen, 
  onToggle 
}: { 
  title: string; 
  children: React.ReactNode; 
  isOpen: boolean; 
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/5 pb-4 last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-2 text-left"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-cream-muted">
          {title}
        </span>
        <ChevronDown 
          size={16} 
          className={cn("text-cream-muted transition-transform", isOpen ? "rotate-180" : "")} 
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pt-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
