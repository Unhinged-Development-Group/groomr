"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { StarRow } from "@/components/ui/StarRow";
import type { FavouriteGroomer } from "@/app/actions/favourites";
import { removeFavourite } from "@/app/actions/favourites";

export function FavouriteGroomersSection({ initialFavourites }: { initialFavourites: FavouriteGroomer[] }) {
  const [favourites, setFavourites] = useState<FavouriteGroomer[]>(initialFavourites);

  async function handleRemove(groomerProfileId: string) {
    const result = await removeFavourite(groomerProfileId);
    if (result.ok) {
      setFavourites(prev => prev.filter(f => f.groomer_profile_id !== groomerProfileId));
    }
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between border-b-2 border-pebble-grey/20 pb-3 mb-6">
        <h2 className="font-fredoka text-2xl md:text-3xl text-deep-slate">
          Your Favourites
        </h2>
      </div>

      {favourites.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-pebble-grey/20 text-center">
          <p className="font-nunito text-pebble-grey mb-3">You haven't saved any favourite groomers yet.</p>
          <Link href="/search" className="btn-secondary font-nunito text-sm px-4 py-2 font-bold focus-ring">
            Find a Groomer
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {favourites.map(fav => (
            <div key={fav.id} className="bg-white rounded-[12px] p-5 border border-pebble-grey/20 card-lift flex items-center justify-between gap-4">
              <Link href={`/groomers/${fav.groomer_profile_id}`} className="flex items-center gap-4 min-w-0 flex-1 focus-ring rounded-xl">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-pebble-grey/20 shrink-0">
                  <div className="w-full h-full bg-sage-leaf/20 flex items-center justify-center text-sage-leaf font-fredoka text-xl">
                    {fav.groomer_profiles?.business_name.charAt(0)}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-deep-slate font-nunito hover:text-sage-leaf transition-colors">
                    {fav.groomer_profiles?.business_name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <StarRow rating={fav.groomer_profiles?.average_rating || 0} />
                    <span className="text-sm font-nunito text-deep-slate ml-1">
                      {fav.groomer_profiles?.average_rating?.toFixed(1) || "New"}
                      {fav.groomer_profiles?.total_reviews ? ` (${fav.groomer_profiles.total_reviews})` : ""}
                    </span>
                  </div>
                </div>
              </Link>
              <button
                onClick={() => handleRemove(fav.groomer_profile_id)}
                className="text-xs text-muted-terracotta hover:underline font-nunito shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
