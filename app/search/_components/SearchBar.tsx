"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchPill } from "@/components/ui/SearchPill";

interface SearchBarProps {
  initialQuery: string;
  isGeoSearch: boolean;
  suggestions: string[];
}

export function SearchBar({ initialQuery, isGeoSearch, suggestions }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(isGeoSearch ? "" : initialQuery);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleSubmit = (value: string) => {
    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        router.push(
          `/search?lat=${pos.coords.latitude.toFixed(6)}&lng=${pos.coords.longitude.toFixed(6)}`
        );
      },
      () => {
        setGeoLoading(false);
        setGeoError("Location access denied. Try searching by postcode instead.");
      }
    );
  };

  return (
    <section className="w-full bg-white border-b border-pebble-grey/10 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Search pill — Near Me icon button is built into SearchPill via onNearMe */}
        <div className="w-full md:max-w-lg">
          <SearchPill
            value={query}
            onChange={setQuery}
            placeholder={
              isGeoSearch ? "Searching near your location..." : "Postcode, town, or city..."
            }
            ctaLabel="Search"
            size="sm"
            onSubmit={handleSubmit}
            onNearMe={handleNearMe}
            nearMeLoading={geoLoading}
          />
        </div>

        {geoError && (
          <p className="mt-3 text-sm text-muted-terracotta font-bold">{geoError}</p>
        )}

        {suggestions.length > 0 && (
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mt-4">
            <span className="w-full md:w-auto text-center md:text-left text-xs font-bold text-pebble-grey uppercase tracking-wide">
              Popular:
            </span>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
                className="text-xs font-bold px-3 py-1.5 rounded-full border border-pebble-grey/25 text-deep-slate hover:border-sage-leaf hover:text-sage-leaf transition-colors focus-ring bg-white"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
