import axios from 'axios';
import { API_URL, WS_URL } from './config';

const API = API_URL;
const AUTH = API;
const USER = API;
const LOC = API;
const MATCH = API;
const MSG = API;
const ADMIN = API;

const client = axios.create({ timeout: 20000 });

/* GET cache ndogo (sekunde 15) — kurudi kwenye pages kufanya kazi PAPO HAPO
   (SPA feel: hakuna blank flash au kusubiri tena data sawa).
   Mutations (POST/PUT/PATCH/DELETE) hazihifadhiwi; WS events bado zinarefresh live.

   TAHADHARI: data ya LIVE (board, unread, notifications, conversations) lazima
   iwe FRESH — cache ya kale ndiyo ilikuwa sababu ya "notification inaonekana
   lakini board inasema no data". Tumia bustGetCache() kabla ya reload kutokana
   na WS event, au config.bypassCache kwa call moja tu. */
const _getCache = new Map<string, { at: number; data: any }>();
const _GET_TTL = 15_000;                    // data ya LIVE-ish (board, chats, arifa)
const _STATIC_TTL = 24 * 60 * 60 * 1000;    // data ya kijiografia — haibadiliki kamwe
// Static data (mikoa/wilaya/vituo/kada/masomo) inaishi kwenye localStorage PIA —
// ukifetch mara ya kwanza, inakaa kwenye browser; refresh ya page au kurudi
// kwenye page HAKUPIGI API tena — inajitokeza INSTANT. Cache inafutwa tu
// admin anapobadilisha data hizi (mutation).
const _LS_PREFIX = 'kv_static_cache:';

