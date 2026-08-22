'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adminStats, adminReports, adminUsers, adminListDepartments } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';
import {
  Users, ShieldCheck, MapPin, Building2, BookOpen, BarChart3,
  UsersRound, Search, Eye, Pencil, Bell, Zap, UserPlus, Wallet, ClipboardList, KeyRound,
} from 'lucide-react';

type Tab = 'overview' | 'users';

/**
 * REAL-TIME: SSE feed ya admin — tukio lolote (user.registered, donation
 * approved, match.found, data.* ...) linajirefresh takwimu PAPO HAPO bila
 * ku-refresh page (event-driven, kama WhatsApp — hakuna kubonyeza refresh).
 */
function useLiveStatsRefresh(onEvent: (ev: any) => void) {
  useEffect(() => {
    let aborter: AbortController | null = null;
    let retry: any = null;
    let stopped = false;
    async function connect() {
      try {
        const raw = localStorage.getItem('kv_auth');
        let token: string | null = null;
        try { token = raw ? (JSON.parse(raw)?.state?.token || null) : null; } catch {}
        aborter = new AbortController();
        const res = await fetch(`${API_URL}/admin/live-events`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: aborter.signal,
        });
        if (!res.ok || !res.body) throw new Error('feed failed');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const chunk = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const line = chunk.split('\n').find((l) => l.startsWith('data: '));
            if (line) {
              try { const ev = JSON.parse(line.slice(6)); onEvent(ev); } catch {}
            }
          }
        }
      } catch {}
      if (!stopped) retry = setTimeout(connect, 3000);
    }
    connect();
    return () => {
      stopped = true;
      aborter?.abort();
      if (retry) clearTimeout(retry);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default function AdminPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const lastEvent = useRef(0);
  // Filters za Statistics — zinabofya/zinabadilika → data inajirefresh PAPO HAPO
  // (event-driven, bila refresh page). Filter hizi zinatumwa kwenye /admin/reports.
  const [filters, setFilters] = useState<{ region: string; level: string; category: string }>({ region: '', level: '', category: '' });
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadAll = useCallback((f: typeof filtersRef.current = filtersRef.current) => {
    adminStats().then(setStats).catch(() => {});
    adminReports(365, f).then(setReports).catch(() => {});
  }, []);

  useEffect(() => {
    adminStats().then((s) => { setStats(s); setLoading(false); })
      .catch((e) => { setError(e?.response?.data?.detail || t('admin.no_permission')); setLoading(false); });
    adminReports(365).then(setReports).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // REAL-TIME FILTERS: dropdown (mkoa/kada/idara) ikibadilika → data yote
  // inajirefresh PAPO HAPO bila refresh ya page (event-driven kama WebSocket).
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // REAL-TIME: tukio lolote → takwimu zinajirefresh PAPO HAPO (debounced).
  useLiveStatsRefresh(() => {
    setLive(true);
    const now = Date.now();
    if (now - lastEvent.current < 1500) return;
    lastEvent.current = now;
    loadAll();
  });
  useEffect(() => {
    const id = setTimeout(() => setLive(false), 8000);
    return () => clearTimeout(id);
  }, [live]);

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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-grey-900">{t('admin.title')}</h1>
          <p className="text-brand-grey-500 text-sm mt-1">{t('admin.subtitle')}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
          live ? 'bg-green-50 text-green-600 border-green-300' : 'bg-brand-grey-50 text-brand-grey-400 border-brand-grey-200'}`}>
          <span className={`w-2 h-2 rounded-full ${live ? 'bg-green-500 animate-pulse' : 'bg-brand-grey-300'}`} />
          {t('data.live')}
        </span>
      </div>

      {/* Big totals row — namba halisi: users + verified. (Malipo, Matukio na
          Mechi hazionyeshwi hapa — zina sehemu zao: Malipo page, Matukio page
          na Reports.) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Big color="blue" label={t('admin.users')} value={stats.totals.users} sub={`+${stats.totals.users_active_7d} ${t('admin.active_7d')}`} />
        <Big color="gold" label={t('admin.verified')} value={stats.totals.users_verified} />
        <Big color="green" label={t('admin.regions_total')} value={reports?.regions_total ?? '—'} />
      </div>

      {/* RECENT ACTIVITY — matukio ya hivi karibuni real-time */}
      <RecentActivity />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-brand-grey-200 flex-wrap">
        {(['overview', 'users'] as Tab[]).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${tab === tb ? 'border-brand-blue text-brand-blue' : 'border-transparent text-brand-grey-500 hover:text-brand-grey-900'}`}>
            {tb === 'overview' ? t('admin.tab_overview') : t('admin.tab_users')}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview stats={stats} reports={reports} filters={filters} onFilters={setFilters} />}
      {tab === 'users' && <UsersTab />}
    </div>
  );
}

