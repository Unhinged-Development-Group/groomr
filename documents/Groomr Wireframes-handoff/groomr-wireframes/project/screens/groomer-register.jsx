// Groomer multi-step register flow.

function GroomerRegisterScreen() {
  const Steps = ({ at, labels }) => (
    <div className="row middle gap-2 wrap" style={{ marginBottom: 10 }}>
      {labels.map((s,i) => (
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
          {i < labels.length - 1 && <span style={{ color: 'var(--ink-faint)' }}>—</span>}
        </React.Fragment>
      ))}
    </div>
  );

  const Field = ({ label, val, dashed, fill }) => (
    <div className="col" style={{ marginBottom: 8 }}>
      <span className="text-eye" style={{ marginBottom: 2 }}>{label}</span>
      <Box dashed={dashed} fill={fill} style={{ padding: '6px 10px' }}>
        <span className={val ? 'text-hand-sm' : 'text-faint'}>{val || 'placeholder'}</span>
      </Box>
    </div>
  );

  const labels = ['Business','Services','Schedule','Photos','Verify'];

  return (
    <>
      <ScreenHead
        num="07"
        title="Groomer Register — Multi-step"
        desc="Five-step onboarding. Three takes — wizard, single-page, and conversational."
      />

      <div className="variations cols-3">
        <Variation num="A" title="Classic wizard (step 2)" tag="Step-by-step">
          <Browser url="groomr.com/groomers/register?step=2">
            <SiteHeader />
            <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 28 }}>List your business</div>
            <Steps at={1} labels={labels} />
            <SecLabel>Services you offer</SecLabel>
            <div className="col gap-2">
              {['Bath & Brush','Full Groom','Nail Trim','De-shedding','Teeth cleaning','Puppy first groom'].map((s,i) => (
                <Box key={i} className="row middle gap-3" fill={i<3?'gold-soft':null}>
                  <Check on={i<3} />
                  <span className="text-hand-sm" style={{ flex: 1 }}>{s}</span>
                  {i<3 && <>
                    <Box dashed style={{ padding: '2px 8px' }}><span className="text-faint">$ price</span></Box>
                    <Box dashed style={{ padding: '2px 8px' }}><span className="text-faint">⏱ duration</span></Box>
                  </>}
                </Box>
              ))}
              <Box dashed className="row middle gap-2"><span className="text-faint">+ Add custom service</span></Box>
            </div>
            <div className="row between middle" style={{ marginTop: 14 }}>
              <Btn variant="ghost">‹ Back</Btn>
              <div className="row gap-2">
                <Btn>Save &amp; exit</Btn>
                <Btn variant="primary">Continue ›</Btn>
              </div>
            </div>
            <Note tilt="r" top={-12} right={-10}>Each step ~30s. Save state per step.</Note>
          </Browser>
        </Variation>

        <Variation num="B" title="Schedule (step 3)" tag="Calendar">
          <Browser url="groomr.com/groomers/register?step=3">
            <SiteHeader />
            <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 28 }}>Set your hours</div>
            <Steps at={2} labels={labels} />
            <Box>
              <div className="text-cv-sm" style={{ marginBottom: 6 }}>Working days</div>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) => (
                <div key={i} className="row middle gap-3" style={{ padding: '6px 0', borderBottom: i<6?'1px dashed var(--rule)':'none' }}>
                  <Check on={i<5 || i===5} />
                  <span className="text-hand-sm" style={{ width: 50 }}>{d}</span>
                  {(i<5 || i===5) ? (
                    <>
                      <Box dashed style={{ padding: '2px 10px' }}><span className="text-hand-sm">9:00</span></Box>
                      <span className="text-faint">to</span>
                      <Box dashed style={{ padding: '2px 10px' }}><span className="text-hand-sm">{i===5 ? '4:00' : '6:00'}</span></Box>
                    </>
                  ) : (
                    <span className="text-faint">closed</span>
                  )}
                </div>
              ))}
            </Box>
            <SecLabel>Buffer between appointments</SecLabel>
            <div className="row gap-2">
              {['0','15','30','45'].map((m,i) => <Chip key={i} active={m==='15'}>{m} min</Chip>)}
            </div>
            <SecLabel>Booking window</SecLabel>
            <Box className="row middle gap-3">
              <span className="text-hand-sm">Customers can book</span>
              <Box dashed style={{ padding: '2px 10px' }}><span className="text-hand-sm">2 weeks</span></Box>
              <span className="text-hand-sm">in advance</span>
            </Box>
            <div className="row between middle" style={{ marginTop: 14 }}>
              <Btn variant="ghost">‹ Back</Btn>
              <Btn variant="primary">Continue ›</Btn>
            </div>
            <Note tilt="l" top={70} right={-12}>Calendar sync (Google) on next sub-step</Note>
          </Browser>
        </Variation>

        <Variation num="C" title="Photos + verify (step 4–5)" tag="Final stretch">
          <Browser url="groomr.com/groomers/register?step=4">
            <SiteHeader />
            <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 28 }}>Show off your work</div>
            <Steps at={3} labels={labels} />
            <SecLabel>Cover photo</SecLabel>
            <Box dashed style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="text-cv-sm">↑ Drag a photo or click to upload</span>
            </Box>
            <SecLabel>Portfolio (min. 4)</SecLabel>
            <div className="row gap-2 wrap">
              {[1,2,3].map(i => <Img key={i} height={70} label="groom" style={{ flex: '0 0 28%' }} />)}
              <Box dashed style={{ flex: '0 0 28%', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="text-cv-sm">+ Add</span>
              </Box>
            </div>
            <SecLabel>Verify your business (step 5)</SecLabel>
            <div className="col gap-2">
              <Box className="row middle gap-3" fill="gold-soft">
                <Check on /><span className="text-hand-sm" style={{ flex: 1 }}>Business name &amp; address</span>
                <span className="text-faint">done</span>
              </Box>
              <Box className="row middle gap-3" fill="gold-soft">
                <Check on /><span className="text-hand-sm" style={{ flex: 1 }}>ID verification</span>
                <span className="text-faint">uploaded</span>
              </Box>
              <Box className="row middle gap-3">
                <Check /><span className="text-hand-sm" style={{ flex: 1 }}>Payouts (Stripe Connect)</span>
                <Btn size="sm">Connect</Btn>
              </Box>
              <Box className="row middle gap-3">
                <Check /><span className="text-hand-sm" style={{ flex: 1 }}>Pet-handling certification (optional)</span>
                <Btn size="sm" variant="ghost">Upload</Btn>
              </Box>
            </div>
            <div className="row between middle" style={{ marginTop: 14 }}>
              <Btn variant="ghost">‹ Back</Btn>
              <Btn variant="primary">Submit for review</Btn>
            </div>
            <Note tilt="r" top={-10} right={-10}>"Review" = Groomr's curation step. ~24h.</Note>
          </Browser>
        </Variation>
      </div>

      <div style={{ marginTop: 36 }}>
        <div className="text-eye" style={{ marginBottom: 10 }}>Step 1 — Business basics (entry point)</div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 360, maxWidth: 560 }}>
            <Browser url="groomr.com/groomers/register?step=1">
              <SiteHeader />
              <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 28 }}>Tell us about your business</div>
              <Steps at={0} labels={labels} />
              <Field label="Business name" val="Lola's Clip Co." />
              <Field label="Owner name" val="Lola García" />
              <Field label="Email" val="lola@lolaclip.co" />
              <Field label="Phone" val="(347) 555-0199" />
              <Field label="Address" val="123 5th Ave, Brooklyn, NY 11215" />
              <div className="row gap-2">
                <Field label="Years in business" val="6" />
                <Field label="Solo or team?" val="Solo" />
              </div>
              <div className="row between middle" style={{ marginTop: 8 }}>
                <Btn variant="ghost">Cancel</Btn>
                <Btn variant="primary">Continue ›</Btn>
              </div>
            </Browser>
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <Box fill="note">
              <div className="text-cv-sm" style={{ marginBottom: 6 }}>Notes for register flow</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontFamily: 'Kalam', fontSize: 13, lineHeight: 1.5 }}>
                <li>5 steps. Save & resume between sessions.</li>
                <li>Address auto-completes via Google Places.</li>
                <li>Step 4 (photos) is the most-abandoned — prompt to "skip & finish later" with reminder email.</li>
                <li>After "Submit for review", show a holding screen with what to expect.</li>
                <li>Variation C's tighter wizard is preferred; Variation B for the schedule step is the "wow" moment.</li>
              </ul>
            </Box>
          </div>
        </div>
      </div>
    </>
  );
}

window.GroomerRegisterScreen = GroomerRegisterScreen;
