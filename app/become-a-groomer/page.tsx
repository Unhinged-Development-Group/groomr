import {
  CalendarIcon, ScissorsIcon, ShieldIcon, FavoritesIcon,
  PetsIcon, NotificationsIcon, FinancialsIcon, ReviewsIcon,
  AnalyticsIcon, DashboardIcon, CheckIcon,
} from "@/components/ui/GroomrIcons";
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

const TOOLKIT = [
  {
    Icon: CalendarIcon,
    size: "large",
    title: "Smart booking calendar",
    sub: "Real-time availability. Zero double-bookings.",
    bullets: [
      "Clients book 24/7 directly from your Groomr profile",
      "Deposits collected automatically at point of booking",
      "Sync with Google & Apple Calendar — your whole life in one view",
      "Block-out days, buffer time, and holidays in one tap",
    ],
  },
  {
    Icon: PetsIcon,
    size: "normal",
    title: "Client & dog profiles",
    sub: "Know every dog before they arrive.",
    bullets: [
      "Coat type, temperament & past service notes",
      "Full appointment history per dog",
      "Vet & emergency contact stored safely",
    ],
  },
  {
    Icon: NotificationsIcon,
    size: "normal",
    title: "Automatic reminders",
    sub: "No-shows down 70% on average.",
    bullets: [
      "SMS + email sent 48hrs and 2hrs before",
      "Cancellation window enforced automatically",
      "Late-cancel deposit retained — no awkward calls",
    ],
  },
  {
    Icon: FinancialsIcon,
    size: "normal",
    title: "Deposits & payouts",
    sub: "Get paid, on your terms.",
    bullets: [
      "Set any deposit % per service type",
      "Weekly bank transfer every Monday",
      "Flat 8% fee per completed appointment — no surprises",
    ],
  },
  {
    Icon: ReviewsIcon,
    size: "normal",
    title: "Reviews & reputation",
    sub: "Only real reviews from verified bookings.",
    bullets: [
      "No anonymous feedback — ever",
      "Reply and resolve from your dashboard",
      "Top-rated groomers featured in search",
    ],
  },
] as const;

