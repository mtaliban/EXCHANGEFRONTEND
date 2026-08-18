'use client';

import { useT } from '@/lib/i18n';
import { BookOpen, FileText, Users, ClipboardList, NotebookPen, ArrowRight, GraduationCap } from 'lucide-react';

const TLM_URL = 'https://home-haji-downloads-fieldmanagementdockerysy-production.up.railway.app/curriculum/';

export default function ProjectsPage() {
  const t = useT();

  const stats = [
    { icon: BookOpen, num: '27', label: t('proj.stat_schemes') },
    { icon: FileText, num: '1.8K', label: t('proj.stat_lesson_plans') },
    { icon: Users, num: '737', label: t('proj.stat_teachers') },
    { icon: ClipboardList, num: '12', label: t('proj.stat_logbook') },
    { icon: NotebookPen, num: '108', label: t('proj.stat_notes') },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <span className="inline-flex items-center rounded-full bg-brand-blue-50 border border-brand-blue-100 px-3 py-1 text-xs font-semibold text-brand-blue mb-3">
          {t('proj.badge')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-grey-900 dark:text-white">
          {t('proj.title')}
        </h1>
      </div>

      {/* TLM Tanzania — mradi maalum wa walimu */}
      <div className="card border-2 border-brand-blue/20 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0">
                <GraduationCap size={24} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-brand-grey-900 dark:text-white">
                {t('proj.tlm_title')}
              </h3>
            </div>
            <span className="inline-flex items-center rounded-full bg-brand-blue-100 text-brand-blue px-3 py-1 text-xs font-semibold">
              ● {t('proj.ongoing')}
            </span>
          </div>

          <p className="text-sm text-brand-grey-600 dark:text-brand-grey-300 mb-1">{t('proj.tlm_d1')}</p>
          <p className="text-sm text-brand-grey-600 dark:text-brand-grey-300 mb-2">{t('proj.tlm_d2')}</p>
          <p className="text-sm text-brand-grey-700 dark:text-brand-grey-200 font-medium mb-2">{t('proj.tlm_items')}</p>
          <p className="text-sm text-brand-grey-600 dark:text-brand-grey-300 mb-2">{t('proj.tlm_d3')}</p>
          <p className="text-sm text-brand-grey-600 dark:text-brand-grey-300 mb-6">{t('proj.tlm_d4')}</p>

          {/* Takwimu */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wide text-brand-grey-500 dark:text-brand-grey-400 mb-3">
              {t('proj.stats_title')}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-brand-grey-200 dark:border-brand-grey-600 bg-brand-grey-50 dark:bg-brand-grey-900 p-4 text-center"
                >
                  <div className="flex items-center justify-center mb-2">
                    <s.icon size={20} className="text-brand-blue" strokeWidth={2} />
                  </div>
                  <div className="text-xl font-bold text-brand-grey-900 dark:text-white">{s.num}</div>
                  <div className="text-[11px] text-brand-grey-500 dark:text-brand-grey-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <a
            href={TLM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-blue px-6 py-3 text-sm font-semibold text-white shadow-soft hover:bg-brand-blue-700 transition"
          >
            {t('proj.tlm_btn')}
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