function _lsRead(key: string): { at: number; payload: any } | null {
  try {
    const raw = localStorage.getItem(_LS_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function _lsWrite(key: string, val: { at: number; payload: any }) {
  try { localStorage.setItem(_LS_PREFIX + key, JSON.stringify(val)); } catch { /* quota — puuza */ }
}

const _origGet = client.get.bind(client);
/**
 * Stale-while-revalidate cache:
 *  1. Cache HIT (ndani ya TTL) → return mara moja (hakuna fetch).
 *  2. Cache STALE (imepita TTL lakini data bado ipo) → return data ya zamani
 *     MARA MOJA + fetch data mpya nyuma (background revalidation).
 *  3. Cache MISS (hakuna data) → fetch + spinner.
 *
 * Hii inafanya pages ziwe FAST (data ya zamani = zero wait) na data mpya
 * ijayo automatically baada ya second.
 */
const _pendingFetches = new Map<string, Promise<any>>();
(client.get as any) = (url: string, config?: any) => {
  // Include user token in cache key — prevents data leakage between users
  let _cacheUser = '';
  try {
    const raw = localStorage.getItem('kv_auth');
    if (raw) { const t = JSON.parse(raw)?.state?.token; if (t) _cacheUser = t.slice(-20); }
  } catch {}
  const key = _cacheUser + '|' + url + '|' + JSON.stringify(config?.params || {});
  const ttl = config?.ttl ?? _GET_TTL;
  const isStatic = ttl === _STATIC_TTL;
  const isFresh = (hit: { at: number }) => Date.now() - hit.at < ttl;

  if (!config?.bypassCache) {
    // 1. CACHE HIT — data bado ni mpya
    const hit = _getCache.get(key);
    if (hit && isFresh(hit)) return Promise.resolve(hit.data);

    // 2. STALE — data ipo lakini imepita TTL → return zamani + revalidate background
    if (hit) {
      // Return stale data immediately (fast page load)
      const staleResult = Promise.resolve(hit.data);
      // Background revalidation — fetch fresh na uweke kwenye cache
      if (!_pendingFetches.has(key)) {
        const freshening = _origGet(url, config).then((res: any) => {
          _getCache.set(key, { at: Date.now(), data: res });
          if (isStatic) _lsWrite(key, { at: Date.now(), payload: res.data });
          return res;
        }).finally(() => _pendingFetches.delete(key));
        _pendingFetches.set(key, freshening);
      }
      return staleResult;
    }

    // Static data: localStorage hit
    if (isStatic) {
      const saved = _lsRead(key);
      if (saved && Date.now() - saved.at < ttl) {
        const restored = { data: saved.payload };
        _getCache.set(key, { at: saved.at, data: restored });
        return Promise.resolve(restored);
      }
      // Stale localStorage data — return + revalidate
      if (saved) {
        const restored = { data: saved.payload };
        _getCache.set(key, { at: saved.at, data: restored });
        if (!_pendingFetches.has(key)) {
          const freshening = _origGet(url, config).then((res: any) => {
            _getCache.set(key, { at: Date.now(), data: res });
            _lsWrite(key, { at: Date.now(), payload: res.data });
            return res;
          }).finally(() => _pendingFetches.delete(key));
          _pendingFetches.set(key, freshening);
        }
        return Promise.resolve(restored);
      }
    }
  }

  // 3. CACHE MISS — fetch fresh data (spinner onyeshwa)
  return _origGet(url, config).then((res: any) => {
    _getCache.set(key, { at: Date.now(), data: res });
    if (isStatic) _lsWrite(key, { at: Date.now(), payload: res.data });
    return res;
  });
};

/** Futa cache yote ya GET — piga kabla ya reload inayoendeshwa na WS live event
    (board, unread, notifications, announcements, chats). Static data ya
    localStorage pia inafutwa — admin akibadilisha mikoa/masomo, lazima data
    ipate kufetch upya (isiolewe ya zamani). */
export function bustGetCache() {
  _getCache.clear();
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(_LS_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

/* ── Global data-change bus ──────────────────────────────
   Reference data (masomo/kada/mikoa/wilaya/idara/vituo) inabadilishwa kwenye
   Data Management. Consumers (Users page pickers, wizard ya usajili, profile)
   zinasikiliza hii na kujirefresh PAPO HAPO — hata kama mabadiliko yanatoka
   kwenye tab nyingine au session nyingine (kupitia SSE data.* events).
   Hii inafanya "add/update data" iwe event-driven kama delete. */
type DataChangedCb = () => void;
const _dataCbs = new Set<DataChangedCb>();
let _dataVer = 0;
export function onDataChanged(cb: DataChangedCb): () => void {
  _dataCbs.add(cb);
  return () => { _dataCbs.delete(cb); };
}
/** Piga watumiaji wote — kila mtu atafetch upya (cache imefutwa). */
export function emitDataChanged() {
  _dataVer++;
  bustGetCache();
  _dataCbs.forEach((cb) => { try { cb(); } catch {} });
}
export function dataVersion(): number { return _dataVer; }

// Tab nyingine ikifuta cache ya static (admin akibadilisha data kwenye tab
// nyingine), tab hii inafuta in-memory cache yake pia — vinginevyo data ya
// kale ingebaki hadi refresh. (storage event inafyatuka kwenye tabs nyingine
// tu — tab iliyofanya mabadiliko tayari imebust cache yake.)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith(_LS_PREFIX)) {
      _dataVer++;
      _getCache.clear();
      _dataCbs.forEach((cb) => { try { cb(); } catch {} });
    }
  });
}

/* Mutations (POST/PUT/PATCH/DELETE) zinapaswa kufusha cache ya GET — vinginevyo
   baada ya kubadilisha followed regions / destinations / wasifu, kurudi kwenye
   page kunaweza kurudisha data ya KALE ("imeshafanyika lakini bado inaonekana
   ya zamani"). Sasa kila mutation inafuta cache mara moja. */
for (const m of ['post', 'put', 'patch', 'delete'] as const) {
  const orig = client[m].bind(client) as (...a: any[]) => any;
  (client as any)[m] = (...args: any[]) => {
    // bustGetCache (siyo tu _getCache.clear) — inafuta PIA static data ya
    // localStorage. Vinginevyo admin akibadilisha mikoa/masomo, data ya kale
    // ingeonekana hadi siku nzima kwenye wizard ya usajili. Mutations zote
    // (k.m. admin CRUD, destinations) lazima zifanye data FRESH.
    bustGetCache();
    return orig(...args).then((r: any) => {
      // Reference data (masomo/kada/mikoa/wilaya/idara/vituo) ikibadilishwa
      // → watangazie consumers wote (wizard/pickers/profile) wajirefresh
      // PAPO HAPO bila refresh ya page (event-driven). Tunagusa mutations za
      // data management pekee — siyo payments/profile (hizo zinabust cache tu
      // na hazihitaji consumers za reference data kurefresh).
      const url = String(args[0] || '');
      if (/\/admin\/data\//.test(url)) emitDataChanged();
      return r;
    });
  };
}

export async function exportErrorText(e: any): Promise<string> {
  try {
    const d = e?.response?.data;
    if (d instanceof Blob) {
      const text = await d.text();
      try { return JSON.parse(text)?.detail || text.slice(0, 200); } catch { return text.slice(0, 200); }
    }
    return e?.response?.data?.detail || 'jaribu tena baadaye';
  } catch {
    return 'jaribu tena baadaye';
  }
}

client.interceptors.request.use((cfg) => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('kv_auth');
    if (raw) {
      try {
        const token = JSON.parse(raw)?.state?.token;
        if (token) cfg.headers.Authorization = `Bearer ${token}`;
      } catch {}
    }
  }
  return cfg;
});

