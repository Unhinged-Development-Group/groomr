import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRowProps {
  rating: number;
  count?: number;
  size?: number;
  className?: string;
}

export function StarRow({ rating, count, size = 14, className }: StarRowProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ opacity: i < Math.round(rating) ? 1 : 0.25 }}>
            <Star size={size} className="fill-groomr-gold stroke-groomr-gold" />
          </span>
        ))}
      </div>
      <span className="text-sm font-bold text-deep-slate">{rating.toFixed(1)}</span>
      {count != null && (
        <span className="text-xs text-pebble-grey">({count})</span>
      )}
    </div>
  );
}
