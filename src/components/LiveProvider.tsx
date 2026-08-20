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
import { Handshake, Phone, Bell, ShieldAlert, Trash2, UserCog, CheckCircle2 } from 'lucide-react';
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
        icon: Handshake,
        color: 'blue',
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
        icon: Phone,
        color: 'red',
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
        icon: ShieldAlert,
        color: 'red',
        title: 'Akaunti imesitishwa',
        body: p.message || 'Akaunti yako imesitishwa na admin — wasiliana naye.',
      });
      logout();
      router.replace('/login');
    });
    const unsubDel = subscribe('account.deleted', (p) => {
      if (p.user_id && p.user_id !== uid) return;
      showToast({
        icon: Trash2,
        color: 'red',
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
          icon: UserCog,
          color: 'blue',
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
        icon: CheckCircle2,
        color: 'green' as any,
        title: 'Malipo Yamedhibitishwa! ✅',
        body: p.message || 'Sasa unaweza kuona namba za simu za washirika wako.',
      });
    });
    // Notifications center (payments, profile updates, registrations…)
    const unsub4 = subscribe('notification', (p) => {
      if (p.type === 'match.found' || p.type === 'message.sent' || p.type === 'call.initiated') return;
      if (isSoundEnabled()) playPingSound(); // 📣 arifa mpya → ipige sauti!
      const meta = NOTIFICATION_TYPE_META[p.type] || { icon: DEFAULT_NOTIFICATION_ICON, color: 'blue' };
      const emoji = meta.emoji || '🔔';
      showToast({
        icon: meta.icon || Bell,
        color: meta.color as 'blue' | 'orange' | 'red' | 'gold',
        title: `${emoji} ${p.title || 'Arifa mpya'}`,
        body: p.body || '',
        onClick: () => router.push(notificationRoute(p.type, p.data, (user as any)?.is_admin)),
        ago: p.occurred_at,
      });
    });
    return () => { unsub1(); unsub2(); unsubAcc(); unsubDel(); unsubUpd(); unsubData(); unsubVerified(); unsub4(); };
  }, [user, subscribe, router, pathname, logout, setUser]);

  return <>{children}</>;
}

/* ── in-memory toast implementation ────────────────────── */
const TOAST_ICON_BG: Record<string, string> = {
  blue: 'bg-brand-blue text-white',
  orange: 'bg-brand-orange text-white',
  red: 'bg-brand-red text-white',
  gold: 'bg-brand-gold-500 text-white',
};

function showToast(opts: {
  icon: LucideIcon; color: 'blue' | 'orange' | 'red' | 'gold';
  title: string; body: string; onClick?: () => void; ago?: string;
}) {
  const container = ensureToastContainer();
  const el = document.createElement('div');
  const ago = opts.ago
    ? formatDistanceToNowStrict(parseServerDate(opts.ago) || new Date(), { addSuffix: true })
    : 'sasa hivi';

  el.className = `pointer-events-auto cursor-pointer w-full sm:w-80 rounded-xl shadow-lg border-l-4 border-brand-${opts.color} bg-white p-3 flex items-start gap-3 animate-slide-in transition hover:shadow-xl max-w-full`;
  const iconEl = document.createElement('div');
  iconEl.className = `w-10 h-10 rounded-full ${TOAST_ICON_BG[opts.color] || 'bg-brand-blue text-white'} flex items-center justify-center flex-shrink-0`;
  const iconRoot = createRoot(iconEl);
  iconRoot.render(createElement(opts.icon, { size: 20, strokeWidth: 2.4 }));
  const bodyEl = document.createElement('div');
  bodyEl.className = 'flex-1 min-w-0';
  const titleEl = document.createElement('div');
  titleEl.className = 'font-semibold text-brand-grey-900 text-sm truncate';
  titleEl.textContent = opts.title;
  const bodyTextEl = document.createElement('div');
  bodyTextEl.className = 'text-xs text-brand-grey-500 mt-0.5 line-clamp-2';
  bodyTextEl.textContent = opts.body;
  const agoEl = document.createElement('div');
  agoEl.className = 'text-[10px] text-brand-grey-400 mt-1';
  agoEl.textContent = ago;
  bodyEl.append(titleEl, bodyTextEl, agoEl);
  const closeBtn = document.createElement('button');
  closeBtn.className = 'text-brand-grey-400 hover:text-brand-grey-700 text-lg leading-none';
  closeBtn.setAttribute('aria-label', 'Funga');
  closeBtn.textContent = '×';
  el.append(iconEl, bodyEl, closeBtn);
  const close = () => {
    el.style.opacity = '0';
    setTimeout(() => { iconRoot.unmount(); el.remove(); }, 200);
  };
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
  if (opts.onClick) el.addEventListener('click', () => { opts.onClick!(); close(); });
  container.appendChild(el);
  setTimeout(close, 8000);
}

function ensureToastContainer(): HTMLElement {
  let c = document.getElementById('kv-toasts');
  if (!c) {
    c = document.createElement('div');
    // Mobile: toasts ziko CHINI (juu ya bottom nav) — hazifuniki header/sticky bar.
    // Desktop: juu kulia kama kawaida.
    c.id = 'kv-toasts';
    c.className = 'fixed bottom-24 left-3 right-3 sm:left-auto sm:right-4 sm:top-3 sm:bottom-auto z-[100] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(c);
  }
  return c;
}

