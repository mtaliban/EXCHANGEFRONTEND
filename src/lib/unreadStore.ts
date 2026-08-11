'use client';

import { create } from 'zustand';
import { getUnreadCount } from '@/lib/api';

interface UnreadState {
  count: number;
  set: (n: number) => void;
  refresh: () => Promise<void>;
}

/**
 * Shared unread-count store — AppShell (kengele) na NotificationsPage
 * wanasoma/wasaidie count ile ile. Ukisoma arifa kwenye notifications page,
 * kengele inafresha PAPO HAPO (siyo kusubiri urudi dashboard).
 */
export const useUnreadStore = create<UnreadState>((set) => ({
  count: 0,
  set: (n) => set({ count: Math.max(0, n) }),
  refresh: async () => {
    try {
      const d = await getUnreadCount(true); // bypassCache — hesabu halisi
      set({ count: d.unread });
    } catch {
      /* mtandao shida — tulia tu */
    }
  },
}));
