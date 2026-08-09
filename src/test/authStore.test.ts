import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useAuth } from '@/lib/auth';

const USER = {
  user_id: '507f1f77bcf86cd799439011',
  full_name: 'Kieffer Madyedye',
  phone_primary: '+255712345678',
  category: 'health' as const,
  cadre_code: 'CO',
};

beforeEach(() => {
  useAuth.setState({ token: null, user: null });
  localStorage.clear();
});

describe('useAuth store', () => {
  it('starts logged out', () => {
    expect(useAuth.getState().token).toBeNull();
    expect(useAuth.getState().user).toBeNull();
  });

  it('setAuth stores token and user', () => {
    act(() => useAuth.getState().setAuth('jwt-token-123', USER));
    const s = useAuth.getState();
    expect(s.token).toBe('jwt-token-123');
    expect(s.user?.full_name).toBe('Kieffer Madyedye');
  });

  it('setUser refreshes the profile', () => {
    act(() => useAuth.getState().setAuth('t', USER));
    act(() =>
      useAuth.getState().setUser({ ...USER, cadre_display: 'Clinical Officer' })
    );
    expect(useAuth.getState().user?.cadre_display).toBe('Clinical Officer');
  });

  it('logout clears credentials', () => {
    act(() => useAuth.getState().setAuth('jwt-token-123', USER));
    act(() => useAuth.getState().logout());
    expect(useAuth.getState().token).toBeNull();
    expect(useAuth.getState().user).toBeNull();
  });

  it('persists auth to localStorage', () => {
    act(() => useAuth.getState().setAuth('persisted-token', USER));
    const stored = JSON.parse(localStorage.getItem('kv_auth') || '{}');
    expect(stored?.state?.token).toBe('persisted-token');
  });
});