function Big({ color, label, value, sub }: { color: string; label: string; value: number | string; sub?: string }) {
  return (
    <div className="card">
      <div className={`text-3xl font-bold text-brand-${color} tabular-nums`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-xs text-brand-grey-500 mt-1">{label}</div>
      {sub && <div className="text-[10px] text-brand-grey-400 mt-1">{sub}</div>}
    </div>
  );
}

/** Recent Activity — matukio ya hivi karibuni kwenye mfumo (real-time). */
function RecentActivity() {
  const t = useT();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('@/lib/api').then(({ getNotifications }) =>
      getNotifications(10, true).then((d) => {
        setEvents(d.notifications || []);
        setLoading(false);
      }).catch(() => setLoading(false))
    );
  }, []);

  const iconFor = (type: string) => {
    switch (type) {
      case 'user.registered': return <UserPlus size={14} className="text-blue-500" />;
      case 'payment.submitted': case 'payment.approved': case 'payment.rejected': return <Wallet size={14} className="text-green-500" />;
      case 'feedback.new': case 'feedback.replied': return <ClipboardList size={14} className="text-orange-500" />;
      case 'password_reset.new': return <KeyRound size={14} className="text-purple-500" />;
      case 'data.changed': return <Zap size={14} className="text-yellow-500" />;
      default: return <Bell size={14} className="text-brand-grey-400" />;
    }
  };

  if (loading || events.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-brand-grey-100 p-4">
      <h3 className="font-bold text-brand-grey-900 mb-2 flex items-center gap-1.5">
        <Bell size={15} /> Matukio ya Hivi Karibuni
      </h3>
      <div className="space-y-1.5">
        {events.slice(0, 6).map((e: any) => (
          <div key={e.notification_id} className="flex items-center gap-2 py-1.5 border-b border-brand-grey-50 last:border-0">
            {iconFor(e.type)}
            <span className="flex-1 text-xs font-medium text-brand-grey-700 truncate">{e.title}</span>
            <span className="text-[10px] text-brand-grey-400 flex-shrink-0">{e.created_at ? new Date(e.created_at).toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Takwimu kuu: mikoa (wako + wanaohamia), wilaya, idara, kada, michango. */
function Overview({ stats, reports, filters, onFilters }: {
  stats: any; reports: any;
  filters: { region: string; level: string; category: string };
  onFilters: (f: { region: string; level: string; category: string }) => void;
}) {
  const t = useT();
  const [departments, setDepartments] = useState<any[]>([]);
  const { region, level, category: department } = filters;
  const setRegion = (v: string) => onFilters({ ...filters, region: v });
  const setDepartment = (v: string) => onFilters({ ...filters, category: v });
  const setLevel = (v: string) => onFilters({ ...filters, level: v });

  // Idara zinapakuliwa dynamic — idara mpya inaonekana kwenye filter na
  // takwimu PAPO HAPO bila refresh (real-time, event-driven).
  useEffect(() => { adminListDepartments().then(setDepartments).catch(() => {}); }, []);

  const usersByRegion = reports?.users_by_region || [];
  const incomingByRegion = reports?.incoming_by_region || [];
  const usersByDistrict = reports?.users_by_district || [];
  const incomingByDistrict = reports?.incoming_by_district || [];
  const incomingSources = reports?.incoming_sources || [];

  // Ramani: category code → jina la idara (dynamic).
  const deptName = (code: string) => {
    if (!code) return '-';
    const found = departments.find((d) => d.code === code);
    return found ? `${found.icon ? `${found.icon} ` : ''}${found.name}` : code;
  };

  // Mikoa yote iliyopo (wako au wanaohamia) kwa ajili ya filter.
  const allRegions = Array.from(new Set([
    ...usersByRegion.map((r: any) => r.region),
    ...incomingByRegion.map((r: any) => r.region),
  ].filter(Boolean))).sort((a: string, b: string) => a.localeCompare(b));

  // Kila mkoa: waliopo + wanaohamia, sorted kwa Jumla (kubwa → ndogo).
  const byRegion = allRegions.map((name: string) => {
    const cur = usersByRegion.find((r: any) => r.region === name)?.count || 0;
    const inc = incomingByRegion.find((r: any) => r.region === name)?.count || 0;
    return { region: name, current: cur, incoming: inc };
  }).filter((r: any) => !region || r.region === region)
    .sort((a: any, b: any) => (b.current + b.incoming) - (a.current + a.incoming));

  const byDistrict = usersByDistrict
    .map((d: any) => ({
      region: d.region, district: d.district,
      current: d.count,
      incoming: incomingByDistrict.find((x: any) => x.district === d.district && x.region === d.region)?.count || 0,
    }))
    .filter((d: any) => d.current > 0 || d.incoming > 0)
    .sort((a: any, b: any) => (b.current + b.incoming) - (a.current + a.incoming));

  const byCadre = (reports?.users_by_cadre || [])
    .sort((a: any, b: any) => b.count - a.count);

  // Pangilia kwa kupungua (kubwa juu) — "kwenye statistics hujui kupangilia".
  const byCategory = [...(reports?.users_by_category || [])]
    .sort((a: any, b: any) => (b.count || 0) - (a.count || 0));
  const byStatus = [...(reports?.users_by_status || [])]
    .sort((a: any, b: any) => (b.count || 0) - (a.count || 0));

  // Walimu kwa NGazi (Primary/Secondary) — "Walimu wa Secondary wangapi".
  const byCadreLevel = (reports?.users_by_cadre || [])
    .reduce((acc: Record<string, number>, c: any) => {
      const key = c.level === 'Primary' ? 'primary' : c.level === 'Secondary' ? 'secondary' : 'none';
      acc[key] = (acc[key] || 0) + c.count;
      return acc;
    }, { primary: 0, secondary: 0, none: 0 });

  // Idadi ya mikoa na wilaya ZOTE zilizopo kwenye system.
  const regionsTotal = reports?.regions_total ?? allRegions.length;
  const districtsTotal = reports?.districts_total ?? byDistrict.length;
  const usersTotal = byRegion.reduce((s: number, r: any) => s + r.current, 0);

  // Wanaohamia wanatoka mikoa ipi — kwa mkoa uliochaguliwa (au zote).
  const sourcesFor = (toRegion: string) => incomingSources
    .filter((s: any) => s.to === toRegion)
    .sort((a: any, b: any) => b.count - a.count);

  return (
    <div className="space-y-4">
      {/* Filters — chuja takwimu zote PAPO HAPO (hakuna refresh). Kubadilisha
          filter kunatumwa kwenye backend → data yote inajirefresh papo hapo. */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select className="input sm:w-56" value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">{t('admin.filter_all_regions')}</option>
          {allRegions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="input sm:w-56" value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">{t('admin.filter_all_departments')}</option>
          {departments.map((d) => (
            <option key={d.code} value={d.code}>{d.icon ? `${d.icon} ` : ''}{d.name}</option>
          ))}
        </select>
        <select className="input sm:w-44" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">{t('admin.filter_all_levels')}</option>
          <option value="Primary">Primary (Msingi)</option>
          <option value="Secondary">Secondary (Sekondari)</option>
        </select>
      </div>

      {/* Big numbers: mikoa yote, wilaya zote, watumiaji (waliopo), wanaohamia */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Big color="blue" label={t('admin.regions_total')} value={regionsTotal} />
        <Big color="gold" label={t('admin.districts_total')} value={districtsTotal} />
        <Big color="green" label={t('admin.users_total')} value={usersTotal} />
        <Big color="orange" label={t('admin.incoming_total')} value={incomingByRegion.reduce((s: number, r: any) => s + r.count, 0)} />
      </div>

      {/* Idara (departments) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1">{t('admin.by_department')}</h3>
          <NumberTable rows={byCategory.map((c: any) => ({ label: deptName(c.category), count: c.count }))} />
        </div>
        <div className="card">
          <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1">{t('admin.by_status')}</h3>
          <NumberTable rows={byStatus.map((s: any) => ({ label: s.status, count: s.count }))} />
        </div>
      </div>

      {/* Mikoa — waliopo + wanaohamia, kila mkoa */}
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h3 className="font-bold text-brand-grey-900 dark:text-white">{t('admin.regions_stats')}</h3>
          <span className="text-[11px] text-brand-grey-400">{t('admin.regions_stats_hint')}</span>
        </div>
        <div className={byRegion.length > 12 ? 'max-h-96 overflow-y-auto' : ''}>
          <div className="flex items-center gap-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-brand-grey-400 border-b border-brand-grey-100 dark:border-brand-grey-200">
            <span className="w-6 text-center">#</span>
            <span className="flex-1 min-w-0">{t('admin.col_region_short')}</span>
            <span className="w-16 text-right">{t('admin.current_users')}</span>
            <span className="w-16 text-right">{t('admin.incoming')}</span>
            <span className="w-14 text-right">{t('adminrep.count')}</span>
          </div>
          <div className="divide-y divide-brand-grey-100 dark:divide-brand-grey-200">
            {byRegion.map((r: any, i: number) => {
              const total = r.current + r.incoming;
              const max = Math.max(1, ...byRegion.map((x: any) => x.current + x.incoming));
              return (
                <div key={r.region} className="flex items-center gap-3 py-2">
                  <span className="w-6 text-center text-xs font-bold text-brand-grey-400 dark:text-brand-grey-500">{i + 1}</span>
                  <span className="flex-1 min-w-0 truncate text-sm text-brand-grey-700 dark:text-brand-grey-300">{r.region}</span>
                  <span className="w-16 text-right text-sm font-semibold text-brand-grey-700 dark:text-brand-grey-300 tabular-nums">{r.current}</span>
                  <span className="w-16 text-right text-sm font-semibold text-brand-orange tabular-nums">{r.incoming}</span>
                  <div className="w-14">
                    <div className="h-1.5 rounded-full bg-brand-grey-100 dark:bg-brand-grey-200 overflow-hidden">
                      <div className="h-full rounded-full bg-brand-blue" style={{ width: `${(total / max) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {byRegion.length === 0 && <div className="py-4 text-sm text-brand-grey-400">{t('msg.no_data')}</div>}
        </div>
      </div>

      {/* Wilaya za mkoa uliochagua (au zote) */}
      <div className="card">
        <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1">
          {t('admin.by_district')}{region ? ` — ${region}` : ''}
        </h3>
        <div className={byDistrict.length > 12 ? 'max-h-96 overflow-y-auto' : ''}>
          <div className="flex items-center gap-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-brand-grey-400 border-b border-brand-grey-100 dark:border-brand-grey-200">
            <span className="w-6 text-center">#</span>
            <span className="flex-1 min-w-0">{region ? t('admin.col_district') : `${t('admin.col_region_short')} / ${t('admin.col_district')}`}</span>
            <span className="w-16 text-right">{t('admin.current_users')}</span>
            <span className="w-16 text-right">{t('admin.incoming')}</span>
            <span className="w-14 text-right">{t('adminrep.count')}</span>
          </div>
          <div className="divide-y divide-brand-grey-100 dark:divide-brand-grey-200">
            {byDistrict.map((d: any, i: number) => (
              <div key={`${d.region}-${d.district}`} className="flex items-center gap-3 py-2">
                <span className="w-6 text-center text-xs font-bold text-brand-grey-400 dark:text-brand-grey-500">{i + 1}</span>
                <span className="flex-1 min-w-0 truncate text-sm text-brand-grey-700 dark:text-brand-grey-300">
                  {region ? d.district : `${d.region} — ${d.district}`}
                </span>
                <span className="w-16 text-right text-sm font-semibold text-brand-grey-700 dark:text-brand-grey-300 tabular-nums">{d.current}</span>
                <span className="w-16 text-right text-sm font-semibold text-brand-orange tabular-nums">{d.incoming}</span>
                <span className="w-14 text-right text-lg font-bold text-brand-blue dark:text-brand-blue-500 tabular-nums">{d.current + d.incoming}</span>
              </div>
            ))}
          </div>
          {byDistrict.length === 0 && <div className="py-4 text-sm text-brand-grey-400">{t('msg.no_data')}</div>}
        </div>
      </div>

      {/* Walimu kwa Ngazi (Primary/Secondary) — "Walimu wa Secondary wangapi" */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1">{t('admin.by_cadre_level')}</h3>
          <NumberTable rows={[
            { label: t('admin.primary_teachers'), count: byCadreLevel.primary },
            { label: t('admin.secondary_teachers'), count: byCadreLevel.secondary },
            { label: t('admin.no_level'), count: byCadreLevel.none },
          ]} />
        </div>
      </div>

      {/* Kada (zilizochujwa) + Wanaohamia wanatoka mikoa ipi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1">{t('admin.by_cadre')}</h3>
          <NumberTable rows={byCadre.slice(0, 20).map((c: any) => ({ label: `${c.cadre_name || c.cadre}${c.level ? ` (${c.level})` : ''}`, count: c.count }))} maxH />
        </div>
        <div className="card">
          <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1">
            {t('admin.incoming_sources')}{region ? ` — ${region}` : ''}
          </h3>
          <div className="text-xs text-brand-grey-500 mb-2">{t('admin.incoming_sources_hint')}</div>
          <div className={incomingSources.length > 12 ? 'max-h-96 overflow-y-auto' : ''}>
            <div className="flex items-center gap-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-brand-grey-400 border-b border-brand-grey-100 dark:border-brand-grey-200">
              <span className="w-6 text-center">#</span>
              <span className="flex-1 min-w-0">{t('admin.col_from_region')}</span>
              <span className="w-16 text-right">{t('admin.col_to_region')}</span>
              <span className="w-12 text-right">{t('adminrep.count')}</span>
            </div>
            <div className="divide-y divide-brand-grey-100 dark:divide-brand-grey-200">
              {incomingSources.map((s: any, i: number) => (
                <div key={`${s.from}-${s.to}`} className="flex items-center gap-3 py-2">
                  <span className="w-6 text-center text-xs font-bold text-brand-grey-400 dark:text-brand-grey-500">{i + 1}</span>
                  <span className="flex-1 min-w-0 truncate text-sm text-brand-grey-700 dark:text-brand-grey-300">{s.from}</span>
                  <span className="w-16 text-right text-sm text-brand-orange tabular-nums">{s.to}</span>
                  <span className="w-12 text-right text-lg font-bold text-brand-blue dark:text-brand-blue-500 tabular-nums">{s.count}</span>
                </div>
              ))}
            </div>
            {incomingSources.length === 0 && <div className="py-4 text-sm text-brand-grey-400">{t('msg.no_data')}</div>}
          </div>
        </div>
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
                <td className="px-3 py-2"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-blue-50 text-brand-blue-700 text-xs font-semibold"><BookOpen size={10} />{u.cadre_code}</span></td>
                <td className="px-3 py-2">{u.current_station?.region_name}</td>
                <td className="px-3 py-2 text-xs text-brand-grey-500">{u.desired_destinations?.map((d: any) => d.region_name).join(', ')}</td>
                <td className="px-3 py-2">{u.is_admin ? <ShieldCheck size={14} className="text-brand-blue" /> : <span className="text-brand-grey-400">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


