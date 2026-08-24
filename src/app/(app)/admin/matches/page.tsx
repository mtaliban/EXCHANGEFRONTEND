'use client';

import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@/lib/config';
import { getRegions } from '@/lib/api';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';
import {
  Search, Phone, Zap, ArrowLeftRight, MapPin, ChevronDown, ChevronUp,
} from 'lucide-react';

/* ── Cadre label map ───────────────────────────────────────────── */
const CADRE_LABELS: Record<string, string> = {
  TEACHER_PRIMARY: 'Walimu wa Msingi',
  TEACHER_SECONDARY: 'Walimu wa Sekondari',
  CO: 'Afisa Afya',
  HA: 'Msaidizi wa Afya',
  EN: 'Enrolled Nurse',
  MA: 'Medical Attendant',
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

/* ── Normalize phone for search ────────────────────────────────── */
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
  const [regions, setRegions] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    if (!regionId) { setUsers([]); setTotal(0); setLoading(false); return; }
    setLoading(true);
    try {
      const raw = localStorage.getItem('kv_auth');
      let token: string | null = null;
      try { token = raw ? (JSON.parse(raw)?.state?.token || null) : null; } catch {}
      const params = new URLSearchParams({ region_id: String(regionId), limit: '500' });
      if (category) params.set('category', category);
      const res = await fetch(`${API_URL}/admin/incoming?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch { setUsers([]); setTotal(0); }
    finally { setLoading(false); }
  }, [regionId, category]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getRegions().then(setRegions).catch(() => {}); }, []);

  /* ── Client-side filter by search ─────────────────────────────── */
  const filtered = users.filter((u) => {
    if (!q) return true;
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

  const toggleExpand = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const regionName = regions.find((r) => r.id === regionId)?.name || '';

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-2">
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
          setPage(1);
        }}>
          <option value="">Idara Zote</option>
          <option value="education">Elimu</option>
          <option value="health">Afya</option>
        </select>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey-400" />
          <input className="input pl-9 w-full" placeholder="Tafuta jina, simu, kada au wilaya..."
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
          <p className="font-semibold text-brand-grey-700">Hakuna mtu anaetaka kuhamia {regionName}</p>
          <p className="text-xs text-brand-grey-400 mt-1">Wataonekana mtu anapojiunga na kuchagua mkoa huu kama lengo</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {pageItems.map((u) => (
              <UserCard
                key={u._id}
                user={u}
                isOpen={!!expanded[u._id]}
                onToggle={() => toggleExpand(u._id)}
                destRegion={regionName}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-1">
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

/* ═══ UserCard ═══════════════════════════════════════════════════ */
function UserCard({ user: u, isOpen, onToggle, destRegion }: { user: any; isOpen: boolean; onToggle: () => void; destRegion: string }) {
  const initials = (u.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="rounded-xl bg-white dark:bg-brand-grey-900 border border-brand-grey-200 dark:border-brand-grey-600 overflow-hidden">
      {/* ═══ Header — click to expand ═══ */}
      <button
        onClick={onToggle}
        className="w-full text-left p-3 md:p-4 hover:bg-brand-grey-50 dark:hover:bg-brand-grey-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
            {u.online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-white dark:border-brand-grey-900" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-brand-grey-900 dark:text-white truncate">{u.full_name}</span>
              {u.is_verified && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 rounded-full">✓ Verified</span>}
            </div>
            <div className="text-[11px] text-brand-grey-500 truncate mt-0.5">
              <span className="font-semibold text-brand-blue-600">{categoryLabel(u.category)}</span>
              {' · '}
              <span>{cadreLabel(u.cadre_code)}</span>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center flex-shrink-0 px-1">
            <ArrowLeftRight size={16} className="text-brand-blue" />
          </div>

          {/* Destination */}
          <div className="flex-shrink-0 text-right">
            <div className="text-[11px] text-brand-grey-400">Anataka kuja</div>
            <div className="text-sm font-extrabold text-brand-blue">{destRegion}</div>
          </div>

          {/* Expand */}
          <div className="flex-shrink-0 ml-1">
            {isOpen ? <ChevronUp size={16} className="text-brand-grey-400" /> : <ChevronDown size={16} className="text-brand-grey-400" />}
          </div>
        </div>
      </button>

      {/* ═══ Details — inaonekana ukibofya ═══ */}
      {isOpen && (
        <div className="border-t border-brand-grey-100 dark:border-brand-grey-700 px-3 md:px-4 pb-3 md:pb-4 pt-3 space-y-3">
          {/* Sentesi */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
            <p className="text-[12px] text-brand-grey-700 dark:text-brand-grey-200 leading-relaxed">
              <span className="font-bold text-brand-grey-900 dark:text-white">{u.full_name}</span>
              {' '}— {cadreLabel(u.cadre_code)} kutoka{' '}
              <span className="font-bold">{u.current_region}{u.current_district ? `, ${u.current_district}` : ''}</span>
              {u.current_facility && <>, {u.current_facility}</>}
              {' '}anataka kuhamia <span className="font-bold text-brand-blue">{destRegion}</span>
              {u.destination_district && <>, {u.destination_district}</>}
            </p>
          </div>

          {/* Masomo */}
          {u.subjects?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              <span className="text-brand-grey-500 font-semibold">Masomo:</span>
              {u.subjects.map((s: string) => (
                <span key={s} className="px-1.5 py-0.5 rounded-full bg-brand-blue-50 text-brand-blue-700 font-semibold">{s}</span>
              ))}
            </div>
          )}

          {/* Mikoa mingine anayotaka */}
          {u.all_destinations?.length > 1 && (
            <div className="text-[11px] text-brand-grey-500">
              <MapPin size={11} className="inline" /> Mikoa mingine anayotaka: {u.all_destinations.filter((r: string) => r !== destRegion).join(', ')}
            </div>
          )}

          {/* Simu + Tarehe */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {u.phone_primary && (
                <a href={`tel:${u.phone_primary}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-brand-grey-800 border border-brand-grey-200 dark:border-brand-grey-600 text-[11px] font-semibold text-brand-grey-900 dark:text-white hover:border-brand-blue transition">
                  <Phone size={10} /> {u.phone_primary}
                </a>
              )}
              {u.phone_alt && u.phone_alt !== u.phone_primary && (
                <a href={`tel:${u.phone_alt}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-brand-grey-800 border border-brand-grey-200 dark:border-brand-grey-600 text-[11px] font-semibold text-brand-grey-900 dark:text-white hover:border-brand-blue transition">
                  <Phone size={10} /> {u.phone_alt}
                </a>
              )}
            </div>
            {u.created_at && (
              <span className="text-[10px] text-brand-grey-400">
                {new Date(u.created_at).toLocaleDateString('sw-TZ', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
