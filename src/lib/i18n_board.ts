/**
 * Generate clear, region-specific empty-state messages for the board.
 * Called from DashboardBoard when candidates.length === 0.
 */
export function boardEmptyMessage(regionName: string | null | undefined, lang: 'sw' | 'en') {
  if (lang === 'en') {
    const base = regionName
      ? `No travelers heading to ${regionName} yet.`
      : 'No travelers heading to your region yet.';
    const hint = 'When they register and choose your region, they will appear here instantly.';
    return { title: base, hint };
  }
  // Swahili — maneno clear, kila mtu aelewe
  const base = regionName
    ? `Hakuna mtu bado anaokuja ${regionName}.`
    : 'Hakuna mtu bado anaokuja mkoni kwako.';
  const hint = 'Watakapojisajili na kuchagua mkoa wako, wataonekana hapa papo hapo.';
  return { title: base, hint };
}

/**
 * Generate region-specific stats-empty message.
 */
export function boardStatsEmptyMessage(regionName: string | null | undefined, lang: 'sw' | 'en') {
  if (lang === 'en') {
    return regionName
      ? `No stats for ${regionName} yet. When travelers register, stats will appear here.`
      : 'No stats yet. When travelers register, stats will appear here.';
  }
  return regionName
    ? `Hakuna takwimu za ${regionName} bado. Wasafiri wanapojisajili, takwimu zitaonekana hapa.`
    : 'Hakuna takwimu bado. Wasafiri wanapojisajili, takwimu zitaonekana hapa.';
}
