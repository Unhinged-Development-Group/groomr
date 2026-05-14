"use client";

import { SignUpButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export function FooterCTA() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <Link
        href="/search"
        className="btn-gold-on-dark font-nunito font-bold px-8 py-3 rounded-full text-base focus-ring shadow-subtle inline-flex items-center"
      >
        Find a Groomer
      </Link>
    );
  }

  return (
    <SignUpButton mode="modal">
      <button className="btn-gold-on-dark font-nunito font-bold px-8 py-3 rounded-full text-base focus-ring shadow-subtle">
        Sign Up for Free
      </button>
    </SignUpButton>
  );
}
