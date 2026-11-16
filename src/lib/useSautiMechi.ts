"use client";

import { useEffect, useRef } from "react";

/* ---- Namba za mtikisiko wa kadi ya mechi (`.tripWobble` kwenye app.module.css) ----
 * animation: wobble 4s … infinite  → mzunguko mmoja = 4000ms
 * @keyframes wobble: translateX ya kwanza isiyo 0 iko 67% → 4000 × 0.67 = 2680ms
 */
const MZUNGUKO_MS = 4000;
const ANZA_MS = 2680;

/* ---- Faili za sauti - zinawekwa kwenye public/ ----
 * 1) /sauti-mechi.mp3  – Sauti 10 (upepo + kengele)
 * 2) /sauti-metch.mp3  – sauti ya awali (akiba)
 * Likikosekana lolote, code inarudi kwenye marimba ya Web Audio.
 * Njia haziandiki "public/" – Next.js inaanza na "/". */
const FAILI = ["/sauti-mechi.mp3", "/sauti-metch.mp3"];

/* Sauti: ukubwa kamili + kupanda taratibu. Hakuna kuunganisha kwenye Web Audio
 * kwa sababu hiyo inaweza kunyamazisha sauti kabisa AudioContext ikiwa haitoi sauti. */
const UKUBWA_WA_SAUTI = 1; // 0.0 – 1.0 (kiwango cha juu cha <audio>)
const KUPANDA_MS = 700; // sauti inapanda 0 → kamili kwa muda huu (fade-in)

let ctx: AudioContext | null = null;
let sautiEl: HTMLAudioElement | null = null;
let filiIdx = 0;
let sautiHaipo = false;
let amefunguliwa = false;
let rampSaa: ReturnType<typeof setInterval> | undefined;
let mwishoKulia = 0;

/* ================= MARIMBA YA AKIBA (Web Audio) ================= */
function noti(c: AudioContext, freq: number, anza: number, sauti: GainNode) {
  const kuu = c.createOscillator();
  kuu.type = "sine";
  kuu.frequency.value = freq;
  const juu = c.createOscillator();
  juu.type = "sine";
  juu.frequency.value = freq * 4;
  const gKuu = c.createGain();
  const gJuu = c.createGain();
  gKuu.gain.setValueAtTime(0, anza);
  gKuu.gain.linearRampToValueAtTime(1, anza + 0.005);
  gKuu.gain.setTargetAtTime(0, anza + 0.005, 0.083);
  gJuu.gain.setValueAtTime(0, anza);
  gJuu.gain.linearRampToValueAtTime(0.35, anza + 0.004);
  gJuu.gain.setTargetAtTime(0, anza + 0.004, 0.024);
  kuu.connect(gKuu).connect(sauti);
  juu.connect(gJuu).connect(sauti);
  kuu.start(anza);
  juu.start(anza);
  kuu.stop(anza + 0.6);
  juu.stop(anza + 0.6);
}

function marimba() {
  const c = ctx;
  if (!c) return;
  const t = c.currentTime + 0.01;
  const sauti = c.createGain();
  sauti.gain.value = 0.32;
  sauti.connect(c.destination);
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => noti(c, f, t + i * 0.11, sauti));
}

/* ================= KICHEZA CHA FAILI ================= */
function kianzishe(): boolean {
  if (ctx) return true;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return false;
  try {
    ctx = new AC();
  } catch {
    return false;
  }
  return true;
}

function tayarishaFaili() {
  if (sautiEl || sautiHaipo || typeof window === "undefined") return;
  const url = FAILI[filiIdx];
  if (!url) {
    sautiHaipo = true;
    return;
  }
  try {
    const el = new Audio(url);
    el.preload = "auto";
    el.muted = false;
    el.volume = UKUBWA_WA_SAUTI;
    el.addEventListener("error", () => {
      sautiEl = null;
      filiIdx += 1;
      tayarishaFaili();
    });
    sautiEl = el;
  } catch {
    sautiHaipo = true;
  }
}

/** Cheza faili kwa kupanda taratibu: volume 0 → kamili ndani ya KUPANDA_MS. */
function chezaFaili(el: HTMLAudioElement) {
  clearInterval(rampSaa);
  el.muted = false;
  el.volume = 0;
  try {
    el.currentTime = 0;
  } catch {
    /* bado haijapakiwa – play() itaanza ikisha tayari */
  }

  const anzaKupanda = () => {
    const hatua = 40;
    const nyongeza = UKUBWA_WA_SAUTI / (KUPANDA_MS / hatua);
    let v = 0;
    clearInterval(rampSaa);
    rampSaa = setInterval(() => {
      v = Math.min(UKUBWA_WA_SAUTI, v + nyongeza);
      el.volume = v;
      if (v >= UKUBWA_WA_SAUTI) clearInterval(rampSaa);
    }, hatua);
  };

  let p: Promise<void> | undefined;
  try {
    p = el.play();
  } catch {
    el.volume = UKUBWA_WA_SAUTI;
    return;
  }
  if (p && typeof p.then === "function") {
    p.then(anzaKupanda).catch(() => {
      /* Ikizuiwa (autoplay): rudisha ukubwa ili mtikisiko ujao usikute volume 0 */
      el.volume = UKUBWA_WA_SAUTI;
    });
  } else {
    anzaKupanda();
  }
}

