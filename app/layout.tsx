import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { HeaderAuthButtons } from "./_components/HeaderAuthButtons";
import { SiteFooter } from "./_components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Groomr — Find local dog groomers",
  description:
    "Book your dog's next groom in minutes. Local, independent, verified groomers across the UK.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl="/">

      <html lang="en">
        <body>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
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
          <Image
            src="/assets/horizontal-lockup-deep-slate.png"
            alt="Groomr"
            height={32}
            width={120}
            className="h-8 w-auto object-contain"
            style={{ width: "auto" }}
            priority
          />
        </Link>

        {/* Auth — client component handles signed-in/out state */}
        <div className="flex items-center gap-3">
          <HeaderAuthButtons />
        </div>
      </div>
    </header>
  );
}
