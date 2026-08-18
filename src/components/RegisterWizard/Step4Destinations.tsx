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

interface DraftDest {
  region_id: number | '';
  district_id: number | '' | null;
  facility_name?: string;
  notes?: string;
}

export default function Step4Destinations({ initial, onBack, onSubmit, submitting }: Props) {
  const t = useT();
  const [regions, setRegions] = useState<Region[]>([]);
  const [districtsMap, setDistrictsMap] = useState<Record<number, District[]>>({});
  const [drafts, setDrafts] = useState<DraftDest[]>(
    initial.desired_destinations?.length
      ? initial.desired_destinations.map((d: any) => ({
          region_id: d.region_id, district_id: d.district_id || null,
          facility_name: d.facility_name || '', notes: d.notes || '',
        }))
      : [{ region_id: '', district_id: null }]
  );
  const [error, setError] = useState<string | null>(null);

  const dv = useDataVersion();
  useEffect(() => { getRegions().then(setRegions); }, [dv]);

  async function loadDistrictsFor(regionId: number) {
    if (districtsMap[regionId]) return;
    const list = await getDistricts(regionId);
    setDistrictsMap((m) => ({ ...m, [regionId]: list }));
  }

  function update(idx: number, patch: Partial<DraftDest>) {
    setDrafts((ds) => ds.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
    if (patch.region_id && typeof patch.region_id === 'number') loadDistrictsFor(patch.region_id);
  }

  function addRow() {
    if (drafts.length >= 15) return;
    setDrafts((ds) => [...ds, { region_id: '', district_id: null }]);
  }

  function removeRow(idx: number) {
    setDrafts((ds) => ds.filter((_, i) => i !== idx));
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    if (!drafts.length) { setError(t('step4.err_atleast_one')); return; }
    const dests: Destination[] = [];
    for (const d of drafts) {
      if (!d.region_id) { setError(t('step4.err_region')); return; }
      const region = regions.find((r) => r.id === d.region_id)!;
      const districts = districtsMap[d.region_id] || [];
      const district = d.district_id ? districts.find((x) => x.id === d.district_id) : null;
      dests.push({
        region_id: region.id, region_name: region.name,
        district_id: district?.id || null, district_name: district?.name || null,
        facility_id: null, facility_name: d.facility_name || null,
        notes: d.notes || null,
      });
    }
    await onSubmit({ desired_destinations: dests });
  }

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <h2 className="text-base font-bold text-brand-grey-900 mb-1">{t('step4.title')}</h2>
      <p className="text-sm text-brand-grey-500 mb-3">{t('step4.subtitle')}</p>

      {drafts.map((d, idx) => {
        const districts = d.region_id ? districtsMap[d.region_id] || [] : [];
        return (
          <div key={idx} className="p-4 rounded-xl border border-brand-grey-200 bg-brand-grey-50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-brand-grey-700">{t('step4.place')} #{idx + 1}</span>
              {drafts.length > 1 && (
                <button type="button" onClick={() => removeRow(idx)} className="text-brand-red text-sm hover:underline">
                  {t('step4.remove')}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">{t('step3.region')} *</label>
                <select className="input" value={d.region_id}
                  onChange={(e) => update(idx, { region_id: e.target.value ? Number(e.target.value) : '', district_id: null })}>
                  <option value="">{t('step3.choose_region')}</option>
                  {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">{t('step3.district')} ({t('msg.optional')})</label>
                <select className="input" value={d.district_id || ''}
                  onChange={(e) => update(idx, { district_id: e.target.value ? Number(e.target.value) : null })}
                  disabled={!d.region_id}>
                  <option value="">{t('step4.any_district')}</option>
                  {districts.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <input className="input" placeholder={t('step4.facility_ph')}
                value={d.facility_name || ''} onChange={(e) => update(idx, { facility_name: e.target.value })} />
              <input className="input" placeholder={t('step4.notes_ph')}
                value={d.notes || ''} onChange={(e) => update(idx, { notes: e.target.value })} />
            </div>
          </div>
        );
      })}

      <button type="button" onClick={addRow} disabled={drafts.length >= 15}
        className="w-full py-3 rounded-xl border-2 border-dashed border-brand-grey-400 text-brand-grey-700 font-semibold hover:border-brand-grey-600 hover:bg-brand-grey-50 disabled:opacity-50 disabled:cursor-not-allowed">
        {t('step4.add_more')} ({drafts.length}/15)
      </button>

      {error && (
        <div className="flex items-start gap-2 bg-brand-red-50 border border-brand-red-100 text-brand-red text-sm rounded-xl p-3">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-3">
        <button type="button" onClick={onBack} disabled={submitting} className="btn-outline flex-1 sm:flex-none">{t('wizard.back')}</button>
        <button type="submit" disabled={submitting} className="btn-primary flex-1 sm:flex-none">
          {submitting ? t('step4.submitting') : t('step4.submit')}
        </button>
      </div>
    </form>
  );
}
