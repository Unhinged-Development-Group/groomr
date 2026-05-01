// Header — sticky cream nav with logged-out / logged-in states.

const Header = ({ user, route, onNav, onLogin, onSignup, onLogout }) => {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onClick = () => setOpen(false);
    setTimeout(() => window.addEventListener("click", onClick), 0);
    return () => window.removeEventListener("click", onClick);
  }, [open]);

  return (
    <header className="w-full bg-alabaster-cream/95 backdrop-blur border-b border-pebble-grey/20 sticky top-0 z-40">
      <div className="w-full px-6 lg:px-12 xl:px-20 py-4 flex justify-between items-center gap-4">
        <button onClick={() => onNav("landing")} className="focus-ring rounded-lg inline-block shrink-0">
          <img src="assets/horizontal-lockup-deep-slate.png" alt="Groomr" className="h-8 md:h-10 w-auto object-contain"/>
        </button>

        {!user && (
          <div className="hidden md:flex items-center gap-4">
            <button onClick={onLogin}
              className="font-nunito font-bold text-deep-slate text-link focus-ring rounded px-2 py-1">
              Log In
            </button>
            <button onClick={onSignup}
              className="btn-primary font-nunito font-bold px-6 py-2.5 rounded-full text-sm focus-ring">
              Sign Up
            </button>
          </div>
        )}

        {user && (
          <div className="flex items-center gap-4">
            <button className="hidden md:inline-flex font-nunito font-bold text-deep-slate text-link focus-ring rounded px-2 py-1 relative">
              Messages
              <span className="absolute top-0 -right-1 w-2 h-2 bg-muted-terracotta rounded-full"></span>
            </button>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setOpen(!open)}
                className="flex items-center gap-2 focus-ring rounded-full pl-1.5 pr-3 py-1.5 border border-pebble-grey/20 hover:bg-white transition-colors">
                <div className="w-8 h-8 bg-sage-leaf text-white rounded-full flex items-center justify-center font-bold font-fredoka text-sm shadow-subtle">
                  {user.name.charAt(0)}
                </div>
                <span className="hidden sm:inline font-nunito font-bold text-sm text-deep-slate">{user.name}</span>
                <ChevronIcon size={14}/>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-pebble-grey/20 rounded-xl shadow-modal z-50 overflow-hidden">
                  <button onClick={() => { onNav("customer"); setOpen(false); }}
                    className="w-full text-left block px-4 py-3 text-sm font-bold text-deep-slate hover:bg-alabaster-cream transition-colors">
                    My Dashboard
                  </button>
                  <button className="w-full text-left block px-4 py-3 text-sm font-bold text-deep-slate hover:bg-alabaster-cream transition-colors">Settings</button>
                  <div className="border-t border-pebble-grey/10"></div>
                  <button onClick={() => { onLogout(); setOpen(false); }}
                    className="w-full text-left block px-4 py-3 text-sm font-bold text-muted-terracotta hover:bg-alabaster-cream transition-colors">
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

window.Header = Header;
