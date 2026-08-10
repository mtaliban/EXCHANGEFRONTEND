'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth';
import { useI18n, useT } from '@/lib/i18n';
import { getUnreadCount, getRegions, getFollowedRegions, updateFollowedRegions, type Region } from '@/lib/api';
import { useLiveEvents } from '@/lib/useLiveEvents';
import { useLive } from '@/lib/liveSocket';
import { useTheme, applyTheme } from '@/lib/theme';
import ThemeToggle from '@/components/ThemeToggle';
import Megaphone from '@/components/Megaphone';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import {
  BarChart3, Bell, Contact, Crown, Heart, Languages, LayoutDashboard,
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

  return (
    <div className="min-h-screen bg-brand-grey-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row">
        <aside className={clsx(
          'md:w-64 md:min-h-screen md:sticky md:top-0 bg-white border-r border-brand-grey-100',
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
            <div className="mt-3 flex items-center justify-between gap-2">
              <WsStatus dark={isAdmin} />
              <div className="flex items-center gap-0.5">
                <Megaphone dark={isAdmin} />
                <FollowRegionsButton dark={isAdmin} />
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
                        ? 'bg-brand-blue text-white'
                        : 'bg-brand-blue-50 text-brand-blue'
                      : isAdmin
                        ? 'text-brand-grey-300 hover:bg-brand-grey-800'
                        : 'text-brand-grey-700 hover:bg-brand-grey-50'
                  )}
                >
                  <l.icon size={18} strokeWidth={2.2} className="flex-shrink-0" />
                  <span className="hidden md:inline">{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className={clsx('p-3 border-t hidden md:block mt-auto',
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
                  onClick={() => { logout(); router.replace('/login'); }}
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

        <main className="flex-1 min-w-0">
          {/* Matangazo juu kabisa — yanaonekana bila kufungua */}
          <AnnouncementBanner />
          {children}
        </main>
      </div>
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

/** Language toggle — official icon + code. */
function LangToggle({ dark }: { dark?: boolean }) {
  const currentLang = useI18n((s) => s.lang);
  const toggleLang = useI18n((s) => s.toggle);
  return (
    <button
      onClick={toggleLang}
      className={clsx(
        'flex items-center gap-1 p-1.5 rounded-md text-[11px] font-bold transition',
        dark ? 'hover:bg-brand-grey-800 text-white' : 'hover:bg-brand-grey-100 text-brand-grey-700'
      )}
      title="Badilisha lugha / Toggle language"
      aria-label="Toggle language"
    >
      <Languages size={15} strokeWidth={2.2} />
      {currentLang.toUpperCase()}
    </button>
  );
}

/** Fuata Mikoa — dropdown kwenye nav: chagua mikoa ya chanzo ya live notifications. */
function FollowRegionsButton({ dark }: { dark?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [followed, setFollowed] = useState<number[]>([]);
  const [saved, setSaved] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Load regions + followed each time the dropdown opens
  useEffect(() => {
    if (!open) return;
    getRegions().then(setRegions).catch(() => {});
    getFollowedRegions().then((r) => setFollowed(r.region_ids)).catch(() => {});
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  async function toggle(rid: number) {
    const next = followed.includes(rid) ? followed.filter((x) => x !== rid) : [...followed, rid];
    setFollowed(next);
    setSaved(true);
    try { await updateFollowedRegions(next); } finally {
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx('relative p-1.5 rounded-md transition',
          dark ? 'hover:bg-brand-grey-800 text-white' : 'hover:bg-brand-grey-100 text-brand-grey-700')}
        title={t('board.follow_btn_title')}
        aria-label="Fuata mikoa"
      >
        <Radio size={18} strokeWidth={2.2} />
        {followed.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand-orange" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 max-w-[calc(100vw-2rem)] max-h-80 overflow-y-auto rounded-xl border border-brand-grey-100 bg-white dark:bg-brand-grey-900 dark:border-brand-grey-700 shadow-xl z-50 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-brand-grey-900 dark:text-white">🔔 {t('board.follow')}</span>
            {saved && <span className="text-[10px] font-semibold text-green-600">{t('board.follow_saved')}</span>}
          </div>
          <p className="text-[11px] text-brand-grey-500 dark:text-brand-grey-400 mb-2">{t('board.follow_hint')}</p>
          <div className="flex flex-wrap gap-1.5">
            {regions.map((r) => {
              const on = followed.includes(r.id);
              return (
                <button key={r.id} type="button" onClick={() => toggle(r.id)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition ${on ? 'bg-brand-blue text-white border-brand-blue' : 'border-brand-grey-200 text-brand-grey-600 hover:border-brand-blue'}`}>
                  {on ? '✓ ' : '+ '}{r.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Live notifications bell with unread badge. */
function NotificationsBell({ isAdmin }: { isAdmin?: boolean }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const { messages } = useLiveEvents(user ? ['notification'] : []);

  // No HTTP polling — initial load + live MQTT events refresh the badge.
  useEffect(() => {
    let cancelled = false;
    getUnreadCount().then((d) => { if (!cancelled) setUnread(d.unread); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Live: any new notification event bumps the badge immediately
  useEffect(() => {
    if (!messages.length) return;
    getUnreadCount().then((d) => setUnread(d.unread)).catch(() => {});
  }, [messages.length]);

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
