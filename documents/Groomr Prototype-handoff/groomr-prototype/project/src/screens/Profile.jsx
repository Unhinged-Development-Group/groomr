// Profile — Bio-led editorial layout, sticky right book panel, story / portfolio / services / reviews.

const Profile = ({ groomer, onBook, onBack }) => {
  if (!groomer) return null;
  const [savedSvc, setSavedSvc] = React.useState(null);

  return (
    <div className="page-fade">
      {/* Top: image hero band */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img src={groomer.image} alt="" className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-t from-deep-slate/70 via-deep-slate/20 to-transparent"></div>
        <button onClick={onBack}
          className="absolute top-5 left-5 bg-white/95 hover:bg-white transition-colors rounded-full px-4 py-2 font-bold text-sm text-deep-slate shadow-subtle flex items-center gap-2 focus-ring">
          <ChevronLeft size={16}/> Back to results
        </button>
        <div className="absolute bottom-6 left-6 right-6 md:left-12 lg:left-20 text-alabaster-cream">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-groomr-gold mb-2">{groomer.tagline}</p>
          <h1 className="font-fredoka text-4xl md:text-6xl leading-none">{groomer.name}</h1>
        </div>
      </div>

      <div className="w-full px-6 lg:px-12 xl:px-20 py-10 grid lg:grid-cols-[1fr_380px] gap-10">
        <div className="space-y-12 min-w-0">
          {/* Headline strip */}
          <div className="flex flex-wrap items-center gap-5 pb-6 border-b border-pebble-grey/15">
            <StarRow rating={groomer.rating} count={groomer.reviewCount} size={18}/>
            <div className="flex items-center gap-2 text-sm font-bold text-pebble-grey">
              <PinIcon size={16}/> {groomer.location} · {groomer.distance} mi
            </div>
            <div className="flex flex-wrap gap-2">
              {groomer.badges.map(b => <Badge key={b} tone={b === "Verified" ? "gold" : "sage"}>{b === "Verified" && <ShieldIcon size={12}/>}{b}</Badge>)}
            </div>
          </div>

          {/* Bio / story */}
          <section>
            <Eyebrow>Meet {groomer.owner.split(" ")[0]}</Eyebrow>
            <h2 className="font-fredoka text-3xl md:text-4xl text-deep-slate mt-2 mb-4 max-w-2xl">
              {groomer.yearsActive} years of patient, careful grooming.
            </h2>
            <p className="text-lg text-deep-slate font-nunito leading-relaxed max-w-2xl">{groomer.bio}</p>
          </section>

          {/* Portfolio */}
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <Eyebrow>Recent grooms</Eyebrow>
              <button className="text-sm font-bold text-deep-slate text-link">View all</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {groomer.portfolio.map((src, i) => (
                <div key={i} className={`rounded-[16px] overflow-hidden bg-sage-leaf/20 ${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}>
                  <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"/>
                </div>
              ))}
            </div>
          </section>

          {/* Services */}
          <section>
            <Eyebrow>Services & pricing</Eyebrow>
            <h2 className="font-fredoka text-3xl text-deep-slate mt-2 mb-5">Pick what {groomer.name.split(" ")[0]} needs.</h2>
            <div className="space-y-3">
              {groomer.services.map(s => (
                <button key={s.name} onClick={() => onBook(groomer, s)}
                  onMouseEnter={() => setSavedSvc(s.name)} onMouseLeave={() => setSavedSvc(null)}
                  className="w-full text-left bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors rounded-[16px] p-5 flex items-center gap-5 group focus-ring">
                  <div className="w-12 h-12 rounded-2xl bg-alabaster-cream border border-pebble-grey/15 flex items-center justify-center shrink-0">
                    <ScissorsIcon size={26}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3">
                      <h3 className="font-fredoka text-xl text-deep-slate">{s.name}</h3>
                      <span className="text-xs text-pebble-grey font-bold flex items-center gap-1"><ClockIcon size={12}/>{s.duration}</span>
                    </div>
                    {s.desc && <p className="text-sm text-pebble-grey mt-1 truncate">{s.desc}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-fredoka text-2xl text-deep-slate">£{s.price}</p>
                    <span className={`text-xs font-bold transition-colors ${savedSvc === s.name ? "text-muted-terracotta" : "text-pebble-grey"}`}>
                      Book →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Reviews */}
          <section>
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <Eyebrow>Reviews</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate mt-2">What neighbours say</h2>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="font-fredoka text-3xl text-deep-slate">{groomer.rating}</span>
                  <StarIcon size={20}/>
                </div>
                <p className="text-xs text-pebble-grey font-bold">{groomer.reviewCount} reviews</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {groomer.reviews.map((r, i) => (
                <div key={i} className="bg-white border border-pebble-grey/20 rounded-[16px] p-5">
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-sage-leaf text-white font-fredoka flex items-center justify-center shrink-0">{r.name.charAt(0)}</div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-deep-slate">{r.name}</p>
                        <p className="text-xs text-pebble-grey truncate">{r.dog}</p>
                      </div>
                    </div>
                    <StarRow rating={r.rating} size={12}/>
                  </div>
                  <p className="text-sm text-deep-slate font-nunito leading-relaxed">{r.text}</p>
                  <p className="text-xs text-pebble-grey font-bold mt-3">{r.when}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky book panel */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 bg-white border border-pebble-grey/20 rounded-[24px] p-6 shadow-subtle space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-sage-leaf">From</p>
              <p className="font-fredoka text-4xl text-deep-slate">£{groomer.priceFrom}</p>
            </div>

            <div className="bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-sage-leaf rounded-full"></span>
                <p className="text-xs font-bold uppercase tracking-wider text-sage-leaf">Next available</p>
              </div>
              <p className="font-fredoka text-lg text-deep-slate">{groomer.nextSlot}</p>
            </div>

            <button onClick={() => onBook(groomer, groomer.services[0])}
              className="btn-primary w-full font-nunito font-bold py-4 rounded-full text-base focus-ring shadow-subtle">
              Book a Service
            </button>
            <button className="btn-secondary w-full font-nunito font-bold py-3 rounded-full text-sm focus-ring flex items-center justify-center gap-2">
              <MessageIcon size={16}/> Message {groomer.owner.split(" ")[0]}
            </button>

            <div className="pt-4 border-t border-pebble-grey/15 space-y-2 text-sm">
              <div className="flex items-center gap-3 text-deep-slate">
                <ShieldIcon size={18}/> <span className="font-bold">Verified groomer</span>
              </div>
              <div className="flex items-center gap-3 text-deep-slate">
                <CalendarIcon size={18}/> <span className="font-bold">Free cancellation up to 24h</span>
              </div>
              <div className="flex items-center gap-3 text-deep-slate">
                <HeartIcon size={18}/> <span className="font-bold">{groomer.reviewCount}+ regulars</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden sticky bottom-0 bg-white border-t border-pebble-grey/20 px-6 py-4 flex items-center justify-between gap-4 shadow-modal z-30">
        <div>
          <p className="text-xs text-pebble-grey font-bold">From</p>
          <p className="font-fredoka text-xl text-deep-slate">£{groomer.priceFrom}</p>
        </div>
        <button onClick={() => onBook(groomer, groomer.services[0])} className="btn-primary font-nunito font-bold px-7 py-3 rounded-full focus-ring">Book Now</button>
      </div>
    </div>
  );
};

window.Profile = Profile;
