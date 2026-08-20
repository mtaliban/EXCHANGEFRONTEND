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
import { getMe, emitDataChanged } from '@/lib/api';
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
      // Sauti ya ARRIVAL: DashboardBoard inaipiga kwenye /dashboard; kwenye pages
      // NYINGINE inapigwa hapa (ila tupige moja tu — siyo mara mbili kwenye
      // dashboard wakati board iko wazi). HESHEMU MUTE: ikiwa mtumiaji amezima
      // sauti (🔇) asipate sauti hapa pia — sambamba na handlers wengine.
      if (isSoundEnabled() && !pathname?.startsWith('/dashboard')) playArrivalSound();
      showToast({
        emoji: '🤝',
        title: 'Mtu Mpya wa Kubadilishana Nawe!',
        body: `${c.full_name} (${c.cadre_display || 'Mtumishi'}) — ${c.current_station?.district_name || ''}, ${c.current_station?.region_name || ''}`,
        onClick: () => router.push('/dashboard'),
        ago: p.occurred_at,
      });
    });
    const unsub2 = subscribe('call.initiated', (p) => {
      if (p.to_user_id !== uid) return;
      if (isSoundEnabled()) playPingSound();
      showToast({
        emoji: '📞',
        title: `${p.from_full_name || 'Mtu'} amekupigia`,
        body: 'Simu iliyoshindwa — mpigie sasa',
        onClick: () => router.push('/dashboard'),
        ago: p.initiated_at,
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
        body: p.message || 'Akaunti yako imesitishwa na admin — wasiliana naye.',
      });
      logout();
      router.replace('/login');
    });
    const unsubDel = subscribe('account.deleted', (p) => {
      if (p.user_id && p.user_id !== uid) return;
      showToast({
        emoji: '🗑️',
        title: 'Akaunti imefutwa',
        body: p.message || 'Akaunti yako imefutwa na admin.',
      });
      logout();
      router.replace('/login');
    });
    const unsubUpd = subscribe('user.updated_by_admin', (p) => {
      if (p.user_id && p.user_id !== uid) return;
      // Session inasasishwa PAPO HAPO kutoka server (taarifa kamili) — bila refresh.
      getMe().then((me) => setUser(me)).catch(() => {});
      const fields = (p.changed_fields || []).filter((f: string) => f !== 'status');
      if (fields.length > 0) {
        showToast({
          emoji: '✏️',
          title: 'Taarifa zako zimesasishwa',
          body: 'Admin amebadilisha taarifa zako — sasa zinaonekana mpya.',
          onClick: () => router.push('/profile'),
          ago: p.occurred_at,
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
      getMe().then((me) => setUser(me)).catch(() => {});
      showToast({
        emoji: '✅',
        title: 'Malipo Yamedhibitishwa!',
        body: p.message || 'Sasa unaweza kuona namba za simu za washirika wako.',
      });
    });
    // Notifications center (payments, profile updates, registrations…)
    const unsub4 = subscribe('notification', (p) => {
      if (p.type === 'match.found' || p.type === 'message.sent' || p.type === 'call.initiated') return;
      if (isSoundEnabled()) playPingSound();
      const meta = NOTIFICATION_TYPE_META[p.type] || { icon: DEFAULT_NOTIFICATION_ICON, color: 'blue' };
      const emoji = meta.emoji || '🔔';
      showToast({
        emoji,
        title: p.title || 'Arifa mpya',
        body: p.body || '',
        onClick: () => router.push(notificationRoute(p.type, p.data, (user as any)?.is_admin)),
        ago: p.occurred_at,
      });
      // Badge ya route husika — ongeza 1 kwenye menu item inayofaa
      import('@/lib/unreadStore').then(({ useUnreadStore }) => {
        const route = notificationRoute(p.type, p.data, (user as any)?.is_admin);
        if (!route.startsWith('tel:')) useUnreadStore.getState().bump(route);
      });
    });
    return () => { unsub1(); unsub2(); unsubAcc(); unsubDel(); unsubUpd(); unsubData(); unsubVerified(); unsub4(); };
  }, [user, subscribe, router, pathname, logout, setUser]);

  return <>{children}</>;
}/* ── in-memory toast — SAWA NA GUIDE TOAST (blue card slide-in) ── */
function showToast(opts: {
  icon?: LucideIcon; emoji?: string; color?: string; title: string; body?: string; onClick?: () => void; ago?: string;
}) {
  const container = ensureToastContainer();
  const el = document.createElement('div');
  // SAWA NA guide toast: rounded-lg, border-brand-blue/30, bg-brand-blue-50, text-[11px]
  el.className = 'pointer-events-auto cursor-pointer w-fit min-w-[180px] max-w-[340px] rounded-lg border border-brand-blue/30 bg-brand-blue-50 dark:bg-brand-blue-950/40 px-3 py-2 text-[11px] text-brand-blue-700 dark:text-brand-blue-300 font-medium animate-slide-in transition hover:shadow-md';
  const emoji = opts.emoji || '🔔';
  // Title line
  const titleEl = document.createElement('div');
  titleEl.className = 'font-bold text-brand-blue-800 dark:text-brand-blue-200';
  titleEl.textContent = `${emoji} ${opts.title}`;
  el.appendChild(titleEl);
  if (opts.body) {
    const bodyEl = document.createElement('div');
    bodyEl.className = 'text-brand-blue-500 dark:text-brand-blue-400 font-normal mt-0.5 leading-snug';
    bodyEl.textContent = opts.body;
    el.appendChild(bodyEl);
  }
  const close = () => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 200);
  };
  el.addEventListener('click', () => { opts.onClick?.(); close(); });
  container.appendChild(el);
  setTimeout(close, 6000);
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

