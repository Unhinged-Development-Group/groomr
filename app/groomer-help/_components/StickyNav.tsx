"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "quick-start",  label: "Quick-start" },
  { id: "profile",      label: "Profile & settings" },
  { id: "availability", label: "Availability & calendar" },
  { id: "services",     label: "Services & pricing" },
  { id: "bookings",     label: "Taking bookings" },
  { id: "payments",     label: "Payments & earnings" },
  { id: "team",         label: "Team members" },
  { id: "faq",          label: "FAQ" },
];

export function StickyNav() {
  const [active, setActive] = useState("quick-start");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
      );

      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <nav className="hidden lg:block sticky top-24 self-start w-52 shrink-0">
      <p className="text-[10px] font-bold text-sage-leaf uppercase tracking-[0.15em] mb-4">
        On this page
      </p>
      <ul className="space-y-0.5">
        {SECTIONS.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className={cn(
                "block px-3 py-2 rounded-xl text-sm font-nunito transition-colors duration-150",
                active === id
                  ? "bg-groomr-gold/20 text-deep-slate font-bold"
                  : "text-pebble-grey hover:text-deep-slate hover:bg-pebble-grey/10"
              )}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-8 pt-6 border-t border-pebble-grey/15 space-y-3">
        <p className="text-[10px] font-bold text-sage-leaf uppercase tracking-[0.15em]">
          Still stuck?
        </p>
        <a
          href="/support"
          className="block text-sm font-nunito text-pebble-grey hover:text-deep-slate transition-colors"
        >
          Contact support →
        </a>
        <a
          href="mailto:support@groomr.uk"
          className="block text-sm font-nunito text-pebble-grey hover:text-deep-slate transition-colors"
        >
          support@groomr.uk
        </a>
      </div>
    </nav>
  );
}
