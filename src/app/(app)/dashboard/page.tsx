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

      {/* ═══ HERO — Karibu (dogo, nyeupe, official — sio div kubwa ya bluu) ═══ */}
      <section className="rounded-xl bg-white dark:bg-brand-grey-900 border border-brand-grey-200 dark:border-brand-grey-600 px-4 py-3 md:px-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-brand-grey-100 dark:bg-brand-grey-800 border border-brand-grey-300 dark:border-brand-grey-600 flex items-center justify-center text-base md:text-lg font-bold text-brand-grey-900 dark:text-white">
              {initial}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-brand-grey-900" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm md:text-base font-extrabold text-brand-grey-900 dark:text-white truncate">
              {t('dash.welcome')}, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-grey-100 dark:bg-brand-grey-800 text-brand-grey-700 dark:text-brand-grey-300">
                {user?.cadre_display || user?.cadre_code}
              </span>
              {myStation?.district_name && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-grey-100 dark:bg-brand-grey-800 text-brand-grey-700 dark:text-brand-grey-300">
                  📍 {myStation.district_name}, {myStation.region_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BOARD MOJA: Wanaokuja {mkoa} (live mpya juu, kijani=online) ═══ */}
      <DashboardBoard />
    </div>
  );
}
