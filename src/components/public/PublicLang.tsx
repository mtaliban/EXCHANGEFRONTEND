"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type PubLang = "sw" | "en";

const Ctx = createContext<{ lang: PubLang; setLang: (l: PubLang) => void }>({
  lang: "sw",
  setLang: () => {},
});

const KEY = "kv_pub_lang";

export function PublicLangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<PubLang>("sw");

  useEffect(() => {
    const v = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    if (v === "en" || v === "sw") setLangState(v);
  }, []);

  const setLang = useCallback((l: PubLang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(KEY, l);
    } catch {}
  }, []);

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export function usePublicLang() {
  return useContext(Ctx);
}
