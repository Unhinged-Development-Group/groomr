"use client";

import { useRef, useState, useEffect, useCallback } from "react";
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

interface Option { value: string; label: string }

interface PillDropdownProps {
  value: string;
  options: Option[];
  active: boolean;
  onChange: (v: string) => void;
}

function PillDropdown({ value, options, active, onChange }: PillDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = options.find((o) => o.value === value)?.label ?? options[0].label;

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex items-center gap-1.5 text-sm font-bold rounded-full pl-4 pr-3 py-2 outline-none transition-all focus:ring-2 focus:ring-groomr-gold select-none whitespace-nowrap",
          active
            ? "bg-deep-slate text-white border border-deep-slate"
            : "bg-white text-deep-slate border border-pebble-grey/30 hover:border-pebble-grey/60",
        ].join(" ")}
      >
        {label}
        <svg
          className={["w-3 h-3 transition-transform", open ? "rotate-180" : "", active ? "text-white" : "text-pebble-grey"].join(" ")}
          fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 min-w-full bg-white border border-pebble-grey/20 rounded-2xl shadow-lg overflow-hidden py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={[
                "w-full text-left px-4 py-2.5 text-sm font-bold transition-colors whitespace-nowrap",
                opt.value === value
                  ? "bg-deep-slate text-white"
                  : "text-deep-slate hover:bg-pebble-grey/10",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterBar({ filters, sortBy, isGeoSearch, onFiltersChange, onSortChange }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const update = (key: keyof ActiveFilters, value: string) =>
    onFiltersChange({ ...filters, [key]: value });

  const activeFilterCount =
    (filters.service !== "all" ? 1 : 0) +
    (filters.price !== "all" ? 1 : 0) +
    (filters.payment !== "all" ? 1 : 0) +
    (filters.rating !== "all" ? 1 : 0) +
    (filters.verified !== "all" ? 1 : 0);

  const hasActiveFilter = activeFilterCount > 0;

  const sortOptions: Option[] = [
    { value: "rating", label: "Top Rated" },
    { value: "az",     label: "A – Z" },
    { value: "price",  label: "Lowest Price" },
    ...(isGeoSearch ? [{ value: "distance", label: "Nearest First" }] : []),
  ];

  // Close on outside click
  const handleOutside = useCallback((e: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open, handleOutside]);

  return (
    <div className="w-full bg-white border-b border-pebble-grey/10">
      <div className="max-w-7xl mx-auto px-6" ref={panelRef}>
        <div className="flex items-center gap-3 border-t border-pebble-grey/10 py-3">

          {/* Toggle button */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={[
              "flex items-center gap-2 text-sm font-bold rounded-full pl-4 pr-3 py-2 outline-none transition-all focus:ring-2 focus:ring-groomr-gold select-none whitespace-nowrap border",
              open || hasActiveFilter
                ? "bg-deep-slate text-white border-deep-slate"
                : "bg-white text-deep-slate border-pebble-grey/30 hover:border-pebble-grey/60",
            ].join(" ")}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {hasActiveFilter && (
              <span className="ml-0.5 w-5 h-5 rounded-full bg-groomr-gold text-deep-slate text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <svg
              className={["w-3 h-3 transition-transform", open ? "rotate-180" : "", open || hasActiveFilter ? "text-white/70" : "text-pebble-grey"].join(" ")}
              fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Sort — always visible */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <span className="text-sm font-bold text-pebble-grey hidden sm:inline shrink-0">Sort:</span>
            <PillDropdown
              value={sortBy}
              active={sortBy !== "rating"}
              onChange={(v) => onSortChange(v as SortOption)}
              options={sortOptions}
            />
          </div>

          {hasActiveFilter && (
            <button
              onClick={() => { onFiltersChange(CLEAR_FILTERS); setOpen(false); }}
              className="text-sm font-bold text-muted-terracotta hover:underline focus-ring rounded px-2 py-1 transition-colors shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        {/* Collapsible filter panel */}
        {open && (
          <div className="flex flex-wrap items-center gap-2.5 pb-4 border-t border-pebble-grey/10 pt-3">
            <PillDropdown
              value={filters.service}
              active={filters.service !== "all"}
              onChange={(v) => update("service", v)}
              options={[
                { value: "all",       label: "All Services" },
                { value: "full",      label: "Full Groom" },
                { value: "bath",      label: "Bath & Brush" },
                { value: "stripping", label: "Hand Stripping" },
                { value: "nail",      label: "Nail Clipping" },
                { value: "puppy",     label: "Puppy Introduction" },
              ]}
            />

            <PillDropdown
              value={filters.price}
              active={filters.price !== "all"}
              onChange={(v) => update("price", v)}
              options={[
                { value: "all",      label: "Any Price" },
                { value: "under-40", label: "Under £40" },
                { value: "40-60",    label: "£40 – £60" },
                { value: "over-60",  label: "£60+" },
              ]}
            />

            <PillDropdown
              value={filters.payment}
              active={filters.payment !== "all"}
              onChange={(v) => update("payment", v)}
              options={[
                { value: "all",        label: "Any Payment" },
                { value: "no-deposit", label: "No Pre-payment" },
                { value: "deposit",    label: "Pre-payment Required" },
              ]}
            />

            <PillDropdown
              value={filters.rating}
              active={filters.rating !== "all"}
              onChange={(v) => update("rating", v)}
              options={[
                { value: "all", label: "Any Rating" },
                { value: "4.0", label: "4.0+ Stars" },
                { value: "4.5", label: "4.5+ Stars" },
                { value: "4.8", label: "4.8+ Stars" },
                { value: "5.0", label: "5.0 Stars only" },
              ]}
            />

            <PillDropdown
              value={filters.verified}
              active={filters.verified !== "all"}
              onChange={(v) => update("verified", v)}
              options={[
                { value: "all",      label: "Verified?" },
                { value: "verified", label: "Verified Only" },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
