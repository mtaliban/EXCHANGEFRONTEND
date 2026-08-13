'use client';

import { useEffect, useState } from 'react';
import { adminUsers, adminUpdateUser, adminDeleteUser, adminBulkUsers, adminGrant, adminRevoke, register, adminCleanupTestData, getRegions, getDistricts, getFacilities, getCadres, getSubjects, type Region, type District, type Cadre, type Subject } from '@/lib/api';
import { useT } from '@/lib/i18n';

export default function AdminUsersPage() {
  const t = useT();
  const [data, setData] = useState<any>(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  async function load() {
    const params: any = { limit: 200 };
    if (q) params.q = q;
    if (category) params.category = category;
    setData(await adminUsers(params));
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, category]);
  // Chaguzi huisha wakati filters zinabadilika — orodha yenyewe imebadilika.
  useEffect(() => { setSelected(new Set()); }, [q, category]);

  const visibleUsers = (data?.users || []) as any[];
  const allVisibleSelected = visibleUsers.length > 0 && visibleUsers.every((u) => selected.has(u._id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allVisibleSelected ? new Set() : new Set(visibleUsers.map((u) => u._id)));
  }

  async function bulk(action: 'delete' | 'disable' | 'enable') {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const label = action === 'delete' ? t('admin.bulk_delete_confirm') : action === 'disable' ? t('admin.bulk_suspend_confirm') : t('admin.bulk_enable_confirm');
    if (!confirm(`${label}\n\n${ids.length} ${t('admin.users')}`)) return;
    setBulkBusy(true);
    try {
      const r = await adminBulkUsers(ids, action);
      setMessage(`${action === 'delete' ? t('admin.deleted') : action === 'disable' ? t('admin.suspended') : t('admin.unsuspended')} ${r.processed} ${t('admin.users')}${r.skipped_admin ? ` — ${r.skipped_admin} ${t('admin.bulk_skipped_admin')}` : ''}`);
      setSelected(new Set());
      load();
    } catch (e: any) {
      setMessage(e?.response?.data?.detail || t('admin.failed'));
    } finally { setBulkBusy(false); }
    setTimeout(() => setMessage(null), 5000);
  }

  async function toggleAdmin(u: any) {
    if (u.is_admin) await adminRevoke(u._id);
    else await adminGrant(u._id);
    setMessage(`${u.full_name}: ${u.is_admin ? t('admin.revoked') : t('admin.granted')}`);
    load();
    setTimeout(() => setMessage(null), 3000);
  }

  async function toggleSuspend(u: any) {
    const next = u.status === 'disabled' ? 'active' : 'disabled';
    if (next === 'disabled' && !confirm(`${t('admin.suspend_confirm')}\n\n${u.full_name} (${u.phone_primary})`)) return;
    await adminUpdateUser(u._id, { status: next });
    setMessage(`${u.full_name}: ${next === 'disabled' ? t('admin.suspended') : t('admin.unsuspended')}`);
    load();
    setTimeout(() => setMessage(null), 3000);
  }

  async function cleanFakeData() {
    if (!confirm(t('admin.cleanup_confirm'))) return;
    const r = await adminCleanupTestData();
    setMessage(`${t('admin.cleanup_done')} ${r.deleted_users} ${t('admin.cleanup_users')}, ${r.deleted_events} ${t('admin.cleanup_events')}`);
    load();
    setTimeout(() => setMessage(null), 6000);
  }

  async function wipeAllUsers() {
    if (!confirm(t('admin.wipe_all_confirm'))) return;
    const r = await adminCleanupTestData(true);
    setMessage(`${t('admin.wipe_all_done')} ${r.deleted_users} ${t('admin.cleanup_users')}`);
    load();
    setTimeout(() => setMessage(null), 6000);
  }

  async function del(u: any) {
    if (!confirm(t('admin.confirm_delete') + `\n\n${u.full_name} (${u.phone_primary})`)) return;
    await adminDeleteUser(u._id);
    setMessage(`${t('admin.deleted')} ${u.full_name}`);
    load();
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900">{t('nav.users')}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={cleanFakeData} className="btn-outline text-xs text-brand-orange border-brand-orange">
            🧹 {t('admin.cleanup_btn')}
          </button>
          <button onClick={wipeAllUsers} className="btn-outline text-xs text-brand-red border-brand-red">
            🗑 {t('admin.wipe_all_btn')}
          </button>
          <button onClick={() => setCreating(true)} className="btn-primary text-sm">
            + {t('admin.new_user')}
          </button>
        </div>
      </div>

      {/* ═══ Vitendo vya KUNDI (select-all + futa/funga/fungua wengi mara moja) ═══ */}
      <div className="flex items-center gap-2 flex-wrap bg-brand-grey-50 dark:bg-brand-grey-100 rounded-xl px-3 py-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-brand-grey-700">
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll}
            className="w-4 h-4 accent-brand-blue" />
          {t('admin.select_all')} ({selected.size})
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => bulk('enable')} disabled={bulkBusy || selected.size === 0}
            className="text-xs px-3 py-1.5 rounded-lg border border-green-500 text-green-600 hover:bg-green-50 disabled:opacity-40 transition">
            ✓ {t('admin.bulk_enable')}
          </button>
          <button onClick={() => bulk('disable')} disabled={bulkBusy || selected.size === 0}
            className="text-xs px-3 py-1.5 rounded-lg border border-brand-orange text-brand-orange hover:bg-brand-orange-50 disabled:opacity-40 transition">
            🚫 {t('admin.bulk_suspend')}
          </button>
          <button onClick={() => bulk('delete')} disabled={bulkBusy || selected.size === 0}
            className="text-xs px-3 py-1.5 rounded-lg border border-brand-red text-brand-red hover:bg-brand-red-50 disabled:opacity-40 transition">
            🗑 {t('admin.bulk_delete')}
          </button>
        </div>
      </div>

      {message && <div className="bg-brand-blue-50 text-brand-blue text-sm rounded-lg p-3">{message}</div>}

      <div className="flex flex-col sm:flex-row gap-2">
        <input className="input flex-1 min-w-0" placeholder={t('admin.search_ph')}
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input sm:w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{t('admin.all_depts')}</option>
          <option value="health">{t('admin.health')}</option>
          <option value="education">{t('admin.education')}</option>
        </select>
      </div>

      <div className="text-xs text-brand-grey-500">{t('admin.total')} {data?.total ?? '...'}</div>

      <div className="bg-white rounded-2xl border border-brand-grey-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-brand-grey-50 text-xs text-brand-grey-500">
            <tr>
              <th className="px-3 py-2 text-left w-10">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll}
                  className="w-4 h-4 accent-brand-blue" aria-label={t('admin.select_all')} />
              </th>
              <th className="px-3 py-2 text-left">{t('admin.col_name')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_phone')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_cadre')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_region_short')}</th>
              <th className="px-3 py-2 text-left">{t('admin.status')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_admin')}</th>
              <th className="px-3 py-2 text-right">{t('admin.col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-grey-100">
            {data?.users?.map((u: any) => (
              <tr key={u._id} className={`hover:bg-brand-grey-50 ${u.status === 'disabled' ? 'opacity-50' : ''}`}>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selected.has(u._id)}
                    onChange={() => toggleOne(u._id)} disabled={u.is_admin}
                    className="w-4 h-4 accent-brand-blue" aria-label={t('admin.col_name')} />
                </td>
                <td className="px-3 py-2 font-medium">{u.full_name} {u.is_admin && '👑'}</td>
                <td className="px-3 py-2 text-brand-blue">{u.phone_primary}</td>
                <td className="px-3 py-2 text-xs"><span className="badge-gold">{u.cadre_code}</span></td>
                <td className="px-3 py-2 text-xs">{u.current_station?.region_name}</td>
                <td className="px-3 py-2">
                  {u.status === 'disabled'
                    ? <span className="text-xs px-2 py-0.5 rounded bg-brand-red-50 text-brand-red font-semibold">🚫 {t('admin.status_disabled')}</span>
                    : <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600 font-semibold">● {t('admin.status_active')}</span>}
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => toggleAdmin(u)}
                    className={`text-xs px-2 py-0.5 rounded ${u.is_admin ? 'bg-brand-gold-100 text-brand-gold-600' : 'bg-brand-grey-100 text-brand-grey-500'}`}>
                    {u.is_admin ? t('admin.admin_role') : t('admin.user_role')}
                  </button>
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button onClick={() => setEditing(u)} className="text-brand-blue text-xs px-2 hover:underline">
                    ✎ {t('action.edit')}
                  </button>
                  {!u.is_admin && (
                    <button onClick={() => toggleSuspend(u)} className="text-brand-orange text-xs px-2 hover:underline">
                      {u.status === 'disabled' ? t('admin.unsuspend_btn') : t('admin.suspend_btn')}
                    </button>
                  )}
                  {!u.is_admin && (
                    <button onClick={() => del(u)} className="text-brand-red text-xs px-2 hover:underline">
                      🗑 {t('action.delete')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditUserModal user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); setMessage(t('admin.user_updated')); setTimeout(() => setMessage(null), 3000); }} />
      )}
      {creating && (
        <CreateUserModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); setMessage(t('admin.user_created')); setTimeout(() => setMessage(null), 3000); }} />
      )}
    </div>
  );
}