/* ── Location cascading ────────────────────────────── */
export interface Region { id: number; name: string; }
export interface District { id: number; name: string; region_id: number; region_name: string; }
export interface Facility {
  id?: number; code?: string; name: string;
  level?: string; type?: string; type_category?: string;
  ownership?: string; ownership_category?: string;
}
export interface Cadre {
  code: string; category: 'health' | 'education';
  display_name: string; requires_subjects: boolean;
  level?: string;
}
export interface Subject { code: string; name: string; level: string; }

export const getRegions = () =>
  client.get<Region[]>(`${LOC}/locations/regions`, { ttl: _STATIC_TTL } as any).then((r) => r.data);
export interface Department { code: string; name: string; status: string; icon?: string | null; }
export const getDepartments = (bypassCache = false) =>
  client.get<Department[]>(`${LOC}/locations/departments`, { ttl: 60_000, bypassCache } as any).then((r) => r.data);
export const getDistricts = (regionId: number) =>
  client.get<District[]>(`${LOC}/locations/regions/${regionId}/districts`, { ttl: _STATIC_TTL } as any).then((r) => r.data);
export const getFacilities = (
  districtId: number,
  category: 'health' | 'education',
  level?: 'Primary' | 'Secondary',
  q?: string
) => {
  const params: any = { category };
  if (level) params.level = level;
  if (q) params.q = q;
  return client.get<Facility[]>(`${LOC}/locations/districts/${districtId}/facilities`, { params, ttl: _STATIC_TTL } as any).then((r) => r.data);
};
export const getCadres = (category?: string, bypass = false) =>
  client.get<Cadre[]>(`${LOC}/cadres`, { params: category ? { category } : undefined, ttl: 60_000, bypassCache: bypass } as any).then((r) => r.data);
export const getSubjects = (level?: 'Primary' | 'Secondary', bypass = false) =>
  client.get<Subject[]>(`${LOC}/cadres/subjects`, { params: level ? { level } : undefined, ttl: 60_000, bypassCache: bypass } as any).then((r) => r.data);

/* ── Auth ─────────────────────────────────────────── */
export interface Station {
  region_id: number; region_name: string;
  district_id: number; district_name: string;
  facility_id?: string | null; facility_name?: string | null;
  facility_type?: string | null;
}
export interface Destination {
  region_id: number; region_name: string;
  district_id?: number | null; district_name?: string | null;
  facility_id?: string | null; facility_name?: string | null;
  notes?: string | null;
}
export interface RegisterPayload {
  full_name: string;
  phone_primary: string;
  phone_alt?: string;
  password: string;
  category: string;
  cadre_code: string;
  subjects: string[];
  current_station: Station;
  desired_destinations: Destination[];
}
export interface AuthResponse {
  user_id: string;
  full_name: string;
  phone_primary?: string;
  category?: string;
  cadre_code?: string;
  cadre_display?: string;
  is_admin?: boolean;
  is_verified?: boolean;
  access_token: string;
  token_type: string;
}
export const register = (body: RegisterPayload) =>
  client.post<AuthResponse>(`${AUTH}/auth/register`, body).then((r) => r.data);
export const login = (identifier: string, password?: string) =>
  client.post<AuthResponse>(`${AUTH}/auth/login`, { phone: identifier, password: password || null }).then((r) => r.data);
export const login2FA = (email: string, code: string) =>
  client.post<AuthResponse>(`${AUTH}/auth/login/2fa`, { email, code }).then((r) => r.data);

/* ── Admin email verification (kwenye login — auto-detect email) ────────── */
export const requestEmailVerification = (email: string, password: string, phone?: string) =>
  client.post<{ ok: boolean; message: string }>(`${AUTH}/auth/email/verify-request`, { email, password, phone })
    .then((r) => r.data);
export const confirmEmailVerification = (email: string, code: string) =>
  client.post<{ ok: boolean; email_verified: boolean; message: string }>(`${AUTH}/auth/email/verify`, { email, code })
    .then((r) => r.data);

