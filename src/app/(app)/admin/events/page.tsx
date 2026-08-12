'use client';

import { Fragment, useEffect, useState } from 'react';
import { adminEvents, adminEventsExport, adminClearEvents, exportErrorText } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { parseServerDate } from '@/lib/dates';
import Spinner from '@/components/Spinner';

const TYPES = [
  'user.registered', 'user.profile_updated', 'user.station_changed', 'user.destination_changed',
  'user.prefs_updated', 'user.updated_by_admin', 'user.deleted', 'match.found', 'message.sent',
  'call.initiated', 'payment.paid', 'email.verification_requested', 'email.verified',
  'announcement.sent', 'page.viewed',
];

const TYPE_COLORS: Record<string, string> = {
  'user.registered': 'bg-blue-100 text-blue-700',
  'user.profile_updated': 'bg-indigo-100 text-indigo-700',
  'user.station_changed': 'bg-cyan-100 text-cyan-700',
  'user.destination_changed': 'bg-teal-100 text-teal-700',
  'user.prefs_updated': 'bg-slate-200 text-slate-700',
  'user.updated_by_admin': 'bg-violet-100 text-violet-700',
  'user.deleted': 'bg-red-100 text-red-700',
  'match.found': 'bg-green-100 text-green-700',
  'message.sent': 'bg-amber-100 text-amber-700',
  'call.initiated': 'bg-orange-100 text-orange-700',
  'payment.paid': 'bg-emerald-100 text-emerald-700',
  'email.verification_requested': 'bg-purple-100 text-purple-700',
  'email.verified': 'bg-lime-100 text-lime-700',
  'announcement.sent': 'bg-pink-100 text-pink-700',
  'page.viewed': 'bg-grey-200 text-grey-600',
};

function humanize(payload: any, type: string): string {
  if (!payload) return '';
  const name = payload.full_name || payload.user_name || payload.candidate?.full_name || '';
  const parts: string[] = [];
  if (name) parts.push(`👤 ${name}`);
  if (payload.cadre_display) parts.push(`· ${payload.cadre_display}`);
  if (payload.current_station?.region_name) parts.push(`· kutoka ${payload.current_station.district_name || ''} ${payload.current_station.region_name}`.replace(/\s+/g, ' '));
  const dest = payload.desired_destinations?.[0];
  if (dest) parts.push(`· kwenda ${dest.district_name || dest.region_name}`);
  if (payload.region_ids?.length) parts.push(`· mikoa: ${payload.region_ids.join(', ')}`);
  if (type === 'match.found') parts.push('· match ✓');
  if (type === 'message.sent') parts.push('· ujumbe');
  if (type === 'call.initiated') parts.push('· simu');
  if (type === 'payment.paid') parts.push(`· TZS ${payload.amount ?? ''}`);
  if (payload.email) parts.push(`· ${payload.email}`);
  return parts.join(' ');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}

export default function AdminEventsPage() {
  const t = useT();
  const [data, setData] = useState<any>(null);
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const PAGE_SIZE = 25;

  function flash(text: string, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  }

  // bypass=true wakati kichujio cha type kimechaguliwa → dropdown ibadilike
  // mara moja na data FRESH (usiache cache ya zamani ionekane).
  useEffect(() => {
    adminEvents(type || undefined, PAGE_SIZE, (page - 1) * PAGE_SIZE, !!type).then(setData);
  }, [type, page]);

  if (!data) return <div className="p-10"><Spinner label={t('adminevents.loading')} /></div>;

  async function doExport(fmt: 'csv' | 'xlsx') {
    setExporting(fmt);
    try {
      const res = await adminEventsExport(type || undefined, fmt);
      downloadBlob(res.data as Blob, `events_${type || 'all'}_${new Date().toISOString().slice(0, 10)}.${fmt}`);
      flash(`⬇ ${fmt.toUpperCase()} imepakuliwa — events_${type || 'all'}`);
    } catch (e: any) {
      flash(`Export imeshindikana: ${await exportErrorText(e)}`, false);
    } finally { setExporting(null); }
  }

  async function doClear() {
    if (!confirm(t('adminevents.clear_confirm'))) return;
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
        <h1 className="text-2xl font-bold text-brand-grey-900">📜 Event Log ({data.total?.toLocaleString()})</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => doExport('csv')} disabled={!!exporting} className="btn-outline text-xs min-h-[36px]">
            {exporting === 'csv' ? 'Inapakua...' : '⬇ CSV'}
          </button>
          <button onClick={() => doExport('xlsx')} disabled={!!exporting} className="btn-outline text-xs min-h-[36px]">
            {exporting === 'xlsx' ? 'Inapakua...' : '⬇ Excel'}
          </button>
          <button onClick={doClear} className="text-xs px-3 py-1.5 rounded-lg border border-brand-red text-brand-red hover:bg-brand-red hover:text-white transition">
            🗑 {t('adminevents.clear')}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`text-sm rounded-lg p-3 ${msg.ok ? 'bg-brand-blue-50 text-brand-blue' : 'bg-brand-red-50 text-brand-red'}`}>
          {msg.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <select className="input w-auto" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">{t('adminevents.all_types')}</option>
          {TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
        </select>
        <span className="text-xs text-brand-grey-500">{t('adminevents.type')}: <b>{type || 'zote'}</b></span>
      </div>

      <div className="bg-white rounded-2xl border border-brand-grey-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead className="bg-brand-grey-50 text-xs text-brand-grey-500">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
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
            {data.events.map((e: any, i: number) => {
              const isOpen = expanded.has(e._id);
              const color = TYPE_COLORS[e.event_type] || 'bg-brand-grey-100 text-brand-grey-600';
              const summary = humanize(e.payload, e.event_type);
              return (
                <Fragment key={e._id}>
                  <tr className="hover:bg-brand-grey-50 align-top">
                    <td className="px-3 py-2.5 text-xs font-mono text-brand-grey-400 whitespace-nowrap">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-block text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${color}`}>{e.event_type}</span>
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
                      })} className="text-brand-blue text-xs hover:underline whitespace-nowrap">
                        {isOpen ? t('adminevents.hide') : t('adminevents.show')}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="min-w-[44px] min-h-[44px] px-3 rounded-xl border border-brand-grey-200 text-sm font-semibold text-brand-grey-700 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition active:scale-95">
            ←
          </button>
          <span className="text-sm font-bold text-brand-grey-500 px-2">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="min-w-[44px] min-h-[44px] px-3 rounded-xl border border-brand-grey-200 text-sm font-semibold text-brand-grey-700 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition active:scale-95">
            →
          </button>
        </div>
      )}
    </div>
  );
}
