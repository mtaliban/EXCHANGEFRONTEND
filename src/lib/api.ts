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
(client.get as any) = (url: string, config?: any) => {
  const key = url + '|' + JSON.stringify(config?.params || {});
  // config.ttl hufanya data tuli (mikoa/wilaya/vituo) ihifadhiwe siku nzima —
  // kurudi kwenye pages hakupigi API tena; pages zinajitokeza INSTANT.
  const ttl = config?.ttl ?? _GET_TTL;
  const isStatic = ttl === _STATIC_TTL;
  if (!config?.bypassCache) {
    const hit = _getCache.get(key);
    if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.data);
    if (isStatic) {
      // First fetch ipo kwenye localStorage? Tuma mara moja (hakuna spinner!).
      const saved = _lsRead(key);
      if (saved && Date.now() - saved.at < ttl) {
        const restored = { data: saved.payload };
        _getCache.set(key, { at: saved.at, data: restored });
        return Promise.resolve(restored);
      }
    }
  }
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
    return orig(...args);
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
export const getCadres = (category?: 'health' | 'education') =>
  client.get<Cadre[]>(`${LOC}/cadres`, { params: category ? { category } : undefined, ttl: _STATIC_TTL } as any).then((r) => r.data);
export const getSubjects = (level?: 'Primary' | 'Secondary') =>
  client.get<Subject[]>(`${LOC}/cadres/subjects`, { params: level ? { level } : undefined, ttl: _STATIC_TTL } as any).then((r) => r.data);

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
  category: 'health' | 'education';
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
  access_token: string;
  token_type: string;
}
export const register = (body: RegisterPayload) =>
  client.post<AuthResponse>(`${AUTH}/auth/register`, body).then((r) => r.data);
export const login = (identifier: string, password: string) =>
  client.post<AuthResponse>(`${AUTH}/auth/login`, { phone: identifier, password }).then((r) => r.data);
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
  limit?: number;
}, bypassCache = false) =>
  // TTL ndefu (45s): kurudi kwenye dashboard hakufetch DB kila mara — WS events
  // zinabust cache na kufetch fresh PAPO HAPO (data ya live haichemki).
  client.get<BoardStats>(`${MATCH}/matches/board`, { params, bypassCache, ttl: 45_000 } as any).then((r) => r.data);

export const getFollowedRegions = () =>
  client.get<{ region_ids: number[] }>(`${USER}/users/me/followed-regions`).then((r) => r.data);
export const updateFollowedRegions = (region_ids: number[]) =>
  client.put<{ region_ids: number[] }>(`${USER}/users/me/followed-regions`, { region_ids }).then((r) => r.data);

export const getMe = () => client.get(`${AUTH}/auth/me`).then((r) => r.data);
export const checkPhone = (phone: string) =>
  client.get<{ available: boolean; phone_normalized?: string; reason?: string }>(
    `${AUTH}/auth/check-phone/${encodeURIComponent(phone)}`
  ).then((r) => r.data);
export const forgotPassword = (phone: string) =>
  client.post(`${AUTH}/auth/forgot-password`, { phone }).then((r) => r.data);
export const resetPassword = (phone: string, code: string, new_password: string) =>
  client.post(`${AUTH}/auth/reset-password`, { phone, code, new_password }).then((r) => r.data);

/* ── Profile ──────────────────────────────────────── */
export const getMyProfile = () => client.get(`${USER}/users/me`).then((r) => r.data);
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

/* ── Messaging ───────────────────────────────────── */
export interface Conversation {
  conversation_id: string;
  with_user_id: string;
  with_full_name: string;
  with_phone?: string;
  with_cadre?: string;
  with_station?: any;
  last_message_at?: string;
  last_message_text?: string;
  last_message_from?: string;
  unread: number;
}
export interface ChatMessage {
  message_id: string;
  from_user_id: string;
  to_user_id: string;
  text: string;
  created_at: string;
  is_read: boolean;
  delivered_at?: string | null;
  read_at?: string | null;
}
export const listConversations = (bypassCache = false) =>
  client.get<Conversation[]>(`${MSG}/messages/conversations`, { bypassCache } as any).then((r) => r.data);
export const chatHistory = (otherUserId: string) =>
  client.get<{ conversation_id: string; messages: ChatMessage[] }>(`${MSG}/messages/with/${otherUserId}`).then((r) => r.data);
export const sendMessage = (to_user_id: string, text: string) =>
  client.post(`${MSG}/messages`, { to_user_id, text }).then((r) => r.data);
