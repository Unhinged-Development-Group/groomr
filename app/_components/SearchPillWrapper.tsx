"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchPill } from "@/components/ui/SearchPill";

interface SearchPillWrapperProps {
  placeholder?: string;
  ctaLabel?: string;
}

export function SearchPillWrapper({ placeholder, ctaLabel }: SearchPillWrapperProps) {
  const router = useRouter();
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
    <div className="w-full space-y-3">
      <SearchPill
        placeholder={placeholder}
        ctaLabel={ctaLabel}
        onSubmit={handleSubmit}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleNearMe}
          disabled={geoLoading}
          className="btn-secondary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
        >
          {geoLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          {geoLoading ? "Finding you…" : "Near Me"}
        </button>
        {geoError && (
          <p className="text-sm text-muted-terracotta font-bold">{geoError}</p>
        )}
      </div>
    </div>
  );
}
