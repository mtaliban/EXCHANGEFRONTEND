'use client';

import { useEffect, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLive } from '@/lib/liveSocket';
import { formatDistanceToNowStrict } from 'date-fns';
import { NOTIFICATION_TYPE_META, DEFAULT_NOTIFICATION_ICON, notificationRoute } from '@/lib/notifications';
import { playPingSound, playArrivalSound, isSoundEnabled } from '@/lib/sound';
import { parseServerDate } from '@/lib/dates';
import { getMe, emitDataChanged, bustGetCache } from '@/lib/api';
import { Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Global WebSocket manager + toast notifier for authed pages.
 * Wraps app children with:
 *   - Auto-connect WS with token
 *   - Uber-style toast on match.found
 *   - Toast on call.initiated
 *   - REAL-TIME ACCOUNT CONTROL: admin akisuspend/kufuta akaunti → forced
 *     logout PAPO HAPO; admin akibadilisha taarifa zako → session inasasishwa
 *     mara moja (bila refresh).
 */

/** Baada ya muda huu wa kutokuwa ACTIVE (hakuna click/keyboard/scroll) →
 *  mtumiaji anatolewa (logout) na kupelekwa LOGIN — security ya muda wa kukaa. */
const IDLE_LOGOUT_MS = 30 * 60 * 1000; // dakika 30

function useIdleLogout() {
  const router = useRouter();
  const logout = useAuth((s) => s.logout);
  useEffect(() => {
    let timer: any;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
        router.replace('/login');
      }, IDLE_LOGOUT_MS);
    };
    const evts = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    evts.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      evts.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [logout, router]);
}

