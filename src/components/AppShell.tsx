'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth';
import { useI18n, useT } from '@/lib/i18n';
import { useLive } from '@/lib/liveSocket';
import { getInitial } from '@/lib/initials';
import {
  BarChart3, Crown, Database, Heart, Languages, LayoutDashboard,
  LogOut, Megaphone as MegaphoneIcon, User, Users, Wallet, Zap,
} from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const t = useT();

  const isAdmin = (user as any)?.is_admin;

  const links = isAdmin
    ? [
        { href: '/admin', label: t('nav.admin'), icon: Crown },
        { href: '/admin/users', label: t('nav.users'), icon: Users },
        { href: '/admin/data', label: t('nav.data'), icon: Database },
        { href: '/admin/announcements', label: t('nav.announcements'), icon: MegaphoneIcon },
        { href: '/admin/payments', label: t('nav.payments'), icon: Wallet },
        { href: '/admin/events', label: t('nav.events'), icon: Zap },
        { href: '/admin/reports', label: t('nav.reports'), icon: BarChart3 },
        { href: '/profile', label: t('nav.profile'), icon: User },
      ]
    : [
        { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { href: '/profile', label: t('nav.profile'), icon: User },
        { href: '/donate', label: t('nav.donate'), icon: Heart },
      ];

  function doLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-brand-grey-50">
      {/* ═══ MOBILE TOP BAR (md:hidden) — compact, sticky ═══ */}
      <div className="md:hidden sticky top-0 z-40 bg-white dark:bg-brand-grey-950 border-b border-brand-grey-100 dark:border-brand-grey-700 shadow-sm">
        <div className="flex items-center justify-between gap-1 px-3 h-14">
          <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2 flex-shrink-0 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              KV
            </div>
            <span className="font-bold text-sm text-brand-grey-900 dark:text-white truncate hidden min-[360px]:inline">
              {isAdmin ? 'Statistics' : 'Kubadilishana'}
            </span>
          </Link>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <LangToggle />
            <AvatarMenu name={user?.full_name} onLogout={doLogout} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
        {/* ═══ DESKTOP SIDEBAR (hidden kwenye simu) ═══ */}
        <aside className="hidden md:block md:w-64 md:min-h-screen md:sticky md:top-0 bg-white border-r border-brand-grey-100">
          <div className="p-4 border-b border-brand-grey-100">
            <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold text-sm">
                KV
              </div>
              <span className="font-bold text-sm text-brand-grey-900 dark:text-white">
                {isAdmin ? 'Statistics' : 'Kubadilishana'}
              </span>
            </Link>
            {/* Toolbar: WS status + language switcher (badilisha lugha) */}
            <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
              <WsStatus />
              <LangToggle />
            </div>
          </div>

          <nav className="p-2 flex md:flex-col overflow-x-auto md:overflow-visible">
            {links.map((l) => {
              const active = pathname === l.href || (l.href !== '/admin' && pathname?.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition',
                    active
                      ? 'bg-brand-blue-50 text-brand-blue dark:bg-brand-blue-100/40'
                      : 'text-brand-grey-700 dark:text-brand-grey-300 hover:bg-brand-grey-50 dark:hover:bg-brand-grey-200/60'
                  )}
                >
                  <l.icon size={18} strokeWidth={2.2} className="flex-shrink-0" />
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t mt-auto border-brand-grey-100">
            {user && (
              <>
                <div className="text-sm font-semibold truncate text-brand-grey-900 dark:text-white">
                  {user.full_name} {isAdmin && '👑'}
                </div>
                <div className="text-xs truncate text-brand-grey-500 dark:text-brand-grey-400">
                  {user.phone_primary}
                </div>
                {!isAdmin && user.cadre_display && (
                  <div className="text-xs text-brand-blue mt-1 truncate">{user.cadre_display}</div>
                )}
                <button
                  onClick={doLogout}
                  className="mt-3 w-full flex items-center justify-center gap-2 text-xs border rounded-lg px-2 py-1.5 border-brand-red text-brand-red hover:bg-brand-red hover:text-white transition"
                  title={t('nav.logout')}
                >
                  <LogOut size={14} />
                  {t('nav.logout')}
                </button>
              </>
            )}
          </div>
        </aside>

        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* ═══ MOBILE BOTTOM NAV (md:hidden) — kama app ya simu ═══ */}
      <MobileBottomNav pathname={pathname} isAdmin={isAdmin} />
    </div>
  );
}

