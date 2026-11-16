"use client";

import { useEffect } from "react";
import { andaaSauti } from "@/lib/useSautiMechi";

/**
 * Mguso wa kwanza wowote kwenye tovuti (Navbar, "Ingia", kitufe chochote)
 * unafungua sauti ya mechi. Kivinjari huruhusu sauti baada ya mguso huo tu;
 * kuanzia hapo marimba inalia yenyewe kila mtikisiko, bila mguso mwingine.
 */
export default function AndaaSauti() {
  useEffect(() => {
    const fungua = () => andaaSauti();
    andaaSauti(); // tengeneza AudioContext mapema (inaanza "suspended")
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
