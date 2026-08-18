'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { Stethoscope, GraduationCap, ArrowLeftRight, MessageCircle, Bell, ShieldCheck } from 'lucide-react';

export default function ServicesPage() {
  const t = useT();

  const services = [
    { icon: Stethoscope, title: t('svc.health'), desc: t('svc.health_d') },
    { icon: GraduationCap, title: t('svc.teachers'), desc: t('svc.teachers_d') },
    { icon: ArrowLeftRight, title: t('svc.matching'), desc: t('svc.matching_d') },
    { icon: MessageCircle, title: t('svc.chat'), desc: t('svc.chat_d') },
    { icon: Bell, title: t('svc.notif'), desc: t('svc.notif_d') },
    { icon: ShieldCheck, title: t('svc.verify'), desc: t('svc.verify_d') },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Kichwa */}
      <div className="text-center mb-12">
        <span className="inline-flex items-center rounded-full bg-brand-blue-50 border border-brand-blue-100 px-3 py-1 text-xs font-semibold text-brand-blue mb-3">
          {t('svc.badge')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-grey-900 dark:text-white mb-3">
          {t('svc.title')}
        </h1>
        <p className="text-brand-grey-500 dark:text-brand-grey-400 max-w-2xl mx-auto">
          {t('svc.subtitle')}
        </p>
      </div>

      {/* Huduma — cards za kisomi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s, i) => (
          <div
            key={s.title}
            className="card group hover:shadow-lg transition flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-brand-blue-50 text-brand-blue flex items-center justify-center transition group-hover:bg-brand-blue group-hover:text-white">
                <s.icon size={26} strokeWidth={2} />
              </div>
              <span className="text-3xl font-bold text-brand-grey-100 dark:text-brand-grey-800 select-none">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="text-xl font-bold text-brand-grey-900 dark:text-white mb-2">
              {s.title}
            </h3>
            <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400 leading-relaxed">
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-2xl bg-brand-blue text-white px-6 py-10 sm:px-10 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t('landing.cta_title')}</h2>
        <p className="text-sm sm:text-base text-brand-blue-100 max-w-2xl mx-auto mb-6">
          {t('landing.cta_body')}
        </p>
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-sm sm:text-base text-brand-blue font-bold shadow-lg hover:bg-brand-grey-50 transition w-full sm:w-auto"
        >
          {t('landing.register_now')}
        </Link>
      </div>
    </div>
  );
}
