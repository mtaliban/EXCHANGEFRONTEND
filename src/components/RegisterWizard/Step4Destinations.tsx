'use client';

import { useEffect, useState } from 'react';
import { getRegions, getDistricts, type Region, type District, type Destination } from '@/lib/api';
import { useDataVersion } from '@/lib/useDataVersion';
import { useT } from '@/lib/i18n';
import { AlertCircle, Plus, Trash2, MapPin, ChevronDown } from 'lucide-react';

interface Props {
  initial: any;
  onBack: () => void;
  onSubmit: (data: any) => Promise<void>;
  submitting: boolean;
}

interface DestEntry {
  region_id: number | '';
  region_name: string;
  district_id: number | null;
  district_name: string | null;
}

export default function Step4Destinations({ initial, onBack, onSubmit, submitting }: Props) {
  const t = useT();
  const dv = useDataVersion();
  const [regions, setRegions] = useState<Region[]>([]);
  const [destDistricts, setDestDistricts] = useState<Record<number, District[]>>({});
  const [error, setError] = useState<string | null>(null);

  // Initialize from existing data or default with one empty entry
  const initDests: DestEntry[] = (() => {
    const existing = initial.desired_destinations;
    if (Array.isArray(existing) && existing.length > 0) {
      return existing.map((d: any) => ({
        region_id: d.region_id || '',
        region_name: d.region_name || '',
        district_id: d.district_id || null,
        district_name: d.district_name || null,
      }));
    }
    return [{ region_id: '', region_name: '', district_id: null, district_name: null }];
  })();
  const [dests, setDests] = useState<DestEntry[]>(initDests);

  useEffect(() => { getRegions().then(setRegions).catch(() => {}); }, [dv]);

  // Load districts when region is chosen
  useEffect(() => {
    const uncached = dests.filter((d) => d.region_id && !destDistricts[d.region_id]);
    uncached.forEach((d) => {
      getDistricts(Number(d.region_id)).then((list) => {
        setDestDistricts((m) => ({ ...m, [d.region_id as number]: list }));
      }).catch(() => {});
    });
  }, [dests, destDistricts]);

  function updateDest(i: number, patch: Partial<DestEntry>) {
    setDests((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
    if (patch.region_id) {
      const r = regions.find((rr) => rr.id === patch.region_id);
      if (r && !destDistricts[r.id]) {
        getDistricts(r.id).then((list) => setDestDistricts((m) => ({ ...m, [r.id]: list })));
      }
    }
  }

  function addDest() {
    setDests([...dests, { region_id: '', region_name: '', district_id: null, district_name: null }]);
  }

  function removeDest(i: number) {
    setDests(dests.filter((_, idx) => idx !== i));
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    // Filter out empty entries
    const validDests = dests.filter((d) => d.region_id);
    if (validDests.length === 0) {
      setError(t('step4.err_region'));
      return;
    }

    const destinations: Destination[] = validDests.map((d) => {
      const region = regions.find((r) => r.id === Number(d.region_id))!;
      const distList = destDistricts[d.region_id as number] || [];
      const district = d.district_id ? distList.find((x) => x.id === Number(d.district_id)) : null;
      return {
        region_id: region.id,
        region_name: region.name,
        district_id: district?.id || null,
        district_name: district?.name || null,
        facility_id: null,
        facility_name: null,
        notes: null,
      };
    });

    await onSubmit({ desired_destinations: destinations });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-brand-grey-900 mb-1">{t('step4.title')}</h2>
        <p className="text-sm text-brand-grey-500 mb-1">{t('step4.subtitle')}</p>
        <p className="text-xs text-brand-blue font-medium">
          <MapPin size={12} className="inline mr-1" />
          Unaweza kuweka mikoa mingi — utaonekana kwenye dashboard ya watu wa kila mkoa
        </p>
      </div>

      {/* Destination entries */}
      <div className="space-y-3">
        {dests.map((d, i) => (
          <div key={i} className="relative p-3 rounded-xl bg-brand-grey-50 dark:bg-brand-grey-800 border border-brand-grey-200 dark:border-brand-grey-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-brand-blue flex items-center gap-1">
                <ChevronDown size={12} />
                Mkoa wa {i + 1}
              </span>
              {dests.length > 1 && (
                <button type="button" onClick={() => removeDest(i)}
                  className="text-brand-red hover:text-red-700 p-1 rounded transition"
                  title="Ondoa mkoa huu">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Region select */}
            <select className="input text-sm" value={d.region_id}
              onChange={(e) => {
                const rid = e.target.value ? Number(e.target.value) : '';
                const rname = regions.find((r) => r.id === rid)?.name || '';
                updateDest(i, { region_id: rid, region_name: rname, district_id: null, district_name: null });
              }} required>
              <option value="">— Chagua Mkoa —</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            {/* District select (optional) */}
            {d.region_id && (
              <select className="input text-sm" value={d.district_id || ''}
                onChange={(e) => {
                  const did = e.target.value ? Number(e.target.value) : null;
                  const dname = (destDistricts[d.region_id as number] || []).find((x) => x.id === did)?.name || null;
                  updateDest(i, { district_id: did, district_name: dname });
                }}>
                <option value="">Wilaya yote ya mkoa huu</option>
                {(destDistricts[d.region_id as number] || []).map((x) => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      {/* Add more button */}
      <button type="button" onClick={addDest}
        className="flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-brand-blue/80 transition">
        <Plus size={16} />
        Ongeza Mkoa Mwingine
      </button>

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
