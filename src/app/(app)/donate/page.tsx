'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDonationInfo, submitDonation, myDonations } from '@/lib/api';
import { parseServerDate } from '@/lib/dates';
import { timeAgo } from '@/lib/timeAgo';
import { useAuth } from '@/lib/auth';
import { useLive } from '@/lib/liveSocket';
import { useT, useI18n } from '@/lib/i18n';
import { Check, Copy, HandCoins, Phone, MessageCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import SpringSpinner from '@/components/SpringSpinner';

const ADMIN_CALL = '0763795801';
const ADMIN_WHATSAPP = '255625607088';

/** Ficha namba: "0763795801" → "0763 *** 5801" */
function maskPhone(p: string) {
  if (!p || p.length < 7) return p;
  return p.slice(0, 4) + ' *** ' + p.slice(-4);
}

export default function DonatePage() {
  const { user } = useAuth();
  const t = useT();
  const router = useRouter();
  const { subscribe } = useLive();
  const [adminPhone, setAdminPhone] = useState('');
  const [currency, setCurrency] = useState('TZS');
  const [phone, setPhone] = useState('');
  const [smsText, setSmsText] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'processing' | 'pending' | 'confirmed' | 'rejected'>('idle');
  const [history, setHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [phoneRevealed, setPhoneRevealed] = useState(false);
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

  // REAL-TIME: admin approve/reject via WebSocket.
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

  // AUTO-PROCESS: kama admin hayupo, mchango unaprocessed baada ya sekunde 10 → pending
  useEffect(() => {
    if (status !== 'processing' || !order) return;
    const id = setTimeout(() => {
      setStatus('pending');
      loadHistory();
    }, 10000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, order]);

  useEffect(() => {
    if (status !== 'confirmed') return;
    const id = setTimeout(() => {
      reset();
      loadHistory();
      router.push('/dashboard');
    }, 2500);
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

  const submittingRef = useRef(false);

  async function submit() {
    setError('');
    const text = smsText.trim();
    if (text.length < 3) { setError('Andika au nakili SMS yoyote uliyopata kutoka kwa mtandao wako.'); return; }
    submittingRef.current = true;
    setStatus('sending');
    try {
      // Amount default 2000 (haina field tena — mtumiaji alipa kiasi yoyote)
      const o = await submitDonation({ amount: 2000, phone, sms_text: text, purpose: 'donation' });
      setOrder(o);
      orderRef.current = o;
    } catch (err: any) {
      submittingRef.current = false;
      setStatus('idle');
      setError(err?.response?.data?.detail || 'Kosa la mtandao. Jaribu tena.');
    }
  }

  function onSmsChange(v: string) {
    setSmsText(v);
    setError('');
  }

  function reset() {
    orderRef.current = null;
    setOrder(null); setSmsText(''); setStatus('idle'); setError('');
  }

  const busy = status === 'sending' || status === 'processing';

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

      {/* Namba ya kuchangia — hidden kwa default, reveal kwa bofya */}
      <div className="card flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-brand-grey-500 dark:text-brand-grey-400 font-semibold">{t('donate.pay_to')}</div>
          <div className="text-xl font-bold text-brand-blue tracking-wide font-mono">
            {phoneRevealed ? adminPhone : maskPhone(adminPhone)}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => setPhoneRevealed((v) => !v)}
            className="btn-outline text-xs px-2.5 py-1.5 inline-flex items-center gap-1" title={phoneRevealed ? 'Ficha namba' : 'Onyesha namba'}>
            {phoneRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button onClick={copyPhone} className={`btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1.5 flex-shrink-0 ${copied ? '!border-brand-blue !bg-brand-blue !text-white' : ''}`}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? t('donate.copied') : t('donate.copy')}
          </button>
        </div>
      </div>

      {/* Hatua: jinsi ya kulipa — maelekezo ya kisomi */}
      <div className="rounded-xl border border-brand-blue/20 bg-brand-blue-50 dark:bg-brand-blue-900/20 px-4 py-3">
        <div className="text-[11px] font-bold text-brand-blue mb-1.5">Jinsi ya Kulipa</div>
        <ol className="text-xs text-brand-grey-700 dark:text-brand-grey-300 space-y-1 list-decimal list-inside">
          <li>Lipa kwa namba hapo juu (M-Pesa, Tigo Pesa, Airtel Money, Halopesa)</li>
          <li>Nakili SMS ya uthibitisha uliopata kutoka kwa mtandao wako</li>
          <li>Bandika SMS hapo chini na ubofye &ldquo;Thibitisha&rdquo;</li>
        </ol>
      </div>

      {/* STATUS: confirmed / pending / rejected — show outside form */}
      {status === 'confirmed' && (
        <div className="card rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-100/20 px-3 py-2.5 text-center">
          <div className="text-sm font-bold text-emerald-700">✓ {t('donate.confirmed_title')}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{t('donate.confirmed_body')}</div>
        </div>
      )}
      {status === 'pending' && (
        <div className="card rounded-xl border border-brand-gold-400 bg-brand-gold-50 dark:bg-brand-gold-100/20 px-3 py-2.5">
          <div className="text-sm font-bold text-brand-gold-600">⏳ Inasubiri Kuthibitishwa</div>
          <div className="text-xs text-brand-gold-700 dark:text-brand-gold-500 mt-0.5">Malipo yako yamewasilishwa. Admin atathibitisha hivi karibuni.</div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => { reset(); router.push('/dashboard'); }} className="text-xs px-3 py-1.5 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-blue-700 transition">
              {t('donate.back_dashboard')}
            </button>
          </div>
        </div>
      )}
      {status === 'rejected' && (
        <div className="card rounded-xl border border-brand-red-200 bg-brand-red-50 dark:bg-brand-red-100/20 px-3 py-2.5">
          <div className="text-sm font-bold text-brand-red">✗ {t('donate.rejected_title')}</div>
          <div className="text-xs text-brand-red-600 dark:text-brand-red-400 mt-0.5">{t('donate.rejected_body')}</div>
          <div className="flex gap-2 mt-2">
            <button onClick={reset} className="text-xs px-3 py-1.5 rounded-lg border border-brand-red text-brand-red font-semibold hover:bg-brand-red hover:text-white transition">
              {t('donate.try_again')}
            </button>
            <button onClick={() => router.push('/dashboard')} className="text-xs px-3 py-1.5 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-blue-700 transition">
              {t('donate.back_dashboard')}
            </button>
          </div>
        </div>
      )}

      {/* Form — SMS tu (kiasi ni default 2000, mtumiaji alipa kiasi yoyote) */}
      {status === 'idle' && (
      <div className="card space-y-3">
        <div>
          <label className="label">{t('donate.phone_label')}</label>
          <input type="tel" className="input" value={phone}
            onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" disabled={busy} />
        </div>

        <div>
          <label className="label">{t('donate.sms_label')}</label>
          <textarea
            className="input min-h-[90px] resize-y"
            placeholder="C2H8MZ3JX1 Confirmed. You have received TZS 5,000.00 from JOHN KAMWENDA - 0712345678..."
            value={smsText}
            onChange={(e) => onSmsChange(e.target.value)}
            disabled={busy}
          />
        </div>

        {error && <div className="bg-brand-red-50 dark:bg-brand-red-100/20 text-brand-red rounded-lg p-2 text-sm">{error}</div>}

        <button onClick={submit} disabled={busy}
          className="btn-primary w-full justify-center disabled:opacity-60">
          {t('donate.submit')}
        </button>
      </div>
      )}

      {/* SENDING / PROCESSING — spinner bar */}
      {busy && (
        <div className="card flex items-center justify-center gap-2 py-4">
          <SpringSpinner size={20} className="text-brand-blue" />
          <span className="text-sm font-semibold text-brand-grey-700">{status === 'sending' ? 'Inatuma…' : 'Inasindikwa…'}</span>
        </div>
      )}

      {history.length > 0 && <HistoryList history={history} />}

      {/* Namba za admin — onyesha kama mask, GUIDE badala ya direct link */}
      <div className="rounded-2xl border border-brand-grey-100 dark:border-brand-grey-700 bg-white dark:bg-brand-grey-950 px-4 py-3">
        <div className="text-[10px] uppercase tracking-wide text-brand-grey-500 dark:text-brand-grey-400 font-semibold mb-2">{t('donate.help_title')}</div>
        <div className="space-y-2 text-xs text-brand-grey-600 dark:text-brand-grey-400">
          <div className="flex items-center gap-2">
            <Phone size={13} className="text-brand-blue flex-shrink-0" />
            <span>Simu: <span className="font-mono font-bold text-brand-grey-800 dark:text-brand-grey-200">{maskPhone(ADMIN_CALL)}</span> — Piga kwa maswali yoyote</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle size={13} className="text-emerald-600 flex-shrink-0" />
            <span>WhatsApp: <span className="font-mono font-bold text-brand-grey-800 dark:text-brand-grey-200">+255 {ADMIN_WHATSAPP.slice(1, 4)} *** {ADMIN_WHATSAPP.slice(7)}</span> — Tuma ujumbe kwa msaada</span>
          </div>
          <p className="text-[10px] text-brand-grey-400 dark:text-brand-grey-500 mt-1">💡 Kabla ya kupiga simu, hakikisha umepata SMS ya uthibitisho na kuibandika hapo juu.</p>
        </div>
      </div>
    </div>
  );
}

function HistoryList({ history }: { history: any[] }) {
  const t = useT();
  const lang = useI18n((s) => s.lang);
  return (
    <div className="card overflow-hidden">
      <div className="px-4 pt-3 pb-2.5 border-b border-brand-grey-100 dark:border-brand-grey-200 flex items-center justify-between">
        <h3 className="font-bold text-brand-grey-900 dark:text-white text-sm">{t('donate.history')}</h3>
        <span className="text-xs font-semibold text-brand-grey-500 dark:text-brand-grey-400">{history.length} {t('donate.history_count')}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-brand-grey-50 dark:bg-brand-grey-100 text-[10px] uppercase tracking-wide text-brand-grey-500 dark:text-brand-grey-400">
            <tr>
              <th className="px-4 py-2 text-left font-semibold w-10">#</th>
              <th className="px-4 py-2 text-left font-semibold">{t('donate.history_amount')}</th>
              <th className="px-4 py-2 text-left font-semibold">{t('donate.history_date')}</th>
              <th className="px-4 py-2 text-left font-semibold hidden sm:table-cell">{t('donate.paid_at')}</th>
              <th className="px-4 py-2 text-right font-semibold">{t('donate.history_status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-grey-100 dark:divide-brand-grey-200">
            {history.map((p, i) => {
              const ts = parseServerDate(p.created_at);
              const paidTs = parseServerDate(p.status === 'approved' ? p.approved_at : p.status === 'rejected' ? p.rejected_at : null);
              const full = (d: Date | null) => d
                ? d.toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  + ' ' + d.toLocaleTimeString(lang === 'sw' ? 'sw-TZ' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
                : '—';
              return (
                <tr key={p.order_id} className="hover:bg-brand-grey-50 dark:hover:bg-brand-grey-100/50 transition">
                  <td className="px-4 py-2.5 text-xs font-bold text-brand-grey-400 dark:text-brand-grey-500 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2.5 font-bold text-brand-grey-900 dark:text-white tabular-nums whitespace-nowrap">
                    {p.amount?.toLocaleString()} <span className="text-xs font-semibold text-brand-grey-500">TZS</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="text-brand-grey-900 dark:text-white font-medium whitespace-nowrap">{ts ? timeAgo(ts.getTime(), lang) : '—'}</div>
                    <div className="text-[11px] text-brand-grey-500 dark:text-brand-grey-400 whitespace-nowrap">{full(ts)}</div>
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    {paidTs ? (
                      <>
                        <div className="text-brand-grey-700 dark:text-brand-grey-300 font-medium whitespace-nowrap">
                          {p.status === 'approved' ? '✓' : '✗'} {timeAgo(paidTs.getTime(), lang)}
                        </div>
                        <div className="text-[11px] text-brand-grey-500 dark:text-brand-grey-400 whitespace-nowrap">{full(paidTs)}</div>
                      </>
                    ) : (
                      <span className="text-brand-grey-400 dark:text-brand-grey-500 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
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
