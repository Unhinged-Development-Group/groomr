// Dashboard — logged-in customer profile.

const DashboardScreen = ({ user, onSearch, onAddDog }) => {
  const [q, setQ] = React.useState("");
  const upcoming = {
    month: "MAY", day: "23",
    service: "Full Groom & Tidy", dog: "Marlow",
    time: "Saturday, 23 May · 10:30 AM",
    groomer: "Wagington & Co.", distance: 0.8,
  };
  const past = [
    { service: "Full Groom",   groomer: "Wagington & Co.", date: "Apr 12, 2026", dog: "Marlow", price: 58 },
    { service: "Bath & Brush", groomer: "The Snug Salon",  date: "Mar 02, 2026", dog: "Marlow", price: 38 },
    { service: "Nail Clip",    groomer: "Wagington & Co.", date: "Feb 19, 2026", dog: "Marlow", price: 15 },
  ];
  const dogs = [
    { name: "Marlow", breed: "Cocker Spaniel · 4 yrs",   img: "https://images.unsplash.com/photo-1591768793355-74d04bb6608f?auto=format&fit=crop&w=200&q=70" },
    { name: "Biscuit", breed: "Border Terrier · 2 yrs",  img: "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?auto=format&fit=crop&w=200&q=70" },
  ];

  return (
    <main className="flex-1 bg-alabaster-cream">
      <div className="w-full px-6 lg:px-12 xl:px-20 py-12">
        {/* Greeting */}
        <div className="mb-10">
          <p className="text-xs font-bold text-sage-leaf uppercase tracking-widest">Welcome back</p>
          <h1 className="font-fredoka text-5xl text-deep-slate mt-1">Hi, {user.firstName}.</h1>
          <p className="font-nunito italic text-deep-slate/70 mt-2 text-lg">"Two pups, one happy diary."</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-10">
          {/* Main column */}
          <div className="space-y-12">
            {/* Upcoming */}
            <section>
              <h2 className="font-fredoka text-2xl text-deep-slate mb-4">Upcoming</h2>
              <UpcomingAppointmentCard appt={upcoming}/>
            </section>

            {/* Quick search */}
            <section className="bg-white rounded-[12px] p-6 border border-pebble-grey/20">
              <h3 className="font-fredoka text-xl text-deep-slate mb-4">Book another groom</h3>
              <SearchPill value={q} onChange={setQ} onSubmit={onSearch} placeholder="Postcode, town, or city..."/>
            </section>

            {/* Past appointments */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-fredoka text-2xl text-deep-slate">Recent grooms</h2>
                <button className="text-sm font-bold text-sage-leaf hover:text-muted-terracotta transition-colors">See all</button>
              </div>
              <div className="space-y-3">
                {past.map((a, i) => <PastAppointmentRow key={i} appt={a}/>)}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <section className="bg-white rounded-[12px] p-6 border border-pebble-grey/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-fredoka text-xl text-deep-slate">My dogs</h3>
                <button onClick={onAddDog} className="text-sage-leaf hover:text-muted-terracotta transition-colors focus-ring rounded-full p-1" aria-label="Add dog">
                  <PlusIcon size={20}/>
                </button>
              </div>
              <div className="space-y-3">
                {dogs.map(d => (
                  <div key={d.name} className="flex items-center gap-3">
                    <img src={d.img} alt={d.name} className="w-12 h-12 rounded-full object-cover border-2 border-groomr-gold/40"/>
                    <div>
                      <p className="font-bold text-deep-slate">{d.name}</p>
                      <p className="text-xs text-pebble-grey">{d.breed}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-deep-slate text-alabaster-cream rounded-[12px] p-6 border-t-[6px] border-groomr-gold">
              <h3 className="font-fredoka text-xl">Refer a friend</h3>
              <p className="text-sage-leaf text-sm mt-2 leading-relaxed">Give them £10 off their first groom — get £10 off your next one.</p>
              <button className="mt-4 w-full bg-groomr-gold text-deep-slate font-nunito font-bold px-4 py-2.5 rounded-full text-sm hover:bg-muted-terracotta hover:text-white transition-colors duration-300 focus-ring">Get my link</button>
            </section>

            <section className="bg-white rounded-[12px] p-6 border border-pebble-grey/20">
              <h3 className="font-fredoka text-xl text-deep-slate mb-3">Favourites</h3>
              <div className="flex -space-x-3">
                {GROOMERS.slice(0, 4).map(g => (
                  <img key={g.id} src={g.image} alt={g.name}
                       className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"/>
                ))}
              </div>
              <button className="mt-4 text-sm font-bold text-sage-leaf hover:text-muted-terracotta transition-colors">View all favourites</button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
};

window.DashboardScreen = DashboardScreen;
