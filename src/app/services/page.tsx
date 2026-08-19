'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { Stethoscope, GraduationCap, ArrowLeftRight, MessageCircle, Bell, ShieldCheck, ArrowRight, Users } from 'lucide-react';

export default function ServicesPage() {
  const t = useT();

  const services = [
    { icon: Stethoscope, title: t('svc.health'), desc: t('svc.health_d'), color: 'from-red-500 to-red-600' },
    { icon: GraduationCap, title: t('svc.teachers'), desc: t('svc.teachers_d'), color: 'from-blue-500 to-blue-600' },
    { icon: ArrowLeftRight, title: t('svc.matching'), desc: t('svc.matching_d'), color: 'from-green-500 to-green-600' },
    { icon: MessageCircle, title: t('svc.chat'), desc: t('svc.chat_d'), color: 'from-purple-500 to-purple-600' },
    { icon: Bell, title: t('svc.notif'), desc: t('svc.notif_d'), color: 'from-orange-500 to-orange-600' },
    { icon: ShieldCheck, title: t('svc.verify'), desc: t('svc.verify_d'), color: 'from-teal-500 to-teal-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ═══ HERO with images ═══ */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl mb-12">
        <div className="grid grid-cols-2 h-48 sm:h-64">
          <div className="relative overflow-hidden">
            <Image
              src="/images/benjamin-mkapa-hospital.jpg"
              alt="Hospitali"
              width={800}
              height={500}
              className="w-full h-full object-cover"
              unoptimized
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/90 to-brand-blue/60" />
          </div>
          <div className="relative overflow-hidden">
            <Image
              src="/images/elboru-school.jpg"
              alt="Shule"
              width={800}
              height={500}
              className="w-full h-full object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-l from-brand-blue/90 to-brand-blue/60" />
          </div>
        </div>
        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <span className="inline-flex items-center rounded-full bg-white/20 border border-white/30 px-3 py-1 text-xs font-semibold text-white mb-3 backdrop-blur-sm">
              {t('svc.badge')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 drop-shadow-lg">
              {t('svc.title')}
            </h1>
            <p className="text-white/80 max-w-2xl mx-auto text-sm sm:text-base drop-shadow">
              {t('svc.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ HUDUMA — cards za kisomi ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s, i) => (
          <div
            key={s.title}
            className="card group hover:shadow-lg transition-all duration-300 flex flex-col border border-brand-grey-100 hover:border-brand-blue-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-lg transition group-hover:scale-110`}>
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

      {/* ═══ HOW IT WORKS ═══ */}
      <div className="mt-16 mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-grey-900 dark:text-white text-center mb-8">
          Jinsi Inavyofanya Kazi
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { n: '01', title: 'Jisajili', desc: 'Ingiza taarifa zako: jina, simu, kada, na kituo chako' },
            { n: '02', title: 'Tafuta Mwenza', desc: 'mfumo unakuletea mtu anayetaka kubadilishana na wewe' },
            { n: '03', title: 'Kubaliana', desc: 'Ongea naye, kubaliana, na badilishana kwa urahisi' },
          ].map((step) => (
            <div key={step.n} className="text-center p-6 rounded-xl border border-brand-grey-200 dark:border-brand-grey-600 bg-white dark:bg-brand-grey-900">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-lg mb-4">
                {step.n}
              </div>
              <h3 className="font-bold text-brand-grey-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CTA ═══ */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl">
        <div className="grid grid-cols-2 h-32 sm:h-40">
          <div className="relative overflow-hidden">
            <Image src="/images/benjamin-mkapa-hospital.jpg" alt="" width={800} height={500} className="w-full h-full object-cover" unoptimized />
            <div className="absolute inset-0 bg-brand-blue/80" />
          </div>
          <div className="relative overflow-hidden">
            <Image src="/images/elboru-school.jpg" alt="" width={800} height={500} className="w-full h-full object-cover" unoptimized />
            <div className="absolute inset-0 bg-brand-blue/80" />
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-brand-blue/70">
          <div className="text-center px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{t('landing.cta_title')}</h2>
            <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto mb-6">
              {t('landing.cta_body')}
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3 text-sm sm:text-base text-brand-blue font-bold shadow-xl hover:bg-brand-grey-50 transition"
            >
              <Users size={18} />
              {t('landing.register_now')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
