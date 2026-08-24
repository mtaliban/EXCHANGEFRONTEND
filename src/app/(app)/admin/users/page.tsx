'use client';

import { useEffect, useRef, useState } from 'react';import { adminUsers, adminUpdateUser, adminDeleteUser, adminBulkUsers, adminGrant, adminRevoke,
  adminCreateUser, adminTrashList, adminTrashRestore, adminTrashPurge, adminTrashPurgeBulk,
  getRegions, getDistricts, getFacilities, getCadres, getDepartments, getSubjects,
  adminUserMatches, adminLoginAsUser, toggleUserContact,
  type Region, type District, type Cadre, type Subject,
} from '@/lib/api';
import {
  Users, Shield, ShieldCheck, Trash2, Eye, Pencil, Plus, Ban, CheckCircle2,
  Search, Filter, Download, AlertTriangle, RotateCcw, XCircle, Phone, Mail,
  MapPin, Building2, BookOpen, UserCheck, UserX, Clock, Info, ChevronDown,
  RefreshCw, Database, Settings, Loader2, HandCoins,
} from 'lucide-react';
import { API_URL } from '@/lib/config';
import { conversationTime } from '@/lib/dates';
import { useT } from '@/lib/i18n';
import { askConfirm } from '@/components/confirm';
import { emitDataChanged } from '@/lib/api';
import { useDataVersion } from '@/lib/useDataVersion';

/**
 * REAL-TIME: SSE feed ya admin — mtumiaji mpya anapojisajili (au kufutwa /
 * kusasishwa) orodha inajirefresh PAPO HAPO bila refresh ya page (event-driven).
 */
