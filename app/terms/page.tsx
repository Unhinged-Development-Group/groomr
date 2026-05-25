import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Groomr",
};

const documents = [
  {
    title: "Platform Terms of Service",
    description:
      "General terms that apply to all users of the Groomr platform, including acceptable use, liability, and dispute resolution.",
    href: "/terms/platform",
  },
  {
    title: "Pet Owner Terms",
    description:
      "Terms specific to pet owners booking grooming services through Groomr, including booking policies and owner responsibilities.",
    href: "/terms/owner",
  },
  {
    title: "Groomer Terms",
    description:
      "Terms for professional groomers listed on Groomr, covering service standards, payments, and groomer obligations.",
    href: "/terms/groomer",
  },
];

export default function TermsHubPage() {
  return (
    <div className="page-fade w-full flex justify-center py-16 px-6 md:px-12">
      <div className="max-w-3xl w-full space-y-10">
        <div className="space-y-3">
          <h1 className="font-fredoka text-4xl lg:text-5xl text-deep-slate">
            Terms of Service
          </h1>
          <p className="font-nunito text-pebble-grey text-lg">
            Please read the terms that apply to you. By using Groomr you agree
            to the Platform Terms, plus whichever role-specific terms cover your
            use of the service.
          </p>
        </div>

        <div className="space-y-4">
          {documents.map(({ title, description, href }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start justify-between gap-6 bg-white rounded-2xl p-6 shadow-sm border border-pebble-grey/20 hover:border-groomr-gold hover:shadow-md transition-all focus-ring"
            >
              <div className="space-y-1">
                <h2 className="font-fredoka text-xl text-deep-slate group-hover:text-groomr-gold transition-colors">
                  {title}
                </h2>
                <p className="font-nunito text-sm text-pebble-grey leading-relaxed">
                  {description}
                </p>
              </div>
              <span className="shrink-0 text-pebble-grey group-hover:text-groomr-gold transition-colors mt-1">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
