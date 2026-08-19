'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getMe } from '@/lib/api';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';

/**
 * Optimistic auth: if we have token+user in the store, render children immediately.
 * We refresh user info from the API once per session in the background.
 * If the refresh 401s, we log out.
 *
 * IMPORTANT: Wait for localStorage rehydration before redirecting.
 * Without this, a page refresh briefly sees token=null (before rehydration)
 * and redirects to /login — even though the token exists in localStorage.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const t = useT();
  const router = useRouter();
  const { token, user, setUser, logout } = useAuth();
  const verifiedRef = useRef(false);
  const [hydrated, setHydrated] = useState(() => useAuth.persist.hasHydrated());

  // Wait for localStorage rehydration before checking auth
  useEffect(() => {
    if (useAuth.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useAuth.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  // Redirect only if truly no credentials (after hydration)
  useEffect(() => {
    if (!hydrated || token) return;
    const path = window.location.pathname;
    // Don't save /login as return URL (causes redirect loop)
    if (path && path !== '/login' && path !== '/register' && path !== '/forgot-password' && path !== '/reset-password') {
      try { sessionStorage.setItem('kv_return_to', path); } catch {}
    }
    router.replace('/login');
  }, [hydrated, token, router]);

  // Background refresh (once per session)
  useEffect(() => {
    if (!token || verifiedRef.current) return;
    verifiedRef.current = true;
    getMe()
      .then((me) => setUser(me))
      .catch(() => {
        verifiedRef.current = false;
        logout();
        router.replace('/login');
      });
  }, [token, setUser, logout, router]);

  // Show spinner while hydration is in progress — NOT a redirect
  if (!hydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner label={t('msg.loading')} />
      </div>
    );
  }

  // Only block the render if we truly have nothing yet (after hydration)
  if (!token) return null;
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner label={t('msg.loading')} />
      </div>
    );
  }

  return <>{children}</>;
}
