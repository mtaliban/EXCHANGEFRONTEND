'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getMatches, getMatchStats, logCall, type Match } from '@/lib/api';
import { useMqttTopics } from '@/lib/useLiveEvents';

type Tab = 'all' | 'region' | 'district' | 'facility';

export default function DashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('all');
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ region_id?: number; district_id?: number; facility_id?: string }>({});
  const { connected, messages } = useMqttTopics(['kv/match/found', 'kv/user/registered']);

  async function reload() {
    setLoading(true);
    try {
      const [m, s] = await Promise.all([getMatches(filter), getMatchStats()]);
      setMatches(m.matches);
      setTotal(m.total);
      setStats(s);
    } finally { setLoading(false); }
  }

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [filter.region_id, filter.district_id, filter.facility_id]);

  // Auto refresh when new relevant MQTT event arrives
  useEffect(() => {
    const latest = messages[messages.length - 1];
    if (!latest || !user) return;
    if (latest.topic === 'kv/match/found' || latest.topic === 'kv/user/registered') {
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
          <h1 className="text-2xl md:text-3xl font-bold text-brand-grey-900">
            Karibu, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-brand-grey-500 text-sm mt-1">
            Wewe ni <b>{user?.cadre_display || user?.cadre_code}</b> — sasa <b>{myStation?.district_name}</b>, <b>{myStation?.region_name}</b>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${connected ? 'bg-brand-blue-100 text-brand-blue' : 'bg-brand-grey-200 text-brand-grey-500'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-brand-blue animate-pulse' : 'bg-brand-grey-500'}`} />
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard color="blue" label="Jumla ya Watu Wanaotafuta" value={stats?.total_matches ?? 0} />
        <StatCard color="orange" label="Mikoa Inayohusika" value={stats?.by_region?.length ?? 0} />
        <StatCard color="red" label="Wilaya Inayohusika" value={stats?.by_district?.length ?? 0} />
        <StatCard color="gold" label="Vituo Mahsusi" value={stats?.by_facility?.length ?? 0} />
      </div>

      {/* Filter tabs */}
      <div className="card">
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {(['all', 'region', 'district', 'facility'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setFilter({}); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${tab === t ? 'bg-brand-blue text-white' : 'bg-brand-grey-100 text-brand-grey-700 hover:bg-brand-grey-200'}`}
            >
              {t === 'all' ? 'Wote' : t === 'region' ? 'Kwa Mkoa' : t === 'district' ? 'Kwa Wilaya' : 'Kwa Kituo'}
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
            {(!stats?.by_facility?.length) && <div className="col-span-2 text-sm text-brand-grey-500 text-center py-4">Hakuna vituo mahsusi bado.</div>}
          </div>
        )}

        {/* Matches list */}
        <div className="text-xs text-brand-grey-500 mb-2">
          {loading ? 'Inatafuta...' : `Wanaonyeshwa: ${matches.length} kati ya ${total}`}
        </div>

        {matches.length === 0 && !loading && (
          <div className="py-12 text-center text-brand-grey-500">
            <div className="text-5xl mb-3">🔎</div>
            <p>Hakuna mtu bado. Angalia baadaye au boresha maeneo unayotaka kwenda.</p>
            <Link href="/profile" className="btn-primary mt-4 inline-block">Boresha Wasifu</Link>
          </div>
        )}

        <div className="space-y-2">
          {matches.map((m) => <MatchCard key={m.candidate.user_id} match={m} />)}
        </div>
      </div>
    </div>
  );
}

function StatCard({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="card">
      <div className={`text-3xl font-bold text-brand-${color}`}>{value}</div>
      <div className="text-xs text-brand-grey-500 mt-1">{label}</div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const c = match.candidate;
  const scorePct = Math.round(match.score * 100);

  async function onCall() {
    try { await logCall(c.user_id, 'initiated'); } catch {}
    window.location.href = `tel:${c.phone_primary}`;
  }

  return (
    <div className="p-4 rounded-xl border border-brand-grey-100 bg-white hover:shadow-md transition flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold flex-shrink-0">
        {c.full_name?.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-brand-grey-900">{c.full_name}</span>
          <span className="badge-gold">{scorePct}% mechi</span>
        </div>
        <div className="text-xs text-brand-grey-500 mt-1">{c.cadre_display} • {c.current_station?.district_name}, {c.current_station?.region_name}</div>
        {c.desired_destinations?.length > 0 && (
          <div className="text-xs text-brand-blue mt-1">
            Anataka: {c.desired_destinations.slice(0, 3).map((d: any) => d.region_name + (d.district_name ? ` (${d.district_name})` : '')).join(', ')}
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