/** Bottom navigation — mobile app style: icons + labels, safe-area aware. */
function MobileBottomNav({ pathname, isAdmin }: {
  pathname: string | null;
  isAdmin?: boolean;
}) {
  const t = useT();
  // Chagua tabs muhimu zaidi (5 max) kwa simu — sidebar ina zote kwa desktop
  const mobileLinks = isAdmin
    ? [
        { href: '/admin', label: t('nav.admin'), icon: Crown },
        { href: '/admin/users', label: t('nav.users'), icon: Users },
        { href: '/admin/data', label: t('nav.data'), icon: Database },
        { href: '/admin/events', label: t('nav.events'), icon: Zap },
        { href: '/profile', label: t('nav.profile'), icon: User },
      ]
    : [
        { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { href: '/donate', label: t('nav.donate'), icon: Heart },
        { href: '/profile', label: t('nav.profile'), icon: User },
      ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-brand-grey-950 border-t border-brand-grey-100 dark:border-brand-grey-700 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Mobile navigation"
    >
          <div className="flex items-stretch justify-around">
        {mobileLinks.map((l) => {
          const active = pathname === l.href || (l.href !== '/admin' && pathname?.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[56px] px-0.5 transition min-w-0',
                active
                  ? 'text-brand-blue'
                  : 'text-brand-grey-500 dark:text-brand-grey-400'
              )}
            >
              <l.icon size={21} strokeWidth={active ? 2.4 : 2} className="flex-shrink-0" />
              <span className={clsx('text-[10px] font-semibold leading-tight text-center truncate w-full max-w-full px-0.5', active && 'font-bold')}>{l.label}</span>
              {active && <span className="w-4 h-0.5 rounded-full bg-brand-blue mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Avatar + menu ya user (mobile) — jina, simu, kada, logout. */
function AvatarMenu({ name, onLogout }: { name?: string; onLogout: () => void }) {
  const t = useT();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const initial = getInitial(name);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition bg-brand-blue-50 text-brand-blue hover:bg-brand-blue-100"
        aria-label="Menu ya akaunti"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 max-w-[calc(100vw-1rem)] rounded-xl border border-brand-grey-100 dark:border-brand-grey-700 bg-white dark:bg-brand-grey-900 shadow-xl z-50 p-3 space-y-1">
          <div className="text-sm font-bold text-brand-grey-900 dark:text-white truncate">
            {user?.full_name || name}
          </div>
          <div className="text-xs text-brand-grey-500 dark:text-brand-grey-400 truncate">{user?.phone_primary}</div>
          {!((user as any)?.is_admin) && user?.cadre_display && (
            <div className="text-xs text-brand-blue truncate">{user.cadre_display}</div>
          )}
          <div className="border-t border-brand-grey-100 dark:border-brand-grey-700 pt-1 mt-1 space-y-0.5">
            <Link href="/profile" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-brand-grey-700 dark:text-brand-grey-300 hover:bg-brand-grey-50 dark:hover:bg-brand-grey-800 transition">
              <User size={16} /> {t('nav.profile')}
            </Link>
            <button onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-brand-red hover:bg-brand-red-50 dark:hover:bg-brand-red-900/20 transition">
              <LogOut size={16} /> {t('nav.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Always-visible real-time (WebSocket) status pill — kila page. */
function WsStatus() {
  const connected = useLive((s) => s.connected);
  return (
    <span
      className={clsx(
        'flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border transition',
        connected
          ? 'bg-green-100 border-green-300 text-green-700'
          : 'bg-brand-grey-100 border-brand-grey-200 text-brand-grey-500'
      )}
      title={connected
        ? 'WebSocket LIVE — chat, matangazo na arifa ni real-time'
        : 'WebSocket haijaunganishwa — kagua muunganisho'}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', connected ? 'bg-green-500 animate-pulse' : 'bg-current')} />
      {connected ? 'LIVE' : 'OFFLINE'}
    </span>
  );
}

/** Language switcher — BUTTONS MBILI WAZI: "Kiswahili" na "English".
 *  Kila moja inaweka lugha yake MOJA KWA MOJA (setLang) — hakuna toggle
 *  inayoweza kuchanganya. Inayotumika sasa inaonekana wazi (rangi). */
function LangToggle() {
  const currentLang = useI18n((s) => s.lang);
  const setLang = useI18n((s) => s.setLang);
  return (
    <div className="flex items-center gap-1 rounded-lg border border-brand-blue/30 p-0.5 flex-shrink-0" title="Badilisha lugha / Switch language">
      <button
        onClick={() => setLang('sw')}
        aria-pressed={currentLang === 'sw'}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition ${
          currentLang === 'sw' ? 'bg-brand-blue text-white' : 'text-brand-blue hover:bg-brand-blue-50'
        }`}
      >
        🇹🇿 Kiswahili
      </button>
      <button
        onClick={() => setLang('en')}
        aria-pressed={currentLang === 'en'}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition ${
          currentLang === 'en' ? 'bg-brand-blue text-white' : 'text-brand-blue hover:bg-brand-blue-50'
        }`}
      >
        🇬🇧 English
      </button>
    </div>
  );
}