export interface BoardStats {
  scope: 'incoming' | 'all';
  total: number;
  candidates: any[];
  by_region: { region_id: number; region_name: string; count: number }[];
  by_district: { district_id: number; district_name: string; region_name: string; count: number }[];
  by_facility: { facility_id: string; facility_name: string; district_name: string; district_id: number; count: number }[];
}
export const getBoard = (params?: {
  scope?: 'incoming' | 'all';
  region_id?: number;
  region_ids?: string;
  district_id?: number;
  facility_id?: string;
  subject_match?: boolean;
  subject_filter?: 'off' | 'any' | 'all' | 'none';
  subject_q?: string;
  limit?: number;
  q?: string;
  source_region_id?: number;
  cadre_code?: string;
}, bypassCache = false) =>
  // TTL ndefu (45s): kurudi kwenye dashboard hakufetch DB kila mara — WS events
  // zinabust cache na kufetch fresh PAPO HAPO (data ya live haichemki).
  client.get<BoardStats>(`${MATCH}/matches/board`, {
    params: { ...params, bypass_cache: bypassCache },
    bypassCache,
    ttl: 45_000,
  } as any).then((r) => r.data);

export const getFollowedRegions = () =>
  client.get<{ region_ids: number[] }>(`${USER}/users/me/followed-regions`).then((r) => r.data);
export const updateFollowedRegions = (region_ids: number[]) =>
  client.put<{ region_ids: number[] }>(`${USER}/users/me/followed-regions`, { region_ids }).then((r) => r.data);

export const getMe = (fresh = false) => client.get(`${AUTH}/auth/me`, { params: fresh ? { _t: Date.now() } : undefined, bypassCache: fresh } as any).then((r) => r.data);
export const checkPhone = (phone: string) =>
  client.get<{ available: boolean; phone_normalized?: string; reason?: string }>(
    `${AUTH}/auth/check-phone/${encodeURIComponent(phone)}`
  ).then((r) => r.data);
export const forgotPassword = (phone: string, full_name?: string) =>
  client.post(`${AUTH}/auth/forgot-password`, { phone, full_name }).then((r) => r.data);
export const getPasswordResetStatus = (phone: string) =>
  client.get<{ status: string; reset_id?: string }>(`${AUTH}/auth/password-reset/status`, { params: { phone } }).then((r) => r.data);
export const resetPassword = (phone: string, new_password: string, code?: string) =>
  client.post(`${AUTH}/auth/reset-password`, { phone, new_password, code: code || null }).then((r) => r.data);

/* ── Profile ──────────────────────────────────────── */
export const getMyProfile = () => client.get(`${USER}/users/me`).then((r) => r.data);
export const updateProfile = (body: {
  full_name?: string;
  phone_primary?: string;
  phone_alt?: string | null;
  subjects?: string[];
  cadre_code?: string;
  current_station?: Station;
  desired_destinations?: Destination[];
}) =>
  client.patch(`${USER}/users/me`, body).then((r) => r.data);
export const changeMyPassword = (current_password: string, new_password: string) =>
  client.post<{ ok: boolean; message: string }>(`${USER}/users/me/password`, { current_password, new_password }).then((r) => r.data);
export const getUserById = (userId: string) => client.get(`${USER}/users/${userId}`).then((r) => r.data);
export const listOnlineUsers = () => client.get(`${USER}/users/online`).then((r) => r.data);
export const getRecentUsers = (limit = 15) =>
  client.get<{ count: number; users: any[] }>(`${USER}/users/recent`, { params: { limit } }).then((r) => r.data);
export const recentlyActive = (minutes = 60) =>
  client.get(`${USER}/users/recently-active`, { params: { minutes } }).then((r) => r.data);
export const updateDestinations = (desired_destinations: Destination[]) =>
  client.put(`${USER}/users/me/destinations`, { desired_destinations }).then((r) => r.data);
export const updateStation = (current_station: Station) =>
  client.put(`${USER}/users/me/station`, { current_station }).then((r) => r.data);

/* ── Matches ─────────────────────────────────────── */
export interface Candidate {
  user_id: string;
  full_name: string;
  phone_primary: string;
  cadre_display?: string;
  current_station: any;
  desired_destinations: any[];
}
export interface Match {
  score: number;
  candidate: Candidate;
}
export const getMatches = (params?: { region_id?: number; district_id?: number; facility_id?: string }) =>
  client.get<{ total: number; filtered: number; matches: Match[] }>(`${MATCH}/matches/me`, { params }).then((r) => r.data);
