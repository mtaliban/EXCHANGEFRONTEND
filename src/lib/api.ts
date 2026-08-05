import axios from 'axios';

const AUTH = process.env.NEXT_PUBLIC_AUTH_API!;
const USER = process.env.NEXT_PUBLIC_USER_API!;
const LOC = process.env.NEXT_PUBLIC_LOCATION_API!;
const MATCH = process.env.NEXT_PUBLIC_MATCH_API!;

const client = axios.create({ timeout: 15000 });

client.interceptors.request.use((cfg) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('kv_token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

/* ── Location cascading dropdowns ───────────────────── */
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
  return client
    .get<Facility[]>(`${LOC}/locations/districts/${districtId}/facilities`, { params })
    .then((r) => r.data);
};

export const getCadres = (category?: 'health' | 'education') =>
  client
    .get<Cadre[]>(`${LOC}/cadres`, { params: category ? { category } : undefined })
    .then((r) => r.data);

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
export interface RegisterResponse {
  user_id: string;
  full_name: string;
  phone_primary: string;
  category: string;
  cadre_code: string;
  access_token: string;
  token_type: string;
}

export const register = (body: RegisterPayload) =>
  client.post<RegisterResponse>(`${AUTH}/auth/register`, body).then((r) => r.data);

export const login = (phone: string, password: string) =>
  client.post<RegisterResponse>(`${AUTH}/auth/login`, { phone, password }).then((r) => r.data);

export const checkPhone = (phone: string) =>
  client
    .get<{ available: boolean; phone_normalized?: string; reason?: string }>(
      `${AUTH}/auth/check-phone/${encodeURIComponent(phone)}`
    )
    .then((r) => r.data);

/* ── Profile ──────────────────────────────────────── */
export const getMe = () => client.get(`${USER}/users/me`).then((r) => r.data);
