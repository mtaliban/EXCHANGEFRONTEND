"use client";

import { useEffect, useRef } from "react";

/* ---- Namba za mtikisiko wa kadi ya mechi (`.tripWobble` kwenye app.module.css) ----
 * animation: wobble 4s … infinite        → mzunguko mmoja = 4000ms
 * @keyframes wobble: translateX ya kwanza isiyo 0 iko 67%  → 4000 × 0.67 = 2680ms
 */
const MZUNGUKO_MS = 4000;
const ANZA_MS = 2680;

/* ================= SAUTI 5 (MARIMBA) – inatengenezwa na code, HAKUNA faili ================= */
let ctx: AudioContext | null = null;
let ameGusa = false;
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

/** Sauti 5: noti 4 zinazopanda – C5, E5, G5, C6 (kila moja baada ya sekunde 0.11) */
function marimba() {
  const c = ctx;
  if (!c) return;
  const t = c.currentTime + 0.01;
  const sauti = c.createGain();
  sauti.gain.value = 0.22; // ukubwa wa sauti (0.1 – 0.4)
  sauti.connect(c.destination);
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => noti(c, f, t + i * 0.11, sauti));
}

function cheza() {
  if (!ameGusa || document.hidden || !ctx) return; // sharti la kivinjari + ukurasa uonekane
  const sasa = Date.now();
  if (sasa - mwishoKulia < MZUNGUKO_MS * 0.8) return; // isilie mara mbili kwa mtikisiko mmoja
  mwishoKulia = sasa;
  if (ctx.state === "suspended") void ctx.resume();
  marimba();
}

/** Weka ref hii kwenye kisanduku chenye mtikisiko. Sauti inalia kila mtikisiko unapoanza. */
export function useSautiMechi<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    // Vivinjari haviruhusu sauti mpaka mtu aguse ukurasa mara moja (Ingia tayari inahesabika)
    const ruhusu = () => {
      ameGusa = true;
      if (!ctx) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AC) ctx = new AC();
      }
      if (ctx && ctx.state === "suspended") void ctx.resume();
    };
    window.addEventListener("pointerdown", ruhusu, { once: true });
    window.addEventListener("keydown", ruhusu, { once: true });

    const el = ref.current;
    if (!el) return;
    let saa: ReturnType<typeof setTimeout> | undefined;
    // Kila mzunguko mpya wa mtikisiko unapoanza → subiri mpaka mtikisiko wenyewe uanze → lia
    const kwaMzunguko = () => {
      clearTimeout(saa);
      saa = setTimeout(cheza, ANZA_MS);
    };
    el.addEventListener("animationstart", kwaMzunguko);
    el.addEventListener("animationiteration", kwaMzunguko);
    return () => {
      el.removeEventListener("animationstart", kwaMzunguko);
      el.removeEventListener("animationiteration", kwaMzunguko);
      clearTimeout(saa);
      window.removeEventListener("pointerdown", ruhusu);
      window.removeEventListener("keydown", ruhusu);
    };
  }, []);

  return ref;
}
