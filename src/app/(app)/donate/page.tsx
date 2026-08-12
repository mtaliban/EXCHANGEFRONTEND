'use client';

import { useEffect, useRef, useState } from 'react';
import { getDonationInfo, submitDonation, myDonations } from '@/lib/api';
import { parseServerDate } from '@/lib/dates';
import { useAuth } from '@/lib/auth';
import { useLive } from '@/lib/liveSocket';
import { useT } from '@/lib/i18n';
import { Check, Copy, Heart } from 'lucide-react';
import SpringSpinner from '@/components/SpringSpinner';

const STATUS_STYLES: Record<string, string> = {
  verifying: 'bg-brand-gold-100 text-brand-gold-600',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  rejected: 'bg-brand-red-100 text-brand-red',
};

const STATUS_LABELS: Record<string, string> = {
  verifying: 'Inasindikwa...',
  approved: 'Imethibitishwa ✓',
  rejected: 'Imekataliwa',
};

export default function DonatePage() {
  const { user } = useAuth();
  const t = useT();
  const { subscribe } = useLive();
  const [adminPhone, setAdminPhone] = useState('');
  const [currency, setCurrency] = useState('TZS');
  const [amount, setAmount] = useState(5000);
  const [phone, setPhone] = useState('');
  const [smsText, setSmsText] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'confirmed' | 'rejected'>('idle');
  const [history, setHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
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

  // REAL-TIME: no HTTP polling — admin approve/reject arrives via WebSocket.
  useEffect(() => {
    const un = subscribe('notification', (p: any) => {
      const oid = orderRef.current?.order_id;
      if (!oid) return;
      if (p.type === 'payment.approved' && p.data?.order_id === oid) {
        setStatus('confirmed');
        loadHistory();
      } else if (p.type === 'payment.rejected' && p.data?.order_id === oid) {
        setStatus('rejected');
        loadHistory();
      }
    });
    return () => un();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe]);

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
    if (text.length < 10) { setError('Nakili SMS nzima uliyopata kutoka kwa mtandao wako.'); return; }
    setStatus('processing');
    try {
      const o = await submitDonation({ amount, phone, sms_text: text, purpose: 'donation' });
      setOrder(o);
      orderRef.current = o;
    } catch (err: any) {
      setStatus('idle');
      setError(err?.response?.data?.detail || 'Kosa la mtandao. Jaribu tena.');
    }
  }

  function reset() {
    orderRef.current = null;
    setOrder(null); setSmsText(''); setStatus('idle'); setError('');
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-grey-900 dark:text-white flex items-center gap-2">
          <Heart size={22} className="text-brand-red" />
          {t('donate.title')}
        </h1>
        <p className="text-brand-grey-500 dark:text-brand-grey-400 text-sm">
          {t('donate.subtitle')}
        </p>
      </div>

      {/* Namba ya admin — juu */}
      <div className="card text-center space-y-3">
        <div className="text-xs uppercase tracking-wide text-brand-grey-500 dark:text-brand-grey-400 font-semibold">{t('donate.pay_to')}</div>
        <div className="text-3xl md:text-4xl font-bold text-brand-blue tracking-wide">{adminPhone}</div>
        <button onClick={copyPhone} className={`btn-outline text-sm inline-flex items-center gap-2 ${copied ? '!border-brand-blue !bg-brand-blue !text-white' : ''}`}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? t('donate.copied') : t('donate.copy')}
        </button>
        <div className="bg-brand-gold-50 dark:bg-brand-gold-100/20 border border-brand-gold-100 dark:border-brand-gold-100/30 rounded-xl p-3 text-left text-sm text-brand-grey-700 dark:text-brand-grey-300 space-y-1">
          <div className="font-semibold text-brand-gold-600 dark:text-brand-gold-500">{t('donate.steps_title')}</div>
          <div>1️⃣ {t('donate.step1')}</div>
          <div>2️⃣ {t('donate.step2')}</div>
          <div>3️⃣ {t('donate.step3')}</div>
        </div>
      </div>

      {/* Processing / Confirmed / Rejected status */}
      {status === 'processing' && (
        <div className="card text-center border-2 border-brand-gold dark:border-brand-gold-400/40">
          <SpringSpinner size={56} className="mx-auto mb-4 text-brand-gold-500" />
          <h2 className="text-xl font-bold text-brand-grey-900 dark:text-white mb-1">{t('donate.processing_title')}</h2>
          <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400 mb-3">
            {t('donate.processing_body')}
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-gold-100 text-brand-gold-600 dark:bg-brand-gold-100/20 dark:text-brand-gold-500 px-4 py-1.5 text-sm font-semibold mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-brand-gold-500 animate-pulse" />
            {t('donate.processing_pill')}
          </div>
          {order && (
            <div className="bg-brand-grey-50 dark:bg-brand-grey-100 rounded-xl p-3 text-sm text-brand-grey-700 dark:text-brand-grey-300 mx-auto max-w-xs">
              <div className="flex justify-between"><span className="text-brand-grey-500">{t('donate.amount')}:</span><span className="font-semibold">{currency} {order.amount?.toLocaleString()}</span></div>
              <div className="flex justify-between mt-1"><span className="text-brand-grey-500">{t('msg.reference')}:</span><span className="font-mono text-xs">{order.order_id}</span></div>
            </div>
          )}
        </div>
      )}

      {status === 'confirmed' && (
        <div className="card text-center border-2 border-emerald-200 dark:border-emerald-500/30">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center text-2xl mb-3"><Check size={26} /></div>
          <h2 className="text-xl font-bold text-brand-grey-900 dark:text-white mb-1">{t('donate.confirmed_title')}</h2>
          <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400 mb-2">{t('donate.confirmed_body')}</p>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-4 py-1.5 text-sm font-semibold mb-2">{t('donate.verified_pill')}</div>
          {order && <p className="text-sm text-brand-grey-700 dark:text-brand-grey-300 font-semibold">{currency} {order.amount?.toLocaleString()}</p>}
          <button onClick={reset} className="btn-primary w-full mt-4">{t('donate.donate_again')}</button>
        </div>
      )}

      {status === 'rejected' && (
        <div className="card text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-brand-red-100 text-brand-red flex items-center justify-center text-2xl mb-3">✗</div>
          <h2 className="text-xl font-bold text-brand-grey-900 dark:text-white mb-1">{t('donate.rejected_title')}</h2>
          <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400 mb-2">{t('donate.rejected_body')}</p>
          <button onClick={reset} className="btn-primary w-full">{t('donate.try_again')}</button>
        </div>
      )}

      {/* Form — SMS textbox chini */}
      {status !== 'processing' && status !== 'confirmed' && status !== 'rejected' ? (
        <div className="card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('donate.amount')} ({currency})</label>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[1000, 5000, 10000, 20000].map((a) => (
                  <button key={a} onClick={() => setAmount(a)}
                    className={`p-1.5 rounded-lg border text-xs font-semibold transition ${amount === a ? 'bg-brand-blue text-white border-brand-blue' : 'border-brand-grey-200 dark:border-brand-grey-600 text-brand-grey-700 dark:text-brand-grey-300 hover:border-brand-blue'}`}>
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>
              <input type="number" className="input" min={500} step={500}
                value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">{t('donate.phone_label')}</label>
              <input type="tel" className="input" value={phone}
                onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" />
            </div>
          </div>

          <div>
            <label className="label">{t('donate.sms_label')}</label>
            <textarea
              className="input min-h-[110px] resize-y"
              placeholder="Mfano: C2H8MZ3JX1 Confirmed. You have received TZS 5,000.00 from JOHN KAMWENDA - 0712345678 on 08/08/2026 at 10:30..."
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
            />
            <div className="flex justify-between mt-1 text-xs">
              <span className="text-brand-grey-500 dark:text-brand-grey-400">{t('donate.sms_hint')}</span>
              <span className={`font-mono ${smsText.length > 0 ? 'text-brand-blue' : 'text-brand-grey-300'}`}>{smsText.length}/1000</span>
            </div>
          </div>

          {error && <div className="bg-brand-red-50 dark:bg-brand-red-100/20 text-brand-red rounded-lg p-2 text-sm">{error}</div>}

          <button onClick={submit} disabled={!smsText.trim()}
            className="btn-accent w-full text-lg py-3 disabled:opacity-50">
            {t('donate.submit')}
          </button>
        </div>
      ) : null}

      {history.length > 0 && <HistoryList history={history} />}
    </div>
  );
}

function HistoryList({ history }: { history: any[] }) {
  const t = useT();
  return (
    <div className="card">
      <h3 className="font-bold text-brand-grey-900 dark:text-white mb-2">{t('donate.history')}</h3>
      <div className="divide-y divide-brand-grey-100 dark:divide-brand-grey-200">
        {history.map((p) => (
          <div key={p.order_id} className="flex items-center justify-between py-2 text-sm">
            <div>
              <div className="font-medium text-brand-grey-900 dark:text-white">{p.amount?.toLocaleString()} TZS</div>
              <div className="text-xs text-brand-grey-500 dark:text-brand-grey-400">
                {(parseServerDate(p.created_at) || new Date()).toLocaleString('sw-TZ')}
                {' · '}<span className="font-mono">{p.order_id}</span>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[p.status] || 'bg-brand-grey-100 text-brand-grey-700'}`}>
              {STATUS_LABELS[p.status] || p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
