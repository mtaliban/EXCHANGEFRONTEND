/**
 * Generate clear, region-specific empty-state messages for the board.
 * Called from DashboardBoard when candidates.length === 0.
 */
export function boardEmptyMessage(regionName: string | null | undefined, lang: 'sw' | 'en') {
  if (lang === 'en') {
    const base = regionName
      ? `No one from other regions heading to ${regionName} yet.`
      : 'No one heading to your region yet.';
    const hint = 'Register and choose your region to get started.';
    return { title: base, hint };
  }
  // Swahili — maneno mafupi, rahisi
  const base = regionName
    ? `Hakuna mtu wa mkoa mwingine kuja ${regionName}.`
    : 'Hakuna mtu anaokuja mkoa wako.';
  const hint = 'Jisajili na uchague mkoa wako ili uanze.';
  return { title: base, hint };
}

/**
 * Generate region-specific stats-empty message.
 */
export function boardStatsEmptyMessage(regionName: string | null | undefined, lang: 'sw' | 'en') {
  if (lang === 'en') {
    return regionName
      ? `No stats for ${regionName} yet.`
      : 'No stats yet.';
  }
  return regionName
    ? `Hakuna takwimu za ${regionName} bado.`
    : 'Hakuna takwimu bado.';
}
