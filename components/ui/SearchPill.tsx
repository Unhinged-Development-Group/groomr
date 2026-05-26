"use client";

import { SearchIcon } from "@/components/ui/GroomrIcons";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SearchPillProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  ctaLabel?: string;
  size?: "sm" | "lg";
  className?: string;
}

export function SearchPill({
  value: controlledValue,
  onChange,
  onSubmit,
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
