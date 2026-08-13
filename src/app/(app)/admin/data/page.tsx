'use client';

import { useEffect, useRef, useState } from 'react';
import {
  adminListSubjects, adminAddSubject, adminUpdateSubject, adminDeleteSubject,
  adminListCadres, adminAddCadre, adminUpdateCadre, adminDeleteCadre,
  adminListRegions, adminAddRegion, adminUpdateRegion, adminDeleteRegion,
  adminListDistricts, adminAddDistrict, adminUpdateDistrict, adminDeleteDistrict,
} from '@/lib/api';
import { API_URL } from '@/lib/config';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';

type Tab = 'subjects' | 'cadres' | 'regions' | 'districts';

/** Pata ujumbe wa kosa la API (ikiwa lipo) — modal isiwe "inabaki inaload". */
async function errText(e: any): Promise<string> {
  try {
    const d = e?.response?.data;
    return d?.detail || e?.message || 'Jaribu tena';
  } catch { return 'Jaribu tena'; }
}

/**
 * EVENT-DRIVEN: sikiliza /admin/live-events (SSE) — mabadiliko yoyote ya data
 * (masomo/kada/mikoa/wilaya) kutoka kwenye session NYINGINE yanafanya orodha
 * ijirefresh PAPO HAPO — hakuna refresh ya page. Kitendo cha sisi wenyewe
 * kinachukuliwa na load() ya haraka; event inayorudi ndani ya sekunde 1.5
 * inapuuzwa (usi-refresh mara mbili).
 */
function useLiveDataRefresh() {
  const [tick, setTick] = useState(0);
  const [live, setLive] = useState(false);
  const lastOwnAction = useRef(0);

  useEffect(() => {
    let aborter: AbortController | null = null;
    let retry: any = null;
    let stopped = false;

    async function connect() {
      try {
        const raw = sessionStorage.getItem('kv_auth');
        let token: string | null = null;
        try { token = raw ? (JSON.parse(raw)?.state?.token || null) : null; } catch {}
        aborter = new AbortController();
        const res = await fetch(`${API_URL}/admin/live-events`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: aborter.signal,
        });
        if (!res.ok || !res.body) throw new Error('feed failed');
        setLive(true);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const chunk = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const line = chunk.split('\n').find((l) => l.startsWith('data: '));
            if (line) {
              try {
                const ev = JSON.parse(line.slice(6));
                if (ev?.event_type?.startsWith('data.')) {
                  if (Date.now() - lastOwnAction.current < 1500) continue;
                  setTick((t) => t + 1);
                }
              } catch { /* sio JSON — puuza */ }
            }
          }
        }
      } catch {
        /* mtandao/abort — reconnect chini */
      }
      setLive(false);
      if (!stopped) retry = setTimeout(connect, 3000);
    }

    connect();
    return () => {
      stopped = true;
      aborter?.abort();
      if (retry) clearTimeout(retry);
    };
  }, []);

  return {
    tick,
    live,
    markOwnAction: () => { lastOwnAction.current = Date.now(); },
  };
}

