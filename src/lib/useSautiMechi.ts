"use client";

import { useEffect, useRef } from "react";

/* ---- Namba za mtikisiko wa kadi ya mechi (`.tripWobble` kwenye app.module.css) ----
 * animation: wobble 4s … infinite        → mzunguko mmoja = 4000ms
 * @keyframes wobble: translateX ya kwanza isiyo 0 iko 61%? Hapana — keyframes zetu
 * zinaanza 67%, kwa hiyo 4000 × 0.67 = 2680ms (si 2440ms).
 * (`getAnimations()` inathibitisha muda halisi kila mzunguko.)
 */
const MZUNGUKO_MS = 4000;
const ANZA_MS = 2680;

/* ---- Faili za sauti - zinawekwa kwenye public/ ----
 * 1) /sauti-mechi.mp3  – Sauti 10 (upepo + kengele)
 * 2) /sauti-metch.mp3  – Sauti 5 ya awali (akiba)
 * Likikosekana lolote, code inarudi kwenye marimba ya Web Audio (hakuna kosa
 * linaloonekana kwa mtumiaji). Njia haziandiki "public/" – Next.js inaanza na "/". */
const FAILI = ["/sauti-mechi.mp3", "/sauti-metch.mp3"];
const UKUBWA_WA_SAUTI = 0.7; // 0.0 – 1.0
let sautiEl: HTMLAudioElement | null = null;
let filiIdx = 0;
let sautiHaipo = false;

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
    el.volume = UKUBWA_WA_SAUTI;
    /* Faili halipo / halipatikani → jaribu linalofuata, hatimaye marimba ya akiba */
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

/* ================= SAUTI 5 (MARIMBA) – inatengenezwa na code, HAKUNA faili ================= */
let ctx: AudioContext | null = null;
let mwishoKulia = 0;

/** Noti moja ya marimba: sauti kuu + mlio mdogo wa juu unaopotea haraka (ndio "mbao") */
function noti(c: AudioContext, freq: number, anza: number, sauti: GainNode) {
  const kuu = c.createOscillator();
  kuu.type = "sine";
  kuu.frequency.value = freq;
  const juu = c.createOscillator();
  juu.type = "sine";
  juu.frequency.value = freq * 4;
  const gKuu = c.createGain();
  const gJuu = c.createGain();
  // inaingia haraka (ms 5), kisha inafifia taratibu
  gKuu.gain.setValueAtTime(0, anza);
  gKuu.gain.linearRampToValueAtTime(1, anza + 0.005);
  gKuu.gain.setTargetAtTime(0, anza + 0.005, 0.083); // inafifia ndani ya ~0.4s
  gJuu.gain.setValueAtTime(0, anza);
  gJuu.gain.linearRampToValueAtTime(0.35, anza + 0.004);
  gJuu.gain.setTargetAtTime(0, anza + 0.004, 0.024); // mlio wa mbao unapotea haraka
  kuu.connect(gKuu).connect(sauti);
  juu.connect(gJuu).connect(sauti);
  kuu.start(anza);
  juu.start(anza);
  kuu.stop(anza + 0.6);
  juu.stop(anza + 0.6);
}

/** Marimba ya akiba: noti 4 zinazopanda – C5, E5, G5, C6 (kila moja baada ya sekunde 0.11) */
function marimba() {
  const c = ctx;
  if (!c) return;
  const t = c.currentTime + 0.01;
  const sauti = c.createGain();
  sauti.gain.value = 0.22; // ukubwa wa sauti (0.1 – 0.4)
  sauti.connect(c.destination);
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => noti(c, f, t + i * 0.11, sauti));
}

/** Tengeneza AudioContext mara moja (haitoi sauti yenyewe). */
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

/**
 * Fungua sauti ya tovuti hii. Inaitwa kwenye mguso WA KWANZA wowote wa ukurasa
 * (Navbar, "Ingia", kitufe chochote) – kivinjari huruhusu sauti baada ya hapo tu.
 */
export function andaaSauti() {
  /* Faili la mp3: kicheza kimoja tu, kinachotumika tena kila mtikisiko */
  tayarishaFaili();
  if (sautiEl) {
    sautiEl
      .play()
      .then(() => {
        sautiEl?.pause();
        if (sautiEl) sautiEl.currentTime = 0;
      })
      .catch(() => {});
  }
  /* Marimba ya akiba (Web Audio) */
  if (!kianzishe() || !ctx) return;
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
}

function cheza() {
  if (document.hidden) return; // tab nyingine / skrini imezimwa
  const sasa = Date.now();
  if (sasa - mwishoKulia < MZUNGUKO_MS * 0.8) return; // isilie mara mbili kwa mtikisiko mmoja
  mwishoKulia = sasa;

  /* 1) Faili la mp3 likiwa lipo */
  tayarishaFaili();
  if (sautiEl && !sautiHaipo) {
    try {
      sautiEl.currentTime = 0;
      void sautiEl.play().catch(() => {});
      return;
    } catch {
      /* linaendelea kwenye marimba ya akiba */
    }
  }

  /* 2) Marimba ya akiba (Web Audio) */
  if (!kianzishe() || !ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume().then(marimba).catch(() => {});
    return;
  }
  marimba();
}

/** Muda hadi mtikisiko ujao uanze – kutoka saa ya animation yenyewe (si kubahatisha). */
function delayHadiMtikisiko(el: HTMLElement): number | null {
  const wob = el
    .getAnimations()
    .find((a) => (a as CSSAnimation).animationName === "wobble") as CSSAnimation | undefined;
  if (!wob) return null; // kisanduku hiki hakina mtikisiko
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
