"use client";

import Link from "next/link";
import { SignUpButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface BecomeGroomerCTAProps {
  label?: string;
  className?: string;
}

/**
 * Smart CTA for the groomer sign-up flow.
 *
 * - Signed OUT → opens Clerk sign-up modal; after account creation Clerk
 *   redirects straight to /register/groomer so the wizard starts immediately.
 * - Signed IN  → navigates directly to /register/groomer.
 */
export function BecomeGroomerCTA({
  label = "Become a Groomr — Free",
  className,
}: BecomeGroomerCTAProps) {
  const { isSignedIn, isLoaded } = useUser();

  const baseClass = cn(
    "btn-primary font-nunito font-bold px-7 py-3.5 rounded-full focus-ring shadow-subtle inline-flex items-center",
    className
  );

  // Don't render until Clerk has hydrated (avoids layout shift)
  if (!isLoaded) {
    return <div className={cn(baseClass, "opacity-0 pointer-events-none")}>{label}</div>;
  }

  if (isSignedIn) {
    return (
      <Link href="/register/groomer" className={baseClass}>
        {label}
      </Link>
    );
  }

  return (
    <SignUpButton mode="modal" forceRedirectUrl="/register/groomer">
      <button className={baseClass}>{label}</button>
    </SignUpButton>
  );
}
