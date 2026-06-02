"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { updateGroomerProfile } from "@/app/actions/admin";
import type { AdminGroomerRow } from "@/app/actions/admin";

interface Props {
  groomer: AdminGroomerRow;
  onClose: () => void;
  onSaved: (updated: Partial<AdminGroomerRow>) => void;
}

export function GroomerEditModal({ groomer, onClose, onSaved }: Props) {
  const [businessName, setBusinessName] = useState(groomer.business_name);
  const [isListed, setIsListed] = useState(groomer.is_listed);
  const [isVerified, setIsVerified] = useState(groomer.is_verified);
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateGroomerProfile(groomer.groomer_profile_id, {
        business_name: businessName,
        is_listed: isListed,
        is_verified: isVerified,
        city: city || undefined,
        postcode: postcode || undefined,
      });
      if ("error" in result) {
        setToast(result.error);
      } else {
        setToast("Saved.");
        onSaved({ business_name: businessName, is_listed: isListed, is_verified: isVerified });
        setTimeout(onClose, 800);
      }
    });
  }

  return (
    <>
      <Modal open onClose={onClose}>
        <div className="space-y-4">
          <h2 className="font-fredoka text-2xl text-deep-slate">Edit groomer</h2>
          <div>
            <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Business name</label>
            <input className="field w-full" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">City</label>
            <input className="field w-full" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Edinburgh" />
          </div>
          <div>
            <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Postcode</label>
            <input className="field w-full" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="e.g. EH1 1AB" />
          </div>
          <div className="flex flex-col gap-3 pt-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isListed}
                onChange={(e) => setIsListed(e.target.checked)}
                className="w-4 h-4 accent-groomr-gold rounded"
              />
              <span className="text-sm font-bold text-deep-slate">Listed in search results</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="w-4 h-4 accent-groomr-gold rounded"
              />
              <span className="text-sm font-bold text-deep-slate">Verified</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button className="btn-secondary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-primary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring"
              onClick={handleSave}
              disabled={pending}
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
