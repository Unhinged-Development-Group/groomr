// Workflow map — how owners and groomers move through the product.

function FlowScreen() {
  const Step = ({ n, title, sub, fill }) => (
    <div className="flow-step" style={{ background: fill || 'var(--paper)' }}>
      <div className="row middle gap-2">
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          border: '1.5px solid var(--ink)',
          background: 'var(--accent)',
          fontFamily: 'Architects Daughter', fontSize: 11, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>{n}</span>
        <span className="text-cv-sm">{title}</span>
      </div>
      <div className="text-soft" style={{ lineHeight: 1.35 }}>{sub}</div>
    </div>
  );
  const Arr = () => <div className="flow-arrow">›</div>;

  return (
    <>
      <ScreenHead
        num="00"
        title="Workflow Map"
        desc="The two end-to-end paths. Owner journey is the priority; groomer onboarding is shorter and converges into the marketplace."
      />

      <div className="text-eye" style={{ marginBottom: 10 }}>Owner journey — discovery → booking → repeat</div>
      <div className="flow-row">
        <Step n="1" title="Lands on home" sub="Sees hero search + value props." fill="rgba(234,228,92,.18)" />
        <Arr />
        <Step n="2" title="Searches" sub="Location + service + maybe date." />
        <Arr />
        <Step n="3" title="Browses results" sub="List + filter chips, optional map." />
        <Arr />
        <Step n="4" title="Opens a profile" sub="Reads bio, photos, reviews, services." />
        <Arr />
        <Step n="5" title="Books" sub="Service → date/time → details → confirm." fill="rgba(234,228,92,.4)" />
        <Arr />
        <Step n="6" title="Confirmation" sub="Receipt, calendar add, message groomer." />
        <Arr />
        <Step n="7" title="Dashboard" sub="Sees upcoming, past, dogs, saved." />
        <Arr />
        <Step n="8" title="Re-books" sub="One-tap from past appointment." fill="rgba(234,228,92,.18)" />
      </div>

      <div className="text-eye" style={{ marginTop: 26, marginBottom: 10 }}>Groomer journey — discovery → onboarding → live</div>
      <div className="flow-row">
        <Step n="1" title="Sees marketing" sub="From footer link, ads, or word of mouth." fill="rgba(200,121,100,.15)" />
        <Arr />
        <Step n="2" title="For Groomers page" sub="Pricing, benefits, testimonials." />
        <Arr />
        <Step n="3" title="Apply / register" sub="Step 1: business basics." />
        <Arr />
        <Step n="4" title="Services + pricing" sub="Step 2." />
        <Arr />
        <Step n="5" title="Schedule" sub="Step 3: hours + buffers." />
        <Arr />
        <Step n="6" title="Photos" sub="Step 4: portfolio." />
        <Arr />
        <Step n="7" title="Verify" sub="Step 5: ID, payouts, review." fill="rgba(200,121,100,.3)" />
        <Arr />
        <Step n="8" title="Live in marketplace" sub="Discoverable on search. First booking arrives." fill="rgba(234,228,92,.4)" />
      </div>

      <div style={{ marginTop: 36 }} className="row gap-3 wrap">
        <Box style={{ flex: 1, minWidth: 260 }} fill="note">
          <div className="text-cv-sm" style={{ marginBottom: 6 }}>Owner re-engagement loop</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontFamily: 'Kalam', fontSize: 13, lineHeight: 1.5 }}>
            <li>Email 1 day after groom → "rate your visit"</li>
            <li>Email 4–6 weeks later → "Murphy is due — book again"</li>
            <li>One-tap rebook from email or dashboard</li>
            <li>"Set as my regular" toggle creates standing booking</li>
          </ul>
        </Box>
        <Box style={{ flex: 1, minWidth: 260 }} fill="note">
          <div className="text-cv-sm" style={{ marginBottom: 6 }}>Groomer's daily loop (post-launch)</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontFamily: 'Kalam', fontSize: 13, lineHeight: 1.5 }}>
            <li>Notification → new booking pending</li>
            <li>Approve / propose new time</li>
            <li>Day-of: see client, dog, service, notes</li>
            <li>Mark complete → payout queued</li>
            <li>Groomer dashboard is a future screen — not in this set.</li>
          </ul>
        </Box>
        <Box style={{ flex: 1, minWidth: 260 }} fill="note">
          <div className="text-cv-sm" style={{ marginBottom: 6 }}>Cross-product handoffs</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontFamily: 'Kalam', fontSize: 13, lineHeight: 1.5 }}>
            <li>Owner books → groomer notified (email + dash)</li>
            <li>Owner messages → in-app thread, also email</li>
            <li>Groomer cancels → owner gets refund + similar suggestions</li>
            <li>Trust score = on-time + no-shows + reviews</li>
          </ul>
        </Box>
      </div>
    </>
  );
}

window.FlowScreen = FlowScreen;
