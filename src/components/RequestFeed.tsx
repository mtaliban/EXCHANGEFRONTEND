'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { useLive } from '@/lib/liveSocket';
import { getRecentUsers, logCall } from '@/lib/api';
import { useI18n, useT } from '@/lib/i18n';

interface Request {
  user_id: string;
  full_name: string;
  phone_primary: string;
  cadre_display?: string;
  cadre_code?: string;
  current_station?: any;
  desired_destinations?: any[];
  created_at?: string;
  received_at: number; // when this card arrived on MY screen
}

/** Localized relative time ("dakika 2 zilizopita" / "2 min ago"). */
function timeAgo(ts: number, lang: 'sw' | 'en'): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 5) return lang === 'sw' ? 'sasa hivi' : 'just now';
  const m = Math.floor(s / 60);
  if (m < 1) return lang === 'sw' ? 'dakika chache zilizopita' : 'less than a minute ago';
  if (m < 60) return lang === 'sw' ? `dakika ${m} zilizopita` : `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === 'sw' ? `saa ${h} zilizopita` : `${h} hr${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return lang === 'sw' ? 'jana' : 'yesterday';
  if (d < 7) return lang === 'sw' ? `siku ${d} zilizopita` : `${d} days ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return lang === 'sw' ? `wiki ${w} zilizopita` : `${w} wk ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return lang === 'sw' ? `miezi ${mo} iliyopita` : `${mo} mo ago`;
  const y = Math.floor(d / 365);
  return lang === 'sw' ? `miaka ${y} iliyopita` : `${y} yr ago`;
}

/**
 * Uber-style "request" feed — kila mtu anayejisajili anapokelewa hapa kama
 * request card kwenye GRID (kama board). Mpya juu (kushoto), zamani zina
 * kusonga chini; muda uliopita unaonyeshwa live; aliyepo online ana
 * alama ya kijani 🟢.
 */
