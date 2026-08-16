'use client';

import { useEffect, useState } from 'react';
import { adminAllDonations, adminApproveDonation, adminRejectDonation } from '@/lib/api';
import { parseServerDate } from '@/lib/dates';
import { useLive } from '@/lib/liveSocket';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';
import SpringSpinner from '@/components/SpringSpinner';

type Status = '' | 'verifying' | 'approved' | 'rejected';

const BADGE: Record<string, string> = {
  verifying: 'bg-brand-gold-100 text-brand-gold-600',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  rejected: 'bg-brand-red-100 text-brand-red',
};

export default function AdminPaymentsPage() {
  const t = useT();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<Status>('verifying');
  const [busy, setBusy] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [flash, setFlash] = useState('');
  // Mchango mpya unaofika LIVE — popup kubwa inayojitokeza (inaondoka baada ya muda).
  const [newDonation, setNewDonation] = useState<any>(null);

  const { subscribe } = useLive();

  // bypass=true KILA MARA — dropdown na counts ziwe FRESH (real-time). Cache
  // iliyokuwa inarudisha "zote = 0" wakati status maalum ina 6 imeondolewa:
  // kila mabadiliko ya dropdown yanapata data ya sasa papo hapo.
  async function load() {
    try { setData(await adminAllDonations(status || undefined, true)); } catch {}
  }

  useEffect(() => { load(); }, [status]);
  // REAL-TIME: no HTTP polling — mchango mpya unapowasilishwa (payment.submitted)
  // unamjulisha admin papo hapo kupitia WebSocket (popup + list inajirefresh).
  useEffect(() => {
    const un = subscribe('notification', (p: any) => {
      if (p.type === 'payment.submitted') {
        setNewDonation(p);
        load();
        // Popup inaondoka yenyewe baada ya sekunde 8 (au kubofya ✕).
        setTimeout(() => setNewDonation(null), 8000);
      }
    });
    return () => un();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, status]);

  async function act(order_id: string, approve: boolean) {
    setBusy(order_id);
    setFlash('');
    try {
      const note = approve ? '' : window.prompt(t('adminpay.reason_prompt'), t('adminpay.reason_default'));
      if (!approve && note === null) { setBusy(''); return; }
      if (approve) {
        await adminApproveDonation(order_id, '');
      } else {
        await adminRejectDonation(order_id, note || '');
      }
      setFlash(`✓ ${approve ? t('adminpay.approved_flash') : t('adminpay.rejected_flash')} — ${order_id}`);
      // PAPO HAPO — malipo hubadilika status bila refetch (event-driven).
      setData((prev: any) => {
        if (!prev) return prev;
        const newStatus = approve ? 'approved' : 'rejected';
        return {
          ...prev,
          payments: (prev.payments || []).map((x: any) => x.order_id === order_id ? { ...x, status: newStatus } : x),
          counts: {
            ...(prev.counts || {}),
            [newStatus]: ((prev.counts || {})[newStatus] || 0) + 1,
            verifying: Math.max(0, ((prev.counts || {}).verifying || 0) - 1),
            all: prev.counts?.all ?? (prev.payments || []).length,
          },
        };
      });
    } catch (e: any) {
      setFlash(`✗ ${e?.response?.data?.detail || t('adminpay.error')}`);
    }
    setBusy('');
  }

  if (!data) return <div className="p-10"><Spinner label={t('msg.loading')} /></div>;

  // Counts KAMILI kutoka backend (verifying/approved/rejected) — dropdown
  // inahesabu sahihi kila mara (sio hesabu za list iliyochujwa tu).
  const counts: Record<string, number> = data.counts || { verifying: 0, approved: 0, rejected: 0, all: data.payments.length };
  const visiblePayments = (data.payments || []).filter((p: any) => !status || p.status === status);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900">{t('adminpay.title')}</h1>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          <option value="verifying">{t('adminpay.verifying')} ({counts.verifying ?? 0})</option>
          <option value="approved">{t('adminpay.approved')} ({counts.approved ?? 0})</option>
          <option value="rejected">{t('adminpay.rejected')} ({counts.rejected ?? 0})</option>
          <option value="">{t('adminpay.all')} ({counts.all ?? data.payments.length})</option>
        </select>
      </div>

      {flash && <div className={`rounded-lg px-3 py-2 text-sm ${flash.startsWith('✓') ? 'bg-brand-blue-50 text-brand-blue' : 'bg-brand-red-50 text-brand-red'}`}>{flash}</div>}

      {/* Mchango mpya — popup ya real-time inayoonekana mara moja */}
      {newDonation && (
        <div className="rounded-xl border-l-4 border-brand-gold-500 bg-brand-gold-50 dark:bg-brand-gold-500/10 p-3 flex items-start gap-3 animate-slide-in shadow-sm">
          <span className="text-xl leading-none mt-0.5">💰</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-brand-grey-900 dark:text-white">Mchango mpya unahitaji uthibitisho!</div>
            <div className="text-xs text-brand-grey-600 dark:text-brand-grey-400 mt-0.5">
              TZS {(newDonation.data?.amount || 0).toLocaleString()} — angalia SMS hapa chini na uthibitishe.
            </div>
          </div>
          <button onClick={() => setNewDonation(null)} className="text-brand-grey-400 hover:text-brand-grey-700 text-lg leading-none" aria-label="Funga">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card">
          <div className="text-3xl font-bold text-brand-blue">TZS {data.total_approved_tzs?.toLocaleString()}</div>
          <div className="text-xs text-brand-grey-500">{t('adminpay.total_approved')}</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-brand-gold-600">{counts.verifying}</div>
          <div className="text-xs text-brand-grey-500">{t('adminpay.awaiting')}</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-brand-grey-700">{data.payments.length}</div>
          <div className="text-xs text-brand-grey-500">{t('adminpay.in_list')}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-grey-100 overflow-hidden overflow-x-auto">
        {visiblePayments.length === 0 && (
          <div className="p-8 text-center text-brand-grey-500 text-sm">{t('adminpay.empty')}</div>
        )}
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-brand-grey-50 text-xs text-brand-grey-500">
            <tr>
              <th className="px-3 py-2 text-left">{t('admin.col_name')}</th>
              <th className="px-3 py-2 text-left">{t('admin.col_phone')}</th>
              <th className="px-3 py-2 text-left">{t('adminpay.amount')}</th>
              <th className="px-3 py-2 text-left">{t('adminpay.date')}</th>
              <th className="px-3 py-2 text-left">{t('msg.reference')}</th>
              <th className="px-3 py-2 text-left">{t('adminpay.status')}</th>
              <th className="px-3 py-2 text-right">{t('admin.col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-grey-100">
            {visiblePayments.map((p: any) => {
              const isOpen = expanded[p.order_id];
              return (
                <tr key={p.order_id} className="hover:bg-brand-grey-50 align-top">
                  <td className="px-3 py-2.5 font-medium text-brand-grey-900">
                    {p.user_name || p.user_id?.slice(-6)}
                    {p.expired && p.status === 'verifying' && (
                      <span className="block text-[10px] font-bold text-brand-grey-400 mt-0.5">⏳ {t('adminpay.expired')}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-brand-blue whitespace-nowrap">{p.phone}</td>
                  <td className="px-3 py-2.5 font-bold text-brand-grey-900 whitespace-nowrap">{p.amount?.toLocaleString()} TZS</td>
                  <td className="px-3 py-2.5 text-xs text-brand-grey-500 whitespace-nowrap">
                    {(parseServerDate(p.created_at) || new Date()).toLocaleString('sw-TZ')}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-brand-grey-500">{p.order_id}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${BADGE[p.status] || 'bg-brand-grey-100 text-brand-grey-700'}`}>
                      {p.status === 'verifying' ? t('adminpay.status_verifying') : p.status === 'approved' ? t('adminpay.status_approved') : t('adminpay.status_rejected')}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => setExpanded((e) => ({ ...e, [p.order_id]: !isOpen }))} className="text-brand-grey-600 text-xs px-2 hover:underline">
                      👁 {isOpen ? t('adminpay.hide_sms') : t('adminpay.view')}
                    </button>
                    {p.status === 'verifying' && (
                      <>
                        <button
                          onClick={() => act(p.order_id, true)}
                          disabled={busy === p.order_id}
                          className="text-green-600 text-xs px-2 hover:underline font-semibold"
                        >
                          {busy === p.order_id ? '...' : '✓ ' + t('adminpay.confirm_btn')}
                        </button>
                        <button
                          onClick={() => act(p.order_id, false)}
                          disabled={busy === p.order_id}
                          className="text-brand-red text-xs px-2 hover:underline"
                        >
                          ✗ {t('adminpay.reject_btn')}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SMS ya mchangiaji — inaonekana chini ya table kama card (view) */}
      {Object.keys(expanded).some((k) => expanded[k]) && (
        <div className="space-y-2">
          {visiblePayments.filter((p: any) => expanded[p.order_id]).map((p: any) => (
            <div key={p.order_id} className="card">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wide text-brand-grey-500 font-semibold">{t('adminpay.sms_donor')}</span>
                <button onClick={() => setExpanded((e) => ({ ...e, [p.order_id]: false }))} className="text-brand-grey-400 hover:text-brand-grey-700 text-sm px-1">✕</button>
              </div>
              <div className="whitespace-pre-wrap break-words text-sm text-brand-grey-800">{p.sms_text}</div>
              {p.note && <div className="mt-2 text-xs text-brand-red">{t('adminpay.note')} {p.note}</div>}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-brand-grey-400 text-center">
        {t('adminpay.hint')}
      </p>
    </div>
  );
}
