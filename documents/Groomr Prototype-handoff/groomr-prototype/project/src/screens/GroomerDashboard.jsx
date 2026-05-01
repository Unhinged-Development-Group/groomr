// GroomerDashboard — Back-office view for groomers.
// Today, week calendar, clients, earnings, inbox, profile editor.

const GROOMER_ME = {
  business: "Wagington & Co.",
  owner: "Lola García",
  rating: 4.9,
  reviewCount: 184,
  status: "Open · Accepting bookings",
  thisWeek: { bookings: 14, hours: 21, earnings: 742, change: +12 },
  thisMonth: { bookings: 58, earnings: 3120, change: +8 },
  payout: { next: "Mon 27 Apr", amount: 742 },
};

const TODAY_BOOKINGS = [
  { id: 1, time: "08:30", duration: 45, dog: "Murphy", breed: "Chihuahua", owner: "Sarah K.", svc: "Bath & Brush", price: 38, status: "confirmed", note: "Anxious — slow intro." },
  { id: 2, time: "09:30", duration: 90, dog: "Pippa", breed: "Cockapoo", owner: "Daniel R.", svc: "Full Groom", price: 58, status: "in-progress", note: "Regular — usual cut." },
  { id: 3, time: "11:30", duration: 120, dog: "Otis", breed: "Border Terrier", owner: "Imogen T.", svc: "Hand-Strip", price: 80, status: "confirmed", note: "Hand-strip, leave beard." },
  { id: 4, time: "14:00", duration: 90, dog: "Roxy", breed: "Staffy", owner: "Ben H.", svc: "Full Groom", price: 58, status: "confirmed", note: "Sensitive paws." },
  { id: 5, time: "16:00", duration: 15, dog: "Bean", breed: "Labrador", owner: "Priya N.", svc: "Nail Clip", price: 15, status: "pending", note: "First visit." },
];

// Week view — a list of slots per day, simplified
const WEEK_DAYS = [
  { dow: "Mon", date: "21",  count: 4, hours: 5.5 },
  { dow: "Tue", date: "22",  count: 5, hours: 7,   today: false },
  { dow: "Wed", date: "23",  count: 3, hours: 4.5 },
  { dow: "Thu", date: "24",  count: 5, hours: 6.5, today: true },
  { dow: "Fri", date: "25",  count: 6, hours: 8 },
  { dow: "Sat", date: "26",  count: 7, hours: 9 },
  { dow: "Sun", date: "27",  count: 0, hours: 0,   off: true },
];

// Calendar grid hours
const CAL_HOURS = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18"];

// Mock week appointments laid on the grid (col = day index 0-6, startHour, span hours)
const CAL_ITEMS = [
  { day: 0, start: 9,  span: 1,   label: "Murphy",  svc: "Bath",       tone: "sage" },
  { day: 0, start: 11, span: 1.5, label: "Pippa",   svc: "Full",       tone: "gold" },
  { day: 0, start: 14, span: 2,   label: "Otis",    svc: "Hand-Strip", tone: "terra" },
  { day: 1, start: 9,  span: 1.5, label: "Bean",    svc: "Full",       tone: "gold" },
  { day: 1, start: 13, span: 1,   label: "Coco",    svc: "Bath",       tone: "sage" },
  { day: 1, start: 15, span: 2,   label: "Bramble", svc: "Hand-Strip", tone: "terra" },
  { day: 2, start: 10, span: 1.5, label: "Pippa",   svc: "Full",       tone: "gold" },
  { day: 2, start: 14, span: 1,   label: "Roxy",    svc: "Bath",       tone: "sage" },
  { day: 3, start: 9,  span: 1,   label: "Murphy",  svc: "Bath",       tone: "sage", live: true },
  { day: 3, start: 10, span: 1.5, label: "Pippa",   svc: "Full",       tone: "gold", live: true },
  { day: 3, start: 12, span: 2,   label: "Otis",    svc: "Hand-Strip", tone: "terra" },
  { day: 3, start: 15, span: 1.5, label: "Roxy",    svc: "Full",       tone: "gold" },
  { day: 4, start: 9,  span: 1.5, label: "Hugo",    svc: "Full",       tone: "gold" },
  { day: 4, start: 11, span: 1,   label: "Daisy",   svc: "Bath",       tone: "sage" },
  { day: 4, start: 13, span: 2,   label: "Bramble", svc: "Hand-Strip", tone: "terra" },
  { day: 4, start: 16, span: 1.5, label: "Coco",    svc: "Full",       tone: "gold" },
  { day: 5, start: 8,  span: 1,   label: "Murphy",  svc: "Bath",       tone: "sage" },
  { day: 5, start: 9,  span: 1.5, label: "Pippa",   svc: "Full",       tone: "gold" },
  { day: 5, start: 11, span: 2,   label: "Otis",    svc: "Hand-Strip", tone: "terra" },
  { day: 5, start: 14, span: 1.5, label: "Roxy",    svc: "Full",       tone: "gold" },
  { day: 5, start: 16, span: 1,   label: "Bean",    svc: "Nail",       tone: "sage" },
];

