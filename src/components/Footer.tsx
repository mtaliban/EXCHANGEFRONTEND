'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/lib/i18n';
import { APP_ROUTES } from '@/lib/config';
import { Home, Info, Stethoscope, FolderKanban, UserPlus, LogIn, PhoneCall, Phone, MessageCircle } from 'lucide-react';

export default function Footer() {
  const t = useT();
  const pathname = usePathname();

  // Baada ya login (app pages) footer ya public HAITOKE kabisa — AppShell ina
  // muundo wake (sidebar/bottom nav). Footer hii ni ya public pages pekee.
  if (APP_ROUTES.some((r) => pathname?.startsWith(r))) return null;

  const pagesLinks = [
    { href: '/', label: t('footer.home'), icon: Home },
    { href: '/about', label: t('footer.about'), icon: Info },
    { href: '/services', label: t('footer.services'), icon: Stethoscope },
    { href: '/projects', label: t('footer.projects'), icon: FolderKanban },
  ];
  const accountLinks = [
    { href: '/register', label: t('footer.register'), icon: UserPlus },
    { href: '/login', label: t('footer.login'), icon: LogIn },
    { href: '/contact', label: t('footer.contact'), icon: PhoneCall },
  ];

  return (
    <footer className="bg-brand-grey-950 text-brand-grey-100 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* ── Desktop: grid ya 4 ── */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center text-white font-bold text-sm">
                KV
              </div>
              <span className="font-bold text-white">Kubadilishana Vituo</span>
            </div>
            <p className="text-sm text-brand-grey-300 leading-relaxed">{t('footer.desc')}</p>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">{t('footer.pages')}</h4>
            <ul className="space-y-2 text-sm">
              {pagesLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex items-center gap-2 text-brand-grey-300 hover:text-white transition">
                    <l.icon size={15} className="text-brand-blue-500 flex-shrink-0" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">{t('footer.account')}</h4>
            <ul className="space-y-2 text-sm">
              {accountLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex items-center gap-2 text-brand-grey-300 hover:text-white transition">
                    <l.icon size={15} className="text-brand-blue-500 flex-shrink-0" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">{t('footer.contact_title')}</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-brand-grey-300">
                <MessageCircle size={15} className="text-brand-blue-500 flex-shrink-0" />
                WhatsApp: +255 625 607 088
              </li>
              <li className="flex items-center gap-2 text-brand-grey-300">
                <Phone size={15} className="text-brand-blue-500 flex-shrink-0" />
                Simu: 0763 795 801
              </li>
            </ul>
          </div>
        </div>

        {/* ── Simu: compact — links zote mstari mmoja ── */}
        <div className="md:hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-blue flex items-center justify-center text-white font-bold text-xs">
                KV
              </div>
              <span className="font-bold text-white text-sm">Kubadilishana Vituo</span>
            </div>
            <div className="flex items-center gap-2.5">
              <a href="https://wa.me/255625607088" aria-label="WhatsApp" className="w-8 h-8 rounded-lg bg-brand-grey-800 flex items-center justify-center text-brand-blue-500 hover:bg-brand-grey-700 hover:text-white transition">
                <MessageCircle size={16} />
              </a>
              <a href="tel:+255763795801" aria-label="Simu" className="w-8 h-8 rounded-lg bg-brand-grey-800 flex items-center justify-center text-brand-blue-500 hover:bg-brand-grey-700 hover:text-white transition">
                <Phone size={16} />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
            {[...pagesLinks, ...accountLinks].map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center gap-1.5 text-brand-grey-300 hover:text-white transition">
                <l.icon size={13} className="text-brand-blue-500 flex-shrink-0" />
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-brand-grey-700 mt-6 pt-4 text-center text-xs text-brand-grey-400">
          © {new Date().getFullYear()} Kubadilishana Vituo. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
