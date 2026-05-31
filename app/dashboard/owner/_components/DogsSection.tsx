"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/ui/GroomrIcons";
import { DogCard } from "./DogCard";
import { AddDogModal } from "./AddDogModal";
import { deleteDog } from "@/app/actions/dogs";
import type { Dog } from "@/app/actions/dogs";

interface DogsSectionProps {
  initialDogs: Dog[];
}

export function DogsSection({ initialDogs }: DogsSectionProps) {
  const [dogs, setDogs] = useState<Dog[]>(initialDogs);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dog | undefined>(undefined);

  function openAdd() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(dog: Dog) {
    setEditing(dog);
    setModalOpen(true);
  }

  function handleSaved(dog: Dog) {
    setDogs(prev => {
      const idx = prev.findIndex(d => d.id === dog.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = dog;
        return next;
      }
      return [...prev, dog];
    });
  }

  async function handleDelete(id: string) {
    const result = await deleteDog(id);
    if ("ok" in result) {
      setDogs(prev => prev.filter(d => d.id !== id));
    }
  }

  return (
    <section className="mb-10">
      <h2 className="font-fredoka text-2xl text-deep-slate mb-4">My dogs</h2>

      {dogs.length === 0 ? (
        <button
          onClick={openAdd}
          className="w-full cursor-pointer border-2 border-dashed border-pebble-grey/25 rounded-[20px] p-8 text-center hover:border-sage-leaf/40 transition-colors focus-ring"
        >
          <p className="text-4xl mb-3">🐾</p>
          <p className="font-fredoka text-lg text-deep-slate mb-1">Add your first dog</p>
          <p className="text-pebble-grey text-sm font-nunito">
            Keep their details here so groomers know exactly how to care for them.
          </p>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {dogs.map(dog => (
            <DogCard key={dog.id} dog={dog} onEdit={openEdit} onDelete={handleDelete} />
          ))}
          <button
            onClick={openAdd}
            className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-pebble-grey/25 rounded-[16px] p-4 min-h-[90px] hover:border-sage-leaf/50 hover:bg-sage-leaf/5 transition-colors focus-ring group"
          >
            <div className="w-8 h-8 rounded-full bg-pebble-grey/10 group-hover:bg-sage-leaf/10 flex items-center justify-center transition-colors">
              <PlusIcon size={16} className="text-pebble-grey group-hover:text-sage-leaf transition-colors" />
            </div>
            <span className="font-nunito font-bold text-xs text-pebble-grey group-hover:text-sage-leaf transition-colors">Add dog</span>
          </button>
        </div>
      )}

      <AddDogModal
        key={editing?.id ?? "new"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editing={editing}
      />
    </section>
  );
}
