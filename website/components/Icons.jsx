
const base = (size) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export const SeatIcon = ({ size = 24, className }) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M6 11V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" />
    <path d="M4 13a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3H4z" />
    <path d="M6 16v4M18 16v4" />
  </svg>
);

export const CheckIcon = ({ size = 24, className }) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const ClockIcon = ({ size = 24, className }) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const BellIcon = ({ size = 24, className }) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </svg>
);

export const SearchIcon = ({ size = 24, className }) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </svg>
);

export const MapIcon = ({ size = 24, className }) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export const ShieldIcon = ({ size = 24, className }) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const DownloadIcon = ({ size = 24, className }) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5" />
    <path d="M5 20h14" />
  </svg>
);

export const PhoneIcon = ({ size = 24, className }) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <rect x="7" y="3" width="10" height="18" rx="2.5" />
    <path d="M11 18h2" />
  </svg>
);

export const UsersIcon = ({ size = 24, className }) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    <path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.8c1.7.7 3 2.4 3 5.2" />
  </svg>
);

export const PinIcon = ({ size = 24, className }) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M9 4h6l-1 5 3 3H7l3-3z" />
    <path d="M12 12v8" />
  </svg>
);

export const BuildingIcon = ({ size = 24, className }) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M4 20V8l8-4 8 4v12" />
    <path d="M9 20v-5h6v5M8 11h.01M12 11h.01M16 11h.01" />
  </svg>
);

/* Brand mark: a 2x2 seat grid */
export const LogoMark = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="5.5" cy="5.5" r="3.5" fill="#2557d6" />
    <circle cx="14.5" cy="5.5" r="3.5" fill="#0f172a" />
    <circle cx="5.5" cy="14.5" r="3.5" fill="#0f172a" />
    <circle cx="14.5" cy="14.5" r="3.5" fill="#0f172a" />
  </svg>
);