import Image from "next/image";
import { HeartIcon, StarIcon, LocationPinIcon } from "@/components/ui/GroomrIcons";
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
        "flex flex-col text-left bg-white rounded-xl overflow-hidden border border-pebble-grey/20 card-lift w-full",
        className
      )}
    >
      {/* Image with overlaid distance + rating pills */}
      <div className="aspect-[16/10] bg-sage-leaf/20 overflow-hidden relative w-full shrink-0">
        <Image
          src={groomer.image}
          alt={groomer.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Distance — top left */}
        {groomer.distance != null && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-deep-slate text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
            <LocationPinIcon size={12} className="text-deep-slate" />
            {groomer.distance} miles away
          </span>
        )}

        {/* Rating — top right */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-groomr-gold px-2.5 py-1 rounded-full shadow-sm">
          <StarIcon size={12} className="text-deep-slate" />
          <span className="text-xs font-bold text-deep-slate">{groomer.rating}</span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-fredoka text-lg text-deep-slate leading-tight">{groomer.name}</h3>
          {groomer.location && (
            <p className="text-[11px] font-bold text-pebble-grey uppercase tracking-wider mt-0.5">
              {groomer.location}
            </p>
          )}
          {groomer.tagline && (
            <p className="text-sm text-sage-leaf/90 font-medium mt-1.5 leading-snug">
              {groomer.tagline}
            </p>
          )}
        </div>

        <div className="flex-1" />

        {/* Footer: price left, actions right */}
        <div className="flex items-center justify-between pt-3 border-t border-pebble-grey/10">
          <div className="flex items-baseline gap-1">
            {groomer.priceFrom != null ? (
              <>
                <span className="text-xs text-pebble-grey">From</span>
                <span className="font-fredoka text-lg text-deep-slate">£{groomer.priceFrom}</span>
              </>
            ) : (
              <span className="text-xs text-pebble-grey italic">Price on request</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onSave?.(groomer); }}
              aria-label={saved ? "Remove from favourites" : "Save to favourites"}
              className="p-1.5 rounded-full hover:bg-pebble-grey/10 transition-colors focus-ring"
            >
              <HeartIcon
                size={16}
                filled={saved}
                className={cn("transition-colors", saved ? "text-muted-terracotta" : "text-pebble-grey")}
              />
            </button>

            <button
              onClick={() => onView?.(groomer)}
              className="btn-secondary text-xs px-3 py-1.5 rounded-full font-bold focus-ring"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
