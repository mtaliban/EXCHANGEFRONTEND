'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/register/Icon';
import s from '@/components/register/register.module.css';
import { Dropdown, Label, OptionList, Segmented, Stepper, SubjectPicker, type Opt } from '@/components/register/ui';
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
  type Subject,
} from '@/lib/api';
import { useAuth } from '@/lib/auth';

const STEPS = ['Utambulisho', 'Idara', 'Kada', 'Kituo', 'Lengo'];
const STEP_NAMES = ['Kwanza', 'Pili', 'Tatu', 'Nne', 'Tano'];
const STEP_TITLES = [
  'Utambulisho Wako',
  'Idara Yako',
  'Kada Yako',
  'Kituo Chako cha Sasa',
  'Mkoa Unakotaka Kwenda',
];

const YEARS: Opt[] = [
  { value: '1', label: 'Mwaka 1' },
  { value: '2', label: 'Miaka 2' },
  { value: '3', label: 'Miaka 3+' },
];

const SECTORS: Opt[] = [
  { value: 'wizara_afya', label: 'Wizara ya Afya' },
  { value: 'tamisemi', label: 'TAMISEMI' },
];

/** Ikoni ya idara kulingana na code yake. */
const DEPT_ICONS: Record<string, string> = {
  health: 'stethoscope',
  education: 'graduation',
  agriculture: 'sprout',
  livestock: 'sprout',
  public_service: 'idcard',
  utumishi: 'idcard',
};

/** Namba ya simu: tarakimu 10 kuanzia 0, au +255/255 na tarakimu 9. */
const PHONE_RE = /^(\+?255|0)\d{9}$/;
const clean = (v: string) => v.replace(/[\s-]/g, '');
const phoneOk = (v: string) => PHONE_RE.test(clean(v));
const facId = (f: Facility) => String(f.id ?? f.code ?? '');

type DestEntry = {
  regionId: number | '';
  anyDistrict: boolean;
  districtIds: number[];
  facilityId: string;
};

const emptyDest = (): DestEntry => ({ regionId: '', anyDistrict: true, districtIds: [], facilityId: '' });

