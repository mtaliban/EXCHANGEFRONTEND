'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { adminEvents, adminEventsExport, adminClearEvents, exportErrorText } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { useT, useI18n } from '@/lib/i18n';
import { parseServerDate } from '@/lib/dates';
import { askConfirm } from '@/components/confirm';
import Spinner from '@/components/Spinner';
import {
  Activity, UserPlus, User, MapPin, Target, Settings, Shield, Trash2,
  Eye, EyeOff, Zap, MessageSquare, Phone, CreditCard, Mail, CheckCircle2,
  Megaphone, Globe, BookOpen, GraduationCap, Map, Database, ChevronLeft,
  ChevronRight, Download, AlertTriangle, Clock, Users, TrendingUp, BarChart3,
} from 'lucide-react';

const TYPES = [
  'user.registered', 'user.profile_updated', 'user.station_changed', 'user.destination_changed',
  'user.prefs_updated', 'user.updated_by_admin', 'user.deleted', 'user.presence',
  'match.found', 'message.sent',
  'call.initiated', 'payment.paid', 'email.verification_requested', 'email.verified',
  'announcement.sent', 'page.viewed',
  'data.subject_added', 'data.subject_updated', 'data.subject_deleted',
  'data.cadre_added', 'data.cadre_updated', 'data.cadre_deleted',
  'data.region_added', 'data.region_updated', 'data.region_deleted',
  'data.district_added', 'data.district_updated', 'data.district_deleted',
];

const TYPE_ICONS: Record<string, any> = {
  'user.registered': UserPlus,
  'user.profile_updated': User,
  'user.station_changed': MapPin,
  'user.destination_changed': Target,
  'user.prefs_updated': Settings,
  'user.updated_by_admin': Shield,
  'user.deleted': Trash2,
  'user.presence': Eye,
  'match.found': Zap,
  'message.sent': MessageSquare,
  'call.initiated': Phone,
  'payment.paid': CreditCard,
  'email.verification_requested': Mail,
  'email.verified': CheckCircle2,
  'announcement.sent': Megaphone,
  'page.viewed': Globe,
  'data.subject_added': BookOpen,
  'data.subject_updated': BookOpen,
  'data.subject_deleted': BookOpen,
  'data.cadre_added': GraduationCap,
  'data.cadre_updated': GraduationCap,
  'data.cadre_deleted': GraduationCap,
  'data.region_added': Map,
  'data.region_updated': Map,
  'data.region_deleted': Map,
  'data.district_added': MapPin,
  'data.district_updated': MapPin,
  'data.district_deleted': MapPin,
};

const TYPE_LABELS: Record<string, string> = {
  'user.registered': 'Usajili mpya',
  'user.profile_updated': 'Taarifa zilibadilishwa',
  'user.station_changed': 'Kituo kilibadilishwa',
  'user.destination_changed': 'Lengo libadilishwa',
  'user.prefs_updated': 'Mipangilio ibadilishwa',
  'user.updated_by_admin': 'Imebadilishwa na Admin',
  'user.deleted': 'Mtumiaji amefutwa',
  'user.presence': 'Aliingia / Aliondoka',
  'match.found': 'Mechi imepatikana',
  'message.sent': 'Ujumbe ulitumwa',
  'call.initiated': 'Simu iliitwa',
  'payment.paid': 'Malipo yalilipwa',
  'email.verification_requested': 'Email verification iko njiani',
  'email.verified': 'Email imethibitishwa',
  'announcement.sent': 'Tangazo lilitumwa',
  'page.viewed': 'Ukurasa ulitembelewa',
  'data.subject_added': 'Somo limeongezwa',
  'data.subject_updated': 'Somo limehaririwa',
  'data.subject_deleted': 'Somo limefutwa',
  'data.cadre_added': 'Kada imeongezwa',
  'data.cadre_updated': 'Kada imehaririwa',
  'data.cadre_deleted': 'Kada imefutwa',
  'data.region_added': 'Mkoa umeongezwa',
  'data.region_updated': 'Mkoa umehaririwa',
  'data.region_deleted': 'Mkoa umefutwa',
  'data.district_added': 'Wilaya imeongezwa',
  'data.district_updated': 'Wilaya imehaririwa',
  'data.district_deleted': 'Wilaya imefutwa',
};

