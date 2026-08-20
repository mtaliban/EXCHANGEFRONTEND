'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/lib/i18n';

/* ── tiny SVG icons so the hero doesn't need an icon library ── */
const IconRocket = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);
const IconArrow = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);
const IconCheck = () => (
  <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconServices = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
);

export default function HomePage() {
  const t = useT();
  return (
    <>
      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-blue to-brand-blue-700">
        {/* subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* ── Left: Copy ── */}
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 backdrop-blur-sm mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {t('landing.badge')}
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white mb-4">
                {t('landing.title1')}{' '}
                <span className="bg-gradient-to-r from-brand-gold-400 to-brand-orange bg-clip-text text-transparent">
                  {t('landing.title2')}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-blue-100/80 mb-8 max-w-xl leading-relaxed">
                {t('landing.subtitle')}
              </p>

              {/* quick-benefit chips */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[t('landing.step1'), t('landing.step2'), t('landing.step3')].map((txt) => (
                  <span key={txt} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 bg-white/10 rounded-full px-3 py-1.5 backdrop-blur-sm border border-white/10">
                    <IconCheck />
                    {txt}
                  </span>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-brand-navy shadow-lg hover:shadow-xl hover:bg-brand-grey-50 transition-all duration-200"
                >
                  <IconRocket />
                  {t('landing.cta')}
                  <span className="group-hover:translate-x-0.5 transition-transform"><IconArrow /></span>
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
                >
                  <IconServices />
                  {t('landing.services')}
                </Link>
              </div>
            </div>

            {/* ── Right: Image cards ── */}
            <div className="relative">
              {/* glow behind cards */}
              <div className="absolute -inset-4 bg-brand-blue-500/30 rounded-3xl blur-3xl" />

              <div className="relative grid grid-cols-2 gap-3 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20">
                <div className="relative h-56 sm:h-72 group overflow-hidden">
                  <Image
                    src="/images/benjamin-mkapa-hospital.jpg"
                    alt="Hospitali ya Benjamin Mkapa"
                    fill
                    priority
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-2.5 right-2.5">
                    <span className="text-[10px] sm:text-[11px] font-bold bg-white/95 text-brand-navy px-3 py-1.5 rounded-lg shadow-lg block text-center leading-tight backdrop-blur-sm">
                      🏥 Hospitali ya<br className="sm:hidden" /> Benjamin Mkapa
                    </span>
                  </div>
                </div>
                <div className="relative h-56 sm:h-72 group overflow-hidden">
                  <Image
                    src="/images/elboru-school.jpg"
                    alt="Shule ya Elboru"
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-2.5 right-2.5">
                    <span className="text-[10px] sm:text-[11px] font-bold bg-white/95 text-brand-navy px-3 py-1.5 rounded-lg shadow-lg block text-center leading-tight backdrop-blur-sm">
                      Shule ya Elboru
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ STATS ═══════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-5 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { num: '26', label: t('landing.stat_regions') },
            { num: '188', label: t('landing.stat_districts') },
            { num: '25,000+', label: t('landing.stat_schools') },
            { num: '14,000+', label: t('landing.stat_facilities') },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-brand-grey-200 dark:border-brand-grey-600 bg-white dark:bg-brand-grey-900 p-4 text-center shadow-soft hover:shadow-md transition-shadow">
              <div className="text-xl sm:text-2xl font-extrabold text-brand-blue">{s.num}</div>
              <div className="text-xs text-brand-grey-500 dark:text-brand-grey-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
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
              <div key={step.n} className="rounded-xl border border-brand-grey-200 dark:border-brand-grey-600 bg-white dark:bg-brand-grey-900 p-4 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-3 bg-gradient-to-br from-brand-blue to-brand-blue-700 shadow-lg shadow-brand-blue/25">
                  {step.n}
                </div>
                <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1 text-sm sm:text-base">{step.title}</h3>
                <p className="text-xs sm:text-sm text-brand-grey-500 dark:text-brand-grey-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CTA ═══════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-navy via-brand-blue to-brand-blue-700">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">{t('landing.cta_title')}</h2>
          <p className="text-sm sm:text-base text-blue-100/80 mb-6 max-w-2xl mx-auto">
            {t('landing.cta_body')}
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-1.5 text-xs text-brand-navy font-bold shadow-lg hover:shadow-xl hover:bg-brand-grey-50 transition-all duration-200"
          >
            <IconRocket />
            {t('landing.register_now')}
            <span className="group-hover:translate-x-0.5 transition-transform"><IconArrow /></span>
          </Link>
        </div>
      </section>
    </>
  );
}
