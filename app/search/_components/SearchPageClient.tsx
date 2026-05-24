"use client";

import { useState, useMemo } from "react";
import type { GroomerResult, ActiveFilters, MapCentre, SortOption } from "@/types/search";
import { SearchBar } from "./SearchBar";
import { FilterBar } from "./FilterBar";
import { ResultsSection } from "./ResultsSection";
import { GroomerProfileModal } from "./GroomerProfileModal";

interface SearchPageClientProps {
  initialGroomers: GroomerResult[];
  initialQuery: string;
  isGeoSearch: boolean;
  initialFilters: ActiveFilters;
  mapCentre: MapCentre;
  initialFavouriteIds: string[];
}

export function SearchPageClient({
  initialGroomers,
  initialQuery,
  isGeoSearch,
  initialFilters,
  mapCentre,
  initialFavouriteIds,
}: SearchPageClientProps) {
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(initialFilters);
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [selectedGroomer, setSelectedGroomer] = useState<GroomerResult | null>(null);

  // Derive popular search suggestions from the returned groomers.
  // Top cities by frequency + most common service keywords.
  const suggestions = useMemo(() => {
    const cities = new Map<string, number>();
    const services = new Map<string, number>();

    for (const g of initialGroomers) {
      if (g.location && g.location !== "UK") {
        cities.set(g.location, (cities.get(g.location) ?? 0) + 1);
      }
      for (const s of g.serviceNames) {
        const key =
          s.toLowerCase().includes("doodle") ? "Doodle Groom"
          : s.toLowerCase().includes("hand strip") ? "Hand Strip"
          : s.toLowerCase().includes("full groom") ? "Full Groom"
          : s.toLowerCase().includes("bath") ? "Bath & Blowdry"
          : s.toLowerCase().includes("puppy") ? "Puppy Introduction"
          : s.toLowerCase().includes("de-shed") ? "De-shedding"
          : null;
        if (key) services.set(key, (services.get(key) ?? 0) + 1);
      }
    }

    const topCities = [...cities.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c]) => c);

    const topServices = [...services.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s]) => s);

    return [...topCities, ...topServices].slice(0, 6);
  }, [initialGroomers]);

  return (
    <>
      <SearchBar
        initialQuery={initialQuery}
        isGeoSearch={isGeoSearch}
        suggestions={suggestions}
      />
      <FilterBar
        filters={activeFilters}
        sortBy={sortBy}
        isGeoSearch={isGeoSearch}
        onFiltersChange={setActiveFilters}
        onSortChange={setSortBy}
      />
      <ResultsSection
        allGroomers={initialGroomers}
        activeFilters={activeFilters}
        sortBy={sortBy}
        isGeoSearch={isGeoSearch}
        mapCentre={mapCentre}
        onViewGroomer={setSelectedGroomer}
        initialFavouriteIds={initialFavouriteIds}
      />
      {selectedGroomer && (
        <GroomerProfileModal
          groomer={selectedGroomer}
          onClose={() => setSelectedGroomer(null)}
        />
      )}
    </>
  );
}
