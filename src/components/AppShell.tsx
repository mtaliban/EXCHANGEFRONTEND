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
  BarChart3, Bell, Crown, Database, GitMerge, HandCoins, Heart, LayoutDashboard,
  LogOut, Megaphone as MegaphoneIcon, ClipboardList, Phone, User, Users, Wallet, Zap,
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
        { href: '/admin', label: t('nav.admin'), icon: BarChart3 },
        { href: '/admin/users', label: t('nav.users'), icon: Users },
        { href: '/admin/matches', label: t('nav.matches', 'Waliopata Wenzao'), icon: GitMerge },
        { href: '/admin/real-matches', label: t('nav.real_matches', 'Match za Kweli'), icon: Heart },
        { href: '/admin/data', label: t('nav.data'), icon: Database },
        { href: '/admin/announcements', label: t('nav.announcements'), icon: MegaphoneIcon },
        { href: '/admin/payments', label: t('nav.payments'), icon: Wallet },
        { href: '/admin/contacts', label: t('nav.contacts', 'Waliopigiana'), icon: Phone },
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

  // Load unread count mara ya kwanza + poll kila 30s (ili badges zipatikane
  // hata mtu akiwa offline na kurejea online)
  useEffect(() => {
    useUnreadStore.getState().refresh();
    const interval = setInterval(() => {
      useUnreadStore.getState().refresh();
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-brand-grey-50">
      {/* ═══ MOBILE TOP BAR (md:hidden) — FIXED, haipandi yote ═══ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-brand-grey-950 border-b border-brand-grey-100 dark:border-brand-grey-700"
        style={{ WebkitTransform: 'translate3d(0,0,0)', transform: 'translate3d(0,0,0)', WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}>
        <div className="flex items-center gap-2.5 px-4 h-[53px]">
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
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out active:scale-[0.97]',
                    active
                      ? 'text-brand-blue'
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

        <main className="flex-1 min-w-0 pt-[59px] md:pt-0 pb-20 md:pb-0 page-enter">
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

/** Jina la ukurasa linaloonekana pembeni ya ☰ */
const TITLES: Record<string, string> = {
  '/dashboard': 'Dashibodi',
  '/changia': 'Changia',
  '/maoni': 'Maoni na Malalamiko',
  '/wasifu': 'Wasifu',
  '/wasifu/hariri': 'Hariri Wasifu',
};

/** MOBILE TOP BAR — ☰ (kushoto) + jina la ukurasa + avatar na SW/EN (kulia) */
function MobileTopBar({ links, user, onLogout }: {
  links: { href: string; label: string; icon: any }[];
  user: any;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState<null | 'menu' | 'account'>(null);
  const pathname = usePathname();
  const t = useT();
  const initial = getInitial(user?.full_name);
  const routeCounts = useUnreadStore((s) => s.counts);

  const close = () => setOpen(null);
  const toggle = (o: 'menu' | 'account') => setOpen((x) => (x === o ? null : o));

  // Funga kwa Esc
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);

  const title =
    TITLES[pathname ?? ''] ??
    links.find((l) => l.href === pathname)?.label ??
    '';

  return (
    <>
      {/* ☰ / ✕ */}
      <button
        onClick={() => toggle('menu')}
        aria-label="Menyu"
        aria-expanded={open === 'menu'}
        className={clsx(
          'flex items-center justify-center w-9 h-9 rounded-[9px] border flex-shrink-0 transition-colors',
          open === 'menu'
            ? 'bg-brand-grey-100 border-brand-grey-200'
            : 'bg-white border-brand-grey-200'
        )}
      >
        <span className="relative block w-[18px] h-[14px]">
          <i className={clsx('absolute left-0 h-[2px] rounded-[2px] bg-brand-grey-700 transition-all duration-300 ease-out',
            open === 'menu' ? 'top-[6px] w-[18px] rotate-45' : 'top-0 w-[18px]')} />
          <i className={clsx('absolute left-0 h-[2px] rounded-[2px] bg-brand-grey-700 transition-all duration-200',
            open === 'menu' ? 'top-[6px] w-0 opacity-0' : 'top-[6px] w-[12px]')} />
          <i className={clsx('absolute left-0 h-[2px] rounded-[2px] bg-brand-grey-700 transition-all duration-300 ease-out',
            open === 'menu' ? 'top-[6px] w-[18px] -rotate-45' : 'top-[12px] w-[18px]')} />
        </span>
      </button>

      <span className="text-[15px] font-bold text-brand-grey-900 truncate min-w-0">{title}</span>
      <div className="flex-1" />

      {/* Avatar */}
      <button
        onClick={() => toggle('account')}
        aria-label="Akaunti"
        aria-expanded={open === 'account'}
        className={clsx(
          'w-8 h-8 rounded-full bg-brand-blue-50 border border-brand-blue-200 flex items-center justify-center text-[13px] font-bold text-brand-blue-700 flex-shrink-0 transition-shadow',
          open === 'account' && 'ring-[3px] ring-brand-blue-200'
        )}
      >
        {initial}
      </button>

      <LangToggle />

      {/* Menyu ya ☰ — inagusa ukingo wa kushoto */}
      <nav
        aria-hidden={open !== 'menu'}
        className={clsx(
          'fixed left-0 top-[59px] z-[100] w-[270px] max-w-[86vw] bg-white border border-brand-grey-200 border-l-0 rounded-br-[14px] p-1.5 shadow-[0_16px_40px_rgba(17,24,39,0.16)] transition-all duration-[260ms] ease-out',
          open === 'menu'
            ? 'opacity-100 translate-y-0 visible'
            : 'opacity-0 -translate-y-2.5 invisible pointer-events-none'
        )}
      >
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== '/admin' && pathname?.startsWith(l.href));
          const badge = routeCounts[l.href] || 0;
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              tabIndex={open === 'menu' ? 0 : -1}
              className={clsx(
                'flex items-center gap-3 h-[46px] px-2.5 rounded-[9px] text-sm font-medium transition-colors',
                active ? 'text-brand-blue font-semibold' : 'text-brand-grey-700 active:bg-brand-grey-50'
              )}
            >
              <span className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                active ? 'bg-brand-blue text-white' : 'bg-brand-grey-100 text-brand-grey-700'
              )}>
                <l.icon size={18} strokeWidth={2} />
              </span>
              <span className="truncate">{l.label}</span>
              {badge > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Menyu ya akaunti — inagusa ukingo wa kulia */}
      <div
        aria-hidden={open !== 'account'}
        className={clsx(
          'fixed right-0 top-[59px] z-[100] w-40 bg-white border border-brand-grey-200 border-r-0 rounded-bl-[14px] p-1 shadow-[0_16px_40px_rgba(17,24,39,0.16)] transition-all duration-[260ms] ease-out',
          open === 'account'
            ? 'opacity-100 translate-y-0 visible'
            : 'opacity-0 -translate-y-2.5 invisible pointer-events-none'
        )}
      >
        <Link
          href="/wasifu"
          onClick={close}
          tabIndex={open === 'account' ? 0 : -1}
          className="flex items-center gap-2.5 h-[42px] px-2 rounded-[9px] text-sm font-medium text-brand-grey-700 active:bg-brand-grey-50"
        >
          <span className="w-[30px] h-[30px] rounded-lg bg-brand-grey-100 text-brand-grey-700 flex items-center justify-center flex-shrink-0">
            <User size={18} strokeWidth={2} />
          </span>
          {t('nav.profile')}
        </Link>
        <button
          onClick={() => { close(); onLogout(); }}
          tabIndex={open === 'account' ? 0 : -1}
          className="w-full flex items-center gap-2.5 h-[42px] px-2 rounded-[9px] text-sm font-medium text-brand-red"
        >
          <span className="w-[30px] h-[30px] rounded-lg bg-red-50 text-brand-red flex items-center justify-center flex-shrink-0">
            <LogOut size={18} strokeWidth={2} />
          </span>
          {t('nav.logout')}
        </button>
      </div>

      {/* Giza hafifu nyuma ya menyu */}
      <div
        onClick={close}
        className={clsx(
          'fixed inset-x-0 top-[59px] bottom-0 z-[99] bg-[rgba(17,24,39,0.28)] transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />
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
        { href: '/admin', label: t('nav.admin'), icon: BarChart3 },
        { href: '/admin/users', label: t('nav.users'), icon: Users },
        { href: '/admin/matches', label: t('nav.matches', 'Waliopata Wenzao'), icon: GitMerge },
        { href: '/admin/payments', label: t('nav.payments'), icon: Wallet },
        { href: '/admin/feedback', label: t('nav.feedback_short', 'Maoni'), icon: ClipboardList },
      ]
    : [
        { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { href: '/changia', label: t('nav.donate'), icon: HandCoins },
        { href: '/maoni', label: t('nav.feedback_short', 'Maoni'), icon: ClipboardList },
        { href: '/wasifu', label: t('nav.profile'), icon: User },
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
                'flex-1 flex flex-col items-center justify-center gap-0 py-1 min-h-[52px] px-0 transition-all duration-200 ease-out active:scale-95 min-w-0 rounded-lg',
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
              {active && <span className="w-1 h-1 rounded-full bg-brand-blue mt-0.5" />}
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


