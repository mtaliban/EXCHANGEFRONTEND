import AuthGuard from '@/components/AuthGuard';
import AppShell from '@/components/AppShell';
import LiveProvider from '@/components/LiveProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <LiveProvider>
        <AppShell>{children}</AppShell>
      </LiveProvider>
    </AuthGuard>
  );
}
