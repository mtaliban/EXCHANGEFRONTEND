'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { adminStats, adminUsers, adminMatches, adminEvents } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { parseServerDate } from '@/lib/dates';
import Spinner from '@/components/Spinner';

type Tab = 'overview' | 'users' | 'matches' | 'events';

export default function AdminPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminStats().then((s) => { setStats(s); setLoading(false); })
      .catch((e) => { setError(e?.response?.data?.detail || t('admin.no_permission')); setLoading(false); });
  }, []);

  if (loading) return <div className="p-10"><Spinner label={t('msg.loading')} /></div>;
  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="card bg-brand-red-50 border-brand-red-100">
          <h2 className="text-xl font-bold text-brand-red mb-2">{t('admin.no_permission')}</h2>
          <p className="text-brand-grey-700">{error}</p>
          <p className="text-xs text-brand-grey-500 mt-3">{t('admin.ask_admin')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-brand-grey-900">{t('admin.title')}</h1>
        <p className="text-brand-grey-500 text-sm mt-1">{t('admin.subtitle')}</p>
      </div>

      {/* Big totals row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Big color="blue"    label={t('admin.users')} value={stats.totals.users} sub={`+${stats.totals.users_active_7d} ${t('admin.active_7d')}`} />
        <Big color="orange"  label={t('admin.matches')}    value={stats.totals.matches} sub={`+${stats.totals.matches_24h} ${t('admin.last_24h')}`} />
        <Big color="red"     label={t('admin.events')}     value={stats.totals.events} sub={`+${stats.totals.events_24h} ${t('admin.last_24h')}`} />
        <Big color="gold"    label={t('admin.messages')}   value={stats.totals.messages} sub={`${stats.totals.calls} ${t('admin.calls')}`} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-brand-grey-200 flex-wrap">
        {(['overview', 'users', 'matches', 'events'] as Tab[]).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${tab === tb ? 'border-brand-blue text-brand-blue' : 'border-transparent text-brand-grey-500 hover:text-brand-grey-900'}`}>
            {tb === 'overview' ? t('admin.tab_overview') : tb === 'users' ? t('admin.tab_users') : tb === 'matches' ? t('admin.tab_matches') : t('admin.tab_events')}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview stats={stats} />}
      {tab === 'users' && <UsersTab />}
      {tab === 'matches' && <MatchesTab />}
      {tab === 'events' && <EventsTab />}
    </div>
  );
}

function Big({ color, label, value, sub }: { color: string; label: string; value: number; sub?: string }) {
  return (
    <div className="card">
      <div className={`text-3xl font-bold text-brand-${color}`}>{value?.toLocaleString?.() ?? value}</div>
      <div className="text-xs text-brand-grey-500 mt-1">{label}</div>
      {sub && <div className="text-[10px] text-brand-grey-400 mt-1">{sub}</div>}
    </div>
  );
}

function Overview({ stats }: { stats: any }) {
  const t = useT();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card">
        <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1">{t('admin.by_cadre')}</h3>
        <NumberTable rows={stats.by_cadre?.slice(0, 12).map((c: any) => ({ label: `${c.cadre} (${c.category})`, count: c.count }))} />
      </div>
      <div className="card">
        <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1">{t('admin.by_region')}</h3>
        <NumberTable rows={stats.by_region?.map((r: any) => ({ label: r.region, count: r.count }))} maxH />
      </div>
      <div className="card md:col-span-2">
        <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1">{t('admin.events_by_type')}</h3>
        <NumberTable rows={stats.events_by_type?.map((e: any) => ({ label: e.event_type, count: e.count }))} />
      </div>
    </div>
  );
}

/** Jedwali safi la NAMBA — hakuna graphs/bars. # | Jina | % | Idadi. */
function NumberTable({ rows, maxH = false }: { rows?: { label: string; count: number }[]; maxH?: boolean }) {
  const t = useT();
  if (!rows || rows.length === 0) {
    return <div className="py-4 text-sm text-brand-grey-400 dark:text-brand-grey-500">{t('msg.no_data')}</div>;
  }
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  return (
    <div className={maxH ? 'max-h-96 overflow-y-auto' : ''}>
      <div className="flex items-center gap-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-brand-grey-400 border-b border-brand-grey-100 dark:border-brand-grey-200">
        <span className="w-6 text-center">#</span>
        <span className="flex-1 min-w-0">{t('admin.col_name')}</span>
        <span className="w-10 text-right">%</span>
        <span className="w-12 text-right">{t('adminrep.count')}</span>
      </div>
      <div className="divide-y divide-brand-grey-100 dark:divide-brand-grey-200">
        {rows.map((r, i) => {
          const pct = Math.round((r.count / total) * 100);
          return (
            <div key={i} className="flex items-center gap-3 py-2">
              <span className="w-6 text-center text-xs font-bold text-brand-grey-400 dark:text-brand-grey-500">{i + 1}</span>
              <span className="flex-1 min-w-0 truncate text-sm text-brand-grey-700 dark:text-brand-grey-300">{r.label}</span>
              <span className="w-10 text-right text-xs text-brand-grey-400 dark:text-brand-grey-500">{pct}%</span>
              <span className="w-12 text-right text-lg font-bold text-brand-blue dark:text-brand-blue-500 tabular-nums">{r.count.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-brand-grey-100 dark:border-brand-grey-200 text-xs text-brand-grey-500 dark:text-brand-grey-400">
        <span>{t('admin.total')}</span>
        <span className="font-bold text-brand-grey-900 dark:text-white tabular-nums">{total.toLocaleString()}</span>
      </div>
    </div>
  );
}

function UsersTab() {
  const t = useT();
  const [data, setData] = useState<any>(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    adminUsers({ q: q || undefined, limit: 100 }).then(setData);
  }, [q]);
  return (
    <div className="space-y-3">
      <input className="input" placeholder={t('admin.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="text-xs text-brand-grey-500">{t('admin.total')} {data?.total ?? '...'}</div>
      <div className="bg-white rounded-2xl border border-brand-grey-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-grey-50 text-xs text-brand-grey-500">
            <tr>
              <th className="px-3 py-2 text-left">{t('admin.col_name')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_phone')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_cadre')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_region')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_dest')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_admin')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-grey-100">
            {data?.users?.map((u: any) => (
              <tr key={u._id} className="hover:bg-brand-grey-50">
                <td className="px-3 py-2 font-medium">{u.full_name}</td>
                <td className="px-3 py-2 text-brand-blue">{u.phone_primary}</td>
                <td className="px-3 py-2"><span className="badge-gold">{u.cadre_code}</span></td>
                <td className="px-3 py-2">{u.current_station?.region_name}</td>
                <td className="px-3 py-2 text-xs text-brand-grey-500">{u.desired_destinations?.map((d: any) => d.region_name).join(', ')}</td>
                <td className="px-3 py-2">{u.is_admin ? '👑' : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MatchesTab() {
  const t = useT();
  const [data, setData] = useState<any>(null);
  useEffect(() => { adminMatches(100).then(setData); }, []);
  return (
    <div className="space-y-3">
      <div className="text-xs text-brand-grey-500">{t('admin.total')} {data?.total ?? '...'}</div>
      <div className="bg-white rounded-2xl border border-brand-grey-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-grey-50 text-xs text-brand-grey-500">
            <tr>
              <th className="px-3 py-2 text-left">{t('admin.col_score')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_user_a')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_user_b')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_time')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-grey-100">
            {data?.matches?.map((m: any) => (
              <tr key={m._id}>
                <td className="px-3 py-2 font-bold">{Math.round(m.score * 100)}%</td>
                <td className="px-3 py-2">{m.user_a?.full_name} <span className="text-xs text-brand-grey-500">({m.user_a?.region}, {m.user_a?.cadre})</span></td>
                <td className="px-3 py-2">{m.user_b?.full_name} <span className="text-xs text-brand-grey-500">({m.user_b?.region}, {m.user_b?.cadre})</span></td>
                <td className="px-3 py-2 text-xs">{m.matched_at ? formatDistanceToNow(parseServerDate(m.matched_at) || new Date(), { addSuffix: true }) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventsTab() {
  const t = useT();
  const [data, setData] = useState<any>(null);
  const [type, setType] = useState('');
  useEffect(() => { adminEvents(type || undefined, 100).then(setData); }, [type]);
  return (
    <div className="space-y-3">
      <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
        <option value="">{t('admin.all_events')}</option>
        <option value="user.registered">user.registered</option>
        <option value="user.profile_updated">user.profile_updated</option>
        <option value="user.destination_changed">user.destination_changed</option>
        <option value="match.found">match.found</option>
        <option value="message.sent">message.sent</option>
        <option value="call.initiated">call.initiated</option>
      </select>
      <div className="text-xs text-brand-grey-500">{t('admin.total')} {data?.total ?? '...'}</div>
      <div className="bg-white rounded-2xl border border-brand-grey-100 overflow-hidden">
        {data?.events?.map((e: any) => (
          <div key={e._id} className="p-3 border-b border-brand-grey-100 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-gold">{e.event_type}</span>
              <span className="text-brand-grey-500">{e.topic}</span>
              <span className="ml-auto text-brand-grey-400">{(parseServerDate(e.occurred_at) || new Date()).toLocaleString('sw-TZ')}</span>
            </div>
            <div className="text-brand-grey-500 font-mono truncate">{JSON.stringify(e.payload)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
