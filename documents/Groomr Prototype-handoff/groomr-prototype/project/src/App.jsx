// App — routing, auth state, tweaks panel, page composition.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "loggedIn": false,
  "showCustomerLanding": true,
  "ctaCopy": "Find Groomers",
  "headlineVariant": "regular"
}/*EDITMODE-END*/;

const HEADLINES = {
  regular:    "Your dog deserves a regular.",
  appointment:"Grooming, finally on your calendar.",
  routine:    "The end of forgetting to book."
};

function App() {
  const [route, setRoute] = React.useState("landing");
  const [groomer, setGroomer] = React.useState(null);
  const [service, setService] = React.useState(null);
  const [booking, setBooking] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [toast, setToast] = React.useState("");
  const [authModal, setAuthModal] = React.useState(null); // 'login' | 'signup'

  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    if (tw.loggedIn && !user) setUser({ name: "Anya Patel" });
    if (!tw.loggedIn && user) setUser(null);
  }, [tw.loggedIn]);

  const nav = (r) => { setRoute(r); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const onView = (g) => { setGroomer(g); nav("profile"); };
  const onBook = (g, s) => {
    if (!user) { setAuthModal("signup"); return; }
    setGroomer(g); setService(s); nav("booking");
  };
  const onConfirm = (b) => { setBooking(b); nav("confirmation"); };

  const onSearch = (q) => nav("search");
  const onSignup = () => setAuthModal("signup");
  const onLogin  = () => setAuthModal("login");
  const onLogout = () => { setUser(null); setTweak("loggedIn", false); nav("landing"); setToast("Logged out."); };

  const completeAuth = () => {
    setAuthModal(null);
    setUser({ name: "Anya Patel" });
    setTweak("loggedIn", true);
    setToast("Welcome to Groomr.");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} route={route} onNav={nav}
        onLogin={onLogin} onSignup={onSignup} onLogout={onLogout}/>

      <main className="flex-1">
        {route === "landing" && (
          <Landing
            onSearch={onSearch}
            onSignup={onSignup}
            onForGroomers={() => nav("for-groomers")}
          />
        )}
        {route === "search" && <SearchScreen initialQuery="Hackney" onView={onView}/>}
        {route === "profile" && <Profile groomer={groomer} onBook={onBook} onBack={() => nav("search")}/>}
        {route === "booking" && groomer && service && (
          <Booking groomer={groomer} service={service}
            onConfirm={onConfirm} onBack={() => nav("profile")}/>
        )}
        {route === "confirmation" && (
          <Confirmation booking={booking}
            onDashboard={() => { setTweak("loggedIn", true); nav("customer"); }}
            onHome={() => nav("landing")}/>
        )}
        {route === "customer" && user && (
          <CustomerDashboard user={user} onView={onView}
            onSearch={() => nav("search")}
            onBook={(g, s) => onBook(g, s)}/>
        )}
        {route === "for-groomers" && (
          <ForGroomers onRegister={() => nav("register")}/>
        )}
        {route === "register" && (
          <Register onLaunch={() => { setToast("Profile launched. You're live."); nav("for-groomers"); }}
            onBack={() => nav("for-groomers")}/>
        )}
      </main>

      <Footer onSignup={onSignup} withCta={route === "landing" || route === "for-groomers"}/>

      {/* Auth modal */}
      <Modal open={!!authModal} onClose={() => setAuthModal(null)}>
        <div className="space-y-5">
          <div>
            <Eyebrow>{authModal === "signup" ? "Create your account" : "Welcome back"}</Eyebrow>
            <h2 className="font-fredoka text-3xl text-deep-slate mt-2">
              {authModal === "signup" ? "Two clicks. One regular groomer." : "Log in to Groomr."}
            </h2>
          </div>
          <button onClick={completeAuth}
            className="w-full bg-white border-2 border-deep-slate text-deep-slate font-bold py-3 rounded-full hover:bg-deep-slate hover:text-alabaster-cream transition-colors focus-ring">
            Continue with Apple
          </button>
          <button onClick={completeAuth}
            className="w-full bg-white border-2 border-pebble-grey/30 text-deep-slate font-bold py-3 rounded-full hover:border-deep-slate transition-colors focus-ring">
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs text-pebble-grey font-bold">
            <span className="flex-1 h-px bg-pebble-grey/20"></span> OR <span className="flex-1 h-px bg-pebble-grey/20"></span>
          </div>
          <input className="field" placeholder="Email"/>
          <input className="field" placeholder="Password" type="password"/>
          <PrimaryButton className="w-full" onClick={completeAuth}>
            {authModal === "signup" ? "Create Account" : "Log In"}
          </PrimaryButton>
          <p className="text-xs text-pebble-grey text-center">
            {authModal === "signup" ? "Already have an account? " : "New to Groomr? "}
            <button onClick={() => setAuthModal(authModal === "signup" ? "login" : "signup")} className="font-bold text-deep-slate text-link">
              {authModal === "signup" ? "Log in" : "Sign up"}
            </button>
          </p>
        </div>
      </Modal>

      <Toast message={toast} onDismiss={() => setToast("")}/>

      {/* Tweaks panel */}
      <TweaksPanel>
        <TweakSection label="Demo state">
          <TweakToggle label="Logged in" value={tw.loggedIn}
            onChange={(v) => setTweak("loggedIn", v)}/>
        </TweakSection>
        <TweakSection label="Hero headline">
          <TweakRadio label="Variant" value={tw.headlineVariant}
            options={["regular", "appointment", "routine"]}
            onChange={(v) => setTweak("headlineVariant", v)}/>
        </TweakSection>
        <TweakSection label="Jump to screen">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "6px 12px 10px" }}>
            {[
              ["Landing","landing"],["Search","search"],
              ["Profile",() => onView(GROOMERS[0])],
              ["Booking",() => onBook(GROOMERS[0], GROOMERS[0].services[1])],
              ["Confirmation",() => { setGroomer(GROOMERS[0]); setService(GROOMERS[0].services[1]); setBooking({ groomer: GROOMERS[0], service: GROOMERS[0].services[1], day: { full: "Sat 23 May 2026", dow: "Sat" }, slot: "10:30", dog: DOGS[0], total: GROOMERS[0].services[1].price + 1.5 }); nav("confirmation"); }],
              ["Customer", () => { setUser({ name: "Anya Patel" }); setTweak("loggedIn", true); nav("customer"); }],
              ["For Groomers", "for-groomers"],
              ["Register",  "register"],
            ].map(([label, target]) => (
              <button key={label} onClick={() => typeof target === "string" ? nav(target) : target()}
                style={{ padding: "6px 10px", borderRadius: 8, background: "white", border: "1px solid rgba(149,165,166,.25)", fontSize: 12, fontWeight: 700, color: "#2c3e50", cursor: "pointer", textAlign: "left" }}>
                {label}
              </button>
            ))}
          </div>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
