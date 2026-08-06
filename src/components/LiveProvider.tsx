'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useLive } from '@/lib/liveSocket';
import { formatDistanceToNowStrict } from 'date-fns';

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
      showToast({
        icon: '🎯',
        color: 'blue',
        title: 'Mtu Mpya wa Kubadilishana Nawe!',
        body: `${c.full_name} (${c.cadre_display || 'Mtumishi'}) — ${c.current_station?.district_name || ''}, ${c.current_station?.region_name || ''}`,
        onClick: () => router.push('/dashboard'),
        ago: p.occurred_at,
      });
    });
    const unsub2 = subscribe('message.sent', (p) => {
      if (p.to_user_id !== user.user_id) return;
      showToast({
        icon: '💬',
        color: 'orange',
        title: `Ujumbe kutoka ${p.from_full_name || 'mtu'}`,
        body: p.text?.slice(0, 100) || '',
        onClick: () => router.push(`/chats/${p.from_user_id}`),
        ago: p.created_at,
      });
    });
    const unsub3 = subscribe('call.initiated', (p) => {
      if (p.to_user_id !== user.user_id) return;
      showToast({
        icon: '📞',
        color: 'red',
        title: `${p.from_full_name || 'Mtu'} amekupigia`,
        body: 'Simu iliyoshindwa — mpigie sasa',
        onClick: () => router.push(`/contacts`),
        ago: p.initiated_at,
      });
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [user, subscribe, router]);

  return <>{children}</>;
}

/* ── in-memory toast implementation ────────────────────── */
function showToast(opts: {
  icon: string; color: 'blue' | 'orange' | 'red' | 'gold';
  title: string; body: string; onClick?: () => void; ago?: string;
}) {
  const container = ensureToastContainer();
  const el = document.createElement('div');
  const ago = opts.ago
    ? formatDistanceToNowStrict(new Date(opts.ago), { addSuffix: true })
    : 'sasa hivi';

  el.className = `pointer-events-auto cursor-pointer w-80 rounded-xl shadow-lg border-l-4 border-brand-${opts.color} bg-white p-3 flex items-start gap-3 animate-slide-in transition hover:shadow-xl`;
  el.innerHTML = `
    <div class="text-2xl">${opts.icon}</div>
    <div class="flex-1 min-w-0">
      <div class="font-semibold text-brand-grey-900 text-sm truncate">${escapeHtml(opts.title)}</div>
      <div class="text-xs text-brand-grey-500 mt-0.5 line-clamp-2">${escapeHtml(opts.body)}</div>
      <div class="text-[10px] text-brand-grey-400 mt-1">${ago}</div>
    </div>
    <button class="text-brand-grey-400 hover:text-brand-grey-700 text-lg leading-none" aria-label="Funga">×</button>
  `;
  const close = () => { el.style.opacity = '0'; setTimeout(() => el.remove(), 200); };
  el.querySelector('button')?.addEventListener('click', (e) => { e.stopPropagation(); close(); });
  if (opts.onClick) el.addEventListener('click', () => { opts.onClick!(); close(); });
  container.appendChild(el);
  // audio ping (best effort)
  try {
    const audio = new AudioContext();
    const o = audio.createOscillator(); const g = audio.createGain();
    o.connect(g); g.connect(audio.destination);
    o.frequency.value = 880; g.gain.value = 0.02;
    o.start(); setTimeout(() => { o.stop(); audio.close(); }, 100);
  } catch {}
  setTimeout(close, 8000);
}

function ensureToastContainer(): HTMLElement {
  let c = document.getElementById('kv-toasts');
  if (!c) {
    c = document.createElement('div');
    c.id = 'kv-toasts';
    c.className = 'fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(c);
  }
  return c;
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c
  ));
}
