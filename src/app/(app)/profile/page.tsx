'use client';

import { useEffect, useState } from 'react';
import { getMyProfile, updateDestinations, updateStation, getRegions, getDistricts, getSubjects, type Region, type District, type Subject } from '@/lib/api';
import { useT } from '@/lib/i18n';
import axios from 'axios';
import Spinner from '@/components/Spinner';
import { API_URL as API } from '@/lib/config';

export default function ProfilePage() {
  const t = useT();
  const [profile, setProfile] = useState<any>(null);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { getMyProfile().then(setProfile).catch(() => {}); }, []);

  if (!profile) return <div className="p-10"><Spinner label={t('msg.loading')} /></div>;

  const isAdmin = !!profile.is_admin;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900">
          {isAdmin ? t('profile.admin_title') : t('profile.title')}
          {isAdmin && <span className="ml-2 align-middle inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-brand-gold-100 text-brand-gold-600">👑 {t('admin.admin_role')}</span>}
        </h1>
        {mode === 'view' ? (
          <button onClick={() => setMode('edit')} className="btn-primary text-sm">✎ {t('profile.edit_button')}</button>
        ) : (
          <button onClick={() => setMode('view')} className="btn-outline text-sm">{t('action.cancel')}</button>
        )}
      </div>

      {message && <div className="bg-brand-blue-50 text-brand-blue text-sm rounded-lg p-3">{message}</div>}

      {mode === 'view' ? (
        isAdmin ? <ViewAdminProfile profile={profile} /> : <ViewProfile profile={profile} />
      ) : (
        isAdmin ? (
          <EditAdminProfile profile={profile} onSaved={(p: any) => {
            setProfile(p);
            setMode('view');
            setMessage(t('msg.saved'));
            setTimeout(() => setMessage(null), 3000);
          }} />
        ) : (
          <EditProfile profile={profile} onSaved={(p: any) => {
            setProfile(p);
            setMode('view');
            setMessage(t('msg.saved'));
            setTimeout(() => setMessage(null), 3000);
          }} />
        )
      )}
    </div>
  );
}

