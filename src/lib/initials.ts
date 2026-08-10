/**
 * Herufi ya kwanza ya jina kwa avatar — inaondoa nafasi za mbele/mwisho
 * ili "HAMISI SELEMANI HAMISI" ionyeshe "H" (sio nafasi, sio herufi ya
 * jina la mwisho). Ikikosekana inarudisha "U" (User).
 */
export function getInitial(name?: string | null): string {
  const first = (name || '').trim().charAt(0);
  return first ? first.toUpperCase() : 'U';
}