export default function RequestFeed({ limit = 12 }: { limit?: number }) {
  const t = useT();
  const lang = useI18n((s) => s.lang);
  const { user } = useAuth();
  const onlineUserIds = useLive((s) => s.onlineUserIds);
  const { messages } = useLiveEvents(['user.registered']);
  const [requests, setRequests] = useState<Request[]>([]);
  const [now, setNow] = useState(Date.now());
  const seen = useRef<Set<string>>(new Set());

  // Re-render time-ago labels every 30s
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Keep the dedup set bounded (avoid slow leak over a long session)
  useEffect(() => {
    if (seen.current.size > 200) seen.current.clear();
  }, [requests.length]);

  // Seed initial feed with recently registered users (idara yangu tu)
  useEffect(() => {
    (async () => {
      try {
        const d = await getRecentUsers(limit * 3);
        const items = d.users
          .filter((u) => u.user_id !== user?.user_id)
          .filter((u) => !user?.category || u.category === user.category)
          .slice(0, limit)
          .map((u) => ({ ...u, received_at: new Date(u.created_at || Date.now()).getTime() }));
        items.forEach((i) => seen.current.add(i.user_id));
        setRequests(items);
      } catch {}
    })();
    // eslint-disable-next-line
  }, [limit, user?.category, user?.user_id]);

  // Live: new registration → prepend request card (Uber ping!)
  useEffect(() => {
    if (!messages.length || !user) return;
    const latest = messages[messages.length - 1];
    if (!latest || latest.topic !== 'user.registered') return;
    const p = latest.payload || {};
    const uid = p.user_id;
    // Idara yangu tu — usichanganye walimu na afya kwenye feed
    if (user?.category && p.category !== user.category) return;
    if (!uid || uid === user.user_id || seen.current.has(uid)) return;
    seen.current.add(uid);
    const card: Request = {
      user_id: uid,      full_name: p.full_name || t('dash.new_user'),
      phone_primary: p.phone_primary || '', cadre_display: p.cadre_display,
      cadre_code: p.cadre_code, current_station: p.current_station,
      desired_destinations: p.desired_destinations || [],
      created_at: p.occurred_at, received_at: Date.now(),
    };
    setRequests((prev) => [card, ...prev].slice(0, limit));
  }, [messages.length, user, limit]);

  if (requests.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-brand-grey-900 dark:text-white flex items-center gap-2">
          <span className="relative flex w-2.5 h-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
            <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-brand-orange"></span>
          </span>
          {t('dash.request_feed')}
        </h2>
        <span className="text-xs text-brand-grey-500 dark:text-brand-grey-400">{requests.length} {t('dash.requests')}</span>
      </div>

      {/* GRID kama board — mpya juu kushoto, zamani zinasonga chini */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {requests.map((r, idx) => (
          <RequestCard key={r.user_id} r={r} isNew={idx === 0 && now - r.received_at < 90000} now={now} lang={lang} online={onlineUserIds.has(r.user_id)} />
        ))}
      </div>
    </div>
  );
}

function RequestCard({ r, isNew, now, lang, online }: { r: Request; isNew: boolean; now: number; lang: 'sw' | 'en'; online: boolean }) {
  const t = useT();
  const initial = r.full_name?.charAt(0)?.toUpperCase() || 'U';
  const from = r.current_station;
  const to = r.desired_destinations?.[0];
  const createdTs = r.created_at ? new Date(r.created_at).getTime() : r.received_at;
  const ago = timeAgo(isNaN(createdTs) ? now : createdTs, lang);

  async function onCall() {
    if (!r.phone_primary) return;
    try { await logCall(r.user_id, 'initiated'); } catch {}
    window.location.href = `tel:${r.phone_primary}`;
  }

  return (
    <div className={`card p-4 flex flex-col gap-2.5 transition group ${
      isNew ? 'border-brand-orange ring-2 ring-brand-orange/30 animate-[requestPing_1.5s_ease-in-out]' : ''
    }`}>
      <div className="flex items-center gap-3">
        {/* Avatar + online */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold text-lg">
            {initial}
          </div>
          {online && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white dark:border-brand-grey-100"></span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-brand-grey-900 dark:text-white truncate">{r.full_name}</span>
            {online && (
              <span className="text-[10px] font-bold text-green-500 inline-flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> {t('dash.online')}
              </span>
            )}
          </div>
          <div className="text-xs text-brand-grey-500 dark:text-brand-grey-400 truncate">
            {r.cadre_display || r.cadre_code || '—'}
          </div>
        </div>
      </div>

      {/* Namba ya simu — inabofyeka */}
      {r.phone_primary && (
        <a href={`tel:${r.phone_primary}`} className="inline-flex items-center gap-1 text-sm text-brand-blue font-semibold hover:underline">
          📞 {r.phone_primary}
        </a>
      )}

      {/* Kutoka → Kwenda (kama usafiri!) */}
      {from && (
        <div className="text-xs bg-brand-grey-50 dark:bg-brand-grey-100 rounded-lg px-2.5 py-1.5">
          <div className="text-brand-grey-500 dark:text-brand-grey-400 truncate">
            📍 {from.district_name}, {from.region_name}
          </div>
          {to && (
            <div className="text-brand-orange truncate">
              → {to.district_name || to.region_name} ({to.region_name})
            </div>
          )}
        </div>
      )}

      {/* Muda uliopita — live */}
      <div className={`text-[11px] font-medium ${isNew ? 'text-brand-orange' : 'text-brand-grey-400'}`}>
        🕐 {ago}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        <Link href={`/chats/${r.user_id}`}
          className="btn-primary text-xs px-3 py-1.5 flex-1 text-center"
          title={t('dash.open_chat')}>
          💬 {t('dash.chat')}
        </Link>
        <button onClick={onCall} disabled={!r.phone_primary}
          className="btn-accent text-xs px-3 py-1.5 flex-1 disabled:opacity-40"
          title={r.phone_primary ? `${t('dash.call_prefix')} ${r.phone_primary}` : t('dash.no_number')}>
          📞 {t('dash.call')}
        </button>
      </div>
    </div>
  );
}
