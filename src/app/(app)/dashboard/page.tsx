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

      {/* ═══ HERO — Karibu (mobile-first, hakuna OFFLINE/simu) ═══ */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-blue via-brand-blue-700 to-brand-blue-900 text-white p-4 md:p-6 shadow-lg">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-brand-orange/25 blur-3xl" />
        <div className="absolute -bottom-14 -left-10 w-48 h-48 rounded-full bg-brand-gold/20 blur-3xl" />
        <div className="relative flex items-center gap-3 md:gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/15 ring-2 ring-white/40 flex items-center justify-center text-lg md:text-xl font-bold">
              {initial}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-green-400 border-2 border-brand-blue-800" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold truncate">
              {t('dash.welcome')}, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5 md:mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15">
                {user?.cadre_display || user?.cadre_code}
              </span>
              {myStation?.district_name && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15">
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
