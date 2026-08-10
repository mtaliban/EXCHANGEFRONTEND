'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  getBoard, getRegions, getDistricts, getFacilities,
  getFollowedRegions, updateFollowedRegions, logCall,
  type Region, type District, type Facility,
} from '@/lib/api';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { useLive } from '@/lib/liveSocket';
import { useT } from '@/lib/i18n';

type Scope = 'incoming' | 'all';

export default function DashboardBoard() {
  const t = useT();
  const { user } = useAuth();
  const myStation = (user?.current_station || {}) as any;
  const dests = (user?.desired_destinations || []) as any[];
  const myCategory = user?.category;
  const isEdu = myCategory === 'education';

  // Mikoa YOTE anayotaka kwenda (k.m. Dar + Mwanza) — default inachuja kwa zote.
  const destRegionIds = useMemo(
    () => Array.from(new Set(dests.map((d) => d.region_id).filter((x): x is number => typeof x === 'number'))),
    [dests]
  );
  const destRegionNames = useMemo(
    () => Array.from(new Set(dests.map((d) => d.region_name).filter(Boolean))),
    [dests]
  );

  const [scope, setScope] = useState<Scope>('incoming');
  // Chanzo: '__dests__' = Mikoa yangu yote (default), '' = Mikoa yote, '123' = mkoa mmoja
  const [regionSel, setRegionSel] = useState<string>(destRegionIds.length > 0 ? '__dests__' : '');
  const [districtId, setDistrictId] = useState<number | undefined>();
  const [facilityId, setFacilityId] = useState<string | undefined>();
  const [board, setBoard] = useState<any>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [followed, setFollowed] = useState<number[]>([]);
  const [followSaved, setFollowSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const { connected } = useLive();
  const { messages } = useLiveEvents(['match.found', 'user.registered']);

  // Mkoa mmoja halisi uliochaguliwa: '__dests__' yenye destination moja pia
  // inamfanya kuwa mkoa huo (district/kituo vinafanya kazi mara moja).
  const singleRegion = useMemo(() => {
    if (regionSel === '__dests__') return destRegionIds.length === 1 ? destRegionIds[0] : undefined;
    if (regionSel === '') return undefined;
    const n = Number(regionSel);
    return Number.isNaN(n) ? undefined : n;
  }, [regionSel, destRegionIds]);

  const effectiveRegionIds = useMemo(() => {
    if (regionSel === '__dests__') return destRegionIds;
    if (singleRegion !== undefined) return [singleRegion];
    return [];
  }, [regionSel, destRegionIds, singleRegion]);

  const loadBoard = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { scope };
      if (effectiveRegionIds.length) params.region_ids = effectiveRegionIds.join(',');
      if (districtId !== undefined) params.district_id = districtId;
      if (facilityId !== undefined) params.facility_id = facilityId;
      const b = await getBoard(params);
      setBoard(b);
    } finally {
      setLoading(false);
    }
  }, [scope, effectiveRegionIds, districtId, facilityId]);

  // Load regions + followed on mount
  useEffect(() => {
    getRegions().then(setRegions).catch(() => {});
    getFollowedRegions().then((r) => setFollowed(r.region_ids)).catch(() => {});
  }, []);

  // Cascading: wilaya za mkoa mmoja uliochagua
  useEffect(() => {
    if (singleRegion !== undefined) {
      getDistricts(singleRegion).then(setDistricts).catch(() => setDistricts([]));
    } else {
      setDistricts([]);
    }
    setDistrictId(undefined);
    setFacilities([]);
    setFacilityId(undefined);
  }, [singleRegion]);

  // Cascading: vituo vya wilaya iliyochaguliwa
  useEffect(() => {
    if (districtId !== undefined) {
      getFacilities(districtId, (myCategory as any) || 'health').then(setFacilities).catch(() => setFacilities([]));
    } else {
      setFacilities([]);
    }
    setFacilityId(undefined);
  }, [districtId, myCategory]);

  useEffect(() => { loadBoard(); }, [loadBoard]);

  // Auto-refresh on live events
  useEffect(() => {
    if (!messages.length) return;
    const latest = messages[messages.length - 1];
    if (latest.topic === 'match.found' || latest.topic === 'user.registered') {
      const tId = setTimeout(() => loadBoard(), 500);
      return () => clearTimeout(tId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const toggleFollow = async (rid: number) => {
    const next = followed.includes(rid) ? followed.filter((x) => x !== rid) : [...followed, rid];
    setFollowed(next);
    setFollowSaved(true);
    try { await updateFollowedRegions(next); } finally {
      setTimeout(() => setFollowSaved(false), 2000);
    }
  };

  const clearFilters = () => {
    setRegionSel('__dests__');
    setDistrictId(undefined);
    setFacilityId(undefined);
  };

  const currentRegionName = useMemo(() => {
    if (singleRegion !== undefined) {
      const r = regions.find((x) => x.id === singleRegion);
      if (r) return r.name;
    }
    return null;
  }, [singleRegion, regions]);

  // Stats chips: facility → district → region (kiwango cha sasa)
  const chips = useMemo(() => {
    if (!board) return { list: [] as any[], color: 'blue' };
    if (facilityId) return { list: board.by_facility || [], color: 'red' };
    if (districtId) return { list: board.by_district || [], color: 'orange' };
    return { list: board.by_region || [], color: 'blue' };
  }, [board, facilityId, districtId]);

  const activeFilterLabel = facilityId
    ? chips.list.find((c: any) => c.facility_id === facilityId)?.facility_name
    : districtId
      ? chips.list.find((c: any) => c.district_id === districtId)?.district_name
      : currentRegionName
        ? currentRegionName
        : regionSel === '__dests__' && destRegionNames.length
          ? destRegionNames.join(', ')
          : null;

  const hasFilter = effectiveRegionIds.length > 0 || districtId !== undefined || facilityId !== undefined;

  return (
    <div className="space-y-4">
      {/* ═══ AD-BOARD: Stats juu — wanaokuja mkoa wako ═══ */}
      <div className="card overflow-hidden">
        <div className="p-4 md:p-5 border-b border-brand-grey-100 dark:border-brand-grey-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-lg text-brand-grey-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-orange inline-block animate-pulse" />
              {t('board.title')} <span className="text-brand-orange">({myStation.region_name || ''})</span>
            </h2>
            <p className="text-xs text-brand-grey-500 dark:text-brand-grey-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isEdu ? 'bg-brand-orange-50 text-brand-orange' : 'bg-brand-blue-50 text-brand-blue'}`}>
                {isEdu ? '👩🏫' : '🏥'} {isEdu ? t('label.category_education') : t('label.category_health')}
              </span>
              {scope === 'incoming' ? t('board.incoming_desc') : t('board.all_desc')} • {t('board.subtitle')}
            </p>
          </div>

          {/* Scope toggle */}
          <div className="flex rounded-xl bg-brand-grey-100 p-1">
            <button type="button" onClick={() => { setScope('incoming'); setDistrictId(undefined); setFacilityId(undefined); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${scope === 'incoming' ? 'bg-brand-blue text-white shadow' : 'text-brand-grey-500 hover:text-brand-grey-700'}`}>
              {t('board.scope_incoming')}
            </button>
            <button type="button" onClick={() => { setScope('all'); setDistrictId(undefined); setFacilityId(undefined); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${scope === 'all' ? 'bg-brand-orange text-white shadow' : 'text-brand-grey-500 hover:text-brand-grey-700'}`}>
              {t('board.scope_all')}
            </button>
          </div>
        </div>

        {/* ═══ FILTER CASCADING: Chanzo Mkoa → Wilaya/Halmashauri → Kituo ═══ */}
        <div className="px-4 md:px-5 pt-4">
          <label className="text-xs font-semibold text-brand-grey-500 dark:text-brand-grey-400">{t('board.filter_source')}</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
            <select className="input" value={regionSel}
              onChange={(e) => { setRegionSel(e.target.value); setDistrictId(undefined); setFacilityId(undefined); }}>
              {destRegionIds.length > 0 && (
                <option value="__dests__">{t('board.my_regions')} ({destRegionNames.join(', ')})</option>
              )}
              <option value="">{t('board.all_regions')}</option>
              {regions.map((r) => (
                <option key={r.id} value={String(r.id)}>{r.name}</option>
              ))}
            </select>

            <select className="input" value={districtId ?? ''}
              onChange={(e) => setDistrictId(e.target.value ? Number(e.target.value) : undefined)}
              disabled={singleRegion === undefined}
              title={t('board.filter_district_select')}>
              <option value="">{singleRegion !== undefined ? t('board.any_district') : t('board.choose_district')}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select className="input" value={facilityId ?? ''}
              onChange={(e) => setFacilityId(e.target.value || undefined)}
              disabled={districtId === undefined}
              title={t('board.filter_facility_select')}>
              <option value="">{districtId !== undefined ? t('board.any_facility') : t('board.choose_facility')}</option>
              {facilities.map((f: any) => (
                <option key={f.id || f.code} value={String(f.id || f.code)}>
                  {f.name}{f.type ? ` (${f.type})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
            <span className="text-xs text-brand-blue">
              📍 {activeFilterLabel || ''}
              {!activeFilterLabel && regionSel === '__dests__' && destRegionNames.length > 0
                ? `${t('board.my_regions')}: ${destRegionNames.join(', ')}` : ''}
            </span>
            {hasFilter && (
              <button type="button" onClick={clearFilters} className="text-xs text-brand-red hover:underline">
                {t('board.clear_filter')}
              </button>
            )}
          </div>
        </div>

        {/* Stats chips (kiwango cha sasa) */}
        <div className="px-4 md:px-5 pt-3 pb-4">
          {loading ? (
            <div className="text-xs text-brand-grey-400 py-2">{t('action.loading')}</div>
          ) : chips.list.length === 0 ? (
            <div className="text-xs text-brand-grey-400 py-2">{t('msg.no_data')}</div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {chips.list.map((c: any) => {
                const label = c.region_name || c.district_name || c.facility_name;
                const isActive = facilityId
                  ? c.facility_id === facilityId
                  : districtId
                    ? c.district_id === districtId
                    : effectiveRegionIds.includes(c.region_id);
                const color = facilityId ? 'border-brand-red text-brand-red bg-brand-red-50'
                  : districtId ? 'border-brand-orange text-brand-orange bg-brand-orange-50'
                  : 'border-brand-blue text-brand-blue bg-brand-blue-50';
                return (
                  <button key={label} type="button"
                    onClick={() => {
                      if (facilityId) {
                        setFacilityId(c.facility_id);
                      } else if (districtId) {
                        setDistrictId(c.district_id);
                      } else if (c.region_id) {
                        setRegionSel(String(c.region_id));
                        setDistrictId(undefined);
                        setFacilityId(undefined);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${isActive ? color + ' ring-2' : 'border-brand-grey-200 text-brand-grey-600 hover:border-brand-grey-400'}`}
                  >
                    {label} <span className="font-bold">({c.count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ FOLLOW REGIONS (notifications za mikoa mingine) ═══ */}
      <div className="card p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm text-brand-grey-900 dark:text-white">🔔 {t('board.follow')}</h3>
            <p className="text-xs text-brand-grey-500 dark:text-brand-grey-400 mt-0.5">{t('board.follow_hint')}</p>
          </div>
          {followSaved && <span className="text-xs font-semibold text-green-600">{t('board.follow_saved')}</span>}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3 max-h-32 overflow-y-auto">
          {regions.map((r) => {
            const on = followed.includes(r.id);
            return (
              <button key={r.id} type="button" onClick={() => toggleFollow(r.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${on ? 'bg-brand-blue text-white border-brand-blue' : 'border-brand-grey-200 text-brand-grey-600 hover:border-brand-blue'}`}>
                {on ? '✓ ' : '+ '}{r.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ GRID YA USERS ═══ */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-brand-grey-900 dark:text-white">
            {scope === 'incoming' ? t('board.scope_incoming') : t('board.scope_all')}
            {activeFilterLabel && <span className="text-brand-orange"> — {activeFilterLabel}</span>}
          </h3>
          <span className="text-xs text-brand-grey-500 dark:text-brand-grey-400">{board?.total ?? 0} {t('board.total_people')}</span>
        </div>

        {board && board.candidates.length === 0 && !loading && (
          <div className="card py-12 text-center text-brand-grey-500">
            <div className="text-5xl mb-3">🔎</div>
            <p className="text-sm">{t('board.no_candidates')}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {(board?.candidates || []).map((c: any) => (
            <BoardCard key={c.user_id} c={c} online={c.online} />
          ))}
        </div>
      </div>

      <div className="sr-only">{connected}</div>
    </div>
  );
}

function BoardCard({ c, online }: { c: any; online: boolean }) {
  const t = useT();
  const initial = c.full_name?.charAt(0)?.toUpperCase() || 'U';
  const from = c.current_station;
  const to = c.desired_destinations?.[0];
  const scorePct = c.score != null ? Math.round(c.score * 100) : null;

  async function onCall() {
    if (!c.phone_primary) return;
    try { await logCall(c.user_id, 'initiated'); } catch {}
    window.location.href = `tel:${c.phone_primary}`;
  }

  return (
    <div className="card p-4 flex flex-col gap-2.5 hover:shadow-md transition group">
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold text-lg">
            {initial}
          </div>
          {online && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white dark:border-brand-grey-100" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-brand-grey-900 dark:text-white truncate">{c.full_name}</span>
            {online && <span className="text-[10px] font-bold text-green-500">● {t('board.live')}</span>}
          </div>
          <div className="text-xs text-brand-grey-500 dark:text-brand-grey-400 truncate">
            {c.cadre_display || c.cadre_code}
            {scorePct != null && <span className="ml-1 badge-gold">{scorePct}% {t('board.score')}</span>}
          </div>
        </div>
      </div>

      {from && (
        <div className="text-xs bg-brand-grey-50 dark:bg-brand-grey-100 rounded-lg px-2.5 py-1.5">
          <div className="text-brand-grey-500"><b>{t('board.from')}:</b> {from.district_name || ''} {from.region_name}</div>
          {to && (
            <div className="text-brand-orange"><b>{t('board.wants_go')}:</b> {to.district_name || to.region_name} ({to.region_name})</div>
          )}
        </div>
      )}

      {c.phone_primary && (
        <a href={`tel:${c.phone_primary}`} className="text-sm text-brand-blue font-semibold hover:underline inline-flex items-center gap-1">
          📞 {c.phone_primary}
        </a>
      )}

      <div className="flex gap-2 mt-auto pt-1">
        <Link href={`/chats/${c.user_id}`} className="btn-primary text-xs px-3 py-1.5 flex-1 text-center">💬 {t('dash.chat')}</Link>
        <button onClick={onCall} disabled={!c.phone_primary} className="btn-accent text-xs px-3 py-1.5 flex-1 disabled:opacity-40">📞 {t('dash.call')}</button>
      </div>
    </div>
  );
}
