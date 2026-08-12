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

  const { subscribe } = useLive();

  // bypass=true wakati status imechaguliwa — dropdown ibadilike mara moja
  // (cache isiache data ya zamani ionekane).
  async function load() {
    try { setData(await adminAllDonations(status || undefined, !!status)); } catch {}
  }

  useEffect(() => { load(); }, [status]);
  // REAL-TIME: no HTTP polling — mchango mpya unapowasilishwa (payment.submitted)
  // unamjulisha admin papo hapo kupitia WebSocket.
  useEffect(() => {
    const un = subscribe('notification', (p: any) => {
      if (p.type === 'payment.submitted') load();
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
      await load();
    } catch (e: any) {
      setFlash(`✗ ${e?.response?.data?.detail || t('adminpay.error')}`);
    }
    setBusy('');
  }

  if (!data) return <div className="p-10"><Spinner label={t('msg.loading')} /></div>;

  const counts: Record<string, number> = { verifying: 0, approved: 0, rejected: 0 };
  data.payments.forEach((p: any) => {
    const key = p.status as 'verifying' | 'approved' | 'rejected';
    if (counts[key] !== undefined) counts[key]++;
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900">{t('adminpay.title')}</h1>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          <option value="verifying">{t('adminpay.verifying')} ({counts.verifying})</option>
          <option value="approved">{t('adminpay.approved')} ({counts.approved})</option>
          <option value="rejected">{t('adminpay.rejected')} ({counts.rejected})</option>
          <option value="">{t('adminpay.all')}</option>
        </select>
      </div>

      {flash && <div className={`rounded-lg px-3 py-2 text-sm ${flash.startsWith('✓') ? 'bg-brand-blue-50 text-brand-blue' : 'bg-brand-red-50 text-brand-red'}`}>{flash}</div>}

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

      <div className="bg-white rounded-2xl border border-brand-grey-100 overflow-hidden">
        {data.payments.length === 0 && (
          <div className="p-8 text-center text-brand-grey-500 text-sm">{t('adminpay.empty')}</div>
        )}
        <div className="divide-y divide-brand-grey-100">
          {data.payments.map((p: any) => {
            const isOpen = expanded[p.order_id];
            return (
              <div key={p.order_id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-brand-grey-900">{p.user_name || p.user_id?.slice(-6)}</span>
                      <span className="text-sm text-brand-grey-500">{p.phone}</span>
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${BADGE[p.status] || 'bg-brand-grey-100 text-brand-grey-700'}`}>
                        {/* Spinna ya spring ni kwa WATUMIAJI (donate page) — admin anaona
                            status safi bila animation ya kuendelea kila mstari. */}
                        {p.status === 'verifying' ? t('adminpay.status_verifying') : p.status === 'approved' ? t('adminpay.status_approved') : t('adminpay.status_rejected')}
                      </span>
                    </div>
                    <div className="text-xs text-brand-grey-500 mt-0.5">
                      {(parseServerDate(p.created_at) || new Date()).toLocaleString('sw-TZ')} · <span className="font-mono">{p.order_id}</span>
                      {p.note && <span className="text-brand-red-500 ml-2">{t('adminpay.note')} {p.note}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-brand-grey-900">{p.amount?.toLocaleString()} TZS</div>
                    <button onClick={() => setExpanded((e) => ({ ...e, [p.order_id]: !isOpen }))} className="text-xs text-brand-blue hover:underline">
                      {isOpen ? t('adminpay.hide_sms') : t('adminpay.show_sms')}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 bg-brand-grey-50 border border-brand-grey-100 rounded-xl p-3 text-sm">
                    <div className="text-[10px] uppercase tracking-wide text-brand-grey-500 font-semibold mb-1">{t('adminpay.sms_donor')}</div>
                    <div className="whitespace-pre-wrap break-words text-brand-grey-800">{p.sms_text}</div>
                  </div>
                )}

                {p.status === 'verifying' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => act(p.order_id, true)}
                      disabled={busy === p.order_id}
                      className="btn-primary text-sm flex-1"
                    >
                      {busy === p.order_id ? <SpringSpinner size={15} label={t('adminpay.processing')} /> : t('adminpay.confirm_btn')}
                    </button>
                    <button
                      onClick={() => act(p.order_id, false)}
                      disabled={busy === p.order_id}
                      className="text-sm px-4 py-2 rounded-lg border-2 border-brand-red text-brand-red font-medium hover:bg-brand-red hover:text-white transition"
                    >
                      {t('adminpay.reject_btn')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-brand-grey-400 text-center">
        {t('adminpay.hint')}
      </p>
    </div>
  );
}
