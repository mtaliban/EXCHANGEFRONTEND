'use client';

import { useEffect, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLive } from '@/lib/liveSocket';
import { formatDistanceToNowStrict } from 'date-fns';
import { NOTIFICATION_TYPE_META, DEFAULT_NOTIFICATION_ICON, notificationRoute } from '@/lib/notifications';
import { playPingSound, isSoundEnabled } from '@/lib/sound';
import { parseServerDate } from '@/lib/dates';
import { Handshake, MessageCircle, Phone, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Global WebSocket manager + toast notifier for authed pages.
 * Wraps app children with:
 *   - Auto-connect WS with token
 *   - Uber-style toast on match.found
 *   - Toast on new message.sent
 *   - Toast on call.initiated
 */
export default function LiveProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, user } = useAuth();
  const { connect, disconnect, subscribe } = useLive();

  useEffect(() => {
    if (!token) return;
    connect(token);
    return () => disconnect();
  }, [token, connect, disconnect]);

  // Toast handler for live events
  useEffect(() => {
    if (!user) return;
    const unsub1 = subscribe('match.found', (p) => {
      const c = p.candidate || {};
      // NOTE: sauti ya ARRIVAL inapigwa na DashboardBoard (live feed) — hatupigi
      // hapa ili tusipige mara MBILI kwenye dashboard (chime moja tu).
      showToast({
        icon: Handshake,
        color: 'blue',
        title: 'Mtu Mpya wa Kubadilishana Nawe!',
        body: `${c.full_name} (${c.cadre_display || 'Mtumishi'}) — ${c.current_station?.district_name || ''}, ${c.current_station?.region_name || ''}`,
        onClick: () => router.push('/dashboard'),
        ago: p.occurred_at,
      });
    });
    const unsub2 = subscribe('message.sent', (p) => {
      if (p.to_user_id !== user.user_id) return;
      if (isSoundEnabled()) playPingSound();
      showToast({
        icon: MessageCircle,
        color: 'orange',
        title: `Ujumbe kutoka ${p.from_full_name || 'mtu'}`,
        body: p.text?.slice(0, 100) || '',
        onClick: () => router.push(`/chats/${p.from_user_id}`),
        ago: p.created_at,
      });
    });
    const unsub3 = subscribe('call.initiated', (p) => {
      if (p.to_user_id !== user.user_id) return;
      if (isSoundEnabled()) playPingSound();
      showToast({
        icon: Phone,
        color: 'red',
        title: `${p.from_full_name || 'Mtu'} amekupigia`,
        body: 'Simu iliyoshindwa — mpigie sasa',
        onClick: () => router.push(`/contacts`),
        ago: p.initiated_at,
      });
    });
    // Notifications center (payments, profile updates, registrations…)
    // NOTE: match.found / user.registered / message.sent / call.initiated have
    // dedicated handling (toasts + sauti ya dashboard) — skip duplicate here.
    const unsub4 = subscribe('notification', (p) => {
      if (p.type === 'match.found' || p.type === 'user.registered'
        || p.type === 'message.sent' || p.type === 'call.initiated') return;
      if (isSoundEnabled()) playPingSound(); // 📣 arifa mpya → ipige sauti!
      const meta = NOTIFICATION_TYPE_META[p.type] || { icon: DEFAULT_NOTIFICATION_ICON, color: 'blue' };
      showToast({
        icon: meta.icon || Bell,
        color: meta.color as 'blue' | 'orange' | 'red' | 'gold',
        title: p.title || 'Arifa mpya',
        body: p.body || '',
        onClick: () => router.push(notificationRoute(p.type, p.data, (user as any)?.is_admin)),
        ago: p.occurred_at,
      });
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [user, subscribe, router]);

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

  el.className = `pointer-events-auto cursor-pointer w-full sm:w-80 rounded-xl shadow-lg border-l-4 border-brand-${opts.color} bg-white p-3 flex items-start gap-3 animate-slide-in transition hover:shadow-xl`;
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
    c.id = 'kv-toasts';
    c.className = 'fixed top-3 right-3 left-3 sm:left-auto sm:right-4 z-[100] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(c);
  }
  return c;
}