/** Subject picker — inachagua masomo kwa kiwango cha kada (Msingi/Sekondari). */
function SubjectPicker({ category, cadreCode, value, onChange, cadres }: {
  category: string; cadreCode: string; value: string[];
  onChange: (v: string[]) => void; cadres: Cadre[];
}) {
  const t = useT();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const cadre = cadres.find((c) => c.code === cadreCode);
  const level = cadre?.level || (category === 'education' ? 'Secondary' : undefined);

  useEffect(() => {
    if (level) getSubjects(level as 'Primary' | 'Secondary').then(setSubjects).catch(() => setSubjects([]));
  }, [level]);

  if (category !== 'education' || !level) return null;

  return (
    <div className="col-span-2">
      <label className="label">{t('label.subjects')} ({level})</label>
      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
        {subjects.map((s) => {
          const on = value.includes(s.code);
          return (
            <button key={s.code} type="button"
              onClick={() => onChange(on ? value.filter((c) => c !== s.code) : [...value, s.code])}
              className={`px-2 py-1 rounded-lg text-xs font-medium border transition ${on ? 'bg-brand-gold text-white border-brand-gold' : 'border-brand-grey-300 text-brand-grey-700'}`}>
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSaved }: any) {
  const t = useT();
  const [full_name, setName] = useState(user.full_name);
  const [phone_alt, setPhoneAlt] = useState(user.phone_alt || '');
  const [category, setCategory] = useState<string>(user.category || 'health');
  const [cadre_code, setCadreCode] = useState<string>(user.cadre_code || '');
  const [subjects, setSubjects] = useState<string[]>(user.subjects || []);
  const [status, setStatus] = useState(user.status || 'active');
  const [is_verified, setVerified] = useState(!!user.is_verified);
  const [is_admin, setAdmin] = useState(!!user.is_admin);
  const [new_password, setNewPassword] = useState('');
  const [cadres, setCadres] = useState<Cadre[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getCadres(category as 'health' | 'education').then(setCadres).catch(() => {}); }, [category]);

  async function save() {
    setSaving(true);
    try {
      const changes: any = {
        full_name, phone_alt: phone_alt || null, category, cadre_code,
        subjects: subjects.length ? subjects : [],
        status, is_verified, is_admin,
      };
      if (new_password) changes.new_password = new_password;
      await adminUpdateUser(user._id, changes);
      onSaved();
    } catch (e: any) {
      alert(e?.response?.data?.detail || `${t('admin.failed')} save`);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-3 my-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">{t('admin.edit_title')} {user.is_admin && '👑'}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">{t('admin.col_name')}</label><input className="input" value={full_name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label">{t('admin.phone')} Alt</label><input className="input" value={phone_alt} onChange={(e) => setPhoneAlt(e.target.value)} /></div>
          <div><label className="label">{t('admin.status')}</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">{t('admin.status_active')}</option>
              <option value="inactive">{t('admin.status_inactive')}</option>
              <option value="matched">{t('admin.status_matched')}</option>
              <option value="disabled">🚫 {t('admin.status_disabled')}</option>
            </select>
          </div>
          <div><label className="label">{t('admin.department')}</label>
            <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); setCadreCode(''); }}>
              <option value="health">{t('admin.health')}</option><option value="education">{t('admin.education')}</option>
            </select>
          </div>
          <div><label className="label">{t('admin.cadre')}</label>
            <select className="input" value={cadre_code} onChange={(e) => setCadreCode(e.target.value)}>
              <option value="">--</option>
              {cadres.map((c) => <option key={c.code} value={c.code}>{c.display_name}</option>)}
            </select>
          </div>
          <div><label className="label">{t('admin.new_password')}</label><input type="password" className="input" value={new_password} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('admin.leave_blank')} /></div>
          <SubjectPicker category={category} cadreCode={cadre_code} value={subjects} onChange={setSubjects} cadres={cadres} />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={is_verified} onChange={(e) => setVerified(e.target.checked)} /> {t('admin.verified')}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={is_admin} onChange={(e) => setAdmin(e.target.checked)} /> {t('admin.admin_ck')}</label>
        </div>
        <div className="flex gap-2 pt-3 border-t">
          <button onClick={onClose} className="btn-outline flex-1">{t('admin.cancel')}</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? '...' : t('admin.save')}</button>
        </div>
      </div>
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }: any) {
  const t = useT();
  const [full_name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('changeme123');
  const [category, setCategory] = useState<'health' | 'education'>('health');
  const [cadre_code, setCadre] = useState('CO');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [cadres, setCadres] = useState<Cadre[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [region_id, setRegionId] = useState<number | ''>('');
  const [district_id, setDistrictId] = useState<number | ''>('');
  const [facility_id, setFacilityId] = useState<string | ''>('');
  const [dests, setDests] = useState<{ region_id: number | ''; district_id: number | '' }[]>([{ region_id: '', district_id: '' }]);
  const [is_admin, setAdmin] = useState(false);
  const [status, setStatus] = useState('active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { getRegions().then(setRegions); }, []);
  useEffect(() => { getCadres(category).then(setCadres); }, [category]);
  useEffect(() => { if (region_id) getDistricts(Number(region_id)).then(setDistricts); }, [region_id]);
  useEffect(() => { if (district_id) getFacilities(Number(district_id), category).then(setFacilities).catch(() => setFacilities([])); }, [district_id, category]);

  function updateDest(i: number, field: 'region_id' | 'district_id', v: number | '') {
    const copy = dests.map((d) => ({ ...d }));
    copy[i][field] = v;
    if (field === 'region_id') copy[i].district_id = '';
    setDests(copy);
  }

  async function submit() {
    setError(null); setSaving(true);
    try {
      const region = regions.find((r) => r.id === Number(region_id))!;
      const district = districts.find((d) => d.id === Number(district_id))!;
      const facility = facilities.find((f: any) => String(f.id || f.code) === facility_id);
      const desired_destinations = dests
        .filter((d) => d.region_id !== '')
        .map((d) => {
          const r = regions.find((x) => x.id === Number(d.region_id))!;
          const dd = districts.find((x) => x.id === Number(d.district_id));
          return {
            region_id: r.id, region_name: r.name,
            district_id: dd?.id ?? null, district_name: dd?.name ?? null,
          };
        });
      await register({
        full_name, phone_primary: phone, password,
        category, cadre_code, subjects,
        current_station: {
          region_id: region.id, region_name: region.name,
          district_id: district.id, district_name: district.name,
          facility_id: facility ? String(facility.id || facility.code) : null,
          facility_name: facility ? facility.name : null,
        },
        desired_destinations: desired_destinations.length ? desired_destinations : [{ region_id: region.id, region_name: region.name }],
      });
      // Set admin/status if needed (register always creates regular active user)
      if (is_admin || status !== 'active') {
        const list = await adminUsers({ q: phone, limit: 5 });
        const created = list.users.find((u: any) => u.phone_primary === phone);
        if (created) await adminUpdateUser(created._id, { is_admin, status });
      }
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.detail || t('admin.failed'));
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 space-y-3 my-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">{t('admin.create_title')}</h2>
        {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-2">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">{t('admin.full_name')}</label><input className="input" value={full_name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label">{t('admin.phone')}</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" /></div>
          <div><label className="label">{t('admin.password')}</label><input className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div><label className="label">{t('admin.department')}</label>
            <select className="input" value={category} onChange={(e) => { setCategory(e.target.value as any); setCadre(''); }}>
              <option value="health">{t('admin.health')}</option><option value="education">{t('admin.education')}</option>
            </select>
          </div>
          <div><label className="label">{t('admin.cadre')}</label>
            <select className="input" value={cadre_code} onChange={(e) => setCadre(e.target.value)}>
              {cadres.map((c) => <option key={c.code} value={c.code}>{c.display_name}</option>)}
            </select>
          </div>
          <div><label className="label">{t('admin.status')}</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">{t('admin.status_active')}</option>
              <option value="disabled">🚫 {t('admin.status_disabled')}</option>
            </select>
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm py-1">
            <input type="checkbox" checked={is_admin} onChange={(e) => setAdmin(e.target.checked)} /> {t('admin.admin_ck')} 👑
          </label>
          <SubjectPicker category={category} cadreCode={cadre_code} value={subjects} onChange={setSubjects} cadres={cadres} />

          {/* Kituo cha sasa */}
          <div><label className="label">{t('admin.region')} *</label>
            <select className="input" value={region_id} onChange={(e) => { setRegionId(Number(e.target.value) || ''); setDistrictId(''); setFacilityId(''); }}>
              <option value="">--</option>{regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div><label className="label">{t('admin.district')} *</label>
            <select className="input" value={district_id} onChange={(e) => { setDistrictId(Number(e.target.value) || ''); setFacilityId(''); }}>
              <option value="">--</option>{districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="label">{t('admin.facility')}</label>
            <select className="input" value={facility_id} onChange={(e) => setFacilityId(e.target.value || '')} disabled={!district_id}>
              <option value="">--</option>
              {facilities.map((f: any) => <option key={f.id || f.code} value={String(f.id || f.code)}>{f.name}</option>)}
            </select>
          </div>

          {/* Destinations (nyingi) */}
          <div className="col-span-2">
            <label className="label">{t('admin.destinations')}</label>
            <div className="space-y-2">
              {dests.map((d, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select className="input flex-1" value={d.region_id} onChange={(e) => updateDest(i, 'region_id', Number(e.target.value) || '')}>
                    <option value="">{t('admin.wants_region')}</option>
                    {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <select className="input flex-1" value={d.district_id} onChange={(e) => updateDest(i, 'district_id', Number(e.target.value) || '')} disabled={!d.region_id}>
                    <option value="">{t('step4.any_district')}</option>
                    {d.region_id && districts.filter((x) => x.region_id === Number(d.region_id)).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  {dests.length > 1 && (
                    <button type="button" onClick={() => setDests(dests.filter((_, idx) => idx !== i))} className="text-brand-red text-sm px-2">🗑</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setDests([...dests, { region_id: '', district_id: '' }])}
              className="text-brand-blue text-sm mt-1.5">{t('step4.add_more')}</button>
          </div>
        </div>
        <div className="flex gap-2 pt-3 border-t">
          <button onClick={onClose} className="btn-outline flex-1">{t('admin.cancel')}</button>
          <button onClick={submit} disabled={saving || !full_name || !phone || !region_id || !district_id} className="btn-primary flex-1">
            {saving ? t('admin.creating') : t('admin.create')}
          </button>
        </div>
      </div>
    </div>
  );
}
