// Groomer profile (public) — portrait + bio + reviews lead, booking lower.

function ProfileScreen() {
  const Reviews = ({ count = 3 }) => (
    <div className="col gap-3">
      {Array.from({length: count}).map((_, i) => (
        <Box key={i}>
          <div className="row middle gap-2">
            <Img round height={28} label="" />
            <div className="col">
              <span className="text-cv-sm">Sarah K.</span>
              <span className="text-faint">2 weeks ago &middot; Murphy &middot; chihuahua</span>
            </div>
            <span style={{ marginLeft: 'auto' }}><Star filled={5} /></span>
          </div>
          <Line /><Line short />
        </Box>
      ))}
    </div>
  );

  const ServiceList = () => (
    <Box>
      <div className="text-cv-sm" style={{ marginBottom: 4 }}>Services</div>
      {[
        ['Bath & Brush','from $45','45 min'],
        ['Full Groom','from $80','90 min'],
        ['Nail Trim','$15','15 min'],
      ].map((s,i) => (
        <div key={i} className="row between middle" style={{ padding: '6px 0', borderBottom: i<2?'1px dashed var(--rule)':'none' }}>
          <span className="text-hand-sm">{s[0]}</span>
          <span className="text-faint">{s[2]}</span>
          <span className="text-cv-sm">{s[1]}</span>
        </div>
      ))}
    </Box>
  );

  return (
    <>
      <ScreenHead
        num="03"
        title="Groomer Profile"
        desc="Portrait + bio + reviews up top. Booking panel sits lower or sticks to side."
      />

      <div className="variations cols-3">
        <Variation num="A" title="Bio-led, sticky book panel" tag="Default">
          <Browser url="groomr.com/g/lola-clip-co">
            <SiteHeader context="user" />
            <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1.6 }}>
                <div className="row gap-3 middle">
                  <Img round height={70} label="" />
                  <div className="col">
                    <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 30 }}>Lola's Clip Co.</div>
                    <div className="text-soft">Park Slope &middot; Independent groomer since 2019</div>
                    <div className="row gap-2 middle"><Star filled={5} /><span className="text-faint">4.9 (132 reviews)</span></div>
                  </div>
                </div>
                <SecLabel>About</SecLabel>
                <Line dark /><Line dark /><Line short dark /><Line />
                <SecLabel>Photos of her work</SecLabel>
                <div className="row gap-2">
                  {[1,2,3,4].map(i => <Img key={i} height={70} label="" style={{ flex: 1 }} />)}
                </div>
                <SecLabel>Reviews (132)</SecLabel>
                <Reviews count={3} />
                <Btn style={{ marginTop: 8 }}>See all reviews</Btn>
              </div>

              <div style={{ flex: 1, position: 'sticky', top: 0 }}>
                <Box fill="paper2">
                  <div className="text-cv-sm">Book a groom</div>
                  <Box dashed style={{ marginTop: 6 }}><span className="text-faint">Pick a service ▾</span></Box>
                  <Box dashed style={{ marginTop: 6 }}><span className="text-faint">Pick a date ▾</span></Box>
                  <div className="text-soft" style={{ marginTop: 6 }}>Next available: Sat 22 May, 10am</div>
                  <Btn variant="primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>Check Availability</Btn>
                  <div className="text-faint" style={{ marginTop: 6, textAlign: 'center' }}>Cancel free up to 24h before</div>
                </Box>
                <Note tilt="r" top={-12} right={-12}>Sticky on scroll. Always visible.</Note>
                <ServiceList />
              </div>
            </div>
          </Browser>
        </Variation>

        <Variation num="B" title="Photo-strip hero" tag="Visual">
          <Browser url="groomr.com/g/lola-clip-co">
            <SiteHeader context="user" />
            <div className="row gap-1" style={{ marginBottom: 8 }}>
              <Img height={140} label="hero" style={{ flex: 2 }} />
              <div className="col gap-1" style={{ flex: 1 }}>
                <Img height={66} label="" /><Img height={66} label="" />
              </div>
            </div>
            <div className="row between middle">
              <div>
                <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 30 }}>Lola's Clip Co.</div>
                <div className="text-soft">Park Slope &middot; Independent</div>
              </div>
              <div className="row gap-2">
                <Btn>♡ Save</Btn>
                <Btn variant="primary">Book Now</Btn>
              </div>
            </div>
            <div className="row gap-2 middle" style={{ marginTop: 4 }}>
              <Star filled={5} /><span className="text-faint">4.9 (132)</span>
              <Chip sage>Verified</Chip><Chip sage>Anxious dogs ok</Chip>
            </div>
            <div className="scribble-divider" />
            <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1.4 }}>
                <SecLabel>About Lola</SecLabel>
                <Line dark /><Line /><Line short />
                <SecLabel>Reviews</SecLabel>
                <Reviews count={2} />
              </div>
              <div style={{ flex: 1 }}>
                <ServiceList />
                <Note tilt="l" top={-14} left={-12}>Booking lives behind big yellow CTA up top</Note>
              </div>
            </div>
          </Browser>
        </Variation>

        <Variation num="C" title="Tabbed deep-dive" tag="Info-dense">
          <Browser url="groomr.com/g/lola-clip-co">
            <SiteHeader context="user" />
            <div className="row gap-3 middle">
              <Img round height={60} label="" />
              <div className="col grow">
                <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 26 }}>Lola's Clip Co.</div>
                <div className="row middle gap-2"><Star filled={5} /><span className="text-faint">4.9 (132)</span></div>
              </div>
              <Btn variant="primary">Book</Btn>
            </div>
            <div className="row gap-2" style={{ marginTop: 10, borderBottom: '1.5px solid var(--ink)', paddingBottom: 4 }}>
              <Chip active>About</Chip><Chip>Services &amp; pricing</Chip><Chip>Reviews (132)</Chip><Chip>Photos</Chip><Chip>Policies</Chip>
            </div>
            <SecLabel>About</SecLabel>
            <Line dark /><Line /><Line short />
            <SecLabel>Quick stats</SecLabel>
            <div className="row gap-2">
              {[['8 yrs','Experience'],['Cert.','Pet First Aid'],['12','Repeat clients/wk']].map((s,i) => (
                <Box key={i} fill="gold-soft" style={{ flex: 1, textAlign: 'center' }}>
                  <div className="text-cv">{s[0]}</div>
                  <div className="text-faint">{s[1]}</div>
                </Box>
              ))}
            </div>
            <SecLabel>Recent reviews</SecLabel>
            <Reviews count={2} />
            <Note tilt="r" top={140} right={-10}>Best for groomers with a lot to say. Heavy.</Note>
          </Browser>
        </Variation>
      </div>

      <div style={{ marginTop: 36 }}>
        <div className="text-eye" style={{ marginBottom: 10 }}>Mobile — variation A (sticky bottom CTA)</div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Phone url="groomr.com/g/lola-clip-co">
            <SiteHeaderMobile context="user" />
            <Img height={120} label="hero" />
            <div className="row middle gap-2" style={{ marginTop: 6 }}>
              <Img round height={40} label="" />
              <div className="col">
                <span className="text-cv-sm">Lola's Clip Co.</span>
                <div className="row middle gap-2"><Star filled={5} /><span className="text-faint">4.9</span></div>
              </div>
            </div>
            <SecLabel>About</SecLabel>
            <Line dark /><Line short />
            <SecLabel>Reviews</SecLabel>
            <Reviews count={1} />
            <div style={{
              position: 'sticky', bottom: -14,
              padding: 10, marginTop: 12,
              borderTop: '1.5px dashed var(--rule)',
              background: 'var(--paper)',
            }}>
              <Btn variant="primary" style={{ width: '100%', justifyContent: 'center' }}>Book a groom</Btn>
            </div>
            <Note tilt="r" top={50} right={-30}>Bottom-bar CTA stays put while scrolling</Note>
          </Phone>

          <div style={{ flex: 1, minWidth: 280 }}>
            <Box fill="note">
              <div className="text-cv-sm" style={{ marginBottom: 6 }}>Notes for groomer profile</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontFamily: 'Kalam', fontSize: 13, lineHeight: 1.5 }}>
                <li>Photos = the most-touched element. Carousel + lightbox on click.</li>
                <li>Show "next available" prominently — solves the "is this vapourware?" worry.</li>
                <li>Review filters: by dog breed, by service, with photos.</li>
                <li>Empty state: groomer with 0 reviews shows a "New on Groomr" badge — not a skeleton.</li>
              </ul>
            </Box>
          </div>
        </div>
      </div>
    </>
  );
}

window.ProfileScreen = ProfileScreen;
