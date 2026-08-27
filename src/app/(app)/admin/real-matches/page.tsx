'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminRealMatches } from '@/lib/api';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';
import {
  ArrowLeftRight, Phone, MapPin, Star, Filter, Search, X,
} from 'lucide-react';

/* ── Cadre labels ─────────────────────────────────────────── */
const CADRE_LABELS: Record<string, string> = {
  TEACHER_PRIMARY: 'Mwalimu wa Msingi',
  TEACHER_SECONDARY: 'Mwalimu wa Sekondari',
  TEACHER_SPECIAL: 'Mwalimu wa Pekee',
  MD: 'Daktari (MD)',
  CO: 'Afisa wa Afya (CO)',
  ACO: 'Msaidizi wa Afisa wa Afya',
  CA: 'Msaidizi wa Kliniki',
  AMO: 'Msaidizi wa Daktari',
  NO: 'Afisa wa Ugojaji (NO)',
  RN: 'Muuguzi Aliyesajiliwa (RN)',
  EN: 'Muuguzi Aliyeandikwa (EN)',
  ANO: 'Msaidizi wa Ugojaji (ANO)',
  HA: 'Msaidizi wa Afya (HA)',
  MA: 'Msaidizi wa Matibabu (MA)',
  LAB_TECH_1: 'Teknolojia ya Maabara I',
  LAB_TECH_2: 'Teknolojia ya Maabara II',
  LAB_SCI_2: 'Wanasayansi wa Maabara II',
  LAB_ASST: 'Msaidizi wa Maabara',
  SR_LAB_ASST: 'Msaidizi Mkuu wa Maabara',
  MALT: 'Teknolojia ya Maabara ya Matibabu',
  PHARM_2: 'Daktari wa Pharmacy II',
};

function cadreLabel(code: string): string {
  return CADRE_LABELS[code] || code || '—';
}

function categoryLabel(cat: string): string {
  if (cat === 'education') return 'Elimu';
  if (cat === 'health') return 'Afya';
  return cat || '—';
}

