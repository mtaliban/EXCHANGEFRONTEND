'use client';

import { create } from 'zustand';
import { getNotifications, markNotificationRead, markAllNotificationsRead, bustGetCache } from '@/lib/api';
import { notificationRoute } from '@/lib/notifications';

/**
 * Route-based unread store — kila menu item ina count yake.
 *
 * Flow:
 *   1. Notification mpya inafika (WS) → notificationRoute() inapata route
 *      → count ya route ile inaongezeka → badge inaonekana kwenye menu.
 *   2. Mtumiaji anafungua page ya route ile → notifications za route TU
 *      zinasomwa backend (read=True) → badge ya route ile inaondoka.
 *   3. Mtumiaji yupo offline → anapata online → refresh() inapata notifications
 *      zote na kuhesabu kwa route → badges zinaonekana papo hapo.
 *
 * MUHIMU: kila route inasoma notifications zake TU — si zote.
 */

interface RouteUnreadState {
  /** Route → idadi ya unread notifications zinazopelekea kwenye route hiyo */
  counts: Record<string, number>;
  /** Route → notification_ids zilizosomwa (kwa kusoma backend) */
  routeNotifIds: Record<string, string[]>;
  /** Ondoa count ya route moja (mtu amefungua page) + soma backend */
  clear: (route: string) => void;
  /** Ongeza 1 kwa route (notification mpya imeshafika) */
  bump: (route: string) => void;
  /** Pata notifications zote na hesabu kwa route (initial load + offline recovery) */
  refresh: () => Promise<void>;
}

export const useUnreadStore = create<RouteUnreadState>((set, get) => ({
  counts: {},
  routeNotifIds: {},

  clear: (route) => {
    const c = { ...get().counts };
    delete c[route];
    const notifIds = get().routeNotifIds[route] || [];
    const newRouteNotifIds = { ...get().routeNotifIds };
    delete newRouteNotifIds[route];
    set({ counts: c, routeNotifIds: newRouteNotifIds });
    // Soma notifications za route hii TU backend — si zote
    bustGetCache();
    notifIds.forEach((id) => markNotificationRead(id).catch(() => {}));
  },

  bump: (route) => {
    const c = { ...get().counts };
    c[route] = (c[route] || 0) + 1;
    set({ counts: c });
  },

  /**
   * Login / offline→online — SOMA notifications zilizosomwa (unread)
   * na hesabu kwa kila route. HATUFUTI notifications (markAllRead) —
   * mtumiaji aone badges pale ANAPOINGIA kwenye page husika.
   * Hii inahakikisha mtu akiingia tena ANAONA badges za arifa ambazo
   * hajawahi kusoma hata kama alikuwa offline.
   */
  refresh: async () => {
    try {
      bustGetCache();
      // is_admin? — tunahitaji kujua ili notificationRoute itumie route sahihi
      let isAdmin = false;
      try {
        const raw = localStorage.getItem('kv_auth');
        if (raw) {
          const parsed = JSON.parse(raw);
          isAdmin = !!parsed?.state?.user?.is_admin;
        }
      } catch {}
      const data = await getNotifications(100, true);
      // BADGE-ABLE routes tu — hizi ndizo zinapaswa kuonyesha namba kwenye menu
      const badgeRoutes = new Set([
        '/admin/users', '/admin/payments', '/admin/feedback',
        '/admin/events', '/admin/real-matches',
        '/dashboard', '/donate', '/feedback',
      ]);
      const counts: Record<string, number> = {};
      const routeNotifIds: Record<string, string[]> = {};
      for (const n of data.notifications) {
        if (n.read) continue;
        const route = notificationRoute(n.type, n.data, isAdmin);
        if (route.startsWith('tel:')) continue;
        if (!badgeRoutes.has(route)) continue;
        counts[route] = (counts[route] || 0) + 1;
        if (!routeNotifIds[route]) routeNotifIds[route] = [];
        routeNotifIds[route].push(n.notification_id);
      }
      set({ counts, routeNotifIds });
    } catch {
      /* mtandao shida — tulia tu */
    }
  },
}));
