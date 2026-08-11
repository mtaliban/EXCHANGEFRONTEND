'use client';

import Image from 'next/image';
import { useT } from '@/lib/i18n';

export default function AboutPage() {
  const t = useT();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <span className="badge-gold mb-3">{t('about.badge')}</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-grey-900 dark:text-white">{t('about.title')}</h1>
      </div>

      {/* Hospital / school imagery — kutambulisha wanaohudumiwa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="relative rounded-2xl overflow-hidden shadow-lg group">
          <Image
            src="/images/hospital.jpg"
            alt="Vituo vya Afya Tanzania"
            width={700}
            height={450}
            className="w-full h-52 sm:h-56 object-cover transition duration-500 group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-900/70 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 text-white font-semibold text-sm">
            🏥 Vituo vya Afya 14,000+
          </div>
        </div>
        <div className="relative rounded-2xl overflow-hidden shadow-lg group">
          <Image
            src="/images/school-classroom.jpg"
            alt="Shule za Tanzania"
            width={700}
            height={450}
            className="w-full h-52 sm:h-56 object-cover transition duration-500 group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-orange-900/70 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 text-white font-semibold text-sm">
            🏫 Shule 25,000+
          </div>
        </div>
      </div>

      <div className="prose max-w-none space-y-6 text-brand-grey-700 dark:text-brand-grey-300">
        <div className="card">
          <h2 className="text-2xl font-bold text-brand-blue mb-3">{t('about.mission_title')}</h2>
          <p>{t('about.mission_body')}</p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-brand-orange mb-3">{t('about.problem_title')}</h2>
          <ul className="space-y-2 list-disc pl-6">
            <li>{t('about.problem1')}</li>
            <li>{t('about.problem2')}</li>
            <li>{t('about.problem3')}</li>
            <li>{t('about.problem4')}</li>
          </ul>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-brand-red mb-3">{t('about.solution_title')}</h2>
          <p>{t('about.solution_body')}</p>
        </div>
      </div>
    </div>
  );
}