const TYPE_LABELS_EN: Record<string, string> = {
  'user.registered': 'New registration',
  'user.profile_updated': 'Profile updated',
  'user.station_changed': 'Station changed',
  'user.destination_changed': 'Destination changed',
  'user.prefs_updated': 'Preferences updated',
  'user.updated_by_admin': 'Updated by Admin',
  'user.deleted': 'User deleted',
  'user.presence': 'Online / Offline',
  'match.found': 'Match found',
  'message.sent': 'Message sent',
  'call.initiated': 'Call initiated',
  'payment.paid': 'Payment paid',
  'email.verification_requested': 'Email verification requested',
  'email.verified': 'Email verified',
  'announcement.sent': 'Announcement sent',
  'page.viewed': 'Page viewed',
  'data.subject_added': 'Subject added',
  'data.subject_updated': 'Subject updated',
  'data.subject_deleted': 'Subject deleted',
  'data.cadre_added': 'Cadre added',
  'data.cadre_updated': 'Cadre updated',
  'data.cadre_deleted': 'Cadre deleted',
  'data.region_added': 'Region added',
  'data.region_updated': 'Region updated',
  'data.region_deleted': 'Region deleted',
  'data.district_added': 'District added',
  'data.district_updated': 'District updated',
  'data.district_deleted': 'District deleted',
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] || type;
}
function typeLabelEn(type: string): string {
  return TYPE_LABELS_EN[type] || type;
}

const TYPE_COLORS: Record<string, string> = {
  'user.registered': 'bg-blue-50 text-blue-700 border border-blue-200',
  'user.profile_updated': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  'user.station_changed': 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  'user.destination_changed': 'bg-teal-50 text-teal-700 border border-teal-200',
  'user.prefs_updated': 'bg-slate-100 text-slate-700 border border-slate-200',
  'user.updated_by_admin': 'bg-violet-50 text-violet-700 border border-violet-200',
  'user.deleted': 'bg-red-50 text-red-700 border border-red-200',
  'user.presence': 'bg-slate-50 text-slate-600 border border-slate-200',
  'match.found': 'bg-green-50 text-green-700 border border-green-200',
  'message.sent': 'bg-amber-50 text-amber-700 border border-amber-200',
  'call.initiated': 'bg-orange-50 text-orange-700 border border-orange-200',
  'payment.paid': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'email.verification_requested': 'bg-purple-50 text-purple-700 border border-purple-200',
  'email.verified': 'bg-lime-50 text-lime-700 border border-lime-200',
  'announcement.sent': 'bg-pink-50 text-pink-700 border border-pink-200',
  'page.viewed': 'bg-grey-100 text-grey-600 border border-grey-200',
  'data.subject_added': 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200',
  'data.subject_updated': 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200',
  'data.subject_deleted': 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200',
  'data.cadre_added': 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200',
  'data.cadre_updated': 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200',
  'data.cadre_deleted': 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200',
  'data.region_added': 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200',
  'data.region_updated': 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200',
  'data.region_deleted': 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200',
  'data.district_added': 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200',
  'data.district_updated': 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200',
  'data.district_deleted': 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200',
};

function humanize(payload: any, type: string): string {
  if (!payload) return '';
  const name = payload.full_name || payload.user_name || payload.candidate?.full_name || '';
  const parts: string[] = [];
  if (name) parts.push(name);
  if (payload.by_name) parts.push(`(na ${payload.by_name})`);
  if (payload.cadre_display) parts.push(`· ${payload.cadre_display}`);
  if (payload.current_station?.region_name) parts.push(`· kutoka ${payload.current_station.district_name || ''} ${payload.current_station.region_name}`.replace(/\s+/g, ' '));
  const dest = payload.desired_destinations?.[0];
  if (dest) parts.push(`· kwenda ${dest.district_name || dest.region_name}`);
  if (payload.region_ids?.length) parts.push(`· mikoa: ${payload.region_ids.join(', ')}`);
  if (type === 'match.found') parts.push('· match');
  if (type === 'message.sent') parts.push('· ujumbe');
  if (type === 'call.initiated') parts.push('· simu');
  if (type === 'payment.paid') parts.push(`· TZS ${payload.amount ?? ''}`);
  if (payload.email) parts.push(`· ${payload.email}`);
  if (payload.kind && payload.item) {
    const item = payload.item;
    const label = item.name || item.code || item.id || '';
    parts.push(`· ${payload.kind}: ${label} ${payload.action}`);
    if (payload.kind === 'district' && item.region_id) parts.push(`(mkoa ${item.region_id})`);
  }
  return parts.join(' ');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}

