'use client';

import { useT } from '@/lib/i18n';
import { Target, AlertTriangle, Lightbulb, GraduationCap, Award, Phone, MapPin, Users, Stethoscope, Building2, Wheat } from 'lucide-react';

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
    <div className="bg-white dark:bg-brand-grey-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ═══ TITLE ═══ */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-grey-900 dark:text-white">
            {t('about.title')}
          </h1>
        </div>

        {/* ═══ HUDUMA ZETU — Aina za Watumishi ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="card flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0">
              <GraduationCap size={20} />
            </div>
            <div>
              <h3 className="font-bold text-brand-grey-900 dark:text-white text-sm mb-0.5">Walimu</h3>
              <p className="text-xs text-brand-grey-500 dark:text-brand-grey-400 leading-relaxed">
                Walimu wa elimu ya msingi na sekondari — lugha, hisabati, sayansi, na masomo mengine.
              </p>
            </div>
          </div>

          <div className="card flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
              <Stethoscope size={20} />
            </div>
            <div>
              <h3 className="font-bold text-brand-grey-900 dark:text-white text-sm mb-0.5">Watumishi wa Afya</h3>
              <p className="text-xs text-brand-grey-500 dark:text-brand-grey-400 leading-relaxed">
                Madaktari, wauguzi, wataalamu wa maabara, na watoa huduma za dawa.
              </p>
            </div>
          </div>

          <div className="card flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-brand-grey-900 dark:text-white text-sm mb-0.5">Watumishi wa Umma</h3>
              <p className="text-xs text-brand-grey-500 dark:text-brand-grey-400 leading-relaxed">
                Maafisa na watumishi wa serikali — uhasibu, TEHAMA, utawala.
              </p>
            </div>
          </div>

          <div className="card flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Wheat size={20} />
            </div>
            <div>
              <h3 className="font-bold text-brand-grey-900 dark:text-white text-sm mb-0.5">Wafanyakazi wa Kilimo</h3>
              <p className="text-xs text-brand-grey-500 dark:text-brand-grey-400 leading-relaxed">
                Maafisa kilimo, wakulima wa kitaalamu, na wataalamu wa mifugo.
              </p>
            </div>
          </div>
        </div>

        {/* ═══ NIA / TATIZO / SULUHISHO ═══ */}
        <div className="space-y-4 mb-12">
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-brand-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0">
                <Target size={18} />
              </div>
              <h2 className="text-lg font-bold text-brand-grey-900 dark:text-white">{t('about.mission_title')}</h2>
            </div>
            <p className="text-sm text-brand-grey-600 dark:text-brand-grey-300 leading-relaxed">{t('about.mission_body')}</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              <h2 className="text-lg font-bold text-brand-grey-900 dark:text-white">{t('about.problem_title')}</h2>
            </div>
            <ul className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-brand-grey-600 dark:text-brand-grey-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                  <span>{t(`about.problem${i}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-green-50 text-green-500 flex items-center justify-center flex-shrink-0">
                <Lightbulb size={18} />
              </div>
              <h2 className="text-lg font-bold text-brand-grey-900 dark:text-white">{t('about.solution_title')}</h2>
            </div>
            <p className="text-sm text-brand-grey-600 dark:text-brand-grey-300 leading-relaxed">{t('about.solution_body')}</p>
          </div>
        </div>

        {/* ═══ TIMU ═══ */}
        <div>
          <h2 className="text-2xl font-bold text-brand-grey-900 dark:text-white text-center mb-6">
            {t('about.team_title')}
          </h2>
          <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400 text-center mb-8 max-w-2xl mx-auto">
            {t('about.team_sub')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {team.map((p) => (
              <div key={p.name} className="card flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-brand-grey-200 dark:bg-brand-grey-700 text-brand-grey-700 dark:text-brand-grey-200 flex items-center justify-center font-bold text-base flex-shrink-0">
                    {p.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-grey-900 dark:text-white">{p.name}</h3>
                    <span className="text-[11px] font-semibold text-brand-blue">{p.role}</span>
                  </div>
                </div>

                <p className="text-sm text-brand-grey-600 dark:text-brand-grey-300 leading-relaxed mb-4">
                  {p.bio}
                </p>

                <div className="space-y-1.5 text-xs text-brand-grey-600 dark:text-brand-grey-300 mb-4 mt-auto">
                  <p className="flex items-center gap-2">
                    <GraduationCap size={14} className="text-brand-grey-400 flex-shrink-0" />
                    <span><span className="font-semibold">{p.uni}</span> · {p.prog}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Award size={14} className="text-brand-grey-400 flex-shrink-0" />
                    <span>{p.grad}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="text-brand-grey-400 flex-shrink-0" />
                    <span>Dodoma, Tanzania</span>
                  </p>
                </div>

                <a
                  href={`tel:${p.phone}`}
                  className="btn-primary text-sm justify-center"
                >
                  <Phone size={14} />
                  {p.callLabel} — {p.phoneDisplay}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
