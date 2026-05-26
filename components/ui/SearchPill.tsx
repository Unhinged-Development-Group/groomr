"use client";

import { SearchIcon } from "@/components/ui/GroomrIcons";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SearchPillProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onNearMe?: () => void;
  nearMeLoading?: boolean;
  placeholder?: string;
  ctaLabel?: string;
  size?: "sm" | "lg";
  className?: string;
}

export function SearchPill({
  value: controlledValue,
  onChange,
  onSubmit,
  onNearMe,
  nearMeLoading = false,
  placeholder = "Enter your postcode, town, or city...",
  ctaLabel = "Search",
  size = "lg",
  className,
}: SearchPillProps) {
  const [internalValue, setInternalValue] = useState("");
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (v: string) => {
    if (onChange) onChange(v);
    else setInternalValue(v);
  };

  const isLg = size === "lg";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
      className={cn("w-full", className)}
    >
      <div className="bg-white rounded-full p-1.5 sm:p-2 flex items-center shadow-subtle border border-pebble-grey/20 focus-within:ring-2 focus-within:ring-groomr-gold transition-shadow">
        <div className="pl-3 sm:pl-4 text-pebble-grey shrink-0">
          <SearchIcon size={isLg ? 20 : 18} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "flex-1 min-w-0 bg-transparent font-nunito text-deep-slate placeholder-pebble-grey/70 px-2 sm:px-3 outline-none border-none",
            isLg ? "py-2 text-base sm:py-3 sm:text-lg" : "py-2 text-sm"
          )}
        />
        {/* Near Me icon button — shown only when handler provided */}
        {onNearMe && (
          <button
            type="button"
            onClick={onNearMe}
            disabled={nearMeLoading}
            title="Use my location"
            className="shrink-0 mr-1 sm:mr-2 w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-pebble-grey/25 hover:border-deep-slate hover:bg-pebble-grey/8 transition-colors flex items-center justify-center text-pebble-grey hover:text-deep-slate focus-ring disabled:opacity-50"
          >
            {nearMeLoading ? (
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
          </button>
        )}
        <button
          type="submit"
          className={cn(
            "btn-primary font-nunito font-bold rounded-full whitespace-nowrap focus-ring shrink-0",
            isLg ? "px-4 py-2 text-sm sm:px-7 sm:py-3 sm:text-base" : "px-5 py-2 text-sm"
          )}
        >
          {ctaLabel}
        </button>
      </div>
    </form>
  );
}
