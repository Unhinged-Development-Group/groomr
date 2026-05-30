import Image from "next/image";
import Link from "next/link";
import { HeartIcon, StarIcon, LocationPinIcon } from "@/components/ui/GroomrIcons";
import { cn } from "@/lib/utils";

interface Groomer {
  id: string;
  name: string;
  tagline?: string;
  image: string;
  avatarUrl?: string;
  rating: number;
  reviewCount?: number;
  distance?: number;
  location?: string;
  nextSlot?: string;
  priceFrom?: number;
  isVerified?: boolean;
  isMobile?: boolean;
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
      onClick={() => onView?.(groomer)}
      role={onView ? "button" : undefined}
      tabIndex={onView ? 0 : undefined}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onView?.(groomer); }}
      className={cn(
        "flex flex-col text-left bg-white rounded-xl overflow-hidden border border-pebble-grey/20 card-lift w-full",
        onView ? "cursor-pointer" : "",
        className
      )}
    >
      {/* Image with overlaid distance + rating pills */}
      <div className="aspect-[16/10] bg-sage-leaf/20 overflow-hidden relative w-full shrink-0">
        <Image
          src={groomer.avatarUrl || groomer.image}
          alt={groomer.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 230px"
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

        {/* Favourite heart — bottom right */}
        <button
          onClick={(e) => { e.stopPropagation(); onSave?.(groomer); }}
          aria-label={saved ? "Remove from favourites" : "Save to favourites"}
          className="absolute bottom-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors focus-ring"
        >
          <HeartIcon
            size={32}
            filled={saved}
            className={cn("transition-colors", saved ? "text-muted-terracotta" : "text-pebble-grey")}
          />
        </button>
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
          {(groomer.isVerified || groomer.isMobile != null) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {groomer.isVerified && (
                <span className="text-xs font-bold bg-groomr-gold text-deep-slate px-2.5 py-0.5 rounded-full">
                  Verified
                </span>
              )}
              <span className="text-xs font-bold text-pebble-grey bg-pebble-grey/10 px-2.5 py-0.5 rounded-full">
                {groomer.isMobile ? "Mobile" : "Salon"}
              </span>
            </div>
          )}
          {groomer.tagline && (
            <p className="text-sm text-sage-leaf/90 font-medium mt-1.5 leading-snug">
              {groomer.tagline}
            </p>
          )}
        </div>

        <div className="flex-1" />

        {/* Footer: price left, View Profile right */}
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

          <Link
            href={`/groomers/${groomer.id}`}
            onClick={(e) => e.stopPropagation()}
            className="btn-secondary text-xs px-3 py-1.5 rounded-full font-bold focus-ring whitespace-nowrap"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
