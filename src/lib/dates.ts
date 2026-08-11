/**
 * WhatsApp-style date helpers.
 * - dayChipLabel(iso)   → "Leo" | "Jana" | "Jumanne, 08/08/2026" (separator chips)
 * - conversationTime(iso) → today → "14:32", yesterday → "Jana", else "08/08/2026"
 * - messageTime(iso)    → "14:32" for bubbles
 *
 * MUHIMU: PyMongo inarudisha datetimes za UTC bila timezone (naive) — kwa hiyo
 * FastAPI inazisafirisha kama "2026-08-11T10:37:30.114000" (hakuna Z/+00:00).
 * `new Date(...)` kwenye browser inafasiri hiyo kama muda wa LOCAL → kwa
 * Tanzania (UTC+3) kila kitu kinaonekana saa 3 ZAIDI kuliko ilivyo ("3hr"!).
 * Tumia `parseServerDate()` DAIMA kwa timestamps zozote zinazotoka kwa server.
 */

/** Parse timestamp kutoka kwa backend: naive (bila tz) → treat as UTC. */
export function parseServerDate(v: string | Date | number | null | undefined): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  const s = String(v).trim();
  if (!s) return null;
  // Kama tayari ina timezone (Z au ±hh:mm) → tumia kama ilivyo.
  const hasTz = /(Z|[+-]\d{2}:?\d{2})\s*$/i.test(s);
  if (hasTz) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  // Tarehe tu ("2026-08-11") → ongeza muda wa usiku; datetimes → Z (UTC).
  const iso = s.length === 10 ? `${s}T00:00:00Z` : `${s}Z`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayDiffDays(iso: string | Date | null | undefined): number {
  const d = parseServerDate(iso);
  if (!d) return Infinity;
  const today = startOfDay(new Date());
  const that = startOfDay(d);
  return Math.round((today.getTime() - that.getTime()) / 86400000);
}

/** "Leo" / "Jana" / "Jumanne, 08/08/2026" — chat separator chip. */
export function dayChipLabel(iso: string | Date): string {
  const d = parseServerDate(iso);
  if (!d) return '';
  const diff = dayDiffDays(d);
  if (diff === 0) return 'Leo';
  if (diff === 1) return 'Jana';
  return d.toLocaleDateString('sw-TZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** WhatsApp list timestamp: today → time, yesterday → "Jana", older → short date. */
export function conversationTime(iso?: string | null): string {
  if (!iso) return '';
  const d = parseServerDate(iso);
  if (!d) return '';
  const diff = dayDiffDays(d);
  if (diff === 0) {
    return d.toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff === 1) return 'Jana';
  return d.toLocaleDateString('sw-TZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Bubble timestamp: "14:32". */
export function messageTime(iso: string | Date): string {
  const d = parseServerDate(iso);
  if (!d) return '';
  return d.toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' });
}

/** Saa halisi ("10:45 AM" / "10:45") — kwa cards; siku ya kale ina tarehe pia. */
export function formatClock(ts: number, lang: 'sw' | 'en'): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  const locale = lang === 'sw' ? 'sw-TZ' : 'en-US';
  const clock = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const today = startOfDay(new Date()).getTime();
  const sameDay = startOfDay(d).getTime() === today;
  if (sameDay) return clock;
  const date = d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return `${date}, ${clock}`;
}

/** Je timestamps mbili ziko siku moja? (kwa day separators za chat) */
export function isSameServerDay(a: string | Date | null | undefined, b: string | Date | null | undefined): boolean {
  const da = parseServerDate(a);
  const db = parseServerDate(b);
  if (!da || !db) return false;
  return da.toDateString() === db.toDateString();
}