export const getMatchStats = () =>
  client.get(`${MATCH}/matches/stats`).then((r) => r.data);

/* ── Messaging (call logging + presence only — in-app chat imeondolewa) ── */
export const logCall = (to_user_id: string, outcome: string = 'initiated') =>
  client.post(`${MSG}/messages/call`, { to_user_id, outcome }).then((r) => r.data);
export const listCalls = () =>
  client.get(`${MSG}/messages/calls`).then((r) => r.data);
export const getPresence = (bypassCache = false) =>
  client.get<{ online_user_ids: string[]; count: number }>(`${MSG}/messages/presence`, { bypassCache } as any).then((r) => r.data);

/* ── Admin ────────────────────────────────────────── */
// TTL ndefu kidogo (20s) kwa admin data — kurudi kwenye admin pages hukusubirisha
// kila mara; WS events + mutations bado zinabust cache (bustGetCache).
const _ADMIN_TTL = 20_000;
export const adminStats = (bypass = false) =>
  client.get(`${ADMIN}/admin/stats`, { ttl: _ADMIN_TTL, bypassCache: bypass } as any).then((r) => r.data);
export const adminUsers = (params?: any, bypass = false) =>
  client.get(`${ADMIN}/admin/users`, { params, ttl: _ADMIN_TTL, bypassCache: bypass } as any).then((r) => r.data);
export const adminMatches = (limit = 100) =>
  client.get(`${ADMIN}/admin/matches`, { params: { limit }, ttl: _ADMIN_TTL } as any).then((r) => r.data);
export const adminRealMatches = (params?: { category?: string; cadre_code?: string; limit?: number }, bypass = false) =>
  client.get(`${ADMIN}/admin/real-matches`, { params, ttl: _ADMIN_TTL, bypassCache: bypass } as any).then((r) => r.data);
export const adminUserMatches = (user_id: string, limit = 50) =>
  client.get(`${ADMIN}/admin/users/${user_id}/matches`, { params: { limit }, ttl: _ADMIN_TTL, bypassCache: true } as any).then((r) => r.data);
export const adminUserBoard = (user_id: string, params?: any) =>
  client.get(`${ADMIN}/admin/users/${user_id}/board`, { params, ttl: _ADMIN_TTL, bypassCache: true } as any).then((r) => r.data);
export const adminLoginAsUser = (user_id: string) =>
  client.get(`${ADMIN}/admin/users/${user_id}/login-as`, { ttl: 0, bypassCache: true } as any).then((r) => r.data);
export const adminUsersWithMatches = (bypass = false) =>
  client.get(`${ADMIN}/admin/users/with-matches`, { ttl: _ADMIN_TTL, bypassCache: bypass } as any).then((r) => r.data);
/* ── Maoni na Malalamiko (feedback) ── */
export const submitFeedback = (body: { subject: string; message: string }) =>
  client.post(`${ADMIN}/feedback`, body).then((r) => r.data);
export const myFeedback = () =>
  client.get(`${ADMIN}/feedback/my`, { bypassCache: true } as any).then((r) => r.data);
export const adminListFeedback = (status = '', q = '', bypass = false) =>
  client.get(`${ADMIN}/feedback/admin/all`, { params: { status, q }, ttl: _ADMIN_TTL, bypassCache: bypass } as any).then((r) => r.data);
export const adminReplyFeedback = (feedback_id: string, reply: string) =>
  client.post(`${ADMIN}/feedback/admin/${feedback_id}/reply`, { reply }).then((r) => r.data);
export const adminDeleteFeedback = (feedback_id: string) =>
  client.delete(`${ADMIN}/feedback/admin/${feedback_id}`).then((r) => r.data);
// bypass=true wakati kichujio (event_type) kinatumika — kila mabadiliko ya
// dropdown yafetch FRESH (cache isiingilie data mpya).
export const adminEvents = (event_type?: string, limit = 100, skip = 0, bypass = false) =>
  client.get(`${ADMIN}/admin/events`, { params: { event_type, limit, skip }, ttl: _ADMIN_TTL, bypassCache: bypass } as any).then((r) => r.data);
export const adminGrant = (user_id: string) =>
  client.post(`${ADMIN}/admin/users/${user_id}/grant-admin`).then((r) => r.data);
export const adminRevoke = (user_id: string) =>
  client.post(`${ADMIN}/admin/users/${user_id}/revoke-admin`).then((r) => r.data);
