import Image from "next/image";
import Link from "next/link";
import { SearchIcon, CalendarIcon, FavoritesIcon, ShieldIcon } from "@/components/ui/GroomrIcons";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Badge } from "@/components/ui/Badge";
import { SearchPillWrapper } from "./_components/SearchPillWrapper";

const HOW_IT_WORKS = [
  {
    Icon: SearchIcon,
    title: "Find your match",
    body: "Search by location. See real availability, prices, and reviews from neighbours.",
  },
  {
    Icon: CalendarIcon,
    title: "Book in seconds",
    body: "No back-and-forth DM's. Pick a slot, pay deposit, done.",
  },
  {
    Icon: FavoritesIcon,
    title: "Build a routine",
    body: "Rebook your favourite groomer in two taps.",
    tagline: '"Your dog deserves a regular."',
  },
];

const TESTIMONIALS = [
  {
    name: "Anya",
    dog: "Lab cross",
    text: "I used to forget to book until Marlow was a tangled mess. Groomr just… does it for me.",
  },
  {
    name: "Tom",
    dog: "Bichon",
    text: "Finding a groomer who's good with anxious dogs was impossible. Found two within 1 mile.",
  },
  {
    name: "Priya",
    dog: "Yorkie · 13yrs",
    text: "Senior-care filter is a quiet miracle. Bramble actually enjoys it now.",
  },
];

export default function LandingPage() {
  return (
    <div className="page-fade">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="w-full px-6 lg:px-12 xl:px-20 pt-10 pb-20 md:pt-16 md:pb-32 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-7 max-w-xl">
            <Eyebrow>Local · Independent · Loved</Eyebrow>

            <h1 className="font-fredoka text-5xl md:text-6xl lg:text-7xl text-deep-slate leading-[0.95]">
              Book your dog&apos;s
              <br />
              next groom in
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">minutes.</span>
                <span className="absolute inset-x-0 bottom-1 h-4 bg-groomr-gold/60 -z-0 rounded-sm" />
              </span>
            </h1>

            <p className="text-xl text-deep-slate font-nunito italic font-bold leading-relaxed">
              &ldquo;Your dog deserves a regular.&rdquo;
            </p>

            <div className="pt-2">
              <SearchPillWrapper placeholder="Postcode, town, or 'near me'" ctaLabel="Find Groomers" />
              <div className="flex flex-wrap gap-2 mt-3 text-xs">
                <span className="text-pebble-grey font-bold mr-1 self-center">Popular:</span>
                {["E8", "Hackney", "Bethnal Green", "Mobile only"].map((t) => (
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

            <div className="flex flex-wrap items-center gap-4 pt-3 text-sm font-bold text-pebble-grey">
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
                src="https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?auto=format&fit=crop&w=600&q=70"
                alt="Dog being groomed"
                fill
                className="object-cover"
                sizes="288px"
              />
            </div>
            <div className="absolute bottom-12 left-0 w-64 h-72 rounded-[24px] overflow-hidden shadow-lift -rotate-[4deg]">
              <Image
                src="https://images.unsplash.com/photo-1611173622933-91942d394b04?auto=format&fit=crop&w=600&q=70"
                alt="Happy groomed dog"
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
                    Marlow&apos;s next groom
                  </p>
                  <p className="text-xs text-pebble-grey font-bold">Sat 23 May, 10:30am</p>
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
      <section className="w-full px-6 lg:px-12 xl:px-20 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <Eyebrow>How Groomr works</Eyebrow>
          <h2 className="font-fredoka text-4xl md:text-5xl text-deep-slate">
            Booking grooming, finally easy.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {HOW_IT_WORKS.map(({ Icon, title, body, tagline }, i) => (
            <div
              key={title}
              className="bg-white border border-pebble-grey/20 rounded-[20px] p-7 card-lift"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-alabaster-cream border border-pebble-grey/15 flex items-center justify-center">
                  <Icon size={26} className="text-deep-slate" />
                </div>
                <span className="font-fredoka text-3xl text-pebble-grey/40">0{i + 1}</span>
              </div>
              <h3 className="font-fredoka text-xl text-deep-slate mb-2">{title}</h3>
              <p className="text-pebble-grey font-nunito leading-relaxed">
                {body}
                {tagline && <span className="tagline ml-1">{tagline}</span>}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── GROOMER STRIP ────────────────────────────────────────────── */}
      <section className="bg-alabaster-cream py-20 md:py-24">
        <div className="w-full px-6 lg:px-12 xl:px-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <h2 className="font-fredoka text-4xl md:text-5xl text-deep-slate">
              Are you a dog groomer?
            </h2>
            <p className="text-pebble-grey text-lg leading-relaxed font-nunito">
              Online booking, automatic reminders, payments, and a profile that shows up where dog
              owners actually look. Free to list.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/become-a-groomer"
                className="btn-primary font-nunito font-bold px-7 py-3 rounded-full focus-ring shadow-subtle inline-flex items-center"
              >
                Become a Groomr
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-5 border-t border-pebble-grey/20 mt-6">
              <div>
                <p className="font-fredoka text-3xl text-deep-slate">2,400+</p>
                <p className="text-xs font-bold text-sage-leaf uppercase tracking-wider">
                  Verified groomers
                </p>
              </div>
              <div>
                <p className="font-fredoka text-3xl text-deep-slate">38hrs</p>
                <p className="text-xs font-bold text-sage-leaf uppercase tracking-wider">
                  Saved monthly avg
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
            <div className="bg-white text-deep-slate rounded-[24px] p-7 shadow-modal border border-pebble-grey/15">
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

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="w-full px-6 lg:px-12 xl:px-20 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <Eyebrow>Loved by neighbours</Eyebrow>
          <h2 className="font-fredoka text-4xl md:text-5xl text-deep-slate">
            Real dogs. Real regulars.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={i}
              className="bg-white border border-pebble-grey/20 rounded-[20px] p-7 card-lift relative flex flex-col"
            >
              <div className="absolute -top-4 left-7 text-6xl font-fredoka text-groomr-gold leading-none">
                &ldquo;
              </div>
              <blockquote className="text-deep-slate font-nunito text-lg leading-relaxed pt-4 flex-1">
                {t.text}
              </blockquote>
              <figcaption className="mt-5 pt-5 border-t border-pebble-grey/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sage-leaf text-white font-fredoka flex items-center justify-center">
                  {t.name.charAt(0)}
                </div>
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
