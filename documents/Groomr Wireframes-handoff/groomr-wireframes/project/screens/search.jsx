// Search results — 3 variations, all "list-first, map collapsible" with filter chips on top.

function SearchScreen() {
  const FilterBar = () => (
    <div className="row gap-2 wrap" style={{ marginBottom: 8 }}>
      <Box dashed style={{ padding: '4px 10px' }} className="row middle gap-2">
        <span className="text-faint">📍</span><span className="text-hand-sm">Brooklyn, NY</span>
      </Box>
      <Box dashed style={{ padding: '4px 10px' }} className="row middle gap-2">
        <span className="text-faint">📅</span><span className="text-hand-sm">Anytime</span>
      </Box>
      <Chip active>Bath &amp; Brush</Chip>
      <Chip>Full groom</Chip>
      <Chip>Nail trim</Chip>
      <Chip sage>★ 4.5+</Chip>
      <Chip>$ Price</Chip>
      <Chip>Filters +</Chip>
    </div>
  );

  const ResultRow = ({ tall }) => (
    <Box className="row gap-3" style={{ marginBottom: 8 }}>
      <Img height={tall ? 84 : 60} label="" style={{ width: tall ? 110 : 80, flexShrink: 0 }} />
      <div className="col grow" style={{ gap: 4 }}>
        <div className="row between middle">
          <Head short />
          <span className="text-hand-sm">$45+</span>
        </div>
        <div className="row middle gap-2">
          <Star filled={5} /><span className="text-faint">4.9 (132) &middot; 0.4 mi</span>
        </div>
        <Line />
        <Line short />
        <div className="row gap-2" style={{ marginTop: 2 }}>
          <Chip sage>Next: Sat 10am</Chip>
          <Chip>Bath &amp; Brush</Chip>
        </div>
      </div>
      <div className="col end" style={{ justifyContent: 'space-between' }}>
        <span className="text-faint">♡</span>
        <Btn size="sm" variant="primary">Book</Btn>
      </div>
    </Box>
  );

  return (
    <>
      <ScreenHead
        num="02"
        title="Search Results"
        desc="List-first with filter chips on top. Map collapses on smaller viewports. Three takes on density + map prominence."
      />

      <div className="variations cols-3">
        <Variation num="A" title="List + slim map rail" tag="Default">
          <Browser url="groomr.com/search?loc=brooklyn">
            <SiteHeader />
            <FilterBar />
            <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1.5 }}>
                <div className="text-soft" style={{ marginBottom: 6 }}>
                  <b>24 groomers</b> near Brooklyn, NY &middot; sorted by Recommended ▾
                </div>
                {[1,2,3].map(i => <ResultRow key={i} />)}
              </div>
              <div style={{ flex: 1, position: 'sticky', top: 0 }}>
                <Box fill="sage-soft" style={{ padding: 0, height: 240, position: 'relative', overflow: 'hidden' }}>
                  <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <path d="M0,80 Q60,60 120,90 T200,80" stroke="#2c3e50" strokeWidth=".8" fill="none" opacity=".5" />
                    <path d="M40,0 L40,200 M120,0 L120,200" stroke="#2c3e50" strokeWidth=".5" opacity=".3" strokeDasharray="3,3" />
                    {[[60,70],[110,110],[150,60],[80,140],[170,150]].map((p,i) => (
                      <g key={i}><circle cx={p[0]} cy={p[1]} r="8" fill="#eae45c" stroke="#2c3e50" strokeWidth="1.2" /></g>
                    ))}
                  </svg>
                  <Note tilt="r" top={-12} right={-8}>Hover a result → pin highlights</Note>
                </Box>
                <Btn size="sm" style={{ marginTop: 6 }}>Hide map</Btn>
              </div>
            </div>
          </Browser>
        </Variation>

        <Variation num="B" title="Full-width list, map below" tag="Mobile-friendly">
          <Browser url="groomr.com/search">
            <SiteHeader />
            <FilterBar />
            <div className="row between middle" style={{ marginBottom: 6 }}>
              <span className="text-soft"><b>24 groomers</b> &middot; Sat–Sun availability</span>
              <span className="row gap-2 middle">
                <Btn size="sm">≡ List</Btn>
                <Btn size="sm" variant="ghost">⌖ Map</Btn>
              </span>
            </div>
            {[1,2,3,4].map(i => <ResultRow key={i} tall />)}
            <Box dashed style={{ textAlign: 'center', padding: 12 }} fill="paper2">
              <span className="text-hand">⌖ Show map of these results</span>
            </Box>
            <Note tilt="l" top={150} left={-20}>Filter chips wrap to a 2nd row when many active</Note>
          </Browser>
        </Variation>

        <Variation num="C" title="Editorial — curated lists" tag="Novel">
          <Browser url="groomr.com/search">
            <SiteHeader />
            <FilterBar />
            <Box fill="gold-soft" style={{ marginBottom: 10 }}>
              <div className="text-cv">Best for nervous dogs in Brooklyn</div>
              <div className="text-soft">Curated by Groomr — 6 groomers known for patience.</div>
            </Box>
            {[1,2].map(i => <ResultRow key={i} />)}
            <div className="scribble-divider" />
            <Box fill="sage-soft">
              <div className="text-cv-sm">All groomers, by distance</div>
            </Box>
            {[1,2].map(i => <ResultRow key={'b'+i} />)}
            <Note tilt="r" top={-10} right={-14}>Lists collapse like Spotify playlists. Editorial moments.</Note>
          </Browser>
        </Variation>
      </div>

      <div style={{ marginTop: 36 }}>
        <div className="text-eye" style={{ marginBottom: 10 }}>Mobile — list with bottom-sheet map</div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Phone url="groomr.com/search">
            <SiteHeaderMobile />
            <div className="row gap-2 wrap" style={{ marginBottom: 6 }}>
              <Chip active>Brooklyn</Chip>
              <Chip>Bath</Chip>
              <Chip>★ 4.5+</Chip>
              <Chip>+ filters</Chip>
            </div>
            {[1,2,3].map(i => (
              <Box key={i} className="row gap-2" style={{ marginBottom: 6 }}>
                <Img height={50} label="" style={{ width: 50, flexShrink: 0 }} />
                <div className="col grow" style={{ gap: 2 }}>
                  <Head short /><Line short />
                  <div className="row gap-2"><Star filled={5} /><span className="text-faint">$45</span></div>
                </div>
              </Box>
            ))}
            <Box fill="gold" style={{ position: 'relative', marginTop: 4, padding: '6px 10px', textAlign: 'center' }}>
              <span className="text-cv-sm">⌖ Map (12)</span>
            </Box>
          </Phone>

          <div style={{ flex: 1, minWidth: 280 }}>
            <Box fill="note">
              <div className="text-cv-sm" style={{ marginBottom: 6 }}>Notes for search</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontFamily: 'Kalam', fontSize: 13, lineHeight: 1.5 }}>
                <li>"Recommended" = trust score × distance × availability for the user's dog.</li>
                <li>Pin hover ↔ list highlight is bidirectional.</li>
                <li>Empty state: "No groomers nearby. Want us to email you when one joins?"</li>
                <li>Filter chips persist in URL so results are shareable.</li>
              </ul>
            </Box>
          </div>
        </div>
      </div>
    </>
  );
}

window.SearchScreen = SearchScreen;
