// Landing — hero with search, "What we believe" three-up, social proof.

const LandingScreen = ({ onSearch, onSignup }) => {
  const [q, setQ] = React.useState("");
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="bg-alabaster-cream py-20 md:py-32 px-6 lg:px-12 xl:px-20 text-center relative overflow-hidden">
        {/* Subtle splash background */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-groomr-gold/15 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-muted-terracotta/10 rounded-full blur-3xl pointer-events-none"/>

        <div className="max-w-4xl mx-auto relative">
          <h1 className="font-fredoka text-5xl md:text-6xl lg:text-7xl text-deep-slate leading-tight tracking-tight">
            Find a groomer they'll wag for.
          </h1>
          <div className="mt-10">
            <SearchPill value={q} onChange={setQ} onSubmit={onSearch}/>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-pebble-grey font-bold">
            <ShieldIcon size={18}/>
            <span>1,200+ verified groomers across the UK</span>
          </div>
        </div>
      </section>

      {/* What we believe */}
      <section className="py-20 px-6 lg:px-12 xl:px-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-sage-leaf uppercase tracking-widest">What we believe</span>
            <h2 className="font-fredoka text-4xl md:text-5xl text-deep-slate mt-3">A better way for both ends of the lead.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { Icon: ScissorsIcon, title: "Talent over noise.", body: "We surface the brilliant local groomers near you — not the ones with the biggest ad spend." },
              { Icon: CalendarIcon, title: "Booking in two taps.", body: "See real-time availability and lock in your slot. No phone tag. No awkward DMs." },
              { Icon: PetsIcon,     title: "Tools that respect time.", body: "Our groomer dashboard handles diaries, reminders, and payments — so they can focus on the dog." },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="bg-alabaster-cream rounded-[12px] p-8 card-lift border border-pebble-grey/10">
                <Icon size={56}/>
                <h3 className="font-fredoka text-2xl text-deep-slate mt-5">{title}</h3>
                <p className="text-deep-slate/80 mt-3 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Groomers — cream panel matching hero rhythm */}
      <section className="bg-alabaster-cream py-20 px-6 lg:px-12 xl:px-20 relative overflow-hidden">
        <div className="absolute -top-24 -right-32 w-[480px] h-[480px] bg-groomr-gold/15 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute -bottom-32 -left-24 w-96 h-96 bg-muted-terracotta/10 rounded-full blur-3xl pointer-events-none"/>

        <div className="max-w-5xl mx-auto grid md:grid-cols-[1.1fr_1fr] gap-12 md:gap-16 items-center relative">
          <div className="space-y-5">
            <h2 className="font-fredoka text-4xl md:text-5xl text-deep-slate leading-tight">Are you a dog groomer?</h2>
            <p className="text-deep-slate/80 text-lg leading-relaxed max-w-md">
              Bring your business to Groomr and let us handle the diary, the reminders, and the payments — so you can focus on the dog.
            </p>
            <button
              className="btn-primary font-nunito font-bold px-8 py-3 rounded-full text-base focus-ring mt-2 shadow-sm">
              Learn More
            </button>
          </div>

          <ul className="space-y-4">
            {[
              { title: "Get found locally.",     body: "Show up in search for owners in your postcode." },
              { title: "Fewer no-shows.",        body: "Automatic reminders sent on your behalf." },
              { title: "Get paid, hassle-free.", body: "Card payments at booking; cash flow you can plan around." },
            ].map(({ title, body }) => (
              <li key={title} className="bg-white rounded-[12px] p-5 flex gap-4 border border-pebble-grey/15 card-lift">
                <div className="w-9 h-9 rounded-full bg-groomr-gold/30 text-deep-slate flex items-center justify-center shrink-0">
                  <CheckIcon size={18}/>
                </div>
                <div>
                  <p className="font-bold text-deep-slate">{title}</p>
                  <p className="text-sm text-deep-slate/70 mt-1">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
};

window.LandingScreen = LandingScreen;
