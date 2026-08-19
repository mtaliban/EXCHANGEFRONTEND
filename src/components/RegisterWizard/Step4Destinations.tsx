'use client';

import { useEffect, useState } from 'react';
import { getRegions, getDistricts, type Region, type District, type Destination } from '@/lib/api';
import { useDataVersion } from '@/lib/useDataVersion';
import { useT } from '@/lib/i18n';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  initial: any;
  onBack: () => void;
  onSubmit: (data: any) => Promise<void>;
  submitting: boolean;
}

interface DraftDest {
  region_id: number | '';
  district_id: number | '' | null;
}

export default function Step4Destinations({ initial, onBack, onSubmit, submitting }: Props) {
  const t = useT();
  const [regions, setRegions] = useState<Region[]>([]);
  const [districtsMap, setDistrictsMap] = useState<Record<number, District[]>>({});
  const [drafts, setDrafts] = useState<DraftDest[]>(
    initial.desired_destinations?.length
      ? initial.desired_destinations.map((d: any) => ({
          region_id: d.region_id,
          district_id: d.district_id || null,
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
    setDrafts((ds) => {
      const next = ds.map((d, i) => (i === idx ? { ...d, ...patch } : d));
      // AUTO-ADD: when user picks a region in the LAST row, add a new empty row
      if (patch.region_id && typeof patch.region_id === 'number' && idx === ds.length - 1 && ds.length < 15) {
        next.push({ region_id: '', district_id: null });
      }
      return next;
    });
    if (patch.region_id && typeof patch.region_id === 'number') loadDistrictsFor(patch.region_id);
  }

  function removeRow(idx: number) {
    setDrafts((ds) => {
      const next = ds.filter((_, i) => i !== idx);
      // Keep at least one row
      if (next.length === 0) next.push({ region_id: '', district_id: null });
      return next;
    });
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
        facility_id: null, facility_name: null,
        notes: null,
      });
    }
    await onSubmit({ desired_destinations: dests });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 size={18} className="text-brand-blue" />
        <h2 className="text-base font-bold text-brand-grey-900">{t('step4.title')}</h2>
      </div>
      <p className="text-sm text-brand-grey-500 mb-2">{t('step4.subtitle')}</p>

      {drafts.map((d, idx) => {
        const districts = d.region_id ? districtsMap[d.region_id] || [] : [];
        const isLast = idx === drafts.length - 1;
        const hasRegion = !!d.region_id;
        return (
          <div key={idx} className="relative p-3 rounded-xl border border-brand-grey-200 dark:border-brand-grey-600 bg-brand-grey-50 dark:bg-brand-grey-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-brand-blue uppercase tracking-wide">#{idx + 1}</span>
              {drafts.length > 1 && (
                <button type="button" onClick={() => removeRow(idx)} className="text-xs text-brand-red hover:underline">
                  {t('step4.remove')}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select className="input text-sm" value={d.region_id}
                onChange={(e) => update(idx, { region_id: e.target.value ? Number(e.target.value) : '', district_id: null })}>
                <option value="">Chagua Mkoa</option>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select className="input text-sm" value={d.district_id || ''}
                onChange={(e) => update(idx, { district_id: e.target.value ? Number(e.target.value) : null })}
                disabled={!d.region_id}>
                <option value="">Wilaya (hiari)</option>
                {districts.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </div>
            {/* HINT: ukichagua mkoa kwenye row ya mwisho, row mpya inaongezeka自动 */}
            {isLast && hasRegion && drafts.length < 15 && (
              <div className="text-[10px] text-brand-blue mt-1.5 font-medium animate-pulse">
                + Chagua mkoa mwingine hapa chini kuongeza sehemu nyingine
              </div>
            )}
          </div>
        );
      })}

      {error && (
        <div className="flex items-start gap-2 bg-brand-red-50 border border-brand-red-100 text-brand-red text-xs rounded-xl p-3">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="flex justify-between gap-2 pt-2">
        <button type="button" onClick={onBack} disabled={submitting} className="btn-outline">{t('wizard.back')}</button>
        <button type="submit" disabled={submitting} className="btn-primary">
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
