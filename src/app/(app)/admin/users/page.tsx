'use client';

import { useEffect, useState } from 'react';
import { adminUsers, adminUpdateUser, adminDeleteUser, adminGrant, adminRevoke, register, getRegions, getDistricts, getCadres, type Region, type District, type Cadre } from '@/lib/api';
import { useT } from '@/lib/i18n';

export default function AdminUsersPage() {
  const t = useT();
  const [data, setData] = useState<any>(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const params: any = { limit: 200 };
    if (q) params.q = q;
    if (category) params.category = category;
    setData(await adminUsers(params));
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, category]);

  async function toggleAdmin(u: any) {
    if (u.is_admin) await adminRevoke(u._id);
    else await adminGrant(u._id);
    setMessage(`${u.full_name}: ${u.is_admin ? t('admin.revoked') : t('admin.granted')}`);
    load();
    setTimeout(() => setMessage(null), 3000);
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
        <button onClick={() => setCreating(true)} className="btn-primary text-sm">
          + {t('admin.new_user')}
        </button>
      </div>

      {message && <div className="bg-brand-blue-50 text-brand-blue text-sm rounded-lg p-3">{message}</div>}

      <div className="flex gap-2 flex-wrap">
        <input className="input flex-1 min-w-[200px]" placeholder={t('admin.search_ph')}
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{t('admin.all_depts')}</option>
          <option value="health">{t('admin.health')}</option>
          <option value="education">{t('admin.education')}</option>
        </select>
      </div>

      <div className="text-xs text-brand-grey-500">{t('admin.total')} {data?.total ?? '...'}</div>

      <div className="bg-white rounded-2xl border border-brand-grey-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-grey-50 text-xs text-brand-grey-500">
            <tr>
              <th className="px-3 py-2 text-left">{t('admin.col_name')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_phone')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_cadre')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_region_short')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_admin')}</th>
              <th className="px-3 py-2 text-right">{t('admin.col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-grey-100">
            {data?.users?.map((u: any) => (
              <tr key={u._id} className="hover:bg-brand-grey-50">
                <td className="px-3 py-2 font-medium">{u.full_name}</td>
                <td className="px-3 py-2 text-brand-blue">{u.phone_primary}</td>
                <td className="px-3 py-2 text-xs"><span className="badge-gold">{u.cadre_code}</span></td>
                <td className="px-3 py-2 text-xs">{u.current_station?.region_name}</td>
                <td className="px-3 py-2">
                  <button onClick={() => toggleAdmin(u)}
                    className={`text-xs px-2 py-0.5 rounded ${u.is_admin ? 'bg-brand-gold-100 text-brand-gold-600' : 'bg-brand-grey-100 text-brand-grey-500'}`}>
                    {u.is_admin ? t('admin.admin_role') : t('admin.user_role')}
                  </button>
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setEditing(u)} className="text-brand-blue text-xs px-2 hover:underline">
                    ✎ {t('action.edit')}
                  </button>
                  <button onClick={() => del(u)} className="text-brand-red text-xs px-2 hover:underline">
                    🗑 {t('action.delete')}
                  </button>
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

function EditUserModal({ user, onClose, onSaved }: any) {
  const t = useT();
  const [full_name, setName] = useState(user.full_name);
  const [phone_alt, setPhoneAlt] = useState(user.phone_alt || '');
  const [status, setStatus] = useState(user.status || 'active');
  const [is_verified, setVerified] = useState(!!user.is_verified);
  const [is_admin, setAdmin] = useState(!!user.is_admin);
  const [new_password, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const changes: any = { full_name, phone_alt: phone_alt || null, status, is_verified, is_admin };
      if (new_password) changes.new_password = new_password;
      await adminUpdateUser(user._id, changes);
      onSaved();
    } catch (e: any) {
      alert(e?.response?.data?.detail || `${t('admin.failed')} save`);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">{t('admin.edit_title')}</h2>
        <div><label className="label">{t('admin.col_name')}</label><input className="input" value={full_name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">{t('admin.phone')} Alt</label><input className="input" value={phone_alt} onChange={(e) => setPhoneAlt(e.target.value)} /></div>
        <div><label className="label">{t('admin.status')}</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">{t('admin.status_active')}</option><option value="inactive">{t('admin.status_inactive')}</option><option value="matched">{t('admin.status_matched')}</option>
          </select>
        </div>
        <div><label className="label">{t('admin.new_password')}</label><input type="password" className="input" value={new_password} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('admin.leave_blank')} /></div>
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
  const [region_id, setRegionId] = useState<number | ''>('');
  const [district_id, setDistrictId] = useState<number | ''>('');
  const [dest_region_id, setDestRegionId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { getRegions().then(setRegions); getCadres(category).then(setCadres); }, [category]);
  useEffect(() => { if (region_id) getDistricts(Number(region_id)).then(setDistricts); }, [region_id]);

  async function submit() {
    setError(null); setSaving(true);
    try {
      const region = regions.find((r) => r.id === Number(region_id))!;
      const district = districts.find((d) => d.id === Number(district_id))!;
      const destR = regions.find((r) => r.id === Number(dest_region_id))!;
      await register({
        full_name, phone_primary: phone, password,
        category, cadre_code, subjects,
        current_station: { region_id: region.id, region_name: region.name, district_id: district.id, district_name: district.name },
        desired_destinations: [{ region_id: destR.id, region_name: destR.name }],
      });
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.detail || t('admin.failed'));
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-3 my-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">{t('admin.create_title')}</h2>
        {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-2">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">{t('admin.full_name')}</label><input className="input" value={full_name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label">{t('admin.phone')}</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" /></div>
          <div><label className="label">{t('admin.password')}</label><input className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div><label className="label">{t('admin.department')}</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as any)}>
              <option value="health">{t('admin.health')}</option><option value="education">{t('admin.education')}</option>
            </select>
          </div>
          <div className="col-span-2"><label className="label">{t('admin.cadre')}</label>
            <select className="input" value={cadre_code} onChange={(e) => setCadre(e.target.value)}>
              {cadres.map((c) => <option key={c.code} value={c.code}>{c.display_name}</option>)}
            </select>
          </div>
          <div><label className="label">{t('admin.region')}</label>
            <select className="input" value={region_id} onChange={(e) => setRegionId(Number(e.target.value) || '')}>
              <option value="">--</option>{regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div><label className="label">{t('admin.district')}</label>
            <select className="input" value={district_id} onChange={(e) => setDistrictId(Number(e.target.value) || '')}>
              <option value="">--</option>{districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="label">{t('admin.wants_region')}</label>
            <select className="input" value={dest_region_id} onChange={(e) => setDestRegionId(Number(e.target.value) || '')}>
              <option value="">--</option>{regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-3 border-t">
          <button onClick={onClose} className="btn-outline flex-1">{t('admin.cancel')}</button>
          <button onClick={submit} disabled={saving || !full_name || !phone || !region_id || !district_id || !dest_region_id} className="btn-primary flex-1">
            {saving ? t('admin.creating') : t('admin.create')}
          </button>
        </div>
      </div>
    </div>
  );
}
