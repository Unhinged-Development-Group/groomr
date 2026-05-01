// Sketchy wireframe primitives — shared across all screens.
// Exposes Box, Img, Line, Head, Btn, Chip, Star, Note, Browser, Phone, etc.

const cn = (...parts) => parts.filter(Boolean).join(' ');

// --- Atoms ----------------------------------------------------------------

const Box = ({ children, className, style, dashed, tilt, fill, ...rest }) => (
  <div
    className={cn(
      'sk-box',
      dashed && 'dashed',
      tilt === 'l' && 'tilt-l',
      tilt === 'r' && 'tilt-r',
      fill === 'paper2' && 'fill-paper-2',
      fill === 'gold' && 'fill-gold',
      fill === 'gold-soft' && 'fill-gold-soft',
      fill === 'terra-soft' && 'fill-terra-soft',
      fill === 'sage-soft' && 'fill-sage-soft',
      fill === 'note' && 'note-yellow',
      className
    )}
    style={style}
    {...rest}
  >
    {children}
  </div>
);

const Img = ({ label = 'photo', height = 80, round, className, style }) => (
  <div
    className={cn('sk-img', round && 'round', className)}
    data-label={label}
    style={{ height: round ? height : height, width: round ? height : undefined, ...style }}
  />
);

const Line = ({ width, dark, thick, className, style }) => (
  <div
    className={cn('sk-line', dark && 'dark', thick && 'thick', className)}
    style={{ width, ...style }}
  />
);

const Head = ({ width, short, full, bigger, className }) => (
  <div className={cn('sk-head', short && 'short', full && 'full', bigger && 'bigger', className)} style={{ width }} />
);

const Btn = ({ children, variant, size, className, style }) => (
  <span
    className={cn(
      'sk-btn',
      variant === 'primary' && 'primary',
      variant === 'terra' && 'terra',
      variant === 'ghost' && 'ghost',
      size === 'sm' && 'sm',
      size === 'lg' && 'lg',
      className
    )}
    style={style}
  >
    {children}
  </span>
);

const Chip = ({ children, active, sage, className }) => (
  <span className={cn('sk-chip', active && 'active', sage && 'sage', className)}>{children}</span>
);

const Star = ({ count = 5, filled = 5 }) => (
  <span style={{ display: 'inline-flex', gap: 2 }}>
    {Array.from({ length: count }).map((_, i) => (
      <span key={i} className={cn('sk-star', i >= filled && 'empty')} />
    ))}
  </span>
);

const Check = ({ on }) => <span className={cn('sk-check', on && 'on')} />;
const Radio = ({ on }) => <span className={cn('sk-radio', on && 'on')} />;

const Note = ({ children, top, left, right, bottom, tilt, noBg, style }) => (
  <div
    className={cn('note', tilt === 'l' && 'tilt-l', tilt === 'r' && 'tilt-r', noBg && 'no-bg')}
    style={{ top, left, right, bottom, ...style }}
  >
    {children}
  </div>
);

// Hand-drawn arrow as inline SVG. Pass coords relative to nearest position:relative parent.
const Arrow = ({ from, to, curve = 30, label, style }) => {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const minX = Math.min(x1, x2) - 30;
  const minY = Math.min(y1, y2) - 30;
  const maxX = Math.max(x1, x2) + 30;
  const maxY = Math.max(y1, y2) + 30;
  const w = maxX - minX, h = maxY - minY;
  const sx = x1 - minX, sy = y1 - minY, ex = x2 - minX, ey = y2 - minY;
  const cx = (sx + ex) / 2 + curve;
  const cy = (sy + ey) / 2 - curve;
  return (
    <svg
      className="ann-arrow"
      style={{ left: minX, top: minY, width: w, height: h, ...style }}
      viewBox={`0 0 ${w} ${h}`}
    >
      <defs>
        <marker id="ah" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
          <path d="M0,0 L8,5 L0,10 z" fill="#2c3e50" />
        </marker>
      </defs>
      <path
        d={`M${sx},${sy} Q${cx},${cy} ${ex},${ey}`}
        stroke="#2c3e50"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="0"
        markerEnd="url(#ah)"
      />
      {label ? (
        <text x={cx} y={cy - 4} fontFamily="Caveat" fontSize="16" fill="#2c3e50" textAnchor="middle">
          {label}
        </text>
      ) : null}
    </svg>
  );
};

