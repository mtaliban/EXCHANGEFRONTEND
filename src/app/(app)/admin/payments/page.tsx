'use client';

import { useEffect, useState } from 'react';
import { adminAllDonations, adminApproveDonation, adminRejectDonation } from '@/lib/api';
import { parseServerDate } from '@/lib/dates';
import { useLive } from '@/lib/liveSocket';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';
import {
  CreditCard, CheckCircle2, XCircle, Clock, Eye, EyeOff,
  AlertTriangle, Banknote, Users, TrendingUp,
} from 'lucide-react';

type Status = '' | 'verifying' | 'approved' | 'rejected';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  verifying: { label: 'adminpay.status_verifying', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Clock },
  approved: { label: 'adminpay.status_approved', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  rejected: { label: 'adminpay.status_rejected', color: 'bg-brand-red-50 text-brand-red border-brand-red-200', icon: XCircle },
};

export default function AdminPaymentsPage() {
  const t = useT();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<Status>('verifying');
  const [busy, setBusy] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [newDonation, setNewDonation] = useState<any>(null);

  const { subscribe } = useLive();

  async function load() {
    try { setData(await adminAllDonations(status || undefined, true)); } catch {}
  }

  useEffect(() => { load(); }, [status]);

  useEffect(() => {
    const un = subscribe('notification', (p: any) => {
      if (p.type === 'payment.submitted') {
        setNewDonation(p);
        load();
        setTimeout(() => setNewDonation(null), 8000);
      }
    });
    return () => un();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, status]);

  async function act(order_id: string, approve: boolean) {
    setBusy(order_id);
    setFlash(null);
    try {
      const note = approve ? '' : window.prompt(t('adminpay.reason_prompt'), t('adminpay.reason_default'));
      if (!approve && note === null) { setBusy(''); return; }
      if (approve) {
        await adminApproveDonation(order_id, '');
      } else {
        await adminRejectDonation(order_id, note || '');
      }
      setFlash({ type: 'success', msg: `${approve ? t('adminpay.approved_flash') : t('adminpay.rejected_flash')} — ${order_id}` });
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
      setFlash({ type: 'error', msg: e?.response?.data?.detail || t('adminpay.error') });
    }
    setBusy('');
  }

  if (!data) return <div className="p-10"><Spinner label={t('msg.loading')} /></div>;

  const counts: Record<string, number> = data.counts || { verifying: 0, approved: 0, rejected: 0, all: data.payments.length };
  const visiblePayments = (data.payments || []).filter((p: any) => !status || p.status === status);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900 flex items-center gap-2">
          <CreditCard size={22} className="text-brand-blue" />
          {t('adminpay.title')}
        </h1>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          <option value="verifying">{t('adminpay.verifying')} ({counts.verifying ?? 0})</option>
          <option value="approved">{t('adminpay.approved')} ({counts.approved ?? 0})</option>
          <option value="rejected">{t('adminpay.rejected')} ({counts.rejected ?? 0})</option>
          <option value="">{t('adminpay.all')} ({counts.all ?? data.payments.length})</option>
        </select>
      </div>

      {/* Flash message */}
      {flash && (
        <div className={`flex items-center gap-2 text-xs font-semibold rounded-full px-3 py-1.5 ${flash.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-brand-red-50 text-brand-red border border-brand-red-200'}`}>
          {flash.type === 'success' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
          {flash.msg}
        </div>
      )}

      {/* New donation popup */}
      {newDonation && (
        <div className="rounded-xl border-l-4 border-brand-blue bg-brand-blue-50 p-3 flex items-center gap-3 animate-slide-in">
          <CreditCard size={18} className="text-brand-blue flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-brand-grey-900">Mchango mpya unahitaji uthibitisho</div>
            <div className="text-xs text-brand-grey-600 mt-0.5">
              TZS {(newDonation.data?.amount || 0).toLocaleString()} — angalia SMS chini na uthibitishe
            </div>
          </div>
          <button onClick={() => setNewDonation(null)} className="text-brand-grey-400 hover:text-brand-grey-700 transition p-1" aria-label="Funga">
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Stats — compact, no big cards */}
      <div className="flex flex-wrap gap-2">
        <div className="inline-flex items-center gap-2 bg-white border border-brand-grey-200 rounded-full px-3 py-1.5">
          <TrendingUp size={13} className="text-green-600" />
          <span className="text-xs font-bold text-brand-grey-900">TZS {data.total_approved_tzs?.toLocaleString()}</span>
          <span className="text-[10px] text-brand-grey-500">{t('adminpay.total_approved')}</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-white border border-brand-grey-200 rounded-full px-3 py-1.5">
          <Clock size={13} className="text-orange-500" />
          <span className="text-xs font-bold text-brand-grey-900">{counts.verifying}</span>
          <span className="text-[10px] text-brand-grey-500">{t('adminpay.awaiting')}</span>
        </div>
        <div className="inline-flex items-center gap-2 bg-white border border-brand-grey-200 rounded-full px-3 py-1.5">
          <Banknote size={13} className="text-brand-blue" />
          <span className="text-xs font-bold text-brand-grey-900">{data.payments.length}</span>
          <span className="text-[10px] text-brand-grey-500">{t('adminpay.in_list')}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-brand-grey-200 overflow-hidden overflow-x-auto">
        {visiblePayments.length === 0 && (
          <div className="p-8 text-center">
            <Banknote size={28} className="mx-auto text-brand-grey-300 mb-2" />
            <p className="text-sm text-brand-grey-500 font-medium">{t('adminpay.empty')}</p>
          </div>
        )}
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-brand-grey-50 text-[10px] uppercase tracking-wider font-bold text-brand-grey-500">
            <tr>
              <th className="px-3 py-2 text-center w-8">#</th>
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
            {visiblePayments.map((p: any, i: number) => {
              const isOpen = expanded[p.order_id];
              const st = STATUS_CONFIG[p.status] || STATUS_CONFIG.verifying;
              const StIcon = st.icon;
              return (
                <tr key={p.order_id} className="hover:bg-brand-grey-50 align-top">
                  <td className="px-3 py-2.5 text-center text-xs font-bold text-brand-grey-400">{i + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-brand-grey-900">
                    {p.user_name || p.user_id?.slice(-6)}
                    {p.expired && p.status === 'verifying' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-500 ml-1.5">
                        <Clock size={10} /> {t('adminpay.expired')}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-brand-blue whitespace-nowrap text-xs">{p.phone}</td>
                  <td className="px-3 py-2.5 font-bold text-brand-grey-900 whitespace-nowrap text-xs">{p.amount?.toLocaleString()} TZS</td>
                  <td className="px-3 py-2.5 text-[11px] text-brand-grey-500 whitespace-nowrap">
                    {(parseServerDate(p.created_at) || new Date()).toLocaleString('sw-TZ')}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-brand-grey-500 max-w-[120px] truncate">{p.order_id}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold border ${st.color}`}>
                      <StIcon size={11} />
                      {t(st.label)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    {/* View SMS */}
                    <button onClick={() => setExpanded((e) => ({ ...e, [p.order_id]: !isOpen }))}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-brand-grey-100 text-brand-grey-600 font-medium hover:bg-brand-grey-200 transition mr-1">
                      {isOpen ? <EyeOff size={11} /> : <Eye size={11} />}
                      {isOpen ? t('adminpay.hide_sms') : t('adminpay.view')}
                    </button>

                    {/* Toggle switch kwa Confirm/Reject */}
                    {p.status === 'verifying' && (
                      <div className="inline-flex items-center gap-1 ml-1">
                        {/* Toggle: ON = approve, OFF = default */}
                        <button
                          onClick={() => act(p.order_id, true)}
                          disabled={busy === p.order_id}
                          className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold transition disabled:opacity-40 ${
                            busy === p.order_id
                              ? 'bg-brand-grey-100 text-brand-grey-500 border border-brand-grey-200'
                              : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                          }`}
                          title={t('adminpay.confirm_btn')}
                        >
                          <CheckCircle2 size={12} />
                          {busy === p.order_id ? '...' : t('adminpay.confirm_btn')}
                        </button>
                        <button
                          onClick={() => act(p.order_id, false)}
                          disabled={busy === p.order_id}
                          className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold transition disabled:opacity-40 ${
                            busy === p.order_id
                              ? 'bg-brand-grey-100 text-brand-grey-500 border border-brand-grey-200'
                              : 'bg-brand-red-50 text-brand-red border border-brand-red-200 hover:bg-brand-red-100'
                          }`}
                          title={t('adminpay.reject_btn')}
                        >
                          <XCircle size={12} />
                          {t('adminpay.reject_btn')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SMS ya mchangiaji — inline chini ya table */}
      {Object.keys(expanded).some((k) => expanded[k]) && (
        <div className="space-y-2">
          {visiblePayments.filter((p: any) => expanded[p.order_id]).map((p: any) => (
            <div key={p.order_id} className="bg-white rounded-xl border border-brand-grey-200 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wide text-brand-grey-500 font-bold flex items-center gap-1">
                  <CreditCard size={11} /> {t('adminpay.sms_donor')}
                </span>
                <button onClick={() => setExpanded((e) => ({ ...e, [p.order_id]: false }))} className="text-brand-grey-400 hover:text-brand-grey-700 transition p-0.5">
                  <XCircle size={14} />
                </button>
              </div>
              <div className="whitespace-pre-wrap break-words text-sm text-brand-grey-800 bg-brand-grey-50 rounded-lg p-2.5 font-mono text-xs">{p.sms_text}</div>
              {p.note && (
                <div className="mt-1.5 text-[11px] text-brand-red flex items-center gap-1">
                  <AlertTriangle size={11} /> {t('adminpay.note')} {p.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-brand-grey-400 text-center">
        {t('adminpay.hint')}
      </p>
    </div>
  );
}