export const adminUpdateUser = (user_id: string, changes: any) =>
  client.patch(`${ADMIN}/admin/users/${user_id}`, changes).then((r) => r.data);
export const adminDeleteUser = (user_id: string) =>
  client.delete(`${ADMIN}/admin/users/${user_id}`).then((r) => r.data);
export const adminBulkUsers = (user_ids: string[], action: 'delete' | 'disable' | 'enable') =>
  client.post<{ ok: boolean; action: string; processed: number; skipped_admin: number }>(
    `${ADMIN}/admin/users/bulk`, { user_ids, action }
  ).then((r) => r.data);
export const adminCreateUser = (body: {
  full_name: string;
  email?: string;
  phone_primary?: string;
  phone_alt?: string;
  password: string;
  is_admin?: boolean;
  status?: string;
  category?: string;
  cadre_code?: string;
  subjects?: string[];
  current_station?: Station | null;
  desired_destinations?: Destination[];
  is_verified?: boolean;
}) =>
  client.post(`${ADMIN}/admin/users`, body).then((r) => r.data);
/* ── Admin: Trash (soft delete → restore | permanent) ── */
export const adminTrashList = (q?: string) =>
  client.get<{ total: number; items: any[] }>(`${ADMIN}/admin/users/trash`, { params: q ? { q } : {}, bypassCache: true } as any).then((r) => r.data);
export const adminTrashRestore = (user_id: string) =>
  client.post(`${ADMIN}/admin/users/trash/${user_id}/restore`).then((r) => r.data);
export const adminTrashPurge = (user_id: string) =>
  client.delete(`${ADMIN}/admin/users/trash/${user_id}`).then((r) => r.data);
export const adminTrashPurgeBulk = (user_ids: string[]) =>
  client.delete(`${ADMIN}/admin/users/trash`, { params: { ids: user_ids } }).then((r) => r.data);

/* ── Admin: data management (idara/masomo/kada/mikoa/wilaya/vituo) ── */
export const adminListDepartments = (bypass = false) =>
  client.get(`${ADMIN}/admin/data/departments`, { ttl: _ADMIN_TTL, bypassCache: bypass } as any).then((r) => r.data);
export const adminAddDepartment = (body: { code: string; name: string; status: string; icon?: string }) =>
  client.post(`${ADMIN}/admin/data/departments`, body).then((r) => r.data);
export const adminUpdateDepartment = (code: string, body: { code: string; name: string; status: string; icon?: string }) =>
  client.patch(`${ADMIN}/admin/data/departments/${code}`, body).then((r) => r.data);
export const adminDeleteDepartment = (code: string) =>
  client.delete(`${ADMIN}/admin/data/departments/${code}`).then((r) => r.data);
export const adminListSubjects = (level?: string, bypass = false) =>
  client.get(`${ADMIN}/admin/data/subjects`, { params: level ? { level } : {}, ttl: _ADMIN_TTL, bypassCache: bypass } as any).then((r) => r.data);
export const adminAddSubject = (body: { code: string; name: string; level: string }) =>
  client.post(`${ADMIN}/admin/data/subjects`, body).then((r) => r.data);
export const adminUpdateSubject = (code: string, body: { code: string; name: string; level: string }) =>
  client.patch(`${ADMIN}/admin/data/subjects/${code}`, body).then((r) => r.data);
export const adminDeleteSubject = (code: string) =>
  client.delete(`${ADMIN}/admin/data/subjects/${code}`).then((r) => r.data);
export const adminListCadres = (category?: string, bypass = false) =>
  client.get(`${ADMIN}/admin/data/cadres`, { params: category ? { category } : {}, ttl: _ADMIN_TTL, bypassCache: bypass } as any).then((r) => r.data);
export const adminAddCadre = (body: any) =>
  client.post(`${ADMIN}/admin/data/cadres`, body).then((r) => r.data);
export const adminUpdateCadre = (code: string, body: any) =>
  client.patch(`${ADMIN}/admin/data/cadres/${code}`, body).then((r) => r.data);
export const adminDeleteCadre = (code: string) =>
  client.delete(`${ADMIN}/admin/data/cadres/${code}`).then((r) => r.data);
export const adminListRegions = (bypass = false) =>
  client.get(`${ADMIN}/admin/data/regions`, { ttl: _ADMIN_TTL, bypassCache: bypass } as any).then((r) => r.data);
export const adminAddRegion = (body: { id: number; name: string }) =>
  client.post(`${ADMIN}/admin/data/regions`, body).then((r) => r.data);
