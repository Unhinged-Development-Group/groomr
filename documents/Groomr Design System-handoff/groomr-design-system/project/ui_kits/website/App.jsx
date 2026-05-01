// Top-level App: routes between Landing / Search / Dashboard. Modals for login + booking.

const App = () => {
  const [route, setRoute] = React.useState("landing"); // landing | search | dashboard
  const [query, setQuery] = React.useState("E8 3RH, Hackney");
  const [user, setUser] = React.useState(null);
  const [showLogin, setShowLogin] = React.useState(false);
  const [bookingFor, setBookingFor] = React.useState(null);
  const [confirmation, setConfirmation] = React.useState(null);

  const goLanding   = () => setRoute("landing");
  const goSearch    = (q) => { if (q) setQuery(q); setRoute("search"); };
  const goDashboard = () => setRoute("dashboard");

  const handleLogin = () => {
    setUser({ name: "Priya", firstName: "Priya" });
    setShowLogin(false);
    goDashboard();
  };
  const handleSignup = () => setShowLogin(true);
  const handleLogout = () => { setUser(null); goLanding(); };

  return (
    <div className="min-h-screen flex flex-col font-nunito text-deep-slate bg-alabaster-cream">
      <Header user={user}
        onLogin={() => setShowLogin(true)}
        onSignup={handleSignup}
        onLogout={handleLogout}
        onLogoClick={() => user ? goDashboard() : goLanding()}/>

      {route === "landing"   && <LandingScreen onSearch={goSearch} onSignup={handleSignup}/>}
      {route === "search"    && <SearchScreen  query={query} onSelectGroomer={setBookingFor}/>}
      {route === "dashboard" && user && <DashboardScreen user={user} onSearch={goSearch} onAddDog={() => {}}/>}

      <Footer withCta={route === "landing"} onSignup={handleSignup}/>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} onSubmit={handleLogin}/>
      <BookingModal open={!!bookingFor} onClose={() => setBookingFor(null)} groomer={bookingFor}
                    onConfirm={(b) => { setBookingFor(null); setConfirmation(b); if (!user) setUser({ name: "Priya", firstName: "Priya" }); }}/>
      <ConfirmationModal open={!!confirmation} onClose={() => { setConfirmation(null); goDashboard(); }} booking={confirmation}/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
