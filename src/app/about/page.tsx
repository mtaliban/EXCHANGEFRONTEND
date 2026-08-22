'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { Target, AlertTriangle, Lightbulb, GraduationCap, Award, Phone, MapPin, ArrowRight, Users, Heart, Stethoscope, BookOpen, Building2, Wheat } from 'lucide-react';

export default function AboutPage() {
  const t = useT();

  const team = [
    {
      initials: 'HH',
      name: t('about.team1_name'),
      role: t('about.team1_role'),
      bio: t('about.team1_bio'),
      uni: t('about.team1_uni'),
      prog: t('about.team1_prog'),
      grad: t('about.team1_grad'),
      callLabel: t('about.team1_call'),
      phone: '+255625607088',
      phoneDisplay: '+255 625 607 088',
    },
    {
      initials: 'HS',
      name: t('about.team2_name'),
      role: t('about.team2_role'),
      bio: t('about.team2_bio'),
      uni: t('about.team2_uni'),
      prog: t('about.team2_prog'),
      grad: t('about.team2_grad'),
      callLabel: t('about.team2_call'),
      phone: '+255763795801',
      phoneDisplay: '+255 763 795 801',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ═══ HERO ═══ */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center rounded-full bg-brand-blue-50 border border-brand-blue-100 px-3 py-1 text-xs font-semibold text-brand-blue mb-3">
          {t('about.badge')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-grey-900 dark:text-white">
          {t('about.title')}
        </h1>
      </div>

      {/* ═══ HUDUMA ZETU — Aina za Watumishi ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {/* Afya */}
        <div className="card flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
            <Stethoscope size={24} />
          </div>
          <div>
            <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1">Afya</h3>
            <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400 leading-relaxed">
              Wataalamu wa afya kama madaktari, wauguzi, wataalamu wa maabara, na watoa huduma za dawa. Wanatumia mfumo huu kuchangia na kuchagua vituo vya afya wanavyotaka kuhamia.
            </p>
          </div>
        </div>

        {/* Elimu */}
        <div className="card flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1">Elimu</h3>
            <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400 leading-relaxed">
              Walimu wa elimu ya msingi na sekondari, pamoja na wataalamu wengine wa elimu. Wanachagua shule wanazotaka kuhamia na kuweka utaalamu wao.
            </p>
          </div>
        </div>

        {/* Watumishi wa Umma */}
        <div className="card flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1">Watumishi wa Umma</h3>
            <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400 leading-relaxed">
              Maafisa na watumishi wa serikali katika idara mbalimbali — uhasibu, TEHAMA, utawala, na nyingine. Wanachagua mikoa na wilaya wanazotaka kuhamia.
            </p>
          </div>
        </div>

        {/* Afisa Kilimo */}
        <div className="card flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Wheat size={24} />
          </div>
          <div>
            <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1">Afisa Kilimo</h3>
            <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400 leading-relaxed">
              Maafisa kilimo, wakulima wa kitaalamu, na wataalamu wa mifugo. Wanachagua mikoa na wilaya wanazotaka kuhamia ili kuboresha kilimo na ufugaji.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ NIA / TATIZO / SULUHISHO ═══ */}
      <div className="space-y-5 mb-12">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-brand-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0">
              <Target size={20} />
            </div>
            <h2 className="text-xl font-bold text-brand-grey-900 dark:text-white">{t('about.mission_title')}</h2>
          </div>
          <p className="text-brand-grey-600 dark:text-brand-grey-300 leading-relaxed">{t('about.mission_body')}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-xl font-bold text-brand-grey-900 dark:text-white">{t('about.problem_title')}</h2>
          </div>
          <ul className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-start gap-2.5 text-brand-grey-600 dark:text-brand-grey-300">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                <span>{t(`about.problem${i}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-500 flex items-center justify-center flex-shrink-0">
              <Lightbulb size={20} />
            </div>
            <h2 className="text-xl font-bold text-brand-grey-900 dark:text-white">{t('about.solution_title')}</h2>
          </div>
          <p className="text-brand-grey-600 dark:text-brand-grey-300 leading-relaxed">{t('about.solution_body')}</p>
        </div>
      </div>

      {/* ═══ TIMU ═══ */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-grey-900 dark:text-white mb-2">
            {t('about.team_title')}
          </h2>
          <p className="text-brand-grey-500 dark:text-brand-grey-400 max-w-2xl mx-auto text-sm sm:text-base">
            {t('about.team_sub')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {team.map((p) => (
            <div key={p.name} className="card flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                  {p.initials}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-grey-900 dark:text-white">{p.name}</h3>
                  <span className="inline-flex items-center rounded-full bg-brand-blue-50 border border-brand-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-blue uppercase tracking-wide mt-1">
                    {p.role}
                  </span>
                </div>
              </div>

              <p className="text-sm text-brand-grey-600 dark:text-brand-grey-300 leading-relaxed mb-5">
                {p.bio}
              </p>

              <div className="space-y-2 text-sm text-brand-grey-600 dark:text-brand-grey-300 mb-5 mt-auto">
                <p className="flex items-start gap-2">
                  <GraduationCap size={16} className="text-brand-blue flex-shrink-0 mt-0.5" />
                  <span><span className="font-semibold text-brand-grey-800 dark:text-brand-grey-200">{p.uni}</span> · {p.prog}</span>
                </p>
                <p className="flex items-start gap-2">
                  <Award size={16} className="text-brand-blue flex-shrink-0 mt-0.5" />
                  <span>{p.grad}</span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin size={16} className="text-brand-blue flex-shrink-0 mt-0.5" />
                  <span>Dodoma, Tanzania</span>
                </p>
              </div>

              <a
                href={`tel:${p.phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-700 transition"
              >
                <Phone size={15} />
                {p.callLabel} — {p.phoneDisplay}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
