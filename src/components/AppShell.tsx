'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth';
import { useI18n, useT } from '@/lib/i18n';
import { getRegions, updateFollowedRegions, bustGetCache, type Region } from '@/lib/api';
import { useFollowStore } from '@/lib/followStore';
import { useUnreadStore } from '@/lib/unreadStore';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { useLive } from '@/lib/liveSocket';
import { useTheme, applyTheme } from '@/lib/theme';
import ThemeToggle from '@/components/ThemeToggle';
import { getInitial } from '@/lib/initials';
import {
  BarChart3, Bell, Contact, Crown, Database, Heart, Languages, LayoutDashboard,
  LogOut, Megaphone as MegaphoneIcon, MessageSquare, Radio, User, Users, Wallet, Zap,
} from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const t = useT();
  const theme = useTheme((s) => s.theme);

  // Apply persisted theme (dark/light) on mount + whenever it changes
  useEffect(() => { applyTheme(theme); }, [theme]);

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
        { href: '/chats', label: t('nav.chats'), icon: MessageSquare },
        { href: '/contacts', label: t('nav.contacts'), icon: Contact },
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
              {isAdmin ? 'Admin' : 'Kubadilishana'}
            </span>
          </Link>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {/* Fuata Mikoa ni kwa WATUMIAJI tu — admin hana haja (anaona wote) */}
            {!isAdmin && <FollowRegionsButton compact dark={isAdmin} />}
            <NotificationsBell isAdmin={isAdmin} />
            <ThemeToggle dark={isAdmin} />
            <LangToggle dark={isAdmin} compact />
            <AvatarMenu name={user?.full_name} onLogout={doLogout} dark={isAdmin} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
        {/* ═══ DESKTOP SIDEBAR (hidden kwenye simu) ═══ */}
        <aside className={clsx(
          'hidden md:block md:w-64 md:min-h-screen md:sticky md:top-0 bg-white border-r border-brand-grey-100',
          isAdmin && 'bg-brand-grey-950 text-white'
        )}>
          <div className={clsx('p-4 border-b', isAdmin ? 'border-brand-grey-700' : 'border-brand-grey-100')}>
            <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold text-sm">
                KV
              </div>
              <span className={clsx('font-bold text-sm', isAdmin ? 'text-white' : 'text-brand-grey-900')}>
                {isAdmin ? 'Admin Panel' : 'Kubadilishana'}
              </span>
            </Link>
            {/* Toolbar: WS status + notifications + theme/language toggles */}
            <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
              <WsStatus dark={isAdmin} />
              <div className="flex items-center gap-0.5">
                <NotificationsBell isAdmin={isAdmin} />
                <ThemeToggle dark={isAdmin} />
                <LangToggle dark={isAdmin} />
              </div>
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
                      ? isAdmin
                        ? 'bg-brand-blue text-white shadow-md'
                        : 'bg-brand-blue-50 text-brand-blue'
                      : isAdmin
                        ? 'text-brand-grey-200 hover:bg-brand-grey-800 hover:text-white'
                        : 'text-brand-grey-700 hover:bg-brand-grey-50'
                  )}
                >
                  <l.icon size={18} strokeWidth={2.2} className="flex-shrink-0" />
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Fuata Mikoa — kwa WATUMIAJI tu (admin anaona data zote) */}
          {!isAdmin && (
            <div className="p-2 pt-0">
              <FollowRegionsButton dark={isAdmin} />
            </div>
          )}

          <div className={clsx('p-3 border-t mt-auto',
            isAdmin ? 'border-brand-grey-700' : 'border-brand-grey-100')}>
            {user && (
              <>
                <div className={clsx('text-sm font-semibold truncate', isAdmin ? 'text-white' : 'text-brand-grey-900')}>
                  {user.full_name} {isAdmin && '👑'}
                </div>
                <div className={clsx('text-xs truncate', isAdmin ? 'text-brand-grey-400' : 'text-brand-grey-500')}>
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
        { href: '/chats', label: t('nav.chats'), icon: MessageSquare },
        { href: '/contacts', label: t('nav.contacts'), icon: Contact },
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
                  : isAdmin
                    ? 'text-brand-grey-400 dark:text-brand-grey-500'
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
function AvatarMenu({ name, onLogout, dark }: { name?: string; onLogout: () => void; dark?: boolean }) {
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
        className={clsx('flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition',
          dark ? 'bg-brand-grey-800 text-white' : 'bg-brand-blue-50 text-brand-blue hover:bg-brand-blue-100')}
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
          {!dark && user?.cadre_display && (
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
function WsStatus({ dark }: { dark?: boolean }) {
  const connected = useLive((s) => s.connected);
  return (
    <span
      className={clsx(
        'flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full border transition',
        connected
          ? 'bg-green-100 border-green-300 text-green-700'
          : dark
            ? 'bg-brand-grey-800 border-brand-grey-700 text-brand-grey-400'
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

/** Language toggle — official icon + code (compact huficha text kwenye simu ndogo sana). */
function LangToggle({ dark, compact }: { dark?: boolean; compact?: boolean }) {
  const currentLang = useI18n((s) => s.lang);
  const toggleLang = useI18n((s) => s.toggle);
  return (
    <button
      onClick={toggleLang}
      className={clsx(
        'flex items-center gap-1 p-1.5 rounded-md text-[11px] font-bold transition flex-shrink-0',
        dark ? 'hover:bg-brand-grey-800 text-white' : 'hover:bg-brand-grey-100 text-brand-grey-700'
      )}
      title="Badilisha lugha / Toggle language"
      aria-label="Toggle language"
    >
      <Languages size={15} strokeWidth={2.2} />
      <span className={compact ? 'hidden min-[380px]:inline' : undefined}>{currentLang.toUpperCase()}</span>
    </button>
  );
}

/** Fuata Mikoa — chagua mikoa ya chanzo ya live notifications.
 *  `compact` = mobile top bar → fungua BOTTOM SHEET (mfumo wa kisasa wa simu);
 *  `!compact` = sidebar ya desktop → dropdown panel pana la grid ya mikoa. */
function FollowRegionsButton({ dark, compact }: { dark?: boolean; compact?: boolean }) {
  const t = useT();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const followed = useFollowStore((s) => s.region_ids);
  const loadFollow = useFollowStore((s) => s.load);
  const setFollow = useFollowStore((s) => s.set);
  const [savedMsg, setSavedMsg] = useState<'added' | 'removed' | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Mikoa ya KUHAMIA (desired_destinations) tayari inafuatiliwa kiotomatiki —
  // haionekani tena kwenye "Fuata Mikoa" (usiweze kuiweka mara mbili).
  const destRegionIds = new Set<number>(
    ((user as any)?.desired_destinations || []).map((d: any) => d.region_id).filter((x: any) => typeof x === 'number')
  );
  const followable = regions.filter((r) => !destRegionIds.has(r.id));
  const excludedNames = regions.filter((r) => destRegionIds.has(r.id)).map((r) => r.name);
  // Hesabu ya "imefuata" — usihesabu mikoa ya kuhamia (isiyoonekana hapa)
  const shownFollowed = followed.filter((id) => followable.some((r) => r.id === id));

  // Load regions + followed (shared store) on mount
  useEffect(() => {
    loadFollow();
    getRegions().then(setRegions).catch(() => {});
  }, [loadFollow]);

  // Close on outside click (desktop) — bottom sheet inafunga kwa backdrop yake
  useEffect(() => {
    if (!open || compact) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, compact]);

  // Bottom sheet: funga scroll ya ukurasa nyuma (mradi sheet iko wazi)
  useEffect(() => {
    if (!open || !compact) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open, compact]);

  async function save(next: number[]) {
    // Feedback halisi: unapoongeza → "Imechaguliwa"; unapoondoa → "Imeondolewa"
    const adding = next.length > followed.length;
    setFollow(next);
    setSavedMsg(adding ? 'added' : 'removed');
    try { await updateFollowedRegions(next); } finally {
      setTimeout(() => setSavedMsg(null), 2000);
    }
  }

  const toggle = (rid: number) =>
    save(followed.includes(rid) ? followed.filter((x) => x !== rid) : [...followed, rid]);

  const allIds = followable.map((r) => r.id);

  const content = (
    <FollowRegionsContent
      regions={followable}
      excludedNames={excludedNames}
      followed={shownFollowed}
      saved={savedMsg}
      onToggle={toggle}
      onSelectAll={() => save(allIds)}
      onClearAll={() => save([])}
    />
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          compact
            ? clsx('p-1.5 rounded-md transition', dark ? 'hover:bg-brand-grey-800 text-white' : 'hover:bg-brand-grey-100 text-brand-grey-700')
            : clsx('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition',
                open
                  ? isAdminDark(dark)
                  : dark ? 'text-brand-grey-300 hover:bg-brand-grey-800' : 'text-brand-grey-700 hover:bg-brand-grey-50'),
          open && !compact && isAdminDark(dark)
        )}
        title={t('board.follow_btn_title')}
        aria-label="Fuata mikoa"
      >
        <Radio size={18} strokeWidth={2.2} className="flex-shrink-0" />
        {!compact && <span className="flex-1 text-left">{t('board.follow')}</span>}
        {!compact && followed.length > 0 && (
          <span className="inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-orange text-white">
            {followed.length}
          </span>
        )}
        {compact && followed.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-brand-orange text-white text-[8px] font-bold flex items-center justify-center">
            {followed.length > 9 ? '9+' : followed.length}
          </span>
        )}
      </button>

      {open && compact ? (
        <>
          {/* ═══ BOTTOM SHEET (simu) — inainuka kutoka chini, safe-area aware ═══ */}
          {/* z-[110]/z-[120]: juu ya toasts (z-[100]) na bottom nav (z-40) */}
          <div className="fixed inset-0 z-[110] bg-black/50" onClick={() => setOpen(false)} aria-hidden />
          <div className="fixed inset-x-0 bottom-0 z-[120] rounded-t-2xl bg-white dark:bg-brand-grey-900 shadow-2xl max-h-[75dvh] overflow-y-auto overscroll-contain p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-brand-grey-900 dark:text-white flex items-center gap-1.5">
                <Radio size={16} className="text-brand-orange" /> {t('board.follow')}
              </span>
              <button onClick={() => setOpen(false)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-grey-200 text-brand-grey-600 hover:bg-brand-grey-50 dark:hover:bg-brand-grey-800 transition flex-shrink-0">
                ✕ {t('action.close')}
              </button>
            </div>
            {content}
          </div>
        </>
      ) : open ? (
        <>
          {/* Backdrop + dropdown panel (desktop) */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 w-[min(24rem,calc(100vw-1rem))] max-h-[70dvh] overflow-y-auto overscroll-contain rounded-xl border border-brand-grey-100 bg-white dark:bg-brand-grey-900 dark:border-brand-grey-700 shadow-xl z-40 p-3">
            {content}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Content ya pamoja (bottom sheet + dropdown) — quick actions + grid ya mikoa. */
function FollowRegionsContent({ regions, excludedNames, followed, saved, onToggle, onSelectAll, onClearAll }: {
  regions: Region[]; excludedNames: string[]; followed: number[];
  saved: 'added' | 'removed' | null;
  onToggle: (id: number) => void; onSelectAll: () => void; onClearAll: () => void;
}) {
  const t = useT();
  return (
    <>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-brand-grey-500 dark:text-brand-grey-400">
          {followed.length} / {regions.length}
        </span>
        {saved === 'added' && <span className="text-[10px] font-semibold text-green-600">{t('board.follow_added')}</span>}
        {saved === 'removed' && <span className="text-[10px] font-semibold text-brand-orange">{t('board.follow_removed')}</span>}
      </div>
      <p className="text-[11px] text-brand-grey-500 dark:text-brand-grey-400 mb-2 leading-relaxed">{t('board.follow_hint')}</p>
      {excludedNames.length > 0 && (
        <div className="mb-2.5 text-[10px] text-brand-grey-500 dark:text-brand-grey-400 bg-brand-grey-50 dark:bg-brand-grey-800 rounded-lg px-2.5 py-1.5 leading-relaxed">
          ✅ {t('board.follow_already')} <b className="text-brand-grey-700 dark:text-brand-grey-200">{excludedNames.join(', ')}</b>
        </div>
      )}
      <div className="flex items-center gap-1.5 mb-2.5">
        <button type="button" onClick={onSelectAll}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-brand-blue text-brand-blue hover:bg-brand-blue-50 transition">
          {t('board.follow_all')}
        </button>
        <button type="button" onClick={onClearAll}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-brand-grey-300 text-brand-grey-500 hover:bg-brand-grey-50 dark:hover:bg-brand-grey-800 transition">
          {t('board.follow_none')}
        </button>
      </div>
      {/* 2-col tangu mwanzo — sheet/dropdown ni pana, chips zinakata kwa truncate */}
      <div className="grid grid-cols-2 gap-1.5">
        {regions.map((r) => {
          const on = followed.includes(r.id);
          return (
            <button key={r.id} type="button" onClick={() => onToggle(r.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border text-left transition min-w-0 ${
                on
                  ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                  : 'border-brand-grey-200 text-brand-grey-600 hover:border-brand-blue hover:text-brand-blue dark:border-brand-grey-700 dark:text-brand-grey-300'
              }`}>
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${on ? 'bg-white border-white' : 'border-brand-grey-300'}`}>
                {on && <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />}
              </span>
              <span className="truncate">{r.name}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function isAdminDark(dark?: boolean) {
  return dark ? 'bg-brand-grey-800 text-white' : 'bg-brand-blue-50 text-brand-blue';
}

/** Live notifications bell with unread badge. */
function NotificationsBell({ isAdmin }: { isAdmin?: boolean }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const unread = useUnreadStore((s) => s.count);
  const refresh = useUnreadStore((s) => s.refresh);
  const { messages } = useLiveEvents(user ? ['notification'] : []);

  // Initial load + kila ROUTE inabadilika (kurudi kutoka /notifications baada ya
  // kusoma) → kengele inaonyesha hesabu halisi, siyo ile ya zamani.
  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  // Live: any new notification event refreshes the badge immediately (FRESH data)
  useEffect(() => {
    if (!messages.length) return;
    bustGetCache(); // FUSHA cache — badge inaonyesha hesabu halisi sasa
    refresh();
  }, [messages.length, refresh]);

  // Focus / kurudi kwenye tab → refresh (arifa zinaweza kuwa zimesomwa kwingine)
  useEffect(() => {
    const onShow = () => refresh();
    window.addEventListener('focus', onShow);
    document.addEventListener('visibilitychange', onShow);
    return () => {
      window.removeEventListener('focus', onShow);
      document.removeEventListener('visibilitychange', onShow);
    };
  }, [refresh]);

  return (
    <Link
      href="/notifications"
      className={clsx('relative p-1.5 rounded-md transition',
        isAdmin ? 'hover:bg-brand-grey-800 text-white' : 'hover:bg-brand-grey-100 text-brand-grey-700')}
      title="Arifa zako"
    >
      <Bell size={18} strokeWidth={2.2} />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}
