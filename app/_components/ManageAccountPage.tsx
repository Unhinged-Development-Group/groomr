"use client";

import { useState, useEffect, useTransition } from "react";
import { getOwnerContactPrefs, updateOwnerPhone, updateSMSPreference } from "@/app/actions/sms-preferences";
import { CloseAccountModal } from "@/app/_components/CloseAccountModal";

export function ManageAccountPage() {
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [savedPhone, setSavedPhone] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [isGroomer, setIsGroomer] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [closeOpen, setCloseOpen] = useState(false);

  useEffect(() => {
    getOwnerContactPrefs().then((prefs) => {
      setSmsEnabled(prefs.smsEnabled);
      setPhone(prefs.phone ?? "");
      setSavedPhone(prefs.phone ?? "");
      setIsGroomer(prefs.isGroomer);
      setLoading(false);
    });
  }, []);

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
    <div className="font-nunito">
      <h1 className="font-fredoka text-2xl text-deep-slate mb-1">Manage Account</h1>
      <p className="text-sm text-pebble-grey mb-6">Contact details and notification preferences.</p>

      {loading ? (
        <div className="py-8 text-center text-sm text-pebble-grey">Loading…</div>
      ) : (
        <>
          {/* Mobile number */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-deep-slate mb-1">Mobile number</label>
            <p className="text-xs text-pebble-grey mb-2">
              UK numbers only — e.g. +44 7700 900000
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
                className="flex-1 border border-pebble-grey/30 rounded-lg px-3 py-2 text-sm font-nunito text-deep-slate focus:outline-none focus:ring-2 focus:ring-groomr-gold"
              />
              <button
                onClick={handlePhoneSave}
                disabled={phoneSaving || !isDirty}
                className="bg-groomr-gold text-deep-slate font-nunito font-bold text-sm px-4 rounded-full hover:bg-[#d4ce4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {phoneSaving ? "Saving…" : phoneSaved ? "Saved!" : "Save"}
              </button>
            </div>
            {phoneError && <p className="text-xs text-muted-terracotta mt-1.5">{phoneError}</p>}
          </div>

          {/* SMS toggle */}
          <div className="flex items-center justify-between mb-2">
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
                "relative inline-flex h-6 w-11 flex-shrink-0 ml-4 rounded-full border-2 border-transparent transition-colors duration-200",
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
            <p className="text-xs text-pebble-grey mb-1">
              Add a mobile number above to receive SMS reminders.
            </p>
          )}
          <p className="text-xs text-pebble-grey mb-8">
            Text <span className="font-bold">STOP</span> to opt out at any time.
          </p>

          {/* Close account */}
          <div className="pt-4 border-t border-pebble-grey/10">
            <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey mb-3">Danger zone</p>
            <button
              onClick={() => setCloseOpen(true)}
              className="text-sm font-bold text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors px-4 py-2 rounded-full -ml-4"
            >
              Close my Groomr account
            </button>
          </div>

          <CloseAccountModal
            open={closeOpen}
            onClose={() => setCloseOpen(false)}
            role={isGroomer ? "groomer" : "owner"}
          />
        </>
      )}
    </div>
  );
}
