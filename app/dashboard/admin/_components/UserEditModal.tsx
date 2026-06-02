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
  const [isAdmin, setIsAdmin] = useState(user.is_admin);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateUserProfile(user.profile_id, {
        full_name: fullName,
        email,
        is_admin: isAdmin,
      });
      if ("error" in result) {
        setToast(result.error);
      } else {
        setToast("Saved.");
        onSaved({ full_name: fullName, email, is_admin: isAdmin });
        setTimeout(onClose, 800);
      }
    });
  }

  return (
    <>
      <Modal open onClose={onClose}>
        <div className="space-y-4">
          <h2 className="font-fredoka text-2xl text-deep-slate">Edit user</h2>
          <div>
            <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Full name</label>
            <input className="field w-full" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-pebble-grey uppercase tracking-wider mb-1">Email</label>
            <input className="field w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="w-4 h-4 accent-groomr-gold rounded"
            />
            <div>
              <span className="text-sm font-bold text-deep-slate">Admin access</span>
              <p className="text-xs text-pebble-grey">Grants full platform control. Use with care.</p>
            </div>
          </label>
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
