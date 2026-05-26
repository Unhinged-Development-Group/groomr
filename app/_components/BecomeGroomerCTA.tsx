"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface BecomeGroomerCTAProps {
  label?: string;
  className?: string;
}

/**
 * Smart CTA for the groomer sign-up flow.
 *
 * Both signed-in and signed-out users are sent directly to /register/groomer.
 * The wizard handles auth state itself:
 *   - Signed OUT → Step 0 shows an inline Clerk <SignUp> widget (no popup)
 *   - Signed IN  → wizard starts at Step 1 (account step is skipped)
 */
export function BecomeGroomerCTA({
  label = "Become a Groomr — Free",
  className,
}: BecomeGroomerCTAProps) {
  const { isLoaded } = useUser();

  const baseClass = cn(
    "btn-primary font-nunito font-bold px-7 py-3.5 rounded-full focus-ring shadow-subtle inline-flex items-center",
    className
  );

  // Don't render until Clerk has hydrated (avoids layout shift)
  if (!isLoaded) {
    return <div className={cn(baseClass, "opacity-0 pointer-events-none")}>{label}</div>;
  }

  return (
    <Link href="/register/groomer" className={baseClass}>
      {label}
    </Link>
  );
}
