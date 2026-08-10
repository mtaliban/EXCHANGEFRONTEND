/** Localized relative time ("dakika 2 zilizopita" / "2 min ago"). */
export function timeAgo(ts: number, lang: 'sw' | 'en'): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 5) return lang === 'sw' ? 'sasa hivi' : 'just now';
  const m = Math.floor(s / 60);
  if (m < 1) return lang === 'sw' ? 'dakika chache zilizopita' : 'less than a minute ago';
  if (m < 60) return lang === 'sw' ? `dakika ${m} zilizopita` : `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === 'sw' ? `saa ${h} zilizopita` : `${h} hr${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return lang === 'sw' ? 'jana' : 'yesterday';
  if (d < 7) return lang === 'sw' ? `siku ${d} zilizopita` : `${d} days ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return lang === 'sw' ? `wiki ${w} zilizopita` : `${w} wk ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return lang === 'sw' ? `miezi ${mo} iliyopita` : `${mo} mo ago`;
  const y = Math.floor(d / 365);
  return lang === 'sw' ? `miaka ${y} iliyopita` : `${y} yr ago`;
}
