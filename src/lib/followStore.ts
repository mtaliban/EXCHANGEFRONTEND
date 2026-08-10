'use client';

import { create } from 'zustand';
import { getFollowedRegions } from '@/lib/api';

interface FollowState {
  region_ids: number[];
  load: () => Promise<void>;
  set: (ids: number[]) => void;
}

/**
 * Shared store ya "Fuata Mikoa" — nav (dropdown) na DashboardBoard zinasoma
 * mikoa sawa, hivyo ukiongeza mkoa kwenye nav board inabadilika mara moja.
 */
export const useFollowStore = create<FollowState>((set) => ({
  region_ids: [],
  load: async () => {
    try {
      const r = await getFollowedRegions();
      set({ region_ids: r.region_ids });
    } catch {
      /* mtandao shida — tulia tu */
    }
  },
  set: (ids) => set({ region_ids: ids }),
}));
