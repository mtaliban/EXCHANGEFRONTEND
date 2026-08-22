'use client';

import { useEffect, useState } from 'react';
import { getRegions, getDistricts, type Region, type District, type Destination } from '@/lib/api';
import { useDataVersion } from '@/lib/useDataVersion';
import { useT } from '@/lib/i18n';
import { AlertCircle } from 'lucide-react';

interface Props {
  initial: any;
  onBack: () => void;
  onSubmit: (data: any) => Promise<void>;
  submitting: boolean;
}

export default function Step4Destinations({ initial, onBack, onSubmit, submitting }: Props) {
  const t = useT();
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [region_id, setRegionId] = useState<number | ''>(
    initial.desired_destinations?.[0]?.region_id || ''
  );
  const [district_id, setDistrictId] = useState<number | '' | null>(
    initial.desired_destinations?.[0]?.district_id || null
  );
  const [error, setError] = useState<string | null>(null);

  const dv = useDataVersion();
  useEffect(() => { getRegions().then(setRegions); }, [dv]);

  useEffect(() => {
    if (region_id) {
      getDistricts(Number(region_id)).then(setDistricts).catch(() => setDistricts([]));
    } else {
      setDistricts([]);
    }
    setDistrictId(null);
  }, [region_id]);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    if (!region_id) { setError(t('step4.err_region')); return; }
    const region = regions.find((r) => r.id === Number(region_id))!;
    const district = district_id ? districts.find((x) => x.id === Number(district_id)) : null;
    const dests: Destination[] = [{
      region_id: region.id, region_name: region.name,
      district_id: district?.id || null, district_name: district?.name || null,
      facility_id: null, facility_name: null,
      notes: null,
    }];
    await onSubmit({ desired_destinations: dests });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h2 className="text-base font-bold text-brand-grey-900 mb-1">{t('step4.title')}</h2>
      <p className="text-sm text-brand-grey-500 mb-2">{t('step4.subtitle')}</p>

      <div>
        <label className="label">{t('step3.region')} *</label>
        <select className="input" value={region_id}
          onChange={(e) => setRegionId(e.target.value ? Number(e.target.value) : '')} required>
          <option value="">Chagua Mkoa</option>
          {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {region_id !== '' && (
        <div>
          <label className="label">{t('step3.district')} <span className="text-brand-grey-400 text-xs font-normal">(hiari)</span></label>
          <select className="input" value={district_id || ''}
            onChange={(e) => setDistrictId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Wilaya (hiari)</option>
            {districts.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-brand-red-50 border border-brand-red-100 text-brand-red text-xs rounded-xl p-3">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-3">
        <button type="button" onClick={onBack} disabled={submitting} className="btn-outline flex-1 sm:flex-none">{t('wizard.back')}</button>
        <button type="submit" disabled={submitting} className="btn-primary flex-1 sm:flex-none">
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              {t('step4.submitting')}
            </span>
          ) : t('step4.submit')}
        </button>
      </div>
    </form>
  );
}
