import { StarIcon } from "@/components/ui/GroomrIcons";
import { cn } from "@/lib/utils";

interface StarRowProps {
  rating: number;
  count?: number;
  size?: number;
  className?: string;
}

export function StarRow({ rating, count, size = 14, className }: StarRowProps) {
  const full = Math.floor(rating);
  const frac = rating - full;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5 text-groomr-gold">
        {Array.from({ length: 5 }).map((_, i) => {
          const opacity = i < full ? 1 : i === full ? Math.max(0.25, frac) : 0.25;
          return (
            <span key={i} style={{ opacity }}>
              <StarIcon size={size} />
            </span>
          );
        })}
      </div>
      <span className="text-sm font-bold text-deep-slate">{rating.toFixed(1)}</span>
      {count != null && (
        <span className="text-xs text-pebble-grey">({count})</span>
      )}
    </div>
  );
}