export const adminUpdateRegion = (id: number, body: { id: number; name: string }) =>
  client.patch(`${ADMIN}/admin/data/regions/${id}`, body).then((r) => r.data);
export const adminDeleteRegion = (id: number) =>
  client.delete(`${ADMIN}/admin/data/regions/${id}`).then((r) => r.data);
export const adminListDistricts = (region_id?: number, bypass = false) =>
  client.get(`${ADMIN}/admin/data/districts`, { params: region_id ? { region_id } : {}, ttl: _ADMIN_TTL, bypassCache: bypass } as any).then((r) => r.data);
export const adminAddDistrict = (body: { id: number; region_id: number; name: string }) =>
  client.post(`${ADMIN}/admin/data/districts`, body).then((r) => r.data);
export const adminUpdateDistrict = (id: number, body: { id: number; region_id: number; name: string }) =>
  client.patch(`${ADMIN}/admin/data/districts/${id}`, body).then((r) => r.data);
export const adminDeleteDistrict = (id: number) =>
  client.delete(`${ADMIN}/admin/data/districts/${id}`).then((r) => r.data);
export interface FacilityBody {
  category: 'health' | 'education';
  name: string;
  region_id: number;
  district_id: number;
  code?: string;
  type?: string;
  school_code?: string;
  level?: 'Primary' | 'Secondary';
  ownership?: string;
}
export const adminListFacilities = (params: { category?: string; region_id?: number; district_id?: number; q?: string } = {}, bypass = false) =>
  client.get(`${ADMIN}/admin/data/facilities`, { params, ttl: _ADMIN_TTL, bypassCache: bypass } as any).then((r) => r.data);
export const adminAddFacility = (body: FacilityBody) =>
  client.post(`${ADMIN}/admin/data/facilities`, body).then((r) => r.data);
export const adminUpdateFacility = (facility_id: string | number, body: FacilityBody) =>
  client.patch(`${ADMIN}/admin/data/facilities/${facility_id}`, body).then((r) => r.data);
export const adminDeleteFacility = (facility_id: string | number, category: 'health' | 'education') =>
  client.delete(`${ADMIN}/admin/data/facilities/${facility_id}`, { params: { category } }).then((r) => r.data);

/* ── Admin: exports + cleanup ── */
export const adminEventsExport = (event_type?: string, fmt: 'pdf' | 'docx' | 'csv' | 'xlsx' = 'pdf') =>
  client.get(`${ADMIN}/admin/events/export`, { params: { event_type, fmt }, responseType: 'blob', bypassCache: true } as any);
export const adminReports = (days = 30, filters: { region?: string; level?: string; category?: string } = {}) =>
  client.get(`${ADMIN}/admin/reports`, { params: { days, ...filters }, ttl: 15_000, bypassCache: !!filters.region || !!filters.level || !!filters.category } as any).then((r) => r.data);
export const adminReportsExport = (fmt: 'pdf' | 'docx' | 'csv' | 'xlsx' = 'pdf', days = 30) =>
  client.get(`${ADMIN}/admin/reports/export`, { params: { fmt, days }, responseType: 'blob', bypassCache: true } as any);
export const adminClearEvents = () =>
  client.post(`${ADMIN}/admin/events/clear`).then((r) => r.data);
export const adminCleanupTestData = (wipeAll = false) =>
  client.post(`${ADMIN}/admin/cleanup-test-data`, null, { params: wipeAll ? { wipe_all: true } : {} }).then((r) => r.data);

/* ── Donations (manual SMS verification) ─────────── */
export interface DonationSubmit {
  amount: number;
  phone?: string;
  sms_text: string;
  purpose?: string;
}
export const getDonationInfo = () =>
  client.get<{ phone: string; currency: string }>(`${API}/payments/info`).then((r) => r.data);
export const submitDonation = (body: DonationSubmit) =>
  client.post(`${API}/payments/donate`, body).then((r) => r.data);
export const getDonationStatus = (order_id: string) =>
  client.get(`${API}/payments/status/${order_id}`).then((r) => r.data);
export const myDonations = () =>
  client.get(`${API}/payments/my-history`).then((r) => r.data);
// bypass wakati status imechaguliwa — dropdown ibadilike mara moja (fresh data).
export const adminAllDonations = (status?: string, bypass = false) =>
  client.get(`${API}/payments/admin/all`, { params: status ? { status } : {}, bypassCache: bypass } as any).then((r) => r.data);
export const adminApproveDonation = (order_id: string, note?: string) =>
  client.post(`${API}/payments/admin/${order_id}/approve`, { note }).then((r) => r.data);
