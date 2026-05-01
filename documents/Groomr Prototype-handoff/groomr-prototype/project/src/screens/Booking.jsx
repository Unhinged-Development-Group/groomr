// Booking — Two-step flow: (B) one-page service+date+dog+notes with sticky summary, (C) confirmation.

const TIME_SLOTS = [
  "9:00", "9:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00",
];
const UNAVAILABLE = new Set(["9:00", "12:30", "13:00", "15:30"]);

const dayList = () => {
  const today = new Date(2026, 4, 21); // Thu 21 May 2026
  return Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i);
    return {
      key: i,
      dow: d.toLocaleDateString("en-GB", { weekday: "short" }),
      day: d.getDate(),
      month: d.toLocaleDateString("en-GB", { month: "short" }),
      full: d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
    };
  });
};

const Booking = ({ groomer, service, onConfirm, onBack }) => {
  const days = React.useMemo(dayList, []);
  const [dayIdx, setDayIdx] = React.useState(2);
  const [slot, setSlot] = React.useState("10:30");
  const [dogId, setDogId] = React.useState(DOGS[0].id);
  const [notes, setNotes] = React.useState("");
  const [pay, setPay] = React.useState("card");

  const dog = DOGS.find(d => d.id === dogId);
  const total = service.price;
  const bookingFee = 1.5;

  const can = !!slot && !!dogId;

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-10">
      <button onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-bold text-deep-slate text-link mb-6 focus-ring rounded px-2 py-1">
        <ChevronLeft size={16}/> Back to {groomer.name}
      </button>

      <div className="grid lg:grid-cols-[1fr_400px] gap-10">
        <div className="space-y-10 min-w-0">
          <header className="space-y-2">
            <Eyebrow>Booking</Eyebrow>
            <h1 className="font-fredoka text-4xl md:text-5xl text-deep-slate">Let's get {dog?.name || "your dog"} sorted.</h1>
          </header>

          {/* Step 1 — Date */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-fredoka text-2xl text-deep-slate">1 · Pick a day</h2>
              <span className="text-xs font-bold text-pebble-grey">May 2026</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-2 px-2">
              {days.map(d => (
                <button key={d.key} onClick={() => setDayIdx(d.key)}
                  className={`shrink-0 w-20 py-3 rounded-2xl border-2 transition-colors text-center focus-ring ${
                    d.key === dayIdx
                      ? "bg-deep-slate text-alabaster-cream border-deep-slate"
                      : "bg-white text-deep-slate border-pebble-grey/20 hover:border-deep-slate"}`}>
                  <p className="text-xs font-bold uppercase opacity-70">{d.dow}</p>
                  <p className="font-fredoka text-2xl mt-1">{d.day}</p>
                  <p className="text-xs font-bold opacity-70">{d.month}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Step 2 — Time */}
          <section>
            <h2 className="font-fredoka text-2xl text-deep-slate mb-4">2 · Pick a time</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {TIME_SLOTS.map(t => {
                const off = UNAVAILABLE.has(t);
                const on = slot === t;
                return (
                  <button key={t} disabled={off} onClick={() => setSlot(t)}
                    className={`py-3 rounded-xl text-sm font-bold transition-colors focus-ring border-2 ${
                      off ? "bg-alabaster-cream text-pebble-grey/40 border-pebble-grey/10 line-through cursor-not-allowed"
                      : on ? "bg-groomr-gold text-deep-slate border-groomr-gold"
                      : "bg-white text-deep-slate border-pebble-grey/20 hover:border-deep-slate"}`}>
                    {t}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Step 3 — Dog */}
          <section>
            <h2 className="font-fredoka text-2xl text-deep-slate mb-4">3 · Which dog?</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {DOGS.map(d => (
                <button key={d.id} onClick={() => setDogId(d.id)}
                  className={`text-left flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors focus-ring ${
                    dogId === d.id ? "bg-white border-deep-slate" : "bg-white border-pebble-grey/20 hover:border-deep-slate"}`}>
                  <div className="w-14 h-14 rounded-2xl bg-sage-leaf/20 overflow-hidden shrink-0">
                    <img src={d.img} alt="" className="w-full h-full object-cover"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-fredoka text-lg text-deep-slate">{d.name}</p>
                    <p className="text-xs text-pebble-grey font-bold">{d.breed} · {d.age}</p>
                  </div>
                  {dogId === d.id && <div className="w-6 h-6 rounded-full bg-deep-slate text-alabaster-cream flex items-center justify-center"><CheckIcon size={14}/></div>}
                </button>
              ))}
              <button className="text-left flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-pebble-grey/30 text-pebble-grey hover:border-deep-slate hover:text-deep-slate transition-colors font-bold focus-ring">
                <PlusIcon size={18}/> Add another dog
              </button>
            </div>
          </section>

          {/* Step 4 — Notes */}
          <section>
            <h2 className="font-fredoka text-2xl text-deep-slate mb-4">4 · Anything {groomer.owner.split(" ")[0]} should know?</h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder={`E.g. "${dog?.name || "Bonnie"} is a bit nervous of the dryer — please go slow."`}
              className="field text-base"/>
          </section>

          {/* Step 5 — Payment */}
          <section>
            <h2 className="font-fredoka text-2xl text-deep-slate mb-4">5 · Pay & confirm</h2>
            <div className="space-y-2">
              {[
                { id: "card",   label: "Card ending •• 4242", sub: "Default" },
                { id: "apple",  label: "Apple Pay",            sub: "Tap to pay" },
                { id: "newcard",label: "+ Add a new card",     sub: "" },
              ].map(opt => (
                <label key={opt.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors cursor-pointer ${
                  pay === opt.id ? "bg-white border-deep-slate" : "bg-white border-pebble-grey/20 hover:border-deep-slate"}`}>
                  <input type="radio" name="pay" value={opt.id} checked={pay === opt.id} onChange={() => setPay(opt.id)} className="sr-only"/>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${pay === opt.id ? "border-deep-slate" : "border-pebble-grey/40"}`}>
                    {pay === opt.id && <span className="w-2.5 h-2.5 rounded-full bg-deep-slate"></span>}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-deep-slate">{opt.label}</p>
                    {opt.sub && <p className="text-xs text-pebble-grey">{opt.sub}</p>}
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky summary */}
        <aside>
          <div className="sticky top-24 bg-white border border-pebble-grey/20 rounded-[24px] p-6 shadow-subtle space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-pebble-grey/15">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-sage-leaf/20 shrink-0">
                <img src={groomer.image} alt="" className="w-full h-full object-cover"/>
              </div>
              <div className="min-w-0">
                <p className="font-fredoka text-deep-slate truncate">{groomer.name}</p>
                <p className="text-xs text-pebble-grey font-bold">{groomer.location}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-pebble-grey font-bold">Service</span>
                <span className="font-bold text-deep-slate text-right">{service.name}<br/><span className="text-xs text-pebble-grey font-bold">{service.duration}</span></span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-pebble-grey font-bold">Date</span>
                <span className="font-bold text-deep-slate text-right">{days[dayIdx].full}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-pebble-grey font-bold">Time</span>
                <span className="font-bold text-deep-slate">{slot || "—"}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-pebble-grey font-bold">Dog</span>
                <span className="font-bold text-deep-slate">{dog?.name}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-pebble-grey/15 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-pebble-grey">Service</span><span className="font-bold text-deep-slate">£{service.price.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-pebble-grey">Booking fee</span><span className="font-bold text-deep-slate">£{bookingFee.toFixed(2)}</span></div>
              <div className="flex justify-between pt-2 border-t border-pebble-grey/10">
                <span className="font-fredoka text-lg text-deep-slate">Total</span>
                <span className="font-fredoka text-lg text-deep-slate">£{(total + bookingFee).toFixed(2)}</span>
              </div>
            </div>

            <button disabled={!can} onClick={() => onConfirm({ groomer, service, day: days[dayIdx], slot, dog, notes, total: total + bookingFee })}
              className="btn-primary w-full font-nunito font-bold py-4 rounded-full text-base focus-ring shadow-subtle">
              Confirm & Pay £{(total + bookingFee).toFixed(2)}
            </button>
            <p className="text-xs text-pebble-grey text-center">Free cancellation until 24h before.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

const Confirmation = ({ booking, onDashboard, onHome }) => {
  if (!booking) return null;
  const { groomer, service, day, slot, dog } = booking;

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-16 max-w-3xl mx-auto">
      <div className="text-center space-y-5 mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-groomr-gold shadow-lift">
          <CheckIcon size={36}/>
        </div>
        <h1 className="font-fredoka text-4xl md:text-5xl text-deep-slate">{dog.name} is booked in.</h1>
        <p className="text-lg text-pebble-grey">A confirmation is on its way to your inbox.</p>
      </div>

      <div className="bg-white border border-pebble-grey/20 rounded-[24px] overflow-hidden shadow-subtle">
        <div className="bg-deep-slate text-alabaster-cream px-7 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-groomr-gold font-bold">Confirmed</p>
            <p className="font-fredoka text-2xl">{day.full}, {slot}</p>
          </div>
          <CalendarIcon size={40}/>
        </div>
        <div className="p-7 space-y-5">
          <div className="flex items-center gap-4 pb-5 border-b border-pebble-grey/15">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-sage-leaf/20 shrink-0">
              <img src={groomer.image} alt="" className="w-full h-full object-cover"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-fredoka text-xl text-deep-slate">{groomer.name}</p>
              <p className="text-sm text-pebble-grey">{groomer.location} · {groomer.distance} mi away</p>
            </div>
            <button className="btn-secondary font-nunito font-bold px-5 py-2 rounded-full text-sm focus-ring flex items-center gap-2">
              <MessageIcon size={14}/> Message
            </button>
          </div>

          <div className="grid grid-cols-2 gap-5 text-sm">
            <div><p className="text-pebble-grey font-bold mb-1">Service</p><p className="font-bold text-deep-slate">{service.name}</p></div>
            <div><p className="text-pebble-grey font-bold mb-1">Duration</p><p className="font-bold text-deep-slate">{service.duration}</p></div>
            <div><p className="text-pebble-grey font-bold mb-1">Dog</p><p className="font-bold text-deep-slate">{dog.name} · {dog.breed}</p></div>
            <div><p className="text-pebble-grey font-bold mb-1">Total paid</p><p className="font-bold text-deep-slate">£{booking.total.toFixed(2)}</p></div>
          </div>

          <div className="bg-alabaster-cream rounded-2xl p-4 border border-pebble-grey/15">
            <p className="text-xs font-bold uppercase tracking-wider text-sage-leaf mb-1">A heads-up from {groomer.owner.split(" ")[0]}</p>
            <p className="text-sm text-deep-slate">"I'll text 30 mins before I'm outside. Have {dog.name} ready and we'll do the rest. See you {day.dow}!"</p>
          </div>

          <div className="flex flex-wrap gap-3 pt-3">
            <button onClick={onDashboard} className="btn-primary font-nunito font-bold px-7 py-3 rounded-full focus-ring flex-1 min-w-[180px]">View My Dashboard</button>
            <button className="btn-secondary font-nunito font-bold px-7 py-3 rounded-full focus-ring flex-1 min-w-[180px] flex items-center justify-center gap-2">
              <CalendarIcon size={16}/> Add to Calendar
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white border border-pebble-grey/20 rounded-[20px] p-6 flex items-center gap-4">
        <HeartIcon size={28}/>
        <div className="flex-1">
          <p className="font-fredoka text-lg text-deep-slate">Make {groomer.owner.split(" ")[0]} {dog.name}'s regular?</p>
          <p className="text-sm text-pebble-grey">We'll suggest a rebook 6 weeks out, so you never have to remember.</p>
        </div>
        <button className="btn-primary font-nunito font-bold px-5 py-2.5 rounded-full text-sm focus-ring">Yes please</button>
      </div>
    </div>
  );
};

Object.assign(window, { Booking, Confirmation });
