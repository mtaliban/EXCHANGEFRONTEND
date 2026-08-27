'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { ArrowRight, CheckCircle2, Users, MapPin, ArrowLeftRight } from 'lucide-react';

export default function HomePage() {
  const t = useT();
  return (
    <div className="bg-white dark:bg-brand-grey-950">
      {/* JSON-LD Structured Data — Google inaelewa site vizuri zaidi */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Kubadilishana Vituo',
          alternateName: 'Kubadilishana Vituo Tanzania',
          url: 'https://esstranfer.com',
          description: 'Kubadilishana Portal — Tafuta mtu wa kubadilishana naye vituo vya kazi Tanzania. Bure kwa Walimu, Madaktari, Wauguzi, Wafanyakazi wa Kilimo na watumishi wote wa serikali.',
          inLanguage: 'sw',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://esstranfer.com/search?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Kubadilishana Vituo',
            url: 'https://esstranfer.com',
            logo: {
              '@type': 'ImageObject',
              url: 'https://esstranfer.com/images/LOGOL.jpeg',
            },
          },
          about: {
            '@type': 'Thing',
            name: 'Kubadilishana Vituo Tanzania',
            description: 'Mfumo wa kubadilishana vituo vya kazi kwa watumishi wa serikali Tanzania — walimu, wauguzi, madaktari, wafanyakazi wa kilimo na watumishi wa umma',
          },
        }) }}
      />
      {/* FAQ Schema — Google inapenda maswali ya mara kwa mara */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Kubadilishana Vituo ni nini?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Kubadilishana Vituo ni mfumo rasmi wa mtandaoni unaowasaidia watumishi wa serikali Tanzania (walimu, wauguzi, madaktari, n.k.) kutafuta mtu wa kubadilishana naye vituo vya kazi. Mtumiaji anaandika anapofanya kazi na anataka kwenda, mfumo unamtafutia mtu wa kubadilishana naye.',
              },
            },
            {
              '@type': 'Question',
              name: 'Je, huduma ni ya bure?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Ndiyo, kujiandikisha na kutafuta mtu wa kubadilishana ni bure kabisa. Kuna chaguo la kuchangia kwa mtaji wa mfumo.',
              },
            },
            {
              '@type': 'Question',
              name: 'Nani anatumia Kubadilishana Vituo?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Watumishi wote wa serikali wa Tanzania: Walimu wa Msingi, Walimu wa Sekondari, Madaktari, Wauguzi, Wauguzi wa Maabara, Wauguzi wa Meno, Afisa wa Afya, Msaidizi wa Afya, Afisa wa Kilimo, Msaidizi wa Kilimo, na watumishi wote wa umma. Huduma ni bure kabisa.',
              },
            },
            {
              '@type': 'Question',
              name: 'Jinsi gani ninapata mtu wa kubadilishana naye?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Baada ya kujisajili na kuingia, dashibodi yako inakuletea watu ambao wako mkoani na wanataka kwenda mkoa wako, au wako mkoani unakotaka kwenda. Unaweza kuwasiliana nao kupitia simu, SMS au WhatsApp moja kwa moja.',
              },
            },
            {
              '@type': 'Question',
              name: 'Je, Kubadilishana Portal inasaidia kada gani?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Kubadilishana Portal inasaidia kada zote: Walimu (Msingi na Sekondari), Wauguzi, Madaktari, Wauguzi wa Maabara, Wauguzi wa Meno, Afisa wa Afya, Msaidizi wa Afya, Afisa wa Kilimo, na watumishi wote wa serikali Tanzania. Chagua kada yako na mkoa wako, mfumo utafute mwenzie.',
              },
            },
          ],
        }) }}
      />
      {/* ═══ HERO — safi, nyeupe, hakuna bluu ya background ═══ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-grey-900 dark:text-white leading-tight mb-4">
          {t('landing.title1')}{' '}
          <span className="text-brand-blue">{t('landing.title2')}</span>
        </h1>
        <p className="text-base sm:text-lg text-brand-grey-500 dark:text-brand-grey-400 mb-8 max-w-2xl mx-auto leading-relaxed">
          {t('landing.subtitle')}
        </p>

        {/* hatua 3 */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[t('landing.step1'), t('landing.step2'), t('landing.step3')].map((txt) => (
            <span key={txt} className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-grey-700 dark:text-brand-grey-300 bg-brand-grey-50 dark:bg-brand-grey-800 rounded-full px-3 py-1.5 border border-brand-grey-200 dark:border-brand-grey-700">
              <CheckCircle2 size={14} className="text-brand-blue" />
              {txt}
            </span>
          ))}
        </div>

        {/* buttons — bluu tu kwenye CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="btn-primary text-sm">
            {t('landing.cta')}
            <ArrowRight size={16} />
          </Link>
          <Link href="/services" className="btn-outline text-sm">
            {t('landing.services')}
          </Link>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="border-y border-brand-grey-100 dark:border-brand-grey-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { num: '26', label: t('landing.stat_regions') },
              { num: '188', label: t('landing.stat_districts') },
              { num: '25,000+', label: t('landing.stat_schools') },
              { num: '14,000+', label: t('landing.stat_facilities') },
            ].map((s) => (
              <div key={s.label} className="text-center p-4 rounded-xl border border-brand-grey-200 dark:border-brand-grey-700 bg-brand-grey-50 dark:bg-brand-grey-900">
                <div className="text-xl sm:text-2xl font-extrabold text-brand-blue">{s.num}</div>
                <div className="text-xs text-brand-grey-500 dark:text-brand-grey-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ JINSI INAVYOFANYA KAZI ═══ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-grey-900 dark:text-white text-center mb-2">{t('landing.how_title')}</h2>
        <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400 text-center mb-8">{t('landing.how_sub')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { n: 1, title: t('landing.step1'), desc: t('landing.step1d') },
            { n: 2, title: t('landing.step2'), desc: t('landing.step2d') },
            { n: 3, title: t('landing.step3'), desc: t('landing.step3d') },
            { n: 4, title: t('landing.step4'), desc: t('landing.step4d') },
          ].map((step) => (
            <div key={step.n} className="rounded-xl border border-brand-grey-200 dark:border-brand-grey-700 bg-white dark:bg-brand-grey-900 p-5 hover:shadow-md transition">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white bg-brand-blue mb-3">
                {step.n}
              </div>
              <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1 text-sm">{step.title}</h3>
              <p className="text-xs text-brand-grey-500 dark:text-brand-grey-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA — mwisho — hakuna bluu ya background ═══ */}
      <section className="border-t border-brand-grey-100 dark:border-brand-grey-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-grey-900 dark:text-white mb-3">{t('landing.cta_title')}</h2>
          <p className="text-sm sm:text-base text-brand-grey-500 dark:text-brand-grey-400 mb-6 max-w-2xl mx-auto">
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
