import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ active, className, children, ...props }: ChipProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-full text-sm font-bold transition-colors duration-300 focus-ring",
        active
          ? "bg-deep-slate text-alabaster-cream border-2 border-deep-slate"
          : "bg-white text-deep-slate border-2 border-pebble-grey/20 hover:border-deep-slate",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
