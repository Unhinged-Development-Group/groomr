// Shared UI primitives (buttons, chips, modal shell, search pill, groomer card, toast).

const PrimaryButton = ({ children, className = "", ...rest }) => (
  <button {...rest}
    className={`btn-primary font-nunito font-bold px-8 py-3 rounded-full text-base focus-ring shadow-subtle ${className}`}>
    {children}
  </button>
);

const SecondaryButton = ({ children, className = "", ...rest }) => (
  <button {...rest}
    className={`btn-secondary font-nunito font-bold px-8 py-3 rounded-full text-base focus-ring ${className}`}>
    {children}
  </button>
);

const GhostButton = ({ children, className = "", ...rest }) => (
  <button {...rest}
    className={`bg-transparent text-pebble-grey hover:text-deep-slate transition-colors duration-300 font-nunito font-bold px-6 py-3 rounded-full focus-ring ${className}`}>
    {children}
  </button>
);

const Chip = ({ children, active, onClick, className = "" }) => (
  <button onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors duration-300 focus-ring ${active
      ? "bg-deep-slate text-alabaster-cream border-2 border-deep-slate"
      : "bg-white text-deep-slate border-2 border-pebble-grey/20 hover:border-deep-slate"} ${className}`}>
    {children}
  </button>
);

const Eyebrow = ({ children, className = "" }) => (
  <span className={`text-xs font-bold text-sage-leaf uppercase tracking-[0.15em] ${className}`}>{children}</span>
);

const Badge = ({ tone = "sage", children }) => {
  const toneCls = {
    sage:  "bg-sage-leaf/10 text-deep-slate border-sage-leaf/20",
    gold:  "bg-groomr-gold/20 text-deep-slate border-groomr-gold/40",
    terra: "bg-muted-terracotta/10 text-deep-slate border-muted-terracotta/30",
    grey:  "bg-pebble-grey/10 text-deep-slate border-pebble-grey/20",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${toneCls}`}>
      {children}
    </span>
  );
};

const StarRow = ({ rating, count, size = 14 }) => (
  <div className="flex items-center gap-1.5">
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ opacity: i < Math.round(rating) ? 1 : 0.25 }}>
          <StarIcon size={size}/>
        </span>
      ))}
    </div>
    <span className="text-sm font-bold text-deep-slate">{rating.toFixed(1)}</span>
    {count != null && <span className="text-xs text-pebble-grey">({count})</span>}
  </div>
);

const Modal = ({ open, onClose, children, size = "md" }) => {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;
  const w = size === "lg" ? "max-w-2xl" : size === "xl" ? "max-w-4xl" : "max-w-md";
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div onClick={onClose} className="absolute inset-0 modal-backdrop cursor-pointer"/>
      <div className={`relative bg-alabaster-cream w-full ${w} rounded-[24px] p-8 md:p-10 shadow-modal z-10 border border-pebble-grey/20 max-h-[90vh] overflow-y-auto`}>
        <button onClick={onClose} aria-label="Close"
          className="absolute top-5 right-5 text-pebble-grey hover:text-muted-terracotta transition-colors focus-ring rounded-full p-2 bg-white shadow-subtle border border-pebble-grey/10">
          <CloseIcon size={18}/>
        </button>
        {children}
      </div>
    </div>
  );
};

const SearchPill = ({ value, onChange, onSubmit, placeholder = "Enter your postcode, town, or city...", ctaLabel = "Search", size = "lg" }) => {
  const padY = size === "sm" ? "py-2" : "py-3";
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(value); }}
          className="w-full">
      <div className={`bg-white rounded-full p-2 flex items-center shadow-subtle border border-pebble-grey/20 focus-within:ring-2 focus-within:ring-groomr-gold transition-shadow`}>
        <div className="pl-4 text-pebble-grey">
          <SearchIcon size={size === "sm" ? 18 : 22}/>
        </div>
        <input type="text" value={value || ""} onChange={(e) => onChange?.(e.target.value)}
               placeholder={placeholder}
               className={`flex-grow bg-transparent font-nunito ${size === "sm" ? "text-sm" : "text-lg"} text-deep-slate placeholder-pebble-grey/70 px-3 ${padY} outline-none border-none min-w-0`}/>
        <button type="submit"
                className={`btn-primary font-nunito font-bold ${size === "sm" ? "px-5 py-2 text-sm" : "px-7 py-3 text-base"} rounded-full whitespace-nowrap focus-ring`}>
          {ctaLabel}
        </button>
      </div>
    </form>
  );
};

const GroomerCard = ({ groomer, onView, onSave, saved }) => (
  <div className="text-left bg-white rounded-[12px] overflow-hidden border border-pebble-grey/20 card-lift block w-full relative group">
    <button onClick={(e) => { e.stopPropagation(); onSave?.(groomer); }}
      aria-label={saved ? "Remove from favourites" : "Save to favourites"}
      className="absolute top-3 right-3 z-10 bg-white/95 hover:bg-white rounded-full p-2 shadow-subtle transition-colors focus-ring">
      <HeartIcon size={18} filled={saved}/>
    </button>
    <button onClick={() => onView?.(groomer)} className="block w-full text-left focus-ring">
      <div className="aspect-[4/3] bg-sage-leaf/20 overflow-hidden">
        <img src={groomer.image} alt={groomer.name} className="w-full h-full object-cover"/>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-fredoka text-xl text-deep-slate leading-tight">{groomer.name}</h3>
            <p className="text-sm text-sage-leaf font-bold mt-1">{groomer.tagline}</p>
          </div>
          <div className="flex items-center gap-1 bg-groomr-gold/20 px-2 py-1 rounded-full shrink-0">
            <StarIcon size={14}/>
            <span className="text-xs font-bold text-deep-slate">{groomer.rating}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-pebble-grey font-bold">
          <PinIcon size={14}/>
          <span>{groomer.distance} miles · {groomer.location}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 bg-sage-leaf/10 text-deep-slate font-bold px-2.5 py-1 rounded-full border border-sage-leaf/20">
            <span className="w-1.5 h-1.5 bg-sage-leaf rounded-full"></span>
            Next: {groomer.nextSlot}
          </span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-pebble-grey/10">
          <span className="text-sm text-pebble-grey">From</span>
          <span className="font-fredoka text-xl text-deep-slate">£{groomer.priceFrom}</span>
        </div>
      </div>
    </button>
  </div>
);

// Toast — slim notification at bottom centre
const Toast = ({ message, onDismiss }) => {
  React.useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onDismiss?.(), 3500);
    return () => clearTimeout(t);
  }, [message, onDismiss]);
  if (!message) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] toast-in">
      <div className="bg-deep-slate text-alabaster-cream font-bold px-5 py-3 rounded-full shadow-modal flex items-center gap-2 border-t-2 border-groomr-gold">
        <CheckIcon size={16}/>
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
};

Object.assign(window, {
  PrimaryButton, SecondaryButton, GhostButton, Chip, Eyebrow, Badge, StarRow,
  Modal, SearchPill, GroomerCard, Toast,
});
