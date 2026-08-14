'use client';

import Image from 'next/image';
import { useT } from '@/lib/i18n';

const TLM_URL = 'https://home-haji-downloads-fieldmanagementdockerysy-production.up.railway.app/curriculum/';

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
        {/* 📢 TLM Tanzania — mradi maalum wa walimu */}
        <div className="card !p-0 overflow-hidden border-2 border-brand-blue/20">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 flex-shrink-0 relative">
              <Image
                src="/images/tlm-tanzania.png"
                alt="TLM Tanzania"
                width={540}
                height={1011}
                unoptimized
                className="w-full h-56 md:h-full object-cover"
              />
            </div>
            <div className="flex-1 p-5 md:p-8">
              <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                <h3 className="text-xl md:text-2xl font-bold text-brand-grey-900">{t('proj.tlm_title')}</h3>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">● {t('proj.ongoing')}</span>
              </div>
              <p className="text-sm text-brand-grey-600 mb-2">{t('proj.tlm_d1')}</p>
              <p className="text-sm text-brand-grey-600 mb-2">{t('proj.tlm_d2')}</p>
              <p className="text-sm text-brand-grey-700 font-medium mb-2">{t('proj.tlm_items')}</p>
              <p className="text-sm text-brand-grey-600 mb-2">{t('proj.tlm_d3')}</p>
              <p className="text-sm text-brand-grey-600 mb-4">{t('proj.tlm_d4')}</p>
              <a
                href={TLM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-brand-blue px-5 py-2.5 text-white font-semibold shadow-soft hover:bg-brand-blue-700 transition"
              >
                {t('proj.tlm_btn')}
              </a>
            </div>
          </div>
        </div>

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