export default function AdminDataPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('subjects');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const { tick, live, markOwnAction } = useLiveDataRefresh();

  function flash(m: string, ok = true) { setMsg({ text: m, ok }); setTimeout(() => setMsg(null), 3500); }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900 flex items-center gap-2">
          🗂️ {t('data.title')}
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            live ? 'bg-green-50 text-green-600 border-green-300' : 'bg-brand-grey-50 text-brand-grey-400 border-brand-grey-200'}`}>
            <span className={`w-2 h-2 rounded-full ${live ? 'bg-green-500 animate-pulse' : 'bg-brand-grey-300'}`} />
            {t('data.live')}
          </span>
        </h1>
        <p className="text-brand-grey-500 text-sm mt-1">{t('data.subtitle')}</p>
      </div>

      {msg && (
        <div className={`text-sm rounded-lg p-3 ${msg.ok ? 'bg-brand-blue-50 text-brand-blue' : 'bg-brand-red-50 text-brand-red'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex gap-2 border-b border-brand-grey-200 flex-wrap">
        {(['subjects', 'cadres', 'regions', 'districts'] as Tab[]).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${tab === tb ? 'border-brand-blue text-brand-blue' : 'border-transparent text-brand-grey-500 hover:text-brand-grey-900'}`}>
            {tb === 'subjects' ? t('data.subjects') : tb === 'cadres' ? t('data.cadres') : tb === 'regions' ? t('data.regions') : t('data.districts')}
          </button>
        ))}
      </div>

      {tab === 'subjects' && <SubjectsTab flash={flash} tick={tick} markOwnAction={markOwnAction} />}
      {tab === 'cadres' && <CadresTab flash={flash} tick={tick} markOwnAction={markOwnAction} />}
      {tab === 'regions' && <RegionsTab flash={flash} tick={tick} markOwnAction={markOwnAction} />}
      {tab === 'districts' && <DistrictsTab flash={flash} tick={tick} markOwnAction={markOwnAction} />}
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

/** Common modal scaffolding — BUSY haiwezi kukwama: kosa linaonekana hapa,
    siyo button ya "..." kubaki inaload milele. */
function ModalShell({ title, children, onClose, onSave, saveLabel, busy, canSave, error }: {
  title: string; children: React.ReactNode; onClose: () => void;
  onSave: () => Promise<void>; saveLabel: string; busy: boolean; canSave: boolean; error: string | null;
}) {
  const t = useT();
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 my-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">{title}</h2>
        {children}
        {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-2.5">{error}</div>}
        <div className="flex gap-2 pt-3 border-t">
          <button type="button" onClick={onClose} disabled={busy} className="btn-outline flex-1">{t('admin.cancel')}</button>
          <button type="button" disabled={busy || !canSave} onClick={async () => {
            try { await onSave(); } catch { /* error iko kwenye state ya modal */ }
          }} className="btn-primary flex-1">
            {busy ? <span className="inline-flex items-center gap-1.5"><span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> {t('action.processing')}</span> : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ MASOMO ═══ */
function SubjectsTab({ flash, tick, markOwnAction }: { flash: (m: string, ok?: boolean) => void; tick: number; markOwnAction: () => void }) {
  const t = useT();
  const [data, setData] = useState<any[] | null>(null);
  const [level, setLevel] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  // bypass wakati level imechaguliwa — dropdown ibadilike mara moja (fresh).
  async function load() {
    try { setData(await adminListSubjects(level || undefined, !!level)); } catch (e) { flash(await errText(e), false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [level, tick]);

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
                    if (!confirm(t('data.confirm_delete'))) return;
                    try { await adminDeleteSubject(s.code); markOwnAction(); flash(t('data.deleted')); load(); }
                    catch (e) { flash(await errText(e), false); }
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
            try {
              if (editing) await adminUpdateSubject(editing.code, body);
              else await adminAddSubject(body);
              markOwnAction(); setEditing(null); setCreating(false); flash(t('data.saved')); load();
            } catch (e) { throw e; }
          }} />
      )}
    </div>
  );
}

function SubjectModal({ initial, onClose, onSaved }: { initial: any; onClose: () => void; onSaved: (b: any) => Promise<void> }) {
  const t = useT();
  const [code, setCode] = useState(initial.code);
  const [name, setName] = useState(initial.name);
  const [level, setLevel] = useState(initial.level);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <ModalShell
      title={initial.code ? t('data.edit_subject') : t('data.add_subject')}
      onClose={onClose}
      busy={busy} canSave={!!code && !!name && !busy}
      saveLabel={t('admin.save')} error={error}
      onSave={async () => {
        setBusy(true); setError(null);
        try {
          await onSaved({ code: code.toUpperCase(), name, level });
        } catch (e) { setError(await errText(e)); }
        finally { setBusy(false); }
      }}>
      <div><label className="label">{t('data.code')}</label><input className="input font-mono uppercase" value={code} onChange={(e) => setCode(e.target.value)} disabled={busy} /></div>
      <div><label className="label">{t('data.name')}</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} /></div>
      <div><label className="label">{t('data.level')}</label>
        <select className="input" value={level} onChange={(e) => setLevel(e.target.value)} disabled={busy}>
          <option value="Primary">Primary (Msingi)</option>
          <option value="Secondary">Secondary (Sekondari)</option>
        </select>
      </div>
    </ModalShell>
  );
}

/* ═══ KADA ═══ */
function CadresTab({ flash, tick, markOwnAction }: { flash: (m: string, ok?: boolean) => void; tick: number; markOwnAction: () => void }) {
  const t = useT();
  const [data, setData] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    try { setData(await adminListCadres()); } catch (e) { flash(await errText(e), false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tick]);

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
                    if (!confirm(t('data.confirm_delete'))) return;
                    try { await adminDeleteCadre(c.code); markOwnAction(); flash(t('data.deleted')); load(); }
                    catch (e) { flash(await errText(e), false); }
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
            try {
              if (editing) await adminUpdateCadre(editing.code, body);
              else await adminAddCadre(body);
              markOwnAction(); setEditing(null); setCreating(false); flash(t('data.saved')); load();
            } catch (e) { throw e; }
          }} />
      )}
    </div>
  );
}

function CadreModal({ initial, onClose, onSaved }: { initial: any; onClose: () => void; onSaved: (b: any) => Promise<void> }) {
  const t = useT();
  const [code, setCode] = useState(initial.code);
  const [display_name, setName] = useState(initial.display_name);
  const [category, setCategory] = useState(initial.category);
  const [level, setLevel] = useState(initial.level || 'Primary');
  const [requires_subjects, setReq] = useState(!!initial.requires_subjects);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <ModalShell
      title={initial.code ? t('data.edit_cadre') : t('data.add_cadre')}
      onClose={onClose}
      busy={busy} canSave={!!code && !!display_name && !busy}
      saveLabel={t('admin.save')} error={error}
      onSave={async () => {
        setBusy(true); setError(null);
        try {
          await onSaved({ code: code.toUpperCase(), display_name, category, level: category === 'education' ? level : null, requires_subjects });
        } catch (e) { setError(await errText(e)); }
        finally { setBusy(false); }
      }}>
      <div><label className="label">{t('data.code')}</label><input className="input font-mono uppercase" value={code} onChange={(e) => setCode(e.target.value)} disabled={busy} /></div>
      <div><label className="label">{t('data.name')}</label><input className="input" value={display_name} onChange={(e) => setName(e.target.value)} disabled={busy} /></div>
      <div><label className="label">{t('admin.department')}</label>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} disabled={busy}>
          <option value="health">{t('admin.health')}</option><option value="education">{t('admin.education')}</option>
        </select>
      </div>
      {category === 'education' && (
        <div><label className="label">{t('data.level')}</label>
          <select className="input" value={level} onChange={(e) => setLevel(e.target.value)} disabled={busy}>
            <option value="Primary">Primary (Msingi)</option>
            <option value="Secondary">Secondary (Sekondari)</option>
          </select>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={requires_subjects} onChange={(e) => setReq(e.target.checked)} disabled={busy} /> {t('data.req_subjects')}</label>
    </ModalShell>
  );
}

/* ═══ MIKOA ═══ */
function RegionsTab({ flash, tick, markOwnAction }: { flash: (m: string, ok?: boolean) => void; tick: number; markOwnAction: () => void }) {
  const t = useT();
  const [data, setData] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    try { setData(await adminListRegions()); } catch (e) { flash(await errText(e), false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tick]);

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
                    if (!confirm(t('data.confirm_delete'))) return;
                    try { await adminDeleteRegion(r.id); markOwnAction(); flash(t('data.deleted')); load(); }
                    catch (e) { flash(await errText(e), false); }
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
          initial={editing ? { id: editing.id, name: editing.name } : { id: null, name: '' }}
          createMode={!editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={async (body) => {
            try {
              if (editing) await adminUpdateRegion(editing.id, { id: Number(body.id), name: body.name });
              else await adminAddRegion({ id: body.id ? Number(body.id) : 0, name: body.name });
              markOwnAction(); setEditing(null); setCreating(false); flash(t('data.saved')); load();
            } catch (e) { throw e; }
          }} />
      )}
    </div>
  );
}

/* ═══ WILAYA ═══ */
function DistrictsTab({ flash, tick, markOwnAction }: { flash: (m: string, ok?: boolean) => void; tick: number; markOwnAction: () => void }) {
  const t = useT();
  const [data, setData] = useState<any[] | null>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [regionFilter, setRegionFilter] = useState<number | ''>('');
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  // bypass wakati mkoa umechaguliwa — dropdown ibadilike mara moja (fresh).
  async function load() {
    try { setData(await adminListDistricts(regionFilter || undefined, !!regionFilter)); }
    catch (e) { flash(await errText(e), false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [regionFilter, tick]);
  useEffect(() => { adminListRegions().then(setRegions).catch(() => {}); }, [tick]);

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
                    if (!confirm(t('data.confirm_delete'))) return;
                    try { await adminDeleteDistrict(d.id); markOwnAction(); flash(t('data.deleted')); load(); }
                    catch (e) { flash(await errText(e), false); }
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
          initial={editing ? { id: editing.id, name: editing.name, region_id: editing.region_id } : { id: null, name: '', region_id: '' }}
          createMode={!editing}
          withRegion
          regions={regions}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={async (body) => {
            try {
              if (editing) await adminUpdateDistrict(editing.id, { id: Number(body.id), name: body.name, region_id: Number(body.region_id) });
              else await adminAddDistrict({ id: body.id ? Number(body.id) : 0, name: body.name, region_id: Number(body.region_id) });
              markOwnAction(); setEditing(null); setCreating(false); flash(t('data.saved')); load();
            } catch (e) { throw e; }
          }} />
      )}
    </div>
  );
}

function RegionDistrictModal({ title, initial, onClose, onSaved, withRegion, regions, createMode }: {
  title: string; initial: any; onClose: () => void; onSaved: (b: any) => Promise<void>;
  withRegion?: boolean; regions?: any[]; createMode?: boolean;
}) {
  const t = useT();
  const [name, setName] = useState(initial.name);
  const [region_id, setRegionId] = useState(initial.region_id || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <ModalShell
      title={title}
      onClose={onClose}
      busy={busy} canSave={!!name && (!withRegion || !!region_id) && !busy}
      saveLabel={t('admin.save')} error={error}
      onSave={async () => {
        setBusy(true); setError(null);
        try {
          await onSaved({ id: createMode ? null : initial.id, name, region_id });
        } catch (e) { setError(await errText(e)); }
        finally { setBusy(false); }
      }}>
      {/* ID haijaandikwa kwa mkono — inajiongezea yenyewe kwenye backend (max+1). */}
      {!createMode && (
        <div><label className="label">{t('data.id')}</label>
          <input className="input font-mono" value={initial.id ?? ''} disabled readOnly />
        </div>
      )}
      {createMode && (
        <p className="text-xs text-brand-grey-500 bg-brand-grey-50 rounded-lg px-3 py-2">
          💡 {t('data.id_auto')}
        </p>
      )}
      <div><label className="label">{t('data.name')}</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} /></div>
      {withRegion && (
        <div><label className="label">{t('data.region')}</label>
          <select className="input" value={region_id} onChange={(e) => setRegionId(e.target.value)} disabled={busy}>
            <option value="">--</option>
            {regions?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
      )}
    </ModalShell>
  );
}
