"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { PaymentMethodsPage } from "./PaymentMethodsPage";

function CreditCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

export function HeaderAuthButtons() {
  const { isSignedIn, isLoaded } = useUser();

  // Don't flash anything until Clerk has hydrated
  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <>
        <Link
          href="/dashboard"
          className="font-nunito font-bold text-sm text-deep-slate hover:text-sage-leaf transition-colors focus-ring rounded px-2 py-1"
        >
          Dashboard
        </Link>
        <UserButton>
          <UserButton.UserProfilePage
            label="Payment Methods"
            url="payment-methods"
            labelIcon={<CreditCardIcon />}
          >
            <PaymentMethodsPage />
          </UserButton.UserProfilePage>
        </UserButton>
      </>
    );
  }

  return (
    <>
      <SignInButton mode="modal" forceRedirectUrl="/dashboard">
        <button className="font-nunito font-bold text-deep-slate hover:text-sage-leaf transition-colors focus-ring rounded px-2 py-1 text-sm">
          Log In
        </button>
      </SignInButton>
      <SignUpButton mode="modal" forceRedirectUrl="/dashboard/owner">
        <button className="btn-primary font-nunito font-bold px-4 py-2 rounded-full text-sm focus-ring">
          Sign Up
        </button>
      </SignUpButton>
    </>
  );
}
