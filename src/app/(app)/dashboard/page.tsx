'use client';

import { useAuth } from '@/lib/auth';
import DashboardBoard from '@/components/DashboardBoard';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import { useT } from '@/lib/i18n';
import { getInitial } from '@/lib/initials';
import { MapPin } from 'lucide-react';

const WA_GROUP_LINK = 'https://chat.whatsapp.com/Gm43LFnroiZLV9wynX3FpP?s=cl&p=a&ilr=0';

export default function DashboardPage() {
  const t = useT();
  const { user } = useAuth();
  const myStation = (user?.current_station || {}) as any;
  const initial = getInitial(user?.full_name);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ═══ MATANGAZO — juu ya dashboard pekee; mtu aamue kuyafungua ═══ */}
      <AnnouncementBanner />

      {/* ═══ HERO — OFFICIAL: card ndogo ya kisomi — jina kamili, idara, kada, mkoa ═══ */}
      <div className="flex items-center gap-3 rounded-xl border border-brand-grey-200 dark:border-brand-grey-700 bg-white dark:bg-brand-grey-900 px-4 py-3 shadow-soft">
        <div className="w-10 h-10 rounded-full bg-brand-blue-50 dark:bg-brand-blue-900/40 border border-brand-blue-200 dark:border-brand-blue-800 flex items-center justify-center text-sm font-bold text-brand-blue-700 dark:text-brand-blue-300 flex-shrink-0">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold text-brand-grey-900 dark:text-white leading-tight truncate">
            {t('dash.welcome')}, {user?.full_name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium text-brand-grey-500 dark:text-brand-grey-400 leading-tight">
            {user?.category && (
              <span className="text-brand-blue-600 dark:text-brand-blue-400 font-semibold">
                {user.category === 'health' ? t('label.category_health') : t('label.category_education')}
              </span>
            )}
            {user?.cadre_display && <span>· {user.cadre_display}</span>}
            {myStation?.region_name && (
              <span className="flex items-center gap-1">
                <MapPin size={10} className="text-brand-blue-500 dark:text-brand-blue-400 flex-shrink-0" />
                {[myStation.district_name, myStation.region_name].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ BOARD MOJA: Wanaokuja {mkoa} (live mpya juu, kijani=online) ═══ */}
      <DashboardBoard />

      {/* ═══ WHATSAPP GROUP — icon ya official, kulia juu ═══ */}
      <a
        href={WA_GROUP_LINK}
        target="_blank"
        rel="noreferrer"
        className="fixed top-20 right-4 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-200 active:scale-90 hover:scale-110"
        aria-label="Jiunge na WhatsApp Group"
        title="Jiunge na WhatsApp Group"
      >
        <svg viewBox="0 0 32 32" className="w-10 h-10" aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#25D366"/>
          <circle cx="16" cy="16" r="14" fill="white"/>
          <path d="M22.5 9.5c-1.8-1.8-4.3-2.8-7-2.8-5.5 0-10 4.5-10 10 0 1.8.5 3.5 1.3 5l-1.3 4.8 5-1.3c1.5.7 3.1 1.1 4.7 1.1h0c5.5 0 10-4.5 10-10 0-2.6-1-5-2.8-6.8zM16 23.3c-1.4 0-2.8-.4-4-1.1l-.3-.2-3 .8.8-2.9-.2-.3c-.7-1.2-1.1-2.5-1.1-3.9 0-4.1 3.4-7.5 7.5-7.5 2 0 3.9.8 5.3 2.2s2.2 3.3 2.2 5.3c0 4.2-3.4 7.6-7.5 7.6zm4.1-5.6c-.2-.1-1.4-.7-1.6-.8-.3-.1-.5-.1-.7.1-.2.2-.7.8-.9 1-.2.2-.3.2-.5.1s-1.1-.4-2.1-1.3c-.8-.7-1.3-1.6-1.5-1.8-.2-.3 0-.4.1-.6.1-.1.2-.3.3-.4.1-.2.2-.3.3-.5.1-.2 0-.3 0-.5s-.6-1.5-.8-2c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.4.1-.6.3s-.8.9-.8 2.1.8 2.4 1 2.6c.1.2 1.7 2.7 4.2 3.8.6.3 1.1.4 1.4.5.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .2-1.1-.1-.1-.3-.2-.5-.3z" fill="#25D366"/>
        </svg>
      </a>
    </div>
  );
}
