'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/lib/i18n';

export default function HomePage() {
  const t = useT();
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-blue via-brand-blue-700 to-brand-blue-900 text-white">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 rounded-full bg-brand-orange opacity-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 rounded-full bg-brand-gold opacity-20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="badge-gold whitespace-nowrap">{t('landing.badge')}</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full bg-green-500/20 border border-green-400/40 text-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {t('landing.live_badge')}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
                {t('landing.title1')} <span className="text-brand-orange">{t('landing.title2')}</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-brand-blue-100 mb-8">
                {t('landing.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/register" className="btn-accent text-base sm:text-lg px-6 sm:px-8 py-3 text-center w-full sm:w-auto">
                  {t('landing.cta')}
                </Link>
                <Link href="/services" className="inline-flex items-center justify-center rounded-lg border-2 border-white/40 px-6 sm:px-8 py-3 text-white font-medium hover:bg-white/10 transition w-full sm:w-auto">
                  {t('landing.services')}
                </Link>
              </div>
            </div>
            {/* Hospital / school imagery — inatambulisha system */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-brand-orange/30 to-brand-gold/30 blur-2xl rounded-3xl" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20">
                <Image
                  src="/images/hospital.jpg"
                  alt="Hospitali ya Tanzania"
                  width={900}
                  height={600}
                  className="w-full h-64 sm:h-80 object-cover"
                  priority
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
                  <span className="text-[11px] font-semibold bg-white/95 text-brand-blue px-3 py-1.5 rounded-full shadow whitespace-nowrap">
                    🏥 Hospitali 14,000+
                  </span>
                  <span className="text-[11px] font-semibold bg-white/95 text-brand-orange px-3 py-1.5 rounded-full shadow whitespace-nowrap">
                    🏫 Shule 25,000+
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { num: '26', label: t('landing.stat_regions') },
            { num: '188', label: t('landing.stat_districts') },
            { num: '25,000+', label: t('landing.stat_schools') },
            { num: '14,000+', label: t('landing.stat_facilities') },
          ].map((s) => (
            <div key={s.label} className="card text-center">
              <div className="text-2xl sm:text-3xl font-bold text-brand-blue">{s.num}</div>
              <div className="text-xs sm:text-sm text-brand-grey-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-grey-900 dark:text-white mb-3">{t('landing.how_title')}</h2>
          <p className="text-sm sm:text-base text-brand-grey-500 dark:text-brand-grey-400">{t('landing.how_sub')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { n: 1, color: 'blue', title: t('landing.step1'), desc: t('landing.step1d') },
            { n: 2, color: 'orange', title: t('landing.step2'), desc: t('landing.step2d') },
            { n: 3, color: 'red', title: t('landing.step3'), desc: t('landing.step3d') },
            { n: 4, color: 'gold', title: t('landing.step4'), desc: t('landing.step4d') },
          ].map((step) => (
            <div key={step.n} className="card">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mb-4 bg-brand-${step.color}`}>
                {step.n}
              </div>
              <h3 className="font-bold text-brand-grey-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-orange to-brand-red text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t('landing.cta_title')}</h2>
          <p className="text-sm sm:text-base text-white/90 mb-6 max-w-2xl mx-auto">
            {t('landing.cta_body')}
          </p>
          <Link href="/register" className="inline-flex items-center justify-center rounded-lg bg-white px-6 sm:px-8 py-3 text-brand-red font-bold shadow-lg hover:bg-brand-gold-100 transition w-full sm:w-auto">
            {t('landing.register_now')}
          </Link>
        </div>
      </section>
    </>
  );
}
