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
            {(user as any)?.is_admin ? (
              <span className="text-brand-blue-600 dark:text-brand-blue-400 font-semibold">
                {t('label.admin', 'Admin')}
              </span>
            ) : user?.category ? (
              <span className="text-brand-blue-600 dark:text-brand-blue-400 font-semibold">
                {user.category === 'health' ? t('label.category_health') : t('label.category_education')}
              </span>
            ) : null}
            {!(user as any)?.is_admin && user?.cadre_display && <span>· {user.cadre_display}</span>}
            {myStation?.region_name && (
              <span className="flex items-center gap-1">
                <MapPin size={10} className="text-brand-blue-500 dark:text-brand-blue-400 flex-shrink-0" />
                {[myStation.district_name, myStation.region_name].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>
        {/* Namba ya kulipia — kisomi, si ya kubofya */}
        <div className="flex-shrink-0 text-right">
          <div className="text-[9px] font-bold uppercase tracking-wider text-brand-grey-400">Lipa kwa</div>
          <div className="text-[13px] font-extrabold text-brand-grey-900 dark:text-white tracking-wide">0763 795 801</div>
          <div className="text-[9px] text-brand-grey-400">M-Pesa / Tigo / Airtel</div>
        </div>
      </div>

      {/* ═══ BOARD MOJA: Wanaokuja {mkoa} (live mpya juu, kijani=online) ═══ */}
      <DashboardBoard />

      {/* ═══ WHATSAPP GROUP — official icon, robo tatu, kulia ═══ */}
      <a
        href={WA_GROUP_LINK}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-24 right-4 z-50 w-11 h-11 rounded-full bg-[#25D366] flex items-center justify-center transition-transform duration-200 active:scale-90 hover:scale-110 shadow-lg"
        aria-label="Jiunge na WhatsApp Group"
        title="Jiunge na WhatsApp Group"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
