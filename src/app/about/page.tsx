'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { Target, AlertTriangle, Lightbulb, GraduationCap, Award, Phone, MapPin, ArrowRight, Users, Heart } from 'lucide-react';

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

      {/* ═══ PICHA — Watumishi wa Serikali ═══ */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-brand-grey-200 dark:ring-brand-grey-600 mb-10">
        <div className="grid grid-cols-2">
          <div className="relative h-56 sm:h-72 group overflow-hidden">
            <Image src="/images/benjamin-mkapa-hospital.jpg" alt="Hospitali" fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="50vw" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <span className="text-[10px] sm:text-[11px] font-bold bg-white/95 text-brand-navy px-3 py-1.5 rounded-lg shadow-lg block text-center">🏥 Afisa Afya</span>
            </div>
          </div>
          <div className="relative h-56 sm:h-72 group overflow-hidden">
            <Image src="/images/elboru-school.jpg" alt="Shule" fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <span className="text-[10px] sm:text-[11px] font-bold bg-white/95 text-brand-navy px-3 py-1.5 rounded-lg shadow-lg block text-center">📚 Mwalimu</span>
            </div>
          </div>
          <div className="relative h-40 sm:h-52 group overflow-hidden">
            <Image src="/images/school.jpg" alt="Shule" fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <span className="text-[9px] sm:text-[10px] font-bold bg-white/95 text-brand-navy px-2 py-1 rounded-lg shadow-lg block text-center">🏫 Afisa Elimu</span>
            </div>
          </div>
          <div className="relative h-40 sm:h-52 group overflow-hidden">
            <Image src="/images/hospital.jpg" alt="Kituo cha Afya" fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <span className="text-[9px] sm:text-[10px] font-bold bg-white/95 text-brand-navy px-2 py-1 rounded-lg shadow-lg block text-center">🌾 Afisa Kilimo</span>
            </div>
          </div>
        </div>
        {/* Stats overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          <span className="bg-white/90 backdrop-blur-sm text-brand-grey-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            14,000+ Vituo vya Afya
          </span>
          <span className="bg-white/90 backdrop-blur-sm text-brand-grey-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            25,000+ Shule
          </span>
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
