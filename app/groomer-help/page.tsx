import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CheckIcon, CalendarIcon, FinancialsIcon, PetsIcon, ScissorsIcon, SettingsIcon, DashboardIcon, ShieldIcon } from "@/components/ui/GroomrIcons";
import { FaqAccordion } from "@/app/become-a-groomer/_components/FaqAccordion";
import { StickyNav } from "./_components/StickyNav";

export const metadata: Metadata = {
  title: "Groomer Help Centre — Groomr",
  description:
    "Everything you need to set up and run your Groomr profile. Availability, services, payments, and more.",
};

const QUICKSTART = [
  {
    n: "1",
    title: "Complete your profile",
    body: "Add a profile photo, banner image, bio, and your business address or travel radius. A complete profile builds trust with dog owners and improves your position in search results.",
    link: { href: "/dashboard/groomer", label: "Go to your dashboard →" },
  },
  {
    n: "2",
    title: "Set your availability",
    body: "Open the Availability tab and configure your working days and hours. Add break windows if you need a lunch gap, and set a buffer time between appointments so you're never rushed.",
    link: null,
  },
  {
    n: "3",
    title: "Connect Stripe to get paid",
    body: "Head to the Payments tab and click Connect with Stripe. You'll complete a short onboarding with Stripe directly. Until this is done, your listing won't be visible to dog owners.",
    link: null,
  },
  {
    n: "4",
    title: "Add your services",
    body: "In the Services tab, create each service you offer — name, description, duration, and price. You can restrict services to specific dog sizes (XS, Small, Medium, Large, XL) and set per-service deposit amounts.",
    link: null,
  },
  {
    n: "5",
    title: "Go live",
    body: "Flip the 'Accepting bookings' toggle in your dashboard. Your profile is now visible in search and clients can book instantly.",
    link: null,
  },
];

const PROFILE_TIPS = [
  { title: "Profile photo", body: "Use a clear, professional photo of yourself at work. Groomers with a face photo get significantly more bookings than those with a logo or no photo." },
  { title: "Banner image", body: "A wide photo of your salon, van, or a happy dog you've groomed works well. 1400 × 400 px is the ideal size — it scales down automatically." },
  { title: "Bio", body: "Tell owners who you are, how long you've been grooming, what breeds you specialise in, and why you love the job. 3–5 sentences is the sweet spot." },
  { title: "Travel radius (mobile)", body: "Set your home postcode and the radius in miles you're willing to travel. Owners searching within that radius will see you in results." },
  { title: "Buffer time", body: "Add 10–15 minutes between appointments to account for running over or cleaning up. This prevents double-bookings and keeps your day from stacking up." },
  { title: "Deposit settings", body: "Choose None (charge on completion), a percentage deposit, or full payment upfront. You can override this per client in the Clients tab." },
];

const AVAILABILITY_TIPS = [
  { title: "Weekly schedule", body: "Set your default working hours for each day of the week. These repeat automatically — you only need to configure them once." },
  { title: "Break windows", body: "Add a break start and end time to your schedule for that day. Groomr will skip those hours when showing available slots to owners." },
  { title: "Date overrides", body: "Use overrides for one-off changes — a holiday, a half-day, or an extra day you're available. Overrides take priority over your weekly schedule on that date." },
  { title: "Time blocks", body: "Block out any period of time (all-day or partial) for things like a show, a training day, or a vet visit. Blocked time shows as unavailable in your calendar." },
  { title: "iCal sync", body: "Go to Settings → Calendar and copy your Groomr iCal link. Subscribe to it in Google Calendar or Apple Calendar and your bookings will appear there automatically." },
];

