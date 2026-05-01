// GroomerDashboard subviews — Bookings, Clients, Earnings, Reviews, ProfileEditor
// (Split out of GroomerDashboard.jsx for context size; same file scope.)

const SubPill = ({ active, children, onClick }) => (
  <button onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors focus-ring ${active
      ? "bg-deep-slate text-alabaster-cream" : "text-deep-slate hover:bg-pebble-grey/10"}`}>
    {children}
  </button>
);

/* ======================= BOOKINGS ======================= */
const BookingsView = ({ view, setView }) => (
  <section className="space-y-5">
    <div className="flex items-center gap-2 bg-white border border-pebble-grey/20 rounded-full p-1.5 w-fit">
      {["today","week","month","year"].map(v =>
        <SubPill key={v} active={view===v} onClick={() => setView(v)}>
          {v.charAt(0).toUpperCase()+v.slice(1)}
        </SubPill>
      )}
    </div>
    {view==="today" && <TodayView/>}
    {view==="week"  && <WeekView/>}
    {view==="month" && <MonthView/>}
    {view==="year"  && <YearView/>}
  </section>
);

const TodayView = () => (
  <div className="grid lg:grid-cols-[1fr_380px] gap-8">
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <Eyebrow>Thursday 24 April</Eyebrow>
          <h2 className="font-fredoka text-2xl text-deep-slate mt-1">5 dogs on the books</h2>
        </div>
        <span className="text-xs text-pebble-grey font-bold">6.5 hrs</span>
      </div>
      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        {TODAY_BOOKINGS.map((b,i) => (
          <div key={b.id} className={`grid grid-cols-[88px_1fr_auto] gap-4 p-5 items-center ${i?"border-t border-pebble-grey/10":""} ${b.status==="in-progress"?"bg-groomr-gold/10":""}`}>
            <div>
              <p className="font-fredoka text-2xl text-deep-slate leading-none">{b.time}</p>
              <p className="text-xs text-pebble-grey font-bold mt-1">{b.duration} min</p>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-fredoka text-lg text-deep-slate">{b.dog}</h3>
                <span className="text-xs text-pebble-grey font-bold">· {b.breed}</span>
                <StatusDot status={b.status}/>
              </div>
              <p className="text-sm text-deep-slate mt-1">{b.svc} · <span className="text-pebble-grey">{b.owner}</span> · <span className="text-sage-leaf font-bold">w/ {b.groomer}</span></p>
              {b.note && <p className="text-xs text-sage-leaf font-bold italic mt-1">"{b.note}"</p>}
            </div>
            <div className="flex items-center gap-2">
              <p className="font-fredoka text-lg text-deep-slate">£{b.price}</p>
              <button className="rounded-full p-2 bg-alabaster-cream hover:bg-deep-slate hover:text-alabaster-cream transition-colors focus-ring border border-pebble-grey/20" aria-label="Message"><MessageIcon size={16}/></button>
              <button className="rounded-full p-2 bg-alabaster-cream hover:bg-deep-slate hover:text-alabaster-cream transition-colors focus-ring border border-pebble-grey/20" aria-label="Open"><ChevronRight size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </section>

    <aside className="space-y-6">
      <div className="bg-deep-slate text-alabaster-cream rounded-[20px] p-6">
        <Eyebrow className="text-groomr-gold">Live status</Eyebrow>
        <p className="font-fredoka text-2xl mt-1 text-alabaster-cream">Pippa · Full Groom</p>
        <p className="text-sm text-alabaster-cream/85 mt-1 font-bold">Started 09:34 · 38 min in</p>
        <div className="mt-4 h-1.5 bg-alabaster-cream/20 rounded-full overflow-hidden">
          <div className="h-full bg-groomr-gold" style={{ width: "42%" }}></div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="btn-gold-on-dark text-xs font-bold px-4 py-2 rounded-full focus-ring">Mark complete</button>
          <button className="text-xs font-bold text-alabaster-cream border-2 border-alabaster-cream/40 hover:bg-alabaster-cream hover:text-deep-slate transition-colors px-4 py-2 rounded-full focus-ring">Notify owner</button>
        </div>
      </div>
      <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
        <Eyebrow>Today's notes</Eyebrow>
        <ul className="space-y-2.5 text-sm text-deep-slate mt-3">
          <li className="flex gap-2"><span className="text-sage-leaf font-bold">•</span> Murphy's anxious — slow approach, treat-first.</li>
          <li className="flex gap-2"><span className="text-sage-leaf font-bold">•</span> Otis: hand-strip only, leave the beard.</li>
          <li className="flex gap-2"><span className="text-sage-leaf font-bold">•</span> Bean is a first-timer, allow extra time.</li>
        </ul>
      </div>
    </aside>
  </div>
);

const WeekView = () => {
  const colorMap = {
    sage:  { bg:"rgba(136,160,150,0.18)", bd:"#88a096" },
    gold:  { bg:"rgba(234,228,92,0.30)",  bd:"#c8c14b" },
    terra: { bg:"rgba(200,121,100,0.18)", bd:"#c87964" },
  };
  const ROW_H = 60;
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <Eyebrow>Week of 21 April</Eyebrow>
          <h2 className="font-fredoka text-2xl text-deep-slate mt-1">30 dogs booked · 40.5 hrs</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring"><ChevronLeft size={16}/></button>
          <button className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring"><ChevronRight size={16}/></button>
        </div>
      </div>
      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-pebble-grey/15">
          <div className="p-3"></div>
          {WEEK_DAYS.map((d,i) => (
            <div key={i} className={`p-3 text-center border-l border-pebble-grey/10 ${d.today?"bg-groomr-gold/15":""}`}>
              <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey">{d.dow}</p>
              <p className="font-fredoka text-2xl text-deep-slate leading-none mt-1">{d.date}</p>
              <p className="text-xs text-pebble-grey font-bold mt-1">{d.off?"Off":`${d.count} dogs`}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
          <div>
            {CAL_HOURS.map(h => (
              <div key={h} className="text-xs text-pebble-grey font-bold text-right pr-3 border-t border-pebble-grey/10" style={{ height: ROW_H, paddingTop: 4 }}>{h}:00</div>
            ))}
          </div>
          {WEEK_DAYS.map((d,dayIdx) => (
            <div key={dayIdx} className={`relative border-l border-pebble-grey/10 ${d.today?"bg-groomr-gold/[0.04]":""} ${d.off?"bg-pebble-grey/5":""}`}>
              {CAL_HOURS.map(h => <div key={h} className="border-t border-pebble-grey/10" style={{ height: ROW_H }}/>)}
              {CAL_ITEMS.filter(it => it.day===dayIdx).map((it,i) => {
                const top = (it.start-8)*ROW_H+2, height = it.span*ROW_H-4;
                const c = colorMap[it.tone];
                return (
                  <button key={i} className="absolute left-1 right-1 rounded-lg p-2 text-left focus-ring hover:translate-y-[-1px] transition-transform"
                    style={{ top, height, background: c.bg, borderLeft: `3px solid ${c.bd}` }}>
                    <p className="font-bold text-xs text-deep-slate leading-tight truncate">{it.label}</p>
                    <p className="text-[10px] text-deep-slate/70 font-bold truncate">{it.svc}</p>
                    {it.live && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-muted-terracotta rounded-full animate-pulse"/>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MonthView = () => {
  // April 2026 — starts Wed (offset 2). 30 days.
  const offset = 2;
  const days = 30;
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push({ blank: true });
  for (let d = 1; d <= days; d++) {
    const c = (d * 7) % 11;
    const today = d === 24;
    cells.push({ d, count: c, today, hours: c * 1.2 });
  }
  while (cells.length % 7) cells.push({ blank: true });
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <Eyebrow>April 2026</Eyebrow>
          <h2 className="font-fredoka text-2xl text-deep-slate mt-1">112 bookings · 168 hrs</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring"><ChevronLeft size={16}/></button>
          <button className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring"><ChevronRight size={16}/></button>
        </div>
      </div>
      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        <div className="grid grid-cols-7 border-b border-pebble-grey/15">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d =>
            <div key={d} className="p-3 text-xs font-bold uppercase tracking-wider text-pebble-grey text-center border-l first:border-l-0 border-pebble-grey/10">{d}</div>
          )}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c,i) => (
            <div key={i} className={`min-h-[100px] border-l border-t border-pebble-grey/10 first:border-l-0 p-2 ${c.blank?"bg-pebble-grey/5":""} ${c.today?"bg-groomr-gold/15":""}`}>
              {!c.blank && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className={`font-fredoka text-lg ${c.today?"text-deep-slate":"text-deep-slate"}`}>{c.d}</span>
                    {c.count>0 && <span className="text-[10px] font-bold text-pebble-grey">{c.count}</span>}
                  </div>
                  {c.count>0 ? (
                    <div className="mt-auto">
                      <div className="flex flex-wrap gap-0.5 mb-1">
                        {Array.from({length: Math.min(c.count, 6)}).map((_,k) => {
                          const tone = ["#88a096","#eae45c","#c87964"][k%3];
                          return <span key={k} className="w-2 h-2 rounded-full" style={{background: tone}}/>;
                        })}
                      </div>
                      <p className="text-[10px] font-bold text-pebble-grey">{c.hours.toFixed(1)}h</p>
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-pebble-grey/60 mt-auto">No bookings</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const YearView = () => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const counts = [86, 92, 105, 112, 118, 124, 96, 88, 102, 110, 0, 0];
  const earnings = [3120, 3480, 3960, 4280, 4520, 4780, 3650, 3320, 3900, 4200, 0, 0];
  const max = Math.max(...counts);
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <Eyebrow>2026 · Year to date</Eyebrow>
          <h2 className="font-fredoka text-2xl text-deep-slate mt-1">933 bookings · £35,610 earned</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring"><ChevronLeft size={16}/></button>
          <button className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring"><ChevronRight size={16}/></button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map((m,i) => {
          const pct = max ? counts[i]/max : 0;
          const empty = counts[i] === 0;
          const current = i === 3;
          return (
            <div key={m} className={`bg-white border rounded-[16px] p-5 transition-colors ${current?"border-groomr-gold border-2":"border-pebble-grey/20"}`}>
              <div className="flex items-baseline justify-between">
                <p className="font-fredoka text-xl text-deep-slate">{m}</p>
                {current && <span className="text-[10px] font-bold uppercase tracking-wider text-deep-slate bg-groomr-gold rounded-full px-2 py-0.5">Current</span>}
              </div>
              {empty ? (
                <p className="text-xs text-pebble-grey font-bold mt-3">Upcoming</p>
              ) : (
                <>
                  <p className="font-fredoka text-2xl text-deep-slate mt-2 leading-none">£{earnings[i].toLocaleString()}</p>
                  <p className="text-xs text-pebble-grey font-bold mt-1">{counts[i]} bookings</p>
                  <div className="h-1.5 bg-pebble-grey/15 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-sage-leaf rounded-full" style={{ width: `${pct*100}%` }}/>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

/* ======================= CLIENTS ======================= */
const ClientsView = ({ onOpenClient }) => {
  const [filter, setFilter] = React.useState("All");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState({ key: "last", dir: "desc" });

  const sortBy = (key) => setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });

  const q = query.toLowerCase().trim();
  let rows = CLIENTS.filter(c => filter === "All" ? true : filter === "Regulars" ? c.regular : !c.regular);
  if (q) rows = rows.filter(c => c.dog.toLowerCase().includes(q) || c.owner.toLowerCase().includes(q));
  rows = [...rows].sort((a,b) => {
    let av, bv;
    if (sort.key === "dog")    { av = a.dog.toLowerCase();   bv = b.dog.toLowerCase(); }
    if (sort.key === "owner")  { av = a.owner.toLowerCase(); bv = b.owner.toLowerCase(); }
    if (sort.key === "visits") { av = a.visits;              bv = b.visits; }
    if (sort.key === "last")   { av = a.last === "—" ? 0 : new Date("2026 "+a.last).getTime(); bv = b.last === "—" ? 0 : new Date("2026 "+b.last).getTime(); }
    if (sort.key === "spend")  { av = a.spend;               bv = b.spend; }
    if (av < bv) return sort.dir === "asc" ? -1 : 1;
    if (av > bv) return sort.dir === "asc" ?  1 : -1;
    return 0;
  });

  const SortHead = ({ k, label, align="right" }) => {
    const active = sort.key === k;
    return (
      <button onClick={() => sortBy(k)}
        className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors focus-ring rounded ${active?"text-deep-slate":"text-pebble-grey hover:text-deep-slate"} ${align==="right"?"justify-end w-full":""}`}>
        {label}
        <span className="inline-flex flex-col text-[8px] leading-[8px]" aria-hidden>
          <span className={active && sort.dir==="asc" ? "text-deep-slate" : "text-pebble-grey/40"}>▲</span>
          <span className={active && sort.dir==="desc" ? "text-deep-slate" : "text-pebble-grey/40"}>▼</span>
        </span>
      </button>
    );
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Eyebrow>Your pack</Eyebrow>
          <h2 className="font-fredoka text-2xl text-deep-slate mt-1">{CLIENTS.length} dogs · {CLIENTS.filter(c => c.regular).length} regulars</h2>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[260px] bg-white rounded-full p-1.5 flex items-center border border-pebble-grey/20 focus-within:ring-2 focus-within:ring-groomr-gold transition-shadow">
          <span className="pl-3 text-pebble-grey"><SearchIcon size={18}/></span>
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by dog or owner name…"
            className="flex-1 bg-transparent px-3 py-2 text-sm font-bold text-deep-slate placeholder:text-pebble-grey/70 outline-none"/>
          {query && <button onClick={() => setQuery("")} className="text-pebble-grey hover:text-deep-slate transition-colors px-3" aria-label="Clear"><CloseIcon size={14}/></button>}
        </div>
        <div className="flex items-center gap-2">
          {["All","Regulars","New"].map(f => <Chip key={f} active={filter===f} onClick={() => setFilter(f)}>{f}</Chip>)}
        </div>
      </div>

      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px_120px_60px] gap-4 px-5 py-3 bg-alabaster-cream border-b border-pebble-grey/15">
          <SortHead k="dog" label="Dog & owner" align="left"/>
          <SortHead k="visits" label="Visits"/>
          <SortHead k="last" label="Last"/>
          <SortHead k="spend" label="Lifetime"/>
          <span></span>
        </div>
        {rows.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="font-fredoka text-lg text-deep-slate">No matches.</p>
            <p className="text-sm text-pebble-grey font-bold">Try a different name.</p>
          </div>
        )}
        {rows.map((c,i) => (
          <button key={c.id} onClick={() => onOpenClient(c)}
            className={`w-full text-left grid grid-cols-[1fr_120px_120px_120px_60px] gap-4 px-5 py-4 items-center hover:bg-alabaster-cream transition-colors focus-ring ${i?"border-t border-pebble-grey/10":""}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-sage-leaf/20 flex items-center justify-center font-fredoka text-deep-slate shrink-0">{c.dog.charAt(0)}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-fredoka text-deep-slate">{c.dog}</p>
                  {c.regular && <Badge tone="gold">Regular</Badge>}
                </div>
                <p className="text-xs text-pebble-grey font-bold truncate">{c.breed} · {c.owner.split(" (")[0]}</p>
                {c.note && <p className="text-xs text-sage-leaf italic truncate mt-0.5">"{c.note}"</p>}
              </div>
            </div>
            <span className="text-right font-fredoka text-deep-slate">{c.visits}</span>
            <span className="text-right text-sm text-pebble-grey font-bold">{c.last}</span>
            <span className="text-right font-fredoka text-deep-slate">£{c.spend}</span>
            <span className="justify-self-end rounded-full p-2 bg-alabaster-cream border border-pebble-grey/20 text-deep-slate"><ChevronRight size={16}/></span>
          </button>
        ))}
      </div>
    </section>
  );
};

/* Client details modal */
const ClientDetailsModal = ({ client, onClose }) => {
  if (!client) return null;
  return (
    <Modal open={!!client} onClose={onClose} size="lg">
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sage-leaf text-white font-fredoka text-2xl flex items-center justify-center shrink-0">{client.dog.charAt(0)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-fredoka text-3xl text-deep-slate">{client.dog}</h2>
              {client.regular && <Badge tone="gold">Regular</Badge>}
            </div>
            <p className="text-sm text-pebble-grey font-bold mt-1">{client.breed} · {client.coat}</p>
            <p className="text-sm text-deep-slate font-bold mt-0.5">Owner: {client.owner}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4 text-center">
            <p className="font-fredoka text-2xl text-deep-slate">{client.visits}</p>
            <p className="text-xs font-bold text-pebble-grey mt-1">Visits</p>
          </div>
          <div className="bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4 text-center">
            <p className="font-fredoka text-2xl text-deep-slate">{client.last}</p>
            <p className="text-xs font-bold text-pebble-grey mt-1">Last visit</p>
          </div>
          <div className="bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4 text-center">
            <p className="font-fredoka text-2xl text-deep-slate">£{client.spend}</p>
            <p className="text-xs font-bold text-pebble-grey mt-1">Lifetime</p>
          </div>
        </div>

        <div className="bg-white border border-pebble-grey/15 rounded-2xl p-4">
          <Eyebrow>Grooming notes</Eyebrow>
          <p className="text-sm text-deep-slate mt-2 italic">"{client.note}"</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ContactRow label="Phone"  value={client.phone}/>
          <ContactRow label="Email"  value={client.email}/>
          <ContactRow label="Joined" value={client.joined}/>
          <ContactRow label="Status" value={client.regular ? "Regular client" : "New / occasional"}/>
        </div>

        <div className="bg-white border border-pebble-grey/15 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-pebble-grey/10"><Eyebrow>Recent visits</Eyebrow></div>
          {[
            { d: "12 Apr", svc: "Full Groom", g: "Lola",  price: 58 },
            { d: "29 Mar", svc: "Bath & Brush", g: "Marcus", price: 38 },
            { d: "15 Feb", svc: "Full Groom", g: "Lola",  price: 58 },
          ].map((v,i) => (
            <div key={i} className={`grid grid-cols-[80px_1fr_auto_auto] gap-3 px-4 py-3 items-center ${i?"border-t border-pebble-grey/10":""}`}>
              <span className="font-bold text-sm text-deep-slate">{v.d}</span>
              <span className="text-sm text-deep-slate">{v.svc}</span>
              <span className="text-xs text-pebble-grey font-bold">w/ {v.g}</span>
              <span className="font-fredoka text-deep-slate">£{v.price}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button className="btn-primary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring shadow-subtle flex items-center gap-2"><CalendarIcon size={16}/> Book again</button>
          <button className="btn-secondary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring flex items-center gap-2"><MessageIcon size={16}/> Message</button>
          <button className="font-nunito font-bold text-deep-slate hover:text-muted-terracotta transition-colors px-5 py-2.5 rounded-full text-sm focus-ring">Edit notes</button>
        </div>
      </div>
    </Modal>
  );
};
const ContactRow = ({ label, value }) => (
  <div className="bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-3">
    <p className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">{label}</p>
    <p className="text-sm font-bold text-deep-slate mt-1 break-words">{value}</p>
  </div>
);

window.BookingsView = BookingsView;
window.ClientsView = ClientsView;
window.ClientDetailsModal = ClientDetailsModal;
