// Groomr Icon Library
// Brand icons: splash circle (gold or terracotta @ 0.55 opacity) + Deep Slate stroke glyph.
// Utility icons: plain stroke using currentColor.
// All icons accept size (default 24) and className props.

const GOLD = "#eae45c";
const TERRA = "#c87964";
const STROKE = "#2c3e50";

interface IconProps {
  size?: number;
  className?: string;
}

// ─── Brand Icons ────────────────────────────────────────────────────────────

export function PetsIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Gold splash */}
      <circle cx="9" cy="10" r="7.5" fill={GOLD} opacity="0.55" />
      {/* Palm pad */}
      <ellipse cx="12" cy="17.2" rx="4" ry="3.2" stroke={STROKE} strokeWidth="2" />
      {/* Toe pads — 4 ovals in an arc above the palm */}
      <ellipse cx="6.5"  cy="11.2" rx="1.8" ry="2.3" stroke={STROKE} strokeWidth="1.8" />
      <ellipse cx="10"   cy="8.8"  rx="1.8" ry="2.3" stroke={STROKE} strokeWidth="1.8" />
      <ellipse cx="14"   cy="8.8"  rx="1.8" ry="2.3" stroke={STROKE} strokeWidth="1.8" />
      <ellipse cx="17.5" cy="11.2" rx="1.8" ry="2.3" stroke={STROKE} strokeWidth="1.8" />
    </svg>
  );
}

export function ScissorsIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="15" cy="16" r="6.5" fill={TERRA} opacity="0.55" />
      <circle cx="6" cy="6" r="3" stroke={STROKE} strokeWidth="2" />
      <circle cx="6" cy="18" r="3" stroke={STROKE} strokeWidth="2" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CalendarIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="16" cy="7" r="7" fill={GOLD} opacity="0.55" />
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={STROKE} strokeWidth="2" />
      <line x1="16" y1="2" x2="16" y2="6" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="2" x2="8" y2="6" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="10" x2="21" y2="10" stroke={STROKE} strokeWidth="2" />
      <path d="M9 16l2 2 4-4" stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PinIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="10" cy="9" r="6.5" fill={TERRA} opacity="0.55" />
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
        stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="3" stroke={STROKE} strokeWidth="2" />
    </svg>
  );
}

export function ShieldIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="14" cy="10" r="7.5" fill={GOLD} opacity="0.55" />
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ReviewsIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="15" cy="15" r="7" fill={TERRA} opacity="0.55" />
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DashboardIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="11" r="6" fill={GOLD} opacity="0.55" />
      <path stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function MessagesIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="17" cy="7" r="5.5" fill={TERRA} opacity="0.55" />
      <path stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function GalleryIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="14" cy="15" r="7" fill={GOLD} opacity="0.55" />
      <rect stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle stroke={STROKE} strokeWidth="2" cx="8.5" cy="8.5" r="1.5" />
      <polyline stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        points="21 15 16 10 5 21" />
    </svg>
  );
}

export function NotificationsIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function AnalyticsIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="15" cy="9" r="6" fill={GOLD} opacity="0.55" />
      <line stroke={STROKE} strokeWidth="2" strokeLinecap="round" x1="18" y1="20" x2="18" y2="10" />
      <line stroke={STROKE} strokeWidth="2" strokeLinecap="round" x1="12" y1="20" x2="12" y2="4" />
      <line stroke={STROKE} strokeWidth="2" strokeLinecap="round" x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

export function FavoritesIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="16" cy="8" r="5.5" fill={TERRA} opacity="0.55" />
      <path stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function FinancialsIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="15" cy="11" r="6.5" fill={GOLD} opacity="0.55" />
      <rect x="2" y="6" width="20" height="12" rx="2" ry="2" stroke={STROKE} strokeWidth="2" />
      <circle cx="12" cy="12" r="2" stroke={STROKE} strokeWidth="2" />
      <path d="M6 12h.01M18 12h.01" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="14" cy="16" r="6.5" fill={TERRA} opacity="0.55" />
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"
        stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 14h4M10 8h4M18 16h4"
        stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AccountIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="14" r="6.5" fill={GOLD} opacity="0.55" />
      <rect x="3" y="4" width="18" height="16" rx="2" ry="2" stroke={STROKE} strokeWidth="2" />
      <circle cx="9" cy="10" r="2" stroke={STROKE} strokeWidth="2" />
      <path d="M5 16c0-1.5 1.5-2 4-2s4 .5 4 2" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      <path d="M15 10h4M15 14h4" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Utility Icons ───────────────────────────────────────────────────────────

export function SearchIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={STROKE}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 21l-6-6" />
      <path d="M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={STROKE}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={STROKE}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={STROKE}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export function CloseIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={STROKE}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 18L18 6" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export function ClockIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={STROKE}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 8v4l3 3" />
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function PlusIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={STROKE}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 4v16" />
      <path d="M4 12h16" />
    </svg>
  );
}

export function MenuIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={STROKE}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

export function CheckIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={STROKE}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

interface HeartIconProps extends IconProps {
  filled?: boolean;
}
export function HeartIcon({ size = 24, className, filled }: HeartIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        fill={filled ? TERRA : "none"}
      />
    </svg>
  );
}

export function MessageIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={STROKE}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}

export function UploadIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={STROKE}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

export function PencilIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={STROKE}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

export function TrashIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={STROKE}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

// Gold-filled star for ratings
export function StarIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export function LocationPinIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