/** Wasifu wa ADMIN — taarifa za akaunti (email, status, usalama), SIYO za mwalimu. */
function ViewAdminProfile({ profile }: any) {
  const t = useT();
  return (
    <>
      <div className="card border-brand-gold-200">
        <h3 className="font-bold text-brand-grey-900 mb-3">👑 {t('profile.admin_identity')}</h3>
        <div className="space-y-2 text-sm">
          <Row label={t('label.name')} value={profile.full_name} />
          <Row label={t('label.email')} value={profile.email} />
          <Row label={t('profile.email_verified')} value={profile.email_verified ? `${t('msg.yes')} ✓` : t('msg.no')} />
          <Row label={t('label.phone')} value={profile.phone_primary} />
          <Row label={t('admin.role')} value="Administrator 👑" />
        </div>
      </div>
      <div className="card">
        <h3 className="font-bold text-brand-grey-900 mb-3">🛡️ {t('profile.security')}</h3>
        <p className="text-sm text-brand-grey-500 leading-relaxed">{t('profile.security_hint')}</p>
        <ul className="mt-2 space-y-1 text-xs text-brand-grey-500">
          <li>• {t('profile.security_2fa')}</li>
          <li>• {t('profile.security_email')}</li>
        </ul>
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
      await axios.patch(`${API}/users/me`, { full_name, phone_alt: phone_alt || null }, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('kv_auth') || '{}')?.state?.token}` },
      });
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
        <h3 className="font-bold">👑 {t('profile.admin_identity')}</h3>
        <div><label className="label">{t('label.name')}</label><input className="input" value={full_name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">{t('profile.alt_phone')}</label><input className="input" value={phone_alt} onChange={(e) => setPhoneAlt(e.target.value)} placeholder={t('msg.optional')} /></div>
        <div><label className="label">{t('label.email')}</label><input className="input" value={profile.email || ''} disabled /></div>
        <div className="text-xs text-brand-grey-500">{t('profile.email_change_hint')}</div>
      </div>
      <button onClick={save} disabled={saving} className="btn-primary w-full">
        {saving ? '...' : t('profile.save')}
      </button>
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
          <Row label={t('label.cadre')} value={profile.cadre_display} />
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
  const [phone_alt, setPhoneAlt] = useState(profile.phone_alt || '');
  const [subjects, setSubjects] = useState<string[]>(profile.subjects || []);
  const [availSubjects, setAvailSubjects] = useState<Subject[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [region_id, setRegionId] = useState<number>(profile.current_station?.region_id);
  const [district_id, setDistrictId] = useState<number>(profile.current_station?.district_id);
  const [destinations, setDestinations] = useState<any[]>(profile.desired_destinations || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRegions().then(setRegions);
    if (profile.category === 'education') {
      const level = profile.cadre_code === 'TEACHER_PRIMARY' ? 'Primary' : 'Secondary';
      getSubjects(level as any).then(setAvailSubjects);
    }
  }, [profile.category, profile.cadre_code]);
  useEffect(() => { if (region_id) getDistricts(region_id).then(setDistricts); }, [region_id]);

  async function saveProfile() {
    setSaving(true); setError(null);
    try {
      // profile bits
      await axios.patch(`${API}/users/me`, { full_name, phone_alt: phone_alt || null, subjects }, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('kv_auth') || '{}')?.state?.token}` },
      });
      // station
      const region = regions.find((r) => r.id === region_id)!;
      const district = districts.find((d) => d.id === district_id)!;
      if (region && district) {
        await updateStation({
          region_id: region.id, region_name: region.name,
          district_id: district.id, district_name: district.name,
        });
      }
      // destinations
      if (destinations.length) await updateDestinations(destinations);
      const fresh = await getMyProfile();
      onSaved(fresh);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Save failed');
    } finally { setSaving(false); }
  }

  function addDest() {
    setDestinations([...destinations, { region_id: 0, region_name: '' }]);
  }
  function updateDest(i: number, region_id: number) {
    const r = regions.find((rr) => rr.id === region_id);
    if (!r) return;
    const copy = [...destinations];
    copy[i] = { region_id: r.id, region_name: r.name };
    setDestinations(copy);
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
        <div><label className="label">{t('profile.alt_phone')}</label><input className="input" value={phone_alt} onChange={(e) => setPhoneAlt(e.target.value)} placeholder={t('msg.optional')} /></div>
        {profile.category === 'education' && (profile.cadre_code === 'TEACHER_SECONDARY' || profile.cadre_code === 'TEACHER_PRIMARY') && (
          <div>
            <label className="label">{t('label.subjects')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {availSubjects.map((s) => (
                <button key={s.code} type="button"
                  onClick={() => setSubjects((prev) => prev.includes(s.code) ? prev.filter((c) => c !== s.code) : [...prev, s.code])}
                  className={`px-2 py-1 rounded text-xs border ${subjects.includes(s.code) ? 'bg-brand-gold text-white border-brand-gold' : 'border-brand-grey-300'}`}>
                  {s.code}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card space-y-3">
        <h3 className="font-bold">{t('profile.station')}</h3>
        <div><label className="label">{t('step3.region')}</label>
          <select className="input" value={region_id} onChange={(e) => setRegionId(Number(e.target.value))}>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div><label className="label">{t('step3.district')}</label>
          <select className="input" value={district_id} onChange={(e) => setDistrictId(Number(e.target.value))}>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">{t('profile.destinations')}</h3>
          <button onClick={addDest} className="text-brand-blue text-sm">{t('profile.add_dest')}</button>
        </div>
        {destinations.map((d, i) => (
          <div key={i} className="flex gap-2 items-center">
            <select className="input flex-1" value={d.region_id} onChange={(e) => updateDest(i, Number(e.target.value))}>
              <option value={0}>{t('profile.choose')}</option>
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button onClick={() => delDest(i)} className="text-brand-red text-sm px-2">🗑</button>
          </div>
        ))}
      </div>

      <button onClick={saveProfile} disabled={saving} className="btn-primary w-full">
        {saving ? '...' : t('profile.save')}
      </button>
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
