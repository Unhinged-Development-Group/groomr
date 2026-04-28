import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import { HeaderAuthButtons } from "./_components/HeaderAuthButtons";
import "./globals.css";

export const metadata: Metadata = {
  title: "Groomr — Find local dog groomers",
  description:
    "Book your dog's next groom in minutes. Local, independent, verified groomers across the UK.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl="/">

      <html lang="en">
        <body>
          <SiteHeader />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}

function SiteHeader() {
  return (
    <header className="w-full bg-alabaster-cream/95 backdrop-blur border-b border-pebble-grey/20 sticky top-0 z-40">
      <div className="w-full px-6 lg:px-12 xl:px-20 py-4 flex justify-between items-center gap-4">
        {/* Logo */}
        <Link href="/" className="focus-ring rounded-lg inline-block shrink-0">
          <span className="font-fredoka text-2xl text-deep-slate tracking-tight leading-none">
            Groomr
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/become-a-groomer"
            className="font-nunito font-bold text-sm text-pebble-grey hover:text-deep-slate transition-colors"
          >
            Become a Groomr
          </Link>
        </nav>

        {/* Auth — client component handles signed-in/out state */}
        <div className="flex items-center gap-3">
          <HeaderAuthButtons />
        </div>
      </div>
    </header>
  );
}
