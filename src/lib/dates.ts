/**
 * WhatsApp-style date helpers.
 * - dayChipLabel(iso)   → "Leo" | "Jana" | "Jumanne, 08/08/2026" (separator chips)
 * - conversationTime(iso) → today → "14:32", yesterday → "Jana", else "08/08/2026"
 * - messageTime(iso)    → "14:32" for bubbles
 */

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayDiffDays(iso: string | Date): number {
  const d = new Date(iso);
  const today = startOfDay(new Date());
  const that = startOfDay(d);
  return Math.round((today.getTime() - that.getTime()) / 86400000);
}

/** "Leo" / "Jana" / "Jumanne, 08/08/2026" — chat separator chip. */
export function dayChipLabel(iso: string | Date): string {
  const d = new Date(iso);
  const diff = dayDiffDays(d);
  if (diff === 0) return 'Leo';
  if (diff === 1) return 'Jana';
  return d.toLocaleDateString('sw-TZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** WhatsApp list timestamp: today → time, yesterday → "Jana", older → short date. */
export function conversationTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = dayDiffDays(d);
  if (diff === 0) {
    return d.toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff === 1) return 'Jana';
  return d.toLocaleDateString('sw-TZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Bubble timestamp: "14:32". */
export function messageTime(iso: string | Date): string {
  return new Date(iso).toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' });
}
