"use client";

import { CloseIcon } from "@/components/ui/GroomrIcons";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ open, onClose, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 modal-backdrop cursor-pointer"
      />
      <div
        className={cn(
          "relative bg-alabaster-cream w-full rounded-[24px] p-8 md:p-10 shadow-modal z-10 border border-pebble-grey/20 max-h-[90vh] overflow-y-auto",
          sizeClasses[size]
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 text-pebble-grey hover:text-muted-terracotta transition-colors focus-ring rounded-full p-2 bg-white shadow-subtle border border-pebble-grey/10"
        >
          <CloseIcon size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