export const markRead = (otherUserId: string) =>
  client.post(`${MSG}/messages/mark-read/${otherUserId}`).then((r) => r.data);
export const logCall = (to_user_id: string, outcome: string = 'initiated') =>
  client.post(`${MSG}/messages/call`, { to_user_id, outcome }).then((r) => r.data);
export const listCalls = () =>
  client.get(`${MSG}/messages/calls`).then((r) => r.data);
export const listContacts = () =>
  client.get(`${MSG}/messages/contacts`).then((r) => r.data);
export const getContactStats = () =>
  client.get(`${MSG}/messages/contact-stats`).then((r) => r.data);
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

/* ── Admin: data management (masomo/kada/mikoa/wilaya) ── */
export const adminListSubjects = (level?: string, bypass = false) =>
  client.get(`${ADMIN}/admin/data/subjects`, { params: level ? { level } : {}, bypassCache: bypass } as any).then((r) => r.data);
export const adminAddSubject = (body: { code: string; name: string; level: string }) =>
  client.post(`${ADMIN}/admin/data/subjects`, body).then((r) => r.data);
export const adminUpdateSubject = (code: string, body: { code: string; name: string; level: string }) =>
  client.patch(`${ADMIN}/admin/data/subjects/${code}`, body).then((r) => r.data);
export const adminDeleteSubject = (code: string) =>
  client.delete(`${ADMIN}/admin/data/subjects/${code}`).then((r) => r.data);
export const adminListCadres = (category?: string) =>
  client.get(`${ADMIN}/admin/data/cadres`, { params: category ? { category } : {} }).then((r) => r.data);
export const adminAddCadre = (body: any) =>
  client.post(`${ADMIN}/admin/data/cadres`, body).then((r) => r.data);
export const adminUpdateCadre = (code: string, body: any) =>
  client.patch(`${ADMIN}/admin/data/cadres/${code}`, body).then((r) => r.data);
export const adminDeleteCadre = (code: string) =>
  client.delete(`${ADMIN}/admin/data/cadres/${code}`).then((r) => r.data);
export const adminListRegions = () =>
  client.get(`${ADMIN}/admin/data/regions`).then((r) => r.data);
export const adminAddRegion = (body: { id: number; name: string }) =>
  client.post(`${ADMIN}/admin/data/regions`, body).then((r) => r.data);
export const adminUpdateRegion = (id: number, body: { id: number; name: string }) =>
  client.patch(`${ADMIN}/admin/data/regions/${id}`, body).then((r) => r.data);
export const adminDeleteRegion = (id: number) =>
  client.delete(`${ADMIN}/admin/data/regions/${id}`).then((r) => r.data);
export const adminListDistricts = (region_id?: number, bypass = false) =>
  client.get(`${ADMIN}/admin/data/districts`, { params: region_id ? { region_id } : {}, bypassCache: bypass } as any).then((r) => r.data);
export const adminAddDistrict = (body: { id: number; region_id: number; name: string }) =>
  client.post(`${ADMIN}/admin/data/districts`, body).then((r) => r.data);
export const adminUpdateDistrict = (id: number, body: { id: number; region_id: number; name: string }) =>
  client.patch(`${ADMIN}/admin/data/districts/${id}`, body).then((r) => r.data);
export const adminDeleteDistrict = (id: number) =>
  client.delete(`${ADMIN}/admin/data/districts/${id}`).then((r) => r.data);

/* ── Admin: exports + cleanup ── */
export const adminEventsExport = (event_type?: string, fmt: 'csv' | 'xlsx' = 'csv') =>
  client.get(`${ADMIN}/admin/events/export`, { params: { event_type, fmt }, responseType: 'blob', bypassCache: true } as any);
export const adminReports = (days = 30) =>
  client.get(`${ADMIN}/admin/reports`, { params: { days }, ttl: 30_000 } as any).then((r) => r.data);
export const adminReportsExport = (fmt: 'csv' | 'xlsx' = 'csv') =>
  client.get(`${ADMIN}/admin/reports/export`, { params: { fmt }, responseType: 'blob', bypassCache: true } as any);
export const adminClearEvents = () =>
  client.post(`${ADMIN}/admin/events/clear`).then((r) => r.data);
export const adminCleanupTestData = () =>
  client.post(`${ADMIN}/admin/cleanup-test-data`).then((r) => r.data);

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

export const MSG_WS_URL = () => WS_URL;
