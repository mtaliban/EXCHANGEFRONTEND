'use client';

import { useAuth } from '@/lib/auth';
import DashboardBoard from '@/components/DashboardBoard';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import { useT } from '@/lib/i18n';
import { getInitial } from '@/lib/initials';

export default function DashboardPage() {
  const t = useT();
  const { user } = useAuth();
  const myStation = (user?.current_station || {}) as any;
  const initial = getInitial(user?.full_name);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ═══ MATANGAZO — juu ya dashboard pekee; mtu aamue kuyafungua ═══ */}
      <AnnouncementBanner />

      {/* ═══ HERO — Karibu (NDOGO SANA, nyeupe/nyeusi, official — isichukue nafasi) ═══ */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-brand-grey-100 dark:bg-brand-grey-800 border border-brand-grey-300 dark:border-brand-grey-600 flex items-center justify-center text-sm font-bold text-brand-grey-900 dark:text-white">
            {initial}
          </div>
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-white dark:border-brand-grey-900" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xs md:text-sm font-bold text-brand-grey-900 dark:text-white truncate leading-tight">
            {t('dash.welcome')}, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[10px] font-semibold text-brand-grey-500 dark:text-brand-grey-400">
              {user?.cadre_display || user?.cadre_code}
            </span>
            {myStation?.district_name && (
              <span className="text-[10px] font-semibold text-brand-grey-500 dark:text-brand-grey-400">
                · 📍 {myStation.district_name}, {myStation.region_name}
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