function useLiveUsersRefresh(onEvent: (ev: any) => void) {
  useEffect(() => {
    let aborter: AbortController | null = null;
    let retry: any = null;
    let stopped = false;
    async function connect() {
      try {
        const raw = localStorage.getItem('kv_auth');
        let token: string | null = null;
        try { token = raw ? (JSON.parse(raw)?.state?.token || null) : null; } catch {}
        aborter = new AbortController();
        const res = await fetch(`${API_URL}/admin/live-events`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: aborter.signal,
        });
        if (!res.ok || !res.body) throw new Error('feed failed');
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
              try { onEvent(JSON.parse(line.slice(6))); } catch { /* sio JSON — puuza */ }
            }
          }
        }
      } catch { /* mtandao/abort — reconnect chini */ }
      if (!stopped) retry = setTimeout(connect, 3000);
    }
    connect();
    return () => {
      stopped = true;
      aborter?.abort();
      if (retry) clearTimeout(retry);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default function AdminUsersPage() {
  const t = useT();
  const [data, setData] = useState<any>(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [trash, setTrash] = useState<any[]>([]);
  const [trashTotal, setTrashTotal] = useState(0);
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [live, setLive] = useState(false);
  const lastEvent = useRef(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [regionFilter, setRegionFilter] = useState<number | ''>('');
  const [districtFilter, setDistrictFilter] = useState<number | ''>('');
  const [facilityFilter, setFacilityFilter] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);

  useEffect(() => { getRegions().then(setRegions).catch(() => {}); }, []);
  useEffect(() => {
    if (regionFilter) getDistricts(Number(regionFilter)).then(setDistricts).catch(() => setDistricts([]));
    else setDistricts([]);
    setDistrictFilter(''); setFacilityFilter('');
  }, [regionFilter]);
  useEffect(() => {
    if (districtFilter) getFacilities(Number(districtFilter), (category || 'health') as 'health' | 'education').then(setFacilities).catch(() => setFacilities([]));
    else setFacilities([]);
    setFacilityFilter('');
  }, [districtFilter, category]);
  useEffect(() => {
    const lvl = category === 'education' ? 'Primary' : 'Secondary';
    getSubjects(lvl).then(setAllSubjects).catch(() => setAllSubjects([]));
  }, [category]);

  async function load(bypass = false) {
    const params: any = { limit: 200 };
    if (q) params.q = q;
    if (category) params.category = category;
    if (regionFilter) params.region_id = regionFilter;
    if (districtFilter) params.district_id = districtFilter;
    if (facilityFilter) params.facility_id = facilityFilter;
    if (subjectFilter) params.subject = subjectFilter;
    setData(await adminUsers(params, bypass));
  }

  async function loadTrash() {
    try {
      const r = await adminTrashList();
      setTrash(r.items || []);
      setTrashTotal(r.total || 0);
    } catch {}
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, category, regionFilter, districtFilter, facilityFilter, subjectFilter]);
  // Trash ifunguke na iwe IMEJAA data tangu mwanzo (mtu akifutwa, aonekane
  // hapo papo hapo) — bila hii, trash inaonekana tupu mpaka tukio lingine
  // litokee. Event-driven: delete → SSE user.deleted → loadTrash pia.
  useEffect(() => { loadTrash(); /* eslint-disable-next-line */ }, []);

  // REAL-TIME: mtumiaji akijisajili / kufutwa / kusasishwa na admin → orodha
  // inajirefresh PAPO HAPO (event-driven, hakuna refresh ya page).
  useLiveUsersRefresh((ev) => {
    setLive(true);
    const now = Date.now();
    if (now - lastEvent.current < 1200) return; // debounce — usipige mara nyingi
    lastEvent.current = now;
    const et = ev?.event_type || '';
    if (et.startsWith('user.') || et.startsWith('data.')) {
      load(true);
      loadTrash();
      // Data ya reference (masomo/kada/mikoa) imebadilika — pickers na modals
      // wajirefresh PAPO HAPO (event-driven, hakuna refresh ya page).
      if (et.startsWith('data.')) emitDataChanged();
    }
  });
  // LIVE dot inazimika baada ya sekunde 8 bila tukio (feed iko hai au la).
  useEffect(() => {
    const id = setTimeout(() => setLive(false), 8000);
    return () => clearTimeout(id);
  }, [live]);
  // Chaguzi huisha wakati filters zinabadilika — orodha yenyewe imebadilika.
  useEffect(() => { setSelected(new Set()); setPage(1); }, [q, category, regionFilter, districtFilter, facilityFilter, subjectFilter]);

  const visibleUsers = (data?.users || []) as any[];
  const totalPages = Math.max(1, Math.ceil(visibleUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = visibleUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
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
    const ok = await askConfirm({
      title: label,
      message: `${ids.length} ${t('admin.users')}`,
      danger: action === 'delete',
    });
    if (!ok) return;
    setBulkBusy(true);
    try {
      const r = await adminBulkUsers(ids, action);
      setMessage(`${action === 'delete' ? t('admin.deleted') : action === 'disable' ? t('admin.suspended') : t('admin.unsuspended')} ${r.processed} ${t('admin.users')}${r.skipped_admin ? ` — ${r.skipped_admin} ${t('admin.bulk_skipped_admin')}` : ''}`);
      setSelected(new Set());
      // PAPO HAPO — usi-refetch orodha nzima (event-driven).
      setData((prev: any) => {
        if (!prev) return prev;
        const idSet = new Set(ids);
        if (action === 'delete') {
          const users = prev.users.filter((u: any) => !idSet.has(u._id));
          return { ...prev, users, total: (prev.total || users.length) - (prev.users.length - users.length) };
        }
        const users = prev.users.map((u: any) => idSet.has(u._id) ? { ...u, status: action === 'disable' ? 'disabled' : 'active' } : u);
        return { ...prev, users };
      });
      if (action === 'delete') loadTrash();
    } catch (e: any) {
      setMessage(e?.response?.data?.detail || t('admin.failed'));
    } finally { setBulkBusy(false); }
    setTimeout(() => setMessage(null), 5000);
  }

  async function toggleAdmin(u: any) {
    if (u.is_admin) await adminRevoke(u._id);
    else await adminGrant(u._id);
    setMessage(`${u.full_name}: ${u.is_admin ? t('admin.revoked') : t('admin.granted')}`);
    setData((prev: any) => prev ? { ...prev, users: prev.users.map((x: any) => x._id === u._id ? { ...x, is_admin: !u.is_admin } : x) } : prev);
    setTimeout(() => setMessage(null), 3000);
  }

  async function toggleSuspend(u: any) {
    const next = u.status === 'disabled' ? 'active' : 'disabled';
    if (next === 'disabled') {
      const ok = await askConfirm({
        title: t('admin.suspend_confirm'),
        message: `${u.full_name} (${u.phone_primary})`,
        danger: true,
      });
      if (!ok) return;
    }
    await adminUpdateUser(u._id, { status: next });
    // REAL-TIME: kama mtumiaji yupo logged-in, anaondolewa PAPO HAPO (WS).
    setMessage(`${u.full_name}: ${next === 'disabled' ? t('admin.suspended') : t('admin.unsuspended')}`);
    setData((prev: any) => prev ? { ...prev, users: prev.users.map((x: any) => x._id === u._id ? { ...x, status: next } : x) } : prev);
    setTimeout(() => setMessage(null), 3000);
  }

  async function toggleContact(u: any) {
    try {
      const r = await toggleUserContact(u._id);
      setMessage(`${u.full_name}: ${r.contact_enabled ? 'Ameruhusiwa kupiga simu/SMS bila malipo' : 'Hakuruhusiwa tena'}`);
      setData((prev: any) => prev ? { ...prev, users: prev.users.map((x: any) => x._id === u._id ? { ...x, contact_enabled: r.contact_enabled } : x) } : prev);
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setMessage(e?.response?.data?.detail || t('admin.failed'));
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function del(u: any) {
    // Delete sasa ni SOFT DELETE → akaunti inaenda TRASH (inaweza kurudishwa).
    const ok = await askConfirm({
      title: t('admin.confirm_delete'),
      message: `${u.full_name} (${u.phone_primary})\n\n${t('admin.trash_hint')}`,
      danger: true,
    });
    if (!ok) return;
    await adminDeleteUser(u._id);
    setMessage(`${t('admin.deleted')} ${u.full_name} — ${t('admin.trash_moved')}`);
    // PAPO HAPO — mstari wa mtumiaji unaondoka bila refetch (event-driven).
    setData((prev: any) => prev ? { ...prev, users: prev.users.filter((x: any) => x._id !== u._id), total: Math.max(0, (prev.total || prev.users.length) - 1) } : prev);
    loadTrash();
    setTimeout(() => setMessage(null), 4000);
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900 flex items-center gap-2">
          {t('nav.users')}
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            live ? 'bg-green-50 text-green-600 border-green-300' : 'bg-brand-grey-50 text-brand-grey-400 border-brand-grey-200'}`}>
            <span className={`w-2 h-2 rounded-full ${live ? 'bg-green-500 animate-pulse' : 'bg-brand-grey-300'}`} />
            {t('data.live')}
          </span>
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => { if (!showTrash) loadTrash(); setShowTrash((v) => !v); }}
            className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold transition ${showTrash ? 'bg-brand-red-50 text-brand-red border border-brand-red-200' : 'bg-brand-grey-100 text-brand-grey-600 hover:bg-brand-grey-200 border border-brand-grey-200'}`}>
            <Trash2 size={12} /> {t('admin.trash_btn')}{trashTotal > 0 && ` (${trashTotal})`}
          </button>
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-blue text-white font-semibold hover:bg-brand-blue-700 transition">
            <Plus size={12} /> {t('admin.new_user')}
          </button>
          <button onClick={() => setAddingAdmin(true)} className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-blue-600 text-white font-semibold hover:bg-brand-blue-700 transition">
            <ShieldCheck size={12} /> {t('admin.add_admin')}
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
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => bulk('enable')} disabled={bulkBusy || selected.size === 0}
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-semibold hover:bg-green-100 disabled:opacity-40 transition">
            <CheckCircle2 size={11} /> {t('admin.bulk_enable')}
          </button>
          <button onClick={() => bulk('disable')} disabled={bulkBusy || selected.size === 0}
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-semibold hover:bg-orange-100 disabled:opacity-40 transition">
            <Ban size={11} /> {t('admin.bulk_suspend')}
          </button>
          <button onClick={() => bulk('delete')} disabled={bulkBusy || selected.size === 0}
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-red-50 text-brand-red border border-brand-red-200 font-semibold hover:bg-brand-red-100 disabled:opacity-40 transition">
            <Trash2 size={11} /> {t('admin.bulk_delete')}
          </button>
        </div>
      </div>

      {message && <div className="bg-brand-blue-50 text-brand-blue text-sm rounded-lg p-3">{message}</div>}

      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input className="input flex-1 min-w-0" placeholder={t('admin.search_ph')}
            value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input sm:w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t('admin.all_depts')}</option>
            <option value="health">{t('admin.health')}</option>
            <option value="education">{t('admin.education')}</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select className="input sm:flex-1" value={regionFilter} onChange={(e) => setRegionFilter(Number(e.target.value) || '')}>
            <option value="">Mkoa wote</option>
            {regions.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select className="input sm:flex-1" value={districtFilter} onChange={(e) => setDistrictFilter(Number(e.target.value) || '')} disabled={!regionFilter}>
            <option value="">Wilaya zote</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="input sm:flex-1" value={facilityFilter} onChange={(e) => setFacilityFilter(e.target.value)} disabled={!districtFilter}>
            <option value="">Vituo vyote</option>
            {facilities.map((f: any) => <option key={f.id || f.code} value={String(f.id || f.code)}>{f.name}</option>)}
          </select>
          {allSubjects.length > 0 && (
            <select className="input sm:flex-1" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="">Masomo yote</option>
              {allSubjects.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* ═══ SENTESI CLEAR — nani yupo mkoani ═══ */}
      <div className="rounded-xl bg-brand-blue-50 dark:bg-brand-blue-950/30 border border-brand-blue-200 dark:border-brand-blue-800 px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-brand-blue-800 dark:text-brand-blue-200">
            {data?.total ?? 0} {category === 'health' ? 'wafanyakazi' : category === 'education' ? 'walimu' : 'watumiaji'}
          </span>
          {regionFilter ? (
            <>
              <span className="text-sm text-brand-grey-600 dark:text-brand-grey-300">kutoka mkoa wa</span>
              <span className="text-sm font-extrabold text-brand-grey-900 dark:text-white">
                {regions.find((r: any) => String(r.id) === String(regionFilter))?.name || '—'}
              </span>
              {category && (
                <span className="text-sm text-brand-grey-600 dark:text-brand-grey-300">
                  {category === 'health' ? 'wa idara ya Afya' : 'wa idara ya Elimu'}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-brand-grey-600 dark:text-brand-grey-300">kwenye mfumo wote</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-grey-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-brand-grey-50 text-xs text-brand-grey-500">
            <tr>
              <th className="px-3 py-2 text-center w-8">#</th>
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
            {pageItems.map((u: any, i: number) => (
              <tr key={u._id} className={`hover:bg-brand-grey-50 ${u.status === 'disabled' ? 'opacity-50' : ''}`}>
                <td className="px-3 py-2 text-center text-xs font-bold text-brand-grey-400">{(safePage - 1) * PAGE_SIZE + i + 1}</td>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selected.has(u._id)}
                    onChange={() => toggleOne(u._id)} disabled={u.is_admin}
                    className="w-4 h-4 accent-brand-blue" aria-label={t('admin.col_name')} />
                </td>
                <td className="px-3 py-2 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    {u.full_name}
                    {u.is_admin && <ShieldCheck size={13} className="text-brand-blue flex-shrink-0" />}
                  </span>
                </td>
                <td className="px-3 py-2 text-brand-blue">{u.phone_primary}</td>
                <td className="px-3 py-2 text-xs"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-blue-50 text-brand-blue-700 font-semibold"><BookOpen size={10} />{u.cadre_code}</span></td>
                <td className="px-3 py-2 text-xs">{u.current_station?.region_name}</td>
                <td className="px-3 py-2">
                  {u.status === 'disabled'
                    ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-brand-red-50 text-brand-red font-semibold"><UserX size={11} /> {t('admin.status_disabled')}</span>
                    : <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-50 text-green-600 font-semibold"><UserCheck size={11} /> {t('admin.status_active')}</span>}
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => toggleAdmin(u)}
                    className={`text-xs px-2 py-0.5 rounded ${u.is_admin ? 'bg-brand-gold-100 text-brand-gold-600' : 'bg-brand-grey-100 text-brand-grey-500'}`}>
                    {u.is_admin ? t('admin.admin_role') : t('admin.user_role')}
                  </button>
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button onClick={() => setViewing(u)} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-brand-grey-100 text-brand-grey-600 font-medium hover:bg-brand-grey-200 transition">
                    <Eye size={11} /> {t('action.view')}
                  </button>
                  <button onClick={() => setEditing(u)} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-brand-blue-50 text-brand-blue-600 font-medium hover:bg-brand-blue-100 transition">
                    <Pencil size={11} /> {t('action.edit')}
                  </button>
                  {!u.is_admin && (
                    <button onClick={() => toggleSuspend(u)} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium hover:bg-orange-100 transition">
                      {u.status === 'disabled' ? <><CheckCircle2 size={11} /> {t('admin.unsuspend_btn')}</> : <><Ban size={11} /> {t('admin.suspend_btn')}</>}
                    </button>
                  )}
                  {!u.is_admin && !u.is_verified && (
                    <button onClick={() => toggleContact(u)} className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium transition ${u.contact_enabled ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-brand-grey-100 text-brand-grey-600 hover:bg-brand-grey-200'}`}>
                      <Phone size={11} /> {u.contact_enabled ? 'Ame-Ruhusu' : 'Ruhusu Piga'}
                    </button>
                  )}
                  {!u.is_admin && (
                    <button onClick={() => del(u)} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-brand-red-50 text-brand-red font-medium hover:bg-brand-red-100 transition">
                      <Trash2 size={11} /> {t('action.delete')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <button type="button" disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            className="min-w-[44px] min-h-[44px] px-3 rounded-xl border border-brand-grey-200 text-sm font-semibold text-brand-grey-700 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition active:scale-95">
            ← Rudi
          </button>
          <span className="text-sm font-bold text-brand-grey-500 px-2">
            {safePage} / {totalPages}
          </span>
          <button type="button" disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            className="min-w-[44px] min-h-[44px] px-3 rounded-xl border border-brand-grey-200 text-sm font-semibold text-brand-grey-700 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition active:scale-95">
            Endelea →
          </button>
        </div>
      )}

      {/* ═══ TRASH — akaunti zilizofutwa (zinaweza kurudishwa au kufutwa KABISA) ═══ */}
      {showTrash && (
        <div className="bg-white rounded-2xl border border-brand-red/30 overflow-hidden">
          <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 bg-brand-red-50/60 border-b border-brand-red/20">
            <h2 className="font-bold text-brand-grey-900 flex items-center gap-2">
              <Trash2 size={18} className="text-brand-red" /> {t('admin.trash_title')} <span className="text-xs font-semibold text-brand-grey-500">({trashTotal})</span>
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={purgeAllTrash} disabled={trash.length === 0}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-red text-white font-semibold hover:bg-brand-red-600 transition disabled:opacity-40">
                <Trash2 size={11} /> {t('admin.trash_purge_all')}
              </button>
              <button onClick={() => setShowTrash(false)} className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-grey-100 text-brand-grey-600 border border-brand-grey-200 font-semibold hover:bg-brand-grey-200 transition">
                <XCircle size={11} /> {t('admin.cancel')}
              </button>
            </div>
          </div>
          {trash.length === 0 ? (
            <div className="p-8 text-center">
              <Trash2 size={32} className="mx-auto text-brand-grey-300 mb-2" />
              <p className="text-sm text-brand-grey-500 font-medium">{t('admin.trash_empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-brand-grey-50 text-xs text-brand-grey-500">
                  <tr>
                    <th className="px-3 py-2 text-left w-8 text-center">#</th>
                    <th className="px-3 py-2 text-left">{t('admin.col_name')}</th>
                    <th className="px-3 py-2 text-left">{t('admin.col_phone')}</th>
                    <th className="px-3 py-2 text-left">{t('admin.col_cadre')}</th>
                    <th className="px-3 py-2 text-left">{t('admin.col_region_short')}</th>
                    <th className="px-3 py-2 text-right">{t('admin.col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-grey-100">
                  {trash.map((u: any, i: number) => (
                    <tr key={u._id} className="hover:bg-brand-grey-50">
                      <td className="px-3 py-2 text-center text-xs font-bold text-brand-grey-400">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{u.full_name}</td>
                      <td className="px-3 py-2 text-brand-blue text-xs">{u.phone_primary || '—'}</td>
                      <td className="px-3 py-2 text-xs"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-grey-100 text-brand-grey-600 font-semibold"><BookOpen size={10} />{u.cadre_code || '—'}</span></td>
                      <td className="px-3 py-2 text-xs">{u.current_station?.region_name || '—'}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <button onClick={() => restore(u)}
                          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-semibold border border-green-200 hover:bg-green-100 transition">
                          <RotateCcw size={11} /> {t('admin.trash_restore')}
                        </button>
                        <button onClick={() => purge(u)}
                          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-red-50 text-brand-red font-semibold border border-brand-red-200 hover:bg-brand-red-100 transition ml-1.5">
                          <Trash2 size={11} /> {t('admin.trash_permanent')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {viewing && (
        <ViewUserModal user={viewing} onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); }} />
      )}
      {editing && (
        <EditUserModal user={editing} onClose={() => setEditing(null)} onSaved={(updated: any) => {
          // PAPO HAPO — mstari wa mtumiaji unasasishwa bila refetch (event-driven).
          setData((prev: any) => prev ? { ...prev, users: prev.users.map((x: any) => x._id === updated._id ? { ...x, ...updated } : x) } : prev);
          setEditing(null); setMessage(t('admin.user_updated')); setTimeout(() => setMessage(null), 3000);
        }} />
      )}
      {creating && (
        <CreateUserModal onClose={() => setCreating(false)} onCreated={(created: any) => {
          // PAPO HAPO — mtumiaji mpya anaongezwa juu bila refetch (event-driven).
          setData((prev: any) => prev ? { ...prev, users: [{ ...created }, ...prev.users], total: (prev.total || prev.users.length) + 1 } : prev);
          setCreating(false); setMessage(t('admin.user_created')); setTimeout(() => setMessage(null), 3000);
        }} />
      )}
      {addingAdmin && (
        <AddAdminModal onClose={() => setAddingAdmin(false)} onCreated={(created: any) => {
          // PAPO HAPO — admin mpya anaongezwa juu bila refetch (event-driven).
          setData((prev: any) => prev ? { ...prev, users: [{ ...created }, ...prev.users], total: (prev.total || prev.users.length) + 1 } : prev);
          setAddingAdmin(false); setMessage(t('admin.admin_created')); setTimeout(() => setMessage(null), 3000);
        }} />
      )}
    </div>
  );

  async function restore(u: any) {
    try {
      await adminTrashRestore(u._id);
      setMessage(`${t('admin.trash_restored')} ${u.full_name}`);
      setTrash((prev) => prev.filter((x: any) => x._id !== u._id));
      setTrashTotal((n) => Math.max(0, n - 1));
      load(true);
    } catch (e: any) {
      setMessage(e?.response?.data?.detail || 'Imeshindwa kumrudisha mtumiaji');
    }
    setTimeout(() => setMessage(null), 4000);
  }

  async function purge(u: any) {
    const ok = await askConfirm({
      title: t('admin.trash_permanent_confirm'),
      message: `${u.full_name} — hii haiwezi kugeuzwa!`,
      danger: true,
    });
    if (!ok) return;
    await adminTrashPurge(u._id);
    setMessage(`${t('admin.trash_purged')} ${u.full_name}`);
    setTrash((prev) => prev.filter((x: any) => x._id !== u._id));
    setTrashTotal((n) => Math.max(0, n - 1));
    setTimeout(() => setMessage(null), 3000);
  }

  async function purgeAllTrash() {
    const ok = await askConfirm({
      title: `${t('admin.trash_purge_all_confirm')} (${trash.length})`,
      danger: true,
    });
    if (!ok) return;
    const r = await adminTrashPurgeBulk(trash.map((u) => u._id));
    setMessage(`${t('admin.trash_purged')} ${r.purged} ${t('admin.users')}`);
    setTrash([]);
    setTrashTotal(0);
    setTimeout(() => setMessage(null), 3000);
  }
}

/** Subject picker — inachagua masomo kwa kiwango cha kada (Msingi/Sekondari). */
function SubjectPicker({ cadreCode, value, onChange, cadres }: {
  cadreCode: string; value: string[];
  onChange: (v: string[]) => void; cadres: Cadre[];
}) {
  const t = useT();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const cadre = cadres.find((c) => c.code === cadreCode);
  // Kada yenye level (Primary/Secondary) = ya ualimu → ina masomo.
  const level = cadre?.level;
  // REAL-TIME: admin akibadilisha masomo (Data Management) → picker hii
  // inajirefresh PAPO HAPO bila refresh ya page (event-driven).
  const dv = useDataVersion();

  useEffect(() => {
    if (level) getSubjects(level as 'Primary' | 'Secondary').then(setSubjects).catch(() => setSubjects([]));
  }, [level, dv]);

  if (!level) return null;

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

/** View User — modal ya kuona TAARIFA ZOTE za mtumiaji (kisomi) +
 *  WALE ANAOWAONA kwenye dashboard yake (matches) + ONA DASHBOARD. */
function ViewUserModal({ user, onClose, onEdit }: any) {
  const t = useT();
  const st = user.current_station || {};
  const dests = user.desired_destinations || [];
  const [matches, setMatches] = useState<any[] | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  useEffect(() => {
    if (user.is_admin) return;
    let alive = true;
    adminUserMatches(user._id).then((d) => { if (alive) setMatches(d.matches || []); }).catch(() => {});
    return () => { alive = false; };
  }, [user._id, user.is_admin]);
  // Load mikoa yote mara moja modal inapofunguka

  const row = (label: string, val: React.ReactNode) => (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-brand-grey-100 last:border-0">
      <span className="text-xs font-semibold text-brand-grey-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-brand-grey-900 text-right">{val || '—'}</span>
    </div>
  );
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 space-y-3 my-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-bold flex items-center gap-2"><Eye size={20} /> {t('admin.view_title')}</h2>
          <button onClick={onClose} className="text-brand-grey-400 hover:text-brand-grey-700 text-lg px-1">✕</button>
        </div>
        <div className="bg-brand-grey-50 rounded-xl p-3 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-lg">
            {user.full_name?.slice(0, 1).toUpperCase()}
          </div>
          <div className="font-bold text-brand-grey-900 mt-1.5 flex items-center justify-center gap-1.5">
            {user.full_name}
            {user.is_admin && <ShieldCheck size={16} className="text-brand-blue" />}
          </div>
          {!user.is_admin && (
            <div className="text-xs text-brand-grey-500">{user.cadre_display || user.cadre_code || '—'}</div>
          )}
        </div>
        <div className="rounded-xl border border-brand-grey-100 p-3 divide-y divide-brand-grey-100">
          {row(t('admin.col_phone'), <span className="text-brand-blue font-semibold">{user.phone_primary}</span>)}
          {row('Password', (
            <div className="flex flex-col items-end gap-0.5">
              {user.has_password ? (
                <><span className="text-green-600 font-semibold text-xs flex items-center gap-1"><CheckCircle2 size={12} /> Imewekwa</span>
                <span className="text-[9px] font-mono text-brand-grey-400 max-w-[200px] truncate" title={user.password_hash}>{user.password_hash?.slice(0, 28)}...</span></>
              ) : (
                <span className="text-brand-red font-semibold text-xs flex items-center gap-1"><XCircle size={12} /> Haijawekwa</span>
              )}
            </div>
          ))}
          {user.phone_alt && row('WhatsApp', (
            <a href={`https://wa.me/${user.phone_alt.replace(/\D/g, '').replace(/^0/, '255')}`}
              target="_blank" rel="noreferrer"
              className="text-green-600 font-semibold hover:underline inline-flex items-center gap-1">
              {user.phone_alt}
            </a>
          ))}
          {user.email && row(t('admin.email'), user.email)}
          {/* ADMIN hana IDARA wala SHULE — jina, email na simu tu. Haya ya
              chini (idara/kada/masomo/mkoa/wilaya/kituo/destinations) ni ya
              watumiaji wengine (walimu/madaktari) pekee. */}
          {!user.is_admin && row(t('admin.department'), user.category)}
          {!user.is_admin && row(t('admin.cadre'), user.cadre_code)}
          {!user.is_admin && row(t('label.subjects'), (user.subjects || []).length ? user.subjects.join(', ') : '—')}
          {!user.is_admin && row(t('admin.region'), st.region_name)}
          {!user.is_admin && row(t('admin.district'), st.district_name)}
          {!user.is_admin && row(t('admin.facility'), st.facility_name)}
          {!user.is_admin && row(t('admin.destinations'), dests.length
            ? dests.map((d: any) => [d.district_name, d.region_name].filter(Boolean).join(', ')).join(' ; ')
            : '—')}
          {row(t('admin.status'),
            <span className={`inline-flex items-center gap-1 ${user.status === 'disabled'
              ? 'text-brand-red font-semibold' : 'text-green-600 font-semibold'}`}>
              {user.status === 'disabled' ? <><UserX size={13} /> {t('admin.status_disabled')}</> : <><UserCheck size={13} /> {t('admin.status_active')}</>}
            </span>)}
          {row(t('admin.verified'), user.is_verified ? <span className="text-green-600 font-semibold"><CheckCircle2 size={13} className="inline" /> {t('admin.verified')}</span> : <span className="text-brand-grey-500"><XCircle size={13} className="inline" /> {t('admin.not_verified')}</span>)}
          {row(t('admin.role'), user.is_admin ? <span className="text-brand-blue font-semibold"><ShieldCheck size={13} className="inline" /> {t('admin.admin_role')}</span> : t('admin.user_role'))}
          {!user.is_admin && row('Contact', user.contact_enabled ? <span className="text-green-600 font-semibold"><CheckCircle2 size={13} className="inline" /> Ruhusiwa kupiga</span> : <span className="text-brand-grey-500"><Ban size={13} className="inline" /> Hajaruhusiwa</span>)}
          {row(t('admin.created_at'), conversationTime(user.created_at))}
        </div>

        {/* WALE ANAOWAONA KWENYE DASHBOARD YAKE (matches) — ndiyo maana ya View */}
        {!user.is_admin && (
          <div className="rounded-xl border border-brand-grey-100 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-brand-grey-900 flex items-center gap-1.5"><Users size={14} /> {t('admin.view_matches_title')}</h3>
              {matches && <span className="text-[11px] font-bold text-brand-blue">{matches.length}</span>}
            </div>
            {matches === null ? (
              <div className="text-xs text-brand-grey-400 py-2">Inapakia...</div>
            ) : matches.length === 0 ? (
              <div className="text-xs text-brand-grey-400 py-2">{t('msg.no_data')}</div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {matches.map((m: any) => (
                  <div key={m.user_id} className="flex items-center justify-between gap-2 py-1.5 border-b border-brand-grey-100 last:border-0">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-brand-grey-900 truncate">
                        {m.full_name} {m.online && <span className="text-[10px] font-bold text-green-500">● LIVE</span>}
                      </div>
                      <div className="text-[11px] text-brand-grey-500 truncate">
                        {m.cadre_display || m.cadre_code} · {[m.district_name, m.region_name].filter(Boolean).join(', ') || '—'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold text-brand-blue">{m.score}%</div>
                      <a href={`tel:${m.phone_primary}`} className="text-[11px] text-brand-grey-600 hover:underline">
                        {m.phone_primary}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



        <div className="flex gap-2 pt-3 border-t flex-wrap">
          <button onClick={onClose} className="btn-outline px-5">{t('admin.cancel')}</button>
          {!user.is_admin && (
            <button onClick={async () => {
              setLoggingIn(true);
              try {
                const r = await adminLoginAsUser(user._id);
                if (r?.token) {
                  // Weka token ya mtumiaji huyu na umpeleke dashboard
                  localStorage.setItem('kv_auth', JSON.stringify({ state: { token: r.token, user: r.user } }));
                  window.location.href = '/dashboard';
                }
              } catch (e: any) {
                alert(e?.response?.data?.detail || 'Imeshindwa');
              } finally { setLoggingIn(false); }
            }} disabled={loggingIn}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-gold text-white text-sm font-semibold hover:bg-brand-gold-600 transition disabled:opacity-40">
              {loggingIn ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
              Ingia kama {user.full_name?.split(' ')[0]}
            </button>
          )}
          <button onClick={onEdit} className="btn-primary px-5 flex items-center gap-1.5"><Pencil size={14} /> {t('action.edit')}</button>
        </div>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSaved }: any) {
  const t = useT();
  const [full_name, setName] = useState(user.full_name);
  const [phone_primary, setPhonePrimary] = useState(user.phone_primary || '');
  const [phone_alt, setPhoneAlt] = useState(user.phone_alt || '');
  const [email, setEmail] = useState(user.email || '');
  const [category, setCategory] = useState<string>(user.category || 'health');
  const [cadre_code, setCadreCode] = useState<string>(user.cadre_code || '');
  const [subjects, setSubjects] = useState<string[]>(user.subjects || []);
  const [status, setStatus] = useState(user.status || 'active');
  const [is_verified, setVerified] = useState(!!user.is_verified);
  const [is_admin, setAdmin] = useState(!!user.is_admin);
  const [new_password, setNewPassword] = useState('');
  const [cadres, setCadres] = useState<Cadre[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  // Kituo cha sasa + destinations — admin anaweza kubadilisha TAARIFA ZOTE
  // za mtumiaji (real-time: mtumiaji anaona mabadiliko papo hapo kwenye WS).
  const st = user.current_station || {};
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [region_id, setRegionId] = useState<number | ''>(st.region_id || '');
  const [district_id, setDistrictId] = useState<number | ''>(st.district_id || '');
  const [facility_id, setFacilityId] = useState<string | ''>(String(st.facility_id || ''));
  const [dests, setDests] = useState<any[]>((user.desired_destinations || []).map((d: any) => ({
    region_id: d.region_id || '', district_id: d.district_id || '',
  })));
  // REAL-TIME: admin akibadilisha data (masomo/kada/mikoa) → form inajirefresh
  // PAPO HAPO bila refresh ya page (event-driven).
  const dv = useDataVersion();

  useEffect(() => { getDepartments().then(setDepartments).catch(() => {}); }, [dv]);
  useEffect(() => { getCadres(category).then(setCadres).catch(() => {}); }, [category, dv]);
  useEffect(() => { getRegions().then(setRegions).catch(() => {}); }, [dv]);
  useEffect(() => {
    if (region_id) {
      getDistricts(Number(region_id)).then(setDistricts).catch(() => setDistricts([]));
    } else {
      setDistricts([]);
    }
  }, [region_id]);
  useEffect(() => {
    if (district_id) {
      getFacilities(Number(district_id), (category as any) || 'health').then(setFacilities).catch(() => setFacilities([]));
    } else {
      setFacilities([]);
    }
  }, [district_id, category]);

  function updateDest(i: number, field: 'region_id' | 'district_id', v: number | '') {
    const copy = dests.map((d) => ({ ...d }));
    copy[i][field] = v;
    if (field === 'region_id') copy[i].district_id = '';
    setDests(copy);
  }

  async function save() {
    setSaving(true);
    try {
      const changes: any = {
        full_name, phone_primary: phone_primary || undefined,
        phone_alt: phone_alt || null, category, cadre_code,
        subjects: subjects.length ? subjects : [],
        status, is_verified, is_admin,
      };
      if (email) changes.email = email;
      if (new_password) changes.new_password = new_password;
      // Kituo + destinations ikiwa zimebadilishwa (zina jina pia kwa matching).
      if (region_id) {
        const region = regions.find((r) => r.id === Number(region_id));
        const district = districts.find((d) => d.id === Number(district_id));
        const facility = facilities.find((f: any) => String(f.id || f.code) === facility_id);
        changes.current_station = {
          region_id: Number(region_id), region_name: region?.name || st.region_name || '',
          district_id: district ? Number(district.id) : null, district_name: district?.name || null,
          facility_id: facility ? String(facility.id || facility.code) : null, facility_name: facility?.name || null,
        };
      }
      const validDests = dests.filter((d) => d.region_id !== '');
      if (validDests.length) {
        changes.desired_destinations = validDests.map((d) => {
          const r = regions.find((x) => x.id === Number(d.region_id));
          const dd = districts.find((x) => x.id === Number(d.district_id));
          return {
            region_id: Number(d.region_id), region_name: r?.name || '',
            district_id: dd ? Number(dd.id) : null, district_name: dd?.name || null,
          };
        });
      }
      await adminUpdateUser(user._id, changes);
      onSaved({ ...user, ...changes, phone_alt: changes.phone_alt || user.phone_alt || null });
    } catch (e: any) {
      alert(e?.response?.data?.detail || `${t('admin.failed')} save`);
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-3 my-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold flex items-center gap-2"><Pencil size={18} /> {t('admin.edit_title')}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">{t('admin.col_name')}</label><input className="input" value={full_name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="col-span-2"><label className="label">{t('admin.phone')}</label><input className="input" value={phone_primary} onChange={(e) => setPhonePrimary(e.target.value)} placeholder="0712345678" /></div>
          {user.is_admin && (
            <div className="col-span-2"><label className="label">{t('admin.email')}</label><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@mfano.co.tz" /></div>
          )}
          <div><label className="label">{t('admin.phone')} WhatsApp</label><input className="input" value={phone_alt} onChange={(e) => setPhoneAlt(e.target.value)} /></div>
          <div><label className="label">{t('admin.status')}</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">{t('admin.status_active')}</option>
              <option value="inactive">{t('admin.status_inactive')}</option>
              <option value="matched">{t('admin.status_matched')}</option>
              <option value="disabled">{t('admin.status_disabled')}</option>
            </select>
          </div>
          <div><label className="label">{t('admin.new_password')}</label><input type="password" className="input" value={new_password} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('admin.leave_blank')} /></div>

          {/* ADMIN hana IDARA wala SHULE — fields za kada/masomo/kituo/
              destinations ni za WATUMIAJI WENGINE pekee (walimu/madaktari).
              Ikiwa mtu anakuwa admin (checkbox), tupa taarifa za shule. */}
          {!is_admin && (
            <>
              <div><label className="label">{t('admin.department')}</label>
                <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); setCadreCode(''); }}>
                  {departments.length === 0 && <option value="health">{t('admin.health')}</option>}
                  {departments.map((d) => (
                    <option key={d.code} value={d.code}>{d.icon ? `${d.icon} ` : ''}{d.name}</option>
                  ))}
                </select>
              </div>
              <div><label className="label">{t('admin.cadre')}</label>
                <select className="input" value={cadre_code} onChange={(e) => setCadreCode(e.target.value)}>
                  <option value="">--</option>
                  {cadres.map((c) => <option key={c.code} value={c.code}>{c.display_name}</option>)}
                </select>
              </div>
              <SubjectPicker cadreCode={cadre_code} value={subjects} onChange={setSubjects} cadres={cadres} />

              {/* Kituo cha sasa — admin anaweza kubadilisha (real-time matching) */}
              <div><label className="label">{t('admin.region')}</label>
                <select className="input" value={region_id} onChange={(e) => { setRegionId(Number(e.target.value) || ''); setDistrictId(''); setFacilityId(''); }}>
                  <option value="">--</option>{regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div><label className="label">{t('admin.district')}</label>
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
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={is_verified} onChange={(e) => setVerified(e.target.checked)} /> {t('admin.verified')}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={is_admin} onChange={(e) => setAdmin(e.target.checked)} /> {t('admin.admin_ck')}</label>
        </div>
        <div className="flex gap-2 pt-3 border-t">
          <button onClick={onClose} className="btn-outline px-5">{t('admin.cancel')}</button>
          <button onClick={save} disabled={saving} className="btn-primary px-5">{saving ? '...' : t('admin.save')}</button>
        </div>
      </div>
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }: any) {
  const t = useT();
  const [full_name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone_alt, setPhoneAlt] = useState('');
  const [password, setPassword] = useState('changeme123');
  const [category, setCategory] = useState<string>('health');
  const [cadre_code, setCadre] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [cadres, setCadres] = useState<Cadre[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
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
  // REAL-TIME: admin akibadilisha data (masomo/kada/mikoa) → form inajirefresh
  // PAPO HAPO bila refresh ya page (event-driven).
  const dv = useDataVersion();

  useEffect(() => { getRegions().then(setRegions).catch(() => {}); }, [dv]);
  useEffect(() => { getDepartments().then(setDepartments).catch(() => {}); }, [dv]);
  useEffect(() => { getCadres(category).then(setCadres).catch(() => {}); }, [category, dv]);
  useEffect(() => {
    if (region_id) {
      setDistricts([]); setDistrictId(''); setFacilityId('');
      getDistricts(Number(region_id)).then(setDistricts).catch(() => setDistricts([]));
    } else {
      setDistricts([]);
    }
  }, [region_id]);
  useEffect(() => {
    if (district_id) {
      setFacilities([]); setFacilityId('');
      getFacilities(Number(district_id), (category as 'health' | 'education') || 'health').then(setFacilities).catch(() => setFacilities([]));
    } else {
      setFacilities([]);
    }
  }, [district_id, category]);

  function updateDest(i: number, field: 'region_id' | 'district_id', v: number | '') {
    const copy = dests.map((d) => ({ ...d }));
    copy[i][field] = v;
    if (field === 'region_id') copy[i].district_id = '';
    setDests(copy);
  }

  async function submit() {
    setError(null); setSaving(true);
    try {
      const region = regions.find((r) => r.id === Number(region_id));
      const district = districts.find((d) => d.id === Number(district_id));
      const facility = facilities.find((f: any) => String(f.id || f.code) === facility_id);
      const desired_destinations = dests
        .filter((d) => d.region_id !== '')
        .map((d) => {
          const r = regions.find((x) => x.id === Number(d.region_id));
          const dd = districts.find((x) => x.id === Number(d.district_id));
          return {
            region_id: r?.id ?? 0, region_name: r?.name ?? '',
            district_id: dd?.id ?? null, district_name: dd?.name ?? null,
          };
        });
      const station: any = region ? {
        region_id: region.id, region_name: region.name,
        district_id: district?.id ?? 0, district_name: district?.name ?? '',
        facility_id: facility ? String(facility.id || facility.code) : null,
        facility_name: facility?.name ?? null,
      } : null;
      await adminCreateUser({
        full_name, phone_primary: phone, phone_alt: phone_alt || undefined, password,
        category, cadre_code, subjects,
        current_station: station,
        desired_destinations: desired_destinations.length ? desired_destinations : undefined,
        is_admin, status,
      });
      // Fetch real user with _id
      let createdUser: any = null;
      try {
        const list = await adminUsers({ q: phone, limit: 5 });
        createdUser = list.users?.find((u: any) => u.phone_primary === phone);
      } catch {}
      onCreated({
        ...(createdUser || {}),
        _id: createdUser?._id || 'new-' + Date.now(),
        full_name, phone_primary: phone, category, cadre_code, subjects,
        is_admin: !!is_admin, status: status || 'active',
        current_station: station,
      });
    } catch (e: any) {
      setError(e?.response?.data?.detail || t('admin.failed'));
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 space-y-3 my-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold flex items-center gap-2"><Plus size={18} /> {t('admin.create_title')}</h2>
        {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-2">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">{t('admin.full_name')} *</label><input className="input" value={full_name} onChange={(e) => setName(e.target.value)} placeholder="Juma Kiswili" /></div>
          <div><label className="label">{t('admin.phone')} *</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" /></div>
          <div><label className="label">{t('admin.phone')} WhatsApp</label><input className="input" value={phone_alt} onChange={(e) => setPhoneAlt(e.target.value)} placeholder="0755666777" /></div>
          <div><label className="label">{t('admin.password')} *</label><input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div><label className="label">{t('admin.department')}</label>
            <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); setCadre(''); }}>
              {departments.length === 0 && <option value="health">{t('admin.health')}</option>}
              {departments.map((d) => (
                <option key={d.code} value={d.code}>{d.icon ? `${d.icon} ` : ''}{d.name}</option>
              ))}
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
              <option value="disabled">{t('admin.status_disabled')}</option>
            </select>
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm py-1">
            <input type="checkbox" checked={is_admin} onChange={(e) => setAdmin(e.target.checked)} /> <ShieldCheck size={14} className="text-brand-blue" /> {t('admin.admin_ck')}
          </label>
          <SubjectPicker cadreCode={cadre_code} value={subjects} onChange={setSubjects} cadres={cadres} />

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
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-3 border-t">
          <button onClick={onClose} className="btn-outline px-5">{t('admin.cancel')}</button>
          <button onClick={submit} disabled={saving || !full_name || !phone || !cadre_code} className="btn-primary px-5">
            {saving ? t('admin.creating') : t('admin.create')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Ongeza ADMIN mpya — ana EMAIL + jina + role (hawapo kwenye idara yoyote).
 *  Anaingia kwa email (sio namba) kama admin wengine. */
function AddAdminModal({ onClose, onCreated }: any) {
  const t = useT();
  const [full_name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('changeme123');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null); setSaving(true);
    try {
      await adminCreateUser({
        full_name, email, phone_primary: phone || undefined, password,
        is_admin: true, status: 'active', is_verified: true,
      });
      // Fetch user halisi (na _id sahihi) ili kuingia kwenye orodha bila refetch.
      let real: any = null;
      try {
        const list = await adminUsers({ q: email || phone, limit: 5 }, true);
        real = list.users.find((u: any) => u.email === email || u.phone_primary === phone);
      } catch {}
      onCreated({
        ...(real || {}),
        _id: real?._id || 'new-admin-' + Date.now(),
        full_name, email, phone_primary: phone || undefined, is_admin: true, status: 'active', is_verified: true,
      });
    } catch (e: any) {
      setError(e?.response?.data?.detail || t('admin.failed'));
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 my-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck size={18} /> {t('admin.add_admin')}</h2>
        <p className="text-xs text-brand-grey-500 leading-relaxed">
          {t('admin.add_admin_hint')}
        </p>
        {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-2">{error}</div>}
        <div className="grid grid-cols-1 gap-3">
          <div><label className="label">{t('admin.full_name')} *</label><input className="input" value={full_name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label">{t('admin.email')} *</label><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@mfano.co.tz" /></div>
          <div><label className="label">{t('admin.phone')} <span className="text-brand-grey-400">({t('msg.optional')})</span></label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" /></div>
          <div><label className="label">{t('admin.password')} *</label><input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        </div>
        <div className="flex gap-2 pt-3 border-t">
          <button onClick={onClose} className="btn-outline px-5">{t('admin.cancel')}</button>
          <button onClick={submit} disabled={saving || !full_name || !email || password.length < 6} className="btn-primary px-5">
            {saving ? t('admin.creating') : t('admin.create')}
          </button>
        </div>
      </div>
    </div>
  );
}
