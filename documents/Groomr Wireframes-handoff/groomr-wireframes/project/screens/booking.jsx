// Booking flow — the core conversion path. Step-based.

function BookingScreen() {
  const Steps = ({ at }) => (
    <div className="row middle gap-2" style={{ marginBottom: 10 }}>
      {['Service','Date & time','Your details','Confirm'].map((s,i) => (
        <React.Fragment key={i}>
          <div className="row middle gap-2">
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              border: '1.5px solid var(--ink)',
              background: i <= at ? 'var(--accent)' : 'var(--paper)',
              fontFamily: 'Architects Daughter', fontSize: 12, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>{i+1}</span>
            <span className="text-hand-sm" style={{ color: i === at ? 'var(--ink)' : 'var(--ink-faint)', fontWeight: i === at ? 700 : 400 }}>{s}</span>
          </div>
          {i < 3 && <span style={{ color: 'var(--ink-faint)' }}>—</span>}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <>
      <ScreenHead
        num="04"
        title="Booking Flow"
        desc="Service → date/time → details → confirm. Three takes on flow density and side-panel summary."
      />

      <div className="variations cols-3">
        <Variation num="A" title="Step-by-step pages" tag="Linear">
          <Browser url="groomr.com/g/lola-clip-co/book?step=2">
            <SiteHeader context="user" />
            <div className="row middle gap-2" style={{ marginBottom: 6 }}>
              <Img round height={28} label="" />
              <span className="text-cv-sm">Booking with Lola's Clip Co.</span>
            </div>
            <Steps at={1} />
            <SecLabel>Pick a date</SecLabel>
            <Box>
              <div className="row gap-1 between" style={{ marginBottom: 6 }}>
                <span className="text-faint">‹</span>
                <span className="text-cv-sm">May 2026</span>
                <span className="text-faint">›</span>
              </div>
              {/* mini cal */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                {['M','T','W','T','F','S','S'].map((d,i) => <span key={i} className="text-faint" style={{ textAlign: 'center', fontSize: 10 }}>{d}</span>)}
                {Array.from({length: 28}).map((_,i) => {
                  const avail = [3,4,10,11,17,18,24,25].includes(i);
                  const sel = i === 17;
                  return (
                    <span key={i} style={{
                      textAlign: 'center', fontFamily: 'Kalam', fontSize: 12,
                      padding: '4px 0',
                      border: sel ? '1.5px solid var(--ink)' : '1px solid transparent',
                      borderRadius: 6,
                      background: sel ? 'var(--accent)' : (avail ? 'rgba(234,228,92,.2)' : 'transparent'),
                      color: avail || sel ? 'var(--ink)' : 'var(--ink-faint)',
                    }}>{i+1}</span>
                  );
                })}
              </div>
            </Box>
            <SecLabel>Available times — Sat 18 May</SecLabel>
            <div className="row gap-2 wrap">
              {['9:00','10:30','11:00','1:30','3:00','4:30'].map((t,i) => (
                <Chip key={i} active={t === '10:30'}>{t}</Chip>
              ))}
            </div>
            <div className="row between middle" style={{ marginTop: 16 }}>
              <Btn variant="ghost">‹ Back</Btn>
              <Btn variant="primary">Continue</Btn>
            </div>
          </Browser>
        </Variation>

        <Variation num="B" title="One page, side summary" tag="Single-screen">
          <Browser url="groomr.com/g/lola-clip-co/book">
            <SiteHeader context="user" />
            <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1.6 }}>
                <SecLabel>1. Choose a service</SecLabel>
                <div className="col gap-2">
                  {[
                    ['Bath & Brush','45 min','$45'],
                    ['Full Groom','90 min','$80'],
                    ['Nail Trim','15 min','$15'],
                  ].map((s,i) => (
                    <Box key={i} className="row middle between" fill={i===1?'gold-soft':null}>
                      <div className="row middle gap-2">
                        <Radio on={i===1} />
                        <span className="text-cv-sm">{s[0]}</span>
                        <span className="text-faint">{s[1]}</span>
                      </div>
                      <span className="text-hand-sm">{s[2]}</span>
                    </Box>
                  ))}
                </div>
                <SecLabel>2. Date &amp; time</SecLabel>
                <Box className="row gap-2 wrap">
                  {['Sat 18','Sun 19','Mon 20','Tue 21','Wed 22'].map((d,i) => (
                    <Chip key={i} active={d === 'Sat 18'}>{d}</Chip>
                  ))}
                </Box>
                <Box className="row gap-2 wrap" style={{ marginTop: 6 }}>
                  {['9:00','10:30','11:00','1:30','3:00'].map((t,i) => (
                    <Chip key={i} active={t === '10:30'}>{t}</Chip>
                  ))}
                </Box>
                <SecLabel>3. Which dog?</SecLabel>
                <div className="row gap-2">
                  <Box className="row middle gap-2" style={{ flex: 1 }} fill="gold-soft">
                    <Radio on /><Img round height={28} label="" /><span className="text-cv-sm">Murphy</span>
                  </Box>
                  <Box className="row middle gap-2" style={{ flex: 1 }}>
                    <Radio /><span className="text-hand-sm">+ Add a dog</span>
                  </Box>
                </div>
              </div>

              <div style={{ flex: 1, position: 'sticky', top: 0 }}>
                <Box fill="paper2">
                  <div className="text-cv-sm">Booking summary</div>
                  <div className="scribble-divider" />
                  <div className="row between"><span className="text-hand-sm">Lola's Clip Co.</span><span /></div>
                  <div className="row between"><span className="text-hand-sm">Full Groom</span><span className="text-hand-sm">$80</span></div>
                  <div className="row between"><span className="text-hand-sm">Sat 18 May, 10:30am</span><span /></div>
                  <div className="row between"><span className="text-hand-sm">Murphy &middot; chihuahua</span><span /></div>
                  <div className="scribble-divider" />
                  <div className="row between"><span className="text-cv-sm">Total</span><span className="text-cv-sm">$80</span></div>
                  <Btn variant="primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>Confirm Booking</Btn>
                  <div className="text-faint" style={{ textAlign: 'center', marginTop: 6 }}>Pay at appointment &middot; free cancel 24h+</div>
                </Box>
                <Note tilt="r" top={-14} right={-12}>Updates live as user picks</Note>
              </div>
            </div>
          </Browser>
        </Variation>

        <Variation num="C" title="Confirmation receipt" tag="Step 4 of 4">
          <Browser url="groomr.com/booking/conf-9k4x">
            <SiteHeader context="user" />
            <Steps at={3} />
            <Box fill="gold-soft" style={{ textAlign: 'center', padding: 18 }}>
              <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 36 }}>You're booked! 🎉</div>
              <div className="text-hand">Sat 18 May, 10:30am with Lola's Clip Co.</div>
            </Box>
            <SecLabel>Booking details</SecLabel>
            <Box>
              <div className="row middle gap-2">
                <Img round height={40} label="" />
                <div className="col">
                  <span className="text-cv-sm">Lola's Clip Co.</span>
                  <span className="text-faint">123 5th Ave, Park Slope &middot; 0.4 mi</span>
                </div>
              </div>
              <div className="scribble-divider" />
              <div className="row between"><span className="text-hand-sm">Full Groom for Murphy</span><span className="text-hand-sm">$80</span></div>
              <div className="row between"><span className="text-hand-sm">90 min</span><span className="text-faint">Pay at appointment</span></div>
            </Box>
            <SecLabel>What now?</SecLabel>
            <div className="row gap-2">
              <Btn>📅 Add to calendar</Btn>
              <Btn>💬 Message Lola</Btn>
              <Btn variant="ghost">Cancel</Btn>
            </div>
            <SecLabel>While you wait</SecLabel>
            <Box className="row gap-2 middle">
              <Img round height={36} label="" />
              <span className="text-hand-sm">Add a photo of Murphy so Lola knows what to expect.</span>
              <Btn size="sm">Upload</Btn>
            </Box>
            <Note tilt="l" top={40} right={-12}>Confirmation = chance to deepen relationship</Note>
          </Browser>
        </Variation>
      </div>
    </>
  );
}

window.BookingScreen = BookingScreen;
