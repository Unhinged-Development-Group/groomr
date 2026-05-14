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
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-fredoka text-2xl text-deep-slate">My dogs</h2>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 text-sm font-nunito font-bold text-sage-leaf hover:text-deep-slate transition-colors focus-ring rounded px-2 py-1"
        >
          <PlusIcon size={18} />
          Add dog
        </button>
      </div>

      {dogs.length === 0 ? (
        <div
          onClick={openAdd}
          className="cursor-pointer border-2 border-dashed border-pebble-grey/25 rounded-[20px] p-8 text-center hover:border-sage-leaf/40 transition-colors"
        >
          <p className="text-4xl mb-3">🐾</p>
          <p className="font-fredoka text-lg text-deep-slate mb-1">Add your first dog</p>
          <p className="text-pebble-grey text-sm font-nunito">
            Keep their details here so groomers know exactly how to care for them.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {dogs.map(dog => (
            <DogCard key={dog.id} dog={dog} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <AddDogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editing={editing}
      />
    </section>
  );
}
