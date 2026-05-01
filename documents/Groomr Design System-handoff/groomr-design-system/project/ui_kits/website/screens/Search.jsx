// Search — filters sidebar + groomer card grid + map placeholder.

const GROOMERS = [
  { id: 1, name: "Wagington & Co.", tagline: "Mobile · Hand-stripping experts", location: "Hackney", distance: 0.8, rating: 4.9, priceFrom: 38,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=600&q=70",
    services: ["Full Groom","Bath & Brush","Nail Clip","De-shed"],
    servicesDetail: [
      { name: "Full Groom",    duration: "90 min", price: 58 },
      { name: "Bath & Brush",  duration: "45 min", price: 38 },
      { name: "Nail Clip",     duration: "15 min", price: 15 },
    ]
  },
  { id: 2, name: "The Snug Salon", tagline: "Studio · Anxious-dog specialists", location: "Bethnal Green", distance: 1.4, rating: 4.8, priceFrom: 42,
    image: "https://images.unsplash.com/photo-1583511655802-41f17ea38f31?auto=format&fit=crop&w=600&q=70",
    services: ["Full Groom","Puppy First","Hand-Strip"],
    servicesDetail: [
      { name: "Full Groom",   duration: "2 hr",  price: 65 },
      { name: "Puppy First",  duration: "45 min",price: 42 },
      { name: "Hand-Strip",   duration: "2 hr",  price: 80 },
    ]
  },
  { id: 3, name: "Bark & Bubbles", tagline: "Studio · Spa-style finishes", location: "Dalston", distance: 1.9, rating: 4.7, priceFrom: 35,
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=70",
    services: ["Spa Bath","Full Groom","Teeth Clean"],
    servicesDetail: [
      { name: "Spa Bath",     duration: "60 min", price: 35 },
      { name: "Full Groom",   duration: "90 min", price: 55 },
      { name: "Teeth Clean",  duration: "20 min", price: 18 },
    ]
  },
  { id: 4, name: "Hounds & Honey", tagline: "Mobile · Senior-dog gentle grooms", location: "Stoke Newington", distance: 2.3, rating: 5.0, priceFrom: 45,
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=70",
    services: ["Full Groom","Senior Care","Nail Clip"],
    servicesDetail: [
      { name: "Senior Gentle Groom", duration: "75 min", price: 55 },
      { name: "Full Groom",          duration: "90 min", price: 50 },
      { name: "Nail Clip",           duration: "15 min", price: 18 },
    ]
  },
  { id: 5, name: "Top Dog Studio", tagline: "Studio · Show-cut specialists", location: "Islington", distance: 2.8, rating: 4.9, priceFrom: 50,
    image: "https://images.unsplash.com/photo-1612531822800-cda6cf9c8caa?auto=format&fit=crop&w=600&q=70",
    services: ["Show Cut","Full Groom","Hand-Strip"],
    servicesDetail: [
      { name: "Show Cut",   duration: "2.5 hr", price: 95 },
      { name: "Full Groom", duration: "90 min", price: 60 },
      { name: "Hand-Strip", duration: "2 hr",   price: 85 },
    ]
  },
  { id: 6, name: "Pawfection", tagline: "Studio · All breeds, all coats", location: "Hoxton", distance: 3.2, rating: 4.6, priceFrom: 32,
    image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=70",
    services: ["Full Groom","Bath & Brush","Nail Clip"],
    servicesDetail: [
      { name: "Full Groom",   duration: "90 min", price: 50 },
      { name: "Bath & Brush", duration: "45 min", price: 32 },
      { name: "Nail Clip",    duration: "15 min", price: 12 },
    ]
  },
];

const FILTERS = ["All","Mobile","Studio","Hand-Strip","Puppy","Senior","Anxious Dogs"];

const SearchScreen = ({ onSelectGroomer, query }) => {
  const [active, setActive] = React.useState("All");
  return (
    <main className="flex-1 bg-alabaster-cream">
      <div className="w-full px-6 lg:px-12 xl:px-20 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold text-sage-leaf uppercase tracking-widest">Showing groomers near</p>
            <h1 className="font-fredoka text-4xl text-deep-slate">{query || "Hackney, E8"}</h1>
            <p className="text-sm text-pebble-grey mt-1">{GROOMERS.length} groomers · sorted by distance</p>
          </div>
          <SearchPill value={query} placeholder="Try another postcode..." ctaLabel="Update"/>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-pebble-grey/15">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setActive(f)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors duration-300 focus-ring ${active === f
                ? "bg-deep-slate text-alabaster-cream border-2 border-deep-slate"
                : "bg-white text-deep-slate border-2 border-pebble-grey/20 hover:border-deep-slate"}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="grid sm:grid-cols-2 gap-6">
            {GROOMERS.map(g => <GroomerCard key={g.id} groomer={g} onView={onSelectGroomer}/>)}
          </div>

          {/* Map placeholder — sticky */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 bg-white rounded-[12px] border border-pebble-grey/20 overflow-hidden card-lift">
              <div className="relative h-[480px] bg-sage-leaf/10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 20% 30%, rgba(74,93,87,0.15) 0%, transparent 50%),
                                    radial-gradient(circle at 80% 70%, rgba(234,228,92,0.18) 0%, transparent 50%),
                                    repeating-linear-gradient(45deg, transparent 0 24px, rgba(74,93,87,0.08) 24px 25px),
                                    repeating-linear-gradient(-45deg, transparent 0 24px, rgba(74,93,87,0.08) 24px 25px)`
                }}/>
                {[
                  { x: "32%", y: "28%" },
                  { x: "55%", y: "42%" },
                  { x: "70%", y: "60%" },
                  { x: "25%", y: "65%" },
                  { x: "65%", y: "20%" },
                  { x: "45%", y: "78%" },
                ].map((p, i) => (
                  <div key={i} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: p.x, top: p.y }}>
                    <div className="bg-deep-slate text-alabaster-cream font-bold text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap">£{GROOMERS[i].priceFrom}</div>
                    <div className="w-3 h-3 bg-deep-slate rounded-full mx-auto -mt-px ring-4 ring-white"/>
                  </div>
                ))}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-xs font-bold text-deep-slate shadow-sm">
                  Map · East London
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

window.SearchScreen = SearchScreen;
window.GROOMERS = GROOMERS;