export default function RegisterContent() {
  const router = useRouter();
  const setAuth = useAuth((st) => st.setAuth);

  const [step, setStep] = useState(1);

  // Hatua 1
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phoneTaken, setPhoneTaken] = useState(false);

  // Hatua 2
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [category, setCategory] = useState('');
  const [sector, setSector] = useState('');

  // Hatua 3
  const [cadres, setCadres] = useState<Cadre[]>([]);
  const [loadingCadres, setLoadingCadres] = useState(false);
  const [cadreCode, setCadreCode] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Hatua 4
  const [regions, setRegions] = useState<Region[]>([]);
  const [curRegion, setCurRegion] = useState<number | ''>('');
  const [curDistrict, setCurDistrict] = useState<number | ''>('');
  const [curFacility, setCurFacility] = useState('');
  const [curDistricts, setCurDistricts] = useState<District[]>([]);
  const [curFacilities, setCurFacilities] = useState<Facility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);

  // Hatua 5
  const [dests, setDests] = useState<DestEntry[]>([emptyDest()]);
  const [destDistricts, setDestDistricts] = useState<Record<number, District[]>>({});
  const [destFacilities, setDestFacilities] = useState<Record<string, Facility[]>>({});
  const [years, setYears] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const cadre = cadres.find((c) => c.code === cadreCode);
  const needsSubjects = !!cadre && (cadre.requires_subjects || cadre.level === 'Primary' || cadre.level === 'Secondary');
  const subjectLevel: 'Primary' | 'Secondary' | undefined =
    cadre?.level === 'Primary' ? 'Primary' : cadre?.level === 'Secondary' ? 'Secondary' : undefined;

  const isHealth = category === 'health';
  const isWizara = isHealth && sector === 'wizara_afya';
  // Vituo vilivyopo ni vya AFYA na ELIMU pekee.
  const showFacility = isHealth || category === 'education';

  /* ── Idara + mikoa (mara moja) ── */
  useEffect(() => {
    getDepartments(true)
      .then((list) => setDepartments(list.filter((d) => d.status !== 'disabled')))
      .catch(() => setError('Imeshindikana kupata orodha ya idara. Jaribu tena.'))
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

  /** Ufunguo wa cache ya vituo vya mkoa wa lengo: wilaya moja → vituo vya wilaya; zaidi/wilaya yoyote → vituo vya mkoa wote. */
  function destFacilityKey(d: DestEntry): string {
    if (!isWizara && !d.anyDistrict && d.districtIds.length === 1) return `d:${d.districtIds[0]}`;
    return `r:${d.regionId}`;
  }

  /* ── Vituo vya mikoa/wilaya za lengo ── */
  useEffect(() => {
    if (!showFacility) return;
    dests.forEach((d) => {
      const rid = Number(d.regionId);
      if (!rid) return;
      const key =
        isWizara || d.anyDistrict || d.districtIds.length !== 1
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

  /* ── Ukaguzi wa namba: tayari inatumika? ── */
  async function checkPhoneTaken() {
    if (!phoneOk(phone)) { setPhoneTaken(false); return; }
    try {
      const r = await checkPhone(clean(phone));
      setPhoneTaken(!r.available);
    } catch {
      setPhoneTaken(false);
    }
  }

  const deptOptions: Opt[] = useMemo(
    () => departments.map((d) => ({ value: d.code, label: d.name, icon: DEPT_ICONS[d.code] || 'building' })),
    [departments],
  );
  const regionOptions: Opt[] = useMemo(
    () => regions.map((r) => ({ value: String(r.id), label: r.name })),
    [regions],
  );

  const canNext = useMemo(() => {
    switch (step) {
      case 1:
        return fullName.trim().length > 2 && phoneOk(phone) && phoneOk(whatsapp) && !phoneTaken;
      case 2:
        return !!category && (!isHealth || !!sector);
      case 3:
        return cadres.length === 0 ? true : !!cadreCode && (!needsSubjects || selectedSubjects.length === 2);
      case 4:
        if (!curRegion) return false;
        return isWizara ? !!curFacility : !!curDistrict;
      case 5:
        if (!years) return false;
        return dests.every((d) => {
          if (!d.regionId) return false;
          if (isWizara) return !!d.facilityId;
          return d.anyDistrict || d.districtIds.length > 0;
        });
      default:
        return false;
    }
  }, [
    step, fullName, phone, whatsapp, phoneTaken, category, isHealth, sector, cadres.length,
    cadreCode, needsSubjects, selectedSubjects.length, curRegion, isWizara, curFacility,
    curDistrict, years, dests,
  ]);

  function changeCategory(v: string) {
    if (v !== category) {
      setCategory(v);
      setSector('');
      setSelectedSubjects([]);
    }
  }

  function changeCadre(v: string) {
    if (v !== cadreCode) setSelectedSubjects([]);
    setCadreCode(v);
  }

  function updateDest(i: number, patch: Partial<DestEntry>) {
    setDests((arr) => arr.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }

  function removeDest(i: number) {
    setDests((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setSending(true);
    setError(null);
    try {
      const regionName = (id: number) => regions.find((r) => r.id === id)?.name || '';

      // ── Kituo cha sasa ──
      let current_station: Station;
      if (isWizara) {
        const f = curFacilities.find((x) => facId(x) === curFacility);
        current_station = {
          region_id: Number(curRegion),
          region_name: regionName(Number(curRegion)),
          district_id: f?.district_id ?? null,
          district_name: f?.district || null,
          facility_id: curFacility || null,
          facility_name: f?.name || null,
          facility_type: f?.type || f?.type_category || null,
        } as unknown as Station;
      } else {
        const d = curDistricts.find((x) => x.id === Number(curDistrict));
        const f = curFacilities.find((x) => facId(x) === curFacility);
        current_station = {
          region_id: Number(curRegion),
          region_name: regionName(Number(curRegion)),
          district_id: d?.id ?? null,
          district_name: d?.name ?? null,
          facility_id: curFacility || null,
          facility_name: f?.name || null,
          facility_type: f?.type || f?.level || null,
        } as unknown as Station;
      }

      // ── Mikoa ya lengo ──
      const desired_destinations: Destination[] = [];
      for (const d of dests) {
        const rid = Number(d.regionId);
        if (!rid) continue;
        if (isWizara) {
          const list = destFacilities[`r:${rid}`] || [];
          const f = list.find((x) => facId(x) === d.facilityId);
          desired_destinations.push({
            region_id: rid,
            region_name: regionName(rid),
            district_id: f?.district_id ?? null,
            district_name: f?.district || null,
            facility_id: f ? facId(f) : null,
            facility_name: f?.name || null,
            notes: null,
          });
        } else if (d.anyDistrict) {
          // "Wilaya yoyote" — shule ikiwa imechaguliwa, twaenda na wilaya yake halisi
          const f = (destFacilities[`r:${rid}`] || []).find((x) => facId(x) === d.facilityId);
          desired_destinations.push({
            region_id: rid,
            region_name: regionName(rid),
            district_id: f?.district_id ?? null,
            district_name: f?.district || null,
            facility_id: f ? facId(f) : null,
            facility_name: f?.name || null,
            notes: null,
          });
        } else {
          const list = destDistricts[rid] || [];
          for (const did of d.districtIds) {
            const dist = list.find((x) => x.id === did);
            if (!dist) continue;
            const f = (destFacilities[`d:${did}`] || []).find((x) => facId(x) === d.facilityId);
            desired_destinations.push({
              region_id: rid,
              region_name: regionName(rid),
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
      setError(extractErrorMessage(err, 'Usajili umeshindwa. Jaribu tena.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSending(false);
    }
  }

  const next = () => {
    setError(null);
    if (step < 5) setStep(step + 1);
    else submit();
  };
  const back = () => {
    setError(null);
    setStep((n) => Math.max(1, n - 1));
  };

  return (
    <div className={s.page}>
      <Link
        href={step === 1 ? '/login' : '#'}
        className={s.back}
        onClick={(e) => {
          if (step > 1) {
            e.preventDefault();
            back();
          }
        }}
      >
        <Icon name="arrowLeft" size={20} strokeWidth={2.2} /> Rudi
      </Link>

      <div className={s.content}>
        <h1 className={s.title}>
          Jaza <span>Taarifa Zako</span>
        </h1>
        <p className={s.subtitle}>Jaza taarifa chache tu ili ujisajili.</p>

        <Stepper steps={STEPS} current={step} />

        <div className={s.stepHead}>
          <b>Hatua ya {STEP_NAMES[step - 1]}:</b>
          <h2>{STEP_TITLES[step - 1]}</h2>
        </div>

        {error && (
          <div className={s.banner} role="alert">
            <Icon name="alert" size={16} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        {/* ─────────── HATUA 1: UTAMBULISHO ─────────── */}
        {step === 1 && (
          <>
            <Label icon="user">Jina Kamili</Label>
            <input
              className={s.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Mfano: Kieffer Madyedye"
              autoComplete="name"
            />

            <Label icon="phone">Namba ya Simu (Normal)</Label>
            <input
              className={s.input}
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setPhoneTaken(false); }}
              onBlur={checkPhoneTaken}
              placeholder="0712345678"
              type="tel"
              inputMode="tel"
            />
            {phoneTaken && <p className={s.err}>Namba hii tayari inatumiwa na mtu mwingine.</p>}

            <Label icon="whatsapp">Namba ya WhatsApp</Label>
            <input
              className={s.input}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="0623456789"
              type="tel"
              inputMode="tel"
            />
          </>
        )}

        {/* ─────────── HATUA 2: IDARA ─────────── */}
        {step === 2 && (
          <>
            <p className={s.hint}>Unafanya kazi katika idara gani?</p>
            <Label icon="building">Chagua Idara</Label>
            {loadingDepts ? (
              <div className={s.loadRow}><span className={s.spin} /> Inapakia idara...</div>
            ) : (
              <OptionList options={deptOptions} value={category || null} onChange={changeCategory} />
            )}

            {isHealth && (
              <>
                <Label icon="building">Wizara</Label>
                <Segmented options={SECTORS} value={sector || null} onChange={setSector} />
              </>
            )}
          </>
        )}

        {/* ─────────── HATUA 3: KADA ─────────── */}
        {step === 3 && (
          <>
            <p className={s.hint}>
              Idara: <b>{deptOptions.find((d) => d.value === category)?.label || '-'}</b> · Chagua kada yako.
            </p>

            {loadingCadres ? (
              <div className={s.loadRow}><span className={s.spin} /> Inapakia kada...</div>
            ) : cadres.length === 0 ? (
              <p className={s.noteBlue}>
                Idara hii haijawekwa kada bado — unaweza kuendelea; utapatanishwa na wenzako wote wa idara hii.
              </p>
            ) : (
              <>
                <Label icon="building">Kada / Cheo Chako</Label>
                {cadres.length <= 3 ? (
                  <Segmented
                    options={cadres.map((c) => ({
                      value: c.code,
                      label: c.display_name,
                      icon: c.level === 'Primary' ? 'backpack' : c.level === 'Secondary' ? 'graduation' : 'wrench',
                    }))}
                    value={cadreCode || null}
                    onChange={changeCadre}
                  />
                ) : (
                  <Dropdown
                    value={cadreCode || null}
                    onChange={changeCadre}
                    options={cadres.map((c) => ({ value: c.code, label: c.display_name }))}
                    placeholder="-- Chagua kada --"
                    countLabel="Kada"
                  />
                )}
              </>
            )}

            {needsSubjects && (
              <>
                <Label icon="book" note="lazima masomo 2">Somo Unalofundisha</Label>
                <SubjectPicker
                  options={subjects.map((x) => ({ value: x.code, label: x.name }))}
                  value={selectedSubjects}
                  onChange={setSelectedSubjects}
                  max={2}
                />
              </>
            )}
          </>
        )}

        {/* ─────────── HATUA 4: KITUO CHA SASA ─────────── */}
        {step === 4 && (
          <>
            <p className={s.hint}>Unafanya kazi wapi kwa sasa?</p>

            <Label icon="map">Mkoa Wako</Label>
            <Dropdown
              value={curRegion ? String(curRegion) : null}
              onChange={(v) => { setCurRegion(Number(v)); setCurFacility(''); }}
              options={regionOptions}
              placeholder="-- Chagua Mkoa --"
              layout="grid3"
              countLabel="Mikoa"
            />

            {!isWizara && (
              <>
                <Label icon="pin">Wilaya</Label>
                <Dropdown
                  value={curDistrict ? String(curDistrict) : null}
                  onChange={(v) => setCurDistrict(Number(v))}
                  options={curDistricts.map((d) => ({ value: String(d.id), label: d.name }))}
                  placeholder="-- Chagua Wilaya --"
                  disabled={!curRegion}
                  disabledText="Chagua mkoa kwanza"
                  layout="grid2"
                  countLabel="Wilaya"
                />
              </>
            )}

            {showFacility && (isWizara || curDistrict !== '') && (
              <>
                <Label icon="school" note={isWizara ? undefined : 'hiari'}>
                  {isWizara ? 'Hospitali ya Rufaa' : category === 'education' ? 'Shule Yako' : 'Kituo Chako'}
                </Label>
                {loadingFacilities ? (
                  <div className={s.loadRow}><span className={s.spin} /> Inapakia vituo...</div>
                ) : (
                  <Dropdown
                    value={curFacility || null}
                    onChange={setCurFacility}
                    options={curFacilities.map((f) => ({ value: facId(f), label: f.name }))}
                    placeholder={isWizara ? '-- Chagua Hospitali --' : '-- Chagua Kituo --'}
                    countLabel={isWizara ? 'Hospitali' : 'Vituo'}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* ─────────── HATUA 5: MKOA UNAKOTAKA KWENDA ─────────── */}
        {step === 5 && (
          <>
            <p className={s.hint}>Chagua mkoa au mikoa unayotaka kuhamia.</p>

            {dests.map((d, i) => (
              <div className={s.target} key={i}>
                <div className={s.targetHead}>
                  <span className={s.num}>{i + 1}</span>
                  <b>Mkoa wa {['kwanza', 'pili', 'tatu', 'nne', 'tano'][i] ?? i + 1}</b>
                  {i > 0 && (
                    <button type="button" className={s.del} aria-label="Futa mkoa" onClick={() => removeDest(i)}>
                      <Icon name="trash" size={15} strokeWidth={1.9} />
                    </button>
                  )}
                </div>

                <p className={s.small}>Mkoa</p>
                <Dropdown
                  value={d.regionId ? String(d.regionId) : null}
                  onChange={(v) =>
                    updateDest(i, { regionId: Number(v), districtIds: [], facilityId: '', anyDistrict: true })
                  }
                  options={regionOptions}
                  placeholder="-- Chagua Mkoa --"
                  layout="grid3"
                  countLabel="Mikoa"
                />

                {d.regionId !== '' && (
                  <>
                    {isWizara ? (
                      <>
                        <p className={s.small}>Hospitali ya Rufaa</p>
                        <Dropdown
                          value={d.facilityId || null}
                          onChange={(v) => updateDest(i, { facilityId: v })}
                          options={(destFacilities[`r:${d.regionId}`] || []).map((f) => ({ value: facId(f), label: f.name }))}
                          placeholder="-- Chagua Hospitali --"
                          countLabel="Hospitali"
                        />
                      </>
                    ) : (
                      <>
                        <p className={s.small}>Wilaya za lengo <em>(chagua moja au zaidi)</em></p>
                        <div className={s.chips}>
                          <button
                            type="button"
                            className={`${s.chip} ${d.anyDistrict ? s.chipOn : ''}`}
                            onClick={() =>
                              updateDest(i, { anyDistrict: true, districtIds: [], facilityId: '' })
                            }
                          >
                            Wilaya yoyote
                          </button>
                          {(destDistricts[d.regionId as number] || []).map((x) => {
                            const on = !d.anyDistrict && d.districtIds.includes(x.id);
                            return (
                              <button
                                type="button"
                                key={x.id}
                                className={`${s.chip} ${on ? s.chipOn : ''}`}
                                onClick={() => {
                                  const next = d.anyDistrict
                                    ? [x.id]
                                    : on
                                      ? d.districtIds.filter((id) => id !== x.id)
                                      : [...d.districtIds, x.id];
                                  updateDest(i, {
                                    anyDistrict: false,
                                    districtIds: next,
                                    facilityId: '',
                                  });
                                }}
                              >
                                {x.name}
                              </button>
                            );
                          })}
                        </div>

                        {showFacility && (
                          <>
                            <p className={s.small}>
                              {category === 'education' ? 'Shule' : 'Kituo'} <em>(hiari)</em>
                            </p>
                            <Dropdown
                              value={d.facilityId || null}
                              onChange={(v) => updateDest(i, { facilityId: v })}
                              options={(destFacilities[destFacilityKey(d)] || []).map((f) => ({
                                value: facId(f),
                                label: f.name,
                              }))}
                              placeholder={category === 'education' ? '-- Chagua Shule --' : '-- Chagua Kituo --'}
                              countLabel={category === 'education' ? 'Shule' : 'Vituo'}
                            />
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            ))}

            <button type="button" className={s.add} onClick={() => setDests((arr) => [...arr, emptyDest()])}>
              + Ongeza Mkoa Mwingine
            </button>

            <div style={{ marginTop: 22 }}>
              <Label icon="clock">Umefanya kazi kwa miaka mingapi?</Label>
            </div>
            <Segmented options={YEARS} value={years} onChange={setYears} />
          </>
        )}

        <div className={s.actions}>
          {step === 1 ? (
            <p>
              Una akaunti tayari? <Link href="/login">Ingia hapa</Link>
            </p>
          ) : (
            <button type="button" className={s.btnOutline} onClick={back} disabled={sending}>
              <Icon name="chevronLeft" size={14} strokeWidth={2.6} /> Rudi
            </button>
          )}

          <button type="button" className={s.btn} disabled={!canNext || sending} onClick={next}>
            {step < 5 ? (
              <>
                Endelea <Icon name="chevronRight" size={14} strokeWidth={2.6} />
              </>
            ) : (
              <>
                {sending ? 'Inatuma...' : 'Najisajili'} <Icon name="userPlus" size={15} strokeWidth={2.2} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
