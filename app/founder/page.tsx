import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Founder — Groomr",
  description:
    "A note from Andrew Hughes, founder of Groomr — and his co-pilot Murphy.",
};

export default function FounderPage() {
  return (
    <div className="page-fade w-full flex justify-center py-12 px-6 md:px-12">
      <div className="max-w-3xl w-full space-y-16">

        {/* ── LETTERHEAD ───────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <Image
            src="https://res.cloudinary.com/dr8adq7nl/image/upload/v1774753273/DEEP_SLATE_auun2o.png"
            alt="Groomr"
            width={48}
            height={48}
            className="h-10 w-10 md:h-12 md:w-12 object-contain opacity-90"
          />
          <p className="italic text-lg md:text-xl font-medium text-pebble-grey">
            &ldquo;Your dog deserves a regular.&rdquo;
          </p>
        </div>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="space-y-8">
          <h1 className="font-fredoka text-3xl md:text-4xl font-bold border-b-2 border-pebble-grey/30 pb-4 text-deep-slate">
            A Note from the Founder
          </h1>
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <Image
              src="https://res.cloudinary.com/dr8adq7nl/image/upload/v1774800795/Gemini_Generated_Image_ym8cypym8cypym8c_saonpr.png"
              alt="Andrew Hughes"
              width={224}
              height={224}
              className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-full shadow-lg border-4 border-white shrink-0"
            />
            <div className="space-y-4">
              <p className="text-base md:text-lg leading-relaxed italic text-deep-slate">
                &ldquo;I spent fifteen years in hospitality management, learning a fundamental truth:
                the best experiences aren&apos;t born from pure efficiency—they&apos;re rooted in
                how a place makes you feel. When you walk through the door, you want to feel known,
                understood, and safe.&rdquo;
              </p>
              <p className="text-lg leading-relaxed text-deep-slate/90">
                Groomr isn&apos;t just a tech project; it&apos;s a deeply personal mission to
                champion the independent groomers who bring that exact warmth, trust, and care to
                our best friends.
              </p>
            </div>
          </div>
        </section>

        {/* ── MURPHY & THE AHA MOMENT ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-4">

          {/* The Journey */}
          <div className="space-y-5 pr-0 md:pr-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 uppercase tracking-widest text-xs font-bold text-muted-terracotta">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              The Journey
            </div>
            <h2 className="font-fredoka text-2xl font-bold text-deep-slate">
              The Problem with Moving
            </h2>
            <p className="leading-relaxed text-base text-deep-slate">
              I&apos;ve packed up my life and moved cities more times than I can count. Through
              every transition, the one constant has been my co-pilot,{" "}
              <strong className="font-extrabold">Murphy</strong>, a spirited 5-year-old
              long-haired Chihuahua. Every time we settled into a new place, finding a flat or a
              local grocery store was easy. The truly agonizing task? Finding a groomer I could
              actually trust with my boy.
            </p>
            <p className="leading-relaxed text-base text-deep-slate">
              You aren&apos;t just dropping off a car for a service; you are leaving a family
              member with someone new. Will they understand his quirks? Will they be patient if he
              gets nervous? The lack of transparency online made every new booking feel like a
              massive leap of faith.
            </p>
            <p className="leading-relaxed text-base text-deep-slate">
              The sheer exhaustion of playing phone tag, reading unverified reviews, and showing
              up to a clinical, impersonal storefront was heartbreaking. I realized that if I felt
              this overwhelmed as an owner, others definitely did too. Groomr was born out of a
              desire to eliminate that anxiety, replacing it with transparency, trust, and a
              genuine love for dogs.
            </p>
          </div>

          {/* Meet Murphy */}
          <div className="p-8 rounded-3xl space-y-5 shadow-sm h-full bg-white border border-pebble-grey/30 flex flex-col">
            <div className="flex items-center gap-2 uppercase tracking-widest text-base font-bold text-sage-leaf">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
              Meet Murphy
            </div>
            <Image
              src="https://res.cloudinary.com/dr8adq7nl/image/upload/v1774800794/Gemini_Generated_Image_riff5mriff5mriff_cwvncg.png"
              alt="Murphy the Dog"
              width={400}
              height={224}
              className="w-full h-48 md:h-56 object-cover rounded-2xl shadow-sm border border-pebble-grey/10"
            />
            <div>
              <h2 className="font-fredoka text-lg font-bold text-deep-slate mt-2">
                Small Dog Energy
              </h2>
              <p className="text-[10px] font-bold text-muted-terracotta uppercase tracking-widest mt-1">
                Official Co-Pilot
              </p>
            </div>
            <p className="leading-relaxed text-base text-deep-slate">
              Murphy isn&apos;t just a dog; he&apos;s my family. He possesses an endless reserve
              of &lsquo;small dog energy,&rsquo; a fierce loyalty, and a coat that requires
              serious TLC.
            </p>
            <p className="leading-relaxed text-base text-deep-slate">
              When I finally found those hidden gem, independent groomers—the ones who sat on the
              floor to greet him, who knew his quirks, and who rejected the clinical, rush-job feel
              of corporate chain stores—I realized something profound. These local, passionate
              groomers are the true heartbeat of the pet industry. They don&apos;t just cut hair;
              they build trust.
            </p>
          </div>
        </div>

        {/* ── HOSPITALITY & TECH ───────────────────────────────────────── */}
        <section className="space-y-6 p-8 md:p-10 rounded-3xl shadow-sm bg-sage-leaf/20 mt-8">
          <div className="flex items-center gap-2 uppercase tracking-widest text-xs font-bold text-deep-slate">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            The Background
          </div>
          <h2 className="font-fredoka text-3xl font-bold text-deep-slate">
            From Hospitality to Hub
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-base text-deep-slate">
            <p className="leading-relaxed">
              My professional journey started in early education, focusing on how technology can
              empower rather than distract. Later, in hospitality management, I used software to
              streamline the chaotic back-office operations so my team could do what they loved:
              spending time with the people in front of them, not staring at spreadsheets.
            </p>
            <p className="leading-relaxed">
              Now, I&apos;m weaving those two worlds together. Groomr was built to be a central,
              intuitive hub. For dog owners, it&apos;s the peace of mind to find, verify, and book
              a trusted local professional in minutes. For groomers, it&apos;s a tailored dashboard
              that handles the heavy lifting, allowing them to reclaim their time and focus on the
              dogs.
            </p>
          </div>
        </section>

        {/* ── THE PROMISE ──────────────────────────────────────────────── */}
        <section className="text-center space-y-8 py-12 border-t-2 border-pebble-grey/30">
          <h2 className="font-fredoka text-3xl font-bold text-deep-slate">
            My Lifetime Commitment
          </h2>
          <p className="max-w-xl mx-auto leading-relaxed text-lg text-deep-slate">
            This platform is my love letter to the local shops that have supported Murphy and me
            through thick and thin. I am fiercely passionate about helping these small businesses
            thrive in a digital world without losing their analog soul.
          </p>
          <p className="max-w-xl mx-auto leading-relaxed text-lg text-deep-slate">
            To honor that bond, every single groomer I have personally worked with on this journey
            will be offered Groomr&apos;s premium services{" "}
            <strong className="text-muted-terracotta font-extrabold">
              free of charge for life
            </strong>
            . That&apos;s my promise.
          </p>

          <div className="pt-8 flex flex-col items-center space-y-2">
            <Image
              src="https://res.cloudinary.com/dr8adq7nl/image/upload/v1774753273/DEEP_SLATE_auun2o.png"
              alt="Groomr"
              width={40}
              height={40}
              className="h-10 w-10 object-contain opacity-90 mb-2"
            />
            <Image
              src="https://res.cloudinary.com/dr8adq7nl/image/upload/v1775260142/SignatureGroomrGold_lxgo1l.png"
              alt="Andrew Hughes signature"
              width={192}
              height={96}
              className="h-20 md:h-24 w-auto object-contain opacity-90 -mb-2 -rotate-2"
            />
            <p className="font-fredoka text-2xl font-bold text-deep-slate">
              Andrew Hughes
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-pebble-grey mt-1">
              Founder &amp; Dog Dad{" "}
              <span className="text-muted-terracotta mx-1">&bull;</span>{" "}
              Murphy, Co-Pilot
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