const CLIENTS = [
  { dog: "Murphy",  breed: "Chihuahua",      owner: "Sarah K.",  visits: 14, last: "12 Apr", spend: 532, regular: true,  note: "Anxious. Slow intro." },
  { dog: "Pippa",   breed: "Cockapoo",       owner: "Daniel R.", visits: 22, last: "18 Apr", spend: 1276, regular: true, note: "Show cut every 6 wks." },
  { dog: "Otis",    breed: "Border Terrier", owner: "Imogen T.", visits: 9,  last: "08 Apr", spend: 720,  regular: true, note: "Leave beard." },
  { dog: "Roxy",    breed: "Staffy",         owner: "Ben H.",    visits: 5,  last: "21 Apr", spend: 290,  regular: false, note: "Sensitive paws." },
  { dog: "Bean",    breed: "Labrador",       owner: "Priya N.",  visits: 1,  last: "—",      spend: 0,    regular: false, note: "First visit." },
  { dog: "Hugo",    breed: "Labradoodle",    owner: "Tom B.",    visits: 11, last: "04 Apr", spend: 638,  regular: true,  note: "Loves the dryer." },
];

const INBOX = [
  { name: "Sarah K.",  dog: "Murphy",  preview: "Could we move Saturday to 9? Murphy's vet appt ran...", when: "8m",  unread: true },
  { name: "Daniel R.", dog: "Pippa",   preview: "She's been scratching her ear, mind taking a quick...",   when: "1h",  unread: true },
  { name: "Imogen T.", dog: "Otis",    preview: "Cheers Lola, see you Thursday!",                          when: "3h" },
  { name: "Tom B.",    dog: "Hugo",    preview: "Booked you in for the 30th. Hugo says hi 🐶",             when: "Yesterday" },
];

// Earnings sparkline data (12 weeks)
const SPARK = [410, 480, 520, 460, 540, 600, 580, 640, 700, 660, 720, 742];

const Sparkline = ({ data, w = 200, h = 56 }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const dx = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * dx},${h - ((v - min) / (max - min)) * (h - 8) - 4}`).join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block">
      <polyline points={pts} fill="none" stroke="#88a096" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="rgba(136,160,150,0.15)" stroke="none"/>
      <circle cx={w} cy={h - ((data[data.length - 1] - min) / (max - min)) * (h - 8) - 4} r="4" fill="#eae45c" stroke="#2c3e50" strokeWidth="1.5"/>
    </svg>
  );
};

const StatusDot = ({ status }) => {
  const tone = {
    confirmed:  ["#88a096", "Confirmed"],
    "in-progress": ["#eae45c", "In progress"],
    pending:    ["#c87964", "Pending"],
  }[status] || ["#95a5a6", status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-deep-slate">
      <span className="w-2 h-2 rounded-full" style={{ background: tone[0] }}/>
      {tone[1]}
    </span>
  );
};

const TabPill = ({ active, children, onClick }) => (
  <button onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors focus-ring ${active
      ? "bg-deep-slate text-alabaster-cream"
      : "text-deep-slate hover:bg-pebble-grey/10"}`}>
    {children}
  </button>
);

