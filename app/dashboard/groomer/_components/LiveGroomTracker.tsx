"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markAppointmentComplete } from "@/app/actions/groomer";

export interface ActiveGroom {
  appointmentId: string;
  dogName: string;
  serviceName: string;
  ownerName: string;
  startedAt: number; // Date.now() ms
  durationMinutes: number;
  extensionMinutes: number;
}

interface Props {
  activeGroom: ActiveGroom;
  onExtend: (minutes: number) => void;
  onComplete: () => void;
}

export function LiveGroomTracker({ activeGroom, onExtend, onComplete }: Props) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [showExtend, setShowExtend] = useState(false);
  const [completing, setCompleting] = useState(false);
  const prevTotalRef = useRef(activeGroom.durationMinutes + activeGroom.extensionMinutes);

  const totalSeconds = (activeGroom.durationMinutes + activeGroom.extensionMinutes) * 60;
  const remaining = totalSeconds - elapsed;
  const isOvertime = remaining <= 0;
  const pct = Math.min(100, Math.max(0, (elapsed / totalSeconds) * 100));

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - activeGroom.startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeGroom.startedAt]);

  useEffect(() => {
    const newTotal = activeGroom.durationMinutes + activeGroom.extensionMinutes;
    if (newTotal !== prevTotalRef.current) {
      prevTotalRef.current = newTotal;
      setShowExtend(false);
    }
  }, [activeGroom.durationMinutes, activeGroom.extensionMinutes]);

  const fmt = (secs: number) => {
    const abs = Math.abs(secs);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  async function handleComplete() {
    setCompleting(true);
    await markAppointmentComplete(activeGroom.appointmentId);
    onComplete();
    router.refresh();
  }

  return (
    <div className="fixed bottom-6 right-6 z-[300] w-72 bg-deep-slate text-alabaster-cream rounded-[20px] shadow-modal p-5 border border-alabaster-cream/10">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-groomr-gold mb-0.5">In progress</p>
          <p className="font-fredoka text-xl leading-tight truncate">{activeGroom.dogName}</p>
          <p className="text-xs text-alabaster-cream/60 font-bold truncate">{activeGroom.serviceName} · {activeGroom.ownerName}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-fredoka text-2xl leading-none tabular-nums ${isOvertime ? "text-muted-terracotta" : "text-groomr-gold"}`}>
            {isOvertime ? "+" : ""}{fmt(remaining)}
          </p>
          <p className="text-[10px] text-alabaster-cream/40 font-bold mt-0.5">{isOvertime ? "over" : "left"}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-alabaster-cream/15 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isOvertime ? "bg-muted-terracotta" : "bg-groomr-gold"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Running */}
      {!isOvertime && !completing && (
        <button
          onClick={handleComplete}
          className="w-full bg-groomr-gold text-deep-slate font-nunito font-bold py-2.5 rounded-full text-sm focus-ring hover:bg-groomr-gold/90 transition-colors"
        >
          Finish Groom
        </button>
      )}

      {/* Overtime — pickup question */}
      {isOvertime && !showExtend && !completing && (
        <div className="space-y-2.5">
          <p className="text-sm font-bold text-center leading-snug">
            Is {activeGroom.dogName} all ready<br />for pickup?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleComplete}
              className="flex-1 bg-groomr-gold text-deep-slate font-nunito font-bold py-2.5 rounded-full text-sm focus-ring hover:bg-groomr-gold/90 transition-colors"
            >
              Yes, done!
            </button>
            <button
              onClick={() => setShowExtend(true)}
              className="flex-1 border-2 border-alabaster-cream/25 text-alabaster-cream font-nunito font-bold py-2.5 rounded-full text-sm focus-ring hover:bg-alabaster-cream/10 transition-colors"
            >
              Not yet
            </button>
          </div>
        </div>
      )}

      {/* Extend options */}
      {isOvertime && showExtend && !completing && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-center text-alabaster-cream/50">Extend by</p>
          <div className="flex gap-2">
            {[10, 15, 30].map((m) => (
              <button
                key={m}
                onClick={() => onExtend(m)}
                className="flex-1 border-2 border-alabaster-cream/25 text-alabaster-cream font-nunito font-bold py-2.5 rounded-full text-sm focus-ring hover:bg-alabaster-cream/10 transition-colors"
              >
                +{m}m
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowExtend(false)}
            className="w-full text-xs text-alabaster-cream/40 hover:text-alabaster-cream/70 font-bold py-1 transition-colors"
          >
            Back
          </button>
        </div>
      )}

      {completing && (
        <p className="text-sm text-center text-alabaster-cream/60 font-bold animate-pulse">Saving…</p>
      )}
    </div>
  );
}