// --- Frames (browser / phone) --------------------------------------------

const Browser = ({ url = 'groomr.com', children, style, className }) => (
  <div className={cn('frame', className)} style={style}>
    <div className="frame-bar">
      <span className="dots"><span /><span /><span /></span>
      <span className="url">{url}</span>
      <span className="device">desktop</span>
    </div>
    {children}
  </div>
);

const Phone = ({ url = 'groomr.com', children, style, className }) => (
  <div className={cn('frame mobile', className)} style={style}>
    <div className="frame-bar">
      <span className="dots"><span /><span /><span /></span>
      <span className="url" style={{ fontSize: 9 }}>{url}</span>
      <span className="device" style={{ fontSize: 12 }}>mobile</span>
    </div>
    {children}
  </div>
);

// --- App-level chrome -----------------------------------------------------

// A header row that mimics the Groomr nav at low fidelity.
const SiteHeader = ({ context = 'guest' }) => (
  <div className="row between middle" style={{ padding: '6px 4px 8px', borderBottom: '1px dashed var(--rule)' }}>
    <div className="row middle" style={{ gap: 6 }}>
      <span style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 22 }}>Groomr</span>
      <span style={{
        width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%',
        border: '1.2px solid var(--ink)', display: 'inline-block', marginLeft: 1,
      }} />
    </div>
    <div className="row middle gap-3">
      <span className="text-hand-sm">Find Groomers</span>
      <span className="text-hand-sm">For Groomers</span>
      {context === 'guest' && <Btn size="sm">Log In</Btn>}
      {context === 'guest' && <Btn size="sm" variant="primary">Sign Up</Btn>}
      {context === 'user' && <Img round height={24} label="" />}
    </div>
  </div>
);

const SiteHeaderMobile = ({ context = 'guest' }) => (
  <div className="row between middle" style={{ padding: '4px 2px 6px', borderBottom: '1px dashed var(--rule)' }}>
    <div className="row middle" style={{ gap: 4 }}>
      <span style={{ fontFamily: 'Caveat', fontWeight: 700, fontSize: 18 }}>Groomr</span>
      <span style={{
        width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%',
        border: '1px solid var(--ink)', display: 'inline-block',
      }} />
    </div>
    <div className="row middle gap-2">
      {context === 'user' ? <Img round height={20} label="" /> : <span className="text-cv-sm">≡</span>}
    </div>
  </div>
);

// Section label inside a frame (e.g., "Hero", "Featured groomers")
const SecLabel = ({ children }) => (
  <div className="text-eye" style={{ marginTop: 12, marginBottom: 6 }}>{children}</div>
);

// Variation wrapper
const Variation = ({ num, title, tag, sub, children }) => (
  <div className="variation">
    <div className="vlabel">
      <span className="v-num">{num}</span>
      <span className="v-title">{title}</span>
      {tag ? <span className="v-tag">{tag}</span> : null}
    </div>
    {sub ? <div className="vsub">{sub}</div> : null}
    {children}
  </div>
);

const ScreenHead = ({ num, title, desc }) => (
  <div className="screen-head">
    <h2><span className="num">{num}</span>{title}</h2>
    <div className="desc">{desc}</div>
  </div>
);

Object.assign(window, {
  cn, Box, Img, Line, Head, Btn, Chip, Star, Check, Radio, Note, Arrow,
  Browser, Phone, SiteHeader, SiteHeaderMobile, SecLabel, Variation, ScreenHead,
});
