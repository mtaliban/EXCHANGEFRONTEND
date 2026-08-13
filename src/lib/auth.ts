'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface AuthUser {
  user_id: string;
  full_name: string;
  phone_primary: string;
  category?: 'health' | 'education';
  cadre_code?: string;
  cadre_display?: string;
  current_station?: any;
  desired_destinations?: any[];
  subjects?: string[];
  email?: string | null;
  email_verified?: boolean;
  is_admin?: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

/**
 * Checks whether a JWT token has expired (decodes the `exp` claim client-side).
 * Treats malformed/missing tokens as expired so the UI never shows a
 * logged-in state for a session the backend would reject.
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    if (!payload || typeof payload.exp !== 'number') return true;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'kv_auth',
      // ⚠️ SECURITY: sessionStorage (sio localStorage) — session inaishi kwenye
      // TAB HII TU. Kufungua tab mpya au browser nyingine → hakuna token →
      // unapelekwa login. (localStorage inaweza kurithishwa kwa tab nyingine
      // na kudumu hata browser ikiingizwa upya — hiyo ndiyo hatari.)
      storage: createJSONStorage(() => sessionStorage),
      // On app load, wipe stale/expired sessions so a dead token never leaves
      // the navbar showing "Fungua Dashibodi" for a session that is over.
      onRehydrateStorage: () => (state) => {
        if (state?.token && isTokenExpired(state.token)) {
          state.logout();
        }
      },
    }
  )
);
