"use client";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Hair", "Skin", "Bridal", "Men's", "Spa", "Aesthetics"];
const AREAS = [
  "Indiranagar",
  "Koramangala",
  "Jayanagar",
  "HSR Layout",
  "MG Road",
  "Whitefield",
  "Malleshwaram",
  "Sadashivanagar",
  "Kalyan Nagar",
  "Electronic City",
];

export interface FilterState {
  search: string;
  category: string;
  minRating: number;
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
  return (
    <aside className="sticky top-28 w-full shrink-0 space-y-6 glass-card p-5 lg:w-[280px]">
      <div>
        <label className="mb-2 block text-xs uppercase tracking-wider text-cream-muted">
          Search
        </label>
        <Input
          placeholder="Studio or enclave…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-cream-muted">
          Category
        </p>
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
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-cream-muted">
          Max price (₹{filters.maxPrice.toLocaleString("en-IN")})
        </p>
        <input
          type="range"
          min={0}
          max={15000}
          step={500}
          value={filters.maxPrice}
          onChange={(e) =>
            onChange({ ...filters, maxPrice: parseInt(e.target.value, 10) })
          }
          className="w-full accent-gold"
        />
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-cream-muted">
          Rating
        </p>
        {[4, 4.5, 4.8].map((r) => (
          <label key={r} className="mb-1 flex items-center gap-2 text-sm text-cream">
            <input
              type="radio"
              name="rating"
              checked={filters.minRating === r}
              onChange={() => onChange({ ...filters, minRating: r })}
              className="accent-gold"
            />
            {r}★+
          </label>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-cream-muted">
          Enclave
        </p>
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {AREAS.map((area) => (
            <label
              key={area}
              className="flex items-center gap-2 text-sm text-cream-muted"
            >
              <input
                type="checkbox"
                checked={filters.areas.includes(area)}
                onChange={(e) => {
                  const areas = e.target.checked
                    ? [...filters.areas, area]
                    : filters.areas.filter((a) => a !== area);
                  onChange({ ...filters, areas });
                }}
                className="accent-gold"
              />
              {area}
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="text-xs text-cream-muted underline hover:text-gold"
      >
        Clear Filters
      </button>
    </aside>
  );
}
