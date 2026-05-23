"use client";

import { useState } from "react";
import { CloseAccountModal } from "@/app/_components/CloseAccountModal";

export function AccountSection() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-12 pt-8 border-t border-pebble-grey/20">
      <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey mb-3">Account</p>
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-bold text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors px-4 py-2 rounded-full"
      >
        Close my Groomr account
      </button>
      <CloseAccountModal open={open} onClose={() => setOpen(false)} role="owner" />
    </section>
  );
}
