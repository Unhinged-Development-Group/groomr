"use client";

import { useState } from "react";
import type { GroomerResult, ActiveFilters, MapCentre } from "@/types/search";
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
}

export function SearchPageClient({
  initialGroomers,
  initialQuery,
  isGeoSearch,
  initialFilters,
  mapCentre,
}: SearchPageClientProps) {
  const [filteredCount, setFilteredCount] = useState(initialGroomers.length);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(initialFilters);
  const [selectedGroomer, setSelectedGroomer] = useState<GroomerResult | null>(null);

  return (
    <>
      <SearchBar
        initialQuery={initialQuery}
        isGeoSearch={isGeoSearch}
        filteredCount={filteredCount}
      />
      <FilterBar
        initialFilters={initialFilters}
        onFiltersChange={setActiveFilters}
      />
      <ResultsSection
        allGroomers={initialGroomers}
        activeFilters={activeFilters}
        isGeoSearch={isGeoSearch}
        mapCentre={mapCentre}
        onFilteredCountChange={setFilteredCount}
        onViewGroomer={setSelectedGroomer}
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
