'use client';

import { useEffect, useState } from 'react';
import { getRegions, getDistricts, getFacilities, getFacilitiesByRegion, type Region, type District, type Facility, type Destination } from '@/lib/api';
import { useDataVersion } from '@/lib/useDataVersion';
import { useT } from '@/lib/i18n';
import { AlertCircle, Plus, Trash2, ChevronDown, X } from 'lucide-react';

interface Props {
  initial: any;
  onBack: () => void;
  onSubmit: (data: any) => Promise<void>;
  submitting: boolean;
}

interface DestEntry {
  region_id: number | '';
  region_name: string;
  selected_districts: number[];  // empty = wilaya yote
  facility_id: string | null;
  facility_name: string | null;
}

export default function Step4Destinations({ initial, onBack, onSubmit, submitting }: Props) {
  const t = useT();
  const dv = useDataVersion();
  const [regions, setRegions] = useState<Region[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [yearsOfService, setYearsOfService] = useState<string>(initial.years_of_service ? String(initial.years_of_service) : '');

  const category: 'health' | 'education' = initial.category;
  const employmentSector: string | undefined = initial.employment_sector;
  const isWizara = category === 'health' && employmentSector === 'wizara_afya';

  // ── Destinations ──
  const initDests: DestEntry[] = (() => {
    const existing = initial.desired_destinations;
    if (Array.isArray(existing) && existing.length > 0) {
      // Group by region_id — kila mkoa = destination moja
      const byRegion = new Map<number, DestEntry>();
      for (const d of existing) {
        const rid = d.region_id;
        if (!byRegion.has(rid)) {
          byRegion.set(rid, {
            region_id: rid,
            region_name: d.region_name || '',
            selected_districts: [],
            facility_id: d.facility_id || null,
            facility_name: d.facility_name || null,
          });
        }
        const entry = byRegion.get(rid)!;
        if (d.district_id) {
          entry.selected_districts.push(d.district_id);
        }
      }
      return Array.from(byRegion.values());
    }
    return [{
      region_id: '',
      region_name: '',
      selected_districts: [],
      facility_id: null,
      facility_name: null,
    }];
  })();
  const [dests, setDests] = useState<DestEntry[]>(initDests);

  useEffect(() => { getRegions().then(setRegions).catch(() => {}); }, [dv]);

  // ── Districts cache per region ──
  const [regionDistricts, setRegionDistricts] = useState<Record<number, District[]>>({});
  useEffect(() => {
    const regionIds = dests.filter((d) => d.region_id && !regionDistricts[d.region_id as number]).map((d) => d.region_id as number);
    regionIds.forEach((rid) => {
      getDistricts(rid).then((list) => setRegionDistricts((m) => ({ ...m, [rid]: list }))).catch(() => {});
    });
  }, [dests, regionDistricts]);

  // ── Facilities per region (Wizara ya Afya) ──
  const [regionFacilities, setRegionFacilities] = useState<Record<number, Facility[]>>({});
  const [regionFacLoading, setRegionFacLoading] = useState<Record<number, boolean>>({});
  useEffect(() => {
    if (!isWizara) return;
    const regionIds = dests.filter((d) => d.region_id && !regionFacilities[d.region_id as number]).map((d) => d.region_id as number);
    [...new Set(regionIds)].forEach((rid) => {
      setRegionFacLoading((m) => ({ ...m, [rid]: true }));
      getFacilitiesByRegion(rid, 'health', undefined, 'wizara_afya').then((list) => {
        setRegionFacilities((m) => ({ ...m, [rid]: list }));
      }).catch(() => {}).finally(() => {
        setRegionFacLoading((m) => ({ ...m, [rid]: false }));
      });
    });
  }, [dests, regionFacilities, isWizara]);

  // ── Facilities per district (TAMISEMI/Elimu) — lazima kila wilaya iwe na kituo ──
  const [districtFacilities, setDistrictFacilities] = useState<Record<number, Facility[]>>({});
  useEffect(() => {
    if (isWizara) return;
    const districtIds = dests.flatMap((d) => d.selected_districts).filter((did) => !districtFacilities[did]);
    [...new Set(districtIds)].forEach((did) => {
      getFacilities(did, category).then((list) => setDistrictFacilities((m) => ({ ...m, [did]: list }))).catch(() => {});
    });
  }, [dests, districtFacilities, category, isWizara]);

  function updateDest(i: number, patch: Partial<DestEntry>) {
    setDests((prev) => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  }

  function toggleDistrict(destIdx: number, districtId: number) {
    setDests((prev) => prev.map((d, idx) => {
      if (idx !== destIdx) return d;
      const current = d.selected_districts;
      const next = current.includes(districtId)
        ? current.filter((id) => id !== districtId)
        : [...current, districtId];
      return { ...d, selected_districts: next };
    }));
  }

  function addDest() {
    setDests([...dests, {
      region_id: '', region_name: '',
      selected_districts: [],
      facility_id: null, facility_name: null,
    }]);
  }

  function removeDest(i: number) {
    setDests(dests.filter((_, idx) => idx !== i));
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    const validDests = dests.filter((d) => d.region_id);
    if (validDests.length === 0) { setError(t('step4.err_region')); return; }

    const destinations: Destination[] = [];
    for (const d of validDests) {
      const region = regions.find((r) => r.id === Number(d.region_id))!;

      if (isWizara) {
        // Wizara ya Afya: Mkoa + Hospitali (hakuna wilaya)
        const facList = regionFacilities[d.region_id as number] || [];
        const facility = d.facility_id ? facList.find((f: any) => String(f.id || f.code) === d.facility_id) : null;
        if (!d.facility_id) { setError(`Chagua hospitali kwa mkoa ${region.name}`); return; }
        destinations.push({
          region_id: region.id,
          region_name: region.name,
          district_id: facility?.district_id || null,
          district_name: facility?.district || null,
          facility_id: facility ? String(facility.id || facility.code) : null,
          facility_name: facility?.name || null,
          notes: null,
        });
      } else {
        // TAMISEMI/Elimu: Mkoa + Wilaya(s) + Kituo kwa kila wilaya
        const selectedDistricts = d.selected_districts;

        if (selectedDistricts.length === 0) {
          // "Wilaya yeyote" — moja tu bila wilaya maalum
          // Lazima aweke kituo kama kuna wilaya moja tu
          const distList = regionDistricts[d.region_id as number] || [];
          if (distList.length === 1) {
            // Wilaya moja tu — weka moja kwa moja
            const onlyDistrict = distList[0];
            const facList = districtFacilities[onlyDistrict.id] || [];
            const facility = d.facility_id ? facList.find((f: any) => String(f.id || f.code) === d.facility_id) : null;
            destinations.push({
              region_id: region.id,
              region_name: region.name,
              district_id: onlyDistrict.id,
              district_name: onlyDistrict.name,
              facility_id: facility ? String(facility.id || facility.code) : null,
              facility_name: facility?.name || null,
              notes: null,
            });
          } else {
            // Wilaya nyingi — "Wilaya yeyote"
            if (!d.facility_id) {
              // Hakuna kituo — weka kwa kila wilaya bila kituo
              destinations.push({
                region_id: region.id,
                region_name: region.name,
                district_id: null,
                district_name: null,
                facility_id: null,
                facility_name: null,
                notes: null,
              });
            } else {
              // Kuna kituo — weka kwa kila wilaya
              for (const dist of distList) {
                const facList = districtFacilities[dist.id] || [];
                const facility = facList.find((f: any) => String(f.id || f.code) === d.facility_id);
                destinations.push({
                  region_id: region.id,
                  region_name: region.name,
                  district_id: dist.id,
                  district_name: dist.name,
                  facility_id: facility ? String(facility.id || facility.code) : null,
                  facility_name: facility?.name || null,
                  notes: null,
                });
              }
            }
          }
        } else {
          // Wilaya maalum zilizochaguliwa
          for (const did of selectedDistricts) {
            const distList = regionDistricts[d.region_id as number] || [];
            const district = distList.find((x) => x.id === did);
            if (!district) continue;
            const facList = districtFacilities[did] || [];
            const facility = d.facility_id ? facList.find((f: any) => String(f.id || f.code) === d.facility_id) : null;
            destinations.push({
              region_id: region.id,
              region_name: region.name,
              district_id: district.id,
              district_name: district.name,
              facility_id: facility ? String(facility.id || facility.code) : null,
              facility_name: facility?.name || null,
              notes: null,
            });
          }
        }
      }
    }

    if (destinations.length === 0) { setError('Ongeza angalau mkoa mmoja'); return; }

    await onSubmit({
      desired_destinations: destinations,
      years_of_service: yearsOfService ? Number(yearsOfService) : null,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-brand-grey-900 mb-1">{t('step4.title')}</h2>
        <p className="text-sm text-brand-grey-500 mb-1">{t('step4.subtitle')}</p>
      </div>

      <div className="space-y-4">
        {dests.map((d, i) => (
          <div key={i} className="relative p-3 rounded-xl bg-brand-grey-50 dark:bg-brand-grey-800 border border-brand-grey-200 dark:border-brand-grey-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-brand-blue flex items-center gap-1">
                <ChevronDown size={12} />
                Mkoa wa Lengo {i + 1}
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
                updateDest(i, { region_id: rid, region_name: rname, selected_districts: [], facility_id: null, facility_name: null });
              }} required>
              <option value="">— Chagua Mkoa wa Lengo —</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            {/* ── Wizara ya Afya: Hospitali tu (hakuna wilaya) ── */}
            {isWizara && d.region_id && (
              regionFacLoading[d.region_id as number] ? (
                <div className="input text-sm text-brand-grey-400">Inapakia hospitali...</div>
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

            {/* ── TAMISEMI/Elimu: Checkboxes za wilaya + Kituo ── */}
            {!isWizara && d.region_id && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-brand-grey-500 uppercase">Wilaya za lengo</span>

                {/* Checkboxes za wilaya */}
                <div className="bg-white dark:bg-brand-grey-900 rounded-lg p-2 border border-brand-grey-200 dark:border-brand-grey-700 space-y-1.5">
                  {/* Default: Wilaya yeyote */}
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox"
                      className="w-3.5 h-3.5 rounded border-brand-grey-300 text-brand-blue focus:ring-brand-blue"
                      checked={d.selected_districts.length === 0}
                      onChange={() => updateDest(i, { selected_districts: [], facility_id: null, facility_name: null })} />
                    <span className="font-semibold text-brand-grey-700 dark:text-brand-grey-300">Wilaya yeyote</span>
                  </label>

                  {/* Wilaya zote za mkoa */}
                  {(regionDistricts[d.region_id as number] || []).map((dist) => (
                    <label key={dist.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox"
                        className="w-3.5 h-3.5 rounded border-brand-grey-300 text-brand-blue focus:ring-brand-blue"
                        checked={d.selected_districts.includes(dist.id)}
                        onChange={() => toggleDistrict(i, dist.id)} />
                      <span className="text-brand-grey-600 dark:text-brand-grey-400">{dist.name}</span>
                    </label>
                  ))}
                </div>

                {/* Kituo — lazima */}
                <select className="input text-sm" value={d.facility_id || ''}
                  onChange={(e) => {
                    const fid = e.target.value || null;
                    // Find facility in any district
                    let facName: string | null = null;
                    for (const did of (d.selected_districts.length > 0 ? d.selected_districts : (regionDistricts[d.region_id as number] || []).map((x) => x.id))) {
                      const facList = districtFacilities[did] || [];
                      const fac = fid ? facList.find((f: any) => String(f.id || f.code) === fid) : null;
                      if (fac) { facName = fac.name; break; }
                    }
                    updateDest(i, { facility_id: fid, facility_name: facName });
                  }}>
                  <option value="">{category === 'health' ? 'Chagua Hospitali/Kituo (hiari)' : 'Chagua Shule (hiari)'}</option>
                  {/* Onyesha vituo vya wilaya zilizochaguliwa, au zote kama "wilaya yeyote" */}
                  {[...(d.selected_districts.length > 0 ? d.selected_districts : (regionDistricts[d.region_id as number] || []).map((x) => x.id))].flatMap((did) => {
                    const facList = districtFacilities[did] || [];
                    return facList.map((f: any) => (
                      <option key={`${did}-${f.id || f.code}`} value={String(f.id || f.code)}>
                        {f.name}{f.type ? ` (${f.type})` : ''}
                      </option>
                    ));
                  })}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={addDest}
        className="flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-brand-blue/80 transition">
        <Plus size={16} />
        Ongeza Mkoa Mwingine
      </button>

      {/* Years of Service — lazima */}
      <div className="pt-2">
        <label className="label">Umefanya kazi kwa miaka mingapi? *</label>
        <select className="input" value={yearsOfService} onChange={(e) => setYearsOfService(e.target.value)} required>
          <option value="">Chagua miaka ya kazi</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3+ (miaka 3 au zaidi)</option>
        </select>
      </div>

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
