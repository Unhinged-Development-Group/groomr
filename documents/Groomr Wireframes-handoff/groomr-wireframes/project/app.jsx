// App shell — tabs + screen routing.

const SCREENS = [
  { id: 'cover',    title: 'Overview',          render: () => <Cover /> },
  { id: 'flow',     title: 'Workflow Map',      render: () => <FlowScreen /> },
  { id: 'landing',  title: 'Landing Page',      render: () => <LandingScreen /> },
  { id: 'search',   title: 'Search Results',    render: () => <SearchScreen /> },
  { id: 'profile',  title: 'Groomer Profile',   render: () => <ProfileScreen /> },
  { id: 'booking',  title: 'Booking Flow',      render: () => <BookingScreen /> },
  { id: 'customer', title: 'Customer Profile',  render: () => <CustomerScreen /> },
  { id: 'ginfo',    title: 'For Groomers',      render: () => <GroomerInfoScreen /> },
  { id: 'greg',     title: 'Groomer Register',  render: () => <GroomerRegisterScreen /> },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "state": "populated",
  "annotations": true
}/*EDITMODE-END*/;

function App() {
  const [tab, setTab] = React.useState('cover');
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.body.classList.toggle('empty-state', t.state === 'empty');
    document.body.classList.toggle('no-annotations', !t.annotations);
  }, [t.state, t.annotations]);

  const screen = SCREENS.find(s => s.id === tab) || SCREENS[0];

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="logo">Groomr<span className="dot" /></span>
          <span className="sub">Wireframes &middot; v0.1 &middot; sketch fidelity</span>
        </div>
        <div className="right">
          <b>3 variations</b> per screen &middot; desktop + mobile &middot; tap a tab to navigate
        </div>
      </div>

      <div className="tabs" role="tablist">
        {SCREENS.map(s => (
          <button
            key={s.id}
            className={cn('tab', tab === s.id && 'active')}
            onClick={() => setTab(s.id)}
            role="tab"
            aria-selected={tab === s.id}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="stage" data-screen-label={screen.title}>
        {screen.render()}
      </div>

      <TweaksPanel>
        <TweakSection label="Wireframe state" />
        <TweakRadio
          label="State"
          value={t.state}
          options={['populated', 'empty']}
          onChange={(v) => setTweak('state', v)}
        />
        <TweakToggle
          label="Show annotations"
          value={t.annotations}
          onChange={(v) => setTweak('annotations', v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
