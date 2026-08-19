'use client';

import { useEffect, useState } from 'react';
import { getMyProfile, updateProfile, changeMyPassword, getRegions, getDistricts, getFacilities, getSubjects, getCadres, bustGetCache, type Region, type District, type Subject, type Facility, type Cadre, type Station, type Destination } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLive } from '@/lib/liveSocket';
import { useAuth } from '@/lib/auth';
import Spinner from '@/components/Spinner';
import { useDataVersion } from '@/lib/useDataVersion';
import { Loader2 } from 'lucide-react';
import { useLiveEvents } from '@/lib/useLiveEvents';

export default function ProfilePage() {
  const t = useT();
  const { user } = useAuth();
  const setUser = useAuth((s) => s.setUser);
  const [profile, setProfile] = useState<any>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { getMyProfile().then(setProfile).catch(() => {}); }, []);

  const { subscribe } = useLive();
  useEffect(() => {
    const un = subscribe('user.updated_by_admin', (p: any) => {
      const uid = (user as any)?.user_id;
      if (p.user_id && p.user_id !== uid) return;
      bustGetCache();
      getMyProfile().then(setProfile).catch(() => {});
    });
    return () => un();
  }, [subscribe, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile) return <div className="p-10"><Spinner label={t('msg.loading')} /></div>;

  const isAdmin = !!profile.is_admin;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900">
          {isAdmin ? t('profile.admin_title') : t('profile.title')}
          {isAdmin && <span className="ml-2 align-middle inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-brand-blue-50 text-brand-blue-700 border border-brand-blue-200">{t('admin.admin_role')}</span>}
        </h1>
        {mode === 'view' ? (
          <button onClick={() => setMode('edit')} className="btn-primary text-xs px-3 py-1.5"> {t('profile.edit_button')}</button>
        ) : (
          <button onClick={() => setMode('view')} className="btn-outline text-xs px-3 py-1.5">{t('action.cancel')}</button>
        )}
      </div>

      {message && <div className="bg-brand-blue-50 text-brand-blue text-sm rounded-lg p-3">{message}</div>}

      {mode === 'view' ? (
        isAdmin ? <ViewAdminProfile profile={profile} /> : <ViewProfile profile={profile} />
      ) : (
        isAdmin ? (
          <EditAdminProfile profile={profile} onSaved={(p: any) => {
            setProfile(p);
            setUser({ ...user!, full_name: p.full_name, phone_primary: p.phone_primary } as any);
            setMode('view');
            setMessage(t('msg.saved'));
            setTimeout(() => setMessage(null), 3000);
          }} />
        ) : (
          <EditProfile profile={profile} onSaved={(p: any) => {
            setProfile(p);
            setUser({ ...user!, full_name: p.full_name, phone_primary: p.phone_primary, category: p.category, cadre_code: p.cadre_code, cadre_display: p.cadre_display, current_station: p.current_station, desired_destinations: p.desired_destinations, subjects: p.subjects } as any);
            setMode('view');
            setMessage(t('msg.saved'));
            setTimeout(() => setMessage(null), 3000);
          }} />
        )
      )}

    </div>
  );
}

function ViewAdminProfile({ profile }: any) {
  const t = useT();
  return (
    <>
      <div className="card border-brand-gold-200">
        <h3 className="font-bold text-brand-grey-900 mb-3">{t('profile.admin_identity')}</h3>
        <div className="space-y-2 text-sm">
          <Row label={t('label.name')} value={profile.full_name} />
          <Row label={t('label.email')} value={profile.email} />
          <Row label={t('profile.email_verified')} value={profile.email_verified ? `${t('msg.yes')} ✓` : t('msg.no')} />
          <Row label={t('label.phone')} value={profile.phone_primary} />
          <Row label={t('admin.role')} value="Administrator" />
        </div>
      </div>
    </>
  );
}

