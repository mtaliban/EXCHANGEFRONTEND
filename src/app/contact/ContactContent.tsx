'use client';

import { useT } from '@/lib/i18n';
import { Phone, MessageCircle, Mail, MapPin } from 'lucide-react';

export default function ContactContent() {
  const t = useT();

  const contacts = [
    {
      icon: Phone,
      title: t('contact.phone'),
      value: '0763 795 801',
      href: 'tel:+255763795801',
    },
    {
      icon: MessageCircle,
      title: t('contact.whatsapp'),
      value: '+255 625 607 088',
      href: 'https://wa.me/255625607088',
    },
    {
      icon: Mail,
      title: t('contact.email'),
      value: 'Hamisiselemani039@gmail.com',
      href: 'mailto:Hamisiselemani039@gmail.com',
    },
    {
      icon: MapPin,
      title: t('contact.office'),
      value: "Dodoma, Ng'ong'onha — UDOM",
      href: null,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <span className="inline-flex items-center rounded-full bg-brand-blue-50 border border-brand-blue-100 px-3 py-1 text-xs font-semibold text-brand-blue mb-3">
          {t('contact.badge')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-grey-900 dark:text-white">
          {t('contact.title')}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {contacts.map((c) => (
          <div key={c.title} className="card text-center hover:shadow-lg transition">
            <div className="w-16 h-16 rounded-2xl bg-brand-blue-50 text-brand-blue flex items-center justify-center mx-auto mb-4">
              <c.icon size={30} strokeWidth={1.8} />
            </div>
            <h3 className="font-bold text-brand-grey-900 dark:text-white mb-1.5">{c.title}</h3>
            {c.href ? (
              <a
                href={c.href}
                className="text-brand-blue font-medium hover:underline break-all"
                {...(c.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {c.value}
              </a>
            ) : (
              <p className="text-brand-grey-700 dark:text-brand-grey-300 font-medium">{c.value}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
