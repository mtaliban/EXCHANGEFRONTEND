'use client';

import { useEffect, useState } from 'react';
import { getRegions, getDistricts, getFacilities, getFacilitiesByRegion, type Region, type District, type Facility } from '@/lib/api';
import { useDataVersion } from '@/lib/useDataVersion';
import { useT } from '@/lib/i18n';
import { AlertCircle } from 'lucide-react';
import HospitalSearch from './HospitalSearch';

interface Props {
  initial: any;
  onBack: () => void;
  onNext: (data: any) => void;
}

export default function Step3Station({ initial, onBack, onNext }: Props) {
  const t = useT();
  const cs = initial.current_station || {};
  const isTeacherPrimary = initial.cadre_code === 'TEACHER_PRIMARY';
  const isTeacherSecondary = initial.cadre_code === 'TEACHER_SECONDARY';
  const level = isTeacherPrimary ? 'Primary' : isTeacherSecondary ? 'Secondary' : undefined;
  const category: 'health' | 'education' = initial.category;
  const employmentSector: string | undefined = initial.employment_sector;

  // ── Wizara ya Afya: Mkoa + Hospitali (skip wilaya) ──
  const isWizara = category === 'health' && employmentSector === 'wizara_afya';
  // ── TAMISEMI / Elimu: Mkoa + Wilaya + Kituo ──

  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [region_id, setRegionId] = useState<number | ''>(cs.region_id || '');
  const [district_id, setDistrictId] = useState<number | ''>(cs.district_id || '');
  const [facility_id, setFacilityId] = useState<string>(cs.facility_id || '');
  const [facility_name_manual, setFacilityNameManual] = useState<string>(cs.facility_name && !cs.facility_id ? cs.facility_name : '');
  const [error, setError] = useState<string | null>(null);
  const [regionFacilitiesLoading, setRegionFacilitiesLoading] = useState(false);

  const dv = useDataVersion();
  useEffect(() => { getRegions().then(setRegions).catch(() => setError(t('step3.err_load'))); }, [dv]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── TAMISEMI/Elimu: load districts when region is chosen ──
  useEffect(() => {
    if (!isWizara && region_id) {
      getDistricts(Number(region_id)).then(setDistricts).catch(() => {});
    } else {
      setDistricts([]);
    }
    if (!isWizara) {
      setDistrictId(''); setFacilityId(''); setFacilities([]);
    }
  }, [region_id, isWizara]);

  // ── TAMISEMI/Elimu: load facilities when district is chosen ──
  useEffect(() => {
    if (!isWizara && district_id) {
      getFacilities(Number(district_id), category, level as any).then(setFacilities).catch(() => setFacilities([]));
    } else if (!isWizara) {
      setFacilities([]);
    }
    if (!isWizara) setFacilityId('');
  }, [district_id, category, level, isWizara]);

  // ── Wizara ya Afya: load ALL facilities in region at once ──
  useEffect(() => {
    if (isWizara && region_id) {
      setRegionFacilitiesLoading(true);
      setFacilityId('');
      getFacilitiesByRegion(Number(region_id), 'health', undefined, employmentSector as 'wizara_afya' | 'tamisemi' | undefined)
        .then(setFacilities)
        .catch(() => setFacilities([]))
        .finally(() => setRegionFacilitiesLoading(false));
    } else if (isWizara) {
      setFacilities([]);
    }
  }, [region_id, isWizara]);

  function submit(ev: React.FormEvent) {
    ev.preventDefault();

    if (isWizara) {
      // Wizara ya Afya: Mkoa + Hospitali
      if (!region_id) { setError('Chagua Mkoa'); return; }
      const region = regions.find((r) => r.id === Number(region_id))!;
      const facility = facilities.find((f: any) => String(f.id || f.code) === facility_id);
      onNext({
        current_station: {
          region_id: region.id, region_name: region.name,
          district_id: facility?.district_id || null,
          district_name: facility?.district || null,
          facility_id: facility_id || null,
          facility_name: facility?.name || null,
          facility_type: (facility as any)?.type || (facility as any)?.type_category || null,
        },
      });
    } else {
      // TAMISEMI/Elimu: Mkoa + Wilaya + Kituo
      if (!region_id || !district_id) { setError(t('step3.err_region_district')); return; }
      const region = regions.find((r) => r.id === Number(region_id))!;
      const district = districts.find((d) => d.id === Number(district_id))!;
      const facility = facilities.find((f: any) => String(f.id || f.code) === facility_id);
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
  }

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <h2 className="text-base font-bold text-brand-grey-900 mb-1">{t('step3.title')}</h2>

      {isWizara && (
        <p className="text-xs text-brand-blue font-medium bg-brand-blue-50 dark:bg-brand-blue-900/20 rounded-lg p-2">
          Wizara ya Afya — Chagua Mkoa kisha Jina la Hospitali
        </p>
      )}

      <div>
        <label className="label">{t('step3.region')} *</label>
        <select className="input" value={region_id} onChange={(e) => setRegionId(e.target.value ? Number(e.target.value) : '')} required>
          <option value="">Chagua Mkoa</option>
          {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {/* ── Wizara ya Afya: Hospitali selection (skip wilaya) ── */}
      {isWizara && region_id !== '' && (
        <div>
          <label className="label">
            Hospitali / Kituo cha Afya *
          </label>
          <HospitalSearch
            facilities={facilities}
            value={facility_id}
            onChange={(id) => setFacilityId(id)}
            placeholder="Tafuta hospitali kwa jina..."
            required
            loading={regionFacilitiesLoading}
          />
        </div>
      )}

      {/* ── TAMISEMI/Elimu: Wilaya + Kituo ── */}
      {!isWizara && region_id !== '' && (
        <div>
          <label className="label">{t('step3.district')} *</label>
            <select className="input" value={district_id} onChange={(e) => setDistrictId(e.target.value ? Number(e.target.value) : '')} required>
            <option value="">Chagua Wilaya</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      )}

      {!isWizara && district_id !== '' && (
        <div>
          <label className="label">
            {t('step3.facility')} ({category === 'health' ? t('step3.facility_health') : t('step3.facility_school')}) — {t('msg.optional')}
          </label>
          <select className="input" value={facility_id} onChange={(e) => setFacilityId(e.target.value)}>
            <option value="">{t('step3.facility_none')}</option>
            {facilities.map((f: any) => (
              <option key={f.id || f.code} value={String(f.id || f.code)}>
                {f.name}{f.type ? ` (${f.type})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-brand-red-50 border border-brand-red-100 text-brand-red text-sm rounded-xl p-3">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-3">
        <button type="button" onClick={onBack} className="btn-outline flex-1 sm:flex-none">{t('wizard.back')}</button>
        <button type="submit" className="btn-primary flex-1 sm:flex-none">{t('wizard.next')}</button>
      </div>
    </form>
  );
}
