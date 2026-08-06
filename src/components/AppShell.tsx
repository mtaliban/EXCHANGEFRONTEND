'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth';

const baseLinks = [
  { href: '/dashboard', label: 'Dashibodi', icon: '🏠' },
  { href: '/chats', label: 'Niliochart Nao', icon: '💬' },
  { href: '/contacts', label: 'Niliowasiliana Nao', icon: '📇' },
  { href: '/profile', label: 'Wasifu', icon: '👤' },
  { href: '/donate', label: 'Changia', icon: '💝' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const links = (user as any)?.is_admin
    ? [...baseLinks, { href: '/admin', label: 'Admin', icon: '👑' }]
    : baseLinks;

  return (
    <div className="min-h-screen bg-brand-grey-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="md:w-64 md:min-h-screen md:sticky md:top-0 bg-white border-r border-brand-grey-100">
          <div className="p-4 border-b border-brand-grey-100 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold text-sm">KV</div>
              <span className="font-bold text-brand-grey-900 text-sm">Kubadilishana</span>
            </Link>
          </div>

          <nav className="p-2 flex md:flex-col overflow-x-auto md:overflow-visible">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap',
                  pathname?.startsWith(l.href)
                    ? 'bg-brand-blue-50 text-brand-blue'
                    : 'text-brand-grey-700 hover:bg-brand-grey-50'
                )}
              >
                <span>{l.icon}</span>
                <span className="hidden md:inline">{l.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-3 border-t border-brand-grey-100 hidden md:block mt-auto">
            {user && (
              <>
                <div className="text-sm font-semibold text-brand-grey-900 truncate">{user.full_name}</div>
                <div className="text-xs text-brand-grey-500 truncate">{user.phone_primary}</div>
                {user.cadre_display && <div className="text-xs text-brand-blue mt-1 truncate">{user.cadre_display}</div>}
                <button
                  onClick={() => { logout(); router.replace('/login'); }}
                  className="mt-3 w-full text-xs text-brand-red border border-brand-red rounded-lg px-2 py-1.5 hover:bg-brand-red hover:text-white transition"
                >
                  Toka
                </button>
              </>
            )}
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
