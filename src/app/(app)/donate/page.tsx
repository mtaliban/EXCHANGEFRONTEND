'use client';

import { useEffect, useRef, useState } from 'react';
import { getDonationInfo, submitDonation, myDonations } from '@/lib/api';
import { parseServerDate } from '@/lib/dates';
import { timeAgo } from '@/lib/timeAgo';
import { useAuth } from '@/lib/auth';
import { useLive } from '@/lib/liveSocket';
import { useT, useI18n } from '@/lib/i18n';
import { Check, Copy, Heart } from 'lucide-react';
import SpringSpinner from '@/components/SpringSpinner';

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
  const [status, setStatus] = useState<'idle' | 'processing' | 'confirmed' | 'rejected' | 'expired'>('idle');
  const [history, setHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const orderRef = useRef<any>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

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

  // AUTO-SUBMIT: mtu anapoandika/kunakili SMS (code), inatumwa kwa uthibitisho
  // PAPO HAPO bila kubofya kitu — pause ya sekunde 1.2 inasubiri SMS kamili,
  // kisha ina-submit yenyewe. Hakuna button ya "Thibitisha" inayohitajika.
  const submitTimer = useRef<any>(null);
  const submittingRef = useRef(false);

  async function submit() {
    setError('');
    const text = smsText.trim();
    if (text.length < 10) { setError('Nakili SMS nzima uliyopata kutoka kwa mtandao wako.'); return; }
    submittingRef.current = true;
    setStatus('processing');
    try {
      const o = await submitDonation({ amount, phone, sms_text: text, purpose: 'donation' });
      setOrder(o);
      orderRef.current = o;
      // Expiry: dakika 15 kutoka sasa — countdown inaonekana kwa mchangiaji.
      const exp = Date.now() + 15 * 60 * 1000;
      setExpiresAt(exp);
      setCountdown(15 * 60);
    } catch (err: any) {
      submittingRef.current = false;
      setStatus('idle');
      setError(err?.response?.data?.detail || 'Kosa la mtandao. Jaribu tena.');
    }
  }

  // Auto-submit kwenye SMS textarea: pause ya 1.2s → tuma yenyewe.
  function onSmsChange(v: string) {
    setSmsText(v);
    setError('');
    if (submitTimer.current) clearTimeout(submitTimer.current);
    const t = v.trim();
    if (t.length < 10) return;
    submitTimer.current = setTimeout(() => {
      if (submittingRef.current) return;
      submit();
    }, 1200);
  }

  // COUNTDOWN: kila sekunde timer inapungua; inapofikia 0 → status 'expired'.
  useEffect(() => {
    if (status !== 'processing' || !expiresAt) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setCountdown(left);
      if (left <= 0) {
        setStatus('expired');
        submittingRef.current = false;
      }
    }, 1000);
    return () => clearInterval(id);
  }, [status, expiresAt]);

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
          {/* COUNTDOWN ya uthibitisho — mchangiaji anaona inaisha lini */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-brand-gold-200 bg-brand-gold-50 text-brand-gold-700 px-4 py-2 text-sm font-bold mb-3">
            ⏳ {t('donate.expires_in')}: {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
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
          <button onClick={reset} className="btn-primary px-6">{t('donate.donate_again')}</button>
        </div>
      )}

      {status === 'rejected' && (
        <div className="card text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-brand-red-100 text-brand-red flex items-center justify-center text-2xl mb-3">✗</div>
          <h2 className="text-xl font-bold text-brand-grey-900 dark:text-white mb-1">{t('donate.rejected_title')}</h2>
          <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400 mb-2">{t('donate.rejected_body')}</p>
          <button onClick={reset} className="btn-primary px-6">{t('donate.try_again')}</button>
        </div>
      )}

      {status === 'expired' && (
        <div className="card text-center border-2 border-brand-grey-300 dark:border-brand-grey-600">
          <div className="w-14 h-14 mx-auto rounded-full bg-brand-grey-100 text-brand-grey-500 flex items-center justify-center text-2xl mb-3">⏳</div>
          <h2 className="text-xl font-bold text-brand-grey-900 dark:text-white mb-1">{t('donate.expired_title')}</h2>
          <p className="text-sm text-brand-grey-500 dark:text-brand-grey-400 mb-3">{t('donate.expired_body')}</p>
          <button onClick={reset} className="btn-primary px-6">{t('donate.try_again')}</button>
        </div>
      )}

      {/* Form — SMS textbox chini (auto-submit) */}
      {status !== 'processing' && status !== 'confirmed' && status !== 'rejected' && status !== 'expired' ? (
        <div className="card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('donate.amount')} ({currency})</label>
              <input type="number" className="input" min={500} step={500}
                value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="5000" />
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
              onChange={(e) => onSmsChange(e.target.value)}
            />
            <div className="flex justify-between mt-1 text-xs">
              <span className="text-brand-blue-600 dark:text-brand-blue-400 flex items-center gap-1">⚡ {t('donate.auto_hint')}</span>
              <span className={`font-mono ${smsText.length > 0 ? 'text-brand-blue' : 'text-brand-grey-300'}`}>{smsText.length}/1000</span>
            </div>
          </div>

          {error && <div className="bg-brand-red-50 dark:bg-brand-red-100/20 text-brand-red rounded-lg p-2 text-sm">{error}</div>}
        </div>
      ) : null}

      {history.length > 0 && <HistoryList history={history} />}
    </div>
  );
}

function HistoryList({ history }: { history: any[] }) {
  const t = useT();
  const lang = useI18n((s) => s.lang);
  return (
    <div className="card overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-brand-grey-100 dark:border-brand-grey-200 flex items-center justify-between">
        <h3 className="font-bold text-brand-grey-900 dark:text-white">{t('donate.history')}</h3>
        <span className="text-xs font-semibold text-brand-grey-500 dark:text-brand-grey-400">{history.length} {t('donate.history_count')}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead className="bg-brand-grey-50 dark:bg-brand-grey-100 text-[11px] uppercase tracking-wide text-brand-grey-500 dark:text-brand-grey-400">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold w-10">#</th>
              <th className="px-4 py-2.5 text-left font-semibold">{t('donate.history_amount')}</th>
              <th className="px-4 py-2.5 text-left font-semibold">{t('donate.history_date')}</th>
              <th className="px-4 py-2.5 text-left font-semibold hidden sm:table-cell">{t('msg.reference')}</th>
              <th className="px-4 py-2.5 text-right font-semibold">{t('donate.history_status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-grey-100 dark:divide-brand-grey-200">
            {history.map((p, i) => {
              const ts = parseServerDate(p.created_at)?.getTime() ?? Date.now();
              const when = timeAgo(ts, lang);
              return (
                <tr key={p.order_id} className="hover:bg-brand-grey-50 dark:hover:bg-brand-grey-100/50 transition">
                  <td className="px-4 py-3 text-xs font-bold text-brand-grey-400 dark:text-brand-grey-500 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3 font-bold text-brand-grey-900 dark:text-white tabular-nums whitespace-nowrap">
                    {p.amount?.toLocaleString()} <span className="text-xs font-semibold text-brand-grey-500">TZS</span>
                  </td>
                  <td className="px-4 py-3 text-brand-grey-600 dark:text-brand-grey-300 whitespace-nowrap">{when}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="font-mono text-xs text-brand-grey-500 dark:text-brand-grey-400">{p.order_id}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
