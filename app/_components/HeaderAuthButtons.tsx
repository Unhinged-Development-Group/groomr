"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

export function HeaderAuthButtons() {
  const { isSignedIn, isLoaded } = useUser();

  // Don't flash anything until Clerk has hydrated
  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <>
        <Link
          href="/dashboard"
          className="hidden md:inline-flex font-nunito font-bold text-sm text-deep-slate hover:text-sage-leaf transition-colors focus-ring rounded px-2 py-1"
        >
          Dashboard
        </Link>
        <UserButton />
      </>
    );
  }

  return (
    <>
      <SignInButton mode="modal" forceRedirectUrl="/dashboard">
        <button className="hidden md:inline-flex font-nunito font-bold text-deep-slate hover:text-sage-leaf transition-colors focus-ring rounded px-2 py-1 text-sm">
          Log In
        </button>
      </SignInButton>
      <SignUpButton mode="modal" forceRedirectUrl="/dashboard/owner">
        <button className="btn-primary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring">
          Sign Up
        </button>
      </SignUpButton>
    </>
  );
}