const GROWTH_TOOLS = [
  { Icon: DashboardIcon,   label: "Staff logins & schedules",        detail: "Add team members with their own calendars and client lists" },
  { Icon: AnalyticsIcon,   label: "Earnings analytics",              detail: "Daily, weekly, monthly breakdowns — always up to date" },
  { Icon: FavoritesIcon,   label: "Client retention tracking",       detail: "See who's rebooking, who's lapsed, who's overdue" },
  { Icon: ScissorsIcon,    label: "Mobile & salon modes",            detail: "Travel radius for mobile groomers, address for studios" },
  { Icon: ShieldIcon,      label: "Verified groomer badge",          detail: "ID-checked status builds trust and lifts your search ranking" },
  { Icon: CalendarIcon,    label: "Google & Apple Calendar sync",    detail: "Two-way sync so nothing ever clashes" },
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
    a: "Free to list. We take 8% of every completed appointment — no monthly charges, no setup fees, no surprises.",
  },
  {
    q: "Can I import my existing clients?",
    a: "Yes. Send us a CSV (or your address book) and we'll get them set up in your profile straight away.",
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

      {/* ── TOOLKIT ──────────────────────────────────────────────────── */}
      <section className="relative bg-deep-slate overflow-hidden py-20 md:py-28">
        {/* Decorative glows */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-sage-leaf/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-groomr-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full px-6 lg:px-12 xl:px-20">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <Eyebrow className="border-white/20 text-white/60">Your toolkit</Eyebrow>
            <h2 className="font-fredoka text-4xl md:text-5xl text-white">
              A platform built around you.
            </h2>
            <p className="text-white/55 font-nunito text-lg">
              Every tool a groomer needs — and nothing they don&apos;t.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">

            {/* Feature 1 — large (spans 2 cols on lg) */}
            {(() => {
              const { Icon, title, sub, bullets } = TOOLKIT[0];
              return (
                <div className="lg:col-span-2 bg-white/[0.06] border border-white/10 rounded-[20px] p-8 flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-5">
                    <div className="w-14 h-14 rounded-2xl bg-groomr-gold/15 border border-groomr-gold/20 flex items-center justify-center">
                      <Icon size={28} />
                    </div>
                    <div>
                      <h3 className="font-fredoka text-2xl text-white mb-1">{title}</h3>
                      <p className="text-white/55 font-nunito text-sm">{sub}</p>
                    </div>
                    <ul className="space-y-2.5">
                      {bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2.5 text-sm text-white/75 font-nunito">
                          <CheckIcon size={16} className="text-groomr-gold shrink-0 mt-0.5" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Mini calendar visual */}
                  <div className="md:w-48 lg:w-52 shrink-0 self-center">
                    <div className="bg-white/10 rounded-2xl p-4 space-y-2">
                      <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">This week</p>
                      {[
                        { day: "Mon", slots: 4, full: false },
                        { day: "Tue", slots: 5, full: true  },
                        { day: "Wed", slots: 3, full: false },
                        { day: "Thu", slots: 5, full: true  },
                        { day: "Fri", slots: 2, full: false },
                      ].map((d) => (
                        <div key={d.day} className="flex items-center gap-2">
                          <span className="text-white/40 text-xs font-bold w-7">{d.day}</span>
                          <div className="flex gap-1 flex-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className={[
                                  "h-4 flex-1 rounded-sm",
                                  i < d.slots
                                    ? d.full ? "bg-groomr-gold/60" : "bg-sage-leaf/60"
                                    : "bg-white/10",
                                ].join(" ")}
                              />
                            ))}
                          </div>
                          {d.full && <span className="text-[9px] font-bold text-groomr-gold">Full</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Features 2–5 — normal cards */}
            {TOOLKIT.slice(1).map(({ Icon, title, sub, bullets }) => (
              <div
                key={title}
                className="bg-white/[0.06] border border-white/10 rounded-[20px] p-7 space-y-5"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="font-fredoka text-xl text-white mb-1">{title}</h3>
                  <p className="text-white/50 font-nunito text-xs">{sub}</p>
                </div>
                <ul className="space-y-2">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-white/65 font-nunito">
                      <CheckIcon size={13} className="text-sage-leaf shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Growth tools — full-width bottom card */}
            <div className="md:col-span-2 lg:col-span-3 bg-white/[0.04] border border-white/8 rounded-[20px] p-8">
              <div className="mb-6">
                <p className="font-fredoka text-xs tracking-widest text-white/40 uppercase mb-1">And more</p>
                <h3 className="font-fredoka text-2xl text-white">Built to scale with you.</h3>
                <p className="text-white/50 font-nunito text-sm mt-1">
                  From solo groomer to a full salon — Groomr grows as you do.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {GROWTH_TOOLS.map(({ Icon, label, detail }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/8 border border-white/8 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/85">{label}</p>
                      <p className="text-xs text-white/45 font-nunito leading-snug mt-0.5">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STEPS ────────────────────────────────────────────────────── */}
      <section className="w-full px-6 lg:px-12 xl:px-20 py-20 md:py-28 bg-white border-b border-pebble-grey/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="font-fredoka text-4xl md:text-5xl text-deep-slate">
              Up and running by Friday.
            </h2>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Connecting line — desktop only, sits behind the circles */}
            <div
              className="hidden lg:block absolute top-8 h-px bg-gradient-to-r from-transparent via-pebble-grey/25 to-transparent pointer-events-none"
              style={{ left: "12.5%", right: "12.5%" }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
              {STEPS.map((s, i) => (
                <div key={s.n} className="flex flex-col items-center text-center group">
                  {/* Circle */}
                  <div className="relative z-10 w-16 h-16 rounded-full bg-groomr-gold flex items-center justify-center shadow-[0_0_0_6px_white,0_0_0_7px_rgba(234,228,92,0.2)] mb-6">
                    <span className="font-fredoka text-2xl text-deep-slate leading-none">{s.n}</span>
                  </div>

                  {/* Content */}
                  <h3 className="font-fredoka text-xl text-deep-slate mb-2">{s.t}</h3>
                  <p className="text-pebble-grey text-sm font-nunito leading-relaxed max-w-[200px]">{s.d}</p>

                  {/* Mobile connector — vertical line between steps */}
                  {i < STEPS.length - 1 && (
                    <div className="sm:hidden w-px h-8 bg-pebble-grey/20 mt-6" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA nudge */}
          <div className="text-center mt-14">
            <BecomeGroomerCTA label="Start your free profile →" />
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
              Drag the sliders to see your monthly take-home. We take 8% of every completed
              appointment — no monthly charges, no setup fees.
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
