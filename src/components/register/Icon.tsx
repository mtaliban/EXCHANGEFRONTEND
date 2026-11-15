// Ikoni zote (mtindo wa "outline", unene 1.7). Zinatumia currentColor.
const PATHS: Record<string, React.ReactNode> = {
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>),
  phone: (<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />),
  whatsapp: (<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z" />),
  building: (<><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4" /></>),
  stethoscope: (<><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" /><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" /><circle cx="20" cy="10" r="2" /></>),
  graduation: (<><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></>),
  sprout: (<><path d="M7 20h10" /><path d="M10 20c5.5-2.5.8-6.4 3-10" /><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" /><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" /></>),
  idcard: (<><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="12" r="2" /><path d="M14 10h4M14 14h4M5 17c.5-1.5 1.7-2 3-2s2.5.5 3 2" /></>),
  backpack: (<><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /><path d="M8 10h8M8 18h8M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></>),
  wrench: (<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8z" />),
  book: (<path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" />),
  map: (<><path d="M14.1 4.6a2 2 0 0 0-1.8 0L9.6 6a2 2 0 0 1-1.8 0L4.4 4.3A1 1 0 0 0 3 5.2v12.4a1 1 0 0 0 .6.9l4.2 2.1a2 2 0 0 0 1.8 0l2.7-1.4a2 2 0 0 1 1.8 0l3.4 1.7a1 1 0 0 0 1.4-.9V7.6a1 1 0 0 0-.6-.9z" /><path d="M15 5.8v15M9 3.2v15" /></>),
  pin: (<><path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></>),
  school: (<><path d="M14 22v-4a2 2 0 1 0-4 0v4" /><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2" /><path d="M18 5v17M4 6l8-4 8 4M6 5v17" /><circle cx="12" cy="9" r="2" /></>),
  clock: (<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>),
  trash: (<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />),
  userPlus: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>),
  chevronDown: (<path d="M6 9l6 6 6-6" />),
  chevronLeft: (<path d="M15 6l-6 6 6 6" />),
  chevronRight: (<path d="M9 6l6 6-6 6" />),
  arrowLeft: (<path d="M19 12H5M12 19l-7-7 7-7" />),
  x: (<path d="M6 6l12 12M18 6 6 18" />),
  plus: (<path d="M12 5v14M5 12h14" />),
  alert: (<><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>),
  check: (<path d="M20 6 9 17l-5-5" />),
  // ---- Usajili: hatua 1–5 ----
  userCircle: (<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3" /><path d="M6.2 18.4a7 7 0 0 1 11.6 0" /></>),
  waLogo: (<><path d="M3 21l1.6-4.6A9 9 0 1 1 8 19.6z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8c-1-.4-1.9-1.3-2.3-2.3l.8-1-1-2z" /></>),
  layers: (<><path d="m12 2 10 5-10 5L2 7z" /><path d="m2 12 10 5 10-5M2 17l10 5 10-5" /></>),
  afya: (<><path d="M5 3H4a1 1 0 0 0-1 1v5a5 5 0 0 0 10 0V4a1 1 0 0 0-1-1h-1" /><path d="M8 14v1a6 6 0 0 0 12 0v-3" /><circle cx="20" cy="10" r="2" /></>),
  leaf: (<><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z" /><path d="M2 21c0-3 1.9-5.4 5.1-6" /></>),
  idBadge: (<><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10.5" r="2.2" /><path d="M5.8 16.5c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4M15 9.5h3M15 13h3" /></>),
  medCross: (<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z" />),
  mapPin: (<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>),
  abc: (<><path d="M2 18 5.5 7h1L10 18M3.2 14.5h5.6" /><path d="M12 7h3.5a2.5 2.5 0 0 1 0 5H12zM12 12h4a3 3 0 0 1 0 6h-4z" /></>),
  notes: (<><path d="M4 4a2 2 0 0 1 2-2h10l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M8 10h8M8 14h8M8 18h5" /></>),
  tag: (<><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" /><circle cx="7" cy="7" r="1.5" /></>),
  shieldOk: (<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>),
  alertCircle: (<><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>),
  briefcase: (<><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>),
  mapFold: (<><path d="M14.1 6 9.9 4 3 7v13l6.9-3 4.2 2L21 16V3z" /><path d="M9.9 4v13M14.1 6v13" /></>),
  hospital: (<><path d="M12 6v4M10 8h4" /><path d="M14 22v-4a2 2 0 0 0-4 0v4" /><path d="M18 22V5l-6-3-6 3v17" /><path d="M18 11h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2" /></>),
  office: (<><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" /></>),
  target: (<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>),
  calendar: (<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" /></>),
  xSquare: (<><rect x="3" y="3" width="18" height="18" rx="3" /><path d="m9 9 6 6M15 9l-6 6" /></>),
  mapIcon: (<><path d="M14.1 4.6a2 2 0 0 0-1.8 0L9.6 6a2 2 0 0 1-1.8 0L4.4 4.3A1 1 0 0 0 3 5.2v12.4a1 1 0 0 0 .6.9l4.2 2.1a2 2 0 0 0 1.8 0l2.7-1.4a2 2 0 0 1 1.8 0l3.4 1.7a1 1 0 0 0 1.4-.9V7.6a1 1 0 0 0-.6-.9z" /><path d="M15 5.8v15M9 3.2v15" /></>),
};

export default function Icon({
  name,
  size = 16,
  strokeWidth = 1.7,
  className,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name] ?? PATHS.building}
    </svg>
  );
}
