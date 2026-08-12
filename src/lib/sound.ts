'use client';

/**
 * Sauti ya notification — Web Audio API (hakuna file ya audio inahitajika).
 * Inatumika kwenye dashboard wakati mtu mpya anafika (request feed live).
 *
 * Kila platform inapiga sauti yake kidogo: simu inapata ping ya hali ya juu
 * (high-frequency) + vibration, desktop inapata chime fupi ya kirafiki.
 *
 * TATIZO LA KISASI (iOS/Android): AudioContext inabaki 'suspended' hadi
 * mtumiaji aguse skrini — na resume ni ASYNC. Tukipanga sauti kabla resume
 * kukamilika, sauti haipigi kabisa. Suluhisho: readyCtx() inasubiri resume
 * kukamilika (Promise) kabla ya kupanga oscillators.
 */
let _ctx: AudioContext | null = null;
let _resumePromise: Promise<AudioContext | null> | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!_ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      _ctx = new AC();
    }
    return _ctx;
  } catch {
    return null;
  }
}

/** Hakikisha context iko RUNNING — inasubiri resume (iOS) kukamilika. */
function readyCtx(): Promise<AudioContext | null> {
  const ctx = getCtx();
  if (!ctx) return Promise.resolve(null);
  if (ctx.state === 'running') return Promise.resolve(ctx);
  if (ctx.state === 'suspended') {
    if (!_resumePromise) {
      _resumePromise = ctx
        .resume()
        .then(() => ctx)
        .catch(() => null)
        .finally(() => { _resumePromise = null; });
    }
    return _resumePromise;
  }
  return Promise.resolve(ctx);
}

// Autoplay policy ya browsers: AudioContext inafunguliwa TU baada ya mtumiaji
// kugusa/bofya. WS event (mtu mpya anafika) siyo gesture → bila hii, sauti
// haipigi kabisa. Tunafunga context kwenye GESTURE YA KWANZA yoyote.
if (typeof window !== 'undefined') {
  const unlock = () => { getCtx(); };
  const opts = { once: true, passive: true } as AddEventListenerOptions;
  window.addEventListener('pointerdown', unlock, opts);
  window.addEventListener('keydown', unlock, opts);
  window.addEventListener('touchstart', unlock, opts);
  window.addEventListener('click', unlock, opts);
}

/** Vibration (simu tu) — maoni ya kugusa pamoja na sauti. */
function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    /* si muhimu kwenye desktop */
  }
}

/** Je sauti imewashwa? (hifadhi kwenye localStorage — toggle ya dashboard 🔊/🔇) */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem('kv_sound') !== 'off';
  } catch {
    return true;
  }
}

/** Piga sauti ya "mtu mpya amefika" (request feed live). */
export function playArrivalSound(): void {
  readyCtx().then((ctx) => {
    if (!ctx) return;
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    const now = ctx.currentTime;
    try {
      if (isMobile) {
        vibrate([60, 40, 60]); // simu: vibration + ping ya juu (inapaswa kusikika!)
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(1500, now);
        o.frequency.exponentialRampToValueAtTime(2200, now + 0.12);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        o.start(now);
        o.stop(now + 0.45);
      } else {
        // Chime ya mara mbili (880Hz → 1320Hz) kwenye desktop — sauti kubwa kidogo
        [880, 1320].forEach((freq, i) => {
          const t = now + i * 0.12;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = 'sine';
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
          o.start(t);
          o.stop(t + 0.35);
        });
      }
    } catch {
      // Sauti ni bonus tu — usivunje app kama browser haitaki
    }
  });
}

/** Piga sauti fupi ya ping (toast / arifa nyingine). */
export function playPingSound(): void {
  readyCtx().then((ctx) => {
    if (!ctx) return;
    vibrate(40);
    const now = ctx.currentTime;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      o.start(now);
      o.stop(now + 0.3);
    } catch {}
  });
}
