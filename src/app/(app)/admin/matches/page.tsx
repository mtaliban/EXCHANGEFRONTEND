'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '@/lib/config';
import { getRegions } from '@/lib/api';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';
import {
  Users, Search, Phone, Eye, Zap, MapPin, BookOpen,
  ChevronDown, ChevronUp, ArrowLeft,
} from 'lucide-react';

/** SSE real-time feed — match.new / user.registered → auto refresh */
function useLiveMatches(onEvent: (ev: any) => void) {
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
              try { onEvent(JSON.parse(line.slice(6))); } catch {}
            }
          }
        }
      } catch {}
      if (!stopped) retry = setTimeout(connect, 3000);
    }
    connect();
    return () => { stopped = true; aborter?.abort(); if (retry) clearTimeout(retry); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default function AdminMatchesPage() {
  const t = useT();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [regions, setRegions] = useState<any[]>([]);
  const [live, setLive] = useState(false);
  const lastEvent = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = localStorage.getItem('kv_auth');
      let token: string | null = null;
      try { token = raw ? (JSON.parse(raw)?.state?.token || null) : null; } catch {}
      const res = await fetch(`${API_URL}/admin/users/with-matches`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setMatches(data.users || []);
    } catch { setMatches([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getRegions().then(setRegions).catch(() => {}); }, []);

  // Real-time refresh on events
  useLiveMatches(() => {
    setLive(true);
    const now = Date.now();
    if (now - lastEvent.current < 2000) return;
    lastEvent.current = now;
    load();
  });
  useEffect(() => {
    const id = setTimeout(() => setLive(false), 8000);
    return () => clearTimeout(id);
  }, [live]);

  // Filter
  const filtered = matches.filter((u) => {
    if (q) {
      const ql = q.toLowerCase();
      const nameMatch = u.full_name?.toLowerCase().includes(ql);
      const phoneMatch = u.phone_primary?.includes(q);
      const cadreMatch = u.cadre_display?.toLowerCase().includes(ql) || u.cadre_code?.toLowerCase().includes(ql);
      if (!nameMatch && !phoneMatch && !cadreMatch) return false;
    }
    if (regionFilter) {
      const hasDest = u.desired_destinations?.some((d: any) => String(d.region_id) === regionFilter);
      if (!hasDest) return false;
    }
    return true;
  });

  const totalMatches = filtered.reduce((s, u) => s + (u.match_count || 0), 0);

  if (loading) return <div className="p-10"><Spinner label={t('msg.loading')} /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-grey-900 flex items-center gap-2">
            <Users size={24} className="text-brand-blue" />
            Waliopata Wenzao
          </h1>
          <p className="text-brand-grey-500 text-sm mt-1">
            {filtered.length} watu · {totalMatches} michango jumla
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            live ? 'bg-green-50 text-green-600 border-green-300' : 'bg-brand-grey-50 text-brand-grey-400 border-brand-grey-200'}`}>
            <span className={`w-2 h-2 rounded-full ${live ? 'bg-green-500 animate-pulse' : 'bg-brand-grey-300'}`} />
            LIVE
          </span>
          <button onClick={load} className="btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1">
            <Zap size={12} /> Sasisha
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey-400" />
          <input className="input pl-9 w-full" placeholder="Tafuta jina, simu au kada..."
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-56" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
          <option value="">Mikoa yote</option>
          {regions.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
        </select>
      </div>

      {/* Users table */}
      {filtered.length === 0 ? (
        <div className="card text-center py-10">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-brand-grey-100 flex items-center justify-center">
            <Users size={24} className="text-brand-grey-400" />
          </div>
          <p className="font-semibold text-brand-grey-700">Hakuna mtu aliye na michango kwa sasa</p>
          <p className="text-xs text-brand-grey-400 mt-1">Michango itaonekana mtu anapopata mtu wa kubadilishana naye</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <UserMatchCard key={u._id} user={u} regions={regions} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function UserMatchCard({ user, regions, onRefresh }: { user: any; regions: any[]; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const st = user.current_station || {};
  const dests = user.desired_destinations || [];

  return (
    <div className="rounded-xl bg-white dark:bg-brand-grey-900 border border-brand-grey-200 dark:border-brand-grey-600 overflow-hidden">
      {/* Header row — click to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-brand-grey-50 dark:hover:bg-brand-grey-800 transition text-left"
      >
        <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          {user.full_name?.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-brand-grey-900 dark:text-white text-sm truncate">{user.full_name}</span>
            {user.online && <span className="text-[10px] font-bold text-green-500">● LIVE</span>}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-brand-grey-500 flex-wrap mt-0.5">
            <span className="font-medium">{user.cadre_display || user.cadre_code}</span>
            {st.region_name && <span className="flex items-center gap-0.5"><MapPin size={10} /> {st.region_name}</span>}
            {user.subjects?.length > 0 && (
              <span className="flex items-center gap-0.5"><BookOpen size={10} /> {user.subjects.join(', ')}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-lg font-bold text-brand-blue tabular-nums">{user.match_count || 0}</div>
            <div className="text-[10px] text-brand-grey-400">matches</div>
          </div>
          <div className="text-brand-grey-300">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>

      {/* Expanded — destinations + match details */}
      {expanded && (
        <div className="border-t border-brand-grey-100 dark:border-brand-grey-700 p-3 space-y-3">
          {/* Destinations */}
          {dests.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-brand-grey-400 mb-1">Anataka kwenda</div>
              <div className="flex flex-wrap gap-1.5">
                {dests.map((d: any, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-blue-50 dark:bg-brand-blue-950/40 text-brand-blue text-[11px] font-semibold">
                    <MapPin size={10} /> {d.district_name || ''} {d.region_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact row */}
          <div className="flex items-center gap-2 flex-wrap">
            <a href={`tel:${user.phone_primary}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-brand-grey-800 border border-brand-grey-200 dark:border-brand-grey-600 text-xs font-semibold text-brand-grey-900 dark:text-white hover:border-brand-blue transition">
              <Phone size={12} /> {user.phone_primary}
            </a>
            {user.phone_alt && (
              <a href={`https://wa.me/${user.phone_alt.replace(/\D/g, '').replace(/^0/, '255')}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-brand-grey-800 border border-brand-grey-200 dark:border-brand-grey-600 text-xs font-semibold text-green-600 hover:border-green-400 transition">
                WhatsApp
              </a>
            )}
          </div>

          {/* WALE AMBAO AMEMATCH NAO — orodha kamili */}
          {user.matched_users && user.matched_users.length > 0 ? (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-brand-grey-400 mb-1.5">
                Waliopata — <span className="text-brand-blue">{user.matched_users.length} wenzake</span>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {user.matched_users.map((m: any) => (
                  <div key={m.user_id} className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg bg-white dark:bg-brand-grey-900 border border-brand-grey-100 dark:border-brand-grey-700">
                    <div className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {m.full_name?.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-brand-grey-900 dark:text-white truncate">{m.full_name}</div>
                      <div className="text-[11px] text-brand-grey-500 truncate">
                        {m.cadre_display || '—'} · {[m.district_name, m.region_name].filter(Boolean).join(', ')}
                      </div>
                      {m.subjects?.length > 0 && (
                        <div className="text-[10px] text-brand-grey-400 mt-0.5">Masomo: {m.subjects.join(', ')}</div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {typeof m.score === 'number' && (
                        <div className="text-xs font-bold text-brand-blue">{Math.round(m.score * 100)}%</div>
                      )}
                      {m.phone_primary && (
                        <a href={`tel:${m.phone_primary}`} className="text-[11px] text-brand-grey-600 hover:underline">
                          {m.phone_primary}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-brand-grey-400 py-2 text-center">Hakuna taarifa za waliokutanishwa</div>
          )}
        </div>
      )}
    </div>
  );
}
