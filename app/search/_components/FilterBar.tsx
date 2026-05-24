"use client";

import type { ActiveFilters, SortOption } from "@/types/search";

interface FilterBarProps {
  filters: ActiveFilters;
  sortBy: SortOption;
  isGeoSearch: boolean;
  onFiltersChange: (filters: ActiveFilters) => void;
  onSortChange: (sort: SortOption) => void;
}

const CLEAR_FILTERS: ActiveFilters = {
  service: "all",
  price: "all",
  payment: "all",
  rating: "all",
  verified: "all",
};

interface PillSelectProps {
  value: string;
  active: boolean;
  onChange: (v: string) => void;
  children: React.ReactNode;
}

function PillSelect({ value, active, onChange, children }: PillSelectProps) {
  return (
    <div className="relative inline-flex shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "appearance-none cursor-pointer text-sm font-bold rounded-full pl-4 pr-8 py-2 outline-none transition-all focus:ring-2 focus:ring-groomr-gold",
          active
            ? "bg-deep-slate text-white border border-deep-slate"
            : "bg-white text-deep-slate border border-pebble-grey/30 hover:border-pebble-grey/60",
        ].join(" ")}
      >
        {children}
      </select>
      {/* Chevron */}
      <svg
        className={[
          "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3",
          active ? "text-white" : "text-pebble-grey",
        ].join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

export function FilterBar({ filters, sortBy, isGeoSearch, onFiltersChange, onSortChange }: FilterBarProps) {
  const update = (key: keyof ActiveFilters, value: string) =>
    onFiltersChange({ ...filters, [key]: value });

  const hasActiveFilter =
    filters.service !== "all" ||
    filters.price !== "all" ||
    filters.payment !== "all" ||
    filters.rating !== "all" ||
    filters.verified !== "all";

  return (
    <div className="w-full bg-white border-b border-pebble-grey/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap items-center gap-2.5 border-t border-pebble-grey/10 py-4">

          {/* Filter label */}
          <span className="text-sm font-bold text-deep-slate flex items-center gap-2 shrink-0 mr-1">
            <svg className="w-4 h-4 text-sage-leaf" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters:
          </span>

          <PillSelect value={filters.service} active={filters.service !== "all"} onChange={(v) => update("service", v)}>
            <option value="all">All Services</option>
            <option value="full">Full Groom</option>
            <option value="bath">Bath &amp; Brush</option>
            <option value="stripping">Hand Stripping</option>
            <option value="nail">Nail Clipping</option>
            <option value="puppy">Puppy Introduction</option>
          </PillSelect>

          <PillSelect value={filters.price} active={filters.price !== "all"} onChange={(v) => update("price", v)}>
            <option value="all">Any Price</option>
            <option value="under-40">Under £40</option>
            <option value="40-60">£40 – £60</option>
            <option value="over-60">£60+</option>
          </PillSelect>

          <PillSelect value={filters.payment} active={filters.payment !== "all"} onChange={(v) => update("payment", v)}>
            <option value="all">Any Payment</option>
            <option value="no-deposit">No Pre-payment</option>
            <option value="deposit">Pre-payment Required</option>
          </PillSelect>

          <PillSelect value={filters.rating} active={filters.rating !== "all"} onChange={(v) => update("rating", v)}>
            <option value="all">Any Rating</option>
            <option value="4.0">4.0+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4.8">4.8+ Stars</option>
            <option value="5.0">5.0 Stars only</option>
          </PillSelect>

          <PillSelect value={filters.verified} active={filters.verified !== "all"} onChange={(v) => update("verified", v)}>
            <option value="all">Verified?</option>
            <option value="verified">Verified Only</option>
          </PillSelect>

          {/* Divider */}
          <div className="hidden sm:block w-px h-5 bg-pebble-grey/20 mx-1" />

          {/* Sort */}
          <span className="text-sm font-bold text-pebble-grey shrink-0">Sort:</span>
          <PillSelect value={sortBy} active={sortBy !== "rating"} onChange={(v) => onSortChange(v as SortOption)}>
            <option value="rating">Top Rated</option>
            <option value="az">A – Z</option>
            <option value="price">Lowest Price</option>
            {isGeoSearch && <option value="distance">Nearest First</option>}
          </PillSelect>

          {/* Clear */}
          {hasActiveFilter && (
            <button
              onClick={() => onFiltersChange(CLEAR_FILTERS)}
              className="ml-auto text-sm font-bold text-muted-terracotta hover:underline focus-ring rounded px-2 py-1 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
