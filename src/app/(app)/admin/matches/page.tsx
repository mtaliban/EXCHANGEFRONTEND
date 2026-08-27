'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@/lib/config';
import { getRegions } from '@/lib/api';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';
import {
  Search, Phone, ArrowLeftRight, MapPin,
} from 'lucide-react';

/* ── Cadre options by category ───────────────────────────────── */
const EDUCATION_CADRES = [
  { code: 'TEACHER_PRIMARY', label: 'Mwalimu wa Msingi' },
  { code: 'TEACHER_SECONDARY', label: 'Mwalimu wa Sekondari' },
  { code: 'TEACHER_SPECIAL', label: 'Mwalimu wa Elimu ya Pekee' },
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

const CADRE_LABELS: Record<string, string> = Object.fromEntries(
  ALL_CADRES.map(c => [c.code, c.label])
);

function getCadreOptions(category: string) {
  if (category === 'education') return EDUCATION_CADRES;
  if (category === 'health') return HEALTH_CADRES;
  return ALL_CADRES;
}

function cadreLabel(code: string): string {
  return CADRE_LABELS[code] || code || '—';
}

function categoryLabel(cat: string): string {
  if (cat === 'education') return 'Elimu';
  if (cat === 'health') return 'Afya';
  return cat || '—';
}

function normPhone(p?: string): string {
  if (!p) return '';
  return p.replace(/[^0-9]/g, '').replace(/^255/, '0').replace(/^0/, '');
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function AdminMatchesPage() {
  const t = useT();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [regionId, setRegionId] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [cadreCode, setCadreCode] = useState('');
  const [sourceRegion, setSourceRegion] = useState<number | ''>('');
  const [regions, setRegions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const load = useCallback(async () => {
    if (!regionId) { setUsers([]); setTotal(0); setLoading(false); return; }
    setLoading(true);
    try {
      const raw = localStorage.getItem('kv_auth');
      let token: string | null = null;
      try { token = raw ? (JSON.parse(raw)?.state?.token || null) : null; } catch {}
      const params = new URLSearchParams({ region_id: String(regionId), limit: '500' });
      if (category) params.set('category', category);
      if (cadreCode) params.set('cadre_code', cadreCode);
      const res = await fetch(`${API_URL}/admin/incoming?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch { setUsers([]); setTotal(0); }
    finally { setLoading(false); }
  }, [regionId, category, cadreCode]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getRegions().then(setRegions).catch(() => {}); }, []);

  const filtered = users.filter((u) => {
    // Kutoka filter — chuja kwa mkoa wa chanzo
    if (sourceRegion) {
      const regionName = regions.find((r: any) => r.id === sourceRegion)?.name;
      if (regionName && u.current_region !== regionName) return false;
    }
    // Cadre filter — chuja kwa kada
    if (cadreCode && u.cadre_code !== cadreCode) return false;
    // Search filter
    if (!q) return sourceRegion || cadreCode ? true : true;
    const ql = q.toLowerCase();
    const qNorm = normPhone(q);
    const nameMatch = u.full_name?.toLowerCase().includes(ql);
    const phoneMatch =
      normPhone(u.phone_primary).includes(qNorm) ||
      normPhone(u.phone_alt).includes(qNorm) ||
      u.phone_primary?.includes(q) ||
      u.phone_alt?.includes(q);
    const cadreMatch =
      cadreLabel(u.cadre_code).toLowerCase().includes(ql) ||
      u.cadre_code?.toLowerCase().includes(ql) ||
      u.cadre_display?.toLowerCase().includes(ql);
    const districtMatch = u.current_district?.toLowerCase().includes(ql);
    return nameMatch || phoneMatch || cadreMatch || districtMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const regionName = regions.find((r) => r.id === regionId)?.name || '';

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* ═══ Header ═══ */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-brand-grey-900 flex items-center gap-2">
          <ArrowLeftRight size={22} className="text-brand-blue" />
          Wanaohamia Mkoa
        </h1>
        <p className="text-brand-grey-500 text-sm mt-0.5">
          {regionId
            ? `${filtered.length} ${filtered.length === 1 ? 'mtu' : 'watu'} wanataka kuhamia ${regionName}`
            : 'Chagua mkoa kuona watu wanaohamia'}
        </p>
      </div>

      {/* ═══ Filters ═══ */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select className="input sm:w-56" value={regionId} onChange={(e) => {
          setRegionId(e.target.value ? Number(e.target.value) : '');
          setPage(1);
        }}>
          <option value="">— Chagua Mkoa wa Lengo —</option>
          {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
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
          {getCadreOptions(category).map(c => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
        <select className="input sm:w-56" value={sourceRegion} onChange={(e) => {
          setSourceRegion(e.target.value ? Number(e.target.value) : '');
          setPage(1);
        }}>
          <option value="">Kutoka: Mikoa yote</option>
          {regions.map((r) => <option key={r.id} value={r.id}>Kutoka: {r.name}</option>)}
        </select>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey-400" />
          <input className="input pl-9 w-full" placeholder="Tafuta kwa jina, namba ya simu, kada au wilaya..."
            value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* ═══ Results ═══ */}
      {loading ? (
        <div className="py-8"><Spinner label={t('action.loading')} /></div>
      ) : !regionId ? (
        <div className="card text-center py-10">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-brand-grey-100 flex items-center justify-center">
            <ArrowLeftRight size={24} className="text-brand-grey-400" />
          </div>
          <p className="font-semibold text-brand-grey-700">Chagua mkoa wa lengo kuona watu wanaohamia</p>
          <p className="text-xs text-brand-grey-400 mt-1">Mtu yeyote wa Tanzania anayetaka kuja mkoa huu ataonekana hapa</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-10">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-brand-grey-100 flex items-center justify-center">
            <ArrowLeftRight size={24} className="text-brand-grey-400" />
          </div>
          <p className="font-semibold text-brand-grey-700">Hakuna mtu anaetaka kuhamia {regionName}{cadreCode ? ` wa kada hii` : ''}</p>
          <p className="text-xs text-brand-grey-400 mt-1">Wataonekana mtu anapojiunga na kuchagua mkoa huu kama lengo</p>
        </div>
      ) : (
        <>
          {/* ═══ GRID — 3 columns, data yote inaonekana ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pageItems.map((u) => (
              <UserCard key={u._id} user={u} destRegion={regionName} />
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

/* ═══ UserCard — data yote inaonekana bila kubofya ════════════════ */
function UserCard({ user: u, destRegion }: { user: any; destRegion: string }) {
  const initials = (u.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="rounded-xl bg-white dark:bg-brand-grey-900 border border-brand-grey-200 dark:border-brand-grey-600 p-4 flex flex-col gap-3 hover:border-brand-blue dark:hover:border-brand-grey-500 transition shadow-sm hover:shadow-md">
      {/* Jina + Avatar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-full bg-brand-blue text-white flex items-center justify-center text-sm font-bold">
            {initials}
          </div>
          {u.online && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-white dark:border-brand-grey-900" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-brand-grey-900 dark:text-white truncate">{u.full_name}</span>
            {u.is_verified && <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">✓</span>}
          </div>
          <div className="text-xs text-brand-grey-500 truncate">
            <span className="font-semibold text-brand-blue-600">{categoryLabel(u.category)}</span> · {cadreLabel(u.cadre_code)}
          </div>
        </div>
      </div>

      {/* Kutoka → Kuja */}
      <div className="bg-brand-grey-50 dark:bg-brand-grey-800 rounded-lg px-3 py-2 text-xs space-y-1.5">
        <div className="text-brand-grey-600 dark:text-brand-grey-300 font-medium">
          <MapPin size={10} className="inline" /> Kutoka: <b className="text-brand-grey-800 dark:text-brand-grey-200">{u.current_region}{u.current_district ? `, ${u.current_district}` : ''}</b>
        </div>
        <div className="text-brand-blue font-bold">
          <ArrowLeftRight size={10} className="inline" /> Kuja: <b>{destRegion}</b>
          {u.destination_district && <span className="font-medium">, {u.destination_district}</span>}
        </div>
      </div>

      {/* Masomo */}
      {u.subjects?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {u.subjects.slice(0, 5).map((s: string) => (
            <span key={s} className="px-2 py-0.5 rounded-full bg-brand-blue-50 text-brand-blue-700 text-xs font-semibold border border-brand-blue/10">{s}</span>
          ))}
          {u.subjects.length > 5 && <span className="text-brand-grey-400 text-xs">+{u.subjects.length - 5}</span>}
        </div>
      )}

      {/* Simu */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        {u.phone_primary && (
          <a href={`tel:${u.phone_primary}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-brand-grey-800 border border-brand-grey-200 dark:border-brand-grey-600 text-xs font-semibold text-brand-grey-900 dark:text-white hover:border-brand-blue transition flex-1 justify-center">
            <Phone size={12} /> {u.phone_primary}
          </a>
        )}
      </div>
    </div>
  );
}
