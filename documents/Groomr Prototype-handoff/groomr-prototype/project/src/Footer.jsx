// Footer — Deep Slate with 8px Groomr Gold top accent.

const Footer = ({ withCta = true, onSignup }) => (
  <footer className="w-full bg-deep-slate text-alabaster-cream pt-12 pb-8 border-t-[8px] border-groomr-gold mt-auto">
    <div className="w-full px-6 lg:px-12 xl:px-20 space-y-10 text-center md:text-left">
      {withCta && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-3 max-w-md">
              <h3 className="font-fredoka text-3xl">Ready when you are.</h3>
              <p className="text-sage-leaf font-nunito">
                <span className="tagline text-sage-leaf">"Your dog deserves a regular."</span>
              </p>
            </div>
            <button onClick={onSignup}
              className="btn-gold-on-dark font-nunito font-bold px-8 py-3 rounded-full text-base focus-ring shadow-subtle">
              Sign Up for Free
            </button>
          </div>
          <div className="h-px w-full bg-sage-leaf/40"></div>
        </>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <img src="assets/horizontal-lockup-groomr-gold.png" alt="Groomr" className="h-8 w-auto object-contain opacity-90"/>
        <div className="flex flex-wrap justify-center gap-6 text-sm font-bold tracking-[0.1em] uppercase text-sage-leaf">
          {["About", "For Groomers", "Privacy", "Terms", "Support"].map(l => (
            <a key={l} href="#" className="hover:text-groomr-gold transition-colors">{l}</a>
          ))}
        </div>
      </div>

      <p className="text-xs text-pebble-grey/60 text-center md:text-left pt-4">© 2026 Groomr. All rights reserved.</p>
    </div>
  </footer>
);

window.Footer = Footer;
