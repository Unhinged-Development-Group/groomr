// Footer — Deep Slate, 8px Groomr Gold top accent. Two variants: with CTA (marketing) and slim (logged-in pages).

const Footer = ({ withCta = true, onSignup }) => (
  <footer className="w-full bg-deep-slate text-alabaster-cream pt-12 pb-8 border-t-[8px] border-groomr-gold mt-auto">
    <div className="w-full px-6 lg:px-12 xl:px-20 space-y-12 text-center md:text-left">
      {withCta && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-4 max-w-sm">
              <h3 className="font-fredoka text-3xl">Ready to look your best?</h3>
              <p className="text-sage-leaf font-nunito">Join the community of dog owners choosing a better way to book.</p>
            </div>
            <button onClick={onSignup}
              className="btn-primary font-nunito font-bold px-8 py-3 rounded-full text-base inline-block focus-ring">
              Sign Up for Free
            </button>
          </div>
          <div className="h-px w-full bg-sage-leaf/40"></div>
        </>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <img src="../../assets/horizontal-lockup-groomr-gold.png" alt="Groomr"
             className="h-8 w-auto object-contain opacity-75"/>
        <div className="flex flex-wrap justify-center gap-6 text-sm font-bold tracking-wider uppercase text-sage-leaf">
          {["About","For Groomers","Privacy","Terms","Support"].map(l => (
            <a key={l} href="#" className="hover:text-groomr-gold transition-colors">{l}</a>
          ))}
        </div>
      </div>

      <p className="text-xs text-pebble-grey/50 text-center md:text-left pt-4">
        © 2026 Groomr. All rights reserved.
      </p>
    </div>
  </footer>
);

window.Footer = Footer;
