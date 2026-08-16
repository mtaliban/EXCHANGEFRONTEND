'use client';

import { useEffect, useState } from 'react';
import { onDataChanged, dataVersion } from './api';

/**
 * EVENT-DRIVEN DATA: inarudisha version counter inayoongezeka kila data ya
 * reference (masomo/kada/mikoa/wilaya/idara/vituo) inapobadilishwa na mtu
 * yeyote — kwenye tab hii (mutation), tab nyingine (storage event), au
 * session nyingine (SSE data.* events). Weka thamani yake kwenye dependency
 * ya fetch effect: kila mabadiliko → refetch PAPO HAPO, hakuna refresh.
 *
 * Mifano: SubjectPicker, wizard ya usajili (Step2Cadre), profile — zote
 * zinaitisha hii na kujipakia upya data FRESH.
 */
export function useDataVersion(): number {
  const [v, setV] = useState(dataVersion());
  useEffect(() => onDataChanged(() => setV(dataVersion())), []);
  return v;
}
