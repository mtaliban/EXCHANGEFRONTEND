'use client';

import { useEffect } from 'react';
import { useTheme, applyTheme } from '@/lib/theme';

/** Applies the persisted theme on <html> once mounted. Add near the root layout. */
export default function ThemeInit() {
  const theme = useTheme((s) => s.theme);
  useEffect(() => { applyTheme(theme); }, [theme]);
  return null;
}
