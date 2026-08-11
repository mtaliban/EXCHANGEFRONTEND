'use client';

import { useT } from '@/lib/i18n';

export default function ProjectsPage() {
  const t = useT();
  const projects = [
    { title: t('proj.p1'), status: t('proj.ongoing'), desc: t('proj.p1_d'), color: 'orange' },
    { title: t('proj.p2'), status: t('proj.upcoming'), desc: t('proj.p2_d'), color: 'blue' },
    { title: t('proj.p3'), status: t('proj.upcoming'), desc: t('proj.p3_d'), color: 'red' },
    { title: t('proj.p4'), status: t('proj.upcoming'), desc: t('proj.p4_d'), color: 'gold' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <span className="badge-gold mb-3">{t('proj.badge')}</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-grey-900">{t('proj.title')}</h1>
      </div>

      <div className="space-y-4">
        {projects.map((p, i) => (
          <div key={i} className="card flex items-start gap-4">
            <div className={`w-12 h-12 flex-shrink-0 rounded-full bg-brand-${p.color} text-white flex items-center justify-center font-bold`}>
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <h3 className="text-xl font-bold text-brand-grey-900">{p.title}</h3>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-brand-${p.color}-100 text-brand-${p.color}-600`}>
                  {p.status}
                </span>
              </div>
              <p className="text-brand-grey-500 mt-2">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