const GroomerDashboard = ({ user, onLogout }) => {
  const [tab, setTab] = React.useState("today"); // today | week | clients | earnings | profile
  const [open, setOpen] = React.useState(false); // toggle availability

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-8 space-y-8">
      {/* Header strip */}
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <Eyebrow>Studio dashboard</Eyebrow>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <h1 className="font-fredoka text-4xl md:text-5xl text-deep-slate">{GROOMER_ME.business}</h1>
            <span className="inline-flex items-center gap-2 bg-sage-leaf/10 border border-sage-leaf/30 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 bg-sage-leaf rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-deep-slate">Open · Accepting bookings</span>
            </span>
          </div>
          <p className="text-sm text-pebble-grey font-bold mt-1">
            {GROOMER_ME.owner} · <StarIcon size={12}/> <span className="inline-block align-middle">{GROOMER_ME.rating} ({GROOMER_ME.reviewCount})</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring flex items-center gap-2">
            <CalendarIcon size={16}/> Block time
          </button>
          <button className="btn-primary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring shadow-subtle flex items-center gap-2">
            <PlusIcon size={16}/> New booking
          </button>
        </div>
      </header>

      {/* Stat strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today" value="5" sub="bookings · 6.5 hrs" tone="gold"/>
        <StatCard label="This week" value={`£${GROOMER_ME.thisWeek.earnings}`} sub={`${GROOMER_ME.thisWeek.bookings} bookings · +12% vs last`} tone="sage"/>
        <StatCard label="Next payout" value={`£${GROOMER_ME.payout.amount}`} sub={`Auto-deposit ${GROOMER_ME.payout.next}`} tone="terra"/>
        <StatCard label="Repeat rate" value="78%" sub="of clients booked again" tone="slate"/>
      </section>

      {/* Tabs */}
      <nav className="flex items-center gap-2 bg-white border border-pebble-grey/20 rounded-full p-1.5 w-fit">
        <TabPill active={tab === "today"}    onClick={() => setTab("today")}>Today</TabPill>
        <TabPill active={tab === "week"}     onClick={() => setTab("week")}>Week</TabPill>
        <TabPill active={tab === "clients"}  onClick={() => setTab("clients")}>Clients</TabPill>
        <TabPill active={tab === "earnings"} onClick={() => setTab("earnings")}>Earnings</TabPill>
        <TabPill active={tab === "profile"}  onClick={() => setTab("profile")}>Profile</TabPill>
      </nav>

      {tab === "today"    && <TodayView/>}
      {tab === "week"     && <WeekView/>}
      {tab === "clients"  && <ClientsView/>}
      {tab === "earnings" && <EarningsView/>}
      {tab === "profile"  && <ProfileEditor/>}
    </div>
  );
};

const StatCard = ({ label, value, sub, tone = "sage" }) => {
  const dot = { gold: "#eae45c", sage: "#88a096", terra: "#c87964", slate: "#2c3e50" }[tone];
  return (
    <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: dot }}/>
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-pebble-grey">{label}</span>
      </div>
      <p className="font-fredoka text-3xl text-deep-slate mt-2 leading-none">{value}</p>
      <p className="text-xs text-pebble-grey font-bold mt-2">{sub}</p>
    </div>
  );
};

/* ======================= TODAY ======================= */

