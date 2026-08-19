import AuthGuard from '@/components/AuthGuard';
import AppShell from '@/components/AppShell';
import LiveProvider from '@/components/LiveProvider';

// Force dynamic rendering — all (app) pages need auth + client-side stores
// (Zustand persist requires localStorage which is unavailable during SSR).
export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <LiveProvider>
        <AppShell>{children}</AppShell>
      </LiveProvider>
    </AuthGuard>
  );
}
