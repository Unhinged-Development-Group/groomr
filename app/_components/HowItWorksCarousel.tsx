"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SearchIcon, CalendarIcon, FavoritesIcon } from "@/components/ui/GroomrIcons";

const STEPS = [
  {
    Icon: SearchIcon,
    number: "01",
    tab: "Find",
    title: "Find your match",
    body: "Search by location. See real availability, prices, and reviews from neighbours — not a directory, a discovery.",
    accent: "bg-groomr-gold",
    iconBg: "bg-groomr-gold/15",
  },
  {
    Icon: CalendarIcon,
    number: "02",
    tab: "Book",
    title: "Book in seconds",
    body: "No back-and-forth DMs. Pick a slot, confirm your deposit, done. Your groomer gets a notification instantly.",
    accent: "bg-sage-leaf",
    iconBg: "bg-sage-leaf/15",
  },
  {
    Icon: FavoritesIcon,
    number: "03",
    tab: "Return",
    title: "Build a routine",
    body: "Rebook your favourite groomer in two taps. Get reminders before every appointment. Your dog deserves a regular.",
    accent: "bg-deep-slate",
    iconBg: "bg-pebble-grey/15",
  },
] as const;

const INTERVAL = 4500;

export function HowItWorksCarousel() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickMs = 50;

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  const startTimers = useCallback(
    (currentStep: number) => {
      clearTimers();
      setProgress(0);

      progressRef.current = setInterval(() => {
        setProgress((p) => Math.min(p + (tickMs / INTERVAL) * 100, 100));
      }, tickMs);

      intervalRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setActive((currentStep + 1) % STEPS.length);
          setVisible(true);
        }, 220);
      }, INTERVAL) as unknown as ReturnType<typeof setInterval>;
    },
    [clearTimers]
  );

  useEffect(() => {
    if (!paused) startTimers(active);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, paused]);

  function goTo(i: number) {
    if (i === active) return;
    clearTimers();
    setProgress(0);
    setVisible(false);
    setTimeout(() => {
      setActive(i);
      setVisible(true);
    }, 220);
  }

  const step = STEPS[active];

  return (
    <div
      className="w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Step tabs */}
      <div className="flex justify-center gap-3 sm:gap-4 mb-10">
        {STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={[
              "group relative flex flex-col items-center gap-1.5 px-5 sm:px-8 py-3 rounded-2xl transition-all duration-300 focus-ring",
              i === active
                ? "bg-white shadow-subtle border border-pebble-grey/15"
                : "hover:bg-white/60 border border-transparent",
            ].join(" ")}
          >
            <span
              className={[
                "font-fredoka text-xs tracking-widest transition-colors duration-300",
                i === active ? "text-pebble-grey" : "text-pebble-grey/40",
              ].join(" ")}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={[
                "font-fredoka text-base sm:text-lg transition-colors duration-300",
                i === active ? "text-deep-slate" : "text-pebble-grey/50",
              ].join(" ")}
            >
              {s.tab}
            </span>

            {/* Progress bar */}
            {i === active && (
              <div className="absolute bottom-0 left-4 right-4 h-[3px] rounded-full bg-pebble-grey/10 overflow-hidden">
                <div
                  className={["h-full rounded-full transition-none", s.accent].join(" ")}
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div
        className={[
          "relative bg-white rounded-[28px] border border-pebble-grey/15 shadow-subtle overflow-hidden transition-all duration-220",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        ].join(" ")}
        style={{ transitionDuration: "220ms" }}
      >
        {/* Decorative number */}
        <div
          className="absolute -right-4 -top-6 font-fredoka text-[11rem] sm:text-[14rem] leading-none select-none pointer-events-none text-pebble-grey/[0.05]"
          aria-hidden="true"
        >
          {step.number}
        </div>

        <div className="relative z-10 grid md:grid-cols-2 gap-0">
          {/* Left — text */}
          <div className="p-6 sm:p-10 md:p-14 flex flex-col justify-center space-y-6">
            <div
              className={[
                "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300",
                step.iconBg,
              ].join(" ")}
            >
              <step.Icon size={30} className="text-deep-slate" />
            </div>

            <div className="space-y-3">
              <p className="font-fredoka text-xs tracking-widest text-pebble-grey/60 uppercase">
                Step {step.number}
              </p>
              <h3 className="font-fredoka text-3xl sm:text-4xl text-deep-slate leading-tight">
                {step.title}
              </h3>
              <p className="text-pebble-grey font-nunito text-lg leading-relaxed max-w-sm">
                {step.body}
              </p>
            </div>

            {/* Dot indicators */}
            <div className="flex gap-2 pt-2">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Step ${i + 1}`}
                  className={[
                    "rounded-full transition-all duration-300 focus-ring",
                    i === active
                      ? `w-6 h-2 ${step.accent}`
                      : "w-2 h-2 bg-pebble-grey/25 hover:bg-pebble-grey/50",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>

          {/* Right — visual accent panel */}
          <div
            className={[
              "hidden md:flex items-center justify-center p-14 transition-colors duration-500",
              step.iconBg,
            ].join(" ")}
          >
            <StepVisual stepIndex={active} />
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      <div className="flex justify-center gap-3 mt-6">
        <button
          onClick={() => goTo((active - 1 + STEPS.length) % STEPS.length)}
          aria-label="Previous step"
          className="w-10 h-10 rounded-full border border-pebble-grey/25 flex items-center justify-center text-pebble-grey hover:border-deep-slate hover:text-deep-slate transition-colors focus-ring"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => goTo((active + 1) % STEPS.length)}
          aria-label="Next step"
          className="w-10 h-10 rounded-full border border-pebble-grey/25 flex items-center justify-center text-pebble-grey hover:border-deep-slate hover:text-deep-slate transition-colors focus-ring"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Step-specific right-panel visuals ────────────────────────────────────────

function StepVisual({ stepIndex }: { stepIndex: number }) {
  if (stepIndex === 0) {
    return (
      <div className="w-full max-w-xs space-y-3">
        {["Glasgow · 0.3 mi", "Southside · 0.8 mi", "Shawlands · 1.2 mi"].map((loc, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-subtle border border-pebble-grey/10"
          >
            <div className="w-9 h-9 rounded-full bg-groomr-gold/20 flex items-center justify-center shrink-0">
              <span className="font-fredoka text-deep-slate text-sm">{["W", "P", "T"][i]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-deep-slate truncate">
                {["Wagington & Co.", "Paws & Bliss", "The Trim Room"][i]}
              </p>
              <p className="text-xs text-pebble-grey">{loc}</p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <svg className="w-3 h-3 text-groomr-gold fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-bold text-deep-slate">
                {["4.9", "4.7", "5.0"][i]}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (stepIndex === 1) {
    return (
      <div className="w-full max-w-xs space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-subtle border border-pebble-grey/10 space-y-4">
          <p className="font-fredoka text-lg text-deep-slate">Select a time</p>
          <div className="grid grid-cols-3 gap-2">
            {["9:00", "10:00", "11:00", "13:00", "14:00", "15:00"].map((t, i) => (
              <div
                key={t}
                className={[
                  "text-center py-2 rounded-xl text-sm font-bold transition-colors",
                  i === 2
                    ? "bg-deep-slate text-white"
                    : "bg-pebble-grey/8 text-deep-slate border border-pebble-grey/15",
                ].join(" ")}
              >
                {t}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-pebble-grey/10">
            <div>
              <p className="text-xs text-pebble-grey font-bold">Full Groom · Marlow</p>
              <p className="font-fredoka text-lg text-deep-slate">£58</p>
            </div>
            <div className="bg-sage-leaf text-white text-xs font-bold px-4 py-2 rounded-full">
              Confirm
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs space-y-3">
      <div className="bg-white rounded-2xl p-5 shadow-subtle border border-pebble-grey/10 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-fredoka text-lg text-deep-slate">Marlow&apos;s schedule</p>
          <span className="text-xs font-bold bg-sage-leaf/15 text-sage-leaf px-2.5 py-1 rounded-full">Regular</span>
        </div>
        {["May 23", "Jun 20", "Jul 18"].map((d, i) => (
          <div key={d} className="flex items-center gap-3">
            <div className={["w-2 h-2 rounded-full shrink-0", i === 0 ? "bg-groomr-gold" : "bg-pebble-grey/30"].join(" ")} />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm font-bold text-deep-slate">{d}</span>
              <span className="text-xs text-pebble-grey">{["Wagington & Co.", "Wagington & Co.", "Wagington & Co."][i]}</span>
            </div>
          </div>
        ))}
        <div className="mt-1 pt-3 border-t border-pebble-grey/10">
          <p className="text-xs text-pebble-grey font-nunito">Next reminder in <span className="font-bold text-deep-slate">3 days</span></p>
        </div>
      </div>
    </div>
  );
}
