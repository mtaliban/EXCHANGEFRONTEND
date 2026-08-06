'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getMe } from '@/lib/api';

/**
 * Optimistic auth: if we have token+user in the store, render children immediately.
 * We refresh user info from the API once per session in the background.
 * If the refresh 401s, we log out.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, user, setUser, logout } = useAuth();
  const verifiedRef = useRef(false);

  // Redirect only if truly no credentials (not on every navigation)
  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

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

  // Only block the render if we truly have nothing yet
  if (!token) return null;
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-brand-grey-500 text-sm">Inapakia...</div>
      </div>
    );
  }

  return <>{children}</>;
}
