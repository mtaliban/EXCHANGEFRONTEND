import { describe, it, expect } from 'vitest';
import { parseServerDate, formatClock, isSameServerDay } from '@/lib/dates';

describe('parseServerDate (naive-UTC fix)', () => {
  it('treats naive server datetimes (no tz) as UTC', () => {
    // PyMongo inarudisha naive UTC: "2026-08-11T10:37:30.114000"
    const naive = parseServerDate('2026-08-11T10:37:30.114000');
    const explicit = parseServerDate('2026-08-11T10:37:30.114000Z');
    expect(naive).not.toBeNull();
    expect(explicit).not.toBeNull();
    expect(naive!.getTime()).toBe(explicit!.getTime());
    // Uthibitisho wa kipekee: kama utafasiriwa kama UTC → ISO (kila wakati UTC)
    expect(naive!.toISOString().startsWith('2026-08-11T10:37:30')).toBe(true);
  });

  it('passes through timestamps that already carry a timezone', () => {
    const tz = parseServerDate('2026-08-11T10:37:30.114000+00:00');
    const z = parseServerDate('2026-08-11T10:37:30.114000Z');
    expect(tz!.getTime()).toBe(z!.getTime());
  });

  it('returns null for null/undefined/invalid input', () => {
    expect(parseServerDate(null)).toBeNull();
    expect(parseServerDate(undefined)).toBeNull();
    expect(parseServerDate('')).toBeNull();
    expect(parseServerDate('sio tarehe')).toBeNull();
  });

  it('accepts Date and numeric input', () => {
    const d = new Date('2026-08-11T10:37:30Z');
    expect(parseServerDate(d)!.getTime()).toBe(d.getTime());
    expect(parseServerDate(d.getTime())!.getTime()).toBe(d.getTime());
  });
});

describe('formatClock (saa halisi)', () => {
  it('formats a known timestamp into a clock string', () => {
    const ts = new Date('2026-08-11T10:37:30Z').getTime();
    const out = formatClock(ts, 'en');
    expect(out).toMatch(/^\d{1,2}:\d{2}/); // e.g. "1:37 PM" / "13:37"
  });
});

describe('isSameServerDay', () => {
  it('true for same day, false otherwise', () => {
    expect(isSameServerDay('2026-08-11T10:00:00.000000', '2026-08-11T11:00:00.000000')).toBe(true);
    expect(isSameServerDay('2026-08-11T10:00:00.000000', '2026-08-10T10:00:00.000000')).toBe(false);
  });
});