const SERVICES_TIPS = [
  { title: "Service name & description", body: "Be specific — 'Full Groom (bath, dry, cut, finish)' tells an owner exactly what they're getting. Vague names like 'Groom' lead to mismatched expectations." },
  { title: "Duration", body: "Set a realistic duration including your buffer. Groomr uses this to calculate end times and block the next slot, so err on the side of slightly longer." },
  { title: "Dog size restrictions", body: "Tick only the sizes you accept for that service. If you offer hand-stripping for wire-coated dogs only, restrict it accordingly — this prevents irrelevant bookings." },
  { title: "Per-client pricing", body: "In the Clients tab, you can set a fixed price or a discount percentage for a specific client. Useful for regular customers or trade rates." },
  { title: "Service deposits", body: "Each service can have its own deposit amount (in pence), which overrides your profile-level deposit setting for that service." },
];

const BOOKING_FLOW = [
  { step: "01", title: "Owner selects a service and date", body: "Your available slots are shown in real time based on your schedule, break windows, existing bookings, and any time blocks." },
  { step: "02", title: "Deposit (or full payment) is collected", body: "Stripe handles the payment. The owner's card is charged immediately at booking — you never need to chase for payment." },
  { step: "03", title: "You get a notification", body: "A push notification, email, and (if enabled) SMS lands as soon as the booking is confirmed. The appointment appears in your dashboard Bookings tab." },
  { step: "04", title: "Reminders go out automatically", body: "Groomr sends the owner SMS and email reminders 48 hours and 2 hours before their appointment. No action needed from you." },
  { step: "05", title: "Mark as complete", body: "After the groom, mark the appointment complete from your dashboard. This triggers the remaining payment collection and starts your payout clock." },
];

const PAYMENTS_TIPS = [
  { title: "Stripe Connect setup", body: "Groomr uses Stripe Connect to send money directly to your bank account. You'll need to complete Stripe's identity and bank account verification during onboarding — typically takes 2–5 minutes." },
  { title: "How the 8% fee works", body: "Groomr takes 8% of each completed appointment's total price. This is calculated on the service price (not the deposit). The fee is deducted before your payout is sent." },
  { title: "Your first 150 bookings are free", body: "As a sign-up incentive, the 8% commission is waived on your first 150 completed bookings. Your dashboard shows a progress banner so you always know where you stand." },
  { title: "Payout schedule", body: "Payouts are transferred every Monday for appointments completed the previous week. Funds typically clear in 1–2 business days depending on your bank." },
  { title: "Viewing your earnings", body: "The Earnings tab in your dashboard shows a full breakdown: gross revenue, platform fee, Stripe fee, and your net payout — per appointment and in aggregate." },
  { title: "Refunds", body: "Refunds can be issued from your dashboard on a per-appointment basis. Full or partial refunds are both supported. The platform fee is refunded proportionally." },
];

const TEAM_TIPS = [
  { title: "Inviting a team member", body: "Go to Settings → Team and click Invite. Enter their name, role, and email address. They'll receive an invitation to create a Groomr account linked to your salon." },
  { title: "Assigning appointments", body: "When confirming or editing a booking, you can assign it to a specific team member. They'll see the appointment in their own view when logged in." },
  { title: "Team member accounts", body: "Each team member gets their own login. They can view and manage appointments assigned to them, but cannot access your earnings, settings, or client pricing." },
  { title: "Removing a team member", body: "Go to Settings → Team and click Remove. Their account is unlinked immediately. Any appointments previously assigned to them remain in your calendar, unassigned." },
];

