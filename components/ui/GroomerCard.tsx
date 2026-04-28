import Image from "next/image";
import { Heart, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Groomer {
  id: string;
  name: string;
  tagline?: string;
  image: string;
  rating: number;
  reviewCount?: number;
  distance?: number;
  location?: string;
  nextSlot?: string;
  priceFrom?: number;
}

interface GroomerCardProps {
  groomer: Groomer;
  onView?: (groomer: Groomer) => void;
  onSave?: (groomer: Groomer) => void;
  saved?: boolean;
  className?: string;
}

export function GroomerCard({ groomer, onView, onSave, saved, className }: GroomerCardProps) {
  return (
    <div
      className={cn(
        "text-left bg-white rounded-xl overflow-hidden border border-pebble-grey/20 card-lift block w-full relative group",
        className
      )}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onSave?.(groomer); }}
        aria-label={saved ? "Remove from favourites" : "Save to favourites"}
        className="absolute top-3 right-3 z-10 bg-white/95 hover:bg-white rounded-full p-2 shadow-subtle transition-colors focus-ring"
      >
        <Heart
          size={18}
          className={cn(
            "transition-colors",
            saved ? "fill-muted-terracotta stroke-muted-terracotta" : "stroke-pebble-grey"
          )}
        />
      </button>

      <button onClick={() => onView?.(groomer)} className="block w-full text-left focus-ring">
        <div className="aspect-[4/3] bg-sage-leaf/20 overflow-hidden relative">
          <Image
            src={groomer.image}
            alt={groomer.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-fredoka text-xl text-deep-slate leading-tight">{groomer.name}</h3>
              {groomer.tagline && (
                <p className="text-sm text-sage-leaf font-bold mt-1">{groomer.tagline}</p>
              )}
            </div>
            <div className="flex items-center gap-1 bg-groomr-gold/20 px-2 py-1 rounded-full shrink-0">
              <Star size={14} className="fill-deep-slate stroke-deep-slate" />
              <span className="text-xs font-bold text-deep-slate">{groomer.rating}</span>
            </div>
          </div>

          {(groomer.distance != null || groomer.location) && (
            <div className="flex items-center gap-2 text-xs text-pebble-grey font-bold">
              <MapPin size={14} />
              <span>
                {groomer.distance != null && `${groomer.distance} miles`}
                {groomer.distance != null && groomer.location && " · "}
                {groomer.location}
              </span>
            </div>
          )}

          {groomer.nextSlot && (
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 bg-sage-leaf/10 text-deep-slate font-bold px-2.5 py-1 rounded-full border border-sage-leaf/20">
                <span className="w-1.5 h-1.5 bg-sage-leaf rounded-full" />
                Next: {groomer.nextSlot}
              </span>
            </div>
          )}

          {groomer.priceFrom != null && (
            <div className="flex items-center justify-between pt-3 border-t border-pebble-grey/10">
              <span className="text-sm text-pebble-grey">From</span>
              <span className="font-fredoka text-xl text-deep-slate">£{groomer.priceFrom}</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
