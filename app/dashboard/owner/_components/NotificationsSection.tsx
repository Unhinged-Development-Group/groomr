"use client";

import { useState, useTransition } from "react";
import { updateSMSPreference } from "@/app/actions/sms-preferences";

interface Props {
  initialSMSEnabled: boolean;
}

export function NotificationsSection({ initialSMSEnabled }: Props) {
  const [smsEnabled, setSmsEnabled] = useState(initialSMSEnabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !smsEnabled;
    setSmsEnabled(next);
    startTransition(async () => {
      const result = await updateSMSPreference(next);
      if (!result.ok) {
        setSmsEnabled(!next); // revert on failure
      }
    });
  }

  return (
    <section className="mt-8 pt-8 border-t border-pebble-grey/20">
      <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey mb-4">Notifications</p>
      <div className="flex items-center justify-between max-w-sm">
        <div>
          <p className="text-sm font-bold text-deep-slate">SMS reminders</p>
          <p className="text-xs text-pebble-grey mt-0.5">
            Booking confirmations, cancellations &amp; 24h reminders
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={isPending}
          aria-checked={smsEnabled}
          role="switch"
          className={[
            "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus-ring",
            smsEnabled ? "bg-groomr-gold" : "bg-pebble-grey/40",
            isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          ].join(" ")}
        >
          <span
            className={[
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200",
              smsEnabled ? "translate-x-5" : "translate-x-0",
            ].join(" ")}
          />
        </button>
      </div>
      <p className="text-xs text-pebble-grey mt-3">
        You can also text <span className="font-bold">STOP</span> to opt out at any time.
      </p>
    </section>
  );
}
