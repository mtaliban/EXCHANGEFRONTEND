// Majina rasmi ya idara (category kutoka DB inaweza kuwa ndogo, mf. "kilimo")
const FULL: Record<string, string> = {
  education: "Elimu",
  health: "Afya",
  kilimo: "Kilimo na Ufugaji",
  agriculture: "Kilimo na Ufugaji",
  ufugaji: "Kilimo na Ufugaji",
  watumishi_wa_umma: "Watumishi wa Umma",
  umma: "Watumishi wa Umma",
  public: "Watumishi wa Umma",
};

const SHORT: Record<string, string> = {
  education: "Elimu",
  health: "Afya",
  kilimo: "Kilimo",
  agriculture: "Kilimo",
  ufugaji: "Kilimo",
  watumishi_wa_umma: "Umma",
  umma: "Umma",
  public: "Umma",
};

const key = (c?: string) => (c || "").trim().toLowerCase();

const title = (c: string) => (c ? c[0].toUpperCase() + c.slice(1) : "—");

/** Jina kamili la idara: "Kilimo na Ufugaji" */
export function deptFull(category?: string): string {
  const k = key(category);
  return FULL[k] ?? title(k);
}

/** Jina fupi kwa muhtasari: "Kilimo" */
export function deptShort(category?: string): string {
  const k = key(category);
  return SHORT[k] ?? title(k);
}
