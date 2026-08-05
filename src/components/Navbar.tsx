'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { href: '/', label: 'Nyumbani' },
  { href: '/about', label: 'Kuhusu Sisi' },
  { href: '/services', label: 'Huduma Zetu' },
  { href: '/projects', label: 'Miradi Yetu' },
  { href: '/contact', label: 'Wasiliana Nasi' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-brand-grey-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold">
              KV
            </div>
            <span className="font-bold text-brand-grey-900 hidden sm:inline">
              Kubadilishana Vituo
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  'px-3 py-2 rounded-md text-sm font-medium transition',
                  pathname === l.href
                    ? 'text-brand-blue bg-brand-blue-50'
                    : 'text-brand-grey-700 hover:text-brand-blue hover:bg-brand-grey-50'
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/login" className="btn-outline text-sm py-2">
              Ingia
            </Link>
            <Link href="/register" className="btn-accent text-sm py-2">
              Jisajili
            </Link>
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
          <div className="md:hidden py-3 space-y-1 border-t border-brand-grey-100">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'block px-3 py-2 rounded-md text-sm font-medium',
                  pathname === l.href
                    ? 'text-brand-blue bg-brand-blue-50'
                    : 'text-brand-grey-700 hover:bg-brand-grey-50'
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-3 border-t border-brand-grey-100 mt-3">
              <Link href="/login" onClick={() => setOpen(false)} className="btn-outline flex-1 text-sm py-2">
                Ingia
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className="btn-accent flex-1 text-sm py-2">
                Jisajili
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
