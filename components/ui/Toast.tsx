"use client";

import { Check } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
  message?: string | null;
  onDismiss?: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onDismiss?.(), 3500);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] toast-in">
      <div className="bg-deep-slate text-alabaster-cream font-bold px-5 py-3 rounded-full shadow-modal flex items-center gap-2 border-t-2 border-groomr-gold">
        <Check size={16} />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}