function useLiveEventsFeed(onEvent: (ev: any) => void) {
  useEffect(() => {
    let aborter: AbortController | null = null;
    let retryTimer: any = null;
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
              try { onEvent(JSON.parse(line.slice(6))); } catch {}
            }
          }
        }
      } catch {}
      if (!stopped) retryTimer = setTimeout(connect, 3000);
    }

    connect();
    return () => {
      stopped = true;
      aborter?.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default function AdminEventsPage() {
  const t = useT();
  const lang = useI18n((s) => s.lang);
  const [data, setData] = useState<any>(null);
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [liveAt, setLiveAt] = useState<number | null>(null);
  const typeRef = useRef(type);
  typeRef.current = type;
  const PAGE_SIZE = 10;

  function flash(text: string, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  }

  useEffect(() => {
    adminEvents(type || undefined, PAGE_SIZE, (page - 1) * PAGE_SIZE, true).then(setData);
  }, [type, page]);

  useLiveEventsFeed((ev) => {
    setLiveAt(Date.now());
    setData((prev: any) => {
      if (!prev || !ev || !ev._id) return prev;
      if (prev.events.some((e: any) => e._id === ev._id)) return prev;
      const currentType = typeRef.current;
      if (currentType && ev.event_type !== currentType) return prev;
      const nextEvents = [ev, ...prev.events].slice(0, PAGE_SIZE * 8);
      return { ...prev, events: nextEvents, total: currentType ? prev.total : prev.total + 1 };
    });
  });

  useEffect(() => {
    if (!liveAt) return;
    const id = setTimeout(() => setLiveAt((prev) => (prev && Date.now() - prev > 10000 ? null : prev)), 10000);
    return () => clearTimeout(id);
  }, [liveAt]);

  if (!data) return <div className="p-10"><Spinner label={t('adminevents.loading')} /></div>;

  async function doExport(fmt: 'pdf' | 'docx') {
    setExporting(fmt);
    try {
      const res = await adminEventsExport(type || undefined, fmt);
      downloadBlob(res.data as Blob, `events_${type || 'all'}_${new Date().toISOString().slice(0, 10)}.${fmt === 'docx' ? 'docx' : 'pdf'}`);
      flash(`${fmt === 'docx' ? 'WORD' : 'PDF'} imepakuliwa — events_${type || 'all'}`);
    } catch (e: any) {
      flash(`Export imeshindikana: ${await exportErrorText(e)}`, false);
    } finally { setExporting(null); }
  }

  async function doClear() {
    if (!(await askConfirm({ title: t('adminevents.clear_confirm'), danger: true }))) return;
    try {
      await adminClearEvents();
      setPage(1);
      adminEvents(type || undefined, PAGE_SIZE, 0, true).then(setData);
      flash(t('adminevents.cleared'));
    } catch { flash('Imeshindikana kufuta logs', false); }
  }

  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900 flex items-center gap-2">
          <Activity size={22} className="text-brand-blue" />
          Event Log
          <span className="text-sm font-semibold text-brand-grey-500">({data.total?.toLocaleString()})</span>
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            liveAt ? 'bg-green-50 text-green-600 border-green-300' : 'bg-brand-grey-50 text-brand-grey-400 border-brand-grey-200'}`}>
            <span className={`w-2 h-2 rounded-full ${liveAt ? 'bg-green-500 animate-pulse' : 'bg-brand-grey-300'}`} />
            {t('adminevents.live')}
          </span>
        </h1>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => doExport('pdf')} disabled={!!exporting}
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-grey-100 text-brand-grey-600 border border-brand-grey-200 font-semibold hover:bg-brand-grey-200 transition disabled:opacity-40">
            <Download size={11} /> {exporting === 'pdf' ? 'Inapakua...' : 'PDF'}
          </button>
          <button onClick={() => doExport('docx')} disabled={!!exporting}
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-grey-100 text-brand-grey-600 border border-brand-grey-200 font-semibold hover:bg-brand-grey-200 transition disabled:opacity-40">
            <Download size={11} /> {exporting === 'docx' ? 'Inapakua...' : 'WORD'}
          </button>
          <button onClick={doClear}
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-red-50 text-brand-red border border-brand-red-200 font-semibold hover:bg-brand-red-100 transition">
            <Trash2 size={11} /> {t('adminevents.clear')}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 text-xs font-semibold rounded-full px-3 py-1.5 ${msg.ok ? 'bg-brand-blue-50 text-brand-blue border border-brand-blue-200' : 'bg-brand-red-50 text-brand-red border border-brand-red-200'}`}>
          {msg.ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
          {msg.text}
        </div>
      )}

      {/* Stats — compact pills */}
      <div className="flex flex-wrap gap-2">
        <div className="inline-flex items-center gap-2 bg-white border border-brand-grey-200 rounded-full px-3 py-1.5">
          <UserPlus size={13} className="text-brand-blue" />
          <span className="text-xs font-bold text-brand-grey-900">{data.stats?.users_today ?? 0}</span>
          <span className="text-[10px] text-brand-grey-500">{t('adminevents.users_today')}</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-white border border-brand-grey-200 rounded-full px-3 py-1.5">
          <Users size={13} className="text-brand-grey-600" />
          <span className="text-xs font-bold text-brand-grey-900">{data.stats?.users_yesterday ?? 0}</span>
          <span className="text-[10px] text-brand-grey-500">{t('adminevents.users_yesterday')}</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-white border border-brand-grey-200 rounded-full px-3 py-1.5">
          <Globe size={13} className="text-brand-orange" />
          <span className="text-xs font-bold text-brand-grey-900">{data.stats?.views_today ?? 0}</span>
          <span className="text-[10px] text-brand-grey-500">{t('adminevents.views_today')}</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-white border border-brand-grey-200 rounded-full px-3 py-1.5">
          <TrendingUp size={13} className="text-brand-blue" />
          <span className="text-xs font-bold text-brand-grey-900">{(data.stats?.top_pages?.[0]?.path || '—').replace(/^\//, '') || '—'}</span>
          <span className="text-[10px] text-brand-grey-500">{t('adminevents.top_pages')}</span>
        </div>
      </div>

      {(data.stats?.top_pages?.length || 0) > 0 && (
        <div className="bg-white rounded-xl border border-brand-grey-200 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-grey-500 mb-1.5">{t('adminevents.popular_pages')}</div>
          <div className="flex flex-wrap gap-1.5">
            {(data.stats?.top_pages || []).map((p: any) => (
              <span key={p.path} className="inline-flex items-center gap-1 text-[11px] font-medium bg-brand-grey-50 border border-brand-grey-200 rounded-full px-2.5 py-1 text-brand-grey-700">
                {p.path.replace(/^\//, '') || '/'} <b className="text-brand-blue">{p.views}</b>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <select className="input w-auto" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">{t('adminevents.all_types')}</option>
          {TYPES.map((tp) => <option key={tp} value={tp}>{lang === 'en' ? typeLabelEn(tp) : typeLabel(tp)}</option>)}
        </select>
        <span className="text-[11px] text-brand-grey-500">{t('adminevents.type')}: <b>{type ? (lang === 'en' ? typeLabelEn(type) : typeLabel(type)) : t('adminevents.all_types')}</b></span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-brand-grey-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead className="bg-brand-grey-50 text-[10px] uppercase tracking-wider font-bold text-brand-grey-500">
            <tr>
              <th className="px-3 py-2 text-center w-8">#</th>
              <th className="px-3 py-2 text-left">{t('adminevents.type')}</th>
              <th className="px-3 py-2 text-left">{t('adminevents.details')}</th>
              <th className="px-3 py-2 text-left">{t('adminevents.time')}</th>
              <th className="px-3 py-2 text-right">{t('admin.col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-grey-100">
            {data.events.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-brand-grey-500">{t('adminevents.empty')}</td>
              </tr>
            )}
            {data.events.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((e: any, i: number) => {
              const isOpen = expanded.has(e._id);
              const color = TYPE_COLORS[e.event_type] || 'bg-brand-grey-50 text-brand-grey-600 border border-brand-grey-200';
              const summary = humanize(e.payload, e.event_type);
              const EventIcon = TYPE_ICONS[e.event_type] || Activity;
              return (
                <Fragment key={e._id}>
                  <tr className="hover:bg-brand-grey-50 align-top">
                    <td className="px-3 py-2.5 text-center text-xs font-bold text-brand-grey-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${color}`}>
                        <EventIcon size={10} />
                        {lang === 'en' ? typeLabelEn(e.event_type) : typeLabel(e.event_type)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 min-w-0 max-w-[340px]">
                      <span className="block text-sm text-brand-grey-800 truncate" title={summary || JSON.stringify(e.payload)}>
                        {summary || JSON.stringify(e.payload).slice(0, 140)}
                      </span>
                      <span className="block text-[11px] text-brand-grey-400 mt-0.5 truncate">{e.topic}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-brand-grey-500 whitespace-nowrap">
                      {(parseServerDate(e.occurred_at) || new Date()).toLocaleString('sw-TZ')}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button onClick={() => setExpanded((prev) => {
                        const next = new Set(prev);
                        if (next.has(e._id)) next.delete(e._id); else next.add(e._id);
                        return next;
                      })} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-brand-grey-100 text-brand-grey-600 font-medium hover:bg-brand-grey-200 transition">
                        {isOpen ? <><EyeOff size={11} /> {t('adminevents.hide')}</> : <><Eye size={11} /> {t('adminevents.show')}</>}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={5} className="px-4 pb-3 -mt-1">
                        <pre className="p-3 rounded-lg bg-brand-grey-50 text-[11px] font-mono text-brand-grey-700 overflow-x-auto whitespace-pre-wrap break-all">
                          {JSON.stringify({ _id: e._id, ...e }, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-brand-grey-200 text-brand-grey-600 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-brand-grey-500 px-2">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-brand-grey-200 text-brand-grey-600 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
