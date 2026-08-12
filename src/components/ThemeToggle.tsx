'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';

/** Dark/Light toggle — sun/moon icon button. */
export default function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      className="p-1.5 rounded-md text-base leading-none transition hover:bg-brand-grey-100 dark:hover:bg-brand-grey-200/60"
      title={isDark ? 'Badilisha kuwa Light mode' : 'Badilisha kuwa Dark mode'}
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun size={18} strokeWidth={2.2} /> : <Moon size={18} strokeWidth={2.2} />}
    </button>
  );
}
