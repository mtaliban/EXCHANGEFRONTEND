'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { useLive } from '@/lib/liveSocket';
import { getRecentUsers, logCall } from '@/lib/api';
import { formatDistanceToNowStrict } from 'date-fns';
import { useT } from '@/lib/i18n';

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

/**
 * Uber-style "request" feed — kila mtu anayejisajili anapokelewa hapa kama
 * request card (jina, namba, online, chat/call). Mpya juu, zamani zina
 * kusonga chini; muda uliopita unaonyeshwa live.
 */
export default function RequestFeed({ limit = 12 }: { limit?: number }) {
  const t = useT();
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

      <div className="space-y-2">
        {requests.map((r, idx) => (
          <RequestCard key={r.user_id} r={r} isNew={idx === 0 && now - r.received_at < 90000} now={now} online={onlineUserIds.has(r.user_id)} />
        ))}
      </div>
    </div>
  );
}

function RequestCard({ r, isNew, now, online }: { r: Request; isNew: boolean; now: number; online: boolean }) {
  const t = useT();
  const initial = r.full_name?.charAt(0)?.toUpperCase() || 'U';
  const from = r.current_station;
  const to = r.desired_destinations?.[0];

  async function onCall() {
    if (!r.phone_primary) return;
    try { await logCall(r.user_id, 'initiated'); } catch {}
    window.location.href = `tel:${r.phone_primary}`;
  }

  return (
    <div className={`p-3.5 rounded-2xl border bg-white dark:bg-brand-grey-100 shadow-soft transition hover:shadow-md ${
      isNew ? 'border-brand-orange ring-2 ring-brand-orange/30 animate-[requestPing_1.5s_ease-in-out]' : 'border-brand-grey-100 dark:border-brand-grey-200'
    }`}>
      <div className="flex items-center gap-3">
        {/* Avatar + online */}
        <div className="relative flex-shrink-0">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold text-lg`}>
            {initial}
          </div>
          {online && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white dark:border-brand-grey-100"></span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-brand-grey-900 dark:text-white truncate">{r.full_name}</span>
            {online && <span className="text-[10px] font-bold text-green-500">🟢 {t('dash.online')}</span>}
            {r.cadre_display && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-blue-50 dark:bg-brand-blue-900 text-brand-blue dark:text-brand-blue-500 font-medium">{r.cadre_display}</span>
            )}
          </div>

          {/* Namba ya simu — inabofyeka */}
          {r.phone_primary && (
            <a href={`tel:${r.phone_primary}`} className="inline-flex items-center gap-1 mt-0.5 text-sm text-brand-blue font-semibold hover:underline">
              📞 {r.phone_primary}
            </a>
          )}

          {/* Kutoka → Kwenda (kama usafiri!) */}
          {from && (
            <div className="text-xs text-brand-grey-500 dark:text-brand-grey-400 mt-0.5 truncate">
              📍 {from.district_name}, {from.region_name}
              {to && (
                <span className="text-brand-orange"> → {to.district_name || to.region_name} ({to.region_name})</span>
              )}
            </div>
          )}

          <div className="text-[11px] text-brand-grey-400 mt-0.5">
            {r.created_at ? `${t('dash.request_ago')} ${formatDistanceToNowStrict(new Date(r.created_at), { addSuffix: true })}` : t('dash.new_request')}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <Link href={`/chats/${r.user_id}`}
            className="px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-700 transition text-center"
            title={t('dash.open_chat')}>
            💬 {t('dash.chat')}
          </Link>
          <button onClick={onCall} disabled={!r.phone_primary}
            className="px-3 py-1.5 rounded-lg bg-brand-orange text-white text-xs font-semibold hover:bg-brand-orange-600 transition disabled:opacity-40"
            title={r.phone_primary ? `${t('dash.call_prefix')} ${r.phone_primary}` : t('dash.no_number')}>
            📞 {t('dash.call')}
          </button>
        </div>
      </div>
    </div>
  );
}
