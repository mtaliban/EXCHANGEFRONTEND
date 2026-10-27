/**
 * Vichwa vya hatua kwa maneno — "Hatua ya Kwanza: ...".
 *
 * Nafasi ya hatua inategemea aina ya idara:
 *  - Afya: hatua 6 (ina hatua ya Wizara)
 *  - Elimu: hatua 5 (ina kituo/shule)
 *  - Idara nyingine (Utumishi wa Umma, Kilimo, Mifugo...): hatua 5,
 *    mkoa + wilaya pekee (hakuna kituo)
 */

export type StepKind =
  | 'identity'
  | 'department'
  | 'ministry'
  | 'cadre'
  | 'station'
  | 'destination';

/** Vituo vilivyopo ni vya AFYA (hospitali) na ELIMU (shule) pekee. */
export function departmentHasFacilities(category?: string): boolean {
  return category === 'health' || category === 'education';
}

const NAMES: Record<StepKind, string> = {
  identity: 'step.identity',
  department: 'step.department',
  ministry: 'step.ministry',
  cadre: 'step.cadre',
  station: 'step.station',
  destination: 'step.destination',
};

/** Nafasi (1..6) ya hatua kwa idara husika. */
export function stepPosition(kind: StepKind, category?: string): number {
  const isHealth = category === 'health';
  switch (kind) {
    case 'identity':
      return 1;
    case 'department':
      return 2;
    case 'ministry':
      return 3;
    case 'cadre':
      return isHealth ? 4 : 3;
    case 'station':
      return isHealth ? 5 : 4;
    case 'destination':
      return isHealth ? 6 : 5;
  }
}

const ORDINALS = ['step.ord1', 'step.ord2', 'step.ord3', 'step.ord4', 'step.ord5', 'step.ord6'];

/**
 * Kichwa cha hatua, mfano "Hatua ya Kwanza: Utambulisho Wako".
 * Idara isiyo na vituo hutumia jina "Mkoa na Wilaya Ulipo Sasa".
 */
export function stepHeading(
  t: (key: string, fallback?: string) => string,
  kind: StepKind,
  data: { category?: string }
): string {
  const position = stepPosition(kind, data.category);
  const nameKey =
    kind === 'station' && !departmentHasFacilities(data.category)
      ? 'step.station_region_district'
      : NAMES[kind];
  return `${t(ORDINALS[position - 1])}: ${t(nameKey)}`;
}
