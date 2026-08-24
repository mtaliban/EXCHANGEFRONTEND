'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '@/lib/config';
import { getRegions } from '@/lib/api';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';
import {
  Users, Search, Phone, Zap, MapPin, BookOpen,
  ArrowLeftRight,
} from 'lucide-react';

/** SSE real-time feed — match.found / user.registered → auto refresh */
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
      const res = await fetch(`${API_URL}/admin/matches?limit=500`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setMatches(data.matches || []);
    } catch { setMatches([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getRegions().then(setRegions).catch(() => {}); }, []);

  // Real-time refresh on match.found events
  useLiveMatches((ev) => {
    if (ev.topic === 'match.found' || ev.topic === 'user.registered') {
      setLive(true);
      const now = Date.now();
      if (now - lastEvent.current < 2000) return;
      lastEvent.current = now;
      load();
    }
  });
  useEffect(() => {
    const id = setTimeout(() => setLive(false), 8000);
    return () => clearTimeout(id);
  }, [live]);

  // Filter by search + region
  const filtered = matches.filter((m) => {
    const a = m.user_a || {};
    const b = m.user_b || {};
    if (q) {
      const ql = q.toLowerCase();
      const nameMatch = a.full_name?.toLowerCase().includes(ql) || b.full_name?.toLowerCase().includes(ql);
      const phoneMatch = a.phone?.includes(q) || b.phone?.includes(q);
      const cadreMatch = a.cadre?.toLowerCase().includes(ql) || b.cadre?.toLowerCase().includes(ql);
      if (!nameMatch && !phoneMatch && !cadreMatch) return false;
    }
    if (regionFilter) {
      const aRegion = a.region || '';
      const bRegion = b.region || '';
      // Show matches where EITHER side is in the selected region
      if (aRegion !== regionFilter && bRegion !== regionFilter) return false;
    }
    return true;
  });

  if (loading) return <div className="p-10"><Spinner label={t('msg.loading')} /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-grey-900 flex items-center gap-2">
            <ArrowLeftRight size={24} className="text-brand-blue" />
            Waliopata Wenzao
          </h1>
          <p className="text-brand-grey-500 text-sm mt-1">
            {filtered.length} matches jumla
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
          {regions.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
        </select>
      </div>

      {/* Match cards */}
      {filtered.length === 0 ? (
        <div className="card text-center py-10">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-brand-grey-100 flex items-center justify-center">
            <ArrowLeftRight size={24} className="text-brand-grey-400" />
          </div>
          <p className="font-semibold text-brand-grey-700">Hakuna mtu bado amepata mtu wa kubadilishana naye</p>
          <p className="text-xs text-brand-grey-400 mt-1">Wataonekana mtu anapopata mtu anayefanana naye kwenye dashboard yake</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <MatchCard key={m._id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: any }) {
  const a = match.user_a || {};
  const b = match.user_b || {};
  const score = match.score ? Math.round(match.score * 100) : null;
  const matchedAt = match.matched_at ? new Date(match.matched_at) : null;

  return (
    <div className="rounded-xl bg-white dark:bg-brand-grey-900 border border-brand-grey-200 dark:border-brand-grey-600 p-3 md:p-4">
      {/* Header — mtu A ↔ mtu B */}
      <div className="flex items-center gap-3">
        {/* Mtu A */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {a.full_name?.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-brand-grey-900 dark:text-white truncate">{a.full_name}</div>
              <div className="text-[11px] text-brand-grey-500 truncate">
                {a.cadre || '—'} · <span className="text-brand-blue font-semibold">{a.region || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow — inaonyesha kubadilishana */}
        <div className="flex flex-col items-center flex-shrink-0 px-2">
          <ArrowLeftRight size={18} className="text-brand-blue" />
          {score !== null && (
            <span className="text-[10px] font-bold text-brand-blue mt-0.5">{score}%</span>
          )}
        </div>

        {/* Mtu B */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {b.full_name?.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-brand-grey-900 dark:text-white truncate">{b.full_name}</div>
              <div className="text-[11px] text-brand-grey-500 truncate">
                {b.cadre || '—'} · <span className="text-emerald-600 font-semibold">{b.region || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maelezo — nani anataka kwenda wapi */}
      <div className="mt-2.5 bg-brand-grey-50 dark:bg-brand-grey-800 rounded-lg px-3 py-2 text-[11px] text-brand-grey-600 dark:text-brand-grey-300">
        <span className="font-semibold text-brand-grey-900 dark:text-white">{a.full_name?.split(' ')[0]}</span>
        {' '}yupo <span className="font-bold text-brand-blue">{a.region}</span> na anataka kuenda{' '}
        <span className="font-bold text-emerald-600">{b.region}</span> —{' '}
        <span className="font-semibold text-brand-grey-900 dark:text-white">{b.full_name?.split(' ')[0]}</span>
        {' '}yupo <span className="font-bold text-emerald-600">{b.region}</span> na anataka kuenda{' '}
        <span className="font-bold text-brand-blue">{a.region}</span>
      </div>

      {/* Simu + Tarehe */}
      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {a.phone && (
            <a href={`tel:${a.phone}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-brand-grey-800 border border-brand-grey-200 dark:border-brand-grey-600 text-[11px] font-semibold text-brand-grey-900 dark:text-white hover:border-brand-blue transition">
              <Phone size={10} /> {a.full_name?.split(' ')[0]}: {a.phone}
            </a>
          )}
          {b.phone && (
            <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-brand-grey-800 border border-brand-grey-200 dark:border-brand-grey-600 text-[11px] font-semibold text-brand-grey-900 dark:text-white hover:border-emerald-400 transition">
              <Phone size={10} /> {b.full_name?.split(' ')[0]}: {b.phone}
            </a>
          )}
        </div>
        {matchedAt && (
          <span className="text-[10px] text-brand-grey-400">
            {matchedAt.toLocaleDateString('sw-TZ', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}
