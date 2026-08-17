'use client';

import { useAuth } from '@/lib/auth';
import DashboardBoard from '@/components/DashboardBoard';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import { useT } from '@/lib/i18n';
import { getInitial } from '@/lib/initials';
import { MapPin } from 'lucide-react';

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
    </div>
  );
}
