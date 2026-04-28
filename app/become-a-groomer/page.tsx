import { Calendar, Scissors, Shield, Heart } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Badge } from "@/components/ui/Badge";
import { CalculatorWidget } from "./_components/CalculatorWidget";
import { FaqAccordion } from "./_components/FaqAccordion";
import { BecomeGroomerCTA } from "@/app/_components/BecomeGroomerCTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a Groomr — Less admin, more grooming",
  description:
    "Join 2,400+ verified groomers. Online booking, automatic reminders, payments — all in one. Free to list.",
};

const BENEFITS = [
  {
    Icon: Calendar,
    title: "Real-time online booking",
    body: "Show your live availability. Stop the back-and-forth texts.",
  },
  {
    Icon: Scissors,
    title: "Built for the way you work",
    body: "Mobile, studio, or home — set your area, services, and prices in minutes.",
  },
  {
    Icon: Shield,
    title: "You own your clients",
    body: "Take your regulars with you. We never charge commission on rebookings.",
  },
  {
    Icon: Heart,
    title: "Reviews that bring referrals",
    body: "Verified reviews from real bookings — the kind word-of-mouth used to do alone.",
  },
];

const STEPS = [
  { n: "01", t: "List for free", d: "Build your profile in 10 minutes. Photos, services, prices." },
  { n: "02", t: "Get discovered", d: "Owners in your area find you when they search." },
  { n: "03", t: "Bookings come in", d: "We handle scheduling, deposits, and reminders." },
  { n: "04", t: "Get paid, keep growing", d: "Payouts hit your account weekly. Build a regular client base." },
];

const FAQS = [
  {
    q: "What does Groomr cost?",
    a: "Free to list and free for clients you bring with you. We take 8% on new clients we send your way — only when the appointment is completed.",
  },
  {
    q: "Can I import my existing clients?",
    a: "Yes. Send us a CSV (or your address book) and we'll get them set up. They'll never trigger a fee.",
  },
  {
    q: "Do I have to use the calendar?",
    a: "No. You can set Groomr to enquiry-only, or sync with Google / Apple Calendar so your other bookings block availability automatically.",
  },
  {
    q: "How do payouts work?",
    a: "Weekly bank transfer (Mondays). Deposits and full payments are pooled and net of fees.",
  },
];

const GROOMER_TESTIMONIALS = [
  {
    name: "Lola García",
    biz: "Wagington & Co.",
    text: "Saved me three hours a week of admin in the first month. My van just runs now.",
  },
  {
    name: "Priya Shah",
    biz: "The Snug Salon",
    text: "I was sceptical of yet another platform. Three months in, I've got 11 new regulars and zero double-bookings.",
  },
  {
    name: "Sam O.",
    biz: "Bark & Bubbles",
    text: "The free cancellation window plus deposits killed my no-show problem overnight.",
  },
];

