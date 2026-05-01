// Header — sticky cream nav. Two states: logged-out (Log In + Sign Up CTA) and logged-in (Messages + avatar dropdown).

const Header = ({ user, onLogin, onSignup, onLogout, onLogoClick }) => (
  <header className="w-full bg-alabaster-cream border-b border-pebble-grey/20 sticky top-0 z-40">
    <div className="w-full px-6 lg:px-12 xl:px-20 py-4 flex justify-between items-center">
      <button onClick={onLogoClick} className="focus-ring rounded-lg inline-block">
        <img src="../../assets/horizontal-lockup-deep-slate.png" alt="Groomr"
             className="h-8 md:h-10 w-auto object-contain"/>
      </button>

      {!user && (
        <div className="hidden md:flex items-center space-x-6">
          <button onClick={onLogin}
            className="font-nunito font-bold text-deep-slate hover:text-muted-terracotta transition-colors focus-ring rounded px-2 py-1">
            Log In
          </button>
          <button onClick={onSignup}
            className="btn-primary font-nunito font-bold px-6 py-2.5 rounded-full text-sm focus-ring">
            Sign Up
          </button>
        </div>
      )}

      {user && (
        <div className="flex items-center space-x-6">
          <button className="hidden md:inline-flex font-nunito font-bold text-deep-slate hover:text-muted-terracotta transition-colors focus-ring rounded px-2 py-1 relative">
            Messages
            <span className="absolute top-1 -right-1.5 w-2 h-2 bg-muted-terracotta rounded-full"></span>
          </button>
          <div className="relative group cursor-pointer">
            <button className="flex items-center gap-3 focus-ring rounded-full pl-2 pr-4 py-1.5 border border-pebble-grey/20 hover:bg-white transition-colors">
              <div className="w-8 h-8 bg-sage-leaf text-white rounded-full flex items-center justify-center font-bold font-fredoka shadow-sm">
                {user.name.charAt(0)}
              </div>
              <span className="font-nunito font-bold text-sm text-deep-slate">{user.name}</span>
              <ChevronIcon size={14}/>
            </button>
            <div className="absolute right-0 mt-2 w-44 bg-white border border-pebble-grey/20 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
              <button className="w-full text-left block px-4 py-3 text-sm font-bold text-deep-slate hover:bg-alabaster-cream transition-colors">My Profile</button>
              <button className="w-full text-left block px-4 py-3 text-sm font-bold text-deep-slate hover:bg-alabaster-cream transition-colors">Settings</button>
              <div className="border-t border-pebble-grey/10"></div>
              <button onClick={onLogout} className="w-full text-left block px-4 py-3 text-sm font-bold text-muted-terracotta hover:bg-alabaster-cream transition-colors">Log Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </header>
);

window.Header = Header;
