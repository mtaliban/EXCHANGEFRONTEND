"use client";

import { useEffect } from "react";
import { andaaSauti } from "@/lib/useSautiMechi";

/**
 * Sauti ya mechi (Sauti 10) – haionekani.
 *
 * Mguso wa kwanza wowote kwenye tovuti (Navbar, "Ingia", kitufe chochote)
 * unafungua sauti; kuanzia hapo `/sauti-mechi.mp3` inalia yenyewe kila
 * kisanduku cha Kutoka/Anataka kinapotikisika.
 *
 * Kivinjari huruhusu sauti baada ya mguso mmoja tu kwa kila kikao cha ukurasa;
 * hilo ni sharti la kivinjari, haliwezi kuepukwa na code.
 */
export default function SautiMechi() {
  useEffect(() => {
    const fungua = () => andaaSauti();
    andaaSauti(); // tengeneza kicheza mapema (kinasubiri mguso kuanza)
    window.addEventListener("pointerdown", fungua, { passive: true });
    window.addEventListener("keydown", fungua);
    window.addEventListener("touchstart", fungua, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", fungua);
      window.removeEventListener("keydown", fungua);
      window.removeEventListener("touchstart", fungua);
    };
  }, []);
  return null;
}
