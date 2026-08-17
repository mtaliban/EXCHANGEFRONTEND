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

      {/* ═══ HERO — NDOGO SANA kisomi: mstari mmoja, maandishi meusi, inaonekana kwenye simu ═══ */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-brand-grey-100 dark:bg-brand-grey-800 border border-brand-grey-300 dark:border-brand-grey-600 flex items-center justify-center text-[11px] font-bold text-brand-grey-900 dark:text-white flex-shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <h1 className="text-[13px] font-bold text-brand-grey-900 dark:text-white leading-tight break-words">
            {t('dash.welcome')}, {user?.full_name?.split(' ')[0]}
          </h1>
          {myStation?.district_name && (
            <span className="text-[11px] font-medium text-brand-grey-500 dark:text-brand-grey-400 leading-tight">
              📍 {myStation.district_name}, {myStation.region_name}
            </span>
          )}
        </div>
      </div>

      {/* ═══ BOARD MOJA: Wanaokuja {mkoa} (live mpya juu, kijani=online) ═══ */}
      <DashboardBoard />
    </div>
  );
}
