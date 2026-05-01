// GroomerDashboard — Back-office.
// Tabs: Bookings (Today/Week/Month/Year) · Clients · Earnings · Reviews · Profile

const GROOMER_ME = {
  business: "Wagington & Co.",
  owner: "Lola García",
  rating: 4.9,
  reviewCount: 184,
  thisWeek:  { bookings: 14, hours: 21, earnings: 742, change: +12 },
  payout:    { next: "Mon 27 Apr", amount: 742 },
};

const TODAY_BOOKINGS = [
  { id: 1, time: "08:30", duration: 45,  dog: "Murphy", breed: "Chihuahua",      owner: "Sarah K.",  svc: "Bath & Brush", price: 38, status: "confirmed",   note: "Anxious — slow intro.", groomer: "Lola" },
  { id: 2, time: "09:30", duration: 90,  dog: "Pippa",  breed: "Cockapoo",       owner: "Daniel R.", svc: "Full Groom",   price: 58, status: "in-progress", note: "Regular — usual cut.",  groomer: "Lola" },
  { id: 3, time: "11:30", duration: 120, dog: "Otis",   breed: "Border Terrier", owner: "Imogen T.", svc: "Hand-Strip",   price: 80, status: "confirmed",   note: "Hand-strip, leave beard.", groomer: "Marcus" },
  { id: 4, time: "14:00", duration: 90,  dog: "Roxy",   breed: "Staffy",         owner: "Ben H.",    svc: "Full Groom",   price: 58, status: "confirmed",   note: "Sensitive paws.",       groomer: "Lola" },
  { id: 5, time: "16:00", duration: 15,  dog: "Bean",   breed: "Labrador",       owner: "Priya N.",  svc: "Nail Clip",    price: 15, status: "pending",     note: "First visit.",          groomer: "Marcus" },
];

const WEEK_DAYS = [
  { dow: "Mon", date: "21", count: 4, hours: 5.5 },
  { dow: "Tue", date: "22", count: 5, hours: 7   },
  { dow: "Wed", date: "23", count: 3, hours: 4.5 },
  { dow: "Thu", date: "24", count: 5, hours: 6.5, today: true },
  { dow: "Fri", date: "25", count: 6, hours: 8   },
  { dow: "Sat", date: "26", count: 7, hours: 9   },
  { dow: "Sun", date: "27", count: 0, hours: 0,   off: true },
];
const CAL_HOURS = ["08","09","10","11","12","13","14","15","16","17","18"];
const CAL_ITEMS = [
  { day:0, start:9,  span:1,   label:"Murphy", svc:"Bath",       tone:"sage" },
  { day:0, start:11, span:1.5, label:"Pippa",  svc:"Full",       tone:"gold" },
  { day:0, start:14, span:2,   label:"Otis",   svc:"Hand-Strip", tone:"terra" },
  { day:1, start:9,  span:1.5, label:"Bean",   svc:"Full",       tone:"gold" },
  { day:1, start:13, span:1,   label:"Coco",   svc:"Bath",       tone:"sage" },
  { day:1, start:15, span:2,   label:"Bramble",svc:"Hand-Strip", tone:"terra" },
  { day:2, start:10, span:1.5, label:"Pippa",  svc:"Full",       tone:"gold" },
  { day:2, start:14, span:1,   label:"Roxy",   svc:"Bath",       tone:"sage" },
  { day:3, start:9,  span:1,   label:"Murphy", svc:"Bath",       tone:"sage", live:true },
  { day:3, start:10, span:1.5, label:"Pippa",  svc:"Full",       tone:"gold", live:true },
  { day:3, start:12, span:2,   label:"Otis",   svc:"Hand-Strip", tone:"terra" },
  { day:3, start:15, span:1.5, label:"Roxy",   svc:"Full",       tone:"gold" },
  { day:4, start:9,  span:1.5, label:"Hugo",   svc:"Full",       tone:"gold" },
  { day:4, start:11, span:1,   label:"Daisy",  svc:"Bath",       tone:"sage" },
  { day:4, start:13, span:2,   label:"Bramble",svc:"Hand-Strip", tone:"terra" },
  { day:4, start:16, span:1.5, label:"Coco",   svc:"Full",       tone:"gold" },
  { day:5, start:8,  span:1,   label:"Murphy", svc:"Bath",       tone:"sage" },
  { day:5, start:9,  span:1.5, label:"Pippa",  svc:"Full",       tone:"gold" },
  { day:5, start:11, span:2,   label:"Otis",   svc:"Hand-Strip", tone:"terra" },
  { day:5, start:14, span:1.5, label:"Roxy",   svc:"Full",       tone:"gold" },
  { day:5, start:16, span:1,   label:"Bean",   svc:"Nail",       tone:"sage" },
];

