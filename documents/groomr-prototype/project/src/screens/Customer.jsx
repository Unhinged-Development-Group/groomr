// Customer dashboard — Dog-led "you and your pack" layout.

const CustomerDashboard = ({ user, onView, onSearch, onBook }) => {
  const upcoming = {
    groomer: GROOMERS[0],
    service: GROOMERS[0].services[1],
    when: "Sat 23 May, 10:30am",
    dog: DOGS[0],
  };

  const past = [
    { groomer: GROOMERS[0], date: "12 Apr", svc: "Full Groom", dog: DOGS[0] },
    { groomer: GROOMERS[2], date: "02 Mar", svc: "Bath & Brush", dog: DOGS[1] },
    { groomer: GROOMERS[0], date: "12 Feb", svc: "Full Groom", dog: DOGS[0] },
  ];

  const favs = [GROOMERS[0], GROOMERS[3]];

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-10 space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Hello, {user.name.split(" ")[0]}</Eyebrow>
          <h1 className="font-fredoka text-4xl md:text-5xl text-deep-slate mt-2">Your pack.</h1>
        </div>
        <button onClick={onSearch} className="btn-primary font-nunito font-bold px-6 py-3 rounded-full focus-ring shadow-subtle">+ Book a Groom</button>
      </header>

      {/* Dogs row */}
      <section>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DOGS.map(d => (
            <div key={d.id} className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden card-lift">
              <div className="aspect-[5/3] bg-sage-leaf/20 overflow-hidden">
                <img src={d.img} alt={d.name} className="w-full h-full object-cover"/>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-fredoka text-2xl text-deep-slate">{d.name}</h3>
                  <Badge tone={d.dueIn <= 7 ? "terra" : "sage"}>Due in {d.dueIn} days</Badge>
                </div>
                <p className="text-sm text-pebble-grey font-bold">{d.breed} · {d.age} · {d.coat} coat</p>
                <p className="text-sm text-deep-slate italic">"{d.notes}"</p>
                <div className="flex gap-2 pt-2">
                  <button onClick={onSearch} className="btn-primary flex-1 font-nunito font-bold px-4 py-2 rounded-full text-sm focus-ring">Book</button>
                  <button className="btn-secondary px-4 py-2 rounded-full text-sm focus-ring font-nunito font-bold">Edit</button>
                </div>
              </div>
            </div>
          ))}

          <button className="border-2 border-dashed border-pebble-grey/30 rounded-[20px] flex flex-col items-center justify-center gap-2 p-10 text-pebble-grey hover:border-deep-slate hover:text-deep-slate transition-colors font-bold focus-ring">
            <PlusIcon size={28}/> Add a dog
          </button>
        </div>
      </section>

      {/* Upcoming */}
      <section>
        <h2 className="font-fredoka text-2xl text-deep-slate mb-4">Up next</h2>
        <div className="bg-deep-slate text-alabaster-cream rounded-[24px] p-7 grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-groomr-gold flex items-center justify-center font-fredoka text-2xl text-deep-slate shrink-0">
              {upcoming.dog.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-groomr-gold mb-1">Confirmed</p>
              <p className="font-fredoka text-2xl">{upcoming.dog.name} · {upcoming.service.name}</p>
              <p className="text-sage-leaf">{upcoming.when} · {upcoming.groomer.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <button className="btn-gold-on-dark font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring">View Details</button>
            <button className="font-nunito font-bold text-alabaster-cream border-2 border-sage-leaf hover:bg-sage-leaf hover:text-deep-slate transition-colors px-5 py-2.5 rounded-full text-sm focus-ring">Reschedule</button>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Past */}
        <section>
          <h2 className="font-fredoka text-2xl text-deep-slate mb-4">Past grooms</h2>
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
            {past.map((p, i) => (
              <div key={i} className={`p-4 flex items-center gap-4 ${i ? "border-t border-pebble-grey/10" : ""}`}>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-sage-leaf/20 shrink-0">
                  <img src={p.dog.img} alt="" className="w-full h-full object-cover"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-deep-slate text-sm truncate">{p.dog.name} · {p.svc}</p>
                  <p className="text-xs text-pebble-grey">{p.groomer.name} · {p.date}</p>
                </div>
                <button onClick={() => onBook(p.groomer, p.groomer.services[0])} className="text-xs font-bold text-deep-slate text-link">Rebook →</button>
              </div>
            ))}
          </div>
        </section>

        {/* Favourites */}
        <section>
          <h2 className="font-fredoka text-2xl text-deep-slate mb-4">Your regulars</h2>
          <div className="space-y-3">
            {favs.map(g => (
              <button key={g.id} onClick={() => onView(g)}
                className="w-full text-left bg-white border border-pebble-grey/20 rounded-[20px] p-4 flex items-center gap-4 card-lift focus-ring">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-sage-leaf/20 shrink-0">
                  <img src={g.image} alt="" className="w-full h-full object-cover"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-fredoka text-deep-slate truncate">{g.name}</p>
                  <p className="text-xs text-pebble-grey">{g.location} · {g.rating}★ · From £{g.priceFrom}</p>
                </div>
                <HeartIcon size={20} filled/>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

window.CustomerDashboard = CustomerDashboard;
