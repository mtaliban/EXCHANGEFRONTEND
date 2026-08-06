'use client';

import { useEffect, useState } from 'react';
import { getMyProfile } from '@/lib/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    getMyProfile().then(setProfile).catch(() => {});
  }, []);

  if (!profile) return <div className="p-6 text-brand-grey-500">Inapakia...</div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold text-brand-grey-900">Wasifu Wangu</h1>

      <div className="card">
        <h3 className="font-bold text-brand-grey-900 mb-3">Utambulisho</h3>
        <div className="space-y-2 text-sm">
          <Row label="Jina" value={profile.full_name} />
          <Row label="Simu" value={profile.phone_primary} />
          {profile.phone_alt && <Row label="Simu ya pili" value={profile.phone_alt} />}
          <Row label="Idara" value={profile.category === 'health' ? 'Afya' : 'Elimu'} />
          <Row label="Kada" value={profile.cadre_display} />
          {profile.subjects?.length > 0 && <Row label="Masomo" value={profile.subjects.join(', ')} />}
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-brand-grey-900 mb-3">Kituo cha Sasa</h3>
        <div className="space-y-1 text-sm">
          <Row label="Mkoa" value={profile.current_station?.region_name} />
          <Row label="Wilaya" value={profile.current_station?.district_name} />
          <Row label="Kituo" value={profile.current_station?.facility_name || '(Hakuna)'} />
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-brand-grey-900 mb-3">Ninataka Kwenda</h3>
        <div className="space-y-2">
          {profile.desired_destinations?.map((d: any, i: number) => (
            <div key={i} className="p-2 rounded-lg bg-brand-grey-50 text-sm">
              <div className="font-semibold text-brand-grey-900">{d.region_name}</div>
              <div className="text-xs text-brand-grey-500">
                {d.district_name || 'Wilaya yoyote'}
                {d.facility_name ? ` • ${d.facility_name}` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-brand-grey-500">{label}:</span>
      <span className="font-medium text-brand-grey-900 text-right">{value || '-'}</span>
    </div>
  );
}
