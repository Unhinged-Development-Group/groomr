"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { PaymentMethodsPage } from "./PaymentMethodsPage";
import { ManageAccountPage } from "./ManageAccountPage";
import { MessagesNavButton } from "./MessagesNavButton";
import { NotificationsNavButton } from "./NotificationsNavButton";

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
      <polyline points="9 21 9 12 15 12 15 21" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
          aria-label="Dashboard"
          className="text-deep-slate hover:text-sage-leaf transition-colors focus-ring rounded p-1.5"
        >
          <HomeIcon />
        </Link>
        <MessagesNavButton />
        <NotificationsNavButton />
        <UserButton
          appearance={{
            elements: {
              avatarBox: "ring-1 ring-pebble-grey/20",
              avatarImage: "!bg-alabaster-cream",
              userButtonTrigger: "focus:!shadow-none",
            },
          }}
        >
          <UserButton.UserProfilePage
            label="Manage Account"
            url="manage-account"
            labelIcon={<SettingsIcon />}
          >
            <ManageAccountPage />
          </UserButton.UserProfilePage>
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
