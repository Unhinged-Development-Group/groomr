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
    <div className="bg-white border border-pebble-grey/20 rounded-[16px] p-3 flex gap-3 items-start group">
      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-alabaster-cream border border-pebble-grey/15 group-hover:ring-2 group-hover:ring-groomr-gold/30 transition-all">
        {dog.profile_image_url ? (
          <Image
            src={dog.profile_image_url}
            alt={dog.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <span className="flex items-center justify-center w-full h-full text-xl select-none">
            🐾
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-fredoka text-base text-deep-slate leading-tight truncate">{dog.name}</p>
        {dog.breed && (
          <p className="text-pebble-grey text-xs font-nunito truncate">{dog.breed}</p>
        )}
        <div className="mt-1.5 flex gap-1.5 flex-wrap">
          {dog.size && <Badge tone="sage" className="text-[10px] px-1.5 py-0.5">{SIZE_LABEL[dog.size]}</Badge>}
          {dog.is_neutered === true && <Badge tone="grey" className="text-[10px] px-1.5 py-0.5">Neutered</Badge>}
          {dog.coat_type && (
            <Badge tone="gold" className="capitalize text-[10px] px-1.5 py-0.5">{dog.coat_type}</Badge>
          )}
        </div>
      </div>

      <div className={cn("flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity")}>
        <button
          onClick={() => onEdit(dog)}
          aria-label={`Edit ${dog.name}`}
          className="p-1.5 rounded-lg text-pebble-grey hover:text-deep-slate hover:bg-alabaster-cream transition-colors focus-ring"
        >
          <PencilIcon size={14} />
        </button>
        <button
          onClick={() => onDelete(dog.id)}
          aria-label={`Delete ${dog.name}`}
          className="p-1.5 rounded-lg text-pebble-grey hover:text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors focus-ring"
        >
          <TrashIcon size={14} />
        </button>
      </div>
    </div>
  );
}
