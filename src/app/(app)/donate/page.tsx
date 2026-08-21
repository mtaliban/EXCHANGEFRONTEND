'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDonationInfo, submitDonation, myDonations, bustGetCache } from '@/lib/api';
import { parseServerDate } from '@/lib/dates';
import { timeAgo } from '@/lib/timeAgo';
import { useAuth } from '@/lib/auth';
import { useLive } from '@/lib/liveSocket';
import { useUnreadStore } from '@/lib/unreadStore';
import { useT, useI18n } from '@/lib/i18n';
import { Check, Copy, HandCoins, Phone, MessageCircle, ArrowLeft } from 'lucide-react';

const ADMIN_CALL = '0763795801';
const ADMIN_WHATSAPP = '255625607088';

type HistoryStatus = '' | 'verifying' | 'approved' | 'rejected';

export default function DonatePage() {
  const { user } = useAuth();
  const t = useT();
  const router = useRouter();
  const { subscribe } = useLive();
  const [adminPhone, setAdminPhone] = useState('');
  const [currency, setCurrency] = useState('TZS');
  const [amount, setAmount] = useState<number | ''>(2000);
  const [phone, setPhone] = useState('');
  const [smsText, setSmsText] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'sent'>('idle');
  const [history, setHistory] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<HistoryStatus>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState<{ type: 'success' | 'info'; msg: string } | null>(null);
  const orderRef = useRef<any>(null);

  useEffect(() => {
    getDonationInfo().then((info) => {
      setAdminPhone(info.phone);
      setCurrency(info.currency);
    }).catch(() => setAdminPhone('07XXXXXXXX'));
    if (user?.phone_primary) setPhone(user.phone_primary);
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Ondoa badge ya /donate pale inapofunguliwa
  useEffect(() => { useUnreadStore.getState().clear('/donate'); }, []);

  // REAL-TIME: admin approve/reject via WebSocket.
  useEffect(() => {
    const un = subscribe('notification', (p: any) => {
      const oid = orderRef.current?.order_id;
      if (p.type === 'payment.approved') {
        setFlash({ type: 'success', msg: '✓ Malipo yamethibitishwa' });
        bustGetCache();
        loadHistory();
        // SASISHA SESSION — is_verified=True → mtu aweze kupiga SMS/WA
        import('@/lib/api').then(({ getMe }) => {
          getMe().then((me: any) => useAuth.getState().setUser(me)).catch(() => {});
        });
        if (oid && p.data?.order_id === oid) {
          setTimeout(() => { setFlash(null); }, 5000);
        }
      } else if (p.type === 'payment.rejected') {
        setFlash({ type: 'info', msg: '✗ Malipo yamekataliwa' });
        bustGetCache();
        loadHistory();
        if (oid && p.data?.order_id === oid) {
          setTimeout(() => { setFlash(null); }, 8000);
        }
      } else if (p.type === 'payment.reply') {
        setFlash({ type: 'info', msg: 'Admin amejibu' });
        bustGetCache();
        loadHistory();
        setTimeout(() => { setFlash(null); }, 6000);
      } else if (p.type === 'payment.submitted') {
        bustGetCache();
        loadHistory();
      }
    });
    return () => un();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe]);

  // Baada ya submit → onyesha "✓ Imetumwa" kwa sekunde 2, kisha reset form
  useEffect(() => {
    if (status !== 'sent') return;
    const id = setTimeout(() => {
      reset();
      loadHistory();
    }, 2000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function loadHistory() {
    try { setHistory(await myDonations()); } catch {}
  }

  function copyPhone() {
    if (!adminPhone) return;
    navigator.clipboard?.writeText(adminPhone).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function submit() {
    setError('');
    const text = smsText.trim();
    if (!amount || amount < 500) { setError(t('donate.err_amount')); return; }
    if (text.length < 3) { setError(t('donate.err_sms')); return; }
    // Moja kwa moja "Sent" — hakuna spinner/processing
    setStatus('sent');
    try {
      const o = await submitDonation({ amount: amount as number, phone, sms_text: text, purpose: 'donation' });
      setOrder(o);
      orderRef.current = o;
    } catch (err: any) {
      setStatus('idle');
      setError(err?.response?.data?.detail || t('donate.err_network'));
    }
  }

  function reset() {
    orderRef.current = null;
    setOrder(null); setSmsText(''); setStatus('idle'); setError('');
  }

  const busy = status === 'sent';

  const filteredHistory = historyFilter
    ? history.filter((p) => p.status === historyFilter)
    : history;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.push('/dashboard')} className="text-brand-grey-400 hover:text-brand-grey-700 transition p-1.5 rounded-lg hover:bg-brand-grey-100">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-brand-grey-900 dark:text-white flex items-center gap-2">
            <HandCoins size={20} className="text-brand-red" />
            {t('donate.title')}
          </h1>
          <p className="text-brand-grey-500 dark:text-brand-grey-400 text-xs mt-0.5">
            {t('donate.subtitle')}
          </p>
        </div>
      </div>

      {/* Flash notification (admin approve/reject/reply) */}
      {flash && (
        <div className={`rounded-lg border px-3 py-2 text-sm font-medium animate-slide-in ${
          flash.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-brand-blue/30 bg-brand-blue-50 text-brand-blue-700'
        }`}>
          {flash.msg}
        </div>
      )}

      {/* Namba ya kuchangia */}
      <div className="card flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-brand-grey-500 dark:text-brand-grey-400 font-semibold">{t('donate.pay_to')}</div>
          <div className="text-xl font-bold text-brand-blue tracking-wide">{adminPhone}</div>
        </div>
        <button onClick={copyPhone} className={`btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1.5 flex-shrink-0 ${copied ? '!border-brand-blue !bg-brand-blue !text-white' : ''}`}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? t('donate.copied') : t('donate.copy')}
        </button>
      </div>

      {/* Form — inaonekana daima, button inabadilika tu */}
      <div className="card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">{t('donate.amount')} ({currency})</label>
            <input type="number" className="input" min={500} step={500}
              value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="2000" disabled={busy} />
          </div>
          <div>
            <label className="label">{t('donate.phone_label')}</label>
            <input type="tel" className="input" value={phone}
              onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" disabled={busy} />
          </div>
        </div>

        <div>
          <label className="label">{t('donate.sms_label')}</label>
          <textarea
            className="input min-h-[90px] resize-y"
            placeholder="C2H8MZ3JX1 Confirmed. You have received TZS 5,000.00 from JOHN KAMWENDA - 0712345678..."
            value={smsText}
            onChange={(e) => { setSmsText(e.target.value); setError(''); }}
            disabled={busy}
          />
        </div>

        {error && <div className="bg-brand-red-50 dark:bg-brand-red-100/20 text-brand-red rounded-lg p-2 text-sm">{error}</div>}

        {status === 'sent' ? (
          <button disabled className="btn-primary w-full justify-center opacity-70">
            {t('donate.sent')}
          </button>
        ) : (
          <button onClick={submit} disabled={busy}
            className="btn-primary w-full justify-center disabled:opacity-60">
            {t('donate.submit')}
          </button>
        )}
      </div>

      {/* History — kama malipo */}
      {history.length > 0 && (
        <HistoryList history={filteredHistory} allHistory={history} filter={historyFilter} setFilter={setHistoryFilter} />
      )}

      {/* Namba za admin */}
      <div className="rounded-2xl border border-brand-grey-100 dark:border-brand-grey-700 bg-white dark:bg-brand-grey-950 px-4 py-3">
        <div className="text-[10px] uppercase tracking-wide text-brand-grey-500 dark:text-brand-grey-400 font-semibold mb-2">{t('donate.help_title')}</div>
        <div className="flex flex-col sm:flex-row gap-2 text-sm">
          <a href={`tel:${ADMIN_CALL}`} className="inline-flex items-center gap-2 text-brand-grey-700 dark:text-brand-grey-300 hover:text-brand-blue transition">
            <Phone size={14} className="text-brand-blue" /> {ADMIN_CALL}
          </a>
          <a href={`https://wa.me/${ADMIN_WHATSAPP}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-brand-grey-700 dark:text-brand-grey-300 hover:text-brand-green transition">
            <MessageCircle size={14} className="text-emerald-600" /> +255 {ADMIN_WHATSAPP.slice(1, 4)} {ADMIN_WHATSAPP.slice(4, 7)} {ADMIN_WHATSAPP.slice(7)}
          </a>
        </div>
      </div>
    </div>
  );
}


/* ── HistoryList — kwa filters + chat ── */
function HistoryList({ history, allHistory, filter, setFilter }: {
  history: any[]; allHistory: any[]; filter: HistoryStatus; setFilter: (s: HistoryStatus) => void;
}) {
  const t = useT();
  const lang = useI18n((s) => s.lang);

  const counts = {
    all: allHistory.length,
    verifying: allHistory.filter((p) => p.status === 'verifying').length,
    approved: allHistory.filter((p) => p.status === 'approved').length,
    rejected: allHistory.filter((p) => p.status === 'rejected').length,
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {([
          ['', t('donate.filter_all', 'Zote'), counts.all],
          ['verifying', t('donate.st_verifying', 'Inasubiri'), counts.verifying],
          ['approved', t('donate.st_approved', 'Imekamilika'), counts.approved],
          ['rejected', t('donate.st_rejected', 'Imekataliwa'), counts.rejected],
        ] as const).map(([val, label, count]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold transition ${
              filter === val
                ? 'border-brand-blue bg-brand-blue text-white'
                : 'border-brand-grey-300 text-brand-grey-600 hover:border-brand-blue dark:border-brand-grey-600 dark:text-brand-grey-300'
            }`}>
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead className="bg-brand-grey-50 dark:bg-brand-grey-100 text-[10px] uppercase tracking-wide text-brand-grey-500 dark:text-brand-grey-400">
              <tr>
                <th className="px-4 py-2 text-left font-semibold w-10">#</th>
                <th className="px-4 py-2 text-left font-semibold">{t('donate.history_amount')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('donate.history_date')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('donate.history_status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-grey-100 dark:divide-brand-grey-200">
              {history.map((p, i) => (
                <HistoryRow key={p.order_id} p={p} index={i} />
              ))}
              {history.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-brand-grey-400 text-xs">{t('donate.empty_filter')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


/* ── HistoryRow — kila malipo (hakuna chat — Contact Admin tu) ── */
function HistoryRow({ p, index }: { p: any; index: number }) {
  const t = useT();
  const lang = useI18n((s) => s.lang);

  const ts = parseServerDate(p.created_at);
  const full = (d: Date | null) => d
    ? d.toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString(lang === 'sw' ? 'sw-TZ' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <>
      <tr className="hover:bg-brand-grey-50 dark:hover:bg-brand-grey-100/50 transition">
        <td className="px-4 py-2.5 text-xs font-bold text-brand-grey-400 dark:text-brand-grey-500 tabular-nums">{index + 1}</td>
        <td className="px-4 py-2.5 font-bold text-brand-grey-900 dark:text-white tabular-nums whitespace-nowrap">
          {p.amount?.toLocaleString()} <span className="text-xs font-semibold text-brand-grey-500">TZS</span>
        </td>
        <td className="px-4 py-2.5">
          <div className="text-brand-grey-900 dark:text-white font-medium whitespace-nowrap">{ts ? timeAgo(ts.getTime(), lang) : '—'}</div>
          <div className="text-[11px] text-brand-grey-500 dark:text-brand-grey-400 whitespace-nowrap">{full(ts)}</div>
        </td>
        <td className="px-4 py-2.5 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {p.status === 'approved' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 whitespace-nowrap">
                ✓ {t('donate.st_approved')}
              </span>
            ) : p.status === 'rejected' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-red-100 text-brand-red whitespace-nowrap">
                ✗ {t('donate.st_rejected')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-gold-100 text-brand-gold-600 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold-500 animate-pulse" />
                {t('donate.st_verifying')}
              </span>
            )}
          </div>
          {/* Rejection reason + Contact Admin */}
          {p.status === 'rejected' && p.note && (
            <div className="mt-1.5 text-right">
              <div className="text-[10px] text-brand-red">{p.note}</div>
              <a href="tel:0763795801" className="text-[10px] text-brand-blue font-semibold hover:underline">Wasiliana na Admin →</a>
            </div>
          )}
        </td>
      </tr>
    </>
  );
}
