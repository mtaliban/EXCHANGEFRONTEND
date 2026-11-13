// =========================================================
// MECHI ("Inalingana") — sheria za kulinganisha mtumiaji na mtumishi
//   Shule ya Msingi: masomo hayazingatiwi (100 / 90 / 80)
//   Sekondari: lazima somo 1 lilingane (mahali max 70 + masomo max 30)
// Sheria za ngazi zote: mkoa pande zote mbili.
// =========================================================

export type Mahali = { region_name?: string; district_name?: string };

export type Mimi = {
  ngazi: "msingi" | "sekondari";
  mkoa: string;
  wilaya?: string;
  malengo: Mahali[];
  masomo: string[];
};

export type Mtu = {
  current_station?: Mahali;
  destinations?: Mahali[];
  masomo?: string[];
};

export type Matokeo = { pct: number; sababu: string; masomoSawa: string[] };

const norm = (v?: string) => (v || "").trim().toLowerCase();

/** Wilaya inahesabika imelingana kama upande mmoja haujaweka wilaya. */
function wilayaSawa(a?: string, b?: string) {
  if (!norm(a) || !norm(b)) return true;
  return norm(a) === norm(b);
}

function wilayaZilizotajwa(a?: string, b?: string) {
  return !!norm(a) && !!norm(b);
}

export function mechiMsingi(me: Mimi, t: Mtu, goal: Mahali, dest: Mahali): Matokeo {
  const from = t.current_station || {};
  let pct = 80;
  let sababu = "Mkoa unalingana, wilaya tofauti";

  const a = !wilayaZilizotajwa(goal.district_name, from.district_name) || wilayaSawa(goal.district_name, from.district_name);
  const b = !wilayaZilizotajwa(me.wilaya, dest.district_name) || wilayaSawa(me.wilaya, dest.district_name);
  const sawa = Number(a) + Number(b);

  if (sawa === 2) {
    pct = 100;
    sababu = "Mkoa na wilaya zinalingana pande zote mbili";
  } else if (sawa === 1) {
    pct = 90;
    sababu = "Mkoa unalingana, wilaya inalingana upande mmoja";
  }

  return { pct, sababu, masomoSawa: [] };
}

export function mechiSekondari(me: Mimi, t: Mtu, goal: Mahali, dest: Mahali): Matokeo | null {
  const from = t.current_station || {};
  const yangu = me.masomo.map(norm);
  const yake = (t.masomo || []).map(norm);
  const masomoSawa = (t.masomo || []).filter((m) => yangu.includes(norm(m)));

  // Sekondari: hakuna somo linalolingana => si mechi
  if (masomoSawa.length === 0 || yake.length === 0) return null;

  const a = !wilayaZilizotajwa(goal.district_name, from.district_name) || wilayaSawa(goal.district_name, from.district_name);
  const b = !wilayaZilizotajwa(me.wilaya, dest.district_name) || wilayaSawa(me.wilaya, dest.district_name);

  const mahali = 50 + 10 * Number(a) + 10 * Number(b);
  const masomo = masomoSawa.length >= 2 ? 30 : 15;

  return {
    pct: Math.min(100, mahali + masomo),
    sababu: `${masomoSawa.length} somo ${masomoSawa.length === 1 ? "linalingana" : "yanaligana"}`,
    masomoSawa,
  };
}

/**
 * Inarudisha mechi au null kama mtu huyu halingani nawe.
 * Sharti la ngazi zote: anatoka mkoa unaotaka kwenda NA anataka kuja mkoa ulipo.
 */
export function mechi(me: Mimi, t: Mtu): Matokeo | null {
  const from = t.current_station || {};
  const myRegion = norm(me.mkoa);
  if (!myRegion || !norm(from.region_name)) return null;

  // (1) anatoka mkoa mmoja wa malengo yangu
  const goal = (me.malengo || []).find((m) => norm(m.region_name) === norm(from.region_name));
  if (!goal) return null;

  // (2) anataka kuja mkoa ulipo
  const dest = (t.destinations || []).find((d) => norm(d.region_name) === myRegion);
  if (!dest) return null;

  return me.ngazi === "sekondari"
    ? mechiSekondari(me, t, goal, dest)
    : mechiMsingi(me, t, goal, dest);
}

/** Ngazi kutoka kada: "Mwalimu wa Elimu ya Sekondari" => sekondari */
export function ngaziYa(kada?: string, masomo?: string[]): "msingi" | "sekondari" {
  const k = norm(kada);
  if (k.includes("sekondari")) return "sekondari";
  if (k.includes("msingi")) return "msingi";
  // Idara za afya na nyingine: masomo hayazingatiwi
  return (masomo || []).length > 0 && k.includes("sekondari") ? "sekondari" : "msingi";
}
