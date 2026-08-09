'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (t) => set({ theme: t }),
      toggle: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    { name: 'kv_theme' }
  )
);

/** Applies the current theme class on <html>; call once (e.g. in AppShell). */
export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  // brief global transition ONLY while switching (scoped in CSS, avoids jank)
  root.classList.add('theme-switching');
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  window.setTimeout(() => root.classList.remove('theme-switching'), 300);
}
