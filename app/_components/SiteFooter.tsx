import Image from "next/image";
import Link from "next/link";
import { FooterCTA } from "./FooterCTA";

export function SiteFooter() {
  return (
    <footer className="w-full bg-deep-slate pt-8 pb-6 md:pt-12 md:pb-8 border-t-[8px] border-groomr-gold mt-auto">
      <div className="w-full px-6 lg:px-12 xl:px-20 space-y-6 md:space-y-10">
        {/* CTA band */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8 text-center md:text-left">
          <h3 className="font-fredoka text-2xl md:text-3xl text-groomr-gold max-w-md">
            Your dog&apos;s best day starts here.
          </h3>
          <FooterCTA />
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-sage-leaf/40" />

        {/* Logo + nav */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="focus-ring rounded-lg inline-block shrink-0">
            <Image
              src="/assets/horizontal-lockup-groomr-gold.png"
              alt="Groomr"
              height={28}
              width={105}
              className="h-7 w-auto object-contain opacity-90"
              style={{ width: "auto" }}
            />
          </Link>

          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 md:gap-6 text-sm font-bold tracking-[0.1em] uppercase text-sage-leaf">
            {[
              { label: "Our Founder", href: "/founder" },
              { label: "For Groomers", href: "/become-a-groomer" },
              { label: "Groomer Help", href: "/groomer-help" },
              { label: "Privacy", href: "/privacy-policy" },
              { label: "Cookies", href: "/cookie-policy" },
              { label: "Terms", href: "/terms" },
              { label: "Acceptable Use", href: "/acceptable-use" },
              { label: "Support", href: "/support" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="hover:text-groomr-gold transition-colors focus-ring rounded"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Copyright */}
        <p className="text-xs text-pebble-grey/60 text-center md:text-left pt-2">
          © 2026 Groomr. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