function EditAdminProfile({ profile, onSaved }: any) {
  const t = useT();
  const [full_name, setName] = useState(profile.full_name);
  const [phone_alt, setPhoneAlt] = useState(profile.phone_alt || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true); setError(null);
    try {
      await updateProfile({ full_name, phone_alt: phone_alt || null });
      bustGetCache();
      const fresh = await getMyProfile();
      onSaved(fresh);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-3">{error}</div>}
      <div className="card space-y-3">
        <h3 className="font-bold">{t('profile.admin_identity')}</h3>
        <div><label className="label">{t('label.name')}</label><input className="input" value={full_name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">{t('profile.alt_phone')}</label><input className="input" value={phone_alt} onChange={(e) => setPhoneAlt(e.target.value)} placeholder={t('msg.optional')} /></div>
        <div><label className="label">{t('label.email')}</label><input className="input" value={profile.email || ''} disabled /></div>
        <div className="text-xs text-brand-grey-500">{t('profile.email_change_hint')}</div>
      </div>
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary text-xs px-4 py-1.5">
          {saving ? '...' : t('profile.save')}
        </button>
      </div>
    </div>
  );
}

function ViewProfile({ profile }: any) {
  const t = useT();
  return (
    <>
      <div className="card">
        <h3 className="font-bold text-brand-grey-900 mb-3">{t('profile.identity')}</h3>
        <div className="space-y-2 text-sm">
          <Row label={t('label.name')} value={profile.full_name} />
          <Row label={t('label.phone')} value={profile.phone_primary} />
          {profile.phone_alt && <Row label={t('profile.alt_phone')} value={profile.phone_alt} />}
          <Row label={t('label.category')} value={profile.category === 'health' ? t('label.category_health') : t('label.category_education')} />
          <Row label={t('label.cadre')} value={profile.cadre_display || profile.cadre_code} />
          {profile.subjects?.length > 0 && <Row label={t('label.subjects')} value={profile.subjects.join(', ')} />}
        </div>
      </div>
      <div className="card">
        <h3 className="font-bold text-brand-grey-900 mb-3">{t('profile.station')}</h3>
        <div className="space-y-1 text-sm">
          <Row label={t('step3.region')} value={profile.current_station?.region_name} />
          <Row label={t('step3.district')} value={profile.current_station?.district_name} />
          <Row label={t('step3.facility')} value={profile.current_station?.facility_name || `(${t('msg.no_data')})`} />
        </div>
      </div>
      <div className="card">
        <h3 className="font-bold text-brand-grey-900 mb-3">{t('profile.destinations')}</h3>
        <div className="space-y-2">
          {profile.desired_destinations?.map((d: any, i: number) => (
            <div key={i} className="p-2 rounded-lg bg-brand-grey-50 text-sm">
              <div className="font-semibold text-brand-grey-900">{d.region_name}</div>
              <div className="text-xs text-brand-grey-500">
                {d.district_name || 'Wilaya yoyote'}{d.facility_name ? ` • ${d.facility_name}` : ''}
                {d.notes ? ` — ${d.notes}` : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function EditProfile({ profile, onSaved }: any) {
  const t = useT();
  const [full_name, setName] = useState(profile.full_name);
  const [phone_primary, setPhonePrimary] = useState(profile.phone_primary || '');
  const [phone_alt, setPhoneAlt] = useState(profile.phone_alt || '');
  const [subjects, setSubjects] = useState<string[]>(profile.subjects || []);
  const [availSubjects, setAvailSubjects] = useState<Subject[]>([]);
  const [cadre_code, setCadreCode] = useState<string>(profile.cadre_code || '');
  const [availCadres, setAvailCadres] = useState<Cadre[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [region_id, setRegionId] = useState<number>(profile.current_station?.region_id);
  const [district_id, setDistrictId] = useState<number>(profile.current_station?.district_id);
  const [facility_id, setFacilityId] = useState<string>(profile.current_station?.facility_id || '');
  const [destinations, setDestinations] = useState<any[]>(profile.desired_destinations || []);
  const [destDistricts, setDestDistricts] = useState<Record<number, District[]>>({});
  const [curPassword, setCurPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const category = profile.category as string;
  const currentCadre = availCadres.find((c) => c.code === cadre_code);
  const subjectLevel: 'Primary' | 'Secondary' | undefined =
    currentCadre?.level === 'Secondary' ? 'Secondary'
      : currentCadre?.level === 'Primary' ? 'Primary'
        : undefined;

  const dv = useDataVersion();

  useEffect(() => {
    getRegions().then(setRegions);
    getCadres(category).then((cs) => {
      setAvailCadres(cs);
      if (!cs.find((c) => c.code === cadre_code)) setCadreCode('');
    }).catch(() => {});
  }, [category, dv]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (subjectLevel) {
      setLoadingSubjects(true);
      getSubjects(subjectLevel).then(setAvailSubjects).finally(() => setLoadingSubjects(false));
    } else {
      setAvailSubjects([]);
    }
  }, [category, cadre_code, subjectLevel, dv]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load districts/facilities on mount for the INITIAL values (not just on change)
  useEffect(() => { if (region_id) getDistricts(region_id).then(setDistricts).catch(() => setDistricts([])); }, [region_id]);
  useEffect(() => { if (district_id) getFacilities(district_id, (category as 'health' | 'education') || 'health', subjectLevel).then(setFacilities).catch(() => setFacilities([])); }, [district_id, category, subjectLevel]);
  // On mount: load districts if region_id already set
  useEffect(() => {
    if (profile.current_station?.region_id && !districts.length) {
      getDistricts(profile.current_station.region_id).then(setDistricts).catch(() => {});
    }
    if (profile.current_station?.district_id && !facilities.length) {
      getFacilities(profile.current_station.district_id, (category as 'health' | 'education') || 'health', subjectLevel).then(setFacilities).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    // PARALLEL: load districts for ALL destinations at once (not serial forEach)
    const uncached = (destinations || []).filter((d: any) => d.region_id && !destDistricts[d.region_id]);
    if (uncached.length) {
      Promise.all(uncached.map((d: any) => getDistricts(d.region_id).then((list) => ({ id: d.region_id, list })))).then((results) => {
        setDestDistricts((m) => {
          const next = { ...m };
          for (const { id, list } of results) next[id] = list;
          return next;
        });
      }).catch(() => {});
    }
  }, [destinations]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveProfile() {
    setSaving(true); setError(null);
    if (!phone_alt || !/^(\+?255|0)\d{9}$/.test(phone_alt.replace(/[\s-]/g, ''))) {
      setError(t('step1.err_phone_alt_required'));
      setSaving(false);
      return;
    }
    try {
      const region = regions.find((r) => r.id === region_id);
      const district = districts.find((d) => d.id === district_id);
      const facility = facilities.find((f: any) => String(f.id || f.code) === facility_id);
      const station: Station | undefined =
        region && district
          ? {
              region_id: region.id, region_name: region.name,
              district_id: district.id, district_name: district.name,
              facility_id: facility ? String(facility.id || facility.code) : profile.current_station?.facility_id ?? null,
              facility_name: facility?.name || profile.current_station?.facility_name || null,
              facility_type: (facility as any)?.type || profile.current_station?.facility_type || null,
            }
          : undefined;
      const dests: Destination[] = destinations.map((d: any) => {
        const dd = d.district_id ? (destDistricts[d.region_id] || []).find((x) => x.id === d.district_id) : null;
        return {
          region_id: d.region_id, region_name: d.region_name,
          district_id: dd?.id ?? d.district_id ?? null, district_name: dd?.name ?? d.district_name ?? null,
          facility_id: d.facility_id ?? null, facility_name: d.facility_name ?? null,
          notes: d.notes ?? null,
        };
      });
      await updateProfile({
        full_name,
        phone_primary: phone_primary || undefined,
        phone_alt: phone_alt || null,
        subjects: subjects.length ? subjects : [],
        cadre_code: cadre_code || undefined,
        current_station: station as any,
        desired_destinations: dests.length ? dests : undefined,
      });
      bustGetCache();
      const fresh = await getMyProfile();
      onSaved(fresh);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Save failed');
    } finally { setSaving(false); }
  }

  async function savePassword() {
    setError(null); setPwdMsg(null);
    try {
      const r = await changeMyPassword(curPassword, newPassword);
      setPwdMsg(r.message || t('profile.pwd_changed'));
      setCurPassword(''); setNewPassword('');
      setTimeout(() => setPwdMsg(null), 4000);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Password imeshindikana kubadilika');
    }
  }

  function addDest() {
    setDestinations([...destinations, { region_id: 0, region_name: '', district_id: null }]);
  }
  function updateDest(i: number, patch: any) {
    const copy = destinations.map((d, idx) => (idx === i ? { ...d, ...patch } : d));
    setDestinations(copy);
    if (patch.region_id) {
      const r = regions.find((rr) => rr.id === patch.region_id);
      if (r && !destDistricts[r.id]) {
        getDistricts(r.id).then((list) => setDestDistricts((m) => ({ ...m, [r.id]: list })));
      }
    }
  }
  function delDest(i: number) {
    setDestinations(destinations.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-3">{error}</div>}

      <div className="card space-y-3">
        <h3 className="font-bold">{t('profile.identity')}</h3>
        <div><label className="label">{t('label.name')}</label><input className="input" value={full_name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">{t('profile.phone_normal')}</label><input className="input" value={phone_primary} onChange={(e) => setPhonePrimary(e.target.value)} inputMode="tel" /></div>
        <div><label className="label">🟢 {t('profile.phone_whatsapp')} *</label><input className="input" value={phone_alt} onChange={(e) => setPhoneAlt(e.target.value)} placeholder="0623456789" /></div>
        {category && (
          <div>
            <label className="label">{t('label.cadre')}</label>
            <select className="input" value={cadre_code} onChange={(e) => { setCadreCode(e.target.value); setSubjects([]); }}>
              <option value="">{t('profile.choose_cadre')}</option>
              {availCadres.map((c) => (
                <option key={c.code} value={c.code}>{c.display_name}</option>
              ))}
            </select>
          </div>
        )}
        {subjectLevel && (
          <div>
            <label className="label">{t('label.subjects')} ({subjectLevel === 'Primary' ? t('step2.primary') : t('step2.secondary')})</label>
            {loadingSubjects ? (
              <div className="flex items-center justify-center py-4 text-brand-grey-400">
                <Loader2 size={18} className="animate-spin mr-2" />
                <span className="text-sm">{t('msg.loading')}</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
                {availSubjects.map((s) => (
                  <button key={s.code} type="button"
                    onClick={() => setSubjects((prev) => prev.includes(s.code) ? prev.filter((c) => c !== s.code) : [...prev, s.code])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition whitespace-nowrap ${subjects.includes(s.code) ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-brand-grey-700 border-brand-grey-300 hover:border-brand-blue'}`}>
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card space-y-3">
        <h3 className="font-bold">{t('profile.station')}</h3>
        <div><label className="label">{t('step3.region')}</label>
          <select className="input" value={region_id} onChange={(e) => { setRegionId(Number(e.target.value)); setDistrictId(0 as any); setFacilityId(''); }}>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div><label className="label">{t('step3.district')}</label>
          <select className="input" value={district_id} onChange={(e) => { setDistrictId(Number(e.target.value)); setFacilityId(''); }}>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div><label className="label">{category === 'health' ? t('step3.facility_health') : t('step3.facility_school')} ({t('msg.optional')})</label>
          <select className="input" value={facility_id} onChange={(e) => setFacilityId(e.target.value)} disabled={!district_id}>
            <option value="">{t('step3.facility_none')}</option>
            {facilities.map((f: any) => (
              <option key={f.id || f.code} value={String(f.id || f.code)}>{f.name}{f.type ? ` (${f.type})` : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">{t('profile.destinations')}</h3>
          <button onClick={addDest} className="text-brand-blue text-sm">{t('profile.add_dest')}</button>
        </div>
        {destinations.map((d, i) => (
          <div key={i} className="space-y-2 p-3 rounded-xl bg-brand-grey-50 dark:bg-brand-grey-100">
            <div className="flex gap-2 items-center">
              <select className="input flex-1" value={d.region_id || 0}
                onChange={(e) => updateDest(i, { region_id: Number(e.target.value), region_name: regions.find((r) => r.id === Number(e.target.value))?.name || '', district_id: null })}>
                <option value={0}>{t('profile.choose')}</option>
                {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <button onClick={() => delDest(i)} className="text-brand-red text-sm px-2"></button>
            </div>
            {d.region_id ? (
              <select className="input w-full" value={d.district_id || ''}
                onChange={(e) => updateDest(i, { district_id: e.target.value ? Number(e.target.value) : null, district_name: (destDistricts[d.region_id] || []).find((x) => x.id === Number(e.target.value))?.name || null })}>
                <option value="">{t('step4.any_district')}</option>
                {(destDistricts[d.region_id] || []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            ) : null}
          </div>
        ))}
      </div>

      <div className="card space-y-2.5">
        <h3 className="font-bold text-sm">🔑 {t('profile.change_pwd')}</h3>
        {pwdMsg && <div className="bg-green-50 text-green-700 text-xs rounded-lg px-2.5 py-1.5">{pwdMsg}</div>}
        <div><label className="label">{t('profile.cur_pwd')}</label><input type="password" className="input !py-1.5 text-sm" value={curPassword} onChange={(e) => setCurPassword(e.target.value)} autoComplete="current-password" /></div>
        <div><label className="label">{t('profile.new_pwd')}</label><input type="password" className="input !py-1.5 text-sm" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" /></div>
        <button onClick={savePassword} disabled={!curPassword || newPassword.length < 6} className="text-xs px-3 py-1.5 rounded-lg border border-brand-blue text-brand-blue hover:bg-brand-blue-50 transition disabled:opacity-40">
          {t('profile.change_pwd_btn')}
        </button>
      </div>

      <div className="flex justify-end">
        <button onClick={saveProfile} disabled={saving} className="btn-primary text-xs px-4 py-1.5">
          {saving ? '...' : t('profile.save')}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-brand-grey-500">{label}:</span>
      <span className="font-medium text-brand-grey-900 text-right">{value || '-'}</span>
    </div>
  );
}
