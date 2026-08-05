'use client';

import { useEffect, useState } from 'react';
import { getRegions, getDistricts, getFacilities, type Region, type District, type Facility } from '@/lib/api';

interface Props {
  initial: any;
  onBack: () => void;
  onNext: (data: any) => void;
}

export default function Step3Station({ initial, onBack, onNext }: Props) {
  const cs = initial.current_station || {};
  const isTeacherPrimary = initial.cadre_code === 'TEACHER_PRIMARY';
  const isTeacherSecondary = initial.cadre_code === 'TEACHER_SECONDARY';
  const level = isTeacherPrimary ? 'Primary' : isTeacherSecondary ? 'Secondary' : undefined;
  const category: 'health' | 'education' = initial.category;

  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [region_id, setRegionId] = useState<number | ''>(cs.region_id || '');
  const [district_id, setDistrictId] = useState<number | ''>(cs.district_id || '');
  const [facility_id, setFacilityId] = useState<string>(cs.facility_id || '');
  const [facility_name_manual, setFacilityNameManual] = useState<string>(cs.facility_name && !cs.facility_id ? cs.facility_name : '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { getRegions().then(setRegions).catch(() => setError('Imeshindwa kupakia mikoa.')); }, []);

  useEffect(() => {
    if (region_id) {
      getDistricts(Number(region_id)).then(setDistricts).catch(() => {});
    } else {
      setDistricts([]);
    }
    setDistrictId(''); setFacilityId(''); setFacilities([]);
  }, [region_id]);

  useEffect(() => {
    if (district_id) {
      getFacilities(Number(district_id), category, level as any).then(setFacilities).catch(() => setFacilities([]));
    } else {
      setFacilities([]);
    }
    setFacilityId('');
  }, [district_id, category, level]);

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!region_id || !district_id) { setError('Chagua mkoa na wilaya.'); return; }
    const region = regions.find((r) => r.id === Number(region_id))!;
    const district = districts.find((d) => d.id === Number(district_id))!;
    const facility = facilities.find(
      (f: any) => String(f.id || f.code) === facility_id
    );
    onNext({
      current_station: {
        region_id: region.id, region_name: region.name,
        district_id: district.id, district_name: district.name,
        facility_id: facility_id || null,
        facility_name: facility?.name || facility_name_manual || null,
        facility_type: (facility as any)?.type || (facility as any)?.level || null,
      },
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-xl font-bold text-brand-grey-900 mb-4">Hatua 3: Kituo Chako cha Sasa</h2>

      <div>
        <label className="label">Mkoa *</label>
        <select className="input" value={region_id} onChange={(e) => setRegionId(e.target.value ? Number(e.target.value) : '')} required>
          <option value="">-- Chagua mkoa --</option>
          {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {region_id !== '' && (
        <div>
          <label className="label">Wilaya *</label>
          <select className="input" value={district_id} onChange={(e) => setDistrictId(e.target.value ? Number(e.target.value) : '')} required>
            <option value="">-- Chagua wilaya --</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      )}

      {district_id !== '' && (
        <div>
          <label className="label">
            Kituo ({category === 'health' ? 'kituo cha afya' : 'shule'}) — hiari
          </label>
          <select className="input" value={facility_id} onChange={(e) => setFacilityId(e.target.value)}>
            <option value="">-- Sitachaguliwa / Andika mkono --</option>
            {facilities.map((f: any) => (
              <option key={f.id || f.code} value={String(f.id || f.code)}>
                {f.name}{f.type ? ` (${f.type})` : ''}
              </option>
            ))}
          </select>
          {!facility_id && (
            <input
              className="input mt-2"
              placeholder="Au andika jina la kituo mkono"
              value={facility_name_manual}
              onChange={(e) => setFacilityNameManual(e.target.value)}
            />
          )}
        </div>
      )}

      {error && <p className="text-brand-red text-sm">{error}</p>}

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="btn-outline">← Rudi</button>
        <button type="submit" className="btn-primary">Endelea →</button>
      </div>
    </form>
  );
}
