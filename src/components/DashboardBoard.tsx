'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  getBoard, getRegions, getDistricts, getFacilities, logCall, bustGetCache,
  type Region, type District, type Facility,
} from '@/lib/api';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { useI18n, useT } from '@/lib/i18n';
import { getInitial } from '@/lib/initials';
import { timeAgo } from '@/lib/timeAgo';
import { useFollowStore } from '@/lib/followStore';
import { playArrivalSound } from '@/lib/sound';

const FRESH_MS = 3 * 60 * 1000; // "Mpya" badge kwa waliotokea ndani ya dakika 3
const PAGE_SIZE = 10; // Wageni 10 wa kwanza kwenye grid — zilizobaki pagination

export default function DashboardBoard() {
  const t = useT();
  const lang = useI18n((s) => s.lang);
  const { user } = useAuth();
  const myStation = (user?.current_station || {}) as any;
  const dests = (user?.desired_destinations || []) as any[];
  const myCategory = user?.category;
  const isEdu = myCategory === 'education';

  // Mikoa anayotaka kwenda (k.m. Dar + Pwani) + mikoa aliyoifuata (k.m. Tanga)
  const destRegionIds = useMemo(
    () => Array.from(new Set(dests.map((d) => d.region_id).filter((x): x is number => typeof x === 'number'))),
    [dests]
  );
  const destRegionNames = useMemo(
    () => Array.from(new Set(dests.map((d) => d.region_name).filter(Boolean))),
    [dests]
  );
  const followedIds = useFollowStore((s) => s.region_ids);
  const loadFollow = useFollowStore((s) => s.load);
  const [regions, setRegions] = useState<Region[]>([]);

  // Mikoa YOTE anayojali = destinations + followed
  const watchedIds = useMemo(() => {
    const s = new Set<number>(destRegionIds);
    (followedIds || []).forEach((id) => s.add(id));
    return Array.from(s);
  }, [destRegionIds, followedIds]);

  const watchedNames = useMemo(() => {
    const s = new Set<string>(destRegionNames);
    (followedIds || []).forEach((id) => {
      const r = regions.find((x) => x.id === id);
      if (r) s.add(r.name);
    });
    return Array.from(s);
  }, [destRegionNames, followedIds, regions]);

  const [regionSel, setRegionSel] = useState<string>(destRegionIds.length > 0 ? '__all__' : '');
  const [districtId, setDistrictId] = useState<number | undefined>();
  const [facilityId, setFacilityId] = useState<string | undefined>();
  const [board, setBoard] = useState<any>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [page, setPage] = useState(1);
  const [lastArrivalKey, setLastArrivalKey] = useState<string | null>(null);
  // Sauti inaweza kuzimwa na mtumiaji (toggle juu kwenye LIVE panel) —
  // inahifadhiwa kwenye localStorage ili isiimike tena kila mtu akiingia.
  const [soundOn, setSoundOn] = useState(true);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('kv_sound');
      if (saved !== null) setSoundOn(saved !== 'off');
    } catch {}
  }, []);
  const toggleSound = () => {
    setSoundOn((prev) => {
      const next = !prev;
      try { window.localStorage.setItem('kv_sound', next ? 'on' : 'off'); } catch {}
      return next;
    });
  };
  const { messages, connected } = useLiveEvents(['match.found', 'user.registered']);

  // Re-render "muda uliopita" kila sekunde 30
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Mkoa mmoja halisi uliochaguliwa (kwa cascading wilaya/vituo)
  const singleRegion = useMemo(() => {
    if (regionSel === '__all__') return watchedIds.length === 1 ? watchedIds[0] : undefined;
    if (regionSel === '') return undefined;
    const n = Number(regionSel);
    return Number.isNaN(n) ? undefined : n;
  }, [regionSel, watchedIds]);

  const effectiveRegionIds = useMemo(() => {
    if (regionSel === '__all__') return watchedIds;
    if (singleRegion !== undefined) return [singleRegion];
    return [];
  }, [regionSel, watchedIds, singleRegion]);

  const loadBoard = useCallback(async (forceFresh = false) => {
    setLoading(true);
    try {
      const params: any = { scope: 'incoming' };
      if (effectiveRegionIds.length) params.region_ids = effectiveRegionIds.join(',');
      if (districtId !== undefined) params.district_id = districtId;
      if (facilityId !== undefined) params.facility_id = facilityId;
      const b = await getBoard(params, forceFresh);
      setBoard(b);
    } finally {
      setLoading(false);
    }
  }, [effectiveRegionIds, districtId, facilityId]);

  // Load regions kwa dropdown ya chanzo + followed regions (store ya pamoja na nav)
  useEffect(() => {
    getRegions().then(setRegions).catch(() => {});
    loadFollow();
  }, [loadFollow]);

  // Sync: mtu asiye na destinations lakini akafuata mikoa → '__all__' bado ifanye kazi
  useEffect(() => {
    if (regionSel === '' && watchedIds.length > 0) setRegionSel('__all__');
  }, [regionSel, watchedIds]);

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

  // Auto-refresh on live events — FRESH data (bust cache) + sauti + kurudi page 1
  useEffect(() => {
    if (!messages.length) return;
    const latest = messages[messages.length - 1];
    if (latest.topic === 'match.found' || latest.topic === 'user.registered') {
      const key = `${latest.topic}:${latest.payload?.user_id || latest.payload?.candidate?.user_id || latest.at}`;
      if (key !== lastArrivalKey) {
        setLastArrivalKey(key);
        if (soundOn) playArrivalSound(); // 📣 mtu mpya amefika — ipige sauti!
      }
      bustGetCache(); // FUSHA cache ya kale — board lazima ionyeshe data mpya SASA
      setPage(1);
      const tId = setTimeout(() => loadBoard(true), 400);
      return () => clearTimeout(tId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, soundOn]);

  const clearFilters = () => {
    setRegionSel(watchedIds.length > 0 ? '__all__' : '');
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
        : regionSel === '__all__' && watchedNames.length
          ? watchedNames.join(', ')
          : null;

  const hasFilter = regionSel !== '__all__' || districtId !== undefined || facilityId !== undefined;

  // Masomo yangu (kwa highlight ya masomo yanayolingana kwenye cards)
  const mySubjects = useMemo(() => (user?.subjects || []) as string[], [user?.subjects]);

  // Candidates: MPYA JUU (sorted newest first) — live event ikija inaonekana juu!
  const candidates = useMemo(() => {
    const list = [...((board?.candidates as any[]) || [])];
    list.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });
    return list;
  }, [board]);

  // Pagination: data 10 za mwanzo (wageni) — zilizobaki kupitia pagination
  const totalPages = Math.max(1, Math.ceil(candidates.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => candidates.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [candidates, safePage]
  );

  // Walio online kwenye grid yako — wana rangi ya kijani (tofauti na notification)
  const onlineCount = candidates.filter((c) => c.online).length;

  const hasData = (board?.total ?? 0) > 0;

  return (
    <div className="space-y-4">
      {/* ═══ LIVE PANEL: Wageni + Online (rangi tofauti) ═══ */}
      <div className="card overflow-hidden">
        <div className="p-4 md:p-5 border-b border-brand-grey-100 dark:border-brand-grey-200">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="font-bold text-lg text-brand-grey-900 dark:text-white flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-brand-grey-300'} inline-block animate-pulse`} />
              {t('board.live_title')} <span className="text-brand-orange">{myStation.region_name || ''}</span>
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {onlineCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {onlineCount} {t('board.online_now')}
                </span>
              )}
              {!loading && (
                <span className="text-xs font-semibold text-brand-grey-500 dark:text-brand-grey-400">
                  {board?.total ?? 0} {t('board.total_people')}
                </span>
              )}
              <button type="button" onClick={toggleSound}
                title={soundOn ? t('board.sound_on') : t('board.sound_off')}
                className={`text-xs px-2 py-1 rounded-full border transition ${soundOn ? 'border-brand-orange text-brand-orange hover:bg-brand-orange-50' : 'border-brand-grey-300 text-brand-grey-500 hover:bg-brand-grey-50'}`}
                aria-label={soundOn ? t('board.sound_on') : t('board.sound_off')}>
                {soundOn ? '🔊' : '🔇'}
              </button>
            </div>
          </div>
          <p className="text-xs text-brand-grey-500 dark:text-brand-grey-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isEdu ? 'bg-brand-orange-50 text-brand-orange' : 'bg-brand-blue-50 text-brand-blue'}`}>
              {isEdu ? '👩🏫' : '🏥'} {isEdu ? t('label.category_education') : t('label.category_health')}
            </span>
            {t('board.subtitle')}
          </p>
        </div>

        {/* ═══ FILTER CASCADING: Chanzo Mkoa → Wilaya/Halmashauri → Kituo ═══ */}
        <div className="px-4 md:px-5 pt-4">
          <label className="text-xs font-semibold text-brand-grey-500 dark:text-brand-grey-400">{t('board.filter_source')}</label>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mt-1.5">
            <select className="input w-full sm:flex-1 sm:min-w-[160px]" value={regionSel}
              onChange={(e) => { setRegionSel(e.target.value); setDistrictId(undefined); setFacilityId(undefined); setPage(1); }}>
              {watchedIds.length > 0 && (
                <option value="__all__">
                  {watchedNames.length ? `${t('board.all_regions')} (${watchedNames.join(', ')})` : t('board.all_regions')}
                </option>
              )}
              {watchedIds.map((rid) => {
                const r = regions.find((x) => x.id === rid);
                return r ? <option key={r.id} value={String(r.id)}>{r.name}</option> : null;
              })}
              {watchedIds.length === 0 && regions.map((r) => (
                <option key={r.id} value={String(r.id)}>{r.name}</option>
              ))}
            </select>

            <select className="input w-full sm:flex-1 sm:min-w-[160px]" value={districtId ?? ''}
              onChange={(e) => { setDistrictId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
              disabled={singleRegion === undefined}
              title={t('board.filter_district_select')}>
              <option value="">{singleRegion !== undefined ? t('board.any_district') : t('board.choose_district')}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select className="input w-full sm:flex-1 sm:min-w-[160px]" value={facilityId ?? ''}
              onChange={(e) => { setFacilityId(e.target.value || undefined); setPage(1); }}
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
              📍 {activeFilterLabel || t('board.all_regions')}
            </span>
            {hasFilter && (
              <button type="button" onClick={clearFilters} className="text-xs text-brand-red hover:underline">
                {t('board.clear_filter')}
              </button>
            )}
          </div>
        </div>

        {/* Stats chips (kiwango cha sasa) — HAKUNA "no data" kama data zipo! */}
        <div className="px-4 md:px-5 pt-3 pb-4">
          {loading ? (
            <div className="text-xs text-brand-grey-400 py-2">{t('action.loading')}</div>
          ) : chips.list.length === 0 ? (
            <div className="text-xs text-brand-grey-400 py-2">
              {hasData ? t('board.stats_hint') : t('msg.no_data')}
            </div>
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
                      setPage(1);
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

      {/* ═══ GRID YA WANAOKUJA MKOA WAKO — 10 kwa ukurasa + pagination ═══ */}
      {loading && candidates.length === 0 ? (
        <div className="text-sm text-brand-grey-400 py-6 text-center">{t('action.loading')}</div>
      ) : pageItems.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-2">{isEdu ? '👩🏫' : '🏥'}</div>
          <p className="text-brand-grey-500">{t('board.no_candidates')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {pageItems.map((c: any) => (
              <BoardCard key={c.user_id} c={c} now={now} lang={lang} mySubjects={mySubjects} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <button type="button" disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                className="min-w-[44px] min-h-[44px] px-3 rounded-xl border border-brand-grey-200 text-sm font-semibold text-brand-grey-700 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition active:scale-95">
                ← {t('board.prev')}
              </button>
              <span className="text-sm font-bold text-brand-grey-500 px-2">
                {safePage} / {totalPages}
              </span>
              <button type="button" disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                className="min-w-[44px] min-h-[44px] px-3 rounded-xl border border-brand-grey-200 text-sm font-semibold text-brand-grey-700 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition active:scale-95">
                {t('board.next')} →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BoardCard({ c, now, lang, mySubjects }: { c: any; now: number; lang: 'sw' | 'en'; mySubjects: string[] }) {
  const t = useT();
  const initial = getInitial(c.full_name);
  const from = c.current_station;
  const to = c.desired_destinations?.[0];
  const scorePct = c.score != null ? Math.round(c.score * 100) : null;
  const createdTs = c.created_at ? new Date(c.created_at).getTime() : now;
  const ago = timeAgo(isNaN(createdTs) ? now : createdTs, lang);
  const fresh = now - createdTs < FRESH_MS;
  const isEdu = c.category === 'education';

  async function onCall() {
    if (!c.phone_primary) return;
    try { await logCall(c.user_id, 'initiated'); } catch {}
    window.location.href = `tel:${c.phone_primary}`;
  }

  return (
    <div className={`card p-4 flex flex-col gap-2.5 hover:shadow-md transition group ${
      fresh ? 'border-brand-orange ring-2 ring-brand-orange/30 animate-[requestPing_1.5s_ease-in-out]'
      : c.online ? 'border-green-300 bg-green-50/60 dark:bg-green-900/10 dark:border-green-700/50'
      : ''}`}>
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold text-lg">
            {initial}
          </div>
          {c.online && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white dark:border-brand-grey-100" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-brand-grey-900 dark:text-white truncate">{c.full_name}</span>
            {fresh && (
              <span className="text-[10px] font-bold text-brand-orange bg-brand-orange-50 px-1.5 py-0.5 rounded-full">🆕 {t('board.new_badge')}</span>
            )}
            {c.online && <span className="text-[10px] font-bold text-green-500">● {t('board.live')}</span>}
          </div>
          {/* Idara husika: Afya / Elimu + kada */}
          <div className="flex items-center gap-1 flex-wrap mt-0.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isEdu ? 'bg-brand-orange-50 text-brand-orange' : 'bg-brand-blue-50 text-brand-blue'}`}>
              {isEdu ? '👩🏫' : '🏥'} {isEdu ? t('label.category_education') : t('label.category_health')}
            </span>
            <span className="text-xs text-brand-grey-500 dark:text-brand-grey-400 truncate">
              {c.cadre_display || c.cadre_code}
            </span>
            {scorePct != null && <span className="ml-auto badge-gold">{scorePct}% {t('board.score')}</span>}
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

      {c.subjects?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-[11px]">
          <span className="text-brand-grey-500 font-semibold">{t('board.subjects')}:</span>
          {c.subjects.map((s: string) => {
            const matched = mySubjects.includes(s);
            return (
              <span key={s} title={matched ? t('board.subject_match') : undefined}
                className={`px-1.5 py-0.5 rounded-full font-semibold ${matched ? 'bg-brand-gold text-white' : 'bg-brand-grey-100 text-brand-grey-600 dark:bg-brand-grey-200 dark:text-brand-grey-300'}`}>
                {s}{matched ? ' ✓' : ''}
              </span>
            );
          })}
        </div>
      )}

      {c.phone_primary && (
        <a href={`tel:${c.phone_primary}`} className="text-sm text-brand-blue font-semibold hover:underline inline-flex items-center gap-1">
          📞 {c.phone_primary}
        </a>
      )}

      <div className="text-[11px] font-medium text-brand-grey-400">🕐 {ago}</div>

      <div className="flex gap-2 mt-auto pt-1">
        <Link href={`/chats/${c.user_id}`} className="btn-primary text-xs px-3 py-1.5 flex-1 text-center">💬 {t('dash.chat')}</Link>
        <button onClick={onCall} disabled={!c.phone_primary} className="btn-accent text-xs px-3 py-1.5 flex-1 disabled:opacity-40">📞 {t('dash.call')}</button>
      </div>
    </div>
  );
}
