'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  getBoard, getRegions, getDistricts, getFacilities, logCall, bustGetCache,
  type Region, type District, type Facility,
} from '@/lib/api';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { useLive } from '@/lib/liveSocket';
import { useDataVersion } from '@/lib/useDataVersion';
import { useI18n, useT } from '@/lib/i18n';
import { boardEmptyMessage } from '@/lib/i18n_board';
import { getInitial } from '@/lib/initials';
import { timeAgo } from '@/lib/timeAgo';
import { parseServerDate } from '@/lib/dates';
import { playArrivalSound } from '@/lib/sound';
import Spinner from '@/components/Spinner';
import { getMe } from '@/lib/api';
import {
  Users, MapPin, Target, Phone, MessageSquare, Clock, Search,
  Zap, Filter, HandCoins,
} from 'lucide-react';

const FRESH_MS = 30 * 60 * 1000; // "Mpya" badge kwa waliotokea ndani ya NUSU SAA (30min)
const PAGE_SIZE = 5; // Wageni 5 wa kwanza pale juu — zilizobaki pagination (Next)

export default function DashboardBoard() {
  const t = useT();
  const lang = useI18n((s) => s.lang);
  const { user } = useAuth();
  const myStation = (user?.current_station || {}) as any;
  const dests = (user?.desired_destinations || []) as any[];
  const myCategory = user?.category;
  // Idara zote isipokuwa 'health' zinachukuliwa kama zinaweza kuwa na masomo
  // (elimu + idara nyingine zozote mpya).
  const isEdu = myCategory !== 'health';

  // Mikoa anayotaka kwenda (k.m. Dar + Pwani) + mikoa aliyoifuata (k.m. Tanga)
  const destRegionIds = useMemo(
    () => Array.from(new Set(dests.map((d) => d.region_id).filter((x): x is number => typeof x === 'number'))),
    [dests]
  );
  const destRegionNames = useMemo(
    () => Array.from(new Set(dests.map((d) => d.region_name).filter(Boolean))),
    [dests]
  );
  const [regions, setRegions] = useState<Region[]>([]);

  // Mikoa anayojali = DESTINATIONS tu (mikoa anayotaka kwenda) — hii ndiyo
  // inayoamua ni watu gani wanaokuja mkoa wake (wanaotoka hiyo mikoa).
  // Mtu anaweza kubadilisha drop-down na kuona mikoa YOTE ya Tanzania.
  const watchedIds = useMemo(() => destRegionIds, [destRegionIds]);

  const watchedNames = useMemo(() => destRegionNames, [destRegionNames]);

  // Default: mkoa wa KWANZA anayotaka kwenda (destination) — mtu akiingia
  // anaona watu wanaokuja mkoa wake kutoka mkoa huo papo hapo. Akiwa na
  // destinations nyingi → '__all__' (zote). Anaweza kubadilisha drop-down.
  const [regionSel, setRegionSel] = useState<string>(
    destRegionIds.length > 1 ? '__all__' : destRegionIds.length === 1 ? String(destRegionIds[0]) : ''
  );
  const [districtId, setDistrictId] = useState<number | undefined>();
  const [facilityId, setFacilityId] = useState<string | undefined>();
  // Kichujio cha masomo: off (wote) / any (somo moja linalofanana) / all (yote
  // mawili yanafanana) / none (wasio na somo linalofanana) + search ya masomo.
  const [subjectFilter, setSubjectFilter] = useState<'off' | 'any' | 'all' | 'none'>('off');
  const [subjectQ, setSubjectQ] = useState('');
  const [board, setBoard] = useState<any>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [page, setPage] = useState(1);
  const [lastArrivalKey, setLastArrivalKey] = useState<string | null>(null);

  // REFRESH user data on mount — is_verified + contact_enabled lazima ziwe FRESH
  // ili canContact isome data halisi, sio stale ya auth store.
  useEffect(() => {
    getMe(true).then((me: any) => useAuth.getState().setUser(me)).catch(() => {});
  }, []);
  const { messages, connected } = useLiveEvents(['match.found', 'user.registered', 'user.profile_updated', 'user.changed', 'user.removed']);
  // ONLINE status LIVE: presence events (WS) zinabroadcast kwa wote — board
  // inatumia hii (sio `c.online` stale ya fetch) ili mtu akitoka/kuingia
  // aonekane PAPO HAPO bila refresh ya page.
  const liveOnline = useLive((s) => s.onlineUserIds);

  // GLOBAL TOAST — moja tu kwa wakati, inareplace kila click
  const [cardToast, setCardToast] = useState<{ msg: string; uid: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showCardToast(msg: string, uid: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setCardToast(null); // futa kwanza ili "inatokea upya" kila click
    setTimeout(() => {
      setCardToast({ msg, uid });
      toastTimer.current = setTimeout(() => setCardToast(null), 3000);
    }, 50); // ndogo ili React iscreenshot state mpya
  }

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
      if (subjectFilter !== 'off') params.subject_filter = subjectFilter;
      if (subjectQ.trim()) params.subject_q = subjectQ.trim();
      bustGetCache(); // FUSHA frontend cache — data lazima iwe FRESH kila filter inapobadilika
      const b = await getBoard(params, forceFresh);
      setBoard(b);
    } finally {
      setLoading(false);
    }
  }, [effectiveRegionIds, districtId, facilityId, subjectFilter, subjectQ]);



  // Load regions kwa dropdown ya chanzo
  // REAL-TIME: admin akibadilisha mikoa (Data Management) → dropdown hii
  // inajirefresh PAPO HAPO bila refresh ya page (event-driven).
  const dv = useDataVersion();
  useEffect(() => {
    getRegions().then(setRegions).catch(() => {});
  }, [dv]);

  // Sync: mtu asiye na destinations → mkoa wa kwanza wa dropdown (au '__all__')
  useEffect(() => {
    if (regionSel === '') {
      setRegionSel(destRegionIds.length > 1 ? '__all__' : destRegionIds.length === 1 ? String(destRegionIds[0]) : regions.length ? String(regions[0].id) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionSel, destRegionIds, regions]);

  // Cascading: wilaya za mkoa mmoja uliochagua — district cache iko
  // localStorage (siku 24), kwa hivyo kurudi kwenye mkoa ule ule ni INSTANT.
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

  // Cascading: vituo vya wilaya iliyochaguliwa — facility cache iko
  // localStorage (siku 24), instatn pale unapoamua wilaya.
  useEffect(() => {
    if (districtId !== undefined) {
      getFacilities(districtId, (myCategory as any) || 'health').then(setFacilities).catch(() => setFacilities([]));
    } else {
      setFacilities([]);
    }
    setFacilityId(undefined);
  }, [districtId, myCategory]);

  useEffect(() => { loadBoard(true); }, [loadBoard]);  // ALWAYS force fresh — filter/cache hazipaswi kuzuia data mpya

  // Auto-refresh on live events — FRESH data (bust cache) + sauti + kurudi page 1
  useEffect(() => {
    if (!messages.length) return;
    const latest = messages[messages.length - 1];
    if (latest.topic === 'match.found' || latest.topic === 'user.registered') {
      const key = `${latest.topic}:${latest.payload?.user_id || latest.payload?.candidate?.user_id || latest.at}`;
      if (key !== lastArrivalKey) {
        setLastArrivalKey(key);
        playArrivalSound(); // 📣 mtu mpya amefika — ipige sauti!
      }
      bustGetCache(); // FUSHA cache ya kale — board lazima ionyeshe data mpya SASA
      setPage(1);
      const tId = setTimeout(() => loadBoard(true), 400);
      return () => clearTimeout(tId);
    }
    // Profile ikibadilika (mkoa/masomo/kada ya mtumiaji) → board ijirefresh yenyewe
    // Admin akibadilisha/kusitisha/kufuta mtumiaji → boards zote zijirefresh PAPO
    // HAPO bila refresh ya page (event-driven kama WebSocket).
    if (latest.topic === 'user.profile_updated' || latest.topic === 'user.changed' || latest.topic === 'user.removed') {
      bustGetCache();
      setPage(1);
      // Debounce: bulk events (watu wengi wakifutwa/suspendwa wakati mmoja)
      // zisipige reload 10x — moja tu ya mwisho inatosha.
      const tId = setTimeout(() => loadBoard(true), 300);
      return () => clearTimeout(tId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, loadBoard]);

  const clearFilters = () => {
    setRegionSel(destRegionIds.length > 1 ? '__all__' : destRegionIds.length === 1 ? String(destRegionIds[0]) : '');
    setDistrictId(undefined);
    setFacilityId(undefined);
    setSubjectFilter('off');
    setSubjectQ('');
  };

  const currentRegionName = useMemo(() => {
    if (singleRegion !== undefined) {
      const r = regions.find((x) => x.id === singleRegion);
      if (r) return r.name;
    }
    return null;
  }, [singleRegion, regions]);

  // Jina la mkoa uliochaguliwa (chanzo) — kwa maelezo ya header kisomi.
  const activeSourceRegionName = useMemo(() => {
    if (regionSel === '__all__') return watchedNames.length ? watchedNames.join(', ') : null;
    if (singleRegion !== undefined) {
      const r = regions.find((x) => x.id === singleRegion);
      if (r) return r.name;
    }
    return null;
  }, [regionSel, singleRegion, regions, watchedNames]);

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

  // Candidates: WAPYA (ndani ya dakika 30) juu kabisa, kisha wengine chini —
  // ndani ya kila kundi sorted newest first. Mtu akipita dakika 30 (au baada ya
  // kuonekana mara ya kwanza) anashuka chini — wapya wasiojulikana wabaki juu.
  // `online` ina-overriden na presence LIVE (WS) — siyo `c.online` stale ya fetch.
  const candidates = useMemo(() => {
    const list = [...((board?.candidates as any[]) || [])];
    list.forEach((c) => { c.online = liveOnline.has(c.user_id) || !!c.online; });
    list.sort((a, b) => {
      const ta = a.created_at ? (parseServerDate(a.created_at)?.getTime() ?? 0) : 0;
      const tb = b.created_at ? (parseServerDate(b.created_at)?.getTime() ?? 0) : 0;
      const aFresh = ta && now - ta < FRESH_MS;
      const bFresh = tb && now - tb < FRESH_MS;
      if (aFresh !== bFresh) return aFresh ? -1 : 1; // wapya juu, wengine chini
      return tb - ta;
    });
    return list;
  }, [board, now, liveOnline]);

  // Pagination: data 10 za mwanzo (wageni) — zilizobaki kupitia pagination
  const totalPages = Math.max(1, Math.ceil(candidates.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => candidates.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [candidates, safePage]
  );

  // Walio online kwenye grid yako — wana rangi ya kijani (tofauti na notification)
  const onlineCount = candidates.filter((c) => c.online).length;

  // Hesabu ya WAPYA (ndani ya nusu saa) — inaoneshwa juu kwenye LIVE panel
  const freshCount = useMemo(() => {
    return candidates.filter((c) => {
      const ts = c.created_at ? (parseServerDate(c.created_at)?.getTime() ?? 0) : 0;
      return ts && now - ts < FRESH_MS;
    }).length;
  }, [candidates, now]);


  return (
    <div className="space-y-4">
      {/* ═══ LIVE — Wazi: Watu Wanakotoka [X] Wanaokuja [Y] ═══ */}
      <div className="rounded-xl bg-white dark:bg-brand-grey-900 border border-brand-grey-200 dark:border-brand-grey-600 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-bold text-[13px] text-brand-grey-900 dark:text-white flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-brand-grey-300'} inline-block animate-pulse flex-shrink-0`} />
            <span className="text-brand-grey-800 dark:text-white">
              {myCategory === 'health' ? 'Wafanyakazi wa Idara ya Afya' : `Walimu wa Idara ya Elimu (${user?.cadre_code?.includes('PRIMARY') ? 'Msingi' : 'Sekondari'})`}
            </span>
            <span className="text-brand-grey-600 dark:text-brand-grey-300">kutoka</span>
            <span className="text-brand-grey-900 dark:text-white font-extrabold break-words">{activeSourceRegionName || t('board.all_regions')}</span>
            <span className="text-brand-grey-600 dark:text-brand-grey-300">wanaotaka kuhamia</span>
            <span className="text-brand-grey-900 dark:text-white font-extrabold break-words">Mkoa wako {myStation.region_name || ''}</span>
            <span className="text-brand-grey-600 dark:text-brand-grey-300">wako hapa</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-brand-blue bg-brand-blue-50 dark:bg-brand-blue-950 px-2 py-0.5 rounded-full">
              <Users size={11} /> {board?.total ?? 0}
            </span>
          </h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!loading && (<></>)}
            {onlineCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {onlineCount} {t('board.online_now')}
              </span>
            )}
            {freshCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue bg-brand-blue-50 dark:bg-brand-blue-950 px-2 py-0.5 rounded-full animate-[newPulse_1s_ease-in-out_infinite]">
                 {freshCount} {t('board.new_arrivals')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ FILTER CASCADING: Chanzo Mkoa → Wilaya/Halmashauri → Kituo ═══ */}
      <div className="bg-white dark:bg-brand-grey-900 rounded-lg border border-brand-grey-200 dark:border-brand-grey-600 px-3 pt-2.5 pb-3">
          <label className="text-[11px] font-bold text-brand-grey-700 dark:text-brand-grey-300">{t('board.filter_source')}</label>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1.5 mt-1">
            <select className="input text-xs py-1.5 w-full sm:flex-1 sm:min-w-[140px]" value={regionSel}
              onChange={(e) => { setRegionSel(e.target.value); setDistrictId(undefined); setFacilityId(undefined); setPage(1); }}>
              {/* Default: mkoa wanaotaka kuja kwako (destinations) — lakini mikoa
                  YOTE ya Tanzania iko kwenye dropdown, mtu aweze kubadilisha. */}
              {watchedIds.length > 1 && (
                <option value="__all__">
                  {watchedNames.length ? `${t('board.all_regions')} (${watchedNames.join(', ')})` : t('board.all_regions')}
                </option>
              )}
              {regions.map((r) => (
                <option key={r.id} value={String(r.id)}>{r.name}</option>
              ))}
            </select>

            <select className="input text-xs py-1.5 w-full sm:flex-1 sm:min-w-[140px]" value={districtId ?? ''}
              onChange={(e) => { setDistrictId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
              disabled={singleRegion === undefined}
              title={t('board.filter_district_select')}>
              <option value="">{singleRegion !== undefined ? t('board.any_district') : t('board.choose_district')}</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select className="input text-xs py-1.5 w-full sm:flex-1 sm:min-w-[140px]" value={facilityId ?? ''}
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
          <div className="flex items-center justify-between mt-1.5 flex-wrap gap-1.5">
            <span className="text-[11px] font-medium text-brand-grey-600 dark:text-brand-grey-300">
              <span className="text-brand-grey-600 dark:text-brand-grey-300 font-medium">
                <MapPin size={12} className="inline" /> {activeFilterLabel || t('board.all_regions')}
              </span>
            </span>
            {hasFilter && (
              <button type="button" onClick={clearFilters} className="text-[11px] text-brand-red hover:underline">
                {t('board.clear_filter')}
              </button>
            )}
          </div>

          {/* Kichujio cha masomo — onyeshwa kwa wasomi wote */}
          {isEdu && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] font-semibold text-brand-grey-600 dark:text-brand-grey-300 mr-1">{t('board.subjects')}:</span>
                {([['off', t('board.subj_off')], ['all', t('board.subj_all')], ['any', t('board.subj_any')], ['none', t('board.subj_none')]] as const).map(([val, label]) => (
                  <button
                    key={val} type="button"
                    onClick={() => { setSubjectFilter(val); setPage(1); }}
                    aria-pressed={subjectFilter === val}
                    className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold transition ${
                      subjectFilter === val
                        ? 'border-brand-blue bg-brand-blue text-white'
                        : 'border-brand-grey-300 text-brand-grey-600 hover:border-brand-blue dark:border-brand-grey-600 dark:text-brand-grey-300'
                    }`}
                  >{label}</button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 max-w-sm">
                <span className="text-brand-grey-400 text-xs"><Search size={12} /></span>
                <input
                  className="input text-xs py-1"
                  placeholder={t('board.subj_search_ph')}
                  value={subjectQ}
                  onChange={(e) => { setSubjectQ(e.target.value); setPage(1); }}
                />
              </div>
            </div>
          )}
      </div>



      {/* ═══ GRID YA WANAOKUJA MKOA WAKO — 10 kwa ukurasa + pagination ═══ */}
      {loading && candidates.length === 0 ? (
        <div className="py-8"><Spinner label={t('action.loading')} /></div>
      ) : pageItems.length === 0 ? (
        <div className="card text-center py-10">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-brand-grey-100 dark:bg-brand-grey-800 border border-brand-grey-200 dark:border-brand-grey-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-brand-grey-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="font-semibold text-brand-grey-700 dark:text-brand-grey-300">{boardEmptyMessage(myStation.region_name, lang).title}</p>
          <p className="text-xs text-brand-grey-400 mt-1">{boardEmptyMessage(myStation.region_name, lang).hint}</p>
        </div>
      ) : (
        <>
          {/* Grid ELASTIC: inajiweka yenyewe kwa kila kifaa — simu ndogo sana = 1-2 col,
              simu ya kawaida = 2 col, desktop = 3 col. Hakuna kujibana tena! */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(165px,1fr))] gap-2.5 md:gap-3">
            {pageItems.map((c: any) => (
              <BoardCard key={c.user_id} c={c} now={now} lang={lang} mySubjects={mySubjects} me={user as any} myRegionName={myStation.region_name || ''} isVerified={!!(user as any)?.is_verified} showCardToast={showCardToast} myToast={cardToast?.uid === c.user_id ? cardToast : null} />
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

function BoardCard({ c, now, lang, mySubjects, me, myRegionName, isVerified, showCardToast, myToast }: { c: any; now: number; lang: 'sw' | 'en'; mySubjects: string[]; me?: any; myRegionName?: string; isVerified?: boolean; showCardToast: (msg: string, uid: string) => void; myToast: { msg: string } | null }) {
  const t = useT();
  const initial = getInitial(c.full_name);
  const from = c.current_station;
  const to = c.desired_destinations?.[0];
  const createdTs = c.created_at ? (parseServerDate(c.created_at)?.getTime() ?? now) : now;
  const ago = timeAgo(createdTs, lang);
  const fresh = now - createdTs < FRESH_MS;
  const isEdu = c.category !== 'health';
  const anySubjectMatch = (c.subjects || []).some((s: string) => mySubjects.includes(s));

  // CONTACT PERMISSION: canContact = True pale ambapo:
  //   - require_payment_for_contact = False (admin amezima kwa wote), AU
  //   - is_verified = True (mtumiaji amelipa), AU
  //   - contact_enabled = True (admin amemruhusu mtu huyu binafsi)
  const requirePayment = !!(me as any)?.require_payment_for_contact;
  const contactEnabled = !!(me as any)?.contact_enabled;
  const canContact = !requirePayment || !!isVerified || contactEnabled;

  async function onCall() {
    if (!c.phone_primary) return;
    if (!canContact) {
      showCardToast('Changia TZS 3,000 upate namba', c.user_id);
      return;
    }
    showCardToast(`Piga ${c.full_name}`, c.user_id);
    try { await logCall(c.user_id, 'initiated'); } catch {}
    window.location.href = `tel:${c.phone_primary}`;
  }

  function onSMS() {
    if (!c.phone_primary) return;
    if (!canContact) {
      showCardToast('Changia TZS 3,000 upate namba', c.user_id);
      return;
    }
    showCardToast(`SMS kwa ${c.full_name}`, c.user_id);
    window.location.href = `sms:${c.phone_primary}?body=${encodeURIComponent(introMsg)}`;
  }

  function onWhatsApp() {
    if (!c.phone_alt) return;
    if (!canContact) {
      showCardToast('Changia TZS 3,000 upate namba', c.user_id);
      return;
    }
    showCardToast(`WhatsApp kwa ${c.full_name}`, c.user_id);
    const digits = c.phone_alt.replace(/\D/g, '').replace(/^0/, '255');
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(introMsg)}`, '_blank');
  }

  // Ujumbe wa SMS/WhatsApp ulioandaliwa — taarifa za kutambulishana.
  const introMsg = useMemo(() => {
    const myName = me?.full_name || '';
    const myCadre = me?.cadre_display || me?.cadre_code || '';
    const myRegion = me?.current_station?.region_name || '';
    const theirSubjects = (c.subjects || []).join(', ');
    const role = c.category === 'education' ? t('label.category_education') : t('label.category_health');
    return `Habari ${c.full_name}, wewe ni ${role}${theirSubjects ? ` wa masomo ${theirSubjects}` : ''}. Mimi ni ${myName}${myCadre ? `, ${myCadre}` : ''}${myRegion ? `, niko ${myRegion}` : ''}. Naomba kujadili kubadilishana vituo.`;
  }, [c, me, t]);

  return (
    <div className={`rounded-xl bg-white dark:bg-brand-grey-900 border border-brand-grey-200 dark:border-brand-grey-600 p-3 md:p-3.5 flex flex-col gap-2 hover:border-brand-blue dark:hover:border-brand-grey-500 transition group ${
      fresh ? 'border-brand-blue ring-1 ring-brand-blue/20'
      : c.online ? 'border-green-300 dark:border-green-700/50'
      : ''}`}>
      <div className="flex items-center gap-2.5">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-brand-grey-100 dark:bg-brand-grey-800 border border-brand-grey-300 dark:border-brand-grey-600 flex items-center justify-center text-sm md:text-base font-bold text-brand-grey-900 dark:text-white">
            {initial}
          </div>
          {c.online && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-white dark:border-brand-grey-900" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-brand-grey-900 dark:text-white break-words min-w-0 leading-snug text-[13px]">{c.full_name}</span>
            {fresh && (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-white bg-brand-blue px-2 py-0.5 rounded-full shadow-sm animate-[newPulse_1s_ease-in-out_infinite] ring-1 ring-brand-blue/30">
                 {t('board.new_badge')}
              </span>
            )}
            {c.online && <span className="text-[10px] font-bold text-green-600">● {t('board.live')}</span>}
          </div>
          {/* NI NANI: idara (Afya/Elimu) + kada — majina yote yanaonekana (hakuna kukata) */}
          <div className="flex items-center gap-1 flex-wrap mt-0.5">
            <span className="text-[10px] font-semibold text-brand-blue-600 dark:text-brand-blue-400">
              {isEdu ? t('label.category_education') : t('label.category_health')}
            </span>
            <span className="text-[11px] font-medium text-brand-grey-600 dark:text-brand-grey-300 break-words min-w-0 leading-snug">
              {c.cadre_display || c.cadre_code}
            </span>
          </div>
        </div>
      </div>

      {from && (
        <div className="text-[11px] bg-brand-grey-50 dark:bg-brand-grey-800 rounded-lg px-2 py-1.5 space-y-1">            <div className="text-brand-grey-600 dark:text-brand-grey-300 break-words font-medium">
              <MapPin size={11} className="inline" /> {t('board.from')}: <b className="text-brand-grey-800 dark:text-brand-grey-200">{from.district_name || ''} {from.region_name}</b>
            </div>
            {to && (
              <div className="text-brand-grey-600 dark:text-brand-grey-300 break-words font-medium">
                <Target size={11} className="inline" /> {t('board.wants_go')}: <b className="text-brand-grey-800 dark:text-brand-grey-200">{to.district_name || to.region_name}, {to.region_name}</b>
              </div>
            )}
          <div className="text-brand-blue font-extrabold">↓ {t('board.coming_to_you')} <span className="text-brand-grey-900 dark:text-white">{myRegionName}</span></div>
        </div>
      )}

      {c.subjects?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-[11px]">
          <span className="text-brand-grey-500 font-semibold">{t('board.subjects')}:</span>
          {anySubjectMatch && (
            <span className="px-1.5 py-0.5 rounded-full bg-brand-blue text-white font-bold"><Target size={10} className="inline" /> {t('board.subjects_match')}</span>
          )}
          {c.subjects.map((s: string) => {
            const matched = mySubjects.includes(s);
            return (
              <span key={s} title={matched ? t('board.subject_match') : undefined}
                className={`px-1.5 py-0.5 rounded-full font-semibold ${matched ? 'bg-brand-blue text-white' : 'bg-brand-grey-100 text-brand-grey-600 dark:bg-brand-grey-200 dark:text-brand-grey-300'}`}>
                {s}{matched ? ' ✓' : ''}
              </span>
            );
          })}
        </div>
      )}



      {/* MUDA WA JUU (relative): wapya wana " MPYA + muda", wengine  muda tu — siyo saa halisi */}
      <div className={`text-[11px] font-medium ${fresh ? 'text-brand-blue font-bold' : 'text-brand-grey-400'}`} title={`${new Date(createdTs).toLocaleString('sw-TZ')}`}>
        {fresh ? (
          <span className="inline-flex items-center gap-1 animate-[newPulse_1s_ease-in-out_infinite]"><Zap size={11} className="text-brand-blue" /> {t('board.new_badge')} · {ago}</span>
        ) : (
          <span className="inline-flex items-center gap-1"><Clock size={11} /> {ago}</span>
        )}
      </div>

      {/* VIFUNGO VYA KUWASILIANA — buttons zote daima zipo, guide inaonyesha kwa wasio verified */}
      <div className="flex gap-1.5 mt-auto pt-1">
        <button onClick={onCall} disabled={!c.phone_primary} className="inline-flex items-center justify-center rounded-lg bg-white dark:bg-brand-grey-800 border border-brand-grey-300 dark:border-brand-grey-600 text-brand-grey-900 dark:text-white text-[10px] sm:text-xs px-1.5 sm:px-3 py-1.5 flex-1 disabled:opacity-40 min-w-0 font-semibold hover:bg-brand-grey-50 dark:hover:bg-brand-grey-700 transition"
          title={t('dash.call')}>
          <Phone size={12} /> <span className="hidden min-[360px]:inline">{t('dash.call')}</span>
        </button>
        <button onClick={onSMS} disabled={!c.phone_primary} className="inline-flex items-center justify-center rounded-lg bg-white dark:bg-brand-grey-800 border border-brand-grey-300 dark:border-brand-grey-600 text-brand-grey-900 dark:text-white text-[10px] sm:text-xs px-1.5 sm:px-3 py-1.5 flex-1 disabled:opacity-40 min-w-0 font-semibold hover:bg-brand-grey-50 dark:hover:bg-brand-grey-700 transition"
          title={t('board.sms_btn')}>
          <MessageSquare size={12} /> <span className="hidden min-[360px]:inline">{t('board.sms_btn')}</span>
        </button>

        {c.phone_alt && (
          <button onClick={onWhatsApp} className="inline-flex items-center justify-center rounded-lg bg-white dark:bg-brand-grey-800 border border-brand-grey-300 dark:border-brand-grey-600 text-brand-grey-900 dark:text-white text-[10px] sm:text-xs px-1.5 sm:px-3 py-1.5 flex-1 min-w-0 font-semibold hover:bg-brand-grey-50 dark:hover:bg-brand-grey-700 transition"
            title={t('board.wa_btn')}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0 fill-current" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="hidden min-[360px]:inline">{t('board.wa_btn')}</span>
          </button>
        )}
      </div>

      {/* TOAST — ndani ya card, chini ya buttons — emoji + arrow */}
      {myToast && (
        <a href="/donate" className="flex items-center gap-2 rounded-lg bg-brand-blue-50 dark:bg-brand-blue-950/40 border border-brand-blue/20 px-3 py-2.5 text-[12px] font-semibold text-brand-blue-800 dark:text-brand-blue-200 animate-slide-in hover:bg-brand-blue-100 dark:hover:bg-brand-blue-900/60 transition">
          <span className="flex-1 min-w-0 truncate">{myToast.msg}</span>
          <span className="text-brand-blue font-bold text-sm flex-shrink-0 bg-brand-blue/10 rounded-md px-2 py-0.5">Changia →</span>
        </a>
      )}
    </div>
  );
}
