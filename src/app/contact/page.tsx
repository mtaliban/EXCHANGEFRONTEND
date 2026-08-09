'use client';

import { useT } from '@/lib/i18n';

export default function ContactPage() {
  const t = useT();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <span className="badge-gold mb-3">{t('contact.badge')}</span>
        <h1 className="text-4xl font-bold text-brand-grey-900">{t('contact.title')}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="w-12 h-12 rounded-xl bg-brand-blue-100 text-brand-blue flex items-center justify-center text-2xl mb-4">📞</div>
          <h3 className="font-bold text-brand-grey-900 mb-1">{t('contact.phone')}</h3>
          <a href="tel:+255710703705" className="text-brand-blue hover:underline">+255 710 703 705</a>
        </div>
        <div className="card">
          <div className="w-12 h-12 rounded-xl bg-brand-orange-100 text-brand-orange flex items-center justify-center text-2xl mb-4">💬</div>
          <h3 className="font-bold text-brand-grey-900 mb-1">{t('contact.whatsapp')}</h3>
          <a href="https://wa.me/255778764578" className="text-brand-orange hover:underline">+255 778 764 578</a>
        </div>
        <div className="card">
          <div className="w-12 h-12 rounded-xl bg-brand-red-100 text-brand-red flex items-center justify-center text-2xl mb-4">📧</div>
          <h3 className="font-bold text-brand-grey-900 mb-1">{t('contact.email')}</h3>
          <p className="text-brand-grey-700">info@kubadilishanavituo.tz</p>
        </div>
        <div className="card">
          <div className="w-12 h-12 rounded-xl bg-brand-gold-100 text-brand-gold-600 flex items-center justify-center text-2xl mb-4">📍</div>
          <h3 className="font-bold text-brand-grey-900 mb-1">{t('contact.office')}</h3>
          <p className="text-brand-grey-700">Dar es Salaam, Tanzania</p>
        </div>
      </div>
    </div>
  );
}
