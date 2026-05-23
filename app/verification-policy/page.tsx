import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Groomer Verification Policy — Groomr",
  description: "What Groomr checks before awarding the verified badge to groomers on our platform.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-fredoka text-2xl text-deep-slate border-b border-pebble-grey/20 pb-2">{title}</h2>
      {children}
    </section>
  );
}

function Req({ number, title, required, children }: { number: string; title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 p-5 bg-white border border-pebble-grey/15 rounded-2xl">
      <div className="w-9 h-9 rounded-xl bg-deep-slate text-alabaster-cream font-fredoka text-lg flex items-center justify-center shrink-0">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="font-bold text-deep-slate">{title}</p>
          {required !== undefined && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${required ? "bg-sage-leaf/15 text-sage-leaf" : "bg-pebble-grey/15 text-pebble-grey"}`}>
              {required ? "Required" : "Conditional"}
            </span>
          )}
        </div>
        <div className="text-sm text-deep-slate/80 space-y-1">{children}</div>
      </div>
    </div>
  );
}

export default function VerificationPolicyPage() {
  return (
    <div className="min-h-screen bg-alabaster-cream">
      {/* Letterhead */}
      <header className="bg-deep-slate text-alabaster-cream">
        <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <Link href="/" className="font-fredoka text-3xl text-groomr-gold hover:opacity-80 transition-opacity">
              Groomr
            </Link>
            <p className="text-alabaster-cream/60 text-sm font-bold mt-1">
              Connecting dog owners with trusted groomers
            </p>
          </div>
          <div className="text-right text-sm text-alabaster-cream/60 font-bold">
            <p>Groomr — Unhinged Development Group Ltd</p>
            <p className="mt-0.5">Version 1.0 · May 2026</p>
          </div>
        </div>
      </header>

      {/* Document */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        {/* Title block */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-leaf">Policy Document</p>
          <h1 className="font-fredoka text-4xl md:text-5xl text-deep-slate leading-tight">
            Groomer Verification Policy
          </h1>
          <p className="text-pebble-grey font-bold">
            What we check before awarding the Groomr verified badge — and what it means for your customers.
          </p>
        </div>

        {/* Why we verify */}
        <Section title="Why We Verify">
          <p className="text-sm text-deep-slate/80">
            Dog grooming in the UK is an unregulated industry. There is no national licensing requirement
            and no mandatory qualification — anyone can call themselves a groomer. Groomr&apos;s verified
            badge exists to give dog owners confidence that the groomer they&apos;re booking has the right
            training, insurance, and safeguards in place.
          </p>
          <p className="text-sm text-deep-slate/80">
            Verification is not a rubber stamp. It means we have reviewed your documents directly.
            An unverified profile can still list on Groomr, but will not carry the badge and may have
            lower visibility in search results.
          </p>
        </Section>

        {/* What we check */}
        <Section title="What We Check">
          <div className="space-y-3">

            <Req number="1" title="Public Liability Insurance" required={true}>
              <ul className="list-disc list-inside space-y-1 text-deep-slate/75">
                <li>Minimum £1,000,000 cover</li>
                <li>Must be current — not expired</li>
                <li>Must explicitly cover professional dog grooming activities</li>
                <li>We accept a certificate of insurance or cover note from the insurer</li>
              </ul>
            </Req>

            <Req number="2" title="Professional Grooming Qualification" required={true}>
              <p className="text-deep-slate/75 mb-1">Minimum Level 2 qualification in dog grooming from an accredited body.</p>
              <p className="font-bold text-deep-slate text-xs uppercase tracking-wider mb-1">Accepted qualifications</p>
              <ul className="list-disc list-inside space-y-1 text-deep-slate/75">
                <li>City &amp; Guilds (any level in dog grooming)</li>
                <li>iPET Network Level 3 Diploma in Dog Grooming and Salon Management</li>
                <li>iPET Network Level 4 Higher Professional Diploma in Dog Grooming</li>
                <li>Open College Network West Midlands (OCNWM) Level 3 Diploma</li>
                <li>ST0943 Dog Groomer Apprenticeship Standard (completion certificate)</li>
                <li>Any equivalent Ofqual-regulated award at Level 2 or above</li>
              </ul>
              <p className="text-deep-slate/75 mt-2">We accept the original certificate or official transcript showing the awarding body and level.</p>
            </Req>

            <Req number="3" title="Canine First Aid Certification" required={true}>
              <ul className="list-disc list-inside space-y-1 text-deep-slate/75">
                <li>Must be a recognised canine or pet first aid course — human first aid alone is not accepted</li>
                <li>Accepted: iPET Network Level 3 Award in Canine First Aid, OFQUAL Level 3 Pet First Aid, or equivalent</li>
                <li>Certificates must be dated within the last 3 years</li>
                <li>We accept the certificate showing course name, awarding body, and completion date</li>
              </ul>
            </Req>

            <Req number="4" title="Government-Issued Photo ID" required={true}>
              <ul className="list-disc list-inside space-y-1 text-deep-slate/75">
                <li>UK passport or UK driving licence</li>
                <li>Used to confirm the person matches the business registration</li>
                <li>We do not store ID documents beyond verification — they are reviewed and discarded immediately</li>
              </ul>
            </Req>

            <Req number="5" title="Employers' Liability Insurance" required={false}>
              <p className="text-deep-slate/75">
                Required only if you employ any staff. UK law mandates a minimum of £5,000,000 cover.
                We will ask during onboarding whether your business has employees. This must be renewed
                annually in line with your policy.
              </p>
            </Req>

          </div>
        </Section>

        {/* Recommended */}
        <Section title="Recommended (Not Currently Required)">
          <p className="text-sm text-deep-slate/80">
            The following are not required for the verified badge but we strongly encourage all groomers
            to obtain them. We may upgrade these to required status in a future version of this policy.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { t: "Professional Indemnity Insurance", d: "Covers negligence claims beyond public liability" },
              { t: "Equipment & Stock Insurance",       d: "Covers tools, tables, dryers, and salon equipment" },
              { t: "Local Council Licence",             d: "Some councils require this — check with your local authority" },
              { t: "BIGA / PIF Membership",             d: "British Isles Grooming Association or Pet Industry Federation" },
            ].map(item => (
              <div key={item.t} className="bg-white border border-pebble-grey/15 rounded-xl p-4">
                <p className="font-bold text-deep-slate text-sm">{item.t}</p>
                <p className="text-xs text-pebble-grey mt-1">{item.d}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* The process */}
        <Section title="The Verification Process">
          <ol className="space-y-3">
            {[
              "Submit your documents via your dashboard after completing registration.",
              "The Groomr team reviews your documents within 3–5 working days.",
              "If anything is missing or unclear, we'll contact you by email with specifics.",
              "On approval, the verified badge appears on your public profile immediately.",
              "Insurance certificates must be re-submitted annually. First aid certificates every 3 years. We send reminders before expiry.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-deep-slate/80">
                <span className="w-6 h-6 rounded-full bg-groomr-gold text-deep-slate font-fredoka text-sm flex items-center justify-center shrink-0">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </Section>

        {/* Revocation */}
        <Section title="Loss of Verification">
          <p className="text-sm text-deep-slate/80">Verification will be revoked if any of the following occur:</p>
          <ul className="space-y-2">
            {[
              "Insurance lapses and is not renewed within 14 days of expiry.",
              "A first aid certificate expires and is not renewed within 30 days.",
              "A complaint is upheld that suggests documents submitted were fraudulent or misrepresented.",
              "A groomer operates in a materially different way to what was declared (e.g. hires staff without obtaining employers' liability insurance).",
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-deep-slate/80">
                <span className="text-muted-terracotta font-bold shrink-0">×</span>
                {item}
              </li>
            ))}
          </ul>
          <div className="bg-alabaster-cream border border-pebble-grey/20 rounded-xl p-4 text-sm text-deep-slate/80">
            A groomer whose verification is revoked will have their profile hidden from search results until
            verification is reinstated. They retain their account and booking history throughout.
          </div>
        </Section>

        {/* Animal welfare */}
        <Section title="Animal Welfare Baseline">
          <p className="text-sm text-deep-slate/80">
            All groomers on Groomr — verified or not — agree at registration to operate in compliance
            with the <strong className="text-deep-slate">Animal Welfare Act 2006</strong> and the Five Freedoms framework:
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              "Freedom from hunger, thirst, and malnutrition",
              "Freedom from discomfort",
              "Freedom from pain, injury, and disease",
              "Freedom to express normal behaviour",
              "Freedom from fear or distress",
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-2 bg-sage-leaf/10 border border-sage-leaf/20 rounded-xl px-3 py-2">
                <span className="text-sage-leaf font-bold text-sm shrink-0">✓</span>
                <span className="text-sm text-deep-slate">{f}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-deep-slate/80">
            Any credible report of mistreatment will result in immediate suspension pending investigation,
            regardless of verification status.
          </p>
        </Section>

        {/* Contact / footer */}
        <div className="border-t border-pebble-grey/20 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-pebble-grey font-bold">
          <div>
            <p>Questions about verification?</p>
            <a href="mailto:verify@groomr.co" className="text-sage-leaf hover:underline">verify@groomr.co</a>
          </div>
          <div className="text-right">
            <p>Groomr · Version 1.0 · May 2026</p>
            <p className="font-normal text-pebble-grey/70 text-xs mt-0.5">Policy subject to review. Groomers will be notified of material changes.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
