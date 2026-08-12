'use client';

import { useEffect, useState } from 'react';
import {
  adminListSubjects, adminAddSubject, adminUpdateSubject, adminDeleteSubject,
  adminListCadres, adminAddCadre, adminUpdateCadre, adminDeleteCadre,
  adminListRegions, adminAddRegion, adminUpdateRegion, adminDeleteRegion,
  adminListDistricts, adminAddDistrict, adminUpdateDistrict, adminDeleteDistrict,
} from '@/lib/api';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';

type Tab = 'subjects' | 'cadres' | 'regions' | 'districts';

export default function AdminDataPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('subjects');
  const [msg, setMsg] = useState<string | null>(null);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(null), 2500); }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-grey-900">🗂️ {t('data.title')}</h1>
        <p className="text-brand-grey-500 text-sm mt-1">{t('data.subtitle')}</p>
      </div>

      {msg && <div className="bg-brand-blue-50 text-brand-blue text-sm rounded-lg p-3">{msg}</div>}

      <div className="flex gap-2 border-b border-brand-grey-200 flex-wrap">
        {(['subjects', 'cadres', 'regions', 'districts'] as Tab[]).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${tab === tb ? 'border-brand-blue text-brand-blue' : 'border-transparent text-brand-grey-500 hover:text-brand-grey-900'}`}>
            {tb === 'subjects' ? t('data.subjects') : tb === 'cadres' ? t('data.cadres') : tb === 'regions' ? t('data.regions') : t('data.districts')}
          </button>
        ))}
      </div>

      {tab === 'subjects' && <SubjectsTab flash={flash} />}
      {tab === 'cadres' && <CadresTab flash={flash} />}
      {tab === 'regions' && <RegionsTab flash={flash} />}
      {tab === 'districts' && <DistrictsTab flash={flash} />}
    </div>
  );
}

function RowAction({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <span className="whitespace-nowrap">
      <button onClick={onEdit} className="text-brand-blue text-xs px-2 hover:underline">✎</button>
      <button onClick={onDelete} className="text-brand-red text-xs px-2 hover:underline">🗑</button>
    </span>
  );
}

/* ═══ MASOMO ═══ */
function SubjectsTab({ flash }: { flash: (m: string) => void }) {
  const t = useT();
  const [data, setData] = useState<any[] | null>(null);
  const [level, setLevel] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  // bypass wakati level imechaguliwa — dropdown ibadilike mara moja (fresh).
  async function load() { setData(await adminListSubjects(level || undefined, !!level)); }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [level]);

  if (!data) return <div className="p-6"><Spinner /></div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <select className="input w-auto" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">{t('data.all_levels')}</option>
          <option value="Primary">Primary (Msingi)</option>
          <option value="Secondary">Secondary (Sekondari)</option>
        </select>
        <button onClick={() => setCreating(true)} className="btn-primary text-sm">+ {t('data.add_subject')}</button>
      </div>
      <div className="bg-white rounded-2xl border border-brand-grey-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-brand-grey-50 text-xs text-brand-grey-500">
            <tr>
              <th className="px-3 py-2 text-left">{t('data.code')}</th>
              <th className="px-3 py-2 text-left">{t('data.name')}</th>
              <th className="px-3 py-2 text-left">{t('data.level')}</th>
              <th className="px-3 py-2 text-right">{t('admin.col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-grey-100">
            {data.map((s: any) => (
              <tr key={s.code} className="hover:bg-brand-grey-50">
                <td className="px-3 py-2 font-mono text-xs">{s.code}</td>
                <td className="px-3 py-2 font-medium">{s.name}</td>
                <td className="px-3 py-2"><span className="badge-gold">{s.level}</span></td>
                <td className="px-3 py-2 text-right">
                  <RowAction onEdit={() => setEditing(s)} onDelete={async () => {
                    if (confirm(t('data.confirm_delete'))) { await adminDeleteSubject(s.code); flash(t('data.deleted')); load(); }
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(editing || creating) && (
        <SubjectModal
          initial={editing || { code: '', name: '', level: 'Primary' }}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={async (body) => {
            if (editing) await adminUpdateSubject(editing.code, body);
            else await adminAddSubject(body);
            setEditing(null); setCreating(false); flash(t('data.saved')); load();
          }} />
      )}
    </div>
  );
}

function SubjectModal({ initial, onClose, onSaved }: { initial: any; onClose: () => void; onSaved: (b: any) => void }) {
  const t = useT();
  const [code, setCode] = useState(initial.code);
  const [name, setName] = useState(initial.name);
  const [level, setLevel] = useState(initial.level);
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">{initial.code ? t('data.edit_subject') : t('data.add_subject')}</h2>
        <div><label className="label">{t('data.code')}</label><input className="input font-mono uppercase" value={code} onChange={(e) => setCode(e.target.value)} /></div>
        <div><label className="label">{t('data.name')}</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">{t('data.level')}</label>
          <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="Primary">Primary (Msingi)</option>
            <option value="Secondary">Secondary (Sekondari)</option>
          </select>
        </div>
        <div className="flex gap-2 pt-3 border-t">
          <button onClick={onClose} className="btn-outline flex-1">{t('admin.cancel')}</button>
          <button disabled={busy || !code || !name} onClick={async () => { setBusy(true); await onSaved({ code: code.toUpperCase(), name, level }); }}
            className="btn-primary flex-1">{busy ? '...' : t('admin.save')}</button>
        </div>
      </div>
    </div>
  );
}

/* ═══ KADA ═══ */
function CadresTab({ flash }: { flash: (m: string) => void }) {
  const t = useT();
  const [data, setData] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  async function load() { setData(await adminListCadres()); }
  useEffect(() => { load(); }, []);

  if (!data) return <div className="p-6"><Spinner /></div>;

  return (
    <div className="space-y-3">
      <button onClick={() => setCreating(true)} className="btn-primary text-sm">+ {t('data.add_cadre')}</button>
      <div className="bg-white rounded-2xl border border-brand-grey-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead className="bg-brand-grey-50 text-xs text-brand-grey-500">
            <tr>
              <th className="px-3 py-2 text-left">{t('data.code')}</th>
              <th className="px-3 py-2 text-left">{t('data.name')}</th>
              <th className="px-3 py-2 text-left">{t('admin.department')}</th>
              <th className="px-3 py-2 text-left">{t('data.level')}</th>
              <th className="px-3 py-2 text-right">{t('admin.col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-grey-100">
            {data.map((c: any) => (
              <tr key={c.code} className="hover:bg-brand-grey-50">
                <td className="px-3 py-2 font-mono text-xs">{c.code}</td>
                <td className="px-3 py-2 font-medium">{c.display_name}</td>
                <td className="px-3 py-2 text-xs">{c.category === 'health' ? t('admin.health') : t('admin.education')}</td>
                <td className="px-3 py-2 text-xs">{c.level || '-'}</td>
                <td className="px-3 py-2 text-right">
                  <RowAction onEdit={() => setEditing(c)} onDelete={async () => {
                    if (confirm(t('data.confirm_delete'))) { await adminDeleteCadre(c.code); flash(t('data.deleted')); load(); }
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(editing || creating) && (
        <CadreModal
          initial={editing || { code: '', display_name: '', category: 'education', requires_subjects: false, level: 'Primary' }}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={async (body) => {
            if (editing) await adminUpdateCadre(editing.code, body);
            else await adminAddCadre(body);
            setEditing(null); setCreating(false); flash(t('data.saved')); load();
          }} />
      )}
    </div>
  );
}

function CadreModal({ initial, onClose, onSaved }: { initial: any; onClose: () => void; onSaved: (b: any) => void }) {
  const t = useT();
  const [code, setCode] = useState(initial.code);
  const [display_name, setName] = useState(initial.display_name);
  const [category, setCategory] = useState(initial.category);
  const [level, setLevel] = useState(initial.level || 'Primary');
  const [requires_subjects, setReq] = useState(!!initial.requires_subjects);
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">{initial.code ? t('data.edit_cadre') : t('data.add_cadre')}</h2>
        <div><label className="label">{t('data.code')}</label><input className="input font-mono uppercase" value={code} onChange={(e) => setCode(e.target.value)} /></div>
        <div><label className="label">{t('data.name')}</label><input className="input" value={display_name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">{t('admin.department')}</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="health">{t('admin.health')}</option><option value="education">{t('admin.education')}</option>
          </select>
        </div>
        {category === 'education' && (
          <div><label className="label">{t('data.level')}</label>
            <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="Primary">Primary (Msingi)</option>
              <option value="Secondary">Secondary (Sekondari)</option>
            </select>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={requires_subjects} onChange={(e) => setReq(e.target.checked)} /> {t('data.req_subjects')}</label>
        <div className="flex gap-2 pt-3 border-t">
          <button onClick={onClose} className="btn-outline flex-1">{t('admin.cancel')}</button>
          <button disabled={busy || !code || !display_name} onClick={async () => { setBusy(true); await onSaved({ code: code.toUpperCase(), display_name, category, level: category === 'education' ? level : null, requires_subjects }); }}
            className="btn-primary flex-1">{busy ? '...' : t('admin.save')}</button>
        </div>
      </div>
    </div>
  );
}

/* ═══ MIKOA ═══ */
function RegionsTab({ flash }: { flash: (m: string) => void }) {
  const t = useT();
  const [data, setData] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  async function load() { setData(await adminListRegions()); }
  useEffect(() => { load(); }, []);

  if (!data) return <div className="p-6"><Spinner /></div>;

  return (
    <div className="space-y-3">
      <button onClick={() => setCreating(true)} className="btn-primary text-sm">+ {t('data.add_region')}</button>
      <div className="bg-white rounded-2xl border border-brand-grey-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead className="bg-brand-grey-50 text-xs text-brand-grey-500">
            <tr>
              <th className="px-3 py-2 text-left">{t('data.id')}</th>
              <th className="px-3 py-2 text-left">{t('data.name')}</th>
              <th className="px-3 py-2 text-right">{t('admin.col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-grey-100">
            {data.map((r: any) => (
              <tr key={r.id} className="hover:bg-brand-grey-50">
                <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2 text-right">
                  <RowAction onEdit={() => setEditing(r)} onDelete={async () => {
                    if (confirm(t('data.confirm_delete'))) { await adminDeleteRegion(r.id); flash(t('data.deleted')); load(); }
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(editing || creating) && (
        <RegionDistrictModal
          title={editing ? t('data.edit_region') : t('data.add_region')}
          initial={{ id: editing?.id || '', name: editing?.name || '' }}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={async (body) => {
            if (editing) await adminUpdateRegion(editing.id, { id: Number(body.id), name: body.name });
            else await adminAddRegion({ id: Number(body.id), name: body.name });
            setEditing(null); setCreating(false); flash(t('data.saved')); load();
          }} />
      )}
    </div>
  );
}

/* ═══ WILAYA ═══ */
function DistrictsTab({ flash }: { flash: (m: string) => void }) {
  const t = useT();
  const [data, setData] = useState<any[] | null>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [regionFilter, setRegionFilter] = useState<number | ''>('');
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  // bypass wakati mkoa umechaguliwa — dropdown ibadilike mara moja (fresh).
  async function load() { setData(await adminListDistricts(regionFilter || undefined, !!regionFilter)); }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [regionFilter]);
  useEffect(() => { adminListRegions().then(setRegions); }, []);

  if (!data) return <div className="p-6"><Spinner /></div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <select className="input w-auto" value={regionFilter} onChange={(e) => setRegionFilter(Number(e.target.value) || '')}>
          <option value="">{t('data.all_regions')}</option>
          {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <button onClick={() => setCreating(true)} className="btn-primary text-sm">+ {t('data.add_district')}</button>
      </div>
      <div className="bg-white rounded-2xl border border-brand-grey-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead className="bg-brand-grey-50 text-xs text-brand-grey-500">
            <tr>
              <th className="px-3 py-2 text-left">{t('data.id')}</th>
              <th className="px-3 py-2 text-left">{t('data.name')}</th>
              <th className="px-3 py-2 text-left">{t('data.region')}</th>
              <th className="px-3 py-2 text-right">{t('admin.col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-grey-100">
            {data.map((d: any) => (
              <tr key={d.id} className="hover:bg-brand-grey-50">
                <td className="px-3 py-2 font-mono text-xs">{d.id}</td>
                <td className="px-3 py-2 font-medium">{d.name}</td>
                <td className="px-3 py-2 text-xs">{regions.find((r) => r.id === d.region_id)?.name || d.region_id}</td>
                <td className="px-3 py-2 text-right">
                  <RowAction onEdit={() => setEditing(d)} onDelete={async () => {
                    if (confirm(t('data.confirm_delete'))) { await adminDeleteDistrict(d.id); flash(t('data.deleted')); load(); }
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(editing || creating) && (
        <RegionDistrictModal
          title={editing ? t('data.edit_district') : t('data.add_district')}
          initial={{ id: editing?.id || '', name: editing?.name || '', region_id: editing?.region_id || '' }}
          withRegion
          regions={regions}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={async (body) => {
            if (editing) await adminUpdateDistrict(editing.id, { id: Number(body.id), name: body.name, region_id: Number(body.region_id) });
            else await adminAddDistrict({ id: Number(body.id), name: body.name, region_id: Number(body.region_id) });
            setEditing(null); setCreating(false); flash(t('data.saved')); load();
          }} />
      )}
    </div>
  );
}

function RegionDistrictModal({ title, initial, onClose, onSaved, withRegion, regions }: {
  title: string; initial: any; onClose: () => void; onSaved: (b: any) => void;
  withRegion?: boolean; regions?: any[];
}) {
  const t = useT();
  const [id, setId] = useState(initial.id);
  const [name, setName] = useState(initial.name);
  const [region_id, setRegionId] = useState(initial.region_id || '');
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">{title}</h2>
        <div><label className="label">{t('data.id')}</label><input type="number" className="input font-mono" value={id} onChange={(e) => setId(e.target.value)} /></div>
        <div><label className="label">{t('data.name')}</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        {withRegion && (
          <div><label className="label">{t('data.region')}</label>
            <select className="input" value={region_id} onChange={(e) => setRegionId(e.target.value)}>
              <option value="">--</option>
              {regions?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-2 pt-3 border-t">
          <button onClick={onClose} className="btn-outline flex-1">{t('admin.cancel')}</button>
          <button disabled={busy || !id || !name || (withRegion && !region_id)}
            onClick={async () => { setBusy(true); await onSaved({ id, name, region_id }); }}
            className="btn-primary flex-1">{busy ? '...' : t('admin.save')}</button>
        </div>
      </div>
    </div>
  );
}
