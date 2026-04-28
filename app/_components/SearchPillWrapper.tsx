"use client";

import { useRouter } from "next/navigation";
import { SearchPill } from "@/components/ui/SearchPill";

interface SearchPillWrapperProps {
  placeholder?: string;
  ctaLabel?: string;
}

export function SearchPillWrapper({ placeholder, ctaLabel }: SearchPillWrapperProps) {
  const router = useRouter();

  const handleSubmit = (value: string) => {
    if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  return (
    <SearchPill
      placeholder={placeholder}
      ctaLabel={ctaLabel}
      onSubmit={handleSubmit}
    />
  );
}
