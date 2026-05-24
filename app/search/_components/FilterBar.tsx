"use client";

import type { ActiveFilters, SortOption } from "@/types/search";

interface FilterBarProps {
  filters: ActiveFilters;
  sortBy: SortOption;
  isGeoSearch: boolean;
  onFiltersChange: (filters: ActiveFilters) => void;
  onSortChange: (sort: SortOption) => void;
}

const selectClass =
  "bg-alabaster-cream border border-pebble-grey/20 text-deep-slate text-sm rounded-full focus:ring-2 focus:ring-groomr-gold focus:border-groomr-gold block px-4 py-2 outline-none font-bold cursor-pointer transition-shadow";

const CLEAR_FILTERS: ActiveFilters = {
  service: "all",
  price: "all",
  payment: "all",
  rating: "all",
  verified: "all",
};

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
        <div className="flex flex-wrap items-center gap-3 border-t border-pebble-grey/10 py-4">

          {/* Filter label */}
          <span className="text-sm font-bold text-deep-slate flex items-center gap-2 shrink-0">
            <svg className="w-4 h-4 text-sage-leaf" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters:
          </span>

          {/* Service */}
          <select value={filters.service} onChange={(e) => update("service", e.target.value)} className={selectClass}>
            <option value="all">All Services</option>
            <option value="full">Full Groom</option>
            <option value="bath">Bath &amp; Brush</option>
            <option value="stripping">Hand Stripping</option>
            <option value="nail">Nail Clipping</option>
            <option value="puppy">Puppy Introduction</option>
          </select>

          {/* Price */}
          <select value={filters.price} onChange={(e) => update("price", e.target.value)} className={selectClass}>
            <option value="all">Any Price</option>
            <option value="under-40">Under £40</option>
            <option value="40-60">£40 – £60</option>
            <option value="over-60">£60+</option>
          </select>

          {/* Payment */}
          <select value={filters.payment} onChange={(e) => update("payment", e.target.value)} className={selectClass}>
            <option value="all">Any Payment</option>
            <option value="no-deposit">No Pre-payment</option>
            <option value="deposit">Pre-payment Required</option>
          </select>

          {/* Rating */}
          <select value={filters.rating} onChange={(e) => update("rating", e.target.value)} className={selectClass}>
            <option value="all">Any Rating</option>
            <option value="4.0">4.0+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4.8">4.8+ Stars</option>
            <option value="5.0">5.0 Stars only</option>
          </select>

          {/* Verified */}
          <select value={filters.verified} onChange={(e) => update("verified", e.target.value)} className={selectClass}>
            <option value="all">Any Groomer</option>
            <option value="verified">Verified Only</option>
          </select>

          {/* Divider */}
          <div className="hidden sm:block w-px h-5 bg-pebble-grey/20 mx-1" />

          {/* Sort */}
          <span className="text-sm font-bold text-deep-slate shrink-0">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className={selectClass}
          >
            <option value="rating">Top Rated</option>
            <option value="az">A – Z</option>
            <option value="price">Lowest Price</option>
            {isGeoSearch && <option value="distance">Nearest First</option>}
          </select>

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
