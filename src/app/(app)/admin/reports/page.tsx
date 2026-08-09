'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL as API } from '@/lib/config';
import { useT } from '@/lib/i18n';

export default function ReportsPage() {
  const t = useT();
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem('kv_auth') || '{}')?.state?.token;
    axios.get(`${API}/admin/reports?days=${days}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setData(r.data));
  }, [days]);

  if (!data) return <div className="p-6 text-brand-grey-500">{t('adminrep.loading')}</div>;

  const maxUsers = Math.max(...(data.users_per_day || []).map((d: any) => d.count), 1);
  const maxMatches = Math.max(...(data.matches_per_day || []).map((d: any) => d.count), 1);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900">{t('adminrep.title')} — {data.period_days} {t('adminrep.days_unit')}</h1>
        <select className="input w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>{t('adminrep.week')}</option>
          <option value={30}>{t('adminrep.days30')}</option>
          <option value={90}>{t('adminrep.days90')}</option>
          <option value={365}>{t('adminrep.year')}</option>
        </select>
      </div>

      {/* Revenue */}
      <div className="card">
        <h3 className="font-bold mb-3">{t('adminrep.revenue')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><div className="text-2xl font-bold text-brand-blue">TZS {data.revenue.total_tzs?.toLocaleString()}</div><div className="text-xs text-brand-grey-500">{t('adminrep.revenue_total')}</div></div>
          <div><div className="text-2xl font-bold text-brand-orange">{data.revenue.paid_count}</div><div className="text-xs text-brand-grey-500">{t('adminrep.revenue_paid')}</div></div>
          <div><div className="text-2xl font-bold text-brand-red">{data.revenue.per_purpose.length}</div><div className="text-xs text-brand-grey-500">{t('adminrep.revenue_types')}</div></div>
        </div>
        <div className="mt-3 space-y-1">
          {data.revenue.per_purpose.map((m: any) => (
            <div key={m.purpose} className="flex items-center justify-between text-sm">
              <span className="badge-gold">{m.purpose}</span>
              <span>TZS {m.total?.toLocaleString()} ({m.count} {t('adminrep.donations')})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Users trend */}
      <div className="card">
        <h3 className="font-bold mb-3">{t('adminrep.users_new')}</h3>
        {data.users_per_day.length === 0 && <div className="text-brand-grey-500 text-sm">{t('adminrep.no_data')}</div>}
        <div className="space-y-1 text-xs">
          {data.users_per_day.map((d: any) => (
            <div key={d.date} className="flex items-center gap-2">
              <span className="w-24 text-brand-grey-500">{d.date}</span>
              <div className="flex-1 bg-brand-grey-100 h-4 rounded">
                <div className="h-4 bg-brand-blue rounded" style={{ width: `${(d.count / maxUsers) * 100}%` }}></div>
              </div>
              <span className="w-8 text-right font-mono">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Matches trend */}
      <div className="card">
        <h3 className="font-bold mb-3">{t('adminrep.matches_new')}</h3>
        {data.matches_per_day.length === 0 && <div className="text-brand-grey-500 text-sm">{t('adminrep.no_data')}</div>}
        <div className="space-y-1 text-xs">
          {data.matches_per_day.map((d: any) => (
            <div key={d.date} className="flex items-center gap-2">
              <span className="w-24 text-brand-grey-500">{d.date}</span>
              <div className="flex-1 bg-brand-grey-100 h-4 rounded">
                <div className="h-4 bg-brand-orange rounded" style={{ width: `${(d.count / maxMatches) * 100}%` }}></div>
              </div>
              <span className="w-8 text-right font-mono">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top pages */}
      <div className="card">
        <h3 className="font-bold mb-3">{t('adminrep.top_pages')}</h3>
        {data.top_pages.length === 0 && <div className="text-brand-grey-500 text-sm">{t('adminrep.no_pages')}</div>}
        <table className="w-full text-sm">
          <tbody className="divide-y divide-brand-grey-100">
            {data.top_pages.map((p: any) => (
              <tr key={p.path}>
                <td className="py-1">{p.path}</td>
                <td className="py-1 text-right"><span className="badge-gold">{p.views}</span></td>
                <td className="py-1 text-right text-xs text-brand-grey-500">{p.unique_users} {t('adminrep.users')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
