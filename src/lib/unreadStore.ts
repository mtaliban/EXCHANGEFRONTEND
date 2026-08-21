'use client';

import { create } from 'zustand';
import { getNotifications, markAllNotificationsRead, bustGetCache } from '@/lib/api';
import { notificationRoute } from '@/lib/notifications';

/**
 * Route-based unread store — kila menu item ina count yake.
 *
 * Flow:
 *   1. Notification mpya inafika (WS) → notificationRoute() inapata route
 *      → count ya route ile inaongezeka → badge inaonekana kwenye menu.
 *   2. Mtumiaji anafungua page ya route ile → count inatoweka + notification
 *      zinasomwa backend (read=True) → badge inaondoka NA HAITORUDI tena.
 *   3. Mtumiaji yupo offline → anapata online → refresh() inapata notifications
 *      zote na kuhesabu kwa route → badges zinaonekana papo hapo.
 */

interface RouteUnreadState {
  /** Route → idadi ya unread notifications zinazopelekea kwenye route hiyo */
  counts: Record<string, number>;
  /** Ondoa count ya route moja (mtu amefungua page) + soma backend */
  clear: (route: string) => void;
  /** Ongeza 1 kwa route (notification mpya imeshafika) */
  bump: (route: string) => void;
  /** Pata notifications zote na hesabu kwa route (initial load + offline recovery) */
  refresh: () => Promise<void>;
}

export const useUnreadStore = create<RouteUnreadState>((set, get) => ({
  counts: {},

  clear: (route) => {
    const c = { ...get().counts };
    delete c[route];
    set({ counts: c });
    // Soma backend pia — notifications zisirudi baada ya login
    bustGetCache();
    markAllNotificationsRead().catch(() => {});
  },

  bump: (route) => {
    const c = { ...get().counts };
    c[route] = (c[route] || 0) + 1;
    set({ counts: c });
  },

  refresh: async () => {
    try {
      const data = await getNotifications(100, true);
      const counts: Record<string, number> = {};
      for (const n of data.notifications) {
        if (n.read) continue;
        // Tumia notificationRoute() kuchanganya na isAdmin —
        // DEFAULT isAdmin = false (regular user).
        const route = notificationRoute(n.type, n.data, false);
        // Weka route kama key — tusijumuishe 'tel:' routes
        if (route.startsWith('tel:')) continue;
        counts[route] = (counts[route] || 0) + 1;
      }
      set({ counts });
    } catch {
      /* mtandao shida — tulia tu */
    }
  },
}));