/**
 * Fungua sauti ya tovuti hii. Inaitwa kwenye mguso WA KWANZA wowote wa ukurasa
 * (Navbar, "Ingia", kitufe chochote) – kivinjari huruhusu sauti baada ya hapo tu.
 */
export function andaaSauti() {
  tayarishaFaili();
  if (!kianzishe() || !ctx) return;
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  /* Kufungua kicheza mara MOJA tu (iOS); baadaye hatuigusi sauti inayolia */
  if (amefunguliwa || !sautiEl) return;
  amefunguliwa = true;
  const ukubwa = sautiEl.volume;
  sautiEl.volume = 0;
  sautiEl
    .play()
    .then(() => {
      sautiEl?.pause();
      if (sautiEl) {
        sautiEl.currentTime = 0;
        sautiEl.volume = ukubwa;
      }
    })
    .catch(() => {
      if (sautiEl) sautiEl.volume = ukubwa;
    });
}

function cheza() {
  if (document.hidden) return; // tab nyingine / skrini imezimwa
  const sasa = Date.now();
  if (sasa - mwishoKulia < MZUNGUKO_MS * 0.8) return; // isilie mara mbili kwa mtikisiko mmoja
  mwishoKulia = sasa;

  /* 1) Faili la sauti likiwa lipo */
  tayarishaFaili();
  if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => {});
  if (sautiEl && !sautiHaipo) {
    chezaFaili(sautiEl);
    return;
  }

  /* 2) Marimba ya akiba (Web Audio) */
  if (!kianzishe() || !ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume().then(marimba).catch(() => {});
    return;
  }
  marimba();
}

/**
 * Muda hadi mtikisiko ujao uanze – kutoka saa ya animation yenyewe (si kubahatisha).
 * Hapa HATUTAFUTI jina la `@keyframes`: CSS Modules hupanga upya majina hayo
 * (mf. `wobble` inakuwa `wobble__a1b2c`), kwa hiyo tunatambua mtikisiko kwa
 * MUDA wake (4000ms) na kwa kuwa unajirudia (infinite).
 */
function delayHadiMtikisiko(el: HTMLElement): number | null {
  const anims = el.getAnimations() as CSSAnimation[];
  if (!anims.length) return null; // kisanduku hiki hakina mtikisiko
  const wob =
    anims.find((a) => {
      const dur = a.effect?.getComputedTiming?.().duration;
      return typeof dur === "number" && Math.abs(dur - MZUNGUKO_MS) < 60;
    }) ?? anims[0];
  if (!wob) return null;
  const t = Number(wob.currentTime ?? 0) % MZUNGUKO_MS;
  return (ANZA_MS - t + MZUNGUKO_MS) % MZUNGUKO_MS;
}

/** Weka ref hii kwenye kisanduku chenye mtikisiko. Sauti inalia kila mtikisiko unapoanza. */
export function useSautiMechi<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    /* Kama mtumiaji alishagusa ukurasa kabla ya kadi hii kupakiwa (mf. "Ingia"),
     * tunafungua sauti mara moja – hakuna mguso mpya unaohitajika. */
    const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (ua?.hasBeenActive) andaaSauti();

    const el = ref.current;
    if (!el) return;

    let saa: ReturnType<typeof setTimeout> | undefined;
    /* Ratiba inayojiendea: kila mzunguko inahesabu muda hadi mtikisiko ujao kutoka
     * saa ya animation, kisha inalia. Hivyo sauti inalia kila mtikisiko, hata kama
     * `animationstart` ilitokea kabla ya kadi kusikiliza. */
    const ratiba = () => {
      clearTimeout(saa);
      const d = delayHadiMtikisiko(el);
      if (d === null) return; // hakuna mtikisiko – hakuna sauti
      saa = setTimeout(
        () => {
          cheza();
          ratiba();
        },
        d || MZUNGUKO_MS,
      );
    };
    ratiba();
    const kwaMzunguko = () => ratiba();
    el.addEventListener("animationstart", kwaMzunguko);
    el.addEventListener("animationiteration", kwaMzunguko);

    return () => {
      el.removeEventListener("animationstart", kwaMzunguko);
      el.removeEventListener("animationiteration", kwaMzunguko);
      clearTimeout(saa);
    };
  }, []);

  return ref;
}
