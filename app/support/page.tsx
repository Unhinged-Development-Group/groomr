import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SupportForm } from "./_components/SupportForm";
import { FaqAccordion } from "@/app/become-a-groomer/_components/FaqAccordion";

export const metadata: Metadata = {
  title: "Support — Groomr",
  description:
    "Get help with your Groomr account, bookings, or payments. Contact our support team or browse common questions.",
};

const FAQS = [
  // ---- Owners ----
  {
    q: "How do I book an appointment with a groomer?",
    a: 'Search for groomers near you from the search page, open a groomer\'s profile, and tap "Book". You\'ll choose a service, date, and time, then pay a deposit to confirm. A confirmation email will land in your inbox straight away.',
  },
  {
    q: "Can I cancel or reschedule a booking?",
    a: "Yes — open the booking from your owner dashboard and tap Cancel or Reschedule. Each groomer sets their own cancellation window (typically 24–48 hours). If you cancel inside that window, the deposit may be retained per the groomer's policy.",
  },
  {
    q: "How do deposits work?",
    a: "A deposit is taken at the time of booking to secure your slot. The remaining balance is charged after the appointment is completed. Deposit amounts vary by groomer and service — they're always shown clearly before you confirm.",
  },
  {
    q: "What happens if a groomer cancels on me?",
    a: "You'll receive an immediate notification and your deposit will be refunded in full within 5–10 business days. We take unexpected cancellations seriously and they form part of our groomer quality review process.",
  },
  {
    q: "Is my payment information safe?",
    a: "All payments are processed by Stripe, which is PCI DSS Level 1 certified — the highest level of payment security. Groomr never stores your full card details on our servers.",
  },
  // ---- Groomers ----
  {
    q: "How do I list my grooming business on Groomr?",
    a: 'Click "Become a Groomer" in the navigation and complete the registration wizard. It takes around 10 minutes. Once submitted, our team reviews your application and you\'ll hear back within 2 business days.',
  },
  {
    q: "How does groomer verification work?",
    a: "We verify your identity, business address, and qualifications. Verified groomers receive a badge on their profile, which increases trust with dog owners. The process is outlined in full on our Verification Policy page.",
  },
  {
    q: "How much does Groomr charge groomers?",
    a: "Listing and basic features are free. Groomr charges a flat 8% fee on each completed appointment — no monthly subscriptions, no hidden charges. You keep 92% of every booking.",
  },
  {
    q: "When do groomers get paid?",
    a: "Payouts are transferred every Monday for appointments completed the previous week. Funds typically arrive within 1–2 business days depending on your bank.",
  },
  // ---- General ----
  {
    q: "I haven't received a confirmation email — what should I do?",
    a: "Check your spam or junk folder first. If it's not there, make sure the email address on your Groomr account is correct (Settings → Account). Still nothing? Contact us using the form below and we'll sort it out.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to your dashboard, open Settings, and scroll to the bottom — there's a 'Close account' option. Once confirmed, your data is removed within 30 days in line with our Privacy Policy.",
  },
  {
    q: "I've found a bug or the site isn't working — how do I report it?",
    a: "Use the contact form below and select 'Technical issue' as the subject. Screenshots or screen recordings are really helpful — attach them using the image upload. We aim to triage technical reports within one business day.",
  },
];

export default function SupportPage() {
  return (
    <div className="page-fade min-h-screen bg-alabaster-cream">
      {/* Hero */}
      <section className="bg-deep-slate text-center px-6 py-16 md:py-24">
        <div className="max-w-2xl mx-auto space-y-4">
          <h1 className="font-fredoka text-4xl md:text-5xl text-white leading-tight">
            We&apos;re here to help
          </h1>
          <p className="font-nunito text-lg text-sage-leaf leading-relaxed">
            Browse the FAQs below, or send us a message and we&apos;ll get back
            to you within one business day.
          </p>
          <a
            href="mailto:support@groomr.uk"
            className="inline-block mt-2 font-nunito font-bold text-groomr-gold hover:underline text-base"
          >
            support@groomr.uk
          </a>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-16 space-y-20">

        {/* Two-column: form + contact info */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-16 items-start">

            {/* Contact form */}
            <div className="space-y-5">
              <div>
                <Eyebrow>Contact us</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate mt-1">
                  Send us a message
                </h2>
                <p className="font-nunito text-pebble-grey mt-2 leading-relaxed text-sm">
                  Fill in the form and we&apos;ll reply to your email address.
                  Attach screenshots or photos if they help explain the issue.
                </p>
              </div>
              <SupportForm />
            </div>

            {/* Direct contact + hours */}
            <aside className="space-y-6 lg:pt-[72px]">
              <div className="rounded-[20px] bg-white border border-pebble-grey/20 p-6 shadow-subtle space-y-4">
                <h3 className="font-fredoka text-xl text-deep-slate">
                  Direct contact
                </h3>
                <div className="space-y-3 font-nunito text-sm">
                  <div>
                    <p className="font-bold text-deep-slate">Email</p>
                    <a
                      href="mailto:support@groomr.uk"
                      className="text-link"
                    >
                      support@groomr.uk
                    </a>
                  </div>
                  <div>
                    <p className="font-bold text-deep-slate">Response time</p>
                    <p className="text-pebble-grey">Within 1 business day</p>
                  </div>
                  <div>
                    <p className="font-bold text-deep-slate">Support hours</p>
                    <p className="text-pebble-grey">
                      Monday – Friday
                      <br />
                      9:00 am – 5:00 pm GMT
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] bg-groomr-gold/10 border border-groomr-gold/30 p-6 space-y-2">
                <h3 className="font-fredoka text-lg text-deep-slate">
                  Urgent booking issue?
                </h3>
                <p className="font-nunito text-sm text-pebble-grey leading-relaxed">
                  If your appointment is within 24 hours and something has gone
                  wrong, select &ldquo;Booking issue — URGENT&rdquo; as the subject
                  and we&apos;ll prioritise your case.
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <Eyebrow>FAQs</Eyebrow>
            <h2 className="font-fredoka text-3xl text-deep-slate">
              Common questions
            </h2>
            <p className="font-nunito text-pebble-grey text-sm leading-relaxed">
              Most questions are answered here. If you can&apos;t find what
              you&apos;re looking for, use the form above.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <FaqAccordion faqs={FAQS} />
          </div>
        </section>

      </div>
    </div>
  );
}
