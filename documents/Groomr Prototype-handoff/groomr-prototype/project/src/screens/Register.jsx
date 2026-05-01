// Groomer registration — Layout A: long single-page wizard with tall left progress rail.

const STEPS = [
  { id: "you",      t: "About you",        s: "Name, email, phone." },
  { id: "biz",      t: "Your business",    s: "Trading name, type, location." },
  { id: "services", t: "Services & prices",s: "What you offer, what you charge." },
  { id: "avail",    t: "Availability",     s: "When you work, lead time." },
  { id: "verify",   t: "Verify & launch",  s: "Insurance & payout." },
];

const Register = ({ onLaunch, onBack }) => {
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState({
    fullName: "Lola García", email: "lola@wagington.co.uk", phone: "+44 7700 900123",
    biz: "Wagington & Co.", type: "mobile", postcode: "E8 4DG", radius: 5,
    services: ["Full Groom", "Bath & Brush"], priceFull: 58, priceBath: 38,
    days: { mon:true, tue:true, wed:false, thu:true, fri:true, sat:true, sun:false },
    lead: 24, insured: true, sortCode: "12-34-56", account: "•••• 4242",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 py-10">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-deep-slate text-link mb-6 focus-ring rounded px-2 py-1">
        <ChevronLeft size={16}/> Back
      </button>

      <div className="grid lg:grid-cols-[280px_1fr] gap-10 max-w-6xl mx-auto">
        {/* Rail */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-1 mb-6">
            <Eyebrow>List your business</Eyebrow>
            <h1 className="font-fredoka text-3xl text-deep-slate">5 minutes.<br/>That's all.</h1>
          </div>
          <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-2">
            <div className="px-3 py-2">
              <div className="h-2 bg-pebble-grey/15 rounded-full overflow-hidden">
                <div className="h-full bg-groomr-gold transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-xs text-pebble-grey font-bold mt-2">Step {step + 1} of {STEPS.length}</p>
            </div>
            <div className="mt-1">
              {STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <button key={s.id} onClick={() => i <= step && setStep(i)}
                    disabled={i > step}
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-colors ${active ? "bg-alabaster-cream" : "hover:bg-alabaster-cream/60"} ${i > step ? "opacity-50 cursor-not-allowed" : ""}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${done ? "bg-sage-leaf text-white" : active ? "bg-deep-slate text-alabaster-cream" : "bg-pebble-grey/15 text-pebble-grey"}`}>
                      {done ? <CheckIcon size={14}/> : i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold text-sm ${active ? "text-deep-slate" : "text-deep-slate"}`}>{s.t}</p>
                      <p className="text-xs text-pebble-grey">{s.s}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Step body */}
        <div className="bg-white border border-pebble-grey/20 rounded-[24px] p-8 md:p-10 shadow-subtle space-y-6">
          {step === 0 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 1</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">Tell us who you are.</h2>
              </header>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Your name"><input className="field" value={form.fullName} onChange={(e) => set("fullName", e.target.value)}/></Field>
                <Field label="Phone"><input className="field" value={form.phone} onChange={(e) => set("phone", e.target.value)}/></Field>
                <Field label="Email" full><input className="field" value={form.email} onChange={(e) => set("email", e.target.value)}/></Field>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 2</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">About your business.</h2>
              </header>
              <Field label="Trading name"><input className="field" value={form.biz} onChange={(e) => set("biz", e.target.value)}/></Field>
              <div>
                <p className="text-xs font-bold text-deep-slate uppercase tracking-wider mb-2">Where do you groom?</p>
                <div className="grid sm:grid-cols-3 gap-2">
                  {[
                    { id: "mobile", t: "Mobile van",   d: "I come to them" },
                    { id: "studio", t: "Studio / salon",d: "They come to me" },
                    { id: "home",   t: "From home",    d: "Home setup" },
                  ].map(o => (
                    <button key={o.id} onClick={() => set("type", o.id)}
                      className={`text-left p-4 rounded-2xl border-2 transition-colors focus-ring ${form.type === o.id ? "bg-alabaster-cream border-deep-slate" : "bg-white border-pebble-grey/20 hover:border-deep-slate"}`}>
                      <p className="font-fredoka text-lg text-deep-slate">{o.t}</p>
                      <p className="text-xs text-pebble-grey">{o.d}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Base postcode"><input className="field" value={form.postcode} onChange={(e) => set("postcode", e.target.value)}/></Field>
                <Field label={`Radius — ${form.radius} miles`}>
                  <input type="range" min="1" max="20" value={form.radius} onChange={(e) => set("radius", +e.target.value)} className="w-full accent-groomr-gold h-2 mt-2"/>
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 3</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">Services & prices.</h2>
              </header>
              <p className="text-pebble-grey">Pick the services you offer. You can refine these later.</p>
              <div className="space-y-2">
                {[
                  { name: "Bath & Brush", priceKey: "priceBath" },
                  { name: "Full Groom",   priceKey: "priceFull" },
                  { name: "Hand-Strip",   priceKey: null },
                  { name: "Puppy First",  priceKey: null },
                  { name: "Nail Clip",    priceKey: null },
                ].map(s => {
                  const on = form.services.includes(s.name);
                  return (
                    <div key={s.name} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors ${on ? "bg-alabaster-cream border-deep-slate" : "bg-white border-pebble-grey/20"}`}>
                      <button onClick={() => set("services", on ? form.services.filter(x => x !== s.name) : [...form.services, s.name])}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors focus-ring ${on ? "bg-deep-slate border-deep-slate text-alabaster-cream" : "border-pebble-grey/40"}`}>
                        {on && <CheckIcon size={14}/>}
                      </button>
                      <p className="font-bold text-deep-slate flex-1">{s.name}</p>
                      {on && s.priceKey && (
                        <div className="flex items-center gap-2">
                          <span className="text-pebble-grey font-bold">£</span>
                          <input type="number" value={form[s.priceKey]} onChange={(e) => set(s.priceKey, +e.target.value)}
                            className="field w-24 text-right py-2"/>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 4</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">When are you working?</h2>
              </header>
              <div className="grid grid-cols-7 gap-2">
                {Object.keys(form.days).map(k => {
                  const on = form.days[k];
                  return (
                    <button key={k} onClick={() => set("days", { ...form.days, [k]: !on })}
                      className={`py-4 rounded-2xl border-2 font-fredoka text-deep-slate transition-colors focus-ring ${on ? "bg-groomr-gold border-groomr-gold" : "bg-white border-pebble-grey/20 hover:border-deep-slate text-pebble-grey"}`}>
                      {k.charAt(0).toUpperCase() + k.slice(1, 3)}
                    </button>
                  );
                })}
              </div>
              <Field label={`Lead time — ${form.lead}h notice`}>
                <input type="range" min="0" max="72" step="6" value={form.lead} onChange={(e) => set("lead", +e.target.value)}
                  className="w-full accent-groomr-gold h-2 mt-2"/>
              </Field>
              <div className="bg-alabaster-cream rounded-2xl p-5 border border-pebble-grey/15">
                <p className="text-xs font-bold uppercase tracking-wider text-sage-leaf mb-1">Tip</p>
                <p className="text-sm text-deep-slate">You can sync Google Calendar later so out-of-Groomr appointments block availability automatically.</p>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <header className="space-y-2">
                <Eyebrow>Step 5 — last one</Eyebrow>
                <h2 className="font-fredoka text-3xl text-deep-slate">Verify & get paid.</h2>
              </header>
              <div className="border border-pebble-grey/20 rounded-2xl p-5 flex items-center gap-4">
                <ShieldIcon size={32}/>
                <div className="flex-1">
                  <p className="font-bold text-deep-slate">Public liability insurance</p>
                  <p className="text-xs text-pebble-grey">Upload a certificate. Required for the verified badge.</p>
                </div>
                <button className="btn-secondary font-nunito font-bold px-4 py-2 rounded-full text-sm focus-ring flex items-center gap-2">
                  <UploadIcon size={14}/> Upload
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Sort code"><input className="field" value={form.sortCode} onChange={(e) => set("sortCode", e.target.value)}/></Field>
                <Field label="Account"><input className="field" value={form.account} onChange={(e) => set("account", e.target.value)}/></Field>
              </div>
              <div className="bg-deep-slate text-alabaster-cream rounded-2xl p-5">
                <p className="font-fredoka text-xl">You're ready.</p>
                <p className="text-sage-leaf text-sm mt-1">Hit launch and your profile goes live in your area within an hour.</p>
              </div>
            </>
          )}

          <div className="flex justify-between gap-4 pt-4 border-t border-pebble-grey/15">
            <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
              className="btn-secondary font-nunito font-bold px-6 py-3 rounded-full focus-ring disabled:opacity-40 disabled:cursor-not-allowed">
              Back
            </button>
            <button onClick={() => isLast ? onLaunch() : setStep(step + 1)}
              className="btn-primary font-nunito font-bold px-7 py-3 rounded-full focus-ring shadow-subtle">
              {isLast ? "Launch My Profile" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children, full }) => (
  <label className={`block ${full ? "md:col-span-2" : ""}`}>
    <span className="text-xs font-bold text-deep-slate uppercase tracking-wider block mb-2">{label}</span>
    {children}
  </label>
);

window.Register = Register;
