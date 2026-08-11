'use client';

/**
 * Sauti ya notification — Web Audio API (hakuna file ya audio inahitajika).
 * Inatumika kwenye dashboard wakati mtu mpya anafika (request feed live).
 *
 * Kila platform inapiga sauti yake kidogo: simu inapata ping ya hali ya juu
 * (high-frequency) ambayo inasikika vizuri hata kwa volume ndogo, desktop
 * inapata chime fupi ya kirafiki.
 */
let _ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!_ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      _ctx = new AC();
    }
    if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
    return _ctx;
  } catch {
    return null;
  }
}

/** Piga sauti ya "mtu mpya amefika" (request feed live). */
export function playArrivalSound(): void {
  const ctx = audioCtx();
  if (!ctx) return;
  const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const now = ctx.currentTime;

  try {
    if (isMobile) {
      // Ping ya juu (1500Hz → 2200Hz) — inasikika vizuri kwenye simu
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(1500, now);
      o.frequency.exponentialRampToValueAtTime(2200, now + 0.12);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      o.start(now);
      o.stop(now + 0.4);
    } else {
      // Chime ya mara mbili (880Hz → 1320Hz) kwenye desktop
      [880, 1320].forEach((freq, i) => {
        const t = now + i * 0.12;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        o.start(t);
        o.stop(t + 0.3);
      });
    }
  } catch {
    // Sauti ni bonus tu — usivunje app kama browser haitaki
  }
}

/** Piga sauti fupi ya ping (toast / arifa nyingine). */
export function playPingSound(): void {
  const ctx = audioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    o.start(now);
    o.stop(now + 0.25);
  } catch {}
}
