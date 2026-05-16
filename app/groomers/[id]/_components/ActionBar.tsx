"use client";

import { useState } from "react";
import { HeartIcon } from "@/components/ui/GroomrIcons";
import { Toast } from "@/components/ui/Toast";
import { addFavourite, removeFavourite } from "@/app/actions/favourites";
import { BookingFlow } from "@/app/search/_components/BookingFlow";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price_pence: number;
  deposit_pence: number | null;
}

interface AvailabilityRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface ActionBarProps {
  groomerId: string;
  groomerName: string;
  initialSaved: boolean;
  services: Service[];
  availability: AvailabilityRow[];
  depositPolicy: { type: "none" | "percentage" | "full"; percentage: number | null };
}

export function ActionBar({
  groomerId,
  groomerName,
  initialSaved,
  services,
  availability,
  depositPolicy,
}: ActionBarProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function toggleFavourite() {
    if (busy) return;
    setBusy(true);
    const wasSaved = saved;
    setSaved(!wasSaved);
    const result = await (wasSaved ? removeFavourite(groomerId) : addFavourite(groomerId));
    if (!result.ok) {
      setSaved(wasSaved);
      setToast("Please sign in to save groomers");
    }
    setBusy(false);
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={toggleFavourite}
          disabled={busy}
          aria-label={saved ? "Remove from favourites" : "Save to favourites"}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full border transition-all focus-ring",
            saved
              ? "bg-muted-terracotta/10 border-muted-terracotta text-muted-terracotta"
              : "bg-white border-pebble-grey/30 text-pebble-grey hover:border-muted-terracotta hover:text-muted-terracotta"
          )}
        >
          <HeartIcon size={18} filled={saved} />
        </button>

        <button
          onClick={() => setToast("Messaging coming soon — book to get in touch!")}
          className="btn-secondary font-nunito font-bold py-2.5 px-5 rounded-full text-sm focus-ring"
        >
          Contact
        </button>

        <button
          onClick={() => setBookingOpen(true)}
          className="btn-primary font-nunito font-bold py-2.5 px-6 rounded-full text-sm shadow-subtle focus-ring"
        >
          Book Now
        </button>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />

      {bookingOpen && (
        <BookingFlow
          groomerProfileId={groomerId}
          groomerName={groomerName}
          services={services}
          availability={availability}
          depositPolicy={depositPolicy}
          onClose={() => setBookingOpen(false)}
        />
      )}
    </>
  );
}
