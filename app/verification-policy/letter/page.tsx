"use client";

import Link from "next/link";

export default function VerificationPolicyLetterPage() {
  return (
    <>
      {/* Print button — hidden when printing */}
      <div className="print:hidden bg-deep-slate text-alabaster-cream px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/verification-policy" className="text-sm font-bold text-alabaster-cream/70 hover:text-alabaster-cream transition-colors">
          ← Back to web version
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-groomr-gold text-deep-slate font-nunito font-bold px-5 py-2 rounded-full text-sm hover:bg-groomr-gold/80 transition-colors"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* A4 letter */}
      <div className="min-h-screen bg-pebble-grey/20 print:bg-white py-10 print:py-0 flex justify-center print:block">
        <div
          className="bg-white w-full print:w-auto print:shadow-none shadow-2xl"
          style={{ maxWidth: "210mm", minHeight: "297mm", padding: "18mm 20mm 20mm" }}
        >

          {/* ── Letterhead ── */}
          <div className="flex items-start justify-between pb-6 border-b-4 border-deep-slate mb-8">
            <div>
              <p className="font-fredoka text-4xl text-deep-slate leading-none">Groomr</p>
              <p className="text-xs text-pebble-grey font-bold mt-1 tracking-wide">
                Connecting dog owners with trusted groomers
              </p>
              <p className="text-xs text-pebble-grey mt-0.5">groomr.co</p>
            </div>
            <div className="text-right text-xs text-pebble-grey font-bold space-y-0.5">
              <p>Unhinged Development Group Ltd</p>
              <p>verify@groomr.co</p>
              <p>groomr.co</p>
            </div>
          </div>

          {/* ── Document meta ── */}
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage-leaf mb-1">Policy Document</p>
              <h1 className="font-fredoka text-3xl text-deep-slate leading-tight">
                Groomer Verification Policy
              </h1>
            </div>
            <div className="text-right text-xs text-pebble-grey font-bold space-y-0.5 shrink-0 ml-6">
              <p>Version 1.0</p>
              <p>May 2026</p>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="text-sm text-deep-slate space-y-7 leading-relaxed">

            {/* 1. Purpose */}
            <section>
              <h2 className="font-fredoka text-xl text-deep-slate mb-2 pb-1 border-b border-pebble-grey/25">
                1. Purpose
              </h2>
              <p>
                Dog grooming in the United Kingdom is an unregulated industry. No national licence is required,
                and no qualification is mandated by law — any person may hold themselves out as a professional
                groomer without checks of any kind. Groomr&apos;s <strong>Verified</strong> badge exists to remedy
                this gap and give dog owners confidence that the professional they are booking has the appropriate
                training, insurance, and safeguards in place.
              </p>
              <p className="mt-2">
                Verification is not a ceremonial stamp. It means that Groomr has reviewed each groomer&apos;s
                documents directly, confirmed their validity, and is satisfied that the requirements set out in
                this policy have been met at the time of approval. A groomer whose profile does not carry the
                verified badge may still list and trade on the platform but will not benefit from the associated
                search prominence or trust signal.
              </p>
            </section>

            {/* 2. Required documents */}
            <section>
              <h2 className="font-fredoka text-xl text-deep-slate mb-3 pb-1 border-b border-pebble-grey/25">
                2. Required Documents
              </h2>
              <p className="mb-3">
                The following documents are required from every groomer before the verified badge is awarded.
                Documents must be current, unaltered, and in English or accompanied by a certified translation.
              </p>

              <div className="space-y-4">

                <div className="border border-pebble-grey/25 rounded-lg overflow-hidden">
                  <div className="bg-deep-slate text-alabaster-cream px-4 py-2 flex items-center gap-3">
                    <span className="font-fredoka text-lg w-6 text-center">1</span>
                    <span className="font-bold text-sm">Public Liability Insurance</span>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-sage-leaf/30 text-sage-leaf px-2 py-0.5 rounded-full">Required</span>
                  </div>
                  <div className="px-4 py-3 text-xs space-y-1">
                    <p>Minimum cover: <strong>£1,000,000</strong>. The policy must be current and must explicitly cover professional dog grooming activities.</p>
                    <p>We accept a certificate of insurance or cover note issued directly by the insurer.</p>
                  </div>
                </div>

                <div className="border border-pebble-grey/25 rounded-lg overflow-hidden">
                  <div className="bg-deep-slate text-alabaster-cream px-4 py-2 flex items-center gap-3">
                    <span className="font-fredoka text-lg w-6 text-center">2</span>
                    <span className="font-bold text-sm">Professional Grooming Qualification</span>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-sage-leaf/30 text-sage-leaf px-2 py-0.5 rounded-full">Required</span>
                  </div>
                  <div className="px-4 py-3 text-xs space-y-1">
                    <p>Minimum <strong>Level 2</strong> qualification in dog grooming from an Ofqual-regulated or equivalent awarding body.</p>
                    <p>Accepted awarding bodies: City &amp; Guilds; iPET Network (Level 3 Diploma, Level 4 Higher Professional Diploma); Open College Network West Midlands (OCNWM); ST0943 Dog Groomer Apprenticeship Standard.</p>
                    <p>We accept the original certificate or official transcript showing the awarding body, qualification title, and level.</p>
                  </div>
                </div>

                <div className="border border-pebble-grey/25 rounded-lg overflow-hidden">
                  <div className="bg-deep-slate text-alabaster-cream px-4 py-2 flex items-center gap-3">
                    <span className="font-fredoka text-lg w-6 text-center">3</span>
                    <span className="font-bold text-sm">Canine First Aid Certification</span>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-sage-leaf/30 text-sage-leaf px-2 py-0.5 rounded-full">Required</span>
                  </div>
                  <div className="px-4 py-3 text-xs space-y-1">
                    <p>Must be a recognised canine or pet first aid course. Human first aid qualification alone is not accepted.</p>
                    <p>Accepted: iPET Network Level 3 Award in Canine First Aid; Ofqual Level 3 Pet First Aid; or equivalent.</p>
                    <p>Certificates must be dated within the previous <strong>3 years</strong>. We accept the certificate showing course name, awarding body, and completion date.</p>
                  </div>
                </div>

                <div className="border border-pebble-grey/25 rounded-lg overflow-hidden">
                  <div className="bg-deep-slate text-alabaster-cream px-4 py-2 flex items-center gap-3">
                    <span className="font-fredoka text-lg w-6 text-center">4</span>
                    <span className="font-bold text-sm">Government-Issued Photo ID</span>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-sage-leaf/30 text-sage-leaf px-2 py-0.5 rounded-full">Required</span>
                  </div>
                  <div className="px-4 py-3 text-xs space-y-1">
                    <p>UK passport or UK driving licence. Used solely to confirm that the applicant matches their business registration.</p>
                    <p>ID documents are not retained beyond the verification review. They are inspected and discarded immediately upon completion.</p>
                  </div>
                </div>

                <div className="border border-pebble-grey/25 rounded-lg overflow-hidden">
                  <div className="bg-deep-slate text-alabaster-cream px-4 py-2 flex items-center gap-3">
                    <span className="font-fredoka text-lg w-6 text-center">5</span>
                    <span className="font-bold text-sm">Employers&apos; Liability Insurance</span>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-pebble-grey/30 text-pebble-grey px-2 py-0.5 rounded-full">Conditional</span>
                  </div>
                  <div className="px-4 py-3 text-xs space-y-1">
                    <p>Required only where the groomer employs any member of staff. UK law mandates a minimum of <strong>£5,000,000</strong> cover.</p>
                    <p>Groomr asks whether a business has employees during registration. This requirement must be met before the verified badge is awarded in such cases.</p>
                  </div>
                </div>

              </div>
            </section>

            {/* 3. Recommended */}
            <section>
              <h2 className="font-fredoka text-xl text-deep-slate mb-2 pb-1 border-b border-pebble-grey/25">
                3. Recommended (Not Currently Required)
              </h2>
              <p className="mb-2">
                The following are not prerequisites for the verified badge but are strongly encouraged. Groomr
                reserves the right to upgrade any of these to required status in a subsequent version of this policy,
                with reasonable notice given to existing verified groomers.
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-deep-slate/80">
                <li><strong>Professional Indemnity Insurance</strong> — covers negligence claims beyond public liability.</li>
                <li><strong>Equipment &amp; Stock Insurance</strong> — covers tools, grooming tables, dryers, and salon assets.</li>
                <li><strong>Local Council Licence</strong> — some local authorities require this; groomers should check with their own council.</li>
                <li><strong>BIGA / PIF Membership</strong> — British Isles Grooming Association or Pet Industry Federation membership signals ongoing commitment to industry standards.</li>
              </ul>
            </section>

            {/* 4. Process */}
            <section>
              <h2 className="font-fredoka text-xl text-deep-slate mb-2 pb-1 border-b border-pebble-grey/25">
                4. The Verification Process
              </h2>
              <ol className="list-decimal list-inside space-y-1.5 text-xs text-deep-slate/80">
                <li>The groomer submits required documents via their Groomr dashboard following registration.</li>
                <li>Groomr reviews submitted documents within <strong>3–5 working days</strong>.</li>
                <li>If documents are incomplete or unclear, Groomr contacts the groomer by email stating exactly what is required.</li>
                <li>Upon approval, the verified badge appears on the groomer&apos;s public profile immediately.</li>
                <li>Insurance certificates must be re-submitted annually. First aid certificates every 3 years. Groomr sends reminders before expiry.</li>
              </ol>
            </section>

            {/* 5. Revocation */}
            <section>
              <h2 className="font-fredoka text-xl text-deep-slate mb-2 pb-1 border-b border-pebble-grey/25">
                5. Loss of Verification
              </h2>
              <p className="mb-2">Verification will be revoked in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-deep-slate/80">
                <li>Insurance lapses and is not renewed within <strong>14 days</strong> of expiry.</li>
                <li>A first aid certificate expires and is not renewed within <strong>30 days</strong>.</li>
                <li>A complaint is upheld demonstrating that documents submitted were fraudulent or materially misrepresented.</li>
                <li>A groomer operates in a materially different manner to what was declared — for example, hiring staff without subsequently obtaining employers&apos; liability insurance.</li>
              </ul>
              <p className="mt-2">
                A groomer whose verification is revoked will have their profile suppressed from search results
                until verification is reinstated. Their account, booking history, and reviews are retained throughout.
              </p>
            </section>

            {/* 6. Animal welfare */}
            <section>
              <h2 className="font-fredoka text-xl text-deep-slate mb-2 pb-1 border-b border-pebble-grey/25">
                6. Animal Welfare Baseline
              </h2>
              <p className="mb-2">
                All groomers listing on Groomr — verified or otherwise — agree at registration to operate in full
                compliance with the <strong>Animal Welfare Act 2006</strong>. The Five Freedoms framework is adopted
                as the minimum standard of care:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Freedom from hunger, thirst, and malnutrition",
                  "Freedom from discomfort",
                  "Freedom from pain, injury, and disease",
                  "Freedom to express normal behaviour",
                  "Freedom from fear or distress",
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs">
                    <span className="text-sage-leaf font-bold shrink-0">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2">
                Any credible report of animal mistreatment will result in immediate account suspension pending
                investigation, regardless of verification status.
              </p>
            </section>

            {/* 7. Amendments */}
            <section>
              <h2 className="font-fredoka text-xl text-deep-slate mb-2 pb-1 border-b border-pebble-grey/25">
                7. Policy Amendments
              </h2>
              <p className="text-xs">
                Groomr reserves the right to amend this policy at any time. Existing verified groomers will be
                notified of material changes by email no fewer than <strong>30 days</strong> before such changes
                take effect. Continued use of the platform following that notice period constitutes acceptance
                of the updated policy.
              </p>
            </section>

          </div>

          {/* ── Footer ── */}
          <div className="mt-10 pt-6 border-t-2 border-deep-slate">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-fredoka text-lg text-deep-slate">Groomr</p>
                <p className="text-xs text-pebble-grey font-bold mt-0.5">Unhinged Development Group Ltd</p>
                <p className="text-xs text-pebble-grey mt-0.5">verify@groomr.co · groomr.co</p>
              </div>
              <div className="text-right text-xs text-pebble-grey font-bold space-y-0.5">
                <p>Version 1.0 · May 2026</p>
                <p className="font-normal text-pebble-grey/60">This document may be printed or saved as PDF.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; }
        }
      `}</style>
    </>
  );
}
