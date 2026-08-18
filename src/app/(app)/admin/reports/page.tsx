'use client';

import { useEffect, useRef, useState } from 'react';
import { adminReports, adminReportsExport, exportErrorText } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';
import {
  BarChart3, Users, Banknote, Zap, TrendingUp, MapPin, Building2,
  GraduationCap, Shield, Download, AlertTriangle, CheckCircle2, Calendar,
} from 'lucide-react';

function useLiveReportsRefresh(onChange: () => void) {
  const lastOwn = useRef(0);
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
                if (Date.now() - lastOwn.current < 1500) continue;
                onChange();
              } catch {}
            }
          }
        }
      } catch {}
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
  return { markOwn: () => { lastOwn.current = Date.now(); } };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}

function NumberTable({ title, icon: Icon, headers, rows }: { title: string; icon: any; headers: string[]; rows: string[][] }) {
  const t = useT();
  return (
    <div className="bg-white rounded-xl border border-brand-grey-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-brand-grey-100">
        <Icon size={14} className="text-brand-blue" />
        <h3 className="font-bold text-sm text-brand-grey-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-grey-50 text-[10px] uppercase tracking-wider font-bold text-brand-grey-500">
            <tr>{headers.map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-brand-grey-100">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-brand-grey-50">
                {r.map((c, j) => (
                  <td key={j} className={`px-3 py-1.5 ${j === 0 ? 'font-medium' : j === r.length - 1 ? 'font-mono text-right text-brand-blue font-bold' : ''}`}>{c}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={headers.length} className="px-3 py-4 text-center text-brand-grey-400 text-sm">{t('adminrep.no_data')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const t = useT();
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [exporting, setExporting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useLiveReportsRefresh(() => {
    setErr(null);
    adminReports(days).then(setData).catch(() => {});
  });

  useEffect(() => {
    setErr(null);
    adminReports(days).then(setData).catch(() => setErr('Imeshindikana kupakia ripoti — jaribu tena.'));
  }, [days]);

  async function doExport(fmt: 'pdf' | 'docx') {
    setExporting(true);
    try {
      const res = await adminReportsExport(fmt, days);
      downloadBlob(res.data as Blob, `ripoti_na_hesabu_${new Date().toISOString().slice(0, 10)}.${fmt === 'docx' ? 'docx' : 'pdf'}`);
      setErr(null);
    } catch (e: any) {
      setErr(`Export imeshindikana: ${await exportErrorText(e)}`);
    }
    finally { setExporting(false); }
  }

  if (err && !data) return <div className="p-6 max-w-md mx-auto"><div className="card bg-brand-red-50 text-brand-red text-sm flex items-center gap-2"><AlertTriangle size={16} /> {err}</div></div>;
  if (!data) return <div className="p-10"><Spinner label={t('adminrep.loading')} /></div>;

  const totalUsers = data.users_by_region?.reduce((s: number, r: any) => s + r.count, 0) || 0;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-brand-grey-900 flex items-center gap-2">
            <BarChart3 size={22} className="text-brand-blue" />
            {t('adminrep.title')}
          </h1>
          <p className="text-xs text-brand-grey-500 mt-1 flex items-center gap-1">
            <Calendar size={12} /> {t('adminrep.period')}: <b className="text-brand-blue">{days} {t('adminrep.days')}</b>
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <select className="input w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>{t('adminrep.week')}</option>
            <option value={30}>{t('adminrep.days30')}</option>
            <option value={90}>{t('adminrep.days90')}</option>
            <option value={365}>{t('adminrep.year')}</option>
          </select>
          <button onClick={() => doExport('pdf')} disabled={exporting}
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-grey-100 text-brand-grey-600 border border-brand-grey-200 font-semibold hover:bg-brand-grey-200 transition disabled:opacity-40">
            <Download size={11} /> {exporting ? 'Inapakua...' : 'PDF'}
          </button>
          <button onClick={() => doExport('docx')} disabled={exporting}
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-grey-100 text-brand-grey-600 border border-brand-grey-200 font-semibold hover:bg-brand-grey-200 transition disabled:opacity-40">
            <Download size={11} /> {exporting ? 'Inapakua...' : 'WORD'}
          </button>
        </div>
      </div>

      {err && <div className="flex items-center gap-2 bg-brand-red-50 text-brand-red text-xs font-semibold rounded-full px-3 py-1.5 border border-brand-red-200"><AlertTriangle size={13} /> {err}</div>}

      {/* Stats — compact pills */}
      <div className="flex flex-wrap gap-2">
        <div className="inline-flex items-center gap-2 bg-white border border-brand-grey-200 rounded-full px-3 py-1.5">
          <Users size={13} className="text-brand-blue" />
          <span className="text-xs font-bold text-brand-grey-900">{totalUsers.toLocaleString()}</span>
          <span className="text-[10px] text-brand-grey-500">{t('admin.users')}</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-white border border-brand-grey-200 rounded-full px-3 py-1.5">
          <Banknote size={13} className="text-green-600" />
          <span className="text-xs font-bold text-brand-grey-900">TZS {data.revenue.total_tzs?.toLocaleString()}</span>
          <span className="text-[10px] text-brand-grey-500">{t('adminrep.revenue_total')}</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-white border border-brand-grey-200 rounded-full px-3 py-1.5">
          <Zap size={13} className="text-brand-red" />
          <span className="text-xs font-bold text-brand-grey-900">{data.matches_per_day?.reduce((s: number, r: any) => s + r.count, 0) || 0}</span>
          <span className="text-[10px] text-brand-grey-500">{t('admin.matches')}</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-white border border-brand-grey-200 rounded-full px-3 py-1.5">
          <TrendingUp size={13} className="text-brand-blue" />
          <span className="text-xs font-bold text-brand-grey-900">{data.revenue.paid_count}</span>
          <span className="text-[10px] text-brand-grey-500">{t('adminrep.revenue_paid')}</span>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NumberTable
          title={`${t('adminrep.by_region')} (${totalUsers})`}
          icon={MapPin}
          headers={[t('adminrep.region'), t('adminrep.count')]}
          rows={(data.users_by_region || []).map((r: any) => [r.region || '(bila mkoa)', String(r.count)])}
        />
        <NumberTable
          title={t('adminrep.by_district')}
          icon={Building2}
          headers={[t('adminrep.region'), t('adminrep.district'), t('adminrep.count')]}
          rows={(data.users_by_district || []).map((r: any) => [r.region || '', r.district || '', String(r.count)])}
        />
        <NumberTable
          title={t('adminrep.by_cadre')}
          icon={GraduationCap}
          headers={[t('adminrep.department'), t('adminrep.cadre'), t('adminrep.count')]}
          rows={(data.users_by_cadre || []).map((r: any) => [r.cadre_name || r.category, r.cadre, String(r.count)])}
        />
        <NumberTable
          title={t('adminrep.by_status')}
          icon={Shield}
          headers={[t('adminrep.status'), t('adminrep.count')]}
          rows={(data.users_by_status || []).map((r: any) => [r.status, String(r.count)])}
        />
      </div>

      {/* Revenue */}
      <div className="bg-white rounded-xl border border-brand-grey-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Banknote size={14} className="text-green-600" />
          <h3 className="font-bold text-sm text-brand-grey-900">{t('adminrep.revenue')}</h3>
        </div>
        <div className="space-y-1">
          {data.revenue.per_purpose.map((m: any) => (
            <div key={m.purpose} className="flex items-center justify-between text-sm py-1.5 border-b border-brand-grey-100 last:border-0">
              <span className="text-xs font-medium text-brand-grey-700">{m.purpose}</span>
              <span className="text-xs font-bold text-brand-grey-900">TZS {m.total?.toLocaleString()} <span className="font-normal text-brand-grey-500">({m.count})</span></span>
            </div>
          ))}
          {data.revenue.per_purpose.length === 0 && <div className="text-brand-grey-500 text-sm">{t('adminrep.no_data')}</div>}
        </div>
      </div>

      {/* New users */}
      <div className="bg-white rounded-xl border border-brand-grey-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-brand-blue" />
          <h3 className="font-bold text-sm text-brand-grey-900">{t('adminrep.users_new')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-brand-grey-100">
              {data.users_per_day.slice(-14).reverse().map((d: any) => (
                <tr key={d.date} className="hover:bg-brand-grey-50">
                  <td className="py-1.5 text-brand-grey-500 text-xs">{d.date}</td>
                  <td className="py-1.5 text-right font-mono font-bold text-brand-blue text-xs">{d.count}</td>
                </tr>
              ))}
              {data.users_per_day.length === 0 && <tr><td className="py-4 text-center text-brand-grey-400 text-sm">{t('adminrep.no_data')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
