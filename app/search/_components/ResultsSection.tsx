"use client";

import { useMemo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { GroomerCard } from "@/components/ui/GroomerCard";
import { addFavourite, removeFavourite } from "@/app/actions/favourites";
import type { GroomerResult, ActiveFilters, MapCentre, SortOption } from "@/types/search";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-[24px] bg-sage-leaf/10 animate-pulse flex items-center justify-center">
      <span className="text-sage-leaf font-bold text-sm">Loading map…</span>
    </div>
  ),
});

const SERVICE_MAP: Record<string, string> = {
  full: "Full Groom",
  bath: "Bath",
  stripping: "Hand Strip",
  nail: "Nail",
  puppy: "Puppy",
};

const PAGE_SIZE = 12;

interface ResultsSectionProps {
  allGroomers: GroomerResult[];
  activeFilters: ActiveFilters;
  sortBy: SortOption;
  isGeoSearch: boolean;
  mapCentre: MapCentre;
  onViewGroomer: (groomer: GroomerResult) => void;
  initialFavouriteIds: string[];
}

export function ResultsSection({
  allGroomers,
  activeFilters,
  sortBy,
  isGeoSearch,
  mapCentre,
  onViewGroomer,
  initialFavouriteIds,
}: ResultsSectionProps) {
  const [view, setView] = useState<"list" | "map">("list");
  const [savedIds, setSavedIds] = useState(() => new Set(initialFavouriteIds));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  async function handleToggleFavourite(groomer: { id: string }) {
    const isSaved = savedIds.has(groomer.id);
    setSavedIds(prev => {
      const next = new Set(prev);
      isSaved ? next.delete(groomer.id) : next.add(groomer.id);
      return next;
    });
    const result = await (isSaved ? removeFavourite(groomer.id) : addFavourite(groomer.id));
    if (!result.ok) {
      setSavedIds(prev => {
        const next = new Set(prev);
        isSaved ? next.add(groomer.id) : next.delete(groomer.id);
        return next;
      });
    }
  }

  const filteredAndSorted = useMemo(() => {
    let results = allGroomers.filter((g) => {
      if (activeFilters.service !== "all") {
        const keyword = SERVICE_MAP[activeFilters.service];
        if (keyword && !g.serviceNames.some((n) => n.includes(keyword))) return false;
      }
      if (activeFilters.price !== "all" && g.priceFrom != null) {
        if (activeFilters.price === "under-40" && g.priceFrom >= 40) return false;
        if (activeFilters.price === "40-60" && (g.priceFrom < 40 || g.priceFrom > 60)) return false;
        if (activeFilters.price === "over-60" && g.priceFrom <= 60) return false;
      }
      if (activeFilters.payment !== "all") {
        if (activeFilters.payment === "no-deposit" && g.requiresDeposit) return false;
        if (activeFilters.payment === "deposit" && !g.requiresDeposit) return false;
      }
      if (activeFilters.rating !== "all") {
        if (g.rating < parseFloat(activeFilters.rating)) return false;
      }
      if (activeFilters.verified === "verified" && !g.isVerified) return false;
      return true;
    });

    switch (sortBy) {
      case "az":
        results = [...results].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price":
        results = [...results].sort((a, b) => (a.priceFrom ?? Infinity) - (b.priceFrom ?? Infinity));
        break;
      case "distance":
        results = [...results].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
        break;
      case "rating":
      default:
        results = [...results].sort((a, b) => b.rating - a.rating);
        break;
    }

    return results;
  }, [allGroomers, activeFilters, sortBy]);

  // Reset pagination whenever filters/sort change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeFilters, sortBy]);

  const visibleGroomers = filteredAndSorted.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSorted.length;

  const isNoResults = filteredAndSorted.length === 0;
  const isFiltered = allGroomers.length > 0 && isNoResults;
  const isEmpty = allGroomers.length === 0;

  return (
    <section className="max-w-7xl mx-auto px-6 mt-12 pb-20">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <h2 className="font-fredoka text-3xl text-deep-slate">
          {filteredAndSorted.length > 0
            ? `${filteredAndSorted.length} ${isGeoSearch ? "Groomers Near You!" : "Groomers Found!"}`
            : isGeoSearch ? "Groomers Near You" : "Local Groomers"}
        </h2>

        {/* View toggle */}
        <div className="flex gap-1 bg-pebble-grey/10 p-1 rounded-full self-start sm:self-auto shrink-0">
          <button
            onClick={() => setView("list")}
            className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all focus-ring ${
              view === "list" ? "bg-white shadow-sm text-deep-slate" : "text-pebble-grey hover:text-deep-slate"
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setView("map")}
            className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all focus-ring ${
              view === "map" ? "bg-white shadow-sm text-deep-slate" : "text-pebble-grey hover:text-deep-slate"
            }`}
          >
            Map View
          </button>
        </div>
      </div>

      {/* List view */}
      {view === "list" && (
        <>
          {isEmpty && <EmptyState type="no-query" />}
          {isFiltered && <EmptyState type="filtered" />}
          {!isNoResults && (
            <>
              <div className="grid grid-cols-1 gap-4 min-[480px]:[grid-template-columns:repeat(auto-fill,230px)] min-[480px]:justify-start">
                {visibleGroomers.map((groomer) => (
                  <GroomerCard
                    key={groomer.id}
                    groomer={groomer}
                    onView={() => onViewGroomer(groomer)}
                    saved={savedIds.has(groomer.id)}
                    onSave={handleToggleFavourite}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="flex flex-col items-center gap-2 mt-10">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="btn-secondary font-nunito font-bold px-8 py-3 rounded-full text-sm focus-ring"
                  >
                    Load more ({filteredAndSorted.length - visibleCount} remaining)
                  </button>
                </div>
              )}

              {!hasMore && filteredAndSorted.length > PAGE_SIZE && (
                <p className="text-center text-sm text-pebble-grey font-bold mt-10">
                  All {filteredAndSorted.length} groomers shown
                </p>
              )}
            </>
          )}
        </>
      )}

      {/* Map view */}
      {view === "map" && (
        <div className="w-full h-[600px] rounded-[24px] overflow-hidden border border-pebble-grey/20 shadow-subtle relative z-10">
          <MapView
            groomers={filteredAndSorted}
            mapCentre={mapCentre}
            onViewGroomer={onViewGroomer}
          />
        </div>
      )}
    </section>
  );
}

function EmptyState({ type }: { type: "no-query" | "filtered" }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-sage-leaf/10 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-sage-leaf" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      {type === "no-query" ? (
        <>
          <h3 className="font-fredoka text-2xl text-deep-slate mb-2">No groomers found</h3>
          <p className="text-pebble-grey font-nunito max-w-sm">
            We&apos;re growing fast — try a nearby city, or use &ldquo;Near Me&rdquo; to search by location.
          </p>
        </>
      ) : (
        <>
          <h3 className="font-fredoka text-2xl text-deep-slate mb-2">No groomers match these filters</h3>
          <p className="text-pebble-grey font-nunito max-w-sm">Try relaxing your filters to see more results.</p>
        </>
      )}
    </div>
  );
}
