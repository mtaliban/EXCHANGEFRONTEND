'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/lib/i18n';

export default function HomePage() {
  const t = useT();
  return (
    <>
      {/* Hero — nyeupe safi, official, kisomi (hakuna rangi za ajabu) */}
      <section className="bg-white dark:bg-brand-grey-950 border-b border-brand-grey-200 dark:border-brand-grey-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-blue-50 border border-brand-blue-100 text-brand-blue">
                  {t('landing.badge')}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-brand-grey-900 dark:text-white">
                {t('landing.title1')} <span className="text-brand-blue">{t('landing.title2')}</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-brand-grey-600 dark:text-brand-grey-300 mb-8">
                {t('landing.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/register" className="btn-primary text-sm sm:text-base px-5 sm:px-6 py-2.5 text-center w-full sm:w-auto">
                  {t('landing.cta')}
                </Link>
                <Link href="/services" className="inline-flex items-center justify-center rounded-lg border border-brand-grey-300 dark:border-brand-grey-600 px-5 sm:px-6 py-2.5 text-sm sm:text-base text-brand-grey-900 dark:text-white font-medium hover:bg-brand-grey-50 dark:hover:bg-brand-grey-800 transition w-full sm:w-auto">
                  {t('landing.services')}
                </Link>
              </div>
            </div>
            {/* Hospital / school imagery — inatambulisha system */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-lg ring-1 ring-brand-grey-200 dark:ring-brand-grey-600">
                <Image
                  src="/images/hospital.jpg"
                  alt="Hospitali ya Tanzania"
                  width={900}
                  height={600}
                  className="w-full h-64 sm:h-80 object-cover"
                  priority
                  unoptimized
                />
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
                  <span className="text-[11px] font-semibold bg-white text-brand-grey-900 px-3 py-1.5 rounded-full shadow whitespace-nowrap">
                    Vituo vya Afya 14,000+
                  </span>
                  <span className="text-[11px] font-semibold bg-white text-brand-grey-900 px-3 py-1.5 rounded-full shadow whitespace-nowrap">
                    Shule 25,000+
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { num: '26', label: t('landing.stat_regions') },
            { num: '188', label: t('landing.stat_districts') },
            { num: '25,000+', label: t('landing.stat_schools') },
            { num: '14,000+', label: t('landing.stat_facilities') },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-brand-grey-200 dark:border-brand-grey-600 bg-white dark:bg-brand-grey-900 p-5 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-brand-blue">{s.num}</div>
              <div className="text-xs sm:text-sm text-brand-grey-500 dark:text-brand-grey-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-brand-grey-50 dark:bg-brand-grey-900/50 border-y border-brand-grey-200 dark:border-brand-grey-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-grey-900 dark:text-white mb-3">{t('landing.how_title')}</h2>
            <p className="text-sm sm:text-base text-brand-grey-500 dark:text-brand-grey-400">{t('landing.how_sub')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: 1, title: t('landing.step1'), desc: t('landing.step1d') },
              { n: 2, title: t('landing.step2'), desc: t('landing.step2d') },
              { n: 3, title: t('landing.step3'), desc: t('landing.step3d') },
              { n: 4, title: t('landing.step4'), desc: t('landing.step4d') },
            ].map((step) => (
              <div key={step.n} className="rounded-xl border border-brand-grey-200 dark:border-brand-grey-600 bg-white dark:bg-brand-grey-900 p-5">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mb-4 bg-brand-blue">
                  {step.n}
                </div>
                <h3 className="font-bold text-brand-grey-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t('landing.cta_title')}</h2>
          <p className="text-sm sm:text-base text-brand-blue-100 mb-6 max-w-2xl mx-auto">
            {t('landing.cta_body')}
          </p>
          <Link href="/register" className="inline-flex items-center justify-center rounded-lg bg-white px-5 sm:px-6 py-2.5 text-sm sm:text-base text-brand-blue font-bold shadow-lg hover:bg-brand-grey-50 transition w-full sm:w-auto">
            {t('landing.register_now')}
          </Link>
        </div>
      </section>
    </>
  );
}
