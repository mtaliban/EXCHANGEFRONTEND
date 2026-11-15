'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/register/Icon';
import s from '@/components/register/register.module.css';
import {
  Chosen, IdaraList, KadaPicker, Label, ListHead, MasomoPicker, PhoneField, Progress, RegionGrid, SquareChips,
  Stepper, Summary, ThirdList, YearsBand, cx, type HaliNamba, type Opt,
} from '@/components/register/ui';
import {
  checkPhone,
  extractErrorMessage,
  getCadres,
  getDepartments,
  getDistricts,
  getFacilities,
  getFacilitiesByRegion,
  getRegions,
  getSubjects,
  register,
  type Cadre,
  type Department,
  type Destination,
  type District,
  type Facility,
  type Region,
  type Station,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';

const STEP_NAMES = ['Kwanza', 'Pili', 'Tatu', 'Nne', 'Tano'];
const ORD = ['kwanza', 'pili', 'tatu', 'nne', 'tano'];

const YEARS: Opt[] = [
  { value: '1', label: 'Mwaka 1' },
  { value: '2', label: 'Miaka 2' },
  { value: '3', label: 'Miaka 3+' },
];

const SECTORS: Opt[] = [
  { value: 'wizara_afya', label: 'Wizara ya Afya', icon: 'medCross' },
  { value: 'tamisemi', label: 'TAMISEMI', icon: 'mapPin' },
];

const EDU_LEVELS: Opt[] = [
  { value: 'Primary', label: 'Mwalimu wa Msingi', icon: 'abc' },
  { value: 'Secondary', label: 'Mwalimu wa Sekondari', icon: 'notes' },
];

/** Ikoni ya idara kulingana na code yake. */
const DEPT_ICONS: Record<string, string> = {
  health: 'afya',
  education: 'graduation',
  agriculture: 'leaf',
  livestock: 'leaf',
  public_service: 'idBadge',
  utumishi: 'idBadge',
  umma: 'idBadge',
  kilimo: 'leaf',
};

/** Namba ya simu: tarakimu 10 kuanzia 0, au +255/255 na tarakimu 9. */
const PHONE_RE = /^(\+?255|0)\d{9}$/;
const clean = (v: string) => v.replace(/[\s-]/g, '');
const facId = (f: Facility) => String(f.id ?? f.code ?? '');

type CheckState = 'idle' | 'checking' | 'available' | 'taken';
const CHECK_DEBOUNCE_MS = 400;

type DestEntry = {
  regionId: number | '';
  anyDistrict: boolean;
  districtIds: number[];
  facilityIds: string[];
};

const emptyDest = (): DestEntry => ({ regionId: '', anyDistrict: false, districtIds: [], facilityIds: [] });

export default function RegisterContent() {
  const router = useRouter();
  const setAuth = useAuth((st) => st.setAuth);

  const [step, setStep] = useState(1);

  // Hatua 1
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [touched, setTouched] = useState({ name: false, phone: false, alt: false });
  const [attempted, setAttempted] = useState(false);
  const [primaryCheck, setPrimaryCheck] = useState<CheckState>('idle');
  const [altCheck, setAltCheck] = useState<CheckState>('idle');
  const primaryReq = useRef(0);
  const altReq = useRef(0);

  // Hatua 2
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [category, setCategory] = useState('');
  const [sector, setSector] = useState('');
  const [educationLevel, setEducationLevel] = useState<'Primary' | 'Secondary' | ''>('');

  // Hatua 3
  const [cadres, setCadres] = useState<Cadre[]>([]);
  const [loadingCadres, setLoadingCadres] = useState(false);
  const [cadreCode, setCadreCode] = useState('');
  const [subjects, setSubjects] = useState<{ code: string; name: string }[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Hatua 4
  const [regions, setRegions] = useState<Region[]>([]);
  const [curRegion, setCurRegion] = useState<number | ''>('');
  const [curDistrict, setCurDistrict] = useState<number | ''>('');
  const [curFacility, setCurFacility] = useState('');
  const [curDistricts, setCurDistricts] = useState<District[]>([]);
  const [curFacilities, setCurFacilities] = useState<Facility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  /** Shule/kituo/ofisi ni hiari: orodha imefungwa mpaka mtumiaji abonyeze. */
  const [curThirdOpen, setCurThirdOpen] = useState(false);

  // Hatua 5
  const [dests, setDests] = useState<DestEntry[]>([emptyDest()]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  /** Wilaya/shule za lengo zinafunguka; zikichaguliwa hujifunga kuwa kadi. */
  const [distOpen, setDistOpen] = useState(true);
  const [thirdOpen, setThirdOpen] = useState(false);
  const [destDistricts, setDestDistricts] = useState<Record<number, District[]>>({});
  const [destFacilities, setDestFacilities] = useState<Record<string, Facility[]>>({});
  const [years, setYears] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [deptError, setDeptError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const isHealth = category === 'health';
  const isWizara = isHealth && sector === 'wizara_afya';
  const isEducation = category === 'education';
  /* Kilimo na Ufugaji haina hatua ya Kada. Code inaweza kuwa "kilimo",
   * "agriculture" n.k., kwa hiyo tunakagua code na jina pamoja. */
  const KILIMO_RE = /kilimo|agric|livestock|mifugo/i;
  const isKilimo = !!category && KILIMO_RE.test(`${category} ${departments.find((d) => d.code === category)?.name ?? ''}`);
  /* Watumishi wa Umma: kada inachaguliwa ndani ya Hatua 2, kwa hiyo hatua ni 4 tu. */
  const UMMA_RE = /public|umma|utumishi/i;
  const isUmma = !!category && UMMA_RE.test(`${category} ${departments.find((d) => d.code === category)?.name ?? ''}`);
  const skipKada = isKilimo || isUmma;

  /** Hatua zinazotumika kwa idara iliyochaguliwa. */
  const flow = useMemo(() => {
    const keys = skipKada
      ? ['utambulisho', 'idara', 'kituo', 'lengo']
      : ['utambulisho', 'idara', 'kada', 'kituo', 'lengo'];
    return keys;
  }, [skipKada]);
  const cur = flow[step - 1] ?? 'utambulisho';
  const last = step === flow.length;

  const STEP_TITLES: Record<string, string> = {
    utambulisho: 'Utambulisho Wako',
    idara: 'Idara Yako',
    kada: isEducation ? 'Masomo Yako' : 'Kada Yako',
    kituo: 'Kituo Chako cha Sasa',
    lengo: 'Unakotaka Kwenda',
  };

  const STEP_LABELS = skipKada
    ? ['Utambulisho', 'Idara', 'Kituo', 'Lengo']
    : ['Utambulisho', 'Idara', 'Kada', 'Kituo', 'Lengo'];

  const cadre = cadres.find((c) => c.code === cadreCode);
  const needsSubjects = isEducation
    ? !!educationLevel
    : !!cadre && (cadre.requires_subjects || cadre.level === 'Primary' || cadre.level === 'Secondary');
  const subjectLevel: 'Primary' | 'Secondary' | undefined = isEducation
    ? educationLevel || undefined
    : cadre?.level === 'Primary'
      ? 'Primary'
      : cadre?.level === 'Secondary'
        ? 'Secondary'
        : undefined;

  // Vitendea kazi vya mahali
  const needDistrict = !isWizara;
  const showFacility = isHealth || isEducation;
  const third = useMemo(() => {
    if (!showFacility) return null;
    if (isWizara) {
      return { chip: 'Hospitali ya Rufaa', icon: 'hospital', chagua: 'Chagua Hospitali ya Rufaa', yako: 'Hospitali Yako', tafuta: 'Tafuta hospitali...', lazima: true, neno: 'hospitali' };
    }
    if (isHealth) {
      return { chip: 'Kituo', icon: 'hospital', chagua: 'Chagua Kituo cha Afya', yako: 'Kituo Chako', tafuta: 'Tafuta kituo...', lazima: false, neno: 'kituo' };
    }
    return { chip: 'Shule', icon: 'school', chagua: 'Chagua Shule Yako', yako: 'Shule Yako', tafuta: 'Tafuta shule...', lazima: false, neno: 'shule' };
  }, [showFacility, isWizara, isHealth]);

  /* ── Idara + mikoa (mara moja) ── */
  useEffect(() => {
    getDepartments(true)
      .then((list) => setDepartments(list.filter((d) => d.status !== 'disabled')))
      .catch(() => setDeptError('Imeshindikana kupata orodha ya idara. Jaribu tena.'))
      .finally(() => setLoadingDepts(false));
    getRegions(true).then(setRegions).catch(() => {});
  }, []);

  /* ── Kada: hubadilika idara au sekta inapobadilika ── */
  useEffect(() => {
    if (!category) { setCadres([]); return; }
    let alive = true;
    setLoadingCadres(true);
    setCadreCode('');
    setSelectedSubjects([]);
    getCadres(category, sector || undefined, true)
      .then((list) => { if (alive) setCadres(list); })
      .catch(() => { if (alive) setCadres([]); })
      .finally(() => { if (alive) setLoadingCadres(false); });
    return () => { alive = false; };
  }, [category, sector]);

  /* ── Elimu: ngazi (Msingi/Sekondari) → kada inayolingana ── */
  useEffect(() => {
    if (!isEducation || !educationLevel || cadres.length === 0) return;
    const match = cadres.find((c) => c.level === educationLevel);
    if (match && match.code !== cadreCode) setCadreCode(match.code);
  }, [isEducation, educationLevel, cadres, cadreCode]);

  /* ── Masomo ya kada iliyochaguliwa ── */
  useEffect(() => {
    if (!needsSubjects) { setSubjects([]); return; }
    let alive = true;
    getSubjects(subjectLevel, true)
      .then((list) => { if (alive) setSubjects(list); })
      .catch(() => { if (alive) setSubjects([]); });
    return () => { alive = false; };
  }, [needsSubjects, subjectLevel]);

  /* ── Wilaya za kituo cha sasa ── */
  useEffect(() => {
    setCurDistrict('');
    setCurFacility('');
    if (!curRegion || isWizara) { setCurDistricts([]); return; }
    let alive = true;
    getDistricts(Number(curRegion))
      .then((list) => { if (alive) setCurDistricts(list); })
      .catch(() => { if (alive) setCurDistricts([]); });
    return () => { alive = false; };
  }, [curRegion, isWizara]);

  /* ── Vituo vya kituo cha sasa ── */
  useEffect(() => {
    setCurFacility('');
    if (!showFacility) { setCurFacilities([]); return; }
    let alive = true;
    setLoadingFacilities(true);
    const done = () => { if (alive) setLoadingFacilities(false); };
    if (isWizara) {
      if (!curRegion) { setCurFacilities([]); done(); return; }
      getFacilitiesByRegion(Number(curRegion), 'health', undefined, 'wizara_afya')
        .then((list) => { if (alive) setCurFacilities(list); })
        .catch(() => { if (alive) setCurFacilities([]); })
        .finally(done);
    } else {
      if (!curDistrict) { setCurFacilities([]); done(); return; }
      getFacilities(Number(curDistrict), category as 'health' | 'education', subjectLevel)
        .then((list) => { if (alive) setCurFacilities(list); })
        .catch(() => { if (alive) setCurFacilities([]); })
        .finally(done);
    }
    return () => { alive = false; };
  }, [curRegion, curDistrict, isWizara, showFacility, category, subjectLevel]);

  /* ── Wilaya za mikoa ya lengo ── */
  useEffect(() => {
    dests.forEach((d) => {
      const rid = Number(d.regionId);
      if (!rid || destDistricts[rid]) return;
      getDistricts(rid)
        .then((list) => setDestDistricts((m) => ({ ...m, [rid]: list })))
        .catch(() => {});
    });
  }, [dests, destDistricts]);

  /* ── Vituo vya mikoa/wilaya za lengo ── */
  useEffect(() => {
    if (!showFacility) return;
    dests.forEach((d) => {
      const rid = Number(d.regionId);
      if (!rid) return;
      const key = isWizara || d.anyDistrict || d.districtIds.length !== 1
        ? `r:${rid}`
        : `d:${d.districtIds[0]}`;
      if (destFacilities[key]) return;
      const load = isWizara
        ? getFacilitiesByRegion(rid, 'health', undefined, 'wizara_afya')
        : key.startsWith('r:')
          ? getFacilitiesByRegion(rid, category as 'health' | 'education')
          : getFacilities(Number(key.slice(2)), category as 'health' | 'education', subjectLevel);
      load
        .then((list) => setDestFacilities((m) => ({ ...m, [key]: list })))
        .catch(() => {});
    });
  }, [dests, destFacilities, isWizara, showFacility, category, subjectLevel]);

  /* ── Ukaguzi wa namba ya kwanza ── */
  useEffect(() => {
    const c = clean(phone);
    if (!PHONE_RE.test(c)) { primaryReq.current++; setPrimaryCheck('idle'); return; }
    const id = ++primaryReq.current;
    setPrimaryCheck('checking');
    const timer = setTimeout(() => {
      checkPhone(c)
        .then((r) => { if (id === primaryReq.current) setPrimaryCheck(r.available ? 'available' : 'taken'); })
        .catch(() => { if (id === primaryReq.current) setPrimaryCheck('idle'); });
    }, CHECK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [phone]);

  /* ── Ukaguzi wa WhatsApp ── */
  useEffect(() => {
    const c = clean(whatsapp);
    if (!PHONE_RE.test(c)) { altReq.current++; setAltCheck('idle'); return; }
    const id = ++altReq.current;
    setAltCheck('checking');
    const timer = setTimeout(() => {
      checkPhone(c)
        .then((r) => { if (id === altReq.current) setAltCheck(r.available ? 'available' : 'taken'); })
        .catch(() => { if (id === altReq.current) setAltCheck('idle'); });
    }, CHECK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [whatsapp]);

  const nameMsg = (v: string) => {
    const c = v.trim();
    if (!c) return 'Tafadhali ingiza majina yako.';
    return c.length < 3 ? 'Jina lazima liwe na angalau herufi 3' : null;
  };
  const phoneMsg = (v: string) => {
    const c = clean(v);
    if (!c) return 'Tafadhali ingiza namba yako.';
    return PHONE_RE.test(c) ? null : 'Namba si sahihi';
  };

  const nameError = nameMsg(fullName);
  const phoneError = phoneMsg(phone);
  const altError = phoneMsg(whatsapp);

  /** Hali ya namba: tupu → hakuna; si sahihi → "si_sahihi"; vinginevyo hali ya server. */
  const haliOf = (v: string, check: CheckState): HaliNamba => {
    const c = clean(v);
    if (!c) return null;
    if (!PHONE_RE.test(c)) return 'si_sahihi';
    return check === 'taken' ? 'imetumika' : check === 'available' ? 'huru' : null;
  };

  const deptOptions: Opt[] = useMemo(
    () =>
      departments.map((d) => {
        const t = `${d.code} ${d.name}`.toLowerCase();
        const kilimo = KILIMO_RE.test(t);
        const icon = kilimo
          ? 'leaf'
          : /health|afya/.test(t)
            ? 'afya'
            : /educ|elimu/.test(t)
              ? 'graduation'
              : /public|umma|utumishi/.test(t)
                ? 'idBadge'
                : DEPT_ICONS[d.code] || 'building';
        return { value: d.code, label: kilimo ? 'Kilimo na Ufugaji' : d.name, icon };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [departments],
  );
  const regionOptions: Opt[] = useMemo(
    () => regions.map((r) => ({ value: String(r.id), label: r.name })),
    [regions],
  );
  const districtOptions: Opt[] = useMemo(
    () => curDistricts.map((d) => ({ value: String(d.id), label: d.name })),
    [curDistricts],
  );
  const cadreOptions: Opt[] = useMemo(
    () => cadres.map((c) => ({ value: c.code, label: c.display_name, code: c.code })),
    [cadres],
  );

  const regionName = (id: number | '') => regions.find((r) => r.id === Number(id))?.name || '';
  const deptName = deptOptions.find((d) => d.value === category)?.label || '';
  const groupLabel = isHealth ? 'Afya' : category === 'public_service' ? 'Umma' : deptName;

  const branchOf: Record<string, Opt[]> = {};
  if (isHealth) branchOf[category] = SECTORS;
  if (isEducation) branchOf[category] = EDU_LEVELS;
  const branchValue = isHealth ? sector || null : isEducation ? educationLevel || null : null;

  const thirdOptions = (list: Facility[]): Opt[] =>
    list.map((f) => ({
      value: facId(f),
      label: f.name,
      aina: isEducation ? undefined : f.type || f.type_category || f.level,
    }));

  const destComplete = (d: DestEntry) => {
    if (!d.regionId) return false;
    if (isWizara) return d.facilityIds.length > 0;
    return d.anyDistrict || d.districtIds.length > 0;
  };

  const canNext = useMemo(() => {
    switch (cur) {
      case 'utambulisho':
        return !nameError && !phoneError && !altError && primaryCheck !== 'taken' && altCheck !== 'taken';
      case 'idara':
        if (!category || (isHealth && !sector) || (isEducation && !educationLevel)) return false;
        /* Umma: kada ni sehemu ya hatua hii, kwa hiyo inahitajika kabla ya kuendelea. */
        if (isUmma) return cadres.length === 0 ? true : !!cadreCode;
        return true;
      case 'kada':
        if (isEducation) return selectedSubjects.length === 2;
        return cadres.length === 0 ? true : !!cadreCode;
      case 'kituo':
        if (!curRegion) return false;
        return isWizara ? !!curFacility : !!curDistrict;
      case 'lengo':
        if (!years) return false;
        return dests.length > 0 && dests.every(destComplete);
      default:
        return false;
    }
  }, [
    cur, nameError, phoneError, altError, primaryCheck, altCheck, category, isHealth, sector,
    isEducation, educationLevel, isUmma, selectedSubjects.length, cadres.length, cadreCode, curRegion,
    isWizara, curFacility, curDistrict, years, dests,
  ]);

  function changeCategory(v: string) {
    if (v === category) return;
    setCategory(v);
    setSector('');
    setEducationLevel('');
    setSelectedSubjects([]);
    setCurRegion('');
    setCurDistrict('');
    setCurFacility('');
    setDests([emptyDest()]);
    setEditIdx(0);
    setYears(null);
  }

  function onBranch(v: string) {
    if (isHealth) setSector(v);
    else setEducationLevel(v as 'Primary' | 'Secondary');
  }

  function changeCadre(v: string) {
    if (v !== cadreCode) setSelectedSubjects([]);
    setCadreCode(v);
  }

  function updateDest(i: number, patch: Partial<DestEntry>) {
    setDests((arr) => arr.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }

  function toggleDestDistrict(i: number, id: number) {
    const d = dests[i];
    const on = !d.anyDistrict && d.districtIds.includes(id);
    const ids = d.anyDistrict ? [id] : on ? d.districtIds.filter((x) => x !== id) : [...d.districtIds, id];
    updateDest(i, { anyDistrict: false, districtIds: ids, facilityIds: [] });
  }

  function toggleDestFacility(i: number, v: string) {
    const d = dests[i];
    const single = !isWizara;
    const ids = single
      ? d.facilityIds[0] === v ? [] : [v]
      : d.facilityIds.includes(v)
        ? d.facilityIds.filter((x) => x !== v)
        : [...d.facilityIds, v];
    updateDest(i, { facilityIds: ids });
  }

  async function submit() {
    setSending(true);
    setError(null);
    try {
      const nameOfRegion = (id: number) => regions.find((r) => r.id === id)?.name || '';

      // ── Kituo cha sasa ──
      const curFac = curFacilities.find((x) => facId(x) === curFacility);
      const curDist = curDistricts.find((x) => x.id === Number(curDistrict));
      const current_station: Station = {
        region_id: Number(curRegion),
        region_name: nameOfRegion(Number(curRegion)),
        district_id: isWizara ? curFac?.district_id ?? null : curDist?.id ?? null,
        district_name: isWizara ? curFac?.district ?? null : curDist?.name ?? null,
        facility_id: curFacility || null,
        facility_name: curFac?.name || null,
        facility_type: curFac?.type || curFac?.type_category || curFac?.level || null,
      } as unknown as Station;

      // ── Mikoa ya lengo ──
      const desired_destinations: Destination[] = [];
      for (const d of dests) {
        const rid = Number(d.regionId);
        if (!rid) continue;
        if (isWizara) {
          const list = destFacilities[`r:${rid}`] || [];
          for (const id of d.facilityIds) {
            const f = list.find((x) => facId(x) === id);
            if (!f) continue;
            desired_destinations.push({
              region_id: rid,
              region_name: nameOfRegion(rid),
              district_id: f.district_id ?? null,
              district_name: f.district ?? null,
              facility_id: facId(f),
              facility_name: f.name,
              notes: null,
            });
          }
        } else if (d.anyDistrict) {
          const f = (destFacilities[`r:${rid}`] || []).find((x) => facId(x) === d.facilityIds[0]);
          desired_destinations.push({
            region_id: rid,
            region_name: nameOfRegion(rid),
            district_id: f?.district_id ?? null,
            district_name: f?.district ?? null,
            facility_id: f ? facId(f) : null,
            facility_name: f?.name || null,
            notes: null,
          });
        } else {
          const list = destDistricts[rid] || [];
          for (const did of d.districtIds) {
            const dist = list.find((x) => x.id === did);
            if (!dist) continue;
            const f = (destFacilities[`d:${did}`] || []).find((x) => facId(x) === d.facilityIds[0]);
            desired_destinations.push({
              region_id: rid,
              region_name: nameOfRegion(rid),
              district_id: dist.id,
              district_name: dist.name,
              facility_id: f ? facId(f) : null,
              facility_name: f?.name || null,
              notes: null,
            });
          }
        }
      }

      const res = await register({
        full_name: fullName.trim(),
        phone_primary: clean(phone),
        phone_alt: clean(whatsapp) || undefined,
        category,
        employment_sector: isHealth ? (sector as 'wizara_afya' | 'tamisemi') : undefined,
        cadre_code: cadreCode,
        subjects: selectedSubjects,
        current_station,
        desired_destinations,
        years_of_service: years ? Number(years) : null,
      });

      if (res?.access_token) {
        setAuth(res.access_token, {
          user_id: res.user_id,
          full_name: res.full_name || fullName.trim(),
          phone_primary: res.phone_primary || clean(phone),
          category: res.category as 'health' | 'education',
          cadre_code: res.cadre_code,
          is_admin: false,
          is_verified: false,
        });
        router.push('/dashboard');
      } else {
        router.push(`/login?phone=${encodeURIComponent(clean(phone))}`);
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Usajili umeshinduka. Jaribu tena.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSending(false);
    }
  }

  const next = () => {
    setError(null);
    if (!canNext) {
      setAttempted(true);
      if (cur === 'lengo' && editIdx !== null) closeEditor();
      return;
    }
    setAttempted(false);
    if (!last) setStep(step + 1);
    else submit();
  };
  const back = () => {
    setError(null);
    setAttempted(false);
    setStep((n) => Math.max(1, n - 1));
  };

  /** Mkoa usio na wilaya/hospitali unaondolewa unapofunga mhariri. */
  function closeEditor() {
    setDests((arr) => {
      const kept = arr.filter(destComplete);
      return kept.length ? kept : [emptyDest()];
    });
    setEditIdx(null);
    setDistOpen(true);
    setThirdOpen(false);
  }

  /* ── Kuingia Lengo: fungua mhariri wa mkoa usiokamilika ── */
  useEffect(() => {
    if (cur !== 'lengo' || editIdx !== null) return;
    const i = dests.findIndex((d) => !destComplete(d));
    if (i >= 0) {
      setDistOpen(true);
      setThirdOpen(false);
      setEditIdx(i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur]);

  const curFacFacility = curFacilities.find((f) => facId(f) === curFacility);

  /* ── Mkoa unaohaririwa kwenye Lengo (Hatua 5) ── */
  const ed = editIdx !== null ? dests[editIdx] : null;
  const edDistricts = ed ? destDistricts[Number(ed.regionId)] || [] : [];
  const edDistNames = ed ? edDistricts.filter((x) => ed.districtIds.includes(x.id)).map((x) => x.name) : [];
  const edFacKey = ed
    ? isWizara || ed.anyDistrict || ed.districtIds.length !== 1
      ? `r:${ed.regionId}`
      : `d:${ed.districtIds[0]}`
    : '';
  const edFacs = ed ? destFacilities[edFacKey] || [] : [];
  const edFacNames = ed ? edFacs.filter((f) => ed.facilityIds.includes(facId(f))).map((f) => f.name) : [];
  const edThirdTitle = isWizara ? 'Hospitali za lengo' : third?.chip === 'Shule' ? 'Shule za lengo' : 'Vituo vya lengo';

  return (
    <div className={s.page}>
      {step === 1 && (
        <Link href="/login" className={s.back}>
          <Icon name="chevronLeft" size={16} strokeWidth={2.6} /> Rudi
        </Link>
      )}

      <div className={s.content}>
        <h1 className={s.title}>
          Jaza <span>Taarifa Zako</span>
        </h1>
        <p className={s.subtitle}>Jaza taarifa chache tu ili ujisajili.</p>

        <Stepper steps={STEP_LABELS} current={step} />

        <div className={s.stepHead}>
          <b>Hatua ya {STEP_NAMES[step - 1]}:</b>
          <h2>{STEP_TITLES[cur]}</h2>
        </div>

        {error && (
          <div className={s.banner} role="alert">
            <Icon name="alert" size={16} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        {/* ─────────── HATUA: UTAMBULISHO ─────────── */}
        {cur === 'utambulisho' && (
          <>
            <Label icon="userCircle">Jina Kamili</Label>
            <input
              className={cx(s.input, (touched.name || attempted) && nameError && s.inputError)}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              placeholder="Mfano: Kieffer Madyedye"
              autoComplete="name"
            />
            {(touched.name || attempted) && nameError && <p className={s.err}>{nameError}</p>}

            <Label icon="phone">Namba ya Simu</Label>
            <PhoneField
              value={phone}
              onChange={setPhone}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              placeholder="0712345678"
              hali={haliOf(phone, primaryCheck)}
              checking={!phoneError && primaryCheck === 'checking'}
            />

            <Label icon="waLogo">Namba ya WhatsApp</Label>
            <PhoneField
              value={whatsapp}
              onChange={setWhatsapp}
              onBlur={() => setTouched((t) => ({ ...t, alt: true }))}
              placeholder="0623456789"
              hali={haliOf(whatsapp, altCheck)}
              checking={!altError && altCheck === 'checking'}
            />
          </>
        )}

        {/* ─────────── HATUA: IDARA ─────────── */}
        {cur === 'idara' && (
          <>
            <p className={s.hint}>Unafanya kazi katika idara gani?</p>
            {deptError && !loadingDepts && (
              <div className={s.banner} role="alert">
                <Icon name="alert" size={16} strokeWidth={2} />
                <span>{deptError}</span>
              </div>
            )}
            <Label icon="layers">Chagua Idara</Label>
            {loadingDepts ? (
              <div className={s.loadRow}><span className={s.spin} /> Inapakia idara...</div>
            ) : (
              <IdaraList
                title="Idara"
                options={deptOptions}
                value={category || null}
                onChange={changeCategory}
                branchOf={branchOf}
                branchValue={branchValue}
                onBranch={onBranch}
              />
            )}

            {/* Umma: kada inachaguliwa ndani ya hatua hii */}
            {isUmma && !loadingDepts && (
              loadingCadres ? (
                <div className={s.loadRow}><span className={s.spin} /> Inapakia kada...</div>
              ) : cadres.length === 0 ? (
                <p className={s.noteBlue}>
                  Idara hii haijawekwa kada bado — unaweza kuendelea; utapatanishwa na wenzako wote wa idara hii.
                </p>
              ) : (
                <KadaPicker
                  group="Umma"
                  options={cadreOptions}
                  value={cadreCode || null}
                  onChange={changeCadre}
                  mfano="VEO"
                />
              )
            )}
          </>
        )}

        {/* ─────────── HATUA: MASOMO (Elimu) ─────────── */}
        {cur === 'kada' && isEducation && (
          <>
            <Summary
              rows={[
                { k: 'Idara', icon: 'graduation', v: 'Elimu' },
                {
                  k: 'Ngazi',
                  icon: educationLevel === 'Primary' ? 'abc' : 'notes',
                  v: educationLevel === 'Primary' ? 'Mwalimu wa Msingi' : 'Mwalimu wa Sekondari',
                },
              ]}
            />
            <Label icon="tag" note="chagua 2">Masomo unayofundisha</Label>
            <MasomoPicker
              options={subjects.map((x) => ({ value: x.code, label: x.name }))}
              value={selectedSubjects}
              onChange={setSelectedSubjects}
              max={2}
            />
          </>
        )}

        {/* ─────────── HATUA: KADA (Afya / Umma) ─────────── */}
        {cur === 'kada' && !isEducation && (
          <>
            <Summary
              rows={
                isHealth
                  ? [
                      { k: 'Idara', icon: 'afya', v: 'Afya' },
                      {
                        k: 'Wizara',
                        icon: sector === 'wizara_afya' ? 'medCross' : 'mapPin',
                        v: sector === 'wizara_afya' ? 'Wizara ya Afya' : 'TAMISEMI',
                      },
                    ]
                  : [{ k: 'Idara', icon: 'idBadge', v: deptName }]
              }
            />
            <Label icon="idBadge" note="chagua moja">Kada yako</Label>
            {loadingCadres ? (
              <div className={s.loadRow}><span className={s.spin} /> Inapakia kada...</div>
            ) : cadres.length === 0 ? (
              <p className={s.noteBlue}>
                Idara hii haijawekwa kada bado — unaweza kuendelea; utapatanishwa na wenzako wote wa idara hii.
              </p>
            ) : (
              <KadaPicker
                group={groupLabel}
                options={cadreOptions}
                value={cadreCode || null}
                onChange={changeCadre}
                mfano={isHealth ? 'ANO' : 'VEO'}
              />
            )}
          </>
        )}

        {/* ─────────── HATUA: KITUO CHA SASA ─────────── */}
        {cur === 'kituo' && (
          <>
            <p className={s.hint}>Unafanya kazi wapi kwa sasa?</p>

            <Progress
              items={[
                { l: 'Mkoa', i: 'mapFold' },
                ...(needDistrict ? [{ l: 'Wilaya', i: 'mapPin' }] : []),
                ...(third ? [{ l: third.chip, i: third.icon }] : []),
              ]}
              at={!curRegion ? 0 : needDistrict && !curDistrict ? 1 : third ? 2 : 1}
            />

            <Label icon="mapFold">Mkoa Wako</Label>
            {!curRegion ? (
              <RegionGrid
                options={regionOptions}
                value={null}
                onPick={(v) => { setCurRegion(Number(v)); }}
              />
            ) : (
              <Chosen
                icon="mapFold"
                text={regionName(curRegion)}
                onChange={() => { setCurRegion(''); setCurDistrict(''); setCurFacility(''); setCurThirdOpen(false); }}
              />
            )}

            {needDistrict && curRegion !== '' && (
              <>
                <Label icon="mapPin">Wilaya</Label>
                {curDistrict === '' ? (
                  <SquareChips
                    options={districtOptions}
                    value={[]}
                    onToggle={(v) => { setCurDistrict(Number(v)); setCurThirdOpen(false); }}
                  />
                ) : (
                  <Chosen
                    icon="mapPin"
                    text={curDistricts.find((d) => d.id === Number(curDistrict))?.name || ''}
                    onChange={() => { setCurDistrict(''); setCurFacility(''); setCurThirdOpen(false); }}
                  />
                )}
              </>
            )}

            {third && curRegion !== '' && (isWizara || curDistrict !== '') && (
              <>
                <Label icon={third.icon} note={third.lazima ? undefined : 'hiari'}>
                  {curFacility ? third.yako : third.chagua}
                </Label>
                {curFacility ? (
                  <Chosen
                    icon={third.icon}
                    text={curFacFacility?.name || 'Imechaguliwa'}
                    onChange={() => setCurFacility('')}
                  />
                ) : third.lazima || curThirdOpen ? (
                  <ThirdList
                    head={`${third.chip === 'Shule' ? 'SHULE' : third.chip === 'Kituo' ? 'VITUO' : 'HOSPITALI'} · ${
                      isWizara ? regionName(curRegion) : curDistricts.find((d) => d.id === Number(curDistrict))?.name || ''
                    }`}
                    options={thirdOptions(curFacilities)}
                    value={[]}
                    onToggle={(v) => setCurFacility(v)}
                    placeholder={third.tafuta}
                    skipLabel={third.lazima ? undefined : `Ruka – sitaki kuchagua ${third.neno}`}
                    loading={loadingFacilities}
                    onClose={third.lazima ? undefined : () => setCurThirdOpen(false)}
                  />
                ) : (
                  <button type="button" className={s.addOpt} onClick={() => setCurThirdOpen(true)}>
                    + Chagua {third.chip === 'Shule' ? 'shule' : 'kituo'} (hiari)
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* ─────────── HATUA: LENGO ─────────── */}
        {cur === 'lengo' && (
          <>
            <p className={s.hint}>Chagua mkoa (au mikoa) unayotaka kuhamia.</p>

            {editIdx !== null && dests[editIdx] ? (
              <div className={s.target}>
                <div className={s.targetHead}>
                  <span className={s.num}>{editIdx + 1}</span>
                  <b>Mkoa wa {ORD[editIdx] ?? editIdx + 1}</b>
                </div>

                <Progress
                  items={[
                    { l: 'Mkoa', i: 'mapFold' },
                    ...(needDistrict ? [{ l: 'Wilaya', i: 'mapPin' }] : []),
                    ...(third ? [{ l: third.chip === 'Hospitali ya Rufaa' ? 'Hospitali' : third.chip, i: third.icon }] : []),
                  ]}
                  at={!dests[editIdx].regionId ? 0 : dests[editIdx].facilityIds.length > 0 && third ? 2 : 1}
                />

                <Label icon="mapFold">Mkoa</Label>
                {!dests[editIdx].regionId ? (
                  <RegionGrid
                    options={regionOptions}
                    value={null}
                    hidden={dests.filter((_, i) => i !== editIdx).map((d) => String(d.regionId))}
                    onPick={(v) => {
                      /* Mkoa peke yake unatosha: wilaya inakuwa "Wilaya yoyote" na inajifunga */
                      updateDest(editIdx, {
                        regionId: Number(v),
                        districtIds: [],
                        anyDistrict: !isWizara,
                        facilityIds: [],
                      });
                      /* Wilaya zinafunguka wazi, "Wilaya yoyote" ikiwa imewaka tayari */
                      setDistOpen(true);
                      setThirdOpen(false);
                      setCurThirdOpen(false);
                    }}
                  />
                ) : (
                  <Chosen
                    icon="mapFold"
                    text={regionName(dests[editIdx].regionId)}
                    onChange={() => {
                      updateDest(editIdx, { regionId: '', districtIds: [], anyDistrict: false, facilityIds: [] });
                      setDistOpen(true);
                      setThirdOpen(false);
                      setCurThirdOpen(false);
                    }}
                  />
                )}

                {needDistrict && dests[editIdx].regionId !== '' && (
                  <>
                    <Label icon="mapPin" note="moja au zaidi">Wilaya za lengo</Label>
                    {(dests[editIdx].anyDistrict || dests[editIdx].districtIds.length > 0) && !distOpen ? (
                      <Chosen
                        icon="mapPin"
                        text={dests[editIdx].anyDistrict ? 'Wilaya yoyote' : edDistNames.join(', ')}
                        onChange={() => setDistOpen(true)}
                      />
                    ) : (
                      <>
                        <ListHead k={`WILAYA · ${regionName(dests[editIdx].regionId)}`} n={edDistricts.length} />
                        <SquareChips
                          options={edDistricts.map((d) => ({ value: String(d.id), label: d.name }))}
                          value={dests[editIdx].anyDistrict ? [] : dests[editIdx].districtIds.map(String)}
                          onToggle={(v) => {
                            toggleDestDistrict(editIdx, Number(v));
                            setDistOpen(false);
                            setThirdOpen(false);
                          }}
                          anyLabel="Wilaya yoyote"
                          anyOn={dests[editIdx].anyDistrict}
                          onAny={() => {
                            if (dests[editIdx].anyDistrict) return;
                            updateDest(editIdx, { anyDistrict: true, districtIds: [], facilityIds: [] });
                            setDistOpen(false);
                          }}
                        />
                      </>
                    )}
                  </>
                )}

                {third && dests[editIdx].regionId !== '' && (isWizara || dests[editIdx].districtIds.length > 0) && (
                  <>
                    <Label icon={third.icon} note={isWizara ? 'moja au zaidi' : 'hiari'}>{edThirdTitle}</Label>
                    {dests[editIdx].facilityIds.length > 0 && !thirdOpen ? (
                      <Chosen icon={third.icon} text={edFacNames.join(', ')} onChange={() => setThirdOpen(true)} />
                    ) : isWizara || thirdOpen ? (
                      <ThirdList
                        head={`${isWizara ? 'HOSPITALI' : third.chip === 'Shule' ? 'SHULE' : 'VITUO'} · ${
                          isWizara ? regionName(dests[editIdx].regionId) : edDistNames.join(', ')
                        }`}
                        options={thirdOptions(edFacs)}
                        value={dests[editIdx].facilityIds}
                        onToggle={(v) => {
                          toggleDestFacility(editIdx, v);
                          setThirdOpen(false);
                        }}
                        placeholder={third.tafuta}
                        multi={isWizara}
                        onClose={isWizara ? undefined : () => setThirdOpen(false)}
                      />
                    ) : (
                      <button type="button" className={s.addOpt} onClick={() => setThirdOpen(true)}>
                        + Chagua {third.chip === 'Shule' ? 'shule' : 'vituo'} za lengo (hiari)
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : null}

            {editIdx === null && (
              <div className={s.tg}>
                {dests.map((d, i) => {
                  const facs = destFacilities[
                    isWizara || d.anyDistrict || d.districtIds.length !== 1 ? `r:${d.regionId}` : `d:${d.districtIds[0]}`
                  ] || [];
                  const chosenFacs = facs.filter((f) => d.facilityIds.includes(facId(f))).map((f) => f.name);
                  const dists = (destDistricts[Number(d.regionId)] || [])
                    .filter((x) => d.districtIds.includes(x.id))
                    .map((x) => x.name);
                  const sub = isWizara
                    ? chosenFacs.length > 2
                      ? `${chosenFacs.slice(0, 1).join(', ')} +${chosenFacs.length - 1}`
                      : chosenFacs.join(', ')
                    : d.anyDistrict
                      ? 'Wilaya yoyote'
                      : dists.length > 2
                        ? `${dists.slice(0, 2).join(', ')} +${dists.length - 2}`
                        : dists.join(', ');
                  return (
                    <div key={i} className={s.tgCard}>
                      <span className={s.tgNum}>{i + 1}</span>
                      <span className={s.tgIc}><Icon name="mapFold" size={16} strokeWidth={1.9} /></span>
                      <div className={s.tgBody}>
                        <p className={s.tgName}>{regionName(d.regionId)}</p>
                        <p className={s.tgSub}>{sub || '—'}</p>
                      </div>
                      <button
                        type="button"
                        className={s.tgEdit}
                        onClick={() => {
                          setDistOpen(true);
                          setThirdOpen(true);
                          setEditIdx(i);
                        }}
                      >
                        Badilisha
                      </button>
                      {i > 0 && (
                        <button
                          type="button"
                          className={s.tgDel}
                          aria-label="Futa mkoa"
                          onClick={() => setDests((arr) => arr.filter((_, idx) => idx !== i))}
                        >
                          <Icon name="xSquare" size={16} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {dests.length < 5 && (editIdx === null || dests[editIdx].regionId !== '') && (
              <button
                type="button"
                className={s.add}
                onClick={() => {
                  const current = editIdx !== null ? dests[editIdx] : null;
                  const kept = dests.filter((d, i) => i !== editIdx && destComplete(d));
                  const carried = current && current.regionId !== '' ? [current] : [];
                  const nextArr = [...kept, ...carried, emptyDest()];
                  setDests(nextArr);
                  setEditIdx(nextArr.length - 1);
                  setDistOpen(true);
                  setThirdOpen(false);
                }}
              >
                + Ongeza Mkoa Mwingine
              </button>
            )}

            <Label icon="calendar">Umefanya kazi kwa miaka mingapi?</Label>
            <YearsBand
              options={YEARS}
              value={years}
              onChange={(v) => {
                setYears(v);
                if (editIdx !== null) closeEditor();
              }}
            />
          </>
        )}

        <div className={s.actions}>
          {step === 1 ? (
            <p className={s.haveAcc}>
              Una akaunti tayari? <Link href="/login">Ingia hapa</Link>
            </p>
          ) : (
            <button type="button" className={s.btnOutline} onClick={back} disabled={sending}>
              <Icon name="chevronLeft" size={14} strokeWidth={2.6} /> Rudi
            </button>
          )}

          <button type="button" className={cx(s.btn, last && s.btnFinal)} disabled={sending} onClick={next}>
            {!last ? (
              <>
                Endelea <Icon name="chevronRight" size={14} strokeWidth={2.6} />
              </>
            ) : (
              <>{sending ? 'Inatuma...' : 'Najisajili'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
