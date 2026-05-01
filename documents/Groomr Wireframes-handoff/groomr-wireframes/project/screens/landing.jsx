// Landing page — 3 desktop variations + 1 mobile variation.

function LandingScreen() {
  return (
    <>
      <ScreenHead
        num="01"
        title="Landing Page"
        desc="First impression. Three takes on hero + search prominence, plus a mobile sketch."
      />

      <div className="variations cols-3">
        <Variation num="A" title="Search-first hero" tag="Safe / Airbnb-ish">
          <Browser url="groomr.com">
            <SiteHeader />
            <SecLabel>Hero — large headline + inline search</SecLabel>
            <Box style={{ padding: 18, position: 'relative' }} fill="paper2">
              <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 30, lineHeight: 1.1 }}>
                Find a Local Groomer
              </div>
              <div className="text-hand" style={{ marginTop: 4, marginBottom: 12 }}>
                Real availability, instant booking — no phone tag.
              </div>
              {/* Search pill */}
              <div className="row middle" style={{
                gap: 0, border: '1.6px solid var(--ink)', borderRadius: 999, padding: 4,
                background: 'var(--paper)',
              }}>
                <div className="col" style={{ flex: 1, padding: '4px 14px', borderRight: '1px dashed var(--rule)' }}>
                  <div className="text-eye">Where</div>
                  <div className="text-hand-sm">Brooklyn, NY</div>
                </div>
                <div className="col" style={{ flex: 1, padding: '4px 14px', borderRight: '1px dashed var(--rule)' }}>
                  <div className="text-eye">When</div>
                  <div className="text-hand-sm">Any day</div>
                </div>
                <div className="col" style={{ flex: 1, padding: '4px 14px' }}>
                  <div className="text-eye">Dog</div>
                  <div className="text-hand-sm">Murphy &middot; chihuahua</div>
                </div>
                <Btn variant="primary">Search</Btn>
              </div>
              <Note tilt="r" top={-14} right={-12}>Single search bar — easy mental model</Note>
            </Box>

            <SecLabel>Featured groomers (3-up)</SecLabel>
            <div className="row gap-3">
              {[1,2,3].map(i => (
                <Box key={i} style={{ flex: 1 }}>
                  <Img height={70} label="groomer" />
                  <Head short />
                  <Line short />
                  <div className="row middle gap-2" style={{ marginTop: 4 }}>
                    <Star filled={5} /><span className="text-faint">4.9 (132)</span>
                  </div>
                </Box>
              ))}
            </div>

            <SecLabel>How it works</SecLabel>
            <div className="row gap-3">
              {['Search','Pick a groomer','Book in seconds'].map((s,i) => (
                <Box key={i} style={{ flex: 1, textAlign: 'center' }} fill="gold-soft">
                  <div className="text-cv-sm">{i+1}. {s}</div>
                </Box>
              ))}
            </div>

            <SecLabel>Tagline moment + footer</SecLabel>
            <Box fill="paper2" style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 18, textAlign: 'center' }}>
              <span style={{ fontFamily: 'Kalam', fontStyle: 'italic', fontWeight: 700, fontSize: 18, color: 'var(--paper)' }}>
                "Your dog deserves a regular."
              </span>
            </Box>
          </Browser>
        </Variation>

        <Variation num="B" title="Story-first hero" tag="Editorial">
          <Browser url="groomr.com">
            <SiteHeader />
            <SecLabel>Hero — big photo + headline, search lives in nav</SecLabel>
            <div style={{ position: 'relative' }}>
              <Img height={180} label="hero photo — dog at the groomer" />
              <div style={{
                position: 'absolute', left: 18, bottom: 14, right: 18,
                fontFamily: 'Caveat', fontWeight: 700, fontSize: 32, color: 'var(--paper)',
                textShadow: '0 2px 8px rgba(0,0,0,.4)',
              }}>
                Find Murphy his next favourite groomer.
              </div>
              <Note tilt="l" top={20} right={-18}>Brand-led. Search moves up to nav.</Note>
            </div>
            <Box style={{ marginTop: 12 }}>
              <div className="row middle gap-2">
                <Box dashed style={{ padding: '6px 12px', flex: 1 }}><span className="text-faint">📍 Where do you live?</span></Box>
                <Btn variant="primary">Search</Btn>
              </div>
            </Box>

            <SecLabel>Why Groomr (3 pillars w/ icons)</SecLabel>
            <div className="row gap-3">
              {[
                {t:'Verified groomers', s:'Hand-picked by us'},
                {t:'Real availability', s:'See open slots, book instantly'},
                {t:'Independent local', s:'Champion small businesses'},
              ].map((p,i) => (
                <Box key={i} style={{ flex: 1 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
                    border: '1.5px solid var(--ink)', marginBottom: 8,
                  }} />
                  <div className="text-cv-sm">{p.t}</div>
                  <div className="text-soft">{p.s}</div>
                </Box>
              ))}
            </div>

            <SecLabel>Owner stories (carousel)</SecLabel>
            <Box style={{ display: 'flex', gap: 10 }}>
              <Img height={90} label="dog 1" style={{ flex: 1 }} />
              <Img height={90} label="dog 2" style={{ flex: 1 }} />
              <Img height={90} label="dog 3" style={{ flex: 1 }} />
              <div className="text-cv-sm" style={{ alignSelf: 'center' }}>›</div>
            </Box>

            <SecLabel>Are you a groomer? CTA strip</SecLabel>
            <Box fill="terra-soft" className="row between middle">
              <div>
                <div className="text-cv-sm">Are you a groomer?</div>
                <div className="text-soft">Join 2,400+ pros taking bookings on Groomr.</div>
              </div>
              <Btn variant="primary">List Your Business</Btn>
            </Box>
          </Browser>
        </Variation>

        <Variation num="C" title="Map-anchored" tag="Local-first">
          <Browser url="groomr.com">
            <SiteHeader />
            <SecLabel>Hero — city map with pinned groomers</SecLabel>
            <div style={{ position: 'relative' }}>
              <Box style={{ padding: 0, height: 200, position: 'relative', overflow: 'hidden' }} fill="sage-soft">
                {/* Map mock */}
                <svg viewBox="0 0 300 120" style={{ width: '100%', height: '100%', display: 'block' }}>
                  <path d="M0,40 Q70,30 140,55 T300,40" stroke="#2c3e50" strokeWidth="1" fill="none" opacity=".5" />
                  <path d="M30,90 Q120,70 200,85 T300,80" stroke="#2c3e50" strokeWidth="1" fill="none" opacity=".5" />
                  <path d="M80,0 L80,120" stroke="#2c3e50" strokeWidth=".5" opacity=".4" strokeDasharray="3,3" />
                  <path d="M180,0 L180,120" stroke="#2c3e50" strokeWidth=".5" opacity=".4" strokeDasharray="3,3" />
                  {[[60,40,'£'],[120,70,'£'],[180,30,'£'],[230,80,'£'],[100,95,'£']].map((p,i) => (
                    <g key={i} transform={`translate(${p[0]},${p[1]})`}>
                      <circle r="9" fill="#eae45c" stroke="#2c3e50" strokeWidth="1.4" />
                      <text fontFamily="Kalam" fontSize="10" textAnchor="middle" y="3">{p[2]}</text>
                    </g>
                  ))}
                </svg>
                <div style={{
                  position: 'absolute', top: 14, left: 14, right: 14,
                }}>
                  <Box fill="paper2" className="row middle" style={{ padding: 6 }}>
                    <span className="text-hand-sm" style={{ flex: 1 }}>📍 Find groomers near…  Brooklyn, NY</span>
                    <Btn variant="primary" size="sm">Use my location</Btn>
                  </Box>
                </div>
                <Note tilt="r" bottom={-14} right={-10}>Map = the brand. "Local" baked in visually.</Note>
              </Box>
              <div style={{ fontFamily: 'Caveat', fontSize: 28, fontWeight: 700, marginTop: 12 }}>
                12 trusted groomers within 2 miles.
              </div>
            </div>

            <SecLabel>Top-rated nearby</SecLabel>
            <div className="row gap-3">
              {[1,2].map(i => (
                <Box key={i} style={{ flex: 1 }} className="row gap-3">
                  <Img round height={50} label="" />
                  <div className="col grow gap-2">
                    <Head short />
                    <div className="row middle gap-2"><Star filled={5} /><span className="text-faint">0.4 mi</span></div>
                    <Line short />
                  </div>
                </Box>
              ))}
            </div>

            <SecLabel>Testimonial + tagline</SecLabel>
            <Box fill="gold-soft">
              <div className="text-cv">"Booking Murphy's groom used to ruin my Sunday."</div>
              <div className="text-soft">— Sarah, Park Slope</div>
            </Box>
          </Browser>
        </Variation>
      </div>

      <div style={{ marginTop: 36 }}>
        <div className="text-eye" style={{ marginBottom: 10 }}>Mobile — variation A (search-first)</div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Phone url="m.groomr.com">
            <SiteHeaderMobile />
            <Box fill="paper2" style={{ marginTop: 8, position: 'relative' }}>
              <div className="text-cv">Find a Local Groomer</div>
              <div className="text-soft">Real availability, instant booking.</div>
              <Box dashed style={{ marginTop: 8 }}>
                <span className="text-faint">📍 Where?</span>
              </Box>
              <Box dashed style={{ marginTop: 6 }}>
                <span className="text-faint">📅 When?</span>
              </Box>
              <Btn variant="primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>Search</Btn>
            </Box>
            <SecLabel>Featured</SecLabel>
            {[1,2].map(i => (
              <Box key={i} className="row gap-3" style={{ marginBottom: 6 }}>
                <Img round height={36} label="" />
                <div className="col grow"><Head short /><div className="row gap-2"><Star filled={5} /></div></div>
              </Box>
            ))}
            <Box fill="terra-soft" style={{ marginTop: 8, textAlign: 'center' }}>
              <span className="text-cv-sm">Are you a groomer?</span>
            </Box>
            <Note tilt="r" top={120} right={-30}>Single column, sticky search at top once scrolled</Note>
          </Phone>

          <div style={{ flex: 1, minWidth: 280 }}>
            <Box fill="note">
              <div className="text-cv-sm" style={{ marginBottom: 6 }}>Notes for landing page</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontFamily: 'Kalam', fontSize: 13, lineHeight: 1.5 }}>
                <li>Hero search must be obvious within 1 second of landing.</li>
                <li>Tagline <em>"Your dog deserves a regular."</em> appears once — at footer or in a dark Deep Slate band.</li>
                <li>Footer carries the 8px Groomr Gold accent border per brand.</li>
                <li>Variation B's editorial hero is most "on-brand" but adds friction to the search action — consider as a B test against A.</li>
                <li>Variation C is great for high-density urban markets but breaks for rural users on launch.</li>
              </ul>
            </Box>
          </div>
        </div>
      </div>
    </>
  );
}

window.LandingScreen = LandingScreen;
