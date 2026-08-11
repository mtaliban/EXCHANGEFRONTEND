'use client';

import { useT } from '@/lib/i18n';

export default function ServicesPage() {
  const t = useT();
  const services = [
    { icon: '🏥', title: t('svc.health'), desc: t('svc.health_d'), color: 'blue' },
    { icon: '👩‍🏫', title: t('svc.teachers'), desc: t('svc.teachers_d'), color: 'orange' },
    { icon: '🔎', title: t('svc.matching'), desc: t('svc.matching_d'), color: 'red' },
    { icon: '💬', title: t('svc.chat'), desc: t('svc.chat_d'), color: 'gold' },
    { icon: '🔔', title: t('svc.notif'), desc: t('svc.notif_d'), color: 'blue' },
    { icon: '🛡️', title: t('svc.verify'), desc: t('svc.verify_d'), color: 'red' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <span className="badge-gold mb-3">{t('svc.badge')}</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-grey-900 mb-3">{t('svc.title')}</h1>
        <p className="text-brand-grey-500 max-w-2xl mx-auto">
          {t('svc.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s) => (
          <div key={s.title} className="card hover:shadow-lg transition group">
            <div className={`w-14 h-14 rounded-xl bg-brand-${s.color}-100 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition`}>
              {s.icon}
            </div>
            <h3 className="text-xl font-bold text-brand-grey-900 mb-2">{s.title}</h3>
            <p className="text-brand-grey-500">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
