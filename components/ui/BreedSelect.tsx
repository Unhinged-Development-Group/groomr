"use client";

import { useState, useRef, useEffect, useId } from "react";
import { DOG_BREEDS } from "@/lib/dog-breeds";
import { ChevronDownIcon, CloseIcon } from "@/components/ui/GroomrIcons";
import { cn } from "@/lib/utils";

const ALL_OPTIONS = [...DOG_BREEDS, "Other"];

interface BreedSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function BreedSelect({ value, onChange, placeholder = "e.g. Cockapoo", className }: BreedSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [highlighted, setHighlighted] = useState(0);

  const filtered = query.trim()
    ? ALL_OPTIONS.filter(b => b.toLowerCase().includes(query.toLowerCase()))
    : ALL_OPTIONS;

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset highlight when filtered list changes
  useEffect(() => { setHighlighted(0); }, [query]);

  function openDropdown() {
    setQuery("");
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function select(breed: string) {
    onChange(breed);
    setOpen(false);
    setQuery("");
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) select(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    const item = listRef.current?.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        id={inputId}
        type="button"
        onClick={openDropdown}
        className={cn(
          "w-full flex items-center justify-between gap-2 border border-pebble-grey/30 rounded-xl px-4 py-2.5 text-sm font-nunito bg-white focus:outline-none focus:ring-2 focus:ring-sage-leaf/40 transition-colors text-left",
          open ? "ring-2 ring-sage-leaf/40 border-sage-leaf/40" : "hover:border-pebble-grey/50"
        )}
      >
        <span className={value ? "text-deep-slate" : "text-pebble-grey"}>
          {value || placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={clear}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(""); } }}
              className="p-0.5 rounded-full text-pebble-grey hover:text-deep-slate focus:outline-none focus:ring-1 focus:ring-sage-leaf/40"
              aria-label="Clear breed"
            >
              <CloseIcon size={14} />
            </span>
          )}
          <ChevronDownIcon
            size={16}
            className={cn("text-pebble-grey transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-pebble-grey/20 rounded-xl shadow-modal overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-pebble-grey/10">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search breeds…"
              className="w-full px-3 py-2 text-sm font-nunito text-deep-slate bg-alabaster-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-leaf/40 placeholder:text-pebble-grey/60"
            />
          </div>

          {/* Options list */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-2.5 text-sm text-pebble-grey font-nunito">No breeds found</li>
            ) : (
              filtered.map((breed, i) => (
                <li
                  key={breed}
                  role="option"
                  aria-selected={value === breed}
                  onMouseDown={() => select(breed)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={cn(
                    "px-4 py-2.5 text-sm font-nunito cursor-pointer transition-colors",
                    i === highlighted ? "bg-sage-leaf/10 text-deep-slate" : "text-deep-slate",
                    value === breed && "font-bold"
                  )}
                >
                  {breed}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