export default function BecomeAGroomerPage() {
  return (
    <div className="page-fade">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="bg-alabaster-cream relative overflow-hidden border-b border-pebble-grey/15">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 max-w-xl">
            <h1 className="font-fredoka text-5xl md:text-6xl lg:text-7xl leading-[0.95] text-deep-slate">
              Less admin.
              <br />
              More{" "}
              <span className="relative inline-block">
                <span className="relative z-10">grooming.</span>
                <span className="absolute inset-x-0 bottom-1 h-4 bg-groomr-gold/60 -z-0 rounded-sm" />
              </span>
            </h1>
            <p className="text-lg text-pebble-grey font-nunito leading-relaxed">
              Groomr is a calendar, a booking page, a payment system, and a way for new owners to
              find you — all in one.
              <span className="block mt-3 italic font-bold text-deep-slate">
                &ldquo;Built by groomers, for groomers.&rdquo;
              </span>
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <BecomeGroomerCTA />
            </div>
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-pebble-grey/20 mt-8">
              <div>
                <p className="font-fredoka text-3xl text-deep-slate">2,400+</p>
                <p className="text-xs font-bold text-sage-leaf uppercase tracking-wider">
                  Verified groomers
                </p>
              </div>
              <div>
                <p className="font-fredoka text-3xl text-deep-slate">38hrs</p>
                <p className="text-xs font-bold text-sage-leaf uppercase tracking-wider">
                  Saved monthly
                </p>
              </div>
              <div>
                <p className="font-fredoka text-3xl text-deep-slate">£0</p>
                <p className="text-xs font-bold text-sage-leaf uppercase tracking-wider">
                  To get listed
                </p>
              </div>
            </div>
          </div>

          {/* Mock booking widget */}
          <div className="relative">
            <div className="bg-white text-deep-slate rounded-[24px] p-6 shadow-modal border border-pebble-grey/15">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-fredoka text-2xl">This week</p>
                  <p className="text-sm text-pebble-grey font-bold">12 bookings · 4 new clients</p>
                </div>
                <Badge tone="gold">+22%</Badge>
              </div>
              <div className="space-y-3">
                {[
                  { time: "9:00", who: "Marlow · cocker spaniel", svc: "Full Groom", price: "£58" },
                  { time: "11:30", who: "Biscuit · border terrier", svc: "Hand-Strip", price: "£80" },
                  { time: "14:00", who: "Otis · cockapoo", svc: "Full Groom", price: "£60", isNew: true },
                  { time: "16:00", who: "Pippa · cockapoo", svc: "Bath", price: "£38" },
                ].map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 bg-white border border-pebble-grey/15 rounded-xl px-4 py-3"
                  >
                    <div className="font-fredoka text-deep-slate w-12 shrink-0">{b.time}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-deep-slate truncate">{b.who}</p>
                      <p className="text-xs text-pebble-grey">{b.svc}</p>
                    </div>
                    {b.isNew && <Badge tone="terra">New</Badge>}
                    <span className="font-fredoka text-deep-slate">{b.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────── */}
      <section className="w-full px-6 lg:px-12 xl:px-20 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <Eyebrow>Why groomers switch</Eyebrow>
          <h2 className="font-fredoka text-4xl md:text-5xl text-deep-slate">
            A toolkit, not a marketplace tax.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {BENEFITS.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="bg-white border border-pebble-grey/20 rounded-[20px] p-7 flex gap-5 card-lift"
            >
              <div className="w-14 h-14 rounded-2xl bg-alabaster-cream border border-pebble-grey/15 flex items-center justify-center shrink-0">
                <Icon size={30} className="text-deep-slate" />
              </div>
              <div>
                <h3 className="font-fredoka text-xl text-deep-slate mb-2">{title}</h3>
                <p className="text-pebble-grey font-nunito leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STEPS ────────────────────────────────────────────────────── */}
      <section className="bg-alabaster-cream border-y border-pebble-grey/15">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-20">
          <div className="max-w-2xl mb-12 space-y-3">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="font-fredoka text-4xl md:text-5xl text-deep-slate">
              Up and running by Friday.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="bg-white border border-pebble-grey/20 rounded-[20px] p-6 space-y-3"
              >
                <p className="font-fredoka text-5xl text-groomr-gold">{s.n}</p>
                <h3 className="font-fredoka text-xl text-deep-slate">{s.t}</h3>
                <p className="text-pebble-grey text-sm">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CALCULATOR ───────────────────────────────────────────────── */}
      <section className="w-full px-6 lg:px-12 xl:px-20 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
          <div className="space-y-4">
            <Eyebrow>What you&apos;ll keep</Eyebrow>
            <h2 className="font-fredoka text-4xl md:text-5xl text-deep-slate">
              No hidden fees. Ever.
            </h2>
            <p className="text-pebble-grey text-lg font-nunito leading-relaxed">
              Drag the sliders to estimate your monthly take-home. Existing clients you bring with
              you cost nothing. We charge 8% only on new clients we send.
            </p>
          </div>
          <CalculatorWidget />
        </div>
      </section>

      {/* ── GROOMER TESTIMONIALS ─────────────────────────────────────── */}
      <section className="bg-sage-leaf/10 py-20">
        <div className="w-full px-6 lg:px-12 xl:px-20 grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {GROOMER_TESTIMONIALS.map((t, i) => (
            <figure
              key={i}
              className="bg-white rounded-[20px] p-7 border border-pebble-grey/20 card-lift relative"
            >
              <div className="absolute -top-4 left-7 text-6xl font-fredoka text-groomr-gold leading-none">
                &ldquo;
              </div>
              <blockquote className="text-deep-slate font-nunito text-lg leading-relaxed pt-4">
                {t.text}
              </blockquote>
              <figcaption className="mt-5 pt-5 border-t border-pebble-grey/10">
                <p className="font-bold text-sm text-deep-slate">{t.name}</p>
                <p className="text-xs text-pebble-grey">{t.biz}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="w-full px-6 lg:px-12 xl:px-20 py-20 max-w-3xl mx-auto">
        <div className="text-center mb-10 space-y-3">
          <Eyebrow>Common questions</Eyebrow>
          <h2 className="font-fredoka text-4xl md:text-5xl text-deep-slate">
            Asked &amp; answered.
          </h2>
        </div>
        <FaqAccordion faqs={FAQS} />
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="w-full px-6 lg:px-12 xl:px-20 pb-24">
        <div className="bg-alabaster-cream text-deep-slate rounded-[32px] p-12 md:p-16 text-center max-w-5xl mx-auto relative overflow-hidden border border-pebble-grey/20">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-groomr-gold/30 blur-3xl" />
          <div className="relative space-y-5">
            <h2 className="font-fredoka text-4xl md:text-5xl text-deep-slate">
              Your next booking is one sign-up away.
            </h2>
            <p className="text-pebble-grey text-lg max-w-xl mx-auto">
              Join 2,400+ groomers who&apos;ve quit chasing texts and started filling their week.
            </p>
            <BecomeGroomerCTA label="Become a Groomr — Free" className="px-8 py-4 text-base" />
          </div>
        </div>
      </section>
    </div>
  );
}
