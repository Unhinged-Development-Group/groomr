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
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Search input */}
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
            />
          </div>

          {/* Near Me button */}
          <button
            onClick={handleNearMe}
            disabled={geoLoading}
            className="btn-secondary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            {geoLoading ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
            Near Me
          </button>

        </div>

        {geoError && (
          <p className="mt-3 text-sm text-muted-terracotta font-bold">{geoError}</p>
        )}

        {suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-xs font-bold text-pebble-grey uppercase tracking-wide">
              Popular near you:
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
