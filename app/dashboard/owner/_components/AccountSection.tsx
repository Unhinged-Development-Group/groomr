"use client";

import { useState, useTransition } from "react";
import { CloseAccountModal } from "@/app/_components/CloseAccountModal";
import { updateSMSPreference, updateOwnerPhone } from "@/app/actions/sms-preferences";

interface Props {
  initialSMSEnabled: boolean;
  initialPhone: string | null;
}

export function AccountSection({ initialSMSEnabled, initialPhone }: Props) {
  const [open, setOpen] = useState(false);

  // Phone
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [savedPhone, setSavedPhone] = useState(initialPhone ?? "");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSaved, setPhoneSaved] = useState(false);

  // SMS toggle
  const [smsEnabled, setSmsEnabled] = useState(initialSMSEnabled);
  const [isPending, startTransition] = useTransition();

  const isDirty = phone !== savedPhone;

  async function handlePhoneSave() {
    setPhoneError(null);
    setPhoneSaved(false);
    setPhoneSaving(true);
    const result = await updateOwnerPhone(phone);
    setPhoneSaving(false);
    if (!result.ok) {
      setPhoneError(result.error ?? "Failed to save");
    } else {
      setSavedPhone(phone);
      setPhoneSaved(true);
      setTimeout(() => setPhoneSaved(false), 3000);
    }
  }

  function handleToggle() {
    const next = !smsEnabled;
    setSmsEnabled(next);
    startTransition(async () => {
      const result = await updateSMSPreference(next);
      if (!result.ok) setSmsEnabled(!next);
    });
  }

  return (
    <section className="mt-12 pt-8 border-t border-pebble-grey/20">
      <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey mb-4">Account</p>

      {/* Mobile number */}
      <div className="max-w-sm mb-6">
        <label className="block text-sm font-bold text-deep-slate mb-1">Mobile number</label>
        <p className="text-xs text-pebble-grey mb-2">
          Used for SMS reminders. UK numbers only — e.g. +44 7700 900000
        </p>
        <div className="flex gap-2">
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setPhoneError(null);
              setPhoneSaved(false);
            }}
            placeholder="+44 7700 900000"
            className="field flex-1 text-sm"
          />
          <button
            onClick={handlePhoneSave}
            disabled={phoneSaving || !isDirty}
            className="btn-primary text-sm px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {phoneSaving ? "Saving…" : phoneSaved ? "Saved!" : "Save"}
          </button>
        </div>
        {phoneError && <p className="text-xs text-muted-terracotta mt-1.5">{phoneError}</p>}
      </div>

      {/* SMS toggle */}
      <div className="flex items-center justify-between max-w-sm mb-2">
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
      {!savedPhone && (
        <p className="text-xs text-pebble-grey max-w-sm mb-1">
          Add a mobile number above to receive SMS reminders.
        </p>
      )}
      <p className="text-xs text-pebble-grey mb-8">
        You can also text <span className="font-bold">STOP</span> to opt out at any time.
      </p>

      {/* Close account */}
      <div className="pt-4 border-t border-pebble-grey/10">
        <button
          onClick={() => setOpen(true)}
          className="text-sm font-bold text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors px-4 py-2 rounded-full"
        >
          Close my Groomr account
        </button>
      </div>

      <CloseAccountModal open={open} onClose={() => setOpen(false)} role="owner" />
    </section>
  );
}
