'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getContactStats } from '@/lib/api';
import { useLiveEvents } from '@/lib/useLiveEvents';
import OnlineNowWidget from '@/components/OnlineNowWidget';
import RequestFeed from '@/components/RequestFeed';
import DashboardBoard from '@/components/DashboardBoard';
import ContactStatCard from '@/components/ContactStatCard';
import { useLive } from '@/lib/liveSocket';
import { useT } from '@/lib/i18n';

export default function DashboardPage() {
  const t = useT();
  const { user } = useAuth();
  const [contactStats, setContactStats] = useState<any>(null);
  const [openStat, setOpenStat] = useState<string | null>(null);
  const [showComm, setShowComm] = useState(false);
  const { connected } = useLive();
  const { messages } = useLiveEvents(['match.found', 'user.registered', 'payment.approved']);

  useEffect(() => {
    getContactStats().then(setContactStats).catch(() => {});
  }, []);

  // Notify-ish: live pulse on new events
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (messages.length) setPulse(Date.now());
  }, [messages.length]);

  const myStation = user?.current_station as any;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-grey-900 dark:text-white">
            {t('dash.welcome')}, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-brand-grey-500 dark:text-brand-grey-400 text-sm mt-1">
            Wewe ni <b>{user?.cadre_display || user?.cadre_code}</b> — sasa <b>{myStation?.district_name}</b>, <b>{myStation?.region_name}</b>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${connected ? 'bg-brand-blue-100 dark:bg-brand-blue-900 text-brand-blue dark:text-brand-blue-500' : 'bg-brand-grey-200 text-brand-grey-500'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-brand-blue animate-pulse' : 'bg-brand-grey-500'}`} />
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* ═══ LIVE REQUEST FEED (JUU — grid, mpya juu, online 🟢 + muda) ═══ */}
      <RequestFeed />

      {/* ═══ AD-BOARD + STATS + GRID (chini) ═══ */}
      <DashboardBoard />

      {/* ═══ COMMUNICATION STATS (chini — inafunguka akitaka) ═══ */}
      {contactStats && (
        <div className="card p-4">
          <button type="button" onClick={() => setShowComm(!showComm)} className="w-full flex items-center justify-between">
            <h2 className="font-bold text-brand-grey-900 dark:text-white flex items-center gap-2">📊 {t('dash.contact_stats')}</h2>
            <span className="text-xs text-brand-grey-400">{showComm ? '▲' : '▼'} {t('action.view_all')}</span>
          </button>
          {showComm && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              <ContactStatCard
                icon="📥" title={t('contacts.incoming_calls')} count={contactStats.incoming_calls.count}
                people={contactStats.incoming_calls.people}
                open={openStat === 'incoming_calls'} onToggle={() => setOpenStat(openStat === 'incoming_calls' ? null : 'incoming_calls')}
              />
              <ContactStatCard
                icon="💬" title={t('contacts.incoming_messages')} count={contactStats.incoming_messages.count}
                people={contactStats.incoming_messages.people}
                open={openStat === 'incoming_messages'} onToggle={() => setOpenStat(openStat === 'incoming_messages' ? null : 'incoming_messages')}
              />
              <ContactStatCard
                icon="📤" title={t('contacts.outgoing_calls')} count={contactStats.outgoing_calls.count}
                people={contactStats.outgoing_calls.people}
                open={openStat === 'outgoing_calls'} onToggle={() => setOpenStat(openStat === 'outgoing_calls' ? null : 'outgoing_calls')}
              />
              <ContactStatCard
                icon="✉️" title={t('contacts.outgoing_messages')} count={contactStats.outgoing_messages.count}
                people={contactStats.outgoing_messages.people}
                open={openStat === 'outgoing_messages'} onToggle={() => setOpenStat(openStat === 'outgoing_messages' ? null : 'outgoing_messages')}
              />
            </div>
          )}
        </div>
      )}

      {/* Online now + live events */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1"><OnlineNowWidget /></div>
        <div className="md:col-span-2 card">
          <h3 className="font-bold text-brand-grey-900 dark:text-white mb-2">{t('dash.live_events')}</h3>
          <LiveEventsList key={pulse} />
        </div>
      </div>
    </div>
  );
}

function LiveEventsList() {
  const t = useT();
  const [events, setEvents] = useState<{ type: string; at: number; text: string }[]>([]);
  const { subscribe, connected } = useLive();
  useEffect(() => {
    const un = subscribe('*', (p: any) => {
      const type = p.event || p.type || 'unknown';
      if (type === 'pong') return;
      const text = type === 'match.found' ? `Match: ${p.candidate?.full_name || ''}` :
                   type === 'message.sent' ? `${t('dash.msg_from')} ${p.from_full_name || ''}` :
                   type === 'typing' ? `Typing: ${p.from_user_id}` :
                   type === 'call.initiated' ? `${t('dash.call_from')} ${p.from_full_name || ''}` :
                   type === 'user.registered' ? `${t('dash.new_registration')}: ${p.full_name || ''}` :
                   type === 'notification' ? `${p.title || ''}` : type;
      setEvents((prev) => [{ type, at: Date.now(), text }, ...prev].slice(0, 8));
    });
    return () => un();
  }, [subscribe]);
  return (
    <div>
      <div className={`text-xs mb-2 ${connected ? 'text-green-600' : 'text-brand-grey-500'}`}>
        {connected ? t('dash.ws_connected') : t('dash.ws_disconnected')}
      </div>
      {events.length === 0 && <div className="text-brand-grey-500 text-sm">{t('dash.no_events')}</div>}
      <div className="space-y-1">
        {events.map((e, i) => (
          <div key={i} className="text-xs flex items-center gap-2 py-1">
            <span className="badge-gold text-[10px]">{e.type}</span>
            <span className="text-brand-grey-700 dark:text-brand-grey-300 flex-1 truncate">{e.text}</span>
            <span className="text-brand-grey-400 text-[10px]">{new Date(e.at).toLocaleTimeString('sw-TZ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
