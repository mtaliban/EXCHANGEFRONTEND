'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useAuth, isTokenExpired } from '@/lib/auth';
import { useI18n, useT } from '@/lib/i18n';
import { APP_ROUTES } from '@/lib/config';
import { Home, Info, Stethoscope, FolderKanban, PhoneCall, Languages } from 'lucide-react';

const publicLinks = [
  { href: '/', label: 'nav.home', icon: Home },
  { href: '/about', label: 'nav.about', icon: Info },
  { href: '/services', label: 'nav.services', icon: Stethoscope },
  { href: '/projects', label: 'nav.projects', icon: FolderKanban },
  { href: '/contact', label: 'nav.contact', icon: PhoneCall },
];


export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { token } = useAuth();
  const t = useT();
  const setLang = useI18n((s) => s.setLang);
  const currentLang = useI18n((s) => s.lang);

  useEffect(() => { setMounted(true); }, []);

  // Hide navbar completely on authenticated app routes (they have their own AppShell)
  if (APP_ROUTES.some(r => pathname?.startsWith(r))) {
    return null;
  }

  const isAuthed = mounted && !!token && !isTokenExpired(token);

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-brand-grey-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={isAuthed ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold">
              KV
            </div>
            <span className="font-bold text-brand-grey-900 hidden sm:inline">
              Kubadilishana Vituo
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {publicLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition',
                  pathname === l.href
                    ? 'text-brand-blue bg-brand-blue-50'
                    : 'text-brand-grey-700 hover:text-brand-blue hover:bg-brand-grey-50'
                )}
              >
                <l.icon size={16} strokeWidth={2.2} />
                {t(l.label)}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-brand-grey-200 p-0.5" title={t('lang.toggle_title')}>
              <button
                onClick={() => setLang('sw')}
                aria-pressed={currentLang === 'sw'}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${currentLang === 'sw' ? 'bg-brand-blue text-white' : 'text-brand-grey-700 hover:bg-brand-grey-50'}`}
              >
                🇹🇿 Kiswahili
              </button>
              <button
                onClick={() => setLang('en')}
                aria-pressed={currentLang === 'en'}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${currentLang === 'en' ? 'bg-brand-blue text-white' : 'text-brand-grey-700 hover:bg-brand-grey-50'}`}
              >
                🇬🇧 English
              </button>
            </div>
            {/* Public pages: Register/Login tu — hakuna buttons za dashibodi/logout.
                Mtu aliyeshaingia anarudi dashibodi kwa kubofya logo (au /login ina
                redirect automatic kwa authed users). */}
            <Link href="/login" className="btn-outline text-sm py-2">{t('nav.login')}</Link>
            <Link href="/register" className="btn-accent text-sm py-2">{t('nav.register')}</Link>
          </div>

          <div className="md:hidden flex items-center gap-1">
            <div className="flex items-center gap-1 rounded-md border border-brand-grey-200 p-0.5" title={t('lang.toggle_title')}>
              <button
                onClick={() => setLang('sw')}
                aria-pressed={currentLang === 'sw'}
                className={`px-1.5 py-1 rounded text-[10px] font-bold transition ${currentLang === 'sw' ? 'bg-brand-blue text-white' : 'text-brand-grey-700'}`}
              >
                SW
              </button>
              <button
                onClick={() => setLang('en')}
                aria-pressed={currentLang === 'en'}
                className={`px-1.5 py-1 rounded text-[10px] font-bold transition ${currentLang === 'en' ? 'bg-brand-blue text-white' : 'text-brand-grey-700'}`}
              >
                EN
              </button>
            </div>
          </div>
          <button
            className="md:hidden p-2 text-brand-grey-700"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden py-3 space-y-1 border-t border-brand-grey-100 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">
            {publicLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
                  pathname === l.href
                    ? 'text-brand-blue bg-brand-blue-50'
                    : 'text-brand-grey-700 hover:bg-brand-grey-50'
                )}
              >
                <l.icon size={17} strokeWidth={2.2} className="flex-shrink-0" />
                {t(l.label)}
              </Link>
            ))}
            <div className="flex gap-2 pt-3 border-t border-brand-grey-100 mt-3 sticky bottom-0 bg-white pb-1">
                <Link href="/login" onClick={() => setOpen(false)} className="btn-outline flex-1 text-sm py-2">
                  {t('nav.login')}
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="btn-accent flex-1 text-sm py-2">
                  {t('nav.register')}
                </Link>
              </div>
          </div>
        )}
      </div>
    </nav>
  );
}
