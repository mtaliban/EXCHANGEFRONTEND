'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { Home, Info, Stethoscope, FolderKanban, UserPlus, LogIn, PhoneCall, Phone } from 'lucide-react';

export default function Footer() {
  const t = useT();
  return (
    <footer className="bg-brand-grey-950 text-brand-grey-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold text-sm">
                KV
              </div>
              <span className="font-bold text-white">Kubadilishana Vituo</span>
            </div>
            <p className="text-sm text-brand-grey-300">
              {t('footer.desc')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">{t('footer.pages')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="flex items-center gap-2 hover:text-brand-orange"><Home size={15} className="text-brand-orange" />{t('footer.home')}</Link></li>
              <li><Link href="/about" className="flex items-center gap-2 hover:text-brand-orange"><Info size={15} className="text-brand-orange" />{t('footer.about')}</Link></li>
              <li><Link href="/services" className="flex items-center gap-2 hover:text-brand-orange"><Stethoscope size={15} className="text-brand-orange" />{t('footer.services')}</Link></li>
              <li><Link href="/projects" className="flex items-center gap-2 hover:text-brand-orange"><FolderKanban size={15} className="text-brand-orange" />{t('footer.projects')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">{t('footer.account')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register" className="flex items-center gap-2 hover:text-brand-orange"><UserPlus size={15} className="text-brand-orange" />{t('footer.register')}</Link></li>
              <li><Link href="/login" className="flex items-center gap-2 hover:text-brand-orange"><LogIn size={15} className="text-brand-orange" />{t('footer.login')}</Link></li>
              <li><Link href="/contact" className="flex items-center gap-2 hover:text-brand-orange"><PhoneCall size={15} className="text-brand-orange" />{t('footer.contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">{t('footer.contact_title')}</h4>
            <p className="flex items-center gap-2 text-sm text-brand-grey-300 mb-2"><Phone size={15} className="text-brand-orange" />WhatsApp: 0778 764 578</p>
            <p className="flex items-center gap-2 text-sm text-brand-grey-300"><PhoneCall size={15} className="text-brand-orange" />Simu: 0710 703 705</p>
          </div>
        </div>

        <div className="border-t border-brand-grey-700 mt-8 pt-6 text-center text-sm text-brand-grey-400">
          © {new Date().getFullYear()} Kubadilishana Vituo. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
