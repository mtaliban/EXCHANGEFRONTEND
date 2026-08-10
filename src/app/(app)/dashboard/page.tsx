'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, Phone } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLiveEvents } from '@/lib/useLiveEvents';
import OnlineNowWidget from '@/components/OnlineNowWidget';
import RequestFeed from '@/components/RequestFeed';
import DashboardBoard from '@/components/DashboardBoard';
import { useLive } from '@/lib/liveSocket';
import { useT } from '@/lib/i18n';

export default function DashboardPage() {
  const t = useT();
  const { user } = useAuth();
  const { connected } = useLive();
  const { messages } = useLiveEvents(['match.found', 'user.registered', 'payment.approved']);

  // Live pulse: kila event mpya inafanya Live Events ku-re-render (key change)
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (messages.length) setPulse(Date.now());
  }, [messages.length]);

  const myStation = (user?.current_station || {}) as any;
  const initial = user?.full_name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ═══ HERO — Karibu, wasifu, LIVE ═══ */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-blue via-brand-blue-700 to-brand-blue-900 text-white p-5 md:p-6 shadow-lg">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-brand-orange/25 blur-3xl" />
        <div className="absolute -bottom-14 -left-10 w-48 h-48 rounded-full bg-brand-gold/20 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-white/15 ring-2 ring-white/40 flex items-center justify-center text-xl font-bold">
                {initial}
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-brand-blue-800" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                {t('dash.welcome')}, {user?.full_name?.split(' ')[0]} 👋
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15">
                  {user?.cadre_display || user?.cadre_code}
                </span>
                {myStation?.district_name && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/15">
                    📍 {myStation.district_name}, {myStation.region_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full ${connected ? 'bg-green-400 text-brand-blue-900' : 'bg-white/20'}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-brand-blue-900 animate-pulse' : 'bg-white'}`} />
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
            <Link href="/contacts" className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white text-brand-blue hover:bg-brand-gold-100 transition">
              <Phone size={13} /> {t('dash.contacts_link')}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ LIVE REQUEST FEED (grid ya wanaokuja mkoa wako) ═══ */}
      <RequestFeed />

      {/* ═══ AD-BOARD (filter + stats + grid) ═══ */}
      <DashboardBoard />

      {/* ═══ Online + Live Events ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1"><OnlineNowWidget /></div>
        <div className="lg:col-span-2">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-brand-grey-900 dark:text-white flex items-center gap-2">
                <Activity size={16} className="text-brand-blue" /> {t('dash.live_events')}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-brand-grey-100 text-brand-grey-500'}`}>
                {connected ? t('dash.ws_connected') : t('dash.ws_disconnected')}
              </span>
            </div>
            <LiveEventsList key={pulse} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveEventsList() {
  const t = useT();
  const [events, setEvents] = useState<{ type: string; at: number; text: string }[]>([]);
  const { subscribe } = useLive();
  useEffect(() => {
    const un = subscribe('*', (p: any) => {
      const type = p.event || p.type || 'unknown';
      if (type === 'pong' || type === 'presence' || type === 'typing') return;
      const text = type === 'match.found' ? `Match: ${p.candidate?.full_name || ''}` :
                   type === 'message.sent' ? `${t('dash.msg_from')} ${p.from_full_name || ''}` :
                   type === 'call.initiated' ? `${t('dash.call_from')} ${p.from_full_name || ''}` :
                   type === 'user.registered' ? `${t('dash.new_registration')}: ${p.full_name || ''}` :
                   type === 'notification' ? `${p.title || ''}` : type;
      setEvents((prev) => [{ type, at: Date.now(), text }, ...prev].slice(0, 8));
    });
    return () => un();
  }, [subscribe]);
  return (
    <div>
      {events.length === 0 && (
        <div className="text-brand-grey-500 text-sm py-6 text-center">{t('dash.no_events')}</div>
      )}
      <div className="space-y-1">
        {events.map((e, i) => (
          <div key={i} className="text-xs flex items-center gap-2 py-1.5 border-b border-brand-grey-50 last:border-0">
            <span className="badge-gold text-[10px] flex-shrink-0">{e.type}</span>
            <span className="text-brand-grey-700 dark:text-brand-grey-300 flex-1 truncate">{e.text}</span>
            <span className="text-brand-grey-400 text-[10px] flex-shrink-0">{new Date(e.at).toLocaleTimeString('sw-TZ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
