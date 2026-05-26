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
    <div className="w-full space-y-2">
      <SearchPill
        placeholder={placeholder}
        ctaLabel={ctaLabel}
        onSubmit={handleSubmit}
        onNearMe={handleNearMe}
        nearMeLoading={geoLoading}
      />
      {geoError && (
        <p className="text-sm text-muted-terracotta font-bold text-center">{geoError}</p>
      )}
    </div>
  );
}
