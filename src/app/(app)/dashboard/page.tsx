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

      {/* ═══ WHATSAPP GROUP — button ya kujunga na group ═══ */}
      <a
        href={WA_GROUP_LINK}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-20 right-5 z-40 flex items-center gap-2.5 rounded-full bg-[#25D366] hover:bg-[#20BA5C] text-white shadow-lg hover:shadow-xl transition-all duration-200 pl-4 pr-5 py-3 group active:scale-95"
        aria-label="Jiunge na WhatsApp Group"
      >
        {/* Official WhatsApp logo — green circle + white phone + chat bubble */}
        <svg viewBox="0 0 32 32" className="w-7 h-7 flex-shrink-0" aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="white"/>
          <path d="M23.3 8.7C21.4 6.8 18.8 5.7 16 5.7c-5.6 0-10.2 4.6-10.2 10.2 0 1.8.5 3.5 1.3 5L5.7 26.3l5.6-1.5c1.5.8 3.1 1.2 4.7 1.2 5.6 0 10.2-4.6 10.2-10.2 0-2.7-1.1-5.3-2.9-7.1zM16 24.3c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.3.9.9-3.2-.2-.3c-.8-1.3-1.3-2.9-1.3-4.5 0-4.7 3.8-8.5 8.5-8.5 2.3 0 4.4.9 6 2.5 1.6 1.6 2.5 3.7 2.5 6 0 4.7-3.8 8.5-8.5 8.5zm4.7-6.4c-.3-.1-1.6-.8-1.8-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.7 1.8-1.3.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3z" fill="#25D366"/>
        </svg>
        <span className="text-sm font-bold hidden sm:inline">Jiunge na Group</span>
      </a>
    </div>
  );
}
