"use client";

import { Search } from "lucide-react";
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

  const padY = size === "sm" ? "py-2" : "py-3";
  const iconSize = size === "sm" ? 18 : 22;
  const textSize = size === "sm" ? "text-sm" : "text-lg";
  const btnPad = size === "sm" ? "px-5 py-2 text-sm" : "px-7 py-3 text-base";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
      className={cn("w-full", className)}
    >
      <div className="bg-white rounded-full p-2 flex items-center shadow-subtle border border-pebble-grey/20 focus-within:ring-2 focus-within:ring-groomr-gold transition-shadow">
        <div className="pl-4 text-pebble-grey">
          <Search size={iconSize} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "flex-grow bg-transparent font-nunito text-deep-slate placeholder-pebble-grey/70 px-3 outline-none border-none min-w-0",
            textSize,
            padY
          )}
        />
        <button
          type="submit"
          className={cn("btn-primary font-nunito font-bold rounded-full whitespace-nowrap focus-ring", btnPad)}
        >
          {ctaLabel}
        </button>
      </div>
    </form>
  );
}
