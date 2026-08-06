'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getMe } from '@/lib/api';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, user, setUser, logout } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        const me = await getMe();
        if (!cancelled) {
          setUser(me);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          logout();
          router.replace('/login');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token, router, setUser, logout]);

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-brand-grey-500">Inapakia...</div>
      </div>
    );
  }
  return <>{children}</>;
}