const CLIENTS = [
  { id: "c1", dog: "Murphy",  breed: "Chihuahua",      owner: "Sarah K. (Sarah Khan)",   visits: 14, last: "12 Apr", spend: 532,  regular: true,  note: "Anxious. Slow intro. Treats in pocket.", phone: "+44 7700 900 014", email: "sarah.k@example.com",  joined: "Mar 2023", coat: "Smooth, short" },
  { id: "c2", dog: "Pippa",   breed: "Cockapoo",       owner: "Daniel R. (Daniel Reid)", visits: 22, last: "18 Apr", spend: 1276, regular: true,  note: "Show cut every 6 wks. Bow at the end.", phone: "+44 7700 900 022", email: "daniel.r@example.com", joined: "Aug 2022", coat: "Curly, medium" },
  { id: "c3", dog: "Otis",    breed: "Border Terrier", owner: "Imogen T. (Imogen Tate)", visits: 9,  last: "08 Apr", spend: 720,  regular: true,  note: "Leave beard. Hand-strip only.",         phone: "+44 7700 900 098", email: "imogen.t@example.com", joined: "Jun 2023", coat: "Wire, medium" },
  { id: "c4", dog: "Roxy",    breed: "Staffy",         owner: "Ben H. (Ben Holloway)",   visits: 5,  last: "21 Apr", spend: 290,  regular: false, note: "Sensitive paws. Quick on nails.",       phone: "+44 7700 900 115", email: "ben.h@example.com",    joined: "Jan 2024", coat: "Smooth, short" },
  { id: "c5", dog: "Bean",    breed: "Labrador",       owner: "Priya N. (Priya Nair)",   visits: 1,  last: "—",      spend: 0,    regular: false, note: "First visit. Bouncy 18-month-old.",     phone: "+44 7700 900 211", email: "priya.n@example.com",  joined: "Apr 2024", coat: "Double, short" },
  { id: "c6", dog: "Hugo",    breed: "Labradoodle",    owner: "Tom B. (Tom Brennan)",    visits: 11, last: "04 Apr", spend: 638,  regular: true,  note: "Loves the dryer. Easy customer.",       phone: "+44 7700 900 187", email: "tom.b@example.com",    joined: "Sep 2022", coat: "Curly, medium" },
];

const REVIEWS = [
  { id: "r1", name: "Sarah Khan",     dog: "Murphy",  rating: 5, when: "2 days ago",   svc: "Bath & Brush", text: "Lola is a wizard with anxious dogs. Murphy used to shake the whole way to the old groomers — now he walks straight to the van. Worth every penny.", responded: false },
  { id: "r2", name: "Daniel Reid",    dog: "Pippa",   rating: 5, when: "1 week ago",   svc: "Full Groom",   text: "We've been with Wagington for two years now. Always on time, always brilliant. Pippa comes home looking like a show dog and smelling amazing.", responded: true, response: "Thank you Daniel — Pippa's such a star. See you in 6!" },
  { id: "r3", name: "Imogen Tate",    dog: "Otis",    rating: 5, when: "2 weeks ago",  svc: "Hand-Strip",   text: "Best hand-stripping in East London, hands down. Otis's coat has never looked better.", responded: false },
  { id: "r4", name: "Ben Holloway",   dog: "Roxy",    rating: 4, when: "1 month ago",  svc: "Full Groom",   text: "Roxy was nervous her first time but Lola took it slow. Came back a calm, shiny pup. Booking was the easiest part.", responded: false },
  { id: "r5", name: "Anya P.",        dog: "Bonnie",  rating: 3, when: "5 weeks ago",  svc: "Bath & Brush", text: "Cut was fine but van ran 25 minutes late and there was no message until I called. Felt a bit chaotic.", responded: false },
  { id: "r6", name: "Marcus Eze",     dog: "Ziggy",   rating: 5, when: "6 weeks ago",  svc: "Full Groom",   text: "Booking was instant, payment was painless, and Ziggy came home wagging. What more could you ask?", responded: true, response: "Thanks Marcus, give Ziggy a chin scratch from us." },
];

const TEAM = [
  { id: "t1", name: "Lola García",  role: "Owner & lead groomer", since: "2017", avatar: "L", services: ["Hand-Strip", "Full Groom", "Bath & Brush"], rating: 4.9, reviews: 142, link: "groomr.co/lola-at-wagington" },
  { id: "t2", name: "Marcus Eze",   role: "Senior groomer",       since: "2021", avatar: "M", services: ["Full Groom", "Bath & Brush", "Nail Clip"],  rating: 4.8, reviews: 38,  link: "groomr.co/marcus-at-wagington" },
  { id: "t3", name: "Hannah Reid",  role: "Apprentice (puppy specialist)", since: "2024", avatar: "H", services: ["Bath & Brush", "Puppy First", "Nail Clip"], rating: 4.9, reviews: 4, link: "groomr.co/hannah-at-wagington" },
];

