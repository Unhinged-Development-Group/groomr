// GroomerDashboard — Earnings, Reviews, ProfileEditor

/* ======================= EARNINGS ======================= */
const EarningsView = () => {
  const [period, setPeriod] = React.useState("week");
  const SERIES = {
    week: { label: "This week",   total: 742,   change: +12,  bookings: 14, avg: 53,
            data:[60,80,140,90,210,162,0], xlabels:["M","T","W","T","F","S","S"] },
    "12w":{ label: "Last 12 weeks", total: 8420, change: +8, bookings: 162, avg: 52,
            data:[610,580,640,720,690,710,790,810,760,830,870,742], xlabels:Array.from({length:12},(_,i)=>`${i+1}`) },
    "3m": { label: "Last 3 months", total: 11620, change: +15, bookings: 224, avg: 52,
            data:[3120,3480,3960,4280,4520,4780,3650,3320,3900,4200,3800,3900], xlabels:["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10","W11","W12"] },
    ytd: { label: "Year to date", total: 35610, change: +18, bookings: 933, avg: 52,
            data:[3120,3480,3960,4280,4520,4780,3650,3320,3900,4200], xlabels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct"] },
  };
  const s = SERIES[period];
  const max = Math.max(...s.data);
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <Eyebrow>Earnings</Eyebrow>
          <h2 className="font-fredoka text-2xl text-deep-slate mt-1">{s.label}</h2>
        </div>
        <div className="flex items-center gap-2 bg-white border border-pebble-grey/20 rounded-full p-1.5">
          {[["week","This week"],["12w","12W"],["3m","3M"],["ytd","YTD"]].map(([k,l]) => (
            <button key={k} onClick={() => setPeriod(k)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors focus-ring ${period===k?"bg-deep-slate text-alabaster-cream":"text-deep-slate hover:bg-pebble-grey/10"}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Earned"    value={`£${s.total.toLocaleString()}`} sub={`${s.change>=0?"+":""}${s.change}% vs prior`} tone="gold"/>
        <StatCard label="Bookings"  value={s.bookings} sub={`Avg £${s.avg} / booking`} tone="sage"/>
        <StatCard label="Next payout" value="£742" sub="Mon 27 Apr · auto-deposit" tone="terra"/>
        <StatCard label="Tips collected" value="£68" sub="14 dogs tipped this period" tone="slate"/>
      </div>

      <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
        <div className="flex items-end gap-2 h-44">
          {s.data.map((v,i) => {
            const h = max ? (v/max)*100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end h-full">
                  <div className="w-full rounded-t-md bg-sage-leaf hover:bg-deep-slate transition-colors" style={{ height: `${h}%`, minHeight: v?2:0 }} title={`£${v}`}/>
                </div>
                <span className="text-[10px] font-bold text-pebble-grey">{s.xlabels[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
          <div className="px-5 py-4 border-b border-pebble-grey/15 flex items-center justify-between">
            <Eyebrow>Recent payouts</Eyebrow>
            <button className="text-xs font-bold text-deep-slate text-link">Download all</button>
          </div>
          {[
            { d:"20 Apr", amt: 712, n: 13, status:"Paid" },
            { d:"13 Apr", amt: 689, n: 12, status:"Paid" },
            { d:"06 Apr", amt: 745, n: 14, status:"Paid" },
            { d:"30 Mar", amt: 802, n: 15, status:"Paid" },
          ].map((p,i) => (
            <div key={i} className={`grid grid-cols-[100px_1fr_auto_auto] gap-3 px-5 py-3 items-center ${i?"border-t border-pebble-grey/10":""}`}>
              <span className="font-bold text-sm text-deep-slate">{p.d}</span>
              <span className="text-sm text-pebble-grey font-bold">{p.n} bookings</span>
              <Badge tone="sage">{p.status}</Badge>
              <span className="font-fredoka text-deep-slate">£{p.amt}</span>
            </div>
          ))}
        </div>
        <aside className="bg-alabaster-cream border border-pebble-grey/15 rounded-[20px] p-5 space-y-3">
          <Eyebrow>Top services</Eyebrow>
          {[
            ["Full Groom", 62, "#eae45c"],
            ["Bath & Brush", 22, "#88a096"],
            ["Hand-Strip", 12, "#c87964"],
            ["Nail Clip", 4, "#95a5a6"],
          ].map(([n,p,c]) => (
            <div key={n}>
              <div className="flex justify-between text-xs font-bold text-deep-slate mb-1"><span>{n}</span><span>{p}%</span></div>
              <div className="h-2 bg-white rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ background: c, width: `${p}%` }}/></div>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
};

/* ======================= REVIEWS ======================= */
const ReviewsView = ({ reviews, setReviews }) => {
  const [filter, setFilter] = React.useState("All");
  const [drafts, setDrafts] = React.useState({});
  const avg = (reviews.reduce((s,r) => s+r.rating, 0) / reviews.length).toFixed(1);
  const dist = [5,4,3,2,1].map(s => ({ stars: s, count: reviews.filter(r => r.rating===s).length }));
  const visible = reviews.filter(r => filter==="All" ? true : filter==="Unanswered" ? !r.responded : filter==="Low" ? r.rating <= 3 : r.rating === 5);
  const setDraft = (id, t) => setDrafts(d => ({ ...d, [id]: t }));
  const submit = (id) => {
    const txt = (drafts[id] || "").trim();
    if (!txt) return;
    setReviews(rs => rs.map(r => r.id === id ? { ...r, responded: true, response: txt } : r));
    setDrafts(d => { const n = { ...d }; delete n[id]; return n; });
  };

  return (
    <section className="space-y-5">
      <div className="grid lg:grid-cols-[260px_1fr] gap-5">
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 text-center">
          <Eyebrow>Overall</Eyebrow>
          <p className="font-fredoka text-6xl text-deep-slate mt-1 leading-none">{avg}</p>
          <div className="flex justify-center mt-2"><StarRow rating={Number(avg)} size={16}/></div>
          <p className="text-xs text-pebble-grey font-bold mt-2">{reviews.length} reviews</p>
        </div>
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 space-y-2">
          {dist.map(d => {
            const pct = reviews.length ? (d.count/reviews.length)*100 : 0;
            return (
              <div key={d.stars} className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
                <span className="text-xs font-bold text-deep-slate">{d.stars}★</span>
                <div className="h-2 bg-pebble-grey/15 rounded-full overflow-hidden"><div className="h-full bg-groomr-gold rounded-full" style={{ width: `${pct}%` }}/></div>
                <span className="text-xs font-bold text-pebble-grey text-right">{d.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {["All","Unanswered","Low","5-star"].map(f => <Chip key={f} active={filter===f} onClick={() => setFilter(f)}>{f}</Chip>)}
      </div>

      <div className="space-y-3">
        {visible.map(r => (
          <div key={r.id} className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sage-leaf text-white font-fredoka flex items-center justify-center">{r.name.charAt(0)}</div>
                <div>
                  <p className="font-bold text-deep-slate text-sm">{r.name} · <span className="text-pebble-grey font-bold">{r.dog}</span></p>
                  <p className="text-xs text-pebble-grey font-bold">{r.svc} · {r.when}</p>
                </div>
              </div>
              <StarRow rating={r.rating} size={14}/>
            </div>
            <p className="text-sm text-deep-slate mt-3 leading-relaxed">{r.text}</p>
            {r.responded ? (
              <div className="mt-4 bg-alabaster-cream border-l-2 border-sage-leaf rounded-r-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sage-leaf mb-1">Your reply</p>
                <p className="text-sm text-deep-slate italic">{r.response}</p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <input value={drafts[r.id] || ""} onChange={(e) => setDraft(r.id, e.target.value)} className="field flex-1" placeholder="Write a reply…"/>
                <button onClick={() => submit(r.id)} className="btn-primary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring">Reply</button>
              </div>
            )}
          </div>
        ))}
        {visible.length === 0 && <p className="text-center text-sm text-pebble-grey font-bold py-8">No reviews in this filter.</p>}
      </div>
    </section>
  );
};

/* ======================= PROFILE EDITOR ======================= */
const ProfileEditor = ({ team, setTeam, businessMode, setBusinessMode }) => {
  const [services, setServices] = React.useState([
    { name: "Bath & Brush", duration: 45, price: 38 },
    { name: "Full Groom",   duration: 90, price: 58 },
    { name: "Hand-Strip",   duration: 120, price: 80 },
    { name: "Nail Clip",    duration: 15, price: 15 },
  ]);
  const [bio, setBio] = React.useState("We're a husband-and-wife team running a fully-mobile grooming van across East London. Eight years in, we know every quirky cocker spaniel coat, every nervous rescue, and every dog who genuinely loves bath time.");
  const [radius, setRadius] = React.useState(5);
  const [adding, setAdding] = React.useState(false);
  const [newMember, setNewMember] = React.useState({ name: "", role: "" });

  const addMember = () => {
    if (!newMember.name.trim()) return;
    const slug = newMember.name.toLowerCase().replace(/[^a-z]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
    setTeam(t => [...t, {
      id: "t" + (t.length+1),
      name: newMember.name,
      role: newMember.role || "Groomer",
      since: "2026",
      avatar: newMember.name.charAt(0).toUpperCase(),
      services: [],
      rating: 0,
      reviews: 0,
      link: `groomr.co/${slug}-at-wagington`,
    }]);
    setNewMember({ name: "", role: "" });
    setAdding(false);
  };

  return (
    <section className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-6 min-w-0">
        {/* Business basics */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-4">
            <Eyebrow>Business basics</Eyebrow>
            <button className="text-xs font-bold text-deep-slate text-link">Preview public profile →</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FieldGroup label="Business name"><input className="field" defaultValue="Wagington & Co."/></FieldGroup>
            <FieldGroup label="Owner / lead"><input className="field" defaultValue="Lola García"/></FieldGroup>
            <FieldGroup label="Email"><input className="field" defaultValue="lola@wagington.co.uk"/></FieldGroup>
            <FieldGroup label="Phone"><input className="field" defaultValue="+44 7700 900 014"/></FieldGroup>
          </div>
          <div className="mt-4">
            <FieldGroup label="Bio (max 280 chars)">
              <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0,280))} className="field min-h-[100px]"/>
              <p className="text-[10px] font-bold text-pebble-grey mt-1">{bio.length}/280</p>
            </FieldGroup>
          </div>
        </div>

        {/* Mode + radius */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
          <Eyebrow>How you operate</Eyebrow>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { k:"mobile", l:"Mobile (we drive)", sub:"You travel to clients" },
              { k:"studio", l:"Studio (clients come to us)", sub:"Fixed location" },
            ].map(m => (
              <button key={m.k} onClick={() => setBusinessMode(m.k)}
                className={`text-left rounded-2xl p-4 border-2 transition-colors focus-ring ${businessMode===m.k?"border-deep-slate bg-alabaster-cream":"border-pebble-grey/20 hover:border-deep-slate"}`}>
                <p className="font-fredoka text-lg text-deep-slate">{m.l}</p>
                <p className="text-xs text-pebble-grey font-bold mt-1">{m.sub}</p>
              </button>
            ))}
          </div>
          {businessMode === "mobile" && (
            <div className="mt-4 bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
              <div className="flex justify-between items-baseline">
                <p className="text-xs font-bold uppercase tracking-wider text-sage-leaf">Service radius</p>
                <p className="font-fredoka text-2xl text-deep-slate">{radius} mi</p>
              </div>
              <input type="range" min="1" max="20" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full mt-2 accent-deep-slate"/>
              <div className="flex justify-between text-[10px] font-bold text-pebble-grey mt-1"><span>1 mi</span><span>20 mi</span></div>
            </div>
          )}
          {businessMode === "studio" && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldGroup label="Studio address"><input className="field" defaultValue="14 Mare Street, Hackney, E8"/></FieldGroup>
              <FieldGroup label="Postcode"><input className="field" defaultValue="E8 4RP"/></FieldGroup>
            </div>
          )}
        </div>

        {/* Services */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-4">
            <Eyebrow>Services & pricing</Eyebrow>
            <button onClick={() => setServices(s => [...s, { name: "New service", duration: 30, price: 20 }])}
              className="btn-secondary font-nunito font-bold px-4 py-1.5 rounded-full text-xs focus-ring flex items-center gap-1">
              <PlusIcon size={12}/> Add
            </button>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_100px_100px_40px] gap-3 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-pebble-grey">
              <span>Service</span><span>Duration</span><span>Price</span><span></span>
            </div>
            {services.map((s,i) => (
              <div key={i} className="grid grid-cols-[1fr_100px_100px_40px] gap-3 items-center">
                <input className="field" value={s.name} onChange={(e) => setServices(arr => arr.map((x,j) => j===i ? { ...x, name: e.target.value } : x))}/>
                <div className="relative">
                  <input className="field pr-10" type="number" value={s.duration} onChange={(e) => setServices(arr => arr.map((x,j) => j===i ? { ...x, duration: Number(e.target.value) } : x))}/>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-pebble-grey">min</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-pebble-grey">£</span>
                  <input className="field pl-7" type="number" value={s.price} onChange={(e) => setServices(arr => arr.map((x,j) => j===i ? { ...x, price: Number(e.target.value) } : x))}/>
                </div>
                <button onClick={() => setServices(arr => arr.filter((_,j) => j!==i))}
                  className="rounded-full p-2 text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors focus-ring" aria-label="Remove">
                  <TrashIcon size={16}/>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Team / employed groomers */}
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Eyebrow>Team groomers</Eyebrow>
              <p className="text-xs text-pebble-grey font-bold mt-1">Each groomer gets their own public profile under your business.</p>
            </div>
            <button onClick={() => setAdding(true)}
              className="btn-primary font-nunito font-bold px-4 py-1.5 rounded-full text-xs focus-ring shadow-subtle flex items-center gap-1">
              <PlusIcon size={12}/> Add groomer
            </button>
          </div>
          <div className="space-y-3">
            {team.map(m => (
              <div key={m.id} className="flex items-center gap-4 bg-alabaster-cream border border-pebble-grey/15 rounded-2xl p-4">
                <div className="w-12 h-12 rounded-2xl bg-sage-leaf text-white font-fredoka text-xl flex items-center justify-center shrink-0">{m.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-fredoka text-lg text-deep-slate">{m.name}</p>
                    <span className="text-xs text-pebble-grey font-bold">· since {m.since}</span>
                  </div>
                  <p className="text-xs text-deep-slate font-bold">{m.role}</p>
                  {m.reviews > 0 && (
                    <p className="text-xs text-pebble-grey font-bold mt-0.5 flex items-center gap-1"><StarIcon size={10}/> {m.rating} · {m.reviews} reviews</p>
                  )}
                  <p className="text-[11px] font-bold text-sage-leaf mt-0.5 truncate">{m.link}</p>
                </div>
                <button className="rounded-full p-2 bg-white border border-pebble-grey/20 hover:border-deep-slate transition-colors focus-ring" aria-label="Edit">
                  <PencilIcon size={14}/>
                </button>
                <button onClick={() => setTeam(t => t.filter(x => x.id !== m.id))}
                  className="rounded-full p-2 text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors focus-ring" aria-label="Remove">
                  <TrashIcon size={14}/>
                </button>
              </div>
            ))}

            {adding && (
              <div className="border-2 border-dashed border-deep-slate/30 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                <FieldGroup label="Name"><input className="field" placeholder="e.g. Hannah Reid" value={newMember.name} onChange={(e) => setNewMember(m => ({ ...m, name: e.target.value }))}/></FieldGroup>
                <FieldGroup label="Role"><input className="field" placeholder="e.g. Senior groomer" value={newMember.role} onChange={(e) => setNewMember(m => ({ ...m, role: e.target.value }))}/></FieldGroup>
                <div className="flex gap-2">
                  <button onClick={addMember} className="btn-primary font-nunito font-bold px-4 py-2.5 rounded-full text-sm focus-ring">Add</button>
                  <button onClick={() => { setAdding(false); setNewMember({ name: "", role: "" }); }} className="btn-secondary font-nunito font-bold px-4 py-2.5 rounded-full text-sm focus-ring">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right column */}
      <aside className="space-y-5">
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
          <Eyebrow>Public profile</Eyebrow>
          <div className="mt-3 aspect-[5/3] rounded-xl bg-sage-leaf/20 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=600&q=70" className="w-full h-full object-cover"/>
          </div>
          <button className="btn-secondary w-full font-nunito font-bold py-2 rounded-full text-xs mt-3 focus-ring">Replace cover photo</button>
          <button className="btn-secondary w-full font-nunito font-bold py-2 rounded-full text-xs mt-2 focus-ring">Manage portfolio (4)</button>
        </div>
        <div className="bg-deep-slate text-alabaster-cream rounded-[20px] p-5">
          <Eyebrow className="text-groomr-gold">Account health</Eyebrow>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-sage-leaf rounded-full"/> Profile 100% complete</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-sage-leaf rounded-full"/> Verified groomer</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-groomr-gold rounded-full"/> Insurance expires Jul 2026</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-sage-leaf rounded-full"/> Stripe payouts active</div>
          </div>
        </div>
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5">
          <Eyebrow>Danger zone</Eyebrow>
          <button className="w-full mt-3 text-xs font-bold text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors py-2 rounded-full">Pause new bookings</button>
          <button className="w-full text-xs font-bold text-muted-terracotta hover:bg-muted-terracotta/10 transition-colors py-2 rounded-full">Close my Groomr account</button>
        </div>
      </aside>
    </section>
  );
};

const FieldGroup = ({ label, children }) => (
  <label className="block">
    <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-grey">{label}</span>
    <div className="mt-1.5">{children}</div>
  </label>
);

window.EarningsView = EarningsView;
window.ReviewsView = ReviewsView;
window.ProfileEditor = ProfileEditor;
