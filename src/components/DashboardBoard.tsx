'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  getBoard, getRegions, getDistricts, getFacilities, logCall, bustGetCache,
  type Region, type District, type Facility,
} from '@/lib/api';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { useDataVersion } from '@/lib/useDataVersion';
import { useI18n, useT } from '@/lib/i18n';
import { getInitial } from '@/lib/initials';
import { timeAgo } from '@/lib/timeAgo';
import { parseServerDate } from '@/lib/dates';
import { useFollowStore } from '@/lib/followStore';
import { playArrivalSound } from '@/lib/sound';
import Spinner from '@/components/Spinner';

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
      if (next) playArrivalSound(); // 🎵 Test sauti PAPO HAPO anapowasha — uthibitisho wa haraka
      return next;
    });
  };
  const { messages, connected } = useLiveEvents(['match.found', 'user.registered', 'user.profile_updated']);

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
      const b = await getBoard(params, forceFresh);
      setBoard(b);
    } finally {
      setLoading(false);
    }
  }, [effectiveRegionIds, districtId, facilityId, subjectFilter, subjectQ]);

  // Load regions kwa dropdown ya chanzo + followed regions (store ya pamoja na nav)
  // REAL-TIME: admin akibadilisha mikoa (Data Management) → dropdown hii
  // inajirefresh PAPO HAPO bila refresh ya page (event-driven).
  const dv = useDataVersion();
  useEffect(() => {
    getRegions().then(setRegions).catch(() => {});
    loadFollow();
  }, [loadFollow, dv]);

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
    // Profile ikibadilika (mkoa/masomo/kada ya mtumiaji) → board ijirefresh yenyewe
    if (latest.topic === 'user.profile_updated') {
      bustGetCache();
      setPage(1);
      const tId = setTimeout(() => loadBoard(true), 300);
      return () => clearTimeout(tId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, soundOn]);

  const clearFilters = () => {
    setRegionSel(watchedIds.length > 0 ? '__all__' : '');
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
  const candidates = useMemo(() => {
    const list = [...((board?.candidates as any[]) || [])];
    list.sort((a, b) => {
      const ta = a.created_at ? (parseServerDate(a.created_at)?.getTime() ?? 0) : 0;
      const tb = b.created_at ? (parseServerDate(b.created_at)?.getTime() ?? 0) : 0;
      const aFresh = ta && now - ta < FRESH_MS;
      const bFresh = tb && now - tb < FRESH_MS;
      if (aFresh !== bFresh) return aFresh ? -1 : 1; // wapya juu, wengine chini
      return tb - ta;
    });
    return list;
  }, [board, now]);

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
              {freshCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-orange-50 text-brand-orange border border-brand-orange">
                  🆕 {freshCount} {t('board.new_arrivals')}
                </span>
              )}
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

          {/* Kichujio cha masomo — wote / yote mawili / moja / wasio match + search */}
          {isEdu && (
            <div className="mt-2.5 space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-brand-grey-500 dark:text-brand-grey-400 mr-1">{t('board.subjects')}:</span>
                {([['off', t('board.subj_off')], ['all', t('board.subj_all')], ['any', t('board.subj_any')], ['none', t('board.subj_none')]] as const).map(([val, label]) => (
                  <button
                    key={val} type="button"
                    onClick={() => { setSubjectFilter(val); setPage(1); }}
                    aria-pressed={subjectFilter === val}
                    className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold transition ${
                      subjectFilter === val
                        ? 'border-brand-gold bg-brand-gold text-white'
                        : 'border-brand-grey-300 text-brand-grey-600 hover:border-brand-gold dark:border-brand-grey-600 dark:text-brand-grey-300'
                    }`}
                  >{label}</button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 max-w-sm">
                <span className="text-brand-grey-400 text-sm">🔍</span>
                <input
                  className="input text-xs py-1.5"
                  placeholder={t('board.subj_search_ph')}
                  value={subjectQ}
                  onChange={(e) => { setSubjectQ(e.target.value); setPage(1); }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats chips (kiwango cha sasa) — HAKUNA "no data" kama data zipo! */}
        <div className="px-4 md:px-5 pt-3 pb-4">
          {loading ? (
            <Spinner label={t('action.loading')} className="py-2" />
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
        <div className="py-8"><Spinner label={t('action.loading')} /></div>
      ) : pageItems.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-2">{isEdu ? '👩🏫' : '🏥'}</div>
          <p className="text-brand-grey-500">{t('board.no_candidates')}</p>
        </div>
      ) : (
        <>
          {/* Grid ELASTIC: inajiweka yenyewe kwa kila kifaa — simu ndogo sana = 1-2 col,
              simu ya kawaida = 2 col, desktop = 3 col. Hakuna kujibana tena! */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(165px,1fr))] gap-2.5 md:gap-3">
            {pageItems.map((c: any) => (
              <BoardCard key={c.user_id} c={c} now={now} lang={lang} mySubjects={mySubjects} me={user as any} />
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

function BoardCard({ c, now, lang, mySubjects, me }: { c: any; now: number; lang: 'sw' | 'en'; mySubjects: string[]; me?: any }) {
  const t = useT();
  const initial = getInitial(c.full_name);
  const from = c.current_station;
  const to = c.desired_destinations?.[0];
  const createdTs = c.created_at ? (parseServerDate(c.created_at)?.getTime() ?? now) : now;
  const ago = timeAgo(createdTs, lang); // Muda wa JUUI: "dakika 2 zilizopita", "jana" — sio saa halisi
  const fresh = now - createdTs < FRESH_MS;
  const isEdu = c.category !== 'health';
  // SOMO MOJA likifanana → mtu huyu ni "match" wa masomo — chips zote dhahabu
  const anySubjectMatch = (c.subjects || []).some((s: string) => mySubjects.includes(s));

  async function onCall() {
    if (!c.phone_primary) return;
    try { await logCall(c.user_id, 'initiated'); } catch {}
    window.location.href = `tel:${c.phone_primary}`;
  }

  // SMS ya kawaida — sms: inafungua app ya SMS na ujumbe wa kutambulishana.
  function onSMS() {
    if (!c.phone_primary) return;
    window.location.href = `sms:${c.phone_primary}?body=${encodeURIComponent(introMsg)}`;
  }

  // WHATSAPP: namba ya WhatsApp ndiyo aliyoiweka kama phone_alt (ya WhatsApp).
  // Kama hajaweka namba ya WhatsApp → hakuna button ya WhatsApp (2 tu: simu + SMS).
  function onWhatsApp() {
    if (!c.phone_alt) return;
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
    <div className={`card p-3 md:p-4 flex flex-col gap-2.5 hover:shadow-md transition group ${
      fresh ? 'border-brand-orange ring-2 ring-brand-orange/30 animate-[requestPing_1.5s_ease-in-out]'
      : c.online ? 'border-green-300 bg-green-50/60 dark:bg-green-900/10 dark:border-green-700/50'
      : ''}`}>
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold text-base md:text-lg">
            {initial}
          </div>
          {c.online && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white dark:border-brand-grey-100" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-brand-grey-900 dark:text-white break-words min-w-0 leading-snug">{c.full_name}</span>
            {fresh && (
              <span className="text-[10px] font-bold text-brand-orange bg-brand-orange-50 px-1.5 py-0.5 rounded-full animate-[newPulse_1s_ease-in-out_infinite] ring-2 ring-brand-orange/40">🆕 {t('board.new_badge')}</span>
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
          </div>
        </div>
      </div>

      {from && (
        <div className="text-xs bg-brand-grey-50 dark:bg-brand-grey-100 rounded-lg px-2.5 py-1.5 space-y-0.5">
          <div className="text-brand-grey-500 break-words"><b>{t('board.from')}:</b> {from.district_name || ''} {from.region_name}</div>
          {to && (
            <div className="text-brand-orange break-words"><b>{t('board.wants_go')}:</b> {to.district_name || to.region_name} ({to.region_name})</div>
          )}
          <div className="text-green-600 font-bold">↓ {t('board.coming_to_you')}</div>
        </div>
      )}

      {c.subjects?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-[11px]">
          <span className="text-brand-grey-500 font-semibold">{t('board.subjects')}:</span>
          {anySubjectMatch && (
            <span className="px-1.5 py-0.5 rounded-full bg-brand-gold text-white font-bold">🎯 {t('board.subjects_match')}</span>
          )}
          {c.subjects.map((s: string) => {
            const matched = mySubjects.includes(s);
            return (
              <span key={s} title={matched ? t('board.subject_match') : undefined}
                className={`px-1.5 py-0.5 rounded-full font-semibold ${anySubjectMatch ? 'bg-brand-gold text-white' : 'bg-brand-grey-100 text-brand-grey-600 dark:bg-brand-grey-200 dark:text-brand-grey-300'}`}>
                {s}{matched ? ' ✓' : ''}
              </span>
            );
          })}
        </div>
      )}

      {c.phone_primary && (
        <a href={`tel:${c.phone_primary}`} className="text-xs sm:text-sm text-brand-blue font-semibold hover:underline inline-flex items-center gap-1 break-all min-w-0">
          📞 {c.phone_primary}
        </a>
      )}

      {/* MUDA WA JUU (relative): "dakika 2 zilizopita" / "jana" — siyo saa halisi */}
      <div className="text-[11px] font-medium text-brand-grey-400" title={`${new Date(createdTs).toLocaleString('sw-TZ')}`}>
        🕐 {ago}
      </div>

      {/* VIFUNGO VYA KUWASILIANA: 1) PIGA SIMU (tel:) 2) SMS YA KAWAIDA (sms:)
          3) WHATSAPP — kwa namba ya WhatsApp ALIYOIWEKA (phone_alt) PEKEE.
          Buttons zote NYEUPE (official, sio rangi) — WhatsApp ina emoji rasmi. */}
      <div className="flex gap-1.5 mt-auto pt-1">
        <button onClick={onCall} disabled={!c.phone_primary} className="inline-flex items-center justify-center rounded-lg bg-white dark:bg-brand-grey-800 border border-brand-grey-300 dark:border-brand-grey-600 text-brand-grey-900 dark:text-white text-[10px] sm:text-xs px-1.5 sm:px-3 py-1.5 flex-1 disabled:opacity-40 min-w-0 font-semibold hover:bg-brand-grey-50 dark:hover:bg-brand-grey-700 transition"
          title={t('dash.call')}>
          📞 <span className="hidden min-[360px]:inline">{t('dash.call')}</span>
        </button>
        <button onClick={onSMS} disabled={!c.phone_primary} className="inline-flex items-center justify-center rounded-lg bg-white dark:bg-brand-grey-800 border border-brand-grey-300 dark:border-brand-grey-600 text-brand-grey-900 dark:text-white text-[10px] sm:text-xs px-1.5 sm:px-3 py-1.5 flex-1 disabled:opacity-40 min-w-0 font-semibold hover:bg-brand-grey-50 dark:hover:bg-brand-grey-700 transition"
          title={t('board.sms_btn')}>
          ✉️ <span className="hidden min-[360px]:inline">{t('board.sms_btn')}</span>
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
    </div>
  );
}
