// "For Groomers" marketing page — pitch why join Groomr.

function GroomerInfoScreen() {
  return (
    <>
      <ScreenHead
        num="06"
        title="For Groomers — Info Page"
        desc="Marketing pitch with pricing, benefits, testimonials. Links to the multi-step register flow."
      />

      <div className="variations cols-3">
        <Variation num="A" title="Headline + benefits + pricing" tag="Standard">
          <Browser url="groomr.com/groomers">
            <SiteHeader />
            <Box fill="paper2" style={{ position: 'relative', textAlign: 'center', padding: 22 }}>
              <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 38, lineHeight: 1.05 }}>
                Run a busier, calmer<br/>grooming business.
              </div>
              <div className="text-hand" style={{ marginTop: 6 }}>
                Get bookings, manage clients, get paid — without the admin.
              </div>
              <div className="row gap-2 center" style={{ marginTop: 12, justifyContent: 'center' }}>
                <Btn variant="primary" size="lg">Start Listing — Free</Btn>
                <Btn>See pricing</Btn>
              </div>
              <Note tilt="r" top={-14} right={-10}>Big yellow CTA leads straight into Step 1 of register</Note>
            </Box>

            <SecLabel>Why join Groomr</SecLabel>
            <div className="row gap-3">
              {[
                ['🐾','New clients','Customers find you by location & service.'],
                ['📅','Smart calendar','Block out time, set buffers, sync with Google.'],
                ['💳','Get paid fast','Payouts in 2 days. No chasing invoices.'],
              ].map((p,i) => (
                <Box key={i} style={{ flex: 1 }}>
                  <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: '50%', border: '1.5px solid var(--ink)', marginBottom: 6 }} />
                  <div className="text-cv-sm">{p[1]}</div>
                  <div className="text-soft">{p[2]}</div>
                </Box>
              ))}
            </div>

            <SecLabel>Pricing — simple</SecLabel>
            <div className="row gap-3">
              <Box style={{ flex: 1 }}>
                <div className="text-eye">Starter</div>
                <div className="text-cv">Free</div>
                <Line short /><Line short />
                <Btn>Start free</Btn>
              </Box>
              <Box style={{ flex: 1, position: 'relative' }} fill="gold-soft">
                <span className="tag-corner">Most popular</span>
                <div className="text-eye">Pro</div>
                <div className="text-cv">$29 / mo</div>
                <Line short /><Line short /><Line short />
                <Btn variant="primary">Choose Pro</Btn>
              </Box>
              <Box style={{ flex: 1 }}>
                <div className="text-eye">Studio</div>
                <div className="text-cv">$79 / mo</div>
                <Line short /><Line short />
                <Btn>Choose Studio</Btn>
              </Box>
            </div>

            <SecLabel>Groomers love Groomr</SecLabel>
            <Box fill="sage-soft">
              <div className="text-cv">"I filled my Saturdays in three weeks."</div>
              <div className="text-soft">— Maya, Tail Wags &amp; Trims, Brooklyn</div>
            </Box>
          </Browser>
        </Variation>

        <Variation num="B" title="Numbers-led pitch" tag="Quantitative">
          <Browser url="groomr.com/groomers">
            <SiteHeader />
            <Box style={{ padding: 20 }} fill="gold-soft">
              <div style={{ fontFamily: 'Caveat', fontSize: 36, fontWeight: 700, lineHeight: 1.05 }}>
                Average groomer earns<br/>$1,840 more per month.
              </div>
              <div className="text-hand" style={{ marginTop: 4 }}>
                Based on 200+ groomers in their first 6 months on Groomr.
              </div>
              <Btn variant="primary" size="lg" style={{ marginTop: 10 }}>Apply to Join</Btn>
            </Box>
            <SecLabel>The numbers</SecLabel>
            <div className="row gap-3">
              {[['+38%','more bookings/mo'],['2 days','to first payout'],['$0','setup fee'],['4.9★','avg groomer rating']].map((s,i) => (
                <Box key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div className="text-cv">{s[0]}</div>
                  <div className="text-faint">{s[1]}</div>
                </Box>
              ))}
            </div>
            <SecLabel>How it works (4 steps)</SecLabel>
            <div className="row gap-2">
              {['Apply','Get verified','Set your hours','Take bookings'].map((s,i) => (
                <Box key={i} style={{ flex: 1 }}>
                  <div className="text-cv-sm">{i+1}. {s}</div>
                  <Line short />
                </Box>
              ))}
            </div>
            <Note tilt="l" top={70} right={-12}>"Apply" wording = curated marketplace feel</Note>
          </Browser>
        </Variation>

        <Variation num="C" title="Story-led — meet the groomers" tag="Editorial">
          <Browser url="groomr.com/groomers">
            <SiteHeader />
            <SecLabel>Hero</SecLabel>
            <div className="row gap-3 middle">
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 32, lineHeight: 1.05 }}>
                  Built by groomers,<br/>for groomers.
                </div>
                <div className="text-hand" style={{ marginTop: 6 }}>We champion independents — no corporate chains.</div>
                <Btn variant="primary" size="lg" style={{ marginTop: 10 }}>Become a Groomr</Btn>
              </div>
              <Img height={140} label="Maya at her shop" style={{ flex: 1 }} />
            </div>
            <SecLabel>Three stories</SecLabel>
            <div className="row gap-3">
              {[1,2,3].map(i => (
                <Box key={i}>
                  <Img height={80} label="" />
                  <div className="text-cv-sm" style={{ marginTop: 6 }}>Maya, Brooklyn</div>
                  <Line /><Line short />
                </Box>
              ))}
            </div>
            <Note tilt="r" top={-10} right={-10}>Story-led; trust > features. Pricing on a child page.</Note>
          </Browser>
        </Variation>
      </div>
    </>
  );
}

window.GroomerInfoScreen = GroomerInfoScreen;
