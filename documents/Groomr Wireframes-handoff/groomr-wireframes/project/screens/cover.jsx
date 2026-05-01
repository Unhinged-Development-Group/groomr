// Cover / overview screen — the landing tab.

function Cover() {
  const cards = [
    { id: 'flow',     n: '00', title: 'Workflow Map',     p: 'How owners and groomers move through the product.' },
    { id: 'landing',  n: '01', title: 'Landing Page',     p: 'First impression. Hero search, value props, social proof.' },
    { id: 'search',   n: '02', title: 'Search Results',   p: 'List-first with filter chips and a collapsible map.' },
    { id: 'profile',  n: '03', title: 'Groomer Profile',  p: 'Portrait, bio, reviews — booking lower down.' },
    { id: 'booking',  n: '04', title: 'Booking Flow',     p: 'Service → date/time → details → confirm.' },
    { id: 'customer', n: '05', title: 'Customer Profile', p: 'Logged-in dashboard. Upcoming, past, dogs, payments.' },
    { id: 'ginfo',    n: '06', title: 'For Groomers',     p: 'Marketing pitch — pricing, benefits, testimonials.' },
    { id: 'greg',     n: '07', title: 'Groomer Register', p: 'Multi-step signup — business, services, schedule, photos.' },
  ];

  // We can't change the parent App tab from here without prop drilling, so use a simple custom event
  const goto = (id) => {
    const tab = Array.from(document.querySelectorAll('.tab'))
      .find(b => b.textContent.trim().toLowerCase().includes(
        ({flow:'workflow', landing:'landing', search:'search', profile:'groomer profile',
          booking:'booking', customer:'customer', ginfo:'for groomers', greg:'register'}[id])
      ));
    if (tab) tab.click();
  };

  return (
    <div className="cover">
      <h1>Groomr<br/>Wireframes.</h1>
      <p className="lede">
        A first sketch of the consumer site and groomer onboarding. Three distinct directions
        per screen — discover, search, book, manage. Pick the bits that feel right and we'll
        tighten from here.
      </p>

      <div className="cover-grid">
        {cards.map(c => (
          <div key={c.id} className="cover-card" onClick={() => goto(c.id)}>
            <div className="num">{c.n}</div>
            <h3>{c.title}</h3>
            <p>{c.p}</p>
          </div>
        ))}
      </div>

      <div className="legend">
        <div>
          <h4>How to read these</h4>
          <p>
            Each screen tab shows three side-by-side directions. Sticky-note callouts explain
            interactions and rationale. Toggle them off in the Tweaks panel if they're noisy.
          </p>
        </div>
        <div>
          <h4>Fidelity</h4>
          <p>
            Marker-on-napkin. Boxes with diagonal slashes are images. Squiggle lines are body
            copy. Yellow pills are primary CTAs. Real type and colour come later.
          </p>
        </div>
        <div>
          <h4>Flow priority</h4>
          <p>
            The core path — owner finds a groomer and books — is the most fleshed out. Groomer
            onboarding is sketched at one variation depth.
          </p>
        </div>
      </div>
    </div>
  );
}

window.Cover = Cover;
