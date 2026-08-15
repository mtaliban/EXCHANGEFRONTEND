'use client';

import { useEffect, useState } from 'react';
import { submitFeedback, myFeedback } from '@/lib/api';
import { useLive } from '@/lib/liveSocket';
import { useT } from '@/lib/i18n';
import { parseServerDate } from '@/lib/dates';
import Spinner from '@/components/Spinner';

export default function FeedbackPage() {
  const t = useT();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { subscribe } = useLive();

  async function reload() {
    try {
      const d = await myFeedback();
      setItems(d.items || []);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { reload(); }, []);

  // REAL-TIME: jibu la admin linafika PAPO HAPO bila refresh (WebSocket).
  useEffect(() => {
    const un = subscribe('notification', (p: any) => {
      if (p.type === 'feedback.replied') reload();
    });
    return () => un();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe]);

  async function submit() {
    setErr(''); setOk('');
    if (subject.trim().length < 2 || message.trim().length < 3) {
      setErr('Andika kichwa na ujumbe.'); return;
    }
    setSending(true);
    try {
      await submitFeedback({ subject: subject.trim(), message: message.trim() });
      setOk('✓ Ujumbe wako umetumwa kwa admin — utajibiwa hivi karibuni.');
      setSubject(''); setMessage('');
      reload();
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Imeshindikana kutuma — jaribu tena.');
    } finally { setSending(false); }
  }

  const inputCls = "w-full rounded-lg border border-brand-grey-300 dark:border-brand-grey-700 bg-white dark:bg-brand-grey-950 px-4 py-2.5 text-brand-grey-900 dark:text-white placeholder-brand-grey-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-grey-900 dark:text-white">💬 {t('fb.title')}</h1>
        <p className="text-brand-grey-500 dark:text-brand-grey-400 text-sm mt-1">{t('fb.subtitle')}</p>
      </div>

      <div className="card space-y-3">
        <div>
          <label className="label">{t('fb.subject_label')}</label>
          <input className={inputCls} value={subject} maxLength={120}
            onChange={(e) => setSubject(e.target.value)} placeholder={t('fb.subject_ph')} />
        </div>
        <div>
          <label className="label">{t('fb.message_label')}</label>
          <textarea className={`${inputCls} min-h-[120px]`} value={message} maxLength={2000}
            onChange={(e) => setMessage(e.target.value)} placeholder={t('fb.message_ph')} />
        </div>
        {err && <div className="bg-brand-red-50 dark:bg-brand-red-100/20 text-brand-red text-sm rounded-lg p-3">{err}</div>}
        {ok && <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-lg p-3">{ok}</div>}
        <div className="flex justify-end">
          <button onClick={submit} disabled={sending}
            className="text-xs px-4 py-1.5 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-blue-700 transition disabled:opacity-40">
            {sending ? '...' : t('fb.send')}
          </button>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-brand-grey-700 dark:text-brand-grey-300 text-sm mb-2">{t('fb.history')} ({items.length})</h2>
        {loading ? (
          <Spinner label={t('msg.loading')} className="py-6" />
        ) : items.length === 0 ? (
          <div className="text-sm text-brand-grey-500 dark:text-brand-grey-400">{t('fb.empty')}</div>
        ) : (
          <div className="space-y-2">
            {items.map((f) => (
              <div key={f.id} className="card">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-brand-grey-900 dark:text-white text-sm">{f.subject}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    f.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-brand-gold-100 text-brand-gold-600'
                  }`}>
                    {f.status === 'replied' ? '✓ ' + t('fb.replied') : t('fb.open')}
                  </span>
                </div>
                <p className="text-sm text-brand-grey-700 dark:text-brand-grey-300 whitespace-pre-wrap break-words">{f.message}</p>
                <div className="text-[11px] text-brand-grey-400 mt-1.5">
                  {f.created_at ? (parseServerDate(f.created_at) || new Date()).toLocaleString('sw-TZ') : ''}
                </div>
                {f.admin_reply && (
                  <div className="mt-2 rounded-lg bg-brand-blue-50 dark:bg-brand-blue-100/10 p-2.5">
                    <div className="text-[10px] font-bold text-brand-blue uppercase tracking-wide mb-0.5">👑 {t('fb.admin_reply')}</div>
                    <div className="text-sm text-brand-grey-800 dark:text-brand-grey-200 whitespace-pre-wrap break-words">{f.admin_reply}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
