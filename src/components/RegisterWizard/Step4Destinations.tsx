'use client';

import { useEffect, useState } from 'react';
import { getRegions, getDistricts, getFacilities, getFacilitiesByRegion, type Region, type District, type Facility, type Destination } from '@/lib/api';
import { useDataVersion } from '@/lib/useDataVersion';
import { useT } from '@/lib/i18n';
import { AlertCircle, Plus, Trash2, ChevronDown } from 'lucide-react';

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
  facility_id: string | null;
  facility_name: string | null;
}

export default function Step4Destinations({ initial, onBack, onSubmit, submitting }: Props) {
  const t = useT();
  const dv = useDataVersion();
  const [regions, setRegions] = useState<Region[]>([]);
  const [destDistricts, setDestDistricts] = useState<Record<number, District[]>>({});
  const [error, setError] = useState<string | null>(null);

  const category: 'health' | 'education' = initial.category;
  const employmentSector: string | undefined = initial.employment_sector;
  const isWizara = category === 'health' && employmentSector === 'wizara_afya';

  const initDests: DestEntry[] = (() => {
    const existing = initial.desired_destinations;
    if (Array.isArray(existing) && existing.length > 0) {
      return existing.map((d: any) => ({
        region_id: d.region_id || '',
        region_name: d.region_name || '',
        district_id: d.district_id || null,
        district_name: d.district_name || null,
        facility_id: d.facility_id || null,
        facility_name: d.facility_name || null,
      }));
    }
    return [{ region_id: '', region_name: '', district_id: null, district_name: null, facility_id: null, facility_name: null }];
  })();
  const [dests, setDests] = useState<DestEntry[]>(initDests);

  useEffect(() => { getRegions().then(setRegions).catch(() => {}); }, [dv]);

  // Load districts when region is chosen (TAMISEMI/Elimu only)
  useEffect(() => {
    if (isWizara) return;
    const uncached = dests.filter((d) => d.region_id && !destDistricts[d.region_id]);
    uncached.forEach((d) => {
      getDistricts(Number(d.region_id)).then((list) => {
        setDestDistricts((m) => ({ ...m, [d.region_id as number]: list }));
      }).catch(() => {});
    });
  }, [dests, destDistricts, isWizara]);

  // Load facilities when district is chosen (TAMISEMI/Elimu)
  const [destFacilities, setDestFacilities] = useState<Record<number, Facility[]>>({});
  useEffect(() => {
    if (isWizara) return;
    const uncached = dests.filter((d) => d.district_id && !destFacilities[d.district_id as number]);
    uncached.forEach((d) => {
      getFacilities(Number(d.district_id), category).then((list) => {
        setDestFacilities((m) => ({ ...m, [d.district_id as number]: list }));
      }).catch(() => {});
    });
  }, [dests, destFacilities, category, isWizara]);

  // Load ALL facilities in region (Wizara ya Afya)
  const [regionFacilities, setRegionFacilities] = useState<Record<number, Facility[]>>({});
  const [regionFacLoading, setRegionFacLoading] = useState<Record<number, boolean>>({});
  useEffect(() => {
    if (!isWizara) return;
    const uncached = dests.filter((d) => d.region_id && !regionFacilities[d.region_id as number]);
    uncached.forEach((d) => {
      setRegionFacLoading((m) => ({ ...m, [d.region_id as number]: true }));
      getFacilitiesByRegion(Number(d.region_id), 'health', undefined, isWizara ? 'wizara_afya' : 'tamisemi').then((list) => {
        setRegionFacilities((m) => ({ ...m, [d.region_id as number]: list }));
      }).catch(() => {}).finally(() => {
        setRegionFacLoading((m) => ({ ...m, [d.region_id as number]: false }));
      });
    });
  }, [dests, regionFacilities, isWizara]);

  function updateDest(i: number, patch: Partial<DestEntry>) {
    setDests((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
    if (patch.region_id && !isWizara) {
      const r = regions.find((rr) => rr.id === patch.region_id);
      if (r && !destDistricts[r.id]) {
        getDistricts(r.id).then((list) => setDestDistricts((m) => ({ ...m, [r.id]: list })));
      }
    }
    if (patch.district_id !== undefined && !patch.facility_id) {
      setDests((prev) => prev.map((d, idx) => (idx === i ? { ...d, facility_id: null, facility_name: null } : d)));
    }
  }

  function addDest() {
    setDests([...dests, { region_id: '', region_name: '', district_id: null, district_name: null, facility_id: null, facility_name: null }]);
  }

  function removeDest(i: number) {
    setDests(dests.filter((_, idx) => idx !== i));
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    const validDests = dests.filter((d) => d.region_id);
    if (validDests.length === 0) {
      setError(t('step4.err_region'));
      return;
    }

    const destinations: Destination[] = validDests.map((d) => {
      const region = regions.find((r) => r.id === Number(d.region_id))!;

      if (isWizara) {
        // Wizara ya Afya: Mkoa + Hospitali
        const facList = regionFacilities[d.region_id as number] || [];
        const facility = d.facility_id ? facList.find((f: any) => String(f.id || f.code) === d.facility_id) : null;
        return {
          region_id: region.id,
          region_name: region.name,
          district_id: facility?.district_id || null,
          district_name: facility?.district || null,
          facility_id: facility ? String(facility.id || facility.code) : null,
          facility_name: facility?.name || null,
          notes: null,
        };
      } else {
        // TAMISEMI/Elimu: Mkoa + Wilaya + Kituo
        const distList = destDistricts[d.region_id as number] || [];
        const district = d.district_id ? distList.find((x) => x.id === Number(d.district_id)) : null;
        const facList = destFacilities[d.district_id as number] || [];
        const facility = d.facility_id ? facList.find((f: any) => String(f.id || f.code) === d.facility_id) : null;
        return {
          region_id: region.id,
          region_name: region.name,
          district_id: district?.id || null,
          district_name: district?.name || null,
          facility_id: facility ? String(facility.id || facility.code) : null,
          facility_name: facility?.name || null,
          notes: null,
        };
      }
    });

    await onSubmit({ desired_destinations: destinations });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-brand-grey-900 mb-1">{t('step4.title')}</h2>
        <p className="text-sm text-brand-grey-500 mb-1">{t('step4.subtitle')}</p>
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
                updateDest(i, { region_id: rid, region_name: rname, district_id: null, district_name: null, facility_id: null, facility_name: null });
              }} required>
              <option value="">— Chagua Mkoa —</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            {/* ── Wizara ya Afya: Hospitali search (skip wilaya) ── */}
            {isWizara && d.region_id && (
              regionFacLoading[d.region_id as number] ? (
                <div className="input text-sm text-brand-grey-400">Inapakia...</div>
              ) : (
                <select className="input text-sm" value={d.facility_id || ''}
                  onChange={(e) => {
                    const fid = e.target.value || null;
                    const facList = regionFacilities[d.region_id as number] || [];
                    const fac = fid ? facList.find((f: any) => String(f.id || f.code) === fid) : null;
                    updateDest(i, { facility_id: fid, facility_name: fac?.name || null });
                  }} required>
                  <option value="">Chagua Hospitali ya Rufaa</option>
                  {(regionFacilities[d.region_id as number] || []).map((f: any) => (
                    <option key={f.id || f.code} value={String(f.id || f.code)}>
                      {f.name}{f.type ? ` (${f.type})` : ''}
                    </option>
                  ))}
                </select>
              )
            )}

            {/* ── TAMISEMI/Elimu: Wilaya + Kituo ── */}
            {!isWizara && d.region_id && (
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

            {!isWizara && d.district_id && (
              <select className="input text-sm" value={d.facility_id || ''}
                onChange={(e) => {
                  const fid = e.target.value || null;
                  const facList = destFacilities[d.district_id as number] || [];
                  const fac = fid ? facList.find((f: any) => String(f.id || f.code) === fid) : null;
                  updateDest(i, { facility_id: fid, facility_name: fac?.name || null });
                }}>
                <option value="">{category === 'health' ? 'Hospitali/Kituo chote cha wilaya hii' : 'Shule zote za wilaya hii'}</option>
                {(destFacilities[d.district_id as number] || []).map((f: any) => (
                  <option key={f.id || f.code} value={String(f.id || f.code)}>
                    {f.name}{f.type ? ` (${f.type})` : ''}
                  </option>
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
