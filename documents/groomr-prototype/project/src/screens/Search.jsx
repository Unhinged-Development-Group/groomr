// Search — list-led results with slim map rail and chip filters.

const SearchScreen = ({ initialQuery = "", onView }) => {
  const [q, setQ] = React.useState(initialQuery);
  const [filter, setFilter] = React.useState("All");
  const [sort, setSort] = React.useState("Best match");
  const [hoverId, setHoverId] = React.useState(null);
  const [saved, setSaved] = React.useState({});

  const list = React.useMemo(() => {
    let out = [...GROOMERS];
    if (filter === "Mobile")    out = out.filter(g => g.badges.includes("Mobile"));
    if (filter === "Studio")    out = out.filter(g => g.badges.includes("Studio"));
    if (filter === "Hand-Strip")out = out.filter(g => g.services.some(s => /strip/i.test(s.name)));
    if (filter === "Puppy")     out = out.filter(g => g.services.some(s => /pupp/i.test(s.name)) || g.badges.includes("Puppy First"));
    if (filter === "Senior")    out = out.filter(g => g.badges.includes("Senior Care") || g.services.some(s => /senior/i.test(s.name)));
    if (filter === "Anxious Dogs") out = out.filter(g => g.badges.includes("Anxious Dogs OK"));
    if (sort === "Closest")  out.sort((a,b) => a.distance - b.distance);
    if (sort === "Top rated") out.sort((a,b) => b.rating - a.rating);
    if (sort === "Price (low)") out.sort((a,b) => a.priceFrom - b.priceFrom);
    return out;
  }, [filter, sort]);

  const toggleSave = (g) => setSaved(s => ({ ...s, [g.id]: !s[g.id] }));

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-8 md:py-10">
      {/* Search bar row */}
      <div className="mb-6 max-w-3xl">
        <SearchPill value={q} onChange={setQ} onSubmit={() => {}} placeholder="Hackney, E8, or 'near me'" ctaLabel="Update"/>
      </div>

      {/* Filter strip */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_TAGS.map(t => (
            <Chip key={t} active={filter === t} onClick={() => setFilter(t)}>{t}</Chip>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-pebble-grey font-bold">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="bg-white border border-pebble-grey/20 rounded-full px-4 py-2 text-sm font-bold text-deep-slate focus-ring">
            {["Best match", "Closest", "Top rated", "Price (low)"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <p className="text-sm text-pebble-grey font-bold mb-6">
        <span className="text-deep-slate">{list.length} groomers</span> within 3 miles of <span className="text-deep-slate">Hackney, E8</span>
      </p>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* List */}
        <div className="grid sm:grid-cols-2 gap-5">
          {list.map(g => (
            <div key={g.id}
              onMouseEnter={() => setHoverId(g.id)}
              onMouseLeave={() => setHoverId(null)}>
              <GroomerCard groomer={g} onView={onView} onSave={toggleSave} saved={!!saved[g.id]}/>
            </div>
          ))}
          {list.length === 0 && (
            <div className="col-span-2 bg-white border border-pebble-grey/20 rounded-[20px] p-10 text-center">
              <p className="font-fredoka text-xl text-deep-slate mb-2">No matches in this filter.</p>
              <p className="text-pebble-grey">Try broadening your search or removing a tag.</p>
            </div>
          )}
        </div>

        {/* Map rail */}
        <div className="hidden lg:block">
          <div className="sticky top-24 bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden shadow-subtle">
            <div className="relative h-[600px] bg-sage-leaf/10">
              {/* Faux map: subtle grid + roads */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                <defs>
                  <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#88a09633" strokeWidth="0.3"/>
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="#f9f8f4"/>
                <rect width="100" height="100" fill="url(#grid)"/>
                <path d="M0 30 Q 50 25 100 35" stroke="#88a09655" strokeWidth="1.2" fill="none"/>
                <path d="M0 60 Q 30 65 60 55 T 100 60" stroke="#88a09655" strokeWidth="1.2" fill="none"/>
                <path d="M30 0 Q 28 50 35 100" stroke="#88a09655" strokeWidth="1.2" fill="none"/>
                <path d="M70 0 Q 75 50 65 100" stroke="#88a09655" strokeWidth="1.2" fill="none"/>
                <circle cx="48" cy="50" r="6" fill="#eae45c33" stroke="#eae45c" strokeWidth="0.6"/>
                <circle cx="48" cy="50" r="1.4" fill="#2c3e50"/>
              </svg>

              {/* Pins */}
              {list.map(g => {
                const active = hoverId === g.id;
                return (
                  <button key={g.id}
                    onMouseEnter={() => setHoverId(g.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onClick={() => onView(g)}
                    style={{ left: `${g.map.x}%`, top: `${g.map.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 ${active ? "z-20 map-pin-active" : ""} focus-ring rounded-full`}>
                    <div className={`px-2.5 py-1 rounded-full font-fredoka text-sm shadow-lift border-2 transition-all duration-200
                      ${active ? "bg-deep-slate text-groomr-gold border-deep-slate scale-110" : "bg-white text-deep-slate border-deep-slate"}`}>
                      £{g.priceFrom}
                    </div>
                  </button>
                );
              })}

              {/* Hover preview card */}
              {hoverId && (() => {
                const g = list.find(x => x.id === hoverId);
                if (!g) return null;
                return (
                  <button onClick={() => onView(g)}
                    className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl p-3 shadow-modal flex items-center gap-3 text-left border border-pebble-grey/20 z-30 focus-ring">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-sage-leaf/20">
                      <img src={g.image} alt="" className="w-full h-full object-cover"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-fredoka text-deep-slate text-sm leading-tight truncate">{g.name}</p>
                      <p className="text-xs text-pebble-grey truncate">{g.location} · {g.distance} mi</p>
                      <div className="mt-1"><StarRow rating={g.rating} count={g.reviewCount} size={12}/></div>
                    </div>
                    <span className="font-fredoka text-deep-slate">£{g.priceFrom}</span>
                  </button>
                );
              })()}
            </div>
            <div className="px-4 py-3 border-t border-pebble-grey/15 flex items-center justify-between">
              <span className="text-xs text-pebble-grey font-bold uppercase tracking-wider">Map view</span>
              <button className="text-xs font-bold text-deep-slate text-link">Expand</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.SearchScreen = SearchScreen;