function scoreBadge(score: number) {
  if (score >= 1.0) return { label: 'SAHIHI', color: 'bg-green-100 text-green-700 border-green-300' };
  if (score >= 0.85) return { label: 'NZURI', color: 'bg-blue-100 text-blue-700 border-blue-300' };
  return { label: 'POA', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
}

/* ── EDUCATION_CADRES + HEALTH_CADRES ───────────────────── */
const EDUCATION_CADRES = [
  { code: 'TEACHER_PRIMARY', label: 'Mwalimu wa Msingi' },
  { code: 'TEACHER_SECONDARY', label: 'Mwalimu wa Sekondari' },
  { code: 'TEACHER_SPECIAL', label: 'Mwalimu wa Pekee' },
];
const HEALTH_CADRES = [
  { code: 'MD', label: 'Daktari (MD)' },
  { code: 'CO', label: 'Afisa wa Afya (CO)' },
  { code: 'ACO', label: 'Msaidizi wa Afisa wa Afya' },
  { code: 'CA', label: 'Msaidizi wa Kliniki' },
  { code: 'AMO', label: 'Msaidizi wa Daktari' },
  { code: 'NO', label: 'Afisa wa Ugojaji (NO)' },
  { code: 'RN', label: 'Muuguzi Aliyesajiliwa (RN)' },
  { code: 'EN', label: 'Muuguzi Aliyeandikwa (EN)' },
  { code: 'ANO', label: 'Msaidizi wa Ugojaji (ANO)' },
  { code: 'HA', label: 'Msaidizi wa Afya (HA)' },
  { code: 'MA', label: 'Msaidizi wa Matibabu (MA)' },
  { code: 'LAB_TECH_1', label: 'Teknolojia ya Maabara I' },
  { code: 'LAB_TECH_2', label: 'Teknolojia ya Maabara II' },
  { code: 'LAB_SCI_2', label: 'Wanasayansi wa Maabara II' },
  { code: 'LAB_ASST', label: 'Msaidizi wa Maabara' },
  { code: 'SR_LAB_ASST', label: 'Msaidizi Mkuu wa Maabara' },
  { code: 'MALT', label: 'Teknolojia ya Maabara ya Matibabu' },
  { code: 'PHARM_2', label: 'Daktari wa Pharmacy II' },
];
const ALL_CADRES = [...EDUCATION_CADRES, ...HEALTH_CADRES];

function getCadreOptions(cat: string) {
  if (cat === 'education') return EDUCATION_CADRES;
  if (cat === 'health') return HEALTH_CADRES;
  return ALL_CADRES;
}

/* ── Main page ─────────────────────────────────────────────── */
export default function RealMatchesPage() {
  const t = useT();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [cadreCode, setCadreCode] = useState('');
  const [q, setQ] = useState('');
  const [subjectQ, setSubjectQ] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 500 };
      if (category) params.category = category;
      if (cadreCode) params.cadre_code = cadreCode;
      const data = await adminRealMatches(params, true);
      setMatches(data.matches || []);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [category, cadreCode]);

  useEffect(() => { load(); }, [load]);

  // Client-side search
  const filtered = matches.filter((m) => {
    if (q) {
      const ql = q.toLowerCase();
      const a = m.user_a;
      const b = m.user_b;
      const matchQ = (
        a.full_name?.toLowerCase().includes(ql) ||
        b.full_name?.toLowerCase().includes(ql) ||
        a.phone_primary?.includes(q) ||
        b.phone_primary?.includes(q) ||
        cadreLabel(a.cadre_code).toLowerCase().includes(ql) ||
        a.current_region?.toLowerCase().includes(ql) ||
        b.current_region?.toLowerCase().includes(ql)
      );
      if (!matchQ) return false;
    }
    if (subjectQ) {
      const sql = subjectQ.toUpperCase();
      const common = m.common_subjects || [];
      const aSubs = (m.user_a?.subjects || []).map((s: string) => s.toUpperCase());
      const bSubs = (m.user_b?.subjects || []).map((s: string) => s.toUpperCase());
      if (!common.some((s: string) => s.toUpperCase().includes(sql)) &&
          !aSubs.some((s: string) => s.includes(sql)) &&
          !bSubs.some((s: string) => s.includes(sql))) {
        return false;
      }
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* ═══ Header ═══ */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-brand-grey-900 flex items-center gap-2">
          <ArrowLeftRight size={22} className="text-green-600" />
          Match za Kweli
        </h1>
        <p className="text-brand-grey-500 text-sm mt-0.5">
          {loading ? 'Inapakia...' : `${filtered.length} ${filtered.length === 1 ? 'match' : 'matches'} zilizopatikana`}
        </p>
      </div>

      {/* ═══ Filters ═══ */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select className="input sm:w-44" value={category} onChange={(e) => {
          setCategory(e.target.value);
          setCadreCode('');
          setPage(1);
        }}>
          <option value="">Idara Zote</option>
          <option value="education">Elimu</option>
          <option value="health">Afya</option>
        </select>
        <select className="input sm:w-56" value={cadreCode} onChange={(e) => {
          setCadreCode(e.target.value);
          setPage(1);
        }}>
          <option value="">Kada Zote</option>
          {getCadreOptions(category).map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey-400" />
          <input className="input pl-9 w-full" placeholder="Tafuta kwa jina, namba, kada au mkoa..."
            value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <input className="input sm:w-36" placeholder="Somo (mfano MATH)"
          value={subjectQ} onChange={(e) => { setSubjectQ(e.target.value.toUpperCase()); setPage(1); }} />
        {(category || cadreCode || q || subjectQ) && (
          <button onClick={() => { setCategory(''); setCadreCode(''); setQ(''); setSubjectQ(''); setPage(1); }}
            className="btn-outline text-xs flex items-center gap-1 whitespace-nowrap">
            <X size={14} /> Futa
          </button>
        )}
      </div>

      {/* ═══ Results ═══ */}
      {loading ? (
        <div className="py-8"><Spinner label={t('action.loading')} /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-10">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-brand-grey-100 flex items-center justify-center">
            <ArrowLeftRight size={24} className="text-brand-grey-400" />
          </div>
          <p className="font-semibold text-brand-grey-700">Hakuna match iliyopatikana</p>
          <p className="text-xs text-brand-grey-400 mt-1">Watumiaji wataonekana wanapojiunga na kuchagua destinations</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {pageItems.map((m, idx) => (
              <MatchCard key={idx} match={m} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button type="button" disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                className="min-w-[44px] min-h-[44px] px-3 rounded-xl border border-brand-grey-200 text-sm font-semibold text-brand-grey-700 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition">
                ← Rudi
              </button>
              <span className="text-sm font-bold text-brand-grey-500 px-2">
                {safePage} / {totalPages}
              </span>
              <button type="button" disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                className="min-w-[44px] min-h-[44px] px-3 rounded-xl border border-brand-grey-200 text-sm font-semibold text-brand-grey-700 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition">
                Endelea →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══ MatchCard — inaonyesha match moja kamili ════════════════ */
function MatchCard({ match: m }: { match: any }) {
  const a = m.user_a;
  const b = m.user_b;
  const sb = scoreBadge(m.score);

  return (
    <div className="rounded-xl bg-white dark:bg-brand-grey-900 border border-brand-grey-200 dark:border-brand-grey-600 p-4 hover:border-green-400 dark:hover:border-green-600 transition shadow-sm hover:shadow-md">
      {/* Header: Score + Cadre + Common Subjects */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sb.color}`}>
            {sb.label} ({(m.score * 100).toFixed(0)}%)
          </span>
          <span className="text-xs text-brand-grey-500">
            {categoryLabel(m.category)} · {cadreLabel(m.cadre_code)}
          </span>
        </div>
        <Star size={14} className="text-yellow-500" />
      </div>

      {/* Common Subjects (masomo yanayofanana) */}
      {m.common_subjects && m.common_subjects.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-3 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <span className="text-[10px] font-bold text-green-700 dark:text-green-400">Masomo Yanayofanana:</span>
          {m.common_subjects.map((s: string) => (
            <span key={s} className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-600 text-white">
              {s} ✓
            </span>
          ))}
        </div>
      )}

      {/* Two users side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-center">
        {/* User A */}
        <UserHalf user={a} side="A" />

        {/* Arrow */}
        <div className="hidden sm:flex flex-col items-center justify-center">
          <ArrowLeftRight size={20} className="text-green-600" />
          <span className="text-[9px] text-brand-grey-400 mt-0.5">KUBADILISHANA</span>
        </div>

        {/* User B */}
        <UserHalf user={b} side="B" />
      </div>
    </div>
  );
}

/* ═══ UserHalf — nusu ya match card ═══════════════════════════ */
function UserHalf({ user: u, side }: { user: any; side: string }) {
  const initials = (u.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="rounded-lg bg-brand-grey-50 dark:bg-brand-grey-800 p-3 space-y-2">
      {/* Name + Avatar */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-brand-grey-900 dark:text-white truncate">{u.full_name}</span>
            {u.is_verified && <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded-full">✓</span>}
          </div>
          <div className="text-[11px] text-brand-grey-500 truncate">{u.cadre_display}</div>
        </div>
      </div>

      {/* Location */}
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-1 text-brand-grey-600">
          <MapPin size={10} className="flex-shrink-0" />
          <span>Kutoka: <b>{u.current_region}{u.current_district ? `, ${u.current_district}` : ''}</b></span>
        </div>
        <div className="flex items-center gap-1 text-green-700 font-semibold">
          <ArrowLeftRight size={10} className="flex-shrink-0" />
          <span>Anataka: <b>{u.destinations?.join(', ') || '—'}</b></span>
        </div>
      </div>

      {/* Subjects / Masomo */}
      {u.subjects && u.subjects.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {u.subjects.map((s: string) => (
            <span key={s} className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Phone */}
      {u.phone_primary && (
        <a href={`tel:${u.phone_primary}`}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white dark:bg-brand-grey-700 border border-brand-grey-200 dark:border-brand-grey-600 text-[11px] font-semibold text-brand-grey-900 dark:text-white hover:border-green-400 transition w-full justify-center">
          <Phone size={10} /> {u.phone_primary}
        </a>
      )}
    </div>
  );
}
