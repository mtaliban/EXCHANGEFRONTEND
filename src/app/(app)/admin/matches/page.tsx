'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '@/lib/config';
import { getRegions } from '@/lib/api';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';
import {
  Search, Phone, Zap, ArrowLeftRight, MapPin, ChevronDown, ChevronUp,
} from 'lucide-react';

/* ── SSE real-time feed ─────────────────────────────────────────── */
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
  }, []);
}

/* ── Cadre label map ───────────────────────────────────────────── */
const CADRE_LABELS: Record<string, string> = {
  TEACHER_PRIMARY: 'Walimu wa Msingi',
  TEACHER_SECONDARY: 'Walimu wa Sekondari',
  CO: 'Afisa Afya',
  HA: 'Msaidizi wa Afya',
  EN: 'Mkurugenzi wa Usajili',
  MA: 'Msimamizi wa Afya',
  NU: 'Muuguzi',
};

function cadreLabel(code: string): string {
  return CADRE_LABELS[code] || code || '—';
}

function categoryLabel(cat: string): string {
  if (cat === 'education') return 'Elimu';
  if (cat === 'health') return 'Afya';
  return cat || '—';
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function AdminMatchesPage() {
  const t = useT();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [regions, setRegions] = useState<any[]>([]);
  const [live, setLive] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
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

  /* Real-time refresh on match.found / user.registered */
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

  /* ── Filter by search + region ─────────────────────────────────── */
  /* Normalize phone: +255745587187 → 0745587187, 255745587187, etc. */
  function normPhone(p?: string): string {
    if (!p) return '';
    return p.replace(/[^0-9]/g, '').replace(/^255/, '0').replace(/^0/, '');
  }
  const filtered = matches.filter((m) => {
    const a = m.user_a || {};
    const b = m.user_b || {};
    if (q) {
      const ql = q.toLowerCase();
      const qNorm = normPhone(q);
      const nameMatch =
        a.full_name?.toLowerCase().includes(ql) ||
        b.full_name?.toLowerCase().includes(ql);
      const phoneMatch =
        normPhone(a.phone).includes(qNorm) ||
        normPhone(b.phone).includes(qNorm) ||
        a.phone?.includes(q) || b.phone?.includes(q);
      const cadreMatch =
        cadreLabel(a.cadre).toLowerCase().includes(ql) ||
        cadreLabel(b.cadre).toLowerCase().includes(ql) ||
        a.cadre?.toLowerCase().includes(ql) ||
        b.cadre?.toLowerCase().includes(ql);
      const regionMatch =
        a.region?.toLowerCase().includes(ql) ||
        b.region?.toLowerCase().includes(ql);
      if (!nameMatch && !phoneMatch && !cadreMatch && !regionMatch) return false;
    }
    if (regionFilter) {
      const aRegion = a.region || '';
      const bRegion = b.region || '';
      if (aRegion !== regionFilter && bRegion !== regionFilter) return false;
    }
    return true;
  });

  const toggleExpand = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  if (loading) return <div className="p-10"><Spinner label={t('msg.loading')} /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-brand-grey-900 flex items-center gap-2">
            <ArrowLeftRight size={22} className="text-brand-blue" />
            Waliopata Wenzao
          </h1>
          <p className="text-brand-grey-500 text-sm mt-0.5">
            {filtered.length} {filtered.length === 1 ? 'match' : 'matches'}
            {regionFilter ? ` kutoka ${regionFilter}` : ''} jumla
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

      {/* ═══ Filters ═══ */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey-400" />
          <input className="input pl-9 w-full" placeholder="Tafuta jina, simu, kada au mkoa..."
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input sm:w-56" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
          <option value="">Mikoa yote</option>
          {regions.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
        </select>
      </div>

      {/* ═══ Match cards ═══ */}
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
            <MatchCard
              key={m._id}
              match={m}
              isOpen={!!expanded[m._id]}
              onToggle={() => toggleExpand(m._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══ MatchCard ═══════════════════════════════════════════════════ */
function MatchCard({ match, isOpen, onToggle }: { match: any; isOpen: boolean; onToggle: () => void }) {
  const a = match.user_a || {};
  const b = match.user_b || {};
  const matchedAt = match.matched_at ? new Date(match.matched_at) : null;

  /* Sentesi rasmi: "Walimu wa Sekondari kutoka Mwanza wanataka kuhamia Mbeya" */
  const aLabel = `${cadreLabel(a.cadre)} kutoka ${a.region || '?'}`;
  const bLabel = `${cadreLabel(b.cadre)} kutoka ${b.region || '?'}`;
  const aDests = (a.destinations || []).join(', ');
  const bDests = (b.destinations || []).join(', ');

  return (
    <div className="rounded-xl bg-white dark:bg-brand-grey-900 border border-brand-grey-200 dark:border-brand-grey-600 overflow-hidden">
      {/* ═══ Header — click to expand ═══ */}
      <button
        onClick={onToggle}
        className="w-full text-left p-3 md:p-4 hover:bg-brand-grey-50 dark:hover:bg-brand-grey-800 transition-colors"
      >
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
                  {cadreLabel(a.cadre)} · <span className="text-brand-blue font-semibold">{a.region}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center flex-shrink-0 px-2">
            <ArrowLeftRight size={18} className="text-brand-blue" />
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
                  {cadreLabel(b.cadre)} · <span className="text-emerald-600 font-semibold">{b.region}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expand icon */}
          <div className="flex-shrink-0 ml-1">
            {isOpen ? <ChevronUp size={16} className="text-brand-grey-400" /> : <ChevronDown size={16} className="text-brand-grey-400" />}
          </div>
        </div>
      </button>

      {/* ═══ Details — inaonekana ukibofya ═══ */}
      {isOpen && (
        <div className="border-t border-brand-grey-100 dark:border-brand-grey-700 px-3 md:px-4 pb-3 md:pb-4 pt-3 space-y-3">
          {/* Sentesi ya Mtu A */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
            <p className="text-[12px] text-brand-grey-700 dark:text-brand-grey-200 leading-relaxed">
              <span className="font-bold text-brand-grey-900 dark:text-white">{a.full_name}</span>
              {' '}— {aLabel}
              {aDests ? (
                <> anataka kuhamia <span className="font-bold text-emerald-600">{aDests}</span></>
              ) : (
                <> — destination bado haijawekwa</>
              )}
            </p>
          </div>

          {/* Sentesi ya Mtu B */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
            <p className="text-[12px] text-brand-grey-700 dark:text-brand-grey-200 leading-relaxed">
              <span className="font-bold text-brand-grey-900 dark:text-white">{b.full_name}</span>
              {' '}— {bLabel}
              {bDests ? (
                <> anataka kuhamia <span className="font-bold text-brand-blue">{bDests}</span></>
              ) : (
                <> — destination bado haijawekwa</>
              )}
            </p>
          </div>

          {/* Simu + Tarehe */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
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
      )}
    </div>
  );
}
