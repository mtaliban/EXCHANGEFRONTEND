'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  user_id: string;
  full_name: string;
  phone_primary: string;
  category?: 'health' | 'education';
  cadre_code?: string;
  cadre_display?: string;
  current_station?: any;
  desired_destinations?: any[];
  email?: string | null;
  email_verified?: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
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
    { name: 'kv_auth' }
  )
);
