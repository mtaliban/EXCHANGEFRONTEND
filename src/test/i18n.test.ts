import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useI18n, useT } from '@/lib/i18n';

beforeEach(() => {
  useI18n.setState({ lang: 'sw' });
  localStorage.clear();
});

describe('useI18n / useT', () => {
  it('defaults to Kiswahili', () => {
    const { result } = renderHook(() => useT());
    expect(result.current('nav.dashboard')).toBe('Dashibodi');
  });

  it('falls back to the key when missing', () => {
    const { result } = renderHook(() => useT());
    expect(result.current('does.not.exist')).toBe('does.not.exist');
    expect(result.current('does.not.exist', 'Fallback')).toBe('Fallback');
  });

  it('toggles language and translates', () => {
    const { result, rerender } = renderHook(() => useT());

    expect(result.current('nav.dashboard')).toBe('Dashibodi');

    act(() => useI18n.getState().toggle());
    rerender();

    expect(result.current('nav.dashboard')).toBe('Dashboard');
    expect(result.current('nav.users')).toBe('Users');
  });

  it('setLang switches explicitly', () => {
    const { result, rerender } = renderHook(() => useT());

    act(() => useI18n.getState().setLang('en'));
    rerender();

    expect(result.current('action.save')).toBe('Save');
    expect(result.current('action.delete')).toBe('Delete');
  });

  it('persists the chosen language', () => {
    act(() => useI18n.getState().setLang('en'));
    expect(JSON.parse(localStorage.getItem('kv_lang') || '{}')?.state?.lang).toBe('en');
  });
});
