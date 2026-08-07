import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL!;
const AUTH = API;
const USER = API;
const LOC = API;
const MATCH = API;
const MSG = API;
const ADMIN = API;

const client = axios.create({ timeout: 20000 });

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
  client.get<Region[]>(`${LOC}/locations/regions`).then((r) => r.data);
export const getDistricts = (regionId: number) =>
  client.get<District[]>(`${LOC}/locations/regions/${regionId}/districts`).then((r) => r.data);
export const getFacilities = (
  districtId: number,
  category: 'health' | 'education',
  level?: 'Primary' | 'Secondary',
  q?: string
) => {
  const params: any = { category };
  if (level) params.level = level;
  if (q) params.q = q;
  return client.get<Facility[]>(`${LOC}/locations/districts/${districtId}/facilities`, { params }).then((r) => r.data);
};
export const getCadres = (category?: 'health' | 'education') =>
  client.get<Cadre[]>(`${LOC}/cadres`, { params: category ? { category } : undefined }).then((r) => r.data);
export const getSubjects = () =>
  client.get<Subject[]>(`${LOC}/cadres/subjects`).then((r) => r.data);

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
  access_token: string;
  token_type: string;
}
export const register = (body: RegisterPayload) =>
  client.post<AuthResponse>(`${AUTH}/auth/register`, body).then((r) => r.data);
export const login = (phone: string, password: string) =>
  client.post<AuthResponse>(`${AUTH}/auth/login`, { phone, password }).then((r) => r.data);
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
}
export const listConversations = () =>
  client.get<Conversation[]>(`${MSG}/messages/conversations`).then((r) => r.data);
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

/* ── Admin ────────────────────────────────────────── */
export const adminStats = () => client.get(`${ADMIN}/admin/stats`).then((r) => r.data);
export const adminUsers = (params?: any) =>
  client.get(`${ADMIN}/admin/users`, { params }).then((r) => r.data);
export const adminMatches = (limit = 100) =>
  client.get(`${ADMIN}/admin/matches`, { params: { limit } }).then((r) => r.data);
export const adminEvents = (event_type?: string, limit = 100) =>
  client.get(`${ADMIN}/admin/events`, { params: { event_type, limit } }).then((r) => r.data);
export const adminGrant = (user_id: string) =>
  client.post(`${ADMIN}/admin/users/${user_id}/grant-admin`).then((r) => r.data);
export const adminRevoke = (user_id: string) =>
  client.post(`${ADMIN}/admin/users/${user_id}/revoke-admin`).then((r) => r.data);
export const adminUpdateUser = (user_id: string, changes: any) =>
  client.patch(`${ADMIN}/admin/users/${user_id}`, changes).then((r) => r.data);
export const adminDeleteUser = (user_id: string) =>
  client.delete(`${ADMIN}/admin/users/${user_id}`).then((r) => r.data);

export const MQTT_WS_URL = process.env.NEXT_PUBLIC_MQTT_WS || 'ws://localhost:9001';
export const MSG_WS_URL = () => `${API.replace(/^http/, 'ws')}/ws`;
