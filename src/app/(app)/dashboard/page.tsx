'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getMatches, getMatchStats, getContactStats, logCall, type Match } from '@/lib/api';
import { useLiveEvents } from '@/lib/useLiveEvents';
import OnlineNowWidget from '@/components/OnlineNowWidget';
import RequestFeed from '@/components/RequestFeed';
import ContactStatCard from '@/components/ContactStatCard';
import { useLive } from '@/lib/liveSocket';
import { useT } from '@/lib/i18n';

type Tab = 'all' | 'region' | 'district' | 'facility';

export default function DashboardPage() {
  const t = useT();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('all');
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [contactStats, setContactStats] = useState<any>(null);
  const [openStat, setOpenStat] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ region_id?: number; district_id?: number; facility_id?: string }>({});
  const { connected, messages } = useLiveEvents(['match.found', 'user.registered']);

  async function reload() {
    setLoading(true);
    try {
      const [m, s, cs] = await Promise.all([getMatches(filter), getMatchStats(), getContactStats()]);
      setMatches(m.matches);
      setTotal(m.total);
      setStats(s);
      setContactStats(cs);
    } finally { setLoading(false); }
  }

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [filter.region_id, filter.district_id, filter.facility_id]);

  // Auto refresh when new relevant MQTT event arrives
  useEffect(() => {
    const latest = messages[messages.length - 1];
    if (!latest || !user) return;
    if (latest.topic === 'match.found' || latest.topic === 'user.registered') {
      // debounce with a small delay
      const t = setTimeout(() => reload(), 500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {/* ═══ REQUEST FEED (Uber-style) — juu, mpya kwanza ═══ */}
      <RequestFeed />

      {/* ═══ STATISTICS — aliowasiliana nao / waliopigiwa / SMS ═══ */}
      {contactStats && (
        <div>
          <h2 className="font-bold text-brand-grey-900 dark:text-white mb-2 flex items-center gap-2">📊 {t('dash.contact_stats')}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard color="blue" label={t('dash.stat_total')} value={stats?.total_matches ?? 0} />
        <StatCard color="orange" label={t('dash.stat_regions')} value={stats?.by_region?.length ?? 0} />
        <StatCard color="red" label={t('dash.stat_districts')} value={stats?.by_district?.length ?? 0} />
        <StatCard color="gold" label={t('dash.stat_facilities')} value={stats?.by_facility?.length ?? 0} />
      </div>

      {/* Online now — small widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1"><OnlineNowWidget /></div>
        <div className="md:col-span-2 card">
          <h3 className="font-bold text-brand-grey-900 dark:text-white mb-2">{t('dash.live_events')}</h3>
          <LiveEventsList />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="card">
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {(['all', 'region', 'district', 'facility'] as Tab[]).map((tb) => (
            <button
              key={tb}
              onClick={() => { setTab(tb); setFilter({}); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${tab === tb ? 'bg-brand-blue text-white' : 'bg-brand-grey-100 text-brand-grey-700 hover:bg-brand-grey-200'}`}
            >
              {tb === 'all' ? t('dash.filter_all') : tb === 'region' ? t('dash.filter_region') : tb === 'district' ? t('dash.filter_district') : t('dash.filter_facility')}
            </button>
          ))}
        </div>

        {tab === 'region' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {stats?.by_region?.map((r: any) => (
              <button key={r.region_id}
                onClick={() => setFilter({ region_id: r.region_id })}
                className={`p-2 rounded-lg border text-left text-sm ${filter.region_id === r.region_id ? 'bg-brand-blue-50 border-brand-blue' : 'border-brand-grey-200 hover:border-brand-blue'}`}>
                <div className="font-semibold">{r.region_name}</div>
                <div className="text-xs text-brand-grey-500">{r.count} mtumishi</div>
              </button>
            ))}
          </div>
        )}

        {tab === 'district' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 max-h-64 overflow-y-auto">
            {stats?.by_district?.map((d: any) => (
              <button key={d.district_id}
                onClick={() => setFilter({ district_id: d.district_id })}
                className={`p-2 rounded-lg border text-left text-sm ${filter.district_id === d.district_id ? 'bg-brand-orange-50 border-brand-orange' : 'border-brand-grey-200 hover:border-brand-orange'}`}>
                <div className="font-semibold">{d.district_name}</div>
                <div className="text-xs text-brand-grey-500">{d.region_name} • {d.count}</div>
              </button>
            ))}
          </div>
        )}

        {tab === 'facility' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 max-h-64 overflow-y-auto">
            {stats?.by_facility?.map((f: any) => (
              <button key={f.facility_id}
                onClick={() => setFilter({ facility_id: f.facility_id })}
                className={`p-2 rounded-lg border text-left text-sm ${filter.facility_id === f.facility_id ? 'bg-brand-red-50 border-brand-red' : 'border-brand-grey-200 hover:border-brand-red'}`}>
                <div className="font-semibold">{f.facility_name}</div>
                <div className="text-xs text-brand-grey-500">{f.district_name} • {f.count}</div>
              </button>
            ))}
            {(!stats?.by_facility?.length) && <div className="col-span-2 text-sm text-brand-grey-500 text-center py-4">{t('dash.no_facilities')}</div>}
          </div>
        )}

        {/* Matches list */}
        <div className="text-xs text-brand-grey-500 dark:text-brand-grey-400 mb-2">
          {loading ? t('dash.searching') : `${t('dash.showing')} ${matches.length} ${t('dash.of')} ${total}`}
        </div>

        {matches.length === 0 && !loading && (
          <div className="py-12 text-center text-brand-grey-500">
            <div className="text-5xl mb-3">🔎</div>
            <p>{t('dash.no_matches')}</p>
            <Link href="/profile" className="btn-primary mt-4 inline-block">{t('dash.improve_profile')}</Link>
          </div>
        )}

        <div className="space-y-2">
          {matches.map((m) => <MatchCard key={m.candidate.user_id} match={m} />)}
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

function StatCard({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="card">
      <div className={`text-3xl font-bold text-brand-${color}`}>{value}</div>
      <div className="text-xs text-brand-grey-500 dark:text-brand-grey-400 mt-1">{label}</div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const t = useT();
  const c = match.candidate;
  const scorePct = Math.round(match.score * 100);

  async function onCall() {
    try { await logCall(c.user_id, 'initiated'); } catch {}
    window.location.href = `tel:${c.phone_primary}`;
  }

  return (
    <div className="p-4 rounded-xl border border-brand-grey-100 dark:border-brand-grey-200 bg-white dark:bg-brand-grey-100 hover:shadow-md transition flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold flex-shrink-0">
        {c.full_name?.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-brand-grey-900 dark:text-white">{c.full_name}</span>
          <span className="badge-gold">{scorePct}% {t('dash.match')}</span>
        </div>
        <div className="text-xs text-brand-grey-500 dark:text-brand-grey-400 mt-1">{c.cadre_display} • {c.current_station?.district_name}, {c.current_station?.region_name}</div>
        {c.desired_destinations?.length > 0 && (
          <div className="text-xs text-brand-blue mt-1">
            {t('dash.wants')}: {c.desired_destinations.slice(0, 3).map((d: any) => d.region_name + (d.district_name ? ` (${d.district_name})` : '')).join(', ')}
            {c.desired_destinations.length > 3 ? ' ...' : ''}
          </div>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Link href={`/chats/${c.user_id}`} className="btn-primary text-sm px-3 py-2">💬</Link>
        <button onClick={onCall} className="btn-accent text-sm px-3 py-2">📞</button>
      </div>
    </div>
  );
}
