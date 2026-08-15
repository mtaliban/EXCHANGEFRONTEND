'use client';

import { useEffect, useState } from 'react';
import { adminReports, adminReportsExport, exportErrorText } from '@/lib/api';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}

function NumberTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  const t = useT();
  return (
    <div className="card overflow-hidden">
      <h3 className="font-bold text-brand-grey-900 mb-2">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-grey-50 text-xs text-brand-grey-500">
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

  useEffect(() => {
    setErr(null);
    adminReports(days).then(setData).catch(() => setErr('Imeshindikana kupakia ripoti — jaribu tena.'));
  }, [days]);

  async function doExport(fmt: 'pdf' | 'docx') {
    setExporting(true);
    try {
      const res = await adminReportsExport(fmt);
      downloadBlob(res.data as Blob, `ripoti_na_hesabu_${new Date().toISOString().slice(0, 10)}.${fmt === 'docx' ? 'docx' : 'pdf'}`);
      setErr(null);
    } catch (e: any) {
      setErr(`Export imeshindikana: ${await exportErrorText(e)}`);
    }
    finally { setExporting(false); }
  }

  if (err && !data) return <div className="p-6 max-w-md mx-auto"><div className="card bg-brand-red-50 text-brand-red text-sm">{err}</div></div>;
  if (!data) return <div className="p-10"><Spinner label={t('adminrep.loading')} /></div>;

  const totalUsers = data.users_by_region?.reduce((s: number, r: any) => s + r.count, 0) || 0;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900">📊 {t('adminrep.title')}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="input w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>{t('adminrep.week')}</option>
            <option value={30}>{t('adminrep.days30')}</option>
            <option value={90}>{t('adminrep.days90')}</option>
            <option value={365}>{t('adminrep.year')}</option>
          </select>
          <button onClick={() => doExport('pdf')} disabled={exporting} className="btn-primary text-xs min-h-[36px]">
            {exporting ? 'Inapakua...' : '⬇ PDF'}
          </button>
          <button onClick={() => doExport('docx')} disabled={exporting} className="btn-outline text-xs min-h-[36px]">
            {exporting ? 'Inapakua...' : '⬇ WORD'}
          </button>
        </div>
      </div>

      {err && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-3">{err}</div>}

      {/* Big numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t('admin.users')} value={totalUsers} color="text-brand-blue" />
        <StatCard label={t('adminrep.revenue_total')} value={`TZS ${data.revenue.total_tzs?.toLocaleString()}`} color="text-brand-orange" />
        <StatCard label={t('admin.matches')} value={data.matches_per_day?.reduce((s: number, r: any) => s + r.count, 0) || 0} color="text-brand-red" />
        <StatCard label={t('adminrep.revenue_paid')} value={data.revenue.paid_count} color="text-brand-gold-600" />
      </div>

      {/* NAMBA: by region / district / cadre / status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NumberTable
          title={`🌍 ${t('adminrep.by_region')} (${totalUsers})`}
          headers={[t('adminrep.region'), t('adminrep.count')]}
          rows={(data.users_by_region || []).map((r: any) => [r.region || '(bila mkoa)', String(r.count)])}
        />
        <NumberTable
          title={`🏢 ${t('adminrep.by_district')}`}
          headers={[t('adminrep.region'), t('adminrep.district'), t('adminrep.count')]}
          rows={(data.users_by_district || []).map((r: any) => [r.region || '', r.district || '', String(r.count)])}
        />
        <NumberTable
          title={`👨‍🏫 ${t('adminrep.by_cadre')}`}
          headers={[t('adminrep.department'), t('adminrep.cadre'), t('adminrep.count')]}
          rows={(data.users_by_cadre || []).map((r: any) => [r.cadre_name || r.category, r.cadre, String(r.count)])}
        />
        <NumberTable
          title={`🚦 ${t('adminrep.by_status')}`}
          headers={[t('adminrep.status'), t('adminrep.count')]}
          rows={(data.users_by_status || []).map((r: any) => [r.status, String(r.count)])}
        />
      </div>

      {/* Michango */}
      <div className="card">
        <h3 className="font-bold mb-3">💰 {t('adminrep.revenue')}</h3>
        <div className="space-y-1">
          {data.revenue.per_purpose.map((m: any) => (
            <div key={m.purpose} className="flex items-center justify-between text-sm">
              <span className="badge-gold">{m.purpose}</span>
              <span>TZS {m.total?.toLocaleString()} ({m.count} {t('adminrep.donations')})</span>
            </div>
          ))}
          {data.revenue.per_purpose.length === 0 && <div className="text-brand-grey-500 text-sm">{t('adminrep.no_data')}</div>}
        </div>
      </div>

      {/* Wachanga wa hivi karibuni (registrations) — numbers tu */}
      <div className="card">
        <h3 className="font-bold mb-3">👥 {t('adminrep.users_new')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-brand-grey-100">
              {data.users_per_day.slice(-14).reverse().map((d: any) => (
                <tr key={d.date}>
                  <td className="py-1 text-brand-grey-500">{d.date}</td>
                  <td className="py-1 text-right font-mono font-bold text-brand-blue">{d.count}</td>
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

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="card">
      <div className={`text-2xl font-bold ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="text-xs text-brand-grey-500 mt-1">{label}</div>
    </div>
  );
}