const TodayView = () => (
  <div className="grid lg:grid-cols-[1fr_380px] gap-8">
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <Eyebrow>Thursday 24 April</Eyebrow>
          <h2 className="font-fredoka text-2xl text-deep-slate mt-1">5 dogs on the books</h2>
        </div>
        <span className="text-xs text-pebble-grey font-bold">Sunrise → Sunset · 6.5 hrs</span>
      </div>

      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        {TODAY_BOOKINGS.map((b, i) => (
          <div key={b.id} className={`grid grid-cols-[88px_1fr_auto] gap-4 p-5 items-center ${i ? "border-t border-pebble-grey/10" : ""} ${b.status === "in-progress" ? "bg-groomr-gold/10" : ""}`}>
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
              <p className="text-sm text-deep-slate mt-1">{b.svc} · <span className="text-pebble-grey">{b.owner}</span></p>
              {b.note && <p className="text-xs text-sage-leaf font-bold italic mt-1">"{b.note}"</p>}
            </div>
            <div className="flex items-center gap-2">
              <p className="font-fredoka text-lg text-deep-slate">£{b.price}</p>
              <button className="rounded-full p-2 bg-alabaster-cream hover:bg-deep-slate hover:text-alabaster-cream transition-colors focus-ring border border-pebble-grey/20" aria-label="Message">
                <MessageIcon size={16}/>
              </button>
              <button className="rounded-full p-2 bg-alabaster-cream hover:bg-deep-slate hover:text-alabaster-cream transition-colors focus-ring border border-pebble-grey/20" aria-label="Open">
                <ChevronRight size={16}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Side rail: Inbox + quick toggles */}
    <aside className="space-y-6">
      <div className="bg-deep-slate text-alabaster-cream rounded-[20px] p-6">
        <Eyebrow className="text-groomr-gold">Live status</Eyebrow>
        <p className="font-fredoka text-2xl mt-1">Pippa · Full Groom</p>
        <p className="text-sm text-sage-leaf mt-1">Started 09:34 · 38 min in</p>
        <div className="mt-4 h-1.5 bg-sage-leaf/30 rounded-full overflow-hidden">
          <div className="h-full bg-groomr-gold" style={{ width: "42%" }}></div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="btn-gold-on-dark text-xs font-bold px-4 py-2 rounded-full focus-ring">Mark complete</button>
          <button className="text-xs font-bold text-alabaster-cream border-2 border-sage-leaf hover:bg-sage-leaf hover:text-deep-slate transition-colors px-4 py-2 rounded-full focus-ring">Notify owner</button>
        </div>
      </div>

      <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
        <div className="flex items-baseline justify-between mb-3">
          <Eyebrow>Inbox</Eyebrow>
          <span className="text-xs font-bold text-muted-terracotta">2 new</span>
        </div>
        <div className="space-y-3">
          {INBOX.map((m, i) => (
            <button key={i} className="w-full text-left flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-alabaster-cream transition-colors focus-ring">
              <div className="w-9 h-9 rounded-full bg-sage-leaf text-white font-fredoka flex items-center justify-center shrink-0">{m.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-sm text-deep-slate truncate">{m.name} · <span className="text-pebble-grey font-bold">{m.dog}</span></p>
                  <span className="text-xs text-pebble-grey shrink-0">{m.when}</span>
                </div>
                <p className="text-xs text-pebble-grey mt-0.5 truncate">{m.preview}</p>
              </div>
              {m.unread && <span className="w-2 h-2 bg-muted-terracotta rounded-full shrink-0 mt-2"/>}
            </button>
          ))}
        </div>
      </div>
    </aside>
  </div>
);

/* ======================= WEEK ======================= */

const WeekView = () => {
  const colorMap = {
    sage:  { bg: "rgba(136,160,150,0.18)", bd: "#88a096", fg: "#2c3e50" },
    gold:  { bg: "rgba(234,228,92,0.30)",  bd: "#c8c14b", fg: "#2c3e50" },
    terra: { bg: "rgba(200,121,100,0.18)", bd: "#c87964", fg: "#2c3e50" },
  };
  const ROW_H = 60; // px per hour
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
        {/* Day header */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-pebble-grey/15">
          <div className="p-3"></div>
          {WEEK_DAYS.map((d, i) => (
            <div key={i} className={`p-3 text-center border-l border-pebble-grey/10 ${d.today ? "bg-groomr-gold/15" : ""}`}>
              <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey">{d.dow}</p>
              <p className="font-fredoka text-2xl text-deep-slate leading-none mt-1">{d.date}</p>
              <p className="text-xs text-pebble-grey font-bold mt-1">{d.off ? "Off" : `${d.count} dogs`}</p>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
          {/* Hour gutter */}
          <div>
            {CAL_HOURS.map((h, i) => (
              <div key={h} className="text-xs text-pebble-grey font-bold text-right pr-3 border-t border-pebble-grey/10" style={{ height: ROW_H, paddingTop: 4 }}>
                {h}:00
              </div>
            ))}
          </div>
          {/* Day columns */}
          {WEEK_DAYS.map((d, dayIdx) => (
            <div key={dayIdx} className={`relative border-l border-pebble-grey/10 ${d.today ? "bg-groomr-gold/[0.04]" : ""} ${d.off ? "bg-pebble-grey/5" : ""}`}>
              {CAL_HOURS.map((h, i) => (
                <div key={h} className="border-t border-pebble-grey/10" style={{ height: ROW_H }}/>
              ))}
              {/* Items */}
              {CAL_ITEMS.filter(it => it.day === dayIdx).map((it, i) => {
                const top = (it.start - 8) * ROW_H + 2;
                const height = it.span * ROW_H - 4;
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

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-bold text-pebble-grey">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "rgba(136,160,150,0.5)" }}/> Bath</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "rgba(234,228,92,0.6)" }}/> Full groom</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "rgba(200,121,100,0.5)" }}/> Hand-strip</span>
      </div>
    </section>
  );
};

/* ======================= CLIENTS ======================= */

const ClientsView = () => {
  const [filter, setFilter] = React.useState("All");
  const filters = ["All", "Regulars", "New"];
  const filtered = CLIENTS.filter(c =>
    filter === "All" ? true : filter === "Regulars" ? c.regular : !c.regular
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Eyebrow>Your pack</Eyebrow>
          <h2 className="font-fredoka text-2xl text-deep-slate mt-1">{CLIENTS.length} dogs · {CLIENTS.filter(c => c.regular).length} regulars</h2>
        </div>
        <div className="flex items-center gap-2">
          {filters.map(f => <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>)}
        </div>
      </div>

      <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px_120px_60px] gap-4 px-5 py-3 bg-alabaster-cream border-b border-pebble-grey/15 text-xs font-bold uppercase tracking-wider text-pebble-grey">
          <span>Dog & owner</span>
          <span className="text-right">Visits</span>
          <span className="text-right">Last</span>
          <span className="text-right">Lifetime</span>
          <span></span>
        </div>
        {filtered.map((c, i) => (
          <div key={i} className={`grid grid-cols-[1fr_120px_120px_120px_60px] gap-4 px-5 py-4 items-center ${i ? "border-t border-pebble-grey/10" : ""}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-sage-leaf/20 flex items-center justify-center font-fredoka text-deep-slate shrink-0">{c.dog.charAt(0)}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-fredoka text-deep-slate">{c.dog}</p>
                  {c.regular && <Badge tone="gold">Regular</Badge>}
                </div>
                <p className="text-xs text-pebble-grey font-bold truncate">{c.breed} · {c.owner}</p>
                {c.note && <p className="text-xs text-sage-leaf italic truncate mt-0.5">"{c.note}"</p>}
              </div>
            </div>
            <span className="text-right font-fredoka text-deep-slate">{c.visits}</span>
            <span className="text-right text-sm text-pebble-grey font-bold">{c.last}</span>
            <span className="text-right font-fredoka text-deep-slate">£{c.spend}</span>
            <button className="justify-self-end rounded-full p-2 bg-alabaster-cream hover:bg-deep-slate hover:text-alabaster-cream transition-colors focus-ring border border-pebble-grey/20" aria-label="Open">
              <ChevronRight size={16}/>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ======================= EARNINGS ======================= */

const EarningsView = () => (
  <section className="space-y-6">
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="bg-white border border-pebble-grey/20 rounded-[24px] p-7">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <Eyebrow>Earnings · last 12 weeks</Eyebrow>
            <p className="font-fredoka text-5xl text-deep-slate mt-2 leading-none">£{SPARK.reduce((a, b) => a + b, 0).toLocaleString()}</p>
            <p className="text-sm text-sage-leaf font-bold mt-2">+12% vs prior 12 weeks</p>
          </div>
          <div className="flex items-center gap-2">
            <Chip active>12W</Chip>
            <Chip>3M</Chip>
            <Chip>YTD</Chip>
          </div>
        </div>
        <div className="mt-6">
          <Sparkline data={SPARK} w={800} h={140}/>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-pebble-grey/10">
          <Stat small label="Avg. weekly" value="£596"/>
          <Stat small label="Best week" value="£742"/>
          <Stat small label="Hours / week" value="20.5"/>
        </div>
      </div>

      <div className="space-y-5">
        <div className="bg-deep-slate text-alabaster-cream rounded-[24px] p-7">
          <Eyebrow className="text-groomr-gold">Next payout</Eyebrow>
          <p className="font-fredoka text-4xl mt-2 leading-none">£{GROOMER_ME.payout.amount}</p>
          <p className="text-sm text-sage-leaf mt-2 font-bold">Auto-deposit {GROOMER_ME.payout.next} · Monzo •••• 4419</p>
          <button className="mt-5 btn-gold-on-dark font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring">Manage payouts</button>
        </div>
        <div className="bg-white border border-pebble-grey/20 rounded-[24px] p-6">
          <Eyebrow>Service mix</Eyebrow>
          <div className="space-y-3 mt-4">
            <Bar label="Full Groom"   pct={48} tone="gold"/>
            <Bar label="Hand-Strip"   pct={26} tone="terra"/>
            <Bar label="Bath & Brush" pct={20} tone="sage"/>
            <Bar label="Nail Clip"    pct={6}  tone="grey"/>
          </div>
        </div>
      </div>
    </div>

    {/* Recent payouts */}
    <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
      <div className="px-5 py-4 border-b border-pebble-grey/15 flex items-baseline justify-between">
        <h3 className="font-fredoka text-lg text-deep-slate">Recent payouts</h3>
        <button className="text-xs font-bold text-deep-slate text-link">Export CSV</button>
      </div>
      {[
        { date: "Mon 20 Apr", amount: 660, count: 13 },
        { date: "Mon 13 Apr", amount: 720, count: 14 },
        { date: "Mon 06 Apr", amount: 580, count: 11 },
        { date: "Mon 30 Mar", amount: 540, count: 11 },
      ].map((p, i) => (
        <div key={i} className={`grid grid-cols-[1fr_auto_auto] gap-6 px-5 py-3 items-center ${i ? "border-t border-pebble-grey/10" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sage-leaf/15 flex items-center justify-center"><CheckIcon size={14}/></div>
            <div>
              <p className="font-bold text-sm text-deep-slate">{p.date}</p>
              <p className="text-xs text-pebble-grey">{p.count} bookings · Monzo •••• 4419</p>
            </div>
          </div>
          <span className="text-xs font-bold text-sage-leaf">Paid</span>
          <span className="font-fredoka text-lg text-deep-slate">£{p.amount}</span>
        </div>
      ))}
    </div>
  </section>
);

const Stat = ({ label, value, small }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey">{label}</p>
    <p className={`font-fredoka text-deep-slate mt-1 ${small ? "text-2xl" : "text-3xl"}`}>{value}</p>
  </div>
);

const Bar = ({ label, pct, tone }) => {
  const color = { gold: "#eae45c", terra: "#c87964", sage: "#88a096", grey: "#95a5a6" }[tone];
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-bold text-deep-slate">{label}</span>
        <span className="text-xs font-bold text-pebble-grey">{pct}%</span>
      </div>
      <div className="h-2 bg-pebble-grey/15 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }}/>
      </div>
    </div>
  );
};

/* ======================= PROFILE EDITOR ======================= */

const ProfileEditor = () => {
  const [bio, setBio] = React.useState("We're a husband-and-wife team running a fully-mobile grooming van across East London. Eight years in, we know every quirky cocker spaniel coat, every nervous rescue, and every dog who genuinely loves bath time.");
  return (
    <section className="grid lg:grid-cols-[1fr_360px] gap-8">
      <div className="space-y-6">
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6 space-y-5">
          <Eyebrow>Public profile</Eyebrow>
          <Field label="Business name" value="Wagington & Co."/>
          <Field label="Tagline" value="Mobile · Hand-stripping experts"/>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey mb-2">Bio</p>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5}
              className="field" style={{ resize: "vertical" }}/>
            <p className="text-xs text-pebble-grey mt-1">{bio.length}/400 characters</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Location" value="Hackney, London"/>
            <Field label="Service radius" value="3 miles"/>
          </div>
        </div>

        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
          <div className="flex items-baseline justify-between mb-4">
            <Eyebrow>Services & pricing</Eyebrow>
            <button className="text-xs font-bold text-deep-slate text-link">+ Add service</button>
          </div>
          <div className="space-y-3">
            {[
              ["Bath & Brush", 45, 38],
              ["Full Groom", 90, 58],
              ["Hand-Strip", 120, 80],
              ["Nail Clip", 15, 15],
            ].map(([n, d, p]) => (
              <div key={n} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
                <div>
                  <p className="font-fredoka text-deep-slate">{n}</p>
                  <p className="text-xs text-pebble-grey font-bold">{d} min</p>
                </div>
                <span className="font-fredoka text-xl text-deep-slate">£{p}</span>
                <button className="text-xs font-bold text-deep-slate text-link">Edit</button>
                <button className="text-xs font-bold text-pebble-grey hover:text-muted-terracotta transition-colors">Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
          <div className="flex items-baseline justify-between mb-4">
            <Eyebrow>Portfolio</Eyebrow>
            <button className="text-xs font-bold text-deep-slate text-link">+ Upload photos</button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              "https://images.unsplash.com/photo-1583511655802-41f17ea38f31?auto=format&fit=crop&w=400&q=70",
              "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=400&q=70",
              "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=400&q=70",
              "https://images.unsplash.com/photo-1612531822800-cda6cf9c8caa?auto=format&fit=crop&w=400&q=70",
            ].map((src, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-sage-leaf/15">
                <img src={src} alt="" className="w-full h-full object-cover"/>
              </div>
            ))}
            <button className="aspect-square border-2 border-dashed border-pebble-grey/30 rounded-xl flex items-center justify-center text-pebble-grey hover:border-deep-slate hover:text-deep-slate transition-colors focus-ring">
              <UploadIcon size={22}/>
            </button>
          </div>
        </div>
      </div>

      {/* Side: hours, availability, save */}
      <aside className="space-y-5">
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
          <Eyebrow>Working hours</Eyebrow>
          <div className="space-y-2 mt-3">
            {[
              ["Mon", "08:00", "18:00", true],
              ["Tue", "08:00", "18:00", true],
              ["Wed", "08:00", "18:00", true],
              ["Thu", "08:00", "18:00", true],
              ["Fri", "08:00", "18:00", true],
              ["Sat", "08:00", "16:00", true],
              ["Sun", "—",     "—",     false],
            ].map(([d, s, e, on]) => (
              <div key={d} className="flex items-center justify-between gap-3 py-1.5">
                <span className="font-bold text-sm text-deep-slate w-10">{d}</span>
                {on
                  ? <span className="text-sm text-pebble-grey font-bold flex-1 text-right">{s} – {e}</span>
                  : <span className="text-sm text-pebble-grey font-bold flex-1 text-right">Off</span>}
                <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${on ? "bg-sage-leaf" : "bg-pebble-grey/30"}`}>
                  <span className={`block w-4 h-4 bg-white rounded-full shadow-subtle transition-transform ${on ? "translate-x-4" : ""}`}/>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-deep-slate text-alabaster-cream rounded-[20px] p-6">
          <Eyebrow className="text-groomr-gold">Availability</Eyebrow>
          <p className="font-fredoka text-xl mt-2">Accepting new clients</p>
          <p className="text-sm text-sage-leaf mt-1">You'll show in search results.</p>
          <button className="mt-4 w-full bg-groomr-gold text-deep-slate font-bold py-2.5 rounded-full text-sm hover:bg-muted-terracotta hover:text-alabaster-cream transition-colors focus-ring">
            Pause new bookings
          </button>
        </div>

        <button className="btn-primary w-full font-nunito font-bold py-3 rounded-full focus-ring shadow-subtle">Save changes</button>
      </aside>
    </section>
  );
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-wider text-pebble-grey mb-2">{label}</p>
    <input defaultValue={value} className="field"/>
  </div>
);

window.GroomerDashboard = GroomerDashboard;
