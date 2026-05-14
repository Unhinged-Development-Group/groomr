"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon } from "@/components/ui/GroomrIcons";
import { createManualAppointment } from "@/app/actions/groomer";
import type { ServiceRow } from "@/types/groomer-dashboard";

interface Props {
  services: ServiceRow[];
  onClose: () => void;
}

export function NewBookingModal({ services, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Only persisted services (id !== null) can be booked
  const bookableServices = services.filter((s): s is typeof s & { id: string } => s.id !== null);

  const [serviceId, setServiceId] = useState(bookableServices[0]?.id ?? "");
  const [clientName, setClientName] = useState("");
  const [dogName, setDogName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"confirmed" | "pending">("confirmed");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const selectedService = bookableServices.find((s) => s.id === serviceId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !clientName.trim() || !dogName.trim() || !date || !time) return;

    setError(null);
    startTransition(async () => {
      const result = await createManualAppointment({
        serviceId,
        clientName: clientName.trim(),
        dogName: dogName.trim(),
        scheduledDate: date,
        scheduledTime: time,
        notes: notes.trim() || undefined,
        status,
      });

      if ("error" in result) {
        setError(result.error);
      } else {
        setDone(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-deep-slate/60 backdrop-blur-sm"
      />

      {/* Sheet */}
      <div className="relative bg-alabaster-cream w-full sm:max-w-lg rounded-t-[28px] sm:rounded-[28px] shadow-modal border border-pebble-grey/20 z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-pebble-grey/15">
          <div>
            <p className="text-xs font-bold text-sage-leaf uppercase tracking-wider font-nunito">
              Groomer dashboard
            </p>
            <h2 className="font-fredoka text-2xl text-deep-slate mt-0.5">
              {done ? "Booking added!" : "Add a groom"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 bg-white/80 border border-pebble-grey/10 text-deep-slate hover:text-muted-terracotta transition-colors focus-ring"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-10 text-center space-y-4">
            <div className="w-14 h-14 bg-groomr-gold rounded-full flex items-center justify-center mx-auto text-2xl">
              🐾
            </div>
            <p className="font-fredoka text-xl text-deep-slate">
              {clientName}&apos;s appointment is in your calendar.
            </p>
            <button
              onClick={onClose}
              className="btn-primary font-nunito font-bold px-8 py-3 rounded-full focus-ring"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Service */}
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">
                Service
              </span>
              {bookableServices.length === 0 ? (
                <p className="mt-1.5 text-sm text-muted-terracotta font-bold">
                  Add services in your Profile tab first.
                </p>
              ) : (
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  required
                  className="field mt-1.5 cursor-pointer"
                >
                  {bookableServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.duration} min — £{(s.price / 100).toFixed(0)}
                    </option>
                  ))}
                </select>
              )}
            </label>

            {/* Client + dog name */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">
                  Client name
                </span>
                <input
                  className="field mt-1.5"
                  placeholder="e.g. Sarah M."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">
                  Dog name
                </span>
                <input
                  className="field mt-1.5"
                  placeholder="e.g. Biscuit"
                  value={dogName}
                  onChange={(e) => setDogName(e.target.value)}
                  required
                />
              </label>
            </div>

            {/* Date + time */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">
                  Date
                </span>
                <input
                  type="date"
                  className="field mt-1.5"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">
                  Time
                </span>
                <input
                  type="time"
                  className="field mt-1.5"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </label>
            </div>

            {/* Status */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">
                Status
              </span>
              <div className="flex gap-2 mt-1.5">
                {(["confirmed", "pending"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-colors focus-ring capitalize ${
                      status === s
                        ? "border-deep-slate bg-deep-slate text-alabaster-cream"
                        : "border-pebble-grey/20 text-deep-slate hover:border-deep-slate"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">
                Notes (optional)
              </span>
              <textarea
                className="field mt-1.5 min-h-[72px] resize-none"
                placeholder="e.g. First visit, anxious around dryers"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            {/* Price recap */}
            {selectedService && (
              <div className="flex justify-between items-center bg-white border border-pebble-grey/10 rounded-xl px-4 py-3">
                <span className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
                  Total
                </span>
                <span className="font-fredoka text-xl text-deep-slate">
                  £{(selectedService.price / 100).toFixed(0)}
                </span>
              </div>
            )}

            {error && (
              <p className="text-sm font-bold text-muted-terracotta">{error}</p>
            )}

            <div className="flex gap-3 pt-1 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary font-nunito font-bold py-3 rounded-full text-sm focus-ring"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || bookableServices.length === 0}
                className="flex-1 btn-primary font-nunito font-bold py-3 rounded-full text-sm focus-ring shadow-subtle disabled:opacity-50"
              >
                {isPending ? "Adding…" : "Add booking"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
