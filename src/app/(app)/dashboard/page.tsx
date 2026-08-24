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

      {/* ═══ WHATSAPP GROUP — official, kubwa, ya kisomi ═══ */}
      <a
        href={WA_GROUP_LINK}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-xl hover:shadow-2xl transition-all duration-200 pl-5 pr-6 py-4 group active:scale-95 border-2 border-white/20"
        aria-label="Jiunge na WhatsApp Group ya Kubadilishana Vituo"
      >
        {/* Official WhatsApp logo — kubwa, clear */}
        <svg viewBox="0 0 39 39" className="w-9 h-9 flex-shrink-0 drop-shadow-sm" aria-hidden="true">
          <circle cx="19.5" cy="19.5" r="19.5" fill="white"/>
          <path d="M28.7 10.6c-2.4-2.4-5.6-3.7-9.1-3.7-7 0-12.7 5.7-12.7 12.7 0 2.2.6 4.4 1.7 6.3L6.5 32.5l7-1.8c1.9 1 4 1.5 6.1 1.5h0c7 0 12.7-5.7 12.7-12.7 0-3.4-1.3-6.6-3.6-9.3zM19.6 29c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.2 1.1 1.1-4.1-.3-.4c-1-1.6-1.5-3.5-1.5-5.4 0-5.8 4.7-10.5 10.5-10.5 2.8 0 5.5 1.1 7.5 3.1 2 2 3.1 4.7 3.1 7.5-.1 5.9-4.8 10.6-10.5 10.6zm5.8-7.9c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.7.2-.2.3-.8 1.1-1 1.3-.2.2-.4.2-.7.1-.3-.1-1.4-.5-2.7-1.7-1-1-1.7-2.1-1.9-2.5-.2-.3 0-.5.1-.7.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2.1-.4 0-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.6-.5-.8-.5h-.7c-.2 0-.6.1-.9.5-.3.3-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.1.2 2.4 3.7 5.8 5.2.8.4 1.5.6 2 .8.8.3 1.6.2 2.2.1.6-.1 2-.8 2.3-1.6.3-.8.3-1.4.2-1.6-.1-.1-.3-.2-.7-.4z" fill="#25D366"/>
        </svg>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-extrabold tracking-wide">Jiunge na Group</span>
          <span className="text-[10px] font-medium text-white/80 hidden sm:block">WhatsApp — Kubadilishana Vituo</span>
        </div>
      </a>
    </div>
  );
}
