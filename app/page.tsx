import Image from "next/image";
import Link from "next/link";
import { ShieldIcon, CalendarIcon } from "@/components/ui/GroomrIcons";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Badge } from "@/components/ui/Badge";
import { SearchPillWrapper } from "./_components/SearchPillWrapper";
import { HowItWorksCarousel } from "./_components/HowItWorksCarousel";

function getUpcomingGroomDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + ", 10:30am";
}

const TESTIMONIALS = [
  {
    name: "Anya",
    dog: "Lab cross",
    text: "I used to forget to book until Marlow was a tangled mess. Groomr just… does it for me.",
    avatar: "https://i.pravatar.cc/80?img=47",
  },
  {
    name: "Tom",
    dog: "Bichon",
    text: "Finding a groomer who's good with anxious dogs was impossible. Found two within 1 mile.",
    avatar: "https://i.pravatar.cc/80?img=33",
  },
  {
    name: "Sophie",
    dog: "Cavapoo",
    text: "Booked our first groom in about three minutes. Never thought finding someone local and reliable could be that easy.",
    avatar: "https://i.pravatar.cc/80?img=21",
  },
];

export default function LandingPage() {
  return (
    <div className="page-fade">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="w-full px-5 sm:px-6 lg:px-12 xl:px-20 pt-8 pb-16 md:pt-16 md:pb-32 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-5 md:space-y-7 w-full lg:max-w-xl text-center lg:text-left">
            <Eyebrow className="mx-auto lg:mx-0 w-fit">Local · Independent · Loved</Eyebrow>

            <h1 className="font-fredoka text-[2.4rem] sm:text-5xl md:text-6xl lg:text-7xl text-deep-slate leading-[0.95]">
              Book your dog&apos;s
              <br />
              next groom in
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">minutes.</span>
                <span className="absolute inset-x-0 bottom-1 h-4 bg-groomr-gold/60 -z-0 rounded-sm" />
              </span>
            </h1>

            <p className="text-lg md:text-xl text-deep-slate font-nunito italic font-bold leading-relaxed">
              &ldquo;Your dog deserves a regular.&rdquo;
            </p>

            <div className="pt-1 w-full">
              <SearchPillWrapper placeholder="Postcode, town, or 'near me'" ctaLabel="Find Groomers" />
              <div className="flex flex-wrap gap-2 mt-3 text-xs justify-center lg:justify-start">
                <span className="text-pebble-grey font-bold mr-1 self-center">Popular:</span>
                {["Glasgow", "Edinburgh", "Southside", "Mobile only"].map((t) => (
                  <Link
                    key={t}
                    href={`/search?q=${encodeURIComponent(t)}`}
                    className="bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors text-deep-slate font-bold px-3 py-1 rounded-full focus-ring text-xs"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-3 text-sm font-bold text-pebble-grey justify-center lg:justify-start">
              <div className="flex items-center gap-2">
                <ShieldIcon size={20} />
                Verified groomers
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon size={20} />
                Real-time booking
              </div>
            </div>
          </div>

          {/* Hero collage — desktop only */}
          <div className="relative h-[480px] md:h-[560px] hidden lg:block">
            <div className="absolute top-0 right-0 w-72 h-80 rounded-[24px] overflow-hidden shadow-lift rotate-[3deg]">
              <Image
                src="/assets/landing-hero-chihuahua-park.jpg"
                alt="Long-haired cream Chihuahua wearing a plaid bow tie on the grass in a sunny park"
                fill
                className="object-cover"
                sizes="288px"
              />
            </div>
            <div className="absolute bottom-12 left-0 w-64 h-72 rounded-[24px] overflow-hidden shadow-lift -rotate-[4deg]">
              <Image
                src="/assets/ashoka-beach.jpg"
                alt="Ashoka at the beach"
                fill
                className="object-cover"
                sizes="256px"
              />
            </div>
            {/* Floating booking confirmation card */}
            <div className="absolute top-32 left-44 w-60 rounded-[20px] bg-white p-5 shadow-modal border border-pebble-grey/20 rotate-[2deg]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-groomr-gold flex items-center justify-center font-fredoka text-deep-slate text-lg">
                  M
                </div>
                <div>
                  <p className="font-fredoka text-sm text-deep-slate leading-tight">
                    Murphy&apos;s next groom
                  </p>
                  <p className="text-xs text-pebble-grey font-bold">{getUpcomingGroomDate()}</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-sage-leaf/10 rounded-xl px-3 py-2">
                <span className="text-xs font-bold text-deep-slate">Wagington &amp; Co.</span>
                <span className="text-xs font-bold text-sage-leaf">Confirmed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="w-full px-5 sm:px-6 lg:px-12 xl:px-20 py-14 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14 space-y-3">
          <Eyebrow>How Groomr works</Eyebrow>
          <h2 className="font-fredoka text-4xl md:text-5xl lg:text-6xl text-deep-slate">
            Booking grooming, finally easy.
          </h2>
        </div>
        <div className="max-w-5xl mx-auto">
          <HowItWorksCarousel />
        </div>
      </section>

      {/* ── GROOMER STRIP ────────────────────────────────────────────── */}
      <section className="relative bg-deep-slate overflow-hidden py-14 md:py-28">
        {/* Decorative glows */}
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] bg-sage-leaf/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[360px] h-[360px] bg-groomr-gold/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full px-5 sm:px-6 lg:px-12 xl:px-20 grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 items-center">

          {/* Left — text */}
          <div className="space-y-6">
            <h2 className="font-fredoka text-[2.4rem] sm:text-5xl md:text-6xl text-white leading-tight">
              Are you a<br />dog groomer?
            </h2>
            <p className="font-fredoka text-xl sm:text-2xl text-groomr-gold leading-snug">
              Your business, finally organised.
            </p>
            <p className="text-white/65 text-lg leading-relaxed font-nunito max-w-md">
              Online booking, automatic reminders, client profiles, and payments — all in one place.
              A profile that shows up where dog owners actually look. Free to list.
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              <Link
                href="/become-a-groomer"
                className="btn-gold-on-dark font-nunito font-bold px-7 py-3 rounded-full focus-ring inline-flex items-center"
              >
                Find out more
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-8 pt-6 border-t border-white/10">
              <div>
                <p className="font-fredoka text-3xl text-groomr-gold">340+</p>
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider mt-0.5">
                  Active groomers
                </p>
              </div>
              <div>
                <p className="font-fredoka text-3xl text-groomr-gold">6 hrs</p>
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider mt-0.5">
                  Saved monthly avg
                </p>
              </div>
              <div>
                <p className="font-fredoka text-3xl text-groomr-gold">£0</p>
                <p className="text-xs font-bold text-white/50 uppercase tracking-wider mt-0.5">
                  To get listed
                </p>
              </div>
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div className="relative">
            {/* Subtle glow behind the card */}
            <div className="absolute inset-0 bg-groomr-gold/8 rounded-[32px] blur-2xl scale-95 pointer-events-none" />

            {/* Browser chrome frame */}
            <div className="relative rounded-[24px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10">

              {/* Chrome bar */}
              <div className="bg-[#1e2d3d] px-4 py-3 flex items-center gap-2 border-b border-white/8">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-white/8 rounded-md px-3 py-1 text-[11px] text-white/40 font-bold text-center max-w-[200px] mx-auto">
                    dashboard.groomr.co
                  </div>
                </div>
                {/* Notification dot */}
                <div className="relative w-7 h-7 rounded-full bg-white/8 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-5M13 17v1a2 2 0 11-4 0v-1" />
                  </svg>
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-muted-terracotta rounded-full" />
                </div>
              </div>

              {/* Dashboard body */}
              <div className="bg-[#f7f8f9] p-5 space-y-3">

                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-fredoka text-lg text-deep-slate">Good morning, Sarah ☀️</p>
                    <p className="text-xs text-pebble-grey font-bold">Monday · 23 June</p>
                  </div>
                  <Badge tone="gold">+22% this week</Badge>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "£486", label: "Today's earnings", highlight: false },
                    { value: "6",    label: "Appointments",     highlight: false },
                    { value: "★ 4.9", label: "Your rating",     highlight: true  },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={[
                        "rounded-xl p-3 text-center border",
                        s.highlight
                          ? "bg-groomr-gold/15 border-groomr-gold/25"
                          : "bg-white border-pebble-grey/10",
                      ].join(" ")}
                    >
                      <p className="font-fredoka text-xl text-deep-slate">{s.value}</p>
                      <p className="text-[10px] text-pebble-grey font-bold leading-tight mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Schedule */}
                <div className="bg-white rounded-xl border border-pebble-grey/10 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-pebble-grey/8 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-pebble-grey uppercase tracking-wider">Today&apos;s Schedule</p>
                    <span className="text-[10px] font-bold text-sage-leaf">4 of 6 remaining</span>
                  </div>
                  <div className="divide-y divide-pebble-grey/6">
                    {[
                      { time: "9:00",  who: "Marlow",  breed: "Cocker Spaniel", svc: "Full Groom",    price: "£58", status: "done" },
                      { time: "11:30", who: "Biscuit", breed: "Border Terrier", svc: "Hand Strip",     price: "£80", status: "now"  },
                      { time: "14:00", who: "Otis",    breed: "Cockapoo",       svc: "Full Groom",    price: "£60", status: "new"  },
                      { time: "15:30", who: "Luna",    breed: "Goldendoodle",   svc: "Bath & Blowdry", price: "£45", status: "soon" },
                    ].map((b) => (
                      <div key={b.time} className={["flex items-center gap-3 px-4 py-2.5 text-sm", b.status === "done" ? "opacity-40" : ""].join(" ")}>
                        {/* Status indicator */}
                        <div className="shrink-0 w-5 flex justify-center">
                          {b.status === "done" && (
                            <svg className="w-4 h-4 text-sage-leaf" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {b.status === "now" && <div className="w-2 h-2 rounded-full bg-sage-leaf animate-pulse" />}
                          {(b.status === "new" || b.status === "soon") && <div className="w-2 h-2 rounded-full bg-pebble-grey/30" />}
                        </div>

                        <span className="font-fredoka text-deep-slate w-10 shrink-0 text-sm">{b.time}</span>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-deep-slate leading-tight truncate">{b.who} · <span className="font-normal text-pebble-grey">{b.breed}</span></p>
                          <p className="text-[10px] text-pebble-grey">{b.svc}</p>
                        </div>

                        {b.status === "now" && (
                          <span className="text-[9px] font-bold bg-sage-leaf/15 text-sage-leaf px-2 py-0.5 rounded-full shrink-0">In progress</span>
                        )}
                        {b.status === "new" && (
                          <span className="text-[9px] font-bold bg-muted-terracotta/12 text-muted-terracotta px-2 py-0.5 rounded-full shrink-0">New</span>
                        )}

                        <span className="font-fredoka text-deep-slate text-sm shrink-0">{b.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* New review notification */}
                <div className="bg-groomr-gold/10 border border-groomr-gold/20 rounded-xl px-4 py-3 flex items-start gap-3">
                  <div className="flex gap-0.5 shrink-0 pt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className="w-3 h-3 fill-groomr-gold" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-deep-slate leading-snug">&ldquo;Marlow looks absolutely gorgeous, thank you!&rdquo;</p>
                    <p className="text-[10px] text-pebble-grey mt-0.5">Anya · 2 minutes ago</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="w-full px-5 sm:px-6 lg:px-12 xl:px-20 py-14 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14 space-y-3">
          <Eyebrow>Loved by neighbours</Eyebrow>
          <h2 className="font-fredoka text-4xl md:text-5xl text-deep-slate">
            Real dogs. Real regulars.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={i}
              className="bg-white border border-pebble-grey/20 rounded-[18px] p-5 sm:p-6 card-lift relative flex flex-col"
            >
              <div className="absolute -top-3 left-5 text-5xl font-fredoka text-groomr-gold leading-none">
                &ldquo;
              </div>
              <blockquote className="text-deep-slate font-nunito text-sm sm:text-base leading-relaxed pt-3 flex-1">
                {t.text}
              </blockquote>
              <figcaption className="mt-4 pt-4 border-t border-pebble-grey/10 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.avatar}
                  alt={t.name}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
                <div>
                  <p className="font-bold text-sm text-deep-slate">{t.name}</p>
                  <p className="text-xs text-pebble-grey">{t.dog}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
