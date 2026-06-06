"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { updateUserProfile } from "@/app/actions/admin";
import type { AdminUserRow } from "@/app/actions/admin";

interface Props {
  user: AdminUserRow;
  onClose: () => void;
  onSaved: (updated: Partial<AdminUserRow>) => void;
}

export function UserEditModal({ user, onClose, onSaved }: Props) {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [isActive, setIsActive] = useState(user.is_active);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const res = await updateUserProfile(user.profile_id, {
        full_name: fullName || undefined,
        email: email || undefined,
        phone: phone || null,
        is_active: isActive,
      });
      if ("error" in res) {
        setToast(res.error);
        return;
      }
      onSaved({ full_name: fullName || null, email: email || null, phone: phone || null, is_active: isActive });
      setToast("Saved.");
    });
  }

  return (
    <>
      <Modal open onClose={onClose}>
        <div className="space-y-5">
          <div className="pb-3 border-b border-pebble-grey/10">
            <h2 className="font-fredoka text-2xl text-deep-slate">Edit owner</h2>
            <p className="text-sm text-pebble-grey font-bold mt-0.5">{user.email}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Full name</label>
              <input className="field w-full" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Email</label>
              <input type="email" className="field w-full" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
              <p className="text-[11px] text-pebble-grey mt-1">Updates the Supabase profile. Clerk authentication email is separate.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Phone</label>
              <input type="tel" className="field w-full" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 900000" />
            </div>
            <div>
              <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-2">Account status</label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-groomr-gold" />
                <span className="text-sm font-bold text-deep-slate">Account active</span>
              </label>
              {!isActive && (
                <p className="text-xs text-muted-terracotta font-bold mt-1">Deactivating will prevent this owner from logging in.</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-pebble-grey/10">
            <button onClick={onClose} className="btn-secondary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring">
              Cancel
            </button>
            <button onClick={handleSave} disabled={pending} className="btn-primary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring disabled:opacity-40">
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </Modal>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
