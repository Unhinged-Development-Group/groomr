// Customer profile / dashboard (logged-in).

function CustomerScreen() {
  const Appt = ({ when, what, who, status }) => (
    <Box className="row gap-3 middle">
      <Img round height={42} label="" />
      <div className="col grow">
        <div className="row middle gap-2">
          <span className="text-cv-sm">{what}</span>
          {status && <Chip sage={status==='upcoming'} active={status==='today'}>{status}</Chip>}
        </div>
        <span className="text-faint">{when} &middot; {who}</span>
      </div>
      <div className="row gap-2">
        <Btn size="sm">Message</Btn>
        <Btn size="sm" variant="ghost">⋯</Btn>
      </div>
    </Box>
  );

  return (
    <>
      <ScreenHead
        num="05"
        title="Customer Profile"
        desc="Logged-in dashboard. Three takes on what to lead with: next appointment, the dogs, or activity."
      />

      <div className="variations cols-3">
        <Variation num="A" title="Next-appointment hero" tag="Action-first">
          <Browser url="groomr.com/me">
            <SiteHeader context="user" />
            <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1.6 }}>
                <Box fill="gold-soft" style={{ position: 'relative' }}>
                  <div className="text-eye">Next appointment</div>
                  <div style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 30 }}>Sat 18 May, 10:30am</div>
                  <div className="text-hand">Murphy &middot; Full Groom &middot; with Lola's Clip Co.</div>
                  <div className="row gap-2" style={{ marginTop: 8 }}>
                    <Btn variant="primary">View details</Btn>
                    <Btn>Reschedule</Btn>
                    <Btn variant="ghost">Cancel</Btn>
                  </div>
                  <Note tilt="r" top={-12} right={-12}>Hero = the most useful single thing</Note>
                </Box>
                <SecLabel>Upcoming</SecLabel>
                <div className="col gap-2">
                  <Appt when="Sat 18 May, 10:30" what="Full Groom" who="Lola's Clip Co." status="upcoming" />
                  <Appt when="Fri 14 Jun, 11:00" what="Bath & Brush" who="Lola's Clip Co." status="upcoming" />
                </div>
                <SecLabel>Past appointments</SecLabel>
                <Appt when="20 Apr" what="Full Groom" who="Lola's Clip Co." />
                <Appt when="22 Mar" what="Nail Trim" who="Doggy Day Spa" />
              </div>

              <div style={{ flex: 1 }}>
                <Box>
                  <div className="text-cv-sm">My dogs</div>
                  <div className="row gap-2 middle" style={{ marginTop: 6 }}>
                    <Img round height={42} label="" />
                    <div className="col grow">
                      <span className="text-hand-sm">Murphy</span>
                      <span className="text-faint">Chihuahua &middot; 4 yrs</span>
                    </div>
                    <Btn size="sm" variant="ghost">Edit</Btn>
                  </div>
                  <Btn size="sm" style={{ marginTop: 8 }}>+ Add a dog</Btn>
                </Box>
                <Box style={{ marginTop: 10 }}>
                  <div className="text-cv-sm">Saved groomers</div>
                  <div className="row gap-2" style={{ marginTop: 6 }}>
                    <Img round height={32} label="" /><Img round height={32} label="" /><Img round height={32} label="" />
                  </div>
                </Box>
              </div>
            </div>
          </Browser>
        </Variation>

        <Variation num="B" title="Dog-led" tag="Pet-centric">
          <Browser url="groomr.com/me">
            <SiteHeader context="user" />
            <div className="text-eye" style={{ marginTop: 4 }}>Welcome back, Sarah</div>
            <div className="row gap-3" style={{ marginTop: 6 }}>
              <Box style={{ flex: 1, position: 'relative' }} fill="paper2">
                <div className="row middle gap-3">
                  <Img round height={56} label="Murphy" />
                  <div className="col grow">
                    <div className="text-cv">Murphy</div>
                    <div className="text-faint">Chihuahua &middot; long-haired &middot; 4 yrs</div>
                    <div className="text-soft" style={{ marginTop: 2 }}>
                      Last groomed <b>20 Apr</b> &middot; due in <b>4 days</b>
                    </div>
                  </div>
                </div>
                <div className="row gap-2" style={{ marginTop: 10 }}>
                  <Btn variant="primary">Book Murphy</Btn>
                  <Btn>View history</Btn>
                </div>
                <Note tilt="r" top={-14} right={-12}>Each dog is its own card. Multi-dog households scale.</Note>
              </Box>
              <Box style={{ flex: 1 }} dashed>
                <div className="row middle gap-2">
                  <span style={{ width: 48, height: 48, border: '1.5px dashed var(--ink)', borderRadius: '50%' }} />
                  <span className="text-cv">+ Add a dog</span>
                </div>
              </Box>
            </div>

            <SecLabel>Schedule</SecLabel>
            <div className="col gap-2">
              <Appt when="Sat 18 May" what="Full Groom" who="Murphy &middot; Lola's" status="upcoming" />
              <Appt when="20 Apr" what="Full Groom" who="Murphy &middot; Lola's" />
            </div>
          </Browser>
        </Variation>

        <Variation num="C" title="Two-column workspace" tag="Power user">
          <Browser url="groomr.com/me">
            <SiteHeader context="user" />
            <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 0.8 }}>
                <Box>
                  <div className="text-eye" style={{ marginBottom: 6 }}>Menu</div>
                  <div className="col gap-2">
                    <Chip active>Dashboard</Chip>
                    <Chip>Appointments</Chip>
                    <Chip>My dogs</Chip>
                    <Chip>Saved groomers</Chip>
                    <Chip>Payment</Chip>
                    <Chip>Account</Chip>
                  </div>
                </Box>
              </div>
              <div style={{ flex: 2.2 }}>
                <div className="row gap-2">
                  <Box style={{ flex: 1, textAlign: 'center' }} fill="gold-soft">
                    <div className="text-cv">3</div>
                    <div className="text-faint">Upcoming</div>
                  </Box>
                  <Box style={{ flex: 1, textAlign: 'center' }} fill="sage-soft">
                    <div className="text-cv">12</div>
                    <div className="text-faint">Past grooms</div>
                  </Box>
                  <Box style={{ flex: 1, textAlign: 'center' }} fill="terra-soft">
                    <div className="text-cv">2</div>
                    <div className="text-faint">Saved</div>
                  </Box>
                </div>
                <SecLabel>Activity</SecLabel>
                <Appt when="2 days ago" what="Booked Full Groom" who="for Murphy" />
                <Appt when="20 Apr" what="Reviewed Lola's" who="Left 5 stars" />
                <Appt when="10 Apr" what="Saved" who="Doggy Day Spa" />
                <Note tilt="l" top={-10} left={-14}>Sidebar nav scales when we add features</Note>
              </div>
            </div>
          </Browser>
        </Variation>
      </div>

      <div style={{ marginTop: 36 }}>
        <div className="text-eye" style={{ marginBottom: 10 }}>Mobile — variation B (dog-led)</div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Phone url="m.groomr.com/me">
            <SiteHeaderMobile context="user" />
            <div className="text-eye">Hello, Sarah</div>
            <Box fill="paper2" style={{ marginTop: 6 }}>
              <div className="row middle gap-2">
                <Img round height={40} label="" />
                <div className="col grow">
                  <span className="text-cv-sm">Murphy</span>
                  <span className="text-faint">Due in 4 days</span>
                </div>
              </div>
              <Btn variant="primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>Book Murphy</Btn>
            </Box>
            <SecLabel>Next up</SecLabel>
            <Box>
              <div className="text-cv-sm">Sat 18 May, 10:30am</div>
              <div className="text-faint">Full Groom @ Lola's</div>
            </Box>
          </Phone>
        </div>
      </div>
    </>
  );
}

window.CustomerScreen = CustomerScreen;
