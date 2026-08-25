'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { Stethoscope, GraduationCap, ArrowLeftRight, MessageCircle, Bell, ShieldCheck, ArrowRight } from 'lucide-react';

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
    <div className="bg-white dark:bg-brand-grey-950">
      {/* ═══ HERO — safi, hakuna picha ═══ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-grey-900 dark:text-white mb-3">
          {t('svc.title')}
        </h1>
        <p className="text-sm sm:text-base text-brand-grey-500 dark:text-brand-grey-400 max-w-2xl mx-auto">
          {t('svc.subtitle')}
        </p>
      </section>

      {/* ═══ HUDUMA — cards safi ═══ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <div key={s.title} className="rounded-xl border border-brand-grey-200 dark:border-brand-grey-700 bg-white dark:bg-brand-grey-900 p-5 hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand-blue-50 dark:bg-brand-blue-950 text-brand-blue flex items-center justify-center flex-shrink-0">
                  <s.icon size={20} strokeWidth={2} />
                </div>
                <span className="text-2xl font-bold text-brand-grey-200 dark:text-brand-grey-700 select-none">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="text-base font-bold text-brand-grey-900 dark:text-white mb-1.5">{s.title}</h3>
              <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ JINSI INAVYOFANYA KAZI ═══ */}
      <section className="border-t border-brand-grey-100 dark:border-brand-grey-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-grey-900 dark:text-white text-center mb-8">
            Jinsi Inavyofanya Kazi
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { n: '01', title: 'Jisajili', desc: 'Ingiza taarifa zako: jina, simu, kada, na kituo chako' },
              { n: '02', title: 'Tafuta Mwenza', desc: 'Mfumo unakuletea mtu anayetaka kubadilishana na wewe' },
              { n: '03', title: 'Kubaliana', desc: 'Ongea naye, kubaliana, na badilishana kwa urahisi' },
            ].map((step) => (
              <div key={step.n} className="text-center p-5 rounded-xl border border-brand-grey-200 dark:border-brand-grey-700 bg-white dark:bg-brand-grey-900">
                <div className="w-10 h-10 mx-auto rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm mb-3">
                  {step.n}
                </div>
                <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1.5">{step.title}</h3>
                <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA — mwisho ═══ */}
      <section className="border-t border-brand-grey-100 dark:border-brand-grey-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-grey-900 dark:text-white mb-3">{t('landing.cta_title')}</h2>
          <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400 mb-6 max-w-2xl mx-auto">
            {t('landing.cta_body')}
          </p>
          <Link href="/register" className="btn-primary text-sm">
            {t('landing.register_now')}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