export default function LiveProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, logout, setUser } = useAuth();
  const { connect, disconnect, subscribe } = useLive();

  // Mtumiaji asipofanya kitu kwa dakika 30 → toa (logout) → login.
  useIdleLogout();

  useEffect(() => {
    if (!token) return;
    connect(token);
    return () => disconnect();
  }, [token, connect, disconnect]);

  // Toast handler for live events
  useEffect(() => {
    if (!user) return;
    const uid = (user as any)?.user_id;
    const unsub1 = subscribe('match.found', (p) => {
      const c = p.candidate || {};
      if (isSoundEnabled() && !pathname?.startsWith('/dashboard')) playArrivalSound();
      showToast({
        emoji: '🤝',
        title: `${c.full_name || 'Mtu'} — ${c.current_station?.region_name || 'Kumefika'}`,
        onClick: () => router.push('/dashboard'),
      });
    });
    const unsub2 = subscribe('call.initiated', (p) => {
      if (p.to_user_id !== uid) return;
      if (isSoundEnabled()) playPingSound();
      showToast({
        emoji: '📞',
        title: `${p.from_full_name || 'Mtu'} — amekupigia`,
        onClick: () => router.push('/dashboard'),
      });
    });
    // REAL-TIME ACCOUNT CONTROL (admin):
    //  - account.disabled → mtumiaji anasitishwa → forced LOGOUT mara moja.
    //  - account.deleted  → akaunti imefutwa (trash) → forced LOGOUT mara moja.
    //  - user.updated_by_admin → admin amebadilisha taarifa zako → session
    //    inasasishwa PAPO HAPO bila refresh (jina/kada/status zinaonekana mpya).
    const unsubAcc = subscribe('account.disabled', (p) => {
      if (p.user_id && p.user_id !== uid) return;
      if (isSoundEnabled()) playPingSound();
      showToast({
        emoji: '🚫',
        title: 'Akaunti imesitishwa',
      });
      logout();
      router.replace('/login');
    });
    const unsubDel = subscribe('account.deleted', (p) => {
      if (p.user_id && p.user_id !== uid) return;
      showToast({
        emoji: '🗑️',
        title: 'Akaunti imefutwa',
      });
      logout();
      router.replace('/login');
    });
    const unsubUpd = subscribe('user.updated_by_admin', (p) => {
      if (p.user_id && p.user_id !== uid) return;
      getMe().then((me) => setUser(me)).catch(() => {});
      const fields = (p.changed_fields || []).filter((f: string) => f !== 'status');
      if (fields.length > 0) {
        showToast({
          emoji: '✏️',
          title: 'Taarifa zimesasishwa',
          onClick: () => router.push('/profile'),
        });
      }
    });
    // Reference data (idara/masomo/kada/mikoa/wilaya/vituo) imebadilishwa na
    // admin → dropdowns zote za watumiaji (usajili, profile, filters) zijirefresh
    // PAPO HAPO bila refresh ya page (event-driven kama WebSocket).
    const unsubData = subscribe('data.changed', () => emitDataChanged());
    // REAL-TIME: malipo yamethibitishwa → is_verified=True → session inasasishwa
    // PAPO HAPO (mtu anaweza kuona namba za simu bila refresh ya page).
    const unsubVerified = subscribe('user.verified', (p: any) => {
      if (p.user_id && p.user_id !== uid) return;
      bustGetCache();
      getMe(true).then((me) => setUser(me)).catch(() => {}); // fresh=true → bypass cache
    });
    // REAL-TIME: admin amekubali password reset → user apate form ya kuweka password mpya
    const unsubResetApproved = subscribe('user.password_reset_approved', (p: any) => {
      if (p.user_id && p.user_id !== uid) return;
      if (isSoundEnabled()) playPingSound();
      showToast({
        emoji: '🔑',
        title: 'Ombi lako la password limekubaliwa! Weka password mpya sasa.',
      });
      router.push(`/reset-password?phone=${encodeURIComponent((user as any)?.phone_primary || '')}`);
    });
    const unsubResetRejected = subscribe('user.password_reset_rejected', (p: any) => {
      if (p.user_id && p.user_id !== uid) return;
      if (isSoundEnabled()) playPingSound();
      showToast({
        emoji: '❌',
        title: 'Ombi lako la password limekataliwa. Wasiliana na admin.',
      });
    });
    // Notifications center (payments, profile updates, registrations…)
    const unsub4 = subscribe('notification', (p) => {
      if (p.type === 'match.found' || p.type === 'message.sent' || p.type === 'call.initiated') return;
      if (isSoundEnabled()) playPingSound();
      const meta = NOTIFICATION_TYPE_META[p.type] || { icon: DEFAULT_NOTIFICATION_ICON, color: 'blue' };
      showToast({
        emoji: meta.emoji || '🔔',
        title: p.title || 'Arifa mpya',
        onClick: () => router.push(notificationRoute(p.type, p.data, (user as any)?.is_admin)),
      });
      // Badge ya route husika — ongeza 1 kwenye menu item inayofaa
      import('@/lib/unreadStore').then(({ useUnreadStore }) => {
        const route = notificationRoute(p.type, p.data, (user as any)?.is_admin);
        if (!route.startsWith('tel:')) useUnreadStore.getState().bump(route);
        // Admin: kila notification pia ibebe badge kwenye /admin/events
        // (sio /admin/Statistics — user haitaki badge pale)
        if ((user as any)?.is_admin && route !== '/admin/events') {
          useUnreadStore.getState().bump('/admin/events');
        }
      });
    });
    return () => { unsub1(); unsub2(); unsubAcc(); unsubDel(); unsubUpd(); unsubData(); unsubVerified(); unsubResetApproved(); unsubResetRejected(); unsub4(); };
  }, [user, subscribe, router, pathname, logout, setUser]);

  return <>{children}</>;
}/* ── in-memory toast — SAWA NA GUIDE TOAST (blue card slide-in) ── */
function showToast(opts: {
  icon?: LucideIcon; emoji?: string; color?: string; title: string; body?: string; onClick?: () => void; ago?: string;
}) {
  const container = ensureToastContainer();
  const el = document.createElement('div');
  el.className = 'pointer-events-auto cursor-pointer w-fit min-w-[180px] max-w-[280px] rounded-lg shadow-md border border-brand-blue/20 bg-white dark:bg-brand-grey-900 px-3 py-2.5 text-[11px] text-brand-grey-800 dark:text-brand-grey-200 font-medium animate-slide-in transition hover:shadow-lg';
  // Official style — line ya juu = title, line ya chini = sub-title
  const titleEl = document.createElement('div');
  titleEl.className = 'font-bold text-brand-grey-900 dark:text-white leading-snug text-[12px]';
  titleEl.textContent = opts.title;
  el.appendChild(titleEl);
  const close = () => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = 'all 0.2s ease-in';
    setTimeout(() => el.remove(), 200);
  };
  el.addEventListener('click', () => { opts.onClick?.(); close(); });
  container.appendChild(el);
  setTimeout(close, 5000);
}

function ensureToastContainer(): HTMLElement {
  let c = document.getElementById('kv-toasts');
  if (!c) {
    c = document.createElement('div');
    // Mobile: toasts ziko CHINI (juu ya bottom nav) — hazifuniki header/sticky bar.
    // Desktop: juu kulia kama kawaida.
    c.id = 'kv-toasts';
    c.className = 'fixed bottom-24 left-3 sm:left-auto sm:right-4 sm:top-3 sm:bottom-auto z-[100] flex flex-col items-end gap-2 pointer-events-none';
    document.body.appendChild(c);
  }
  return c;
}

