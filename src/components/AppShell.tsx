'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth';
import { useI18n, useT } from '@/lib/i18n';
import { useUnreadStore } from '@/lib/unreadStore';
import { useLive } from '@/lib/liveSocket';
import { getInitial } from '@/lib/initials';
import { ConfirmHost } from '@/components/confirm';
import {
  BarChart3, Bell, Crown, Database, HandCoins, KeyRound, LayoutDashboard,
  LogOut, Megaphone as MegaphoneIcon, ClipboardList, Menu, User, Users, Wallet, Zap,
} from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const t = useT();
  const routeCounts = useUnreadStore((s) => s.counts);
  const clearRoute = useUnreadStore((s) => s.clear);

  const isAdmin = (user as any)?.is_admin;

  // Clear badge ya route unayofungua
  useEffect(() => {
    if (pathname && routeCounts[pathname] > 0) clearRoute(pathname);
  }, [pathname, routeCounts, clearRoute]);

  const links = isAdmin
    ? [
        { href: '/admin', label: t('nav.admin'), icon: Crown },
        { href: '/admin/users', label: t('nav.users'), icon: Users },
        { href: '/admin/data', label: t('nav.data'), icon: Database },
        { href: '/admin/announcements', label: t('nav.announcements'), icon: MegaphoneIcon },
        { href: '/admin/payments', label: t('nav.payments'), icon: Wallet },
        { href: '/admin/events', label: t('nav.events'), icon: Zap },
        { href: '/admin/reports', label: t('nav.reports'), icon: BarChart3 },
        { href: '/admin/password-resets', label: 'Password Resets', icon: KeyRound },
        { href: '/admin/feedback', label: t('nav.feedback'), icon: ClipboardList },
        { href: '/profile', label: t('nav.profile'), icon: User },
      ]
    : [
        { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { href: '/donate', label: t('nav.donate'), icon: HandCoins },
        { href: '/feedback', label: t('nav.feedback'), icon: ClipboardList },
        { href: '/profile', label: t('nav.profile'), icon: User },
      ];

  function doLogout() {
    logout();
    router.replace('/login');
  }

  // Load unread count mara ya kwanza
  useEffect(() => { useUnreadStore.getState().refresh(); }, []);

  return (
    <div className="min-h-screen bg-brand-grey-50">
      {/* ═══ MOBILE TOP BAR (md:hidden) — FIXED, haipandi yote ═══ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-brand-grey-950 border-b border-brand-grey-100 dark:border-brand-grey-700 shadow-sm"
        style={{ WebkitTransform: 'translate3d(0,0,0)', transform: 'translate3d(0,0,0)', WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}>
        <div className="flex items-center justify-between gap-1 px-3 h-14">
          <MobileTopBar links={links} user={user} onLogout={doLogout} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
        {/* ═══ DESKTOP SIDEBAR (hidden kwenye simu) ═══ */}
        <aside className="hidden md:block md:w-64 md:min-h-screen md:sticky md:top-0 bg-white border-r border-brand-grey-100">
          <div className="p-4 border-b border-brand-grey-100">
            {/* Toolbar: WS status + language switcher (badilisha lugha) */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <WsStatus />
              <LangToggle />
            </div>
          </div>

          <nav className="p-2 flex md:flex-col overflow-x-auto md:overflow-visible">
            {links.map((l) => {
              const active = pathname === l.href || (l.href !== '/admin' && pathname?.startsWith(l.href));
              const badge = routeCounts[l.href] || 0;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out',
                    active
                      ? 'bg-brand-blue-50 text-brand-blue dark:bg-brand-blue-100/40'
                      : 'text-brand-grey-700 dark:text-brand-grey-300 hover:bg-brand-grey-50 dark:hover:bg-brand-grey-200/60'
                  )}
                >
                  <l.icon size={18} strokeWidth={2.2} className="flex-shrink-0" />
                  <span>{l.label}</span>
                  {badge > 0 && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t mt-auto border-brand-grey-100">
            {user && (
              <>
                <div className="text-sm font-semibold truncate text-brand-grey-900 dark:text-white">
                  {user.full_name}
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

        <main className="flex-1 min-w-0 pt-14 md:pt-0 pb-20 md:pb-0 page-enter">
          {children}
        </main>
      </div>

      {/* ═══ MOBILE BOTTOM NAV (md:hidden) — kama app ya simu ═══ */}
      <MobileBottomNav pathname={pathname} isAdmin={isAdmin} />
      {/* Confirm dialog ya KISOMI (badala ya confirm() ya kizamani) */}
      <ConfirmHost />
    </div>
  );
}

/** MOBILE TOP BAR — Hamburger (kushoto) + avatar (kulia) + dropdown menus */
function MobileTopBar({ links, user, onLogout }: {
  links: { href: string; label: string; icon: any }[];
  user: any;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const t = useT();
  const initial = getInitial(user?.full_name);
  const routeCounts = useUnreadStore((s) => s.counts);

  // Funga dropdown zote
  const closeAll = () => { setMenuOpen(false); setProfileOpen(false); };

  return (
    <>
      {/* ═══ LEFT: Hamburger icon — bofya = dropdown menu ═══ */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => { setProfileOpen(false); setMenuOpen((v) => !v); }}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-grey-100 dark:bg-brand-grey-800 text-brand-grey-700 dark:text-brand-grey-200 hover:bg-brand-grey-200 dark:hover:bg-brand-grey-700 transition"
          aria-label={t('nav.menu')}
        >
          <Menu size={22} strokeWidth={2.2} />
        </button>

        {/* Dropdown menu — links ZOTE kama za chini */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-[99]" onClick={closeAll} />
            <div className="absolute left-0 top-full mt-1 z-[100] w-56 bg-white dark:bg-brand-grey-900 rounded-xl shadow-xl border border-brand-grey-100 dark:border-brand-grey-700 py-1 animate-slide-in transition-all duration-200">
              {links.map((l) => {
                const active = pathname === l.href || (l.href !== '/admin' && pathname?.startsWith(l.href));
                const badge = routeCounts[l.href] || 0;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={closeAll}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition',
                      active
                        ? 'bg-brand-blue-50 text-brand-blue dark:bg-brand-blue-100/40'
                        : 'text-brand-grey-700 dark:text-brand-grey-300 hover:bg-brand-grey-50 dark:hover:bg-brand-grey-800'
                    )}
                  >
                    <l.icon size={18} strokeWidth={2.2} className="flex-shrink-0" />
                    <span className="truncate">{l.label}</span>
                    {badge > 0 && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ═══ CENTER: tupu — jina limeondolewa ═══ */}
      <div className="flex-1" />

      {/* ═══ RIGHT: Avatar + Language toggle ═══ */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => { setMenuOpen(false); setProfileOpen((v) => !v); }}
          className="w-8 h-8 rounded-full bg-brand-grey-100 dark:bg-brand-grey-800 border border-brand-grey-300 dark:border-brand-grey-600 flex items-center justify-center text-xs font-bold text-brand-grey-900 dark:text-white flex-shrink-0"
          aria-label="Profile"
        >
          {initial}
        </button>
        <LangToggle />
      </div>

      {/* ═══ Profile dropdown — bofya avatar ═══ */}
      {profileOpen && (
        <>
          <div className="fixed inset-0 z-[99]" onClick={closeAll} />
          <div className="absolute right-0 top-full mt-1 z-[100] w-52 bg-white dark:bg-brand-grey-900 rounded-xl shadow-xl border border-brand-grey-100 dark:border-brand-grey-700 py-1 animate-slide-in">
            <Link
              href="/profile"
              onClick={closeAll}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-brand-grey-700 dark:text-brand-grey-300 hover:bg-brand-grey-50 dark:hover:bg-brand-grey-800 transition"
            >
              <User size={18} strokeWidth={2.2} />
              <span>{t('nav.profile')}</span>
            </Link>
            <button
              onClick={() => { closeAll(); onLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-brand-red hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <LogOut size={18} strokeWidth={2.2} />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}


/** Bottom navigation — mobile app style: icons + labels, safe-area aware. */
function MobileBottomNav({ pathname, isAdmin }: {
  pathname: string | null;
  isAdmin?: boolean;
}) {
  const t = useT();
  const routeCounts = useUnreadStore((s) => s.counts);
  const clearRoute = useUnreadStore((s) => s.clear);

  // Clear badge ya route unayofungua
  useEffect(() => {
    if (pathname && routeCounts[pathname] > 0) clearRoute(pathname);
  }, [pathname, routeCounts, clearRoute]);
  // Admin: links muhimu zaidi kwa simu (max 5) — zaidi ziko drawer
  const mobileLinks = isAdmin
    ? [
        { href: '/admin', label: t('nav.admin'), icon: Crown },
        { href: '/admin/users', label: t('nav.users'), icon: Users },
        { href: '/admin/data', label: t('nav.data'), icon: Database },
        { href: '/admin/payments', label: t('nav.payments'), icon: Wallet },
        { href: '/admin/feedback', label: t('nav.feedback_short', 'Maoni'), icon: ClipboardList },
      ]
    : [
        { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { href: '/donate', label: t('nav.donate'), icon: HandCoins },
        { href: '/feedback', label: t('nav.feedback_short', 'Maoni'), icon: ClipboardList },
        { href: '/profile', label: t('nav.profile'), icon: User },
      ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-brand-grey-950 border-t border-brand-grey-100 dark:border-brand-grey-700 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', WebkitTransform: 'translate3d(0,0,0)', transform: 'translate3d(0,0,0)', WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}
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
                'flex-1 flex flex-col items-center justify-center gap-0 py-1 min-h-[52px] px-0 transition min-w-0',
                active
                  ? 'text-brand-blue'
                  : 'text-brand-grey-500 dark:text-brand-grey-400'
              )}
            >
              <div className="relative transition-transform duration-200 ease-out">
                <l.icon size={20} strokeWidth={active ? 2.4 : 2} className="flex-shrink-0 transition-all duration-200" />
                {(routeCounts[l.href] || 0) > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-brand-red text-white text-[8px] font-bold flex items-center justify-center">
                    {routeCounts[l.href] > 9 ? '9+' : routeCounts[l.href]}
                  </span>
                )}
              </div>
              <span className={clsx('text-[9px] font-semibold leading-tight text-center truncate w-full max-w-full px-0.5 mt-0.5 transition-colors duration-200', active && 'font-bold')}>{l.label}</span>
              {active && <span className="w-3 h-0.5 rounded-full bg-brand-blue mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
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

/** Language switcher — ndogo: SW / EN tu bila flags, isijifiche jina */
function LangToggle() {
  const currentLang = useI18n((s) => s.lang);
  const setLang = useI18n((s) => s.setLang);
  return (
    <div className="flex items-center rounded-lg border border-brand-blue/20 flex-shrink-0" title="Badilisha lugha">
      <button
        onClick={() => setLang('sw')}
        aria-pressed={currentLang === 'sw'}
        className={`px-2 py-1 rounded-l-lg text-[10px] font-bold transition ${
          currentLang === 'sw' ? 'bg-brand-blue text-white' : 'text-brand-blue hover:bg-brand-blue-50'
        }`}
      >
        SW
      </button>
      <button
        onClick={() => setLang('en')}
        aria-pressed={currentLang === 'en'}
        className={`px-2 py-1 rounded-r-lg text-[10px] font-bold transition ${
          currentLang === 'en' ? 'bg-brand-blue text-white' : 'text-brand-blue hover:bg-brand-blue-50'
        }`}
      >
        EN
      </button>
    </div>
  );
}