const FAQS = [
  {
    q: "Why isn't my profile showing up in search?",
    a: "Three things can prevent your profile from appearing: (1) the 'Accepting bookings' toggle is off — flip it in your dashboard, (2) your Stripe Connect account isn't fully verified — check the Payments tab for any outstanding requirements, (3) your profile is missing key information (photo, bio, at least one service). Complete all three and you'll appear in search within a few minutes.",
  },
  {
    q: "A client wants to book but says there are no available slots — what's wrong?",
    a: "Check your availability schedule in the Availability tab — make sure the days and hours are set correctly and the day is marked active. Also check for any time blocks or overrides that might be covering that date. If you have a buffer time set, make sure you have enough gap between existing appointments for a new slot to fit.",
  },
  {
    q: "How do I handle a cancellation?",
    a: "Open the appointment in your dashboard and tap Cancel. You'll be asked for a reason. If the cancellation is inside the client's cancellation window, the deposit is retained automatically. If it's outside, or if you (the groomer) are cancelling, a full refund is issued to the client.",
  },
  {
    q: "Can I accept group bookings (multiple dogs at once)?",
    a: "Yes. Owners can book multiple dogs from the same booking flow — they'll appear as a group in your calendar with a shared time block. Each dog's groom is its own appointment row, so you can see the full picture.",
  },
  {
    q: "How do recurring bookings work?",
    a: "An owner can request a recurring series (weekly, bi-weekly, 4-weekly, or monthly). You'll receive a notification to approve or decline. Once approved, Groomr auto-generates appointments on a rolling 6-month window — you'll always have upcoming bookings confirmed without any manual effort.",
  },
  {
    q: "Can I add a custom contract for clients to accept?",
    a: "Yes. Go to Settings → Contract Terms and write your custom terms. Once published, clients will be asked to accept your terms before they can book with you. You can version your terms — existing clients will be prompted to re-accept when you publish a new version.",
  },
  {
    q: "How do I get my Verified badge?",
    a: "Submit your ID and insurance documents from the Verification tab in your dashboard. Our team reviews submissions and typically responds within 2 business days. Once verified, the badge appears on your profile and in search results.",
  },
  {
    q: "I accidentally marked an appointment complete — can I undo it?",
    a: "Contact support at support@groomr.uk as soon as possible. We can reverse the status before the payout is initiated. Once a payout has been sent, it can't be reversed — but we can help sort out the payment side separately.",
  },
  {
    q: "Why is my Stripe payout delayed?",
    a: "Payouts run every Monday morning. If you completed appointments very late in the week, they may roll into the following Monday's batch. New Stripe accounts also have an initial holding period (typically 7 days) before their first payout — this is set by Stripe, not Groomr.",
  },
  {
    q: "Can I pause my listing without closing my account?",
    a: "Yes — flip the 'Accepting bookings' toggle to off. Your profile disappears from search immediately. Existing bookings and clients are unaffected. Turn it back on any time.",
  },
];

function Section({ id, icon: Icon, title, eyebrow, children }: {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 pt-10 first:pt-0">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-white border border-pebble-grey/20 shadow-subtle flex items-center justify-center shrink-0">
          <Icon size={20} />
        </div>
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="font-fredoka text-2xl text-deep-slate leading-tight">{title}</h2>
        </div>
      </div>
      {children}
      <div className="mt-10 border-b border-pebble-grey/10" />
    </section>
  );
}

function TipCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white rounded-[16px] border border-pebble-grey/20 p-5 space-y-1.5">
      <p className="font-bold text-sm text-deep-slate font-nunito">{title}</p>
      <p className="text-sm text-pebble-grey font-nunito leading-relaxed">{body}</p>
    </div>
  );
}

