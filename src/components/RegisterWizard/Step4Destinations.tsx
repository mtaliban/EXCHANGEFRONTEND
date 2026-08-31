'use client';

import { useEffect, useState, useMemo } from 'react';
import { getRegions, getDistricts, getFacilities, getFacilitiesByRegion, type Region, type District, type Facility, type Destination } from '@/lib/api';
import { useDataVersion } from '@/lib/useDataVersion';
import { useT } from '@/lib/i18n';
import { AlertCircle, Plus, Trash2, ChevronDown, Search, X } from 'lucide-react';

interface Props {
  initial: any;
  onBack: () => void;
  onSubmit: (data: any) => Promise<void>;
  submitting: boolean;
}

interface DistrictEntry {
  district_id: number | null;
  district_name: string | null;
  facility_id: string | null;
  facility_name: string | null;
  custom_facility: string;  // mtu akiandika kituo kisichopo
  facility_search: string;  // search filter
}

interface DestEntry {
  region_id: number | '';
  region_name: string;
  districts: DistrictEntry[];
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

  // ── Mfumo mpya: kila destination = mkoa mmoja + wilaya nyingi ──
  const initDests: DestEntry[] = (() => {
    const existing = initial.desired_destinations;
    if (Array.isArray(existing) && existing.length > 0) {
      // Group by region_id
      const byRegion = new Map<number, DestEntry>();
      for (const d of existing) {
        const rid = d.region_id;
        if (!byRegion.has(rid)) {
          byRegion.set(rid, {
            region_id: rid,
            region_name: d.region_name || '',
            districts: [],
          });
        }
        byRegion.get(rid)!.districts.push({
          district_id: d.district_id || null,
          district_name: d.district_name || null,
          facility_id: d.facility_id || null,
          facility_name: d.facility_name || null,
          custom_facility: '',
          facility_search: '',
        });
      }
      return Array.from(byRegion.values());
    }
    return [{
      region_id: '',
      region_name: '',
      districts: [{ district_id: null, district_name: null, facility_id: null, facility_name: null, custom_facility: '', facility_search: '' }],
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

  // ── Facilities cache per district (TAMISEMI/Elimu) ──
  const [districtFacilities, setDistrictFacilities] = useState<Record<number, Facility[]>>({});
  useEffect(() => {
    if (isWizara) return;
    const districtIds = dests.flatMap((d) => d.districts).filter((dd) => dd.district_id && !districtFacilities[dd.district_id as number]).map((dd) => dd.district_id as number);
    [...new Set(districtIds)].forEach((did) => {
      getFacilities(did, category).then((list) => setDistrictFacilities((m) => ({ ...m, [did]: list }))).catch(() => {});
    });
  }, [dests, districtFacilities, category, isWizara]);

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

  function updateRegion(i: number, regionId: number | '', regionName: string) {
    setDests((prev) => prev.map((d, idx) => idx === i ? {
      ...d, region_id: regionId, region_name: regionName,
      districts: [{ district_id: null, district_name: null, facility_id: null, facility_name: null, custom_facility: '', facility_search: '' }],
    } : d));
  }

  function addDistrict(i: number) {
    setDests((prev) => prev.map((d, idx) => idx === i ? {
      ...d, districts: [...d.districts, { district_id: null, district_name: null, facility_id: null, facility_name: null, custom_facility: '', facility_search: '' }],
    } : d));
  }

  function removeDistrict(destIdx: number, distIdx: number) {
    setDests((prev) => prev.map((d, idx) => {
      if (idx !== destIdx) return d;
      if (d.districts.length <= 1) return d;
      return { ...d, districts: d.districts.filter((_, di) => di !== distIdx) };
    }));
  }

  function updateDistrict(destIdx: number, distIdx: number, patch: Partial<DistrictEntry>) {
    setDests((prev) => prev.map((d, idx) => {
      if (idx !== destIdx) return d;
      return { ...d, districts: d.districts.map((dd, di) => di === distIdx ? { ...dd, ...patch } : dd) };
    }));
  }

  function addDest() {
    setDests([...dests, {
      region_id: '', region_name: '',
      districts: [{ district_id: null, district_name: null, facility_id: null, facility_name: null, custom_facility: '', facility_search: '' }],
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

    // Flattened destinations: kila district = destination moja
    const destinations: Destination[] = [];
    for (const d of validDests) {
      const region = regions.find((r) => r.id === Number(d.region_id))!;
      for (const dd of d.districts) {
        if (isWizara) {
          // Wizara ya Afya: Mkoa + Hospitali
          const facList = regionFacilities[d.region_id as number] || [];
          const facility = dd.facility_id ? facList.find((f: any) => String(f.id || f.code) === dd.facility_id) : null;
          destinations.push({
            region_id: region.id,
            region_name: region.name,
            district_id: facility?.district_id || null,
            district_name: facility?.district || null,
            facility_id: facility ? String(facility.id || facility.code) : null,
            facility_name: facility?.name || dd.custom_facility || null,
            notes: dd.custom_facility ? `custom:${dd.custom_facility}` : null,
          });
        } else {
          // TAMISEMI/Elimu: Mkoa + Wilaya + Kituo
          const distList = regionDistricts[d.region_id as number] || [];
          const district = dd.district_id ? distList.find((x) => x.id === Number(dd.district_id)) : null;
          const facList = dd.district_id ? (districtFacilities[dd.district_id as number] || []) : [];
          const facility = dd.facility_id ? facList.find((f: any) => String(f.id || f.code) === dd.facility_id) : null;
          destinations.push({
            region_id: region.id,
            region_name: region.name,
            district_id: district?.id || null,
            district_name: district?.name || null,
            facility_id: facility ? String(facility.id || facility.code) : null,
            facility_name: facility?.name || dd.custom_facility || null,
            notes: dd.custom_facility ? `custom:${dd.custom_facility}` : null,
          });
        }
      }
    }

    if (destinations.length === 0) { setError('Ongeza angalau wilaya moja'); return; }

    // Collect custom facilities kwa backend auto-add
    const customFacilities = destinations
      .filter((d) => d.notes?.startsWith('custom:'))
      .map((d) => ({
        name: d.notes!.replace('custom:', ''),
        region_id: d.region_id,
        region_name: d.region_name,
        district_id: d.district_id,
        district_name: d.district_name,
        category,
      }));

    await onSubmit({
      desired_destinations: destinations,
      years_of_service: yearsOfService ? Number(yearsOfService) : null,
      custom_facilities: customFacilities.length > 0 ? customFacilities : undefined,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-brand-grey-900 mb-1">{t('step4.title')}</h2>
        <p className="text-sm text-brand-grey-500 mb-1">{t('step4.subtitle')}</p>
      </div>

      {/* Destination entries — kila moja ni mkoa + wilaya nyingi */}
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
                updateRegion(i, rid, rname);
              }} required>
              <option value="">— Chagua Mkoa wa Lengo —</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            {/* Wilaya za mkoa huu */}
            {d.region_id && (
              <div className="space-y-2 pl-3 border-l-2 border-brand-blue/30">
                <span className="text-[10px] font-bold text-brand-grey-500 uppercase">Wilaya za lengo</span>

                {d.districts.map((dd, di) => (
                  <DistrictRow
                    key={di}
                    dd={dd}
                    destIdx={i}
                    distIdx={di}
                    isWizara={isWizara}
                    category={category}
                    regionId={d.region_id as number}
                    districts={regionDistricts[d.region_id as number] || []}
                    facilities={isWizara ? (regionFacilities[d.region_id as number] || []) : (dd.district_id ? (districtFacilities[dd.district_id as number] || []) : [])}
                    facLoading={isWizara ? !!regionFacLoading[d.region_id as number] : false}
                    canRemove={d.districts.length > 1}
                    onUpdate={updateDistrict}
                    onRemove={removeDistrict}
                  />
                ))}

                <button type="button" onClick={() => addDistrict(i)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-brand-blue hover:text-brand-blue/80 transition mt-1">
                  <Plus size={12} />
                  Ongeza Wilaya
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add more region button */}
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

/* ═══ DistrictRow — kila wilaya ndani ya mkoa ═══════════════════════════ */
function DistrictRow({ dd, destIdx, distIdx, isWizara, category, regionId, districts, facilities, facLoading, canRemove, onUpdate, onRemove }: {
  dd: DistrictEntry;
  destIdx: number;
  distIdx: number;
  isWizara: boolean;
  category: string;
  regionId: number;
  districts: District[];
  facilities: Facility[];
  facLoading: boolean;
  canRemove: boolean;
  onUpdate: (destIdx: number, distIdx: number, patch: Partial<DistrictEntry>) => void;
  onRemove: (destIdx: number, distIdx: number) => void;
}) {
  const [showCustom, setShowCustom] = useState(false);

  // Filtered facilities by search
  const filteredFacilities = useMemo(() => {
    if (!dd.facility_search) return facilities;
    const q = dd.facility_search.toLowerCase();
    return facilities.filter((f: any) => f.name?.toLowerCase().includes(q) || f.type?.toLowerCase().includes(q));
  }, [facilities, dd.facility_search]);

  return (
    <div className="bg-white dark:bg-brand-grey-900 rounded-lg p-2.5 space-y-2 border border-brand-grey-200 dark:border-brand-grey-700">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-brand-grey-400">Wilaya {distIdx + 1}</span>
        {canRemove && (
          <button type="button" onClick={() => onRemove(destIdx, distIdx)}
            className="text-brand-red/60 hover:text-brand-red p-0.5 rounded transition ml-auto">
            <X size={12} />
          </button>
        )}
      </div>

      {/* ── Wizara ya Afya: Hospitali tu (skip wilaya) ── */}
      {isWizara && (
        facLoading ? (
          <div className="input text-sm text-brand-grey-400">Inapakia hospitali...</div>
        ) : (
          <div className="space-y-1">
            {/* Search */}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-grey-400" />
              <input className="input text-xs pl-7 pr-7"
                placeholder="Chuja jina la hospitali..."
                value={dd.facility_search}
                onChange={(e) => onUpdate(destIdx, distIdx, { facility_search: e.target.value, facility_id: null, facility_name: null })} />
              {dd.facility_search && (
                <button type="button" onClick={() => onUpdate(destIdx, distIdx, { facility_search: '', facility_id: null, facility_name: null })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-grey-400 hover:text-brand-red">
                  <X size={12} />
                </button>
              )}
            </div>
            <select className="input text-sm" value={dd.facility_id || ''}
              onChange={(e) => {
                const fid = e.target.value || null;
                const fac = fid ? filteredFacilities.find((f: any) => String(f.id || f.code) === fid) : null;
                onUpdate(destIdx, distIdx, { facility_id: fid, facility_name: fac?.name || null, facility_search: '' });
              }} required>
              <option value="">Chagua Hospitali ya Rufaa</option>
              {filteredFacilities.map((f: any) => (
                <option key={f.id || f.code} value={String(f.id || f.code)}>
                  {f.name}{f.type ? ` (${f.type})` : ''}
                </option>
              ))}
            </select>
          </div>
        )
      )}

      {/* ── TAMISEMI/Elimu: Wilaya + Kituo ── */}
      {!isWizara && (
        <>
          <select className="input text-sm" value={dd.district_id || ''}
            onChange={(e) => {
              const did = e.target.value ? Number(e.target.value) : null;
              const dname = districts.find((x) => x.id === did)?.name || null;
              onUpdate(destIdx, distIdx, { district_id: did, district_name: dname, facility_id: null, facility_name: null, custom_facility: '', facility_search: '' });
            }} required>
            <option value="">— Chagua Wilaya —</option>
            {districts.map((x) => (
              <option key={x.id} value={x.id}>{x.name}</option>
            ))}
          </select>

          {dd.district_id && (
            <div className="space-y-1">
              {/* Search */}
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-grey-400" />
                <input className="input text-xs pl-7 pr-7"
                  placeholder={`Chuja ${category === 'health' ? 'hospitali' : 'shule'}...`}
                  value={dd.facility_search}
                  onChange={(e) => onUpdate(destIdx, distIdx, { facility_search: e.target.value })} />
                {dd.facility_search && (
                  <button type="button" onClick={() => onUpdate(destIdx, distIdx, { facility_search: '' })}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-grey-400 hover:text-brand-red">
                    <X size={12} />
                  </button>
                )}
              </div>

              {!showCustom ? (
                <>
                  <select className="input text-sm" value={dd.facility_id || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        setShowCustom(true);
                        onUpdate(destIdx, distIdx, { facility_id: null, facility_name: null, custom_facility: '', facility_search: '' });
                      } else {
                        const fid = val || null;
                        const fac = fid ? filteredFacilities.find((f: any) => String(f.id || f.code) === fid) : null;
                        onUpdate(destIdx, distIdx, { facility_id: fid, facility_name: fac?.name || null, facility_search: '' });
                      }
                    }}>
                    <option value="">{category === 'health' ? 'Chagua Hospitali/Kituo' : 'Chagua Shule'}</option>
                    {filteredFacilities.map((f: any) => (
                      <option key={f.id || f.code} value={String(f.id || f.code)}>
                        {f.name}{f.type ? ` (${f.type})` : ''}
                      </option>
                    ))}
                    <option value="__custom__">— Andika mwenyewe (kama haipo) —</option>
                  </select>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input className="input text-sm flex-1"
                    placeholder={category === 'health' ? 'Andika jina la hospitali/kituo...' : 'Andika jina la shule...'}
                    value={dd.custom_facility}
                    onChange={(e) => onUpdate(destIdx, distIdx, { custom_facility: e.target.value })}
                    required />
                  <button type="button" onClick={() => { setShowCustom(false); onUpdate(destIdx, distIdx, { custom_facility: '' }); }}
                    className="text-brand-grey-400 hover:text-brand-red p-1.5">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
