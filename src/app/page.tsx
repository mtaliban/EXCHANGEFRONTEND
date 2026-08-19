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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-blue-50 border border-brand-blue-100 text-brand-blue">
                  {t('landing.badge')}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-brand-grey-900 dark:text-white">
                {t('landing.title1')} <span className="text-brand-blue">{t('landing.title2')}</span>
              </h1>
              <p className="text-base sm:text-lg text-brand-grey-600 dark:text-brand-grey-300 mb-6">
                {t('landing.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/register" className="inline-flex items-center justify-center rounded-lg bg-brand-blue px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-soft hover:bg-brand-blue-700 transition w-full sm:w-auto">
                  {t('landing.cta')}
                </Link>
                <Link href="/services" className="inline-flex items-center justify-center rounded-lg border border-brand-grey-300 dark:border-brand-grey-600 px-6 py-3 text-sm sm:text-base text-brand-grey-900 dark:text-white font-medium hover:bg-brand-grey-50 dark:hover:bg-brand-grey-800 transition w-full sm:w-auto">
                  {t('landing.services')}
                </Link>
              </div>
            </div>
            {/* Picha moja iliyogawanywa: hospitali + shule/walimu */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-brand-grey-200 dark:ring-brand-grey-600 grid grid-cols-2">
              <div className="relative h-52 sm:h-72">
                <Image
                  src="/images/benjamin-mkapa-hospital.jpg"
                  alt="Hospitali ya Benjamin Mkapa"
                  fill
                  priority
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-grey-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-center">
                  <span className="text-[9px] sm:text-[10px] font-semibold bg-white text-brand-grey-900 px-2 py-1 rounded-full shadow text-center leading-tight">
                    Hospitali ya<br className="sm:hidden" /> Benjamin Mkapa
                  </span>
                </div>
              </div>
              <div className="relative h-52 sm:h-72">
                <Image
                  src="/images/elboru-school.jpg"
                  alt="Shule ya Elboru"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-grey-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-center">
                  <span className="text-[9px] sm:text-[10px] font-semibold bg-white text-brand-grey-900 px-2 py-1 rounded-full shadow text-center leading-tight">
                    Shule ya Elboru
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats — compact */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { num: '26', label: t('landing.stat_regions') },
            { num: '188', label: t('landing.stat_districts') },
            { num: '25,000+', label: t('landing.stat_schools') },
            { num: '14,000+', label: t('landing.stat_facilities') },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-brand-grey-200 dark:border-brand-grey-600 bg-white dark:bg-brand-grey-900 p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-brand-blue">{s.num}</div>
              <div className="text-xs text-brand-grey-500 dark:text-brand-grey-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — compact */}
      <section className="bg-brand-grey-50 dark:bg-brand-grey-900/50 border-y border-brand-grey-200 dark:border-brand-grey-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-grey-900 dark:text-white mb-1.5">{t('landing.how_title')}</h2>
            <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400">{t('landing.how_sub')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: 1, title: t('landing.step1'), desc: t('landing.step1d') },
              { n: 2, title: t('landing.step2'), desc: t('landing.step2d') },
              { n: 3, title: t('landing.step3'), desc: t('landing.step3d') },
              { n: 4, title: t('landing.step4'), desc: t('landing.step4d') },
            ].map((step) => (
              <div key={step.n} className="rounded-xl border border-brand-grey-200 dark:border-brand-grey-600 bg-white dark:bg-brand-grey-900 p-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-3 bg-brand-blue">
                  {step.n}
                </div>
                <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1 text-sm sm:text-base">{step.title}</h3>
                <p className="text-xs sm:text-sm text-brand-grey-500 dark:text-brand-grey-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — ndogo */}
      <section className="bg-brand-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">{t('landing.cta_title')}</h2>
          <p className="text-sm sm:text-base text-brand-blue-100 mb-5 max-w-2xl mx-auto">
            {t('landing.cta_body')}
          </p>
          <Link href="/register" className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-sm sm:text-base text-brand-blue font-semibold shadow-lg hover:bg-brand-grey-50 transition w-full sm:w-auto">
            {t('landing.register_now')}
          </Link>
        </div>
      </section>
    </>
  );
}