export default function GroomerHelpPage() {
  return (
    <div className="page-fade min-h-screen bg-alabaster-cream">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-deep-slate px-6 lg:px-12 xl:px-20 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <Eyebrow className="border-white/20 text-white/50 mb-3">Groomer Help Centre</Eyebrow>
          <h1 className="font-fredoka text-4xl md:text-5xl text-white leading-tight max-w-2xl">
            Everything you need to hit the ground running.
          </h1>
          <p className="font-nunito text-white/55 text-lg mt-3 max-w-xl leading-relaxed">
            From setting up your profile to getting paid — step-by-step guides for every part of Groomr.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-sm font-nunito">
            <a href="/support" className="text-groomr-gold hover:underline font-bold">
              Contact support →
            </a>
            <span className="text-white/25">·</span>
            <a href="mailto:support@groomr.uk" className="text-white/50 hover:text-white transition-colors">
              support@groomr.uk
            </a>
          </div>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12 md:py-16 flex gap-16 items-start">

        <StickyNav />

        <div className="flex-1 min-w-0 space-y-0">

          {/* ── 1. Quick-start ───────────────────────────────────────── */}
          <Section id="quick-start" icon={CheckIcon} eyebrow="Getting started" title="Quick-start checklist">
            <p className="text-pebble-grey font-nunito text-sm leading-relaxed mb-6 max-w-prose">
              Just registered? Here are the five things to do before your first booking comes in.
            </p>
            <div className="space-y-4">
              {QUICKSTART.map((step) => (
                <div key={step.n} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-groomr-gold flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_0_3px_white,0_0_0_4px_rgba(234,228,92,0.3)]">
                    <span className="font-fredoka text-sm text-deep-slate leading-none">{step.n}</span>
                  </div>
                  <div className="flex-1 pb-4 border-b border-pebble-grey/10 last:border-0 last:pb-0">
                    <p className="font-bold text-deep-slate text-sm font-nunito mb-1">{step.title}</p>
                    <p className="text-pebble-grey font-nunito text-sm leading-relaxed">{step.body}</p>
                    {step.link && (
                      <a href={step.link.href} className="text-link text-sm mt-1.5 inline-block font-nunito">
                        {step.link.label}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 2. Profile ───────────────────────────────────────────── */}
          <Section id="profile" icon={SettingsIcon} eyebrow="Step 1" title="Profile & settings">
            <p className="text-pebble-grey font-nunito text-sm leading-relaxed mb-5 max-w-prose">
              Your profile is your shop window. Dog owners make their decision based on what they see here — a complete, well-written profile converts significantly better than a sparse one.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROFILE_TIPS.map((t) => <TipCard key={t.title} {...t} />)}
            </div>
          </Section>

          {/* ── 3. Availability ──────────────────────────────────────── */}
          <Section id="availability" icon={CalendarIcon} eyebrow="Step 2" title="Availability & calendar">
            <p className="text-pebble-grey font-nunito text-sm leading-relaxed mb-5 max-w-prose">
              Groomr calculates your bookable slots in real time by combining your weekly schedule, overrides, existing appointments, and any time blocks. Getting this right means clients always see accurate availability.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {AVAILABILITY_TIPS.map((t) => <TipCard key={t.title} {...t} />)}
            </div>
            <div className="bg-sage-leaf/10 border border-sage-leaf/30 rounded-[16px] p-5">
              <p className="font-bold text-sm text-deep-slate font-nunito mb-1">Tip: subscribe to your Groomr calendar</p>
              <p className="text-sm text-pebble-grey font-nunito leading-relaxed">
                Copy your iCal link from Settings → Calendar and paste it into Google Calendar ("Other calendars → From URL") or Apple Calendar (File → New Calendar Subscription). Your bookings will appear alongside your personal events and auto-refresh throughout the day.
              </p>
            </div>
          </Section>

          {/* ── 4. Services ──────────────────────────────────────────── */}
          <Section id="services" icon={ScissorsIcon} eyebrow="Step 3" title="Services & pricing">
            <p className="text-pebble-grey font-nunito text-sm leading-relaxed mb-5 max-w-prose">
              Each service you offer becomes a bookable option on your profile. Be as specific as possible — clear service names and descriptions reduce enquiry messages and set the right expectations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {SERVICES_TIPS.map((t) => <TipCard key={t.title} {...t} />)}
            </div>
            <div className="bg-groomr-gold/10 border border-groomr-gold/30 rounded-[16px] p-5">
              <p className="font-bold text-sm text-deep-slate font-nunito mb-1">Pricing resolution order</p>
              <p className="text-sm text-pebble-grey font-nunito leading-relaxed">
                When a booking is made, Groomr looks up the price in this order: (1) per-client fixed price override, (2) per-client discount percentage off the standard price, (3) the standard service price. The first match wins.
              </p>
            </div>
          </Section>

          {/* ── 5. Bookings ──────────────────────────────────────────── */}
          <Section id="bookings" icon={PetsIcon} eyebrow="Step 4" title="Taking bookings">
            <p className="text-pebble-grey font-nunito text-sm leading-relaxed mb-6 max-w-prose">
              Once you&apos;re live, clients can book directly. Here&apos;s exactly what happens from the moment they hit Confirm to the moment you get paid.
            </p>
            <div className="space-y-3">
              {BOOKING_FLOW.map((item) => (
                <div key={item.step} className="flex gap-4 bg-white rounded-[16px] border border-pebble-grey/20 p-5">
                  <span className="font-fredoka text-2xl text-groomr-gold/70 leading-none w-8 shrink-0">{item.step}</span>
                  <div>
                    <p className="font-bold text-sm text-deep-slate font-nunito mb-1">{item.title}</p>
                    <p className="text-sm text-pebble-grey font-nunito leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 6. Payments ──────────────────────────────────────────── */}
          <Section id="payments" icon={FinancialsIcon} eyebrow="Step 5" title="Payments & earnings">
            <p className="text-pebble-grey font-nunito text-sm leading-relaxed mb-5 max-w-prose">
              Groomr uses Stripe to handle all payments. You need a connected Stripe account before you can go live — here&apos;s everything you need to know.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {PAYMENTS_TIPS.map((t) => <TipCard key={t.title} {...t} />)}
            </div>
            <div className="bg-deep-slate rounded-[16px] p-6 space-y-3">
              <p className="font-fredoka text-xl text-white">Your first 150 bookings are commission-free</p>
              <p className="text-sm text-white/65 font-nunito leading-relaxed">
                As part of our groomer sign-up incentive, Groomr waives the 8% platform fee on your first 150 completed bookings. After that, the standard 8% applies. Your dashboard shows a progress banner with how many free bookings you&apos;ve used and how many remain.
              </p>
              <a href="/public/policies/groomer-sign-up-incentive.html" className="text-groomr-gold text-sm font-bold font-nunito hover:underline inline-block">
                Read the full incentive policy →
              </a>
            </div>
          </Section>

          {/* ── 7. Team ──────────────────────────────────────────────── */}
          <Section id="team" icon={DashboardIcon} eyebrow="Step 6" title="Team members">
            <p className="text-pebble-grey font-nunito text-sm leading-relaxed mb-5 max-w-prose">
              Running a salon or mobile team? Add your staff as team members. They get their own login and can view appointments assigned to them — without seeing your financial data or account settings.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {TEAM_TIPS.map((t) => <TipCard key={t.title} {...t} />)}
            </div>
            <div className="bg-sage-leaf/10 border border-sage-leaf/30 rounded-[16px] p-5">
              <p className="font-bold text-sm text-deep-slate font-nunito mb-1">Verification badges for team members</p>
              <p className="text-sm text-pebble-grey font-nunito leading-relaxed">
                Each team member listed on your profile can have their own photo and bio. Clients browsing your profile can see who they might be booked with — which builds confidence, especially for new clients.
              </p>
            </div>
          </Section>

          {/* ── 8. FAQ ───────────────────────────────────────────────── */}
          <section id="faq" className="scroll-mt-28 pt-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white border border-pebble-grey/20 shadow-subtle flex items-center justify-center shrink-0">
                <ShieldIcon size={20} />
              </div>
              <div>
                <Eyebrow>Common questions</Eyebrow>
                <h2 className="font-fredoka text-2xl text-deep-slate leading-tight">FAQ</h2>
              </div>
            </div>
            <FaqAccordion faqs={FAQS} />

            {/* Bottom CTA */}
            <div className="mt-10 bg-white rounded-[20px] border border-pebble-grey/20 p-8 text-center space-y-3">
              <p className="font-fredoka text-2xl text-deep-slate">Still have a question?</p>
              <p className="font-nunito text-pebble-grey text-sm leading-relaxed max-w-sm mx-auto">
                Our support team is available Monday – Friday, 9am – 5pm GMT. We aim to respond within one business day.
              </p>
              <div className="flex flex-wrap gap-3 justify-center pt-1">
                <a href="/support" className="btn-primary text-sm px-5 py-2.5">
                  Contact support
                </a>
                <a href="mailto:support@groomr.uk" className="btn-secondary text-sm px-5 py-2.5">
                  support@groomr.uk
                </a>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
