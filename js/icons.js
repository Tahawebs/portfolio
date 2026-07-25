// Minimal stroke-icon set (lucide-inspired, hand trimmed) — referenced by key.
const ICONS = {
  calendar: '<path d="M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/>',
  code: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>',
  cart: '<path d="M3 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 7H6"/><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  briefcase: '<rect x="2.5" y="7" width="19" height="13" rx="2"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M2.5 13h19"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  server: '<rect x="2.5" y="3.5" width="19" height="7" rx="1.5"/><rect x="2.5" y="13.5" width="19" height="7" rx="1.5"/><path d="M6.5 7h.01M6.5 17h.01"/>',
  arrowRight: '<path d="M4.5 12h15M13 5.5 19.5 12 13 18.5"/>',
  chevronLeft: '<path d="M15 5 8 12l7 7"/>',
  chevronRight: '<path d="M9 5l7 7-7 7"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6 9 6 9-6"/>',
  linkedin: '<rect x="2.5" y="2.5" width="19" height="19" rx="3"/><path d="M7.5 10.5v6M7.5 7.7v.01M12 16.5v-3.6c0-1.4 1-2.4 2.3-2.4 1.3 0 2.2 1 2.2 2.4v3.6"/>',
  phone: '<path d="M4.5 4.5h4l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v4a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3 6.1 1.5 1.5 0 0 1 4.5 4.5Z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/>',
  play: '<path d="M7 4.2v15.6c0 .8.9 1.3 1.6.9l12.5-7.8c.6-.4.6-1.4 0-1.8L8.6 3.3C7.9 2.9 7 3.4 7 4.2Z"/>'
};

function icon(name, cls) {
  return `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}
