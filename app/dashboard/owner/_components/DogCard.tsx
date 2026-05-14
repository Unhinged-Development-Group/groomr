"use client";

import Image from "next/image";
import { PencilIcon, TrashIcon } from "@/components/ui/GroomrIcons";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Dog } from "@/app/actions/dogs";

const SIZE_LABEL: Record<NonNullable<Dog["size"]>, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  giant: "Giant",
};

interface DogCardProps {
  dog: Dog;
  onEdit: (dog: Dog) => void;
  onDelete: (id: string) => void;
}

export function DogCard({ dog, onEdit, onDelete }: DogCardProps) {
  return (
    <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 flex gap-4 items-start group">
      <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-alabaster-cream border border-pebble-grey/15 group-hover:ring-2 group-hover:ring-groomr-gold/30 transition-all">
        {dog.profile_image_url ? (
          <Image
            src={dog.profile_image_url}
            alt={dog.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <span className="flex items-center justify-center w-full h-full text-2xl select-none">
            🐾
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-fredoka text-lg text-deep-slate leading-tight truncate">{dog.name}</p>
        {dog.breed && (
          <p className="text-pebble-grey text-sm font-nunito truncate">{dog.breed}</p>
        )}
        <div className="mt-2 flex gap-2 flex-wrap">
          {dog.size && <Badge tone="sage">{SIZE_LABEL[dog.size]}</Badge>}
          {dog.is_neutered === true && <Badge tone="grey">Neutered</Badge>}
          {dog.coat_type && (
            <Badge tone="gold" className="capitalize">{dog.coat_type}</Badge>
          )}
        </div>
      </div>

      <div className={cn("flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity")}>
        <button
          onClick={() => onEdit(dog)}
          aria-label={`Edit ${dog.name}`}
          className="p-2 rounded-xl text-pebble-grey hover:text-deep-slate hover:bg-alabaster-cream transition-colors focus-ring"
        >
          <PencilIcon size={16} />
        </button>
        <button
          onClick={() => onDelete(dog.id)}
          aria-label={`Delete ${dog.name}`}
          className="p-2 rounded-xl text-pebble-grey hover:text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors focus-ring"
        >
          <TrashIcon size={16} />
        </button>
      </div>
    </div>
  );
}