/* ---- Sparkline ---- */
const Sparkline = ({ data, w=200, h=56 }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const dx = w / (data.length - 1);
  const pts = data.map((v,i) => `${i*dx},${h - ((v-min)/(max-min||1))*(h-8) - 4}`).join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block">
      <polyline points={pts} fill="none" stroke="#88a096" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="rgba(136,160,150,0.15)" stroke="none"/>
      <circle cx={w} cy={h - ((data[data.length-1]-min)/(max-min||1))*(h-8) - 4} r="4" fill="#eae45c" stroke="#2c3e50" strokeWidth="1.5"/>
    </svg>
  );
};

const StatusDot = ({ status }) => {
  const tone = {
    confirmed:    ["#88a096","Confirmed"],
    "in-progress":["#eae45c","In progress"],
    pending:      ["#c87964","Pending"],
  }[status] || ["#95a5a6", status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-deep-slate">
      <span className="w-2 h-2 rounded-full" style={{ background: tone[0] }}/>{tone[1]}
    </span>
  );
};

/* ======================= TABS ======================= */
const TABS = [
  { id: "bookings", label: "Bookings", icon: CalendarIcon },
  { id: "clients",  label: "Clients",  icon: PetsIcon },
  { id: "earnings", label: "Earnings", icon: ScissorsIcon },
  { id: "reviews",  label: "Reviews",  icon: StarIcon },
  { id: "profile",  label: "Profile",  icon: ShieldIcon },
];

const PrimaryTabs = ({ tab, setTab, unrespondedReviews }) => (
  <nav className="bg-white border border-pebble-grey/20 rounded-[20px] p-2 shadow-subtle">
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
      {TABS.map(t => {
        const active = tab === t.id;
        const Icon = t.icon;
        const showDot = t.id === "reviews" && unrespondedReviews > 0;
        return (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`relative flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-nunito font-bold text-base transition-colors focus-ring ${active
              ? "bg-deep-slate text-alabaster-cream" : "text-deep-slate hover:bg-alabaster-cream"}`}>
            <Icon size={20}/> {t.label}
            {showDot && (
              <span className={`absolute top-2.5 right-3 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center
                ${active ? "bg-groomr-gold text-deep-slate" : "bg-muted-terracotta text-alabaster-cream"}`}>
                {unrespondedReviews}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </nav>
);

/* ======================= ROOT ======================= */
const GroomerDashboard = ({ user, onLogout, onNavMessages }) => {
  const [tab, setTab] = React.useState("bookings");
  const [bookingsView, setBookingsView] = React.useState("today");
  const [reviews, setReviews] = React.useState(REVIEWS);
  const [team, setTeam] = React.useState(TEAM);
  const [businessMode, setBusinessMode] = React.useState("mobile"); // mobile | studio
  const [openClient, setOpenClient] = React.useState(null);
  const unresponded = reviews.filter(r => r.rating <= 4 && !r.responded).length || reviews.filter(r => !r.responded).length;

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-8 space-y-7">
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

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today" value="5" sub="bookings · 6.5 hrs" tone="gold"/>
        <StatCard label="This week" value={`£${GROOMER_ME.thisWeek.earnings}`} sub={`${GROOMER_ME.thisWeek.bookings} bookings · +12% vs last`} tone="sage"/>
        <StatCard label="Next payout" value={`£${GROOMER_ME.payout.amount}`} sub={`Auto-deposit ${GROOMER_ME.payout.next}`} tone="terra"/>
        <StatCard label="Repeat rate" value="78%" sub="of clients booked again" tone="slate"/>
      </section>

      <PrimaryTabs tab={tab} setTab={setTab} unrespondedReviews={reviews.filter(r => !r.responded).length}/>

      {tab === "bookings" && <BookingsView view={bookingsView} setView={setBookingsView}/>}
      {tab === "clients"  && <ClientsView onOpenClient={setOpenClient}/>}
      {tab === "earnings" && <EarningsView/>}
      {tab === "reviews"  && <ReviewsView reviews={reviews} setReviews={setReviews}/>}
      {tab === "profile"  && <ProfileEditor team={team} setTeam={setTeam} businessMode={businessMode} setBusinessMode={setBusinessMode}/>}

      <ClientDetailsModal client={openClient} onClose={() => setOpenClient(null)}/>
    </div>
  );
};

const StatCard = ({ label, value, sub, tone="sage" }) => {
  const dot = { gold:"#eae45c", sage:"#88a096", terra:"#c87964", slate:"#2c3e50" }[tone];
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

window.GroomerDashboard = GroomerDashboard;
