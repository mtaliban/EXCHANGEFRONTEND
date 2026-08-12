'use client';

import { useEffect, useState } from 'react';
import { adminEvents, adminEventsExport, adminClearEvents } from '@/lib/api';
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
  const [msg, setMsg] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const PAGE_SIZE = 25;

  useEffect(() => {
    adminEvents(type || undefined, PAGE_SIZE, (page - 1) * PAGE_SIZE).then(setData);
  }, [type, page]);

  if (!data) return <div className="p-10"><Spinner label={t('adminevents.loading')} /></div>;

  async function doExport(fmt: 'csv' | 'xlsx') {
    setExporting(true);
    try {
      const res = await adminEventsExport(type || undefined, fmt);
      downloadBlob(res.data as Blob, `events_${type || 'all'}_${new Date().toISOString().slice(0, 10)}.${fmt}`);
    } catch (e) { setMsg('Export imeshindikana'); setTimeout(() => setMsg(null), 3000); }
    finally { setExporting(false); }
  }

  async function doClear() {
    if (!confirm(t('adminevents.clear_confirm'))) return;
    await adminClearEvents();
    setPage(1);
    adminEvents(type || undefined, PAGE_SIZE, 0).then(setData);
    setMsg(t('adminevents.cleared'));
    setTimeout(() => setMsg(null), 3000);
  }

  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / PAGE_SIZE));

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900">📜 Event Log ({data.total?.toLocaleString()})</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => doExport('csv')} disabled={exporting} className="btn-outline text-xs">
            ⬇ CSV
          </button>
          <button onClick={() => doExport('xlsx')} disabled={exporting} className="btn-outline text-xs">
            ⬇ Excel
          </button>
          <button onClick={doClear} className="text-xs px-3 py-1.5 rounded-lg border border-brand-red text-brand-red hover:bg-brand-red hover:text-white transition">
            🗑 {t('adminevents.clear')}
          </button>
        </div>
      </div>

      {msg && <div className="bg-brand-blue-50 text-brand-blue text-sm rounded-lg p-3">{msg}</div>}

      <div className="flex flex-wrap gap-2 items-center">
        <select className="input w-auto" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">{t('adminevents.all_types')}</option>
          {TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-brand-grey-100 overflow-hidden">
        {data.events.length === 0 && (
          <div className="p-8 text-center text-sm text-brand-grey-500">{t('adminevents.empty')}</div>
        )}
        {data.events.map((e: any) => {
          const id = e._id;
          const isOpen = expanded.has(id);
          const color = TYPE_COLORS[e.event_type] || 'bg-brand-grey-100 text-brand-grey-600';
          const summary = humanize(e.payload, e.event_type);
          return (
            <div key={id} className="border-b border-brand-grey-100">
              <button
                onClick={() => setExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id); else next.add(id);
                  return next;
                })}
                className="w-full text-left px-3 md:px-4 py-2.5 hover:bg-brand-grey-50 transition flex items-start gap-2 md:gap-3">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap mt-0.5 ${color}`}>{e.event_type}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-brand-grey-800 truncate">{summary || JSON.stringify(e.payload)}</span>
                  <span className="block text-[11px] text-brand-grey-400 mt-0.5">
                    {e.topic} · {(parseServerDate(e.occurred_at) || new Date()).toLocaleString('sw-TZ')}
                  </span>
                </span>
                <span className={`text-brand-grey-400 text-xs mt-1 transition ${isOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {isOpen && (
                <pre className="mx-3 md:mx-4 mb-3 p-3 rounded-lg bg-brand-grey-50 text-[11px] font-mono text-brand-grey-700 overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify({ _id: id, ...e }, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
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
