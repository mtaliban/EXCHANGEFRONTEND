'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/lib/i18n';
import { APP_ROUTES } from '@/lib/config';
import { PhoneCall, Phone } from 'lucide-react';

export default function Footer() {
  const t = useT();
  const pathname = usePathname();

  // Baada ya login (app pages) footer ya public HAITOKE kabisa — AppShell ina
  // muundo wake (sidebar/bottom nav). Footer hii ni ya public pages pekee.
  if (APP_ROUTES.some((r) => pathname?.startsWith(r))) return null;
  return (
    <footer className="bg-brand-grey-950 text-brand-grey-100 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8">
          {/* Brand — upana mzima kwenye simu, professional */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center text-white font-bold text-sm">
                KV
              </div>
              <span className="font-bold text-white">Kubadilishana Vituo</span>
            </div>
            <p className="text-xs sm:text-sm text-brand-grey-300 leading-relaxed">
              {t('footer.desc')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-2.5">{t('footer.pages')}</h4>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/" className="hover:text-white transition">{t('footer.home')}</Link></li>
              <li><Link href="/about" className="hover:text-white transition">{t('footer.about')}</Link></li>
              <li><Link href="/services" className="hover:text-white transition">{t('footer.services')}</Link></li>
              <li><Link href="/projects" className="hover:text-white transition">{t('footer.projects')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-2.5">{t('footer.account')}</h4>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/register" className="hover:text-white transition">{t('footer.register')}</Link></li>
              <li><Link href="/login" className="hover:text-white transition">{t('footer.login')}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">{t('footer.contact')}</Link></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold text-white text-sm mb-2.5">{t('footer.contact_title')}</h4>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center gap-2 text-brand-grey-300">
                <Phone size={14} className="text-brand-blue-500 flex-shrink-0" />
                WhatsApp: +255 625 607 088
              </li>
              <li className="flex items-center gap-2 text-brand-grey-300">
                <PhoneCall size={14} className="text-brand-blue-500 flex-shrink-0" />
                Simu: 0763 795 801
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brand-grey-700 mt-8 pt-4 text-center text-xs text-brand-grey-400">
          © {new Date().getFullYear()} Kubadilishana Vituo. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