export const adminRejectDonation = (order_id: string, note?: string) =>
  client.post(`${API}/payments/admin/${order_id}/reject`, { note }).then((r) => r.data);

/* ── Payment messages (customer ↔ admin chat) ── */
export const sendPaymentMessage = (order_id: string, message: string) =>
  client.post(`${API}/payments/${order_id}/message`, { message }).then((r) => r.data);
export const adminReplyPayment = (order_id: string, reply: string) =>
  client.post(`${API}/payments/admin/${order_id}/reply`, { reply }).then((r) => r.data);
export const getPaymentMessages = (order_id: string) =>
  client.get<{ messages: any[] }>(`${API}/payments/${order_id}/messages`).then((r) => r.data);

/* ── Admin: Password Reset Requests ─────────────── */
export const adminListPasswordResets = (status = 'pending', bypass = false) =>
  client.get<{ items: any[]; counts: Record<string, number> }>(`${ADMIN}/admin/password-resets`, { params: { status }, ttl: _ADMIN_TTL, bypassCache: bypass } as any).then((r) => r.data);
export const adminApprovePasswordReset = (resetId: string) =>
  client.post(`${ADMIN}/admin/password-resets/${resetId}/approve`).then((r) => r.data);
export const adminRejectPasswordReset = (resetId: string) =>
  client.post(`${ADMIN}/admin/password-resets/${resetId}/reject`).then((r) => r.data);

/* ── Admin: Contact Permission Settings ─────────────── */
export const getContactSettings = () =>
  client.get<{ require_payment: boolean }>(`${ADMIN}/admin/settings/contact`).then((r) => r.data);
export const updateContactSettings = (require_payment: boolean) =>
  client.put<{ ok: boolean; require_payment: boolean }>(`${ADMIN}/admin/settings/contact`, { require_payment }).then((r) => r.data);
export const toggleUserContact = (user_id: string) =>
  client.patch<{ ok: boolean; contact_enabled: boolean }>(`${ADMIN}/admin/users/${user_id}/contact-toggle`).then((r) => r.data);

/* ── Notifications center ────────────────────────── */
export interface AppNotification {
  notification_id: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  created_at: string;
}
export const getNotifications = (limit = 50, bypassCache = false) =>
  client.get<{ total: number; notifications: AppNotification[] }>(`${API}/notifications`, { params: { limit }, bypassCache } as any).then((r) => r.data);
export const getUnreadCount = (bypassCache = false) =>
  client.get<{ unread: number }>(`${API}/notifications/unread-count`, { bypassCache } as any).then((r) => r.data);
export const markAllNotificationsRead = () =>
  client.post(`${API}/notifications/read-all`).then((r) => r.data);
export const markNotificationRead = (notification_id: string) =>
  client.post(`${API}/notifications/${notification_id}/read`).then((r) => r.data);

/* ── Admin announcements (matangazo) ─────────────── */
export interface Announcement {
  announcement_id: string;
  title: string;
  message: string;
  audience: string;
  created_by_name?: string;
  created_at: string;
  recipient_count?: number;
  dismissed?: boolean;
}
export const sendAnnouncement = (body: { title: string; message: string; audience: string; target_user_id?: string }) =>
  client.post(`${API}/admin/announcements`, body).then((r) => r.data);
export const getActiveAnnouncements = (bypassCache = false) =>
  client.get<{ count: number; announcements: Announcement[] }>(`${API}/announcements/active`, { bypassCache } as any).then((r) => r.data);
export const getAnnouncementUnread = (bypassCache = false) =>
  client.get<{ unread: number }>(`${API}/announcements/unread-count`, { bypassCache } as any).then((r) => r.data);
export const dismissAnnouncement = (announcement_id: string) =>
  client.post(`${API}/announcements/${announcement_id}/dismiss`).then((r) => r.data);
export const adminListAnnouncements = () =>
  client.get<{ total: number; announcements: any[] }>(`${API}/admin/announcements`).then((r) => r.data);
export const adminResendAnnouncement = (announcement_id: string) =>
  client.post<{ announcement_id: string; sent_to: number }>(`${API}/admin/announcements/${announcement_id}/resend`).then((r) => r.data);
export const adminDeleteAnnouncement = (announcement_id: string) =>
  client.delete<{ ok: boolean }>(`${API}/admin/announcements/${announcement_id}`).then((r) => r.data);

export const MSG_WS_URL = () => WS_URL;
