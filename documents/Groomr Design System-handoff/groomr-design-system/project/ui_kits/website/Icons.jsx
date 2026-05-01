// Brand-pattern icons: splash circle (gold or terracotta @ 0.55) + 2px Deep Slate stroke glyph.
// Plus a small set of Heroicons-outline-style utility glyphs.

const SPLASH_GOLD = "#eae45c";
const SPLASH_TERRA = "#c87964";
const STROKE = "#2c3e50";

const Svg = ({ size = 24, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">{children}</svg>
);

const PetsIcon = ({ size }) => (
  <Svg size={size}>
    <circle cx="10" cy="11" r="7" fill={SPLASH_GOLD} opacity="0.55" />
    <path stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      d="M12 20.5c-3 0-5.5-2-6.5-5-.5-1.5.5-3 2-3h9c1.5 0 2.5 1.5 2 3-1 3-3.5 5-6.5 5z"/>
    <path stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      d="M8 8a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM15 6a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM21 8a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
  </Svg>
);

const ScissorsIcon = ({ size }) => (
  <Svg size={size}>
    <circle cx="14" cy="15" r="6.5" fill={SPLASH_TERRA} opacity="0.55" />
    <circle cx="6" cy="6" r="3" stroke={STROKE} strokeWidth="2"/>
    <circle cx="6" cy="18" r="3" stroke={STROKE} strokeWidth="2"/>
    <line x1="20" y1="4" x2="8.12" y2="15.88" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
    <line x1="14.47" y1="14.48" x2="20" y2="20" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
    <line x1="8.12" y1="8.12" x2="12" y2="12" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

const CalendarIcon = ({ size }) => (
  <Svg size={size}>
    <circle cx="16" cy="8" r="8" fill={SPLASH_GOLD} opacity="0.55" />
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={STROKE} strokeWidth="2"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke={STROKE} strokeWidth="2" strokeLinecap="round"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke={STROKE} strokeWidth="2"/>
    <path d="M9 16l2 2 4-4" stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const PinIcon = ({ size }) => (
  <Svg size={size}>
    <circle cx="10" cy="8" r="6.5" fill={SPLASH_TERRA} opacity="0.55" />
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="3" stroke={STROKE} strokeWidth="2"/>
  </Svg>
);

const ShieldIcon = ({ size }) => (
  <Svg size={size}>
    <circle cx="15" cy="11" r="7.5" fill={SPLASH_GOLD} opacity="0.55" />
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 12l2 2 4-4" stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// Utility outline icons (Heroicons-style: 24px, 2px stroke, currentColor)
const Stroke = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d.map((p, i) => <path key={i} d={p}/>)}
  </svg>
);

const SearchIcon  = (p) => <Stroke {...p} d={["M21 21l-6-6","M17 10a7 7 0 11-14 0 7 7 0 0114 0z"]}/>;
const ChevronIcon = (p) => <Stroke {...p} d={["M19 9l-7 7-7-7"]}/>;
const CloseIcon   = (p) => <Stroke {...p} d={["M6 18L18 6","M6 6l12 12"]}/>;
const ClockIcon   = (p) => <Stroke {...p} d={["M12 8v4l3 3","M21 12a9 9 0 11-18 0 9 9 0 0118 0z"]}/>;
const PlusIcon    = (p) => <Stroke {...p} d={["M12 4v16","M4 12h16"]}/>;
const MenuIcon    = (p) => <Stroke {...p} d={["M4 6h16","M4 12h16","M4 18h16"]}/>;
const CheckIcon   = (p) => <Stroke {...p} d={["M5 13l4 4L19 7"]}/>;
const StarIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="#eae45c">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

Object.assign(window, {
  PetsIcon, ScissorsIcon, CalendarIcon, PinIcon, ShieldIcon,
  SearchIcon, ChevronIcon, CloseIcon, ClockIcon, PlusIcon, MenuIcon, CheckIcon, StarIcon,
});
