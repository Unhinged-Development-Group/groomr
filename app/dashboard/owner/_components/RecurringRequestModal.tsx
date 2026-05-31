"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { requestRecurringSeries } from "@/app/actions/recurring";
import type { Appointment } from "@/app/actions/appointments";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FREQUENCIES = [
  { value: "weekly",    label: "Every week" },
  { value: "bi-weekly", label: "Every 2 weeks" },
  { value: "4-weekly",  label: "Every 4 weeks" },
  { value: "monthly",   label: "Every month" },
] as const;

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onSubmitted: () => void;
}

export function RecurringRequestModal({ appointment, onClose, onSubmitted }: Props) {
  const sourceDt = new Date(appointment.scheduled_at);
  const sourceDow = sourceDt.getUTCDay();
  const sourceTime = `${String(sourceDt.getUTCHours()).padStart(2, "0")}:${String(sourceDt.getUTCMinutes()).padStart(2, "0")}`;

  const [frequency, setFrequency] = useState<"weekly" | "bi-weekly" | "4-weekly" | "monthly">("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(sourceDow);
  const [time, setTime] = useState(sourceTime);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestRecurringSeries({
        appointmentId: appointment.id,
        frequency,
        preferredDayOfWeek: dayOfWeek,
        preferredTime: time,
        endDate: hasEndDate && endDate ? endDate : null,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  return (
    <Modal open onClose={onClose} size="sm">
      {done ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-14 h-14 bg-groomr-gold rounded-full flex items-center justify-center mx-auto text-2xl">🗓</div>
          <h2 className="font-fredoka text-2xl text-deep-slate">Request sent!</h2>
          <p className="text-sm text-pebble-grey font-nunito">
            Your groomer will review the request and confirm it shortly.
          </p>
          <button onClick={() => { onSubmitted(); onClose(); }} className="btn-primary font-nunito font-bold px-8 py-3 rounded-full focus-ring">
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h2 className="font-fredoka text-2xl text-deep-slate">Make recurring</h2>
            <p className="text-sm text-pebble-grey font-nunito mt-1">
              {appointment.service_snapshot_name} for {appointment.dogs?.name}
            </p>
          </div>

          {/* Frequency */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey mb-2">How often</p>
            <div className="grid grid-cols-2 gap-2">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFrequency(f.value)}
                  className={`px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-colors focus-ring ${
                    frequency === f.value
                      ? "border-deep-slate bg-deep-slate text-alabaster-cream"
                      : "border-pebble-grey/20 text-deep-slate hover:border-deep-slate/40"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Day of week */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey mb-2">Preferred day</p>
            <div className="flex gap-1.5 flex-wrap">
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setDayOfWeek(i)}
                  className={`px-3 py-1.5 rounded-xl border-2 text-sm font-bold transition-colors focus-ring ${
                    dayOfWeek === i
                      ? "border-deep-slate bg-deep-slate text-alabaster-cream"
                      : "border-pebble-grey/20 text-deep-slate hover:border-deep-slate/40"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">Preferred time</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="field mt-1.5 w-full"
            />
          </label>

          {/* End date toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasEndDate}
                onChange={(e) => setHasEndDate(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-bold text-deep-slate">Set an end date</span>
            </label>
            {hasEndDate && (
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required={hasEndDate}
                className="field mt-2 w-full"
                min={new Date().toISOString().slice(0, 10)}
              />
            )}
          </div>

          {!hasEndDate && (
            <p className="text-xs text-pebble-grey font-nunito">
              Ongoing — your groomer can cancel at any time.
            </p>
          )}

          {error && <p className="text-sm font-bold text-muted-terracotta">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary font-nunito font-bold py-3 rounded-full text-sm focus-ring">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex-1 btn-primary font-nunito font-bold py-3 rounded-full text-sm focus-ring shadow-subtle disabled:opacity-50">
              {isPending ? "Sending…" : "Send request"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
