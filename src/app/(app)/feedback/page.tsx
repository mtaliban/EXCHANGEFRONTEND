'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitFeedback, myFeedback } from '@/lib/api';
import { useLive } from '@/lib/liveSocket';
import { useT, useI18n } from '@/lib/i18n';
import { parseServerDate } from '@/lib/dates';
import { timeAgo } from '@/lib/timeAgo';
import { ClipboardList, ArrowLeft } from 'lucide-react';
import Spinner from '@/components/Spinner';
import { useUnreadStore } from '@/lib/unreadStore';

export default function FeedbackPage() {
  const t = useT();
  const router = useRouter();
  const lang = useI18n((s) => s.lang);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fbPage, setFbPage] = useState(1);
  const FB_PAGE = 2;

  const { subscribe } = useLive();

  async function reload() {
    try {
      const d = await myFeedback();
      setItems(d.items || []);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { reload(); }, []);
  // Ondoa badge ya /feedback pale inapofunguliwa
  useEffect(() => { useUnreadStore.getState().clear('/feedback'); }, []);

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
    const text = message.trim();
    if (text.length < 3) {
      setErr('Andika maoni yako kwanza.'); return;
    }
    setSending(true);
    try {
      // Kichwa kinatokana na maoni yenyewe (wa kwanza) — mtumiaji anaandika
      // TEXT BOX MOJA tu, kisomi na rahisi.
      const subject = text.length > 60 ? `${text.slice(0, 60)}…` : text;
      await submitFeedback({ subject, message: text });
      setOk('✓ Maoni yako yametumwa kwa admin — utajibiwa hivi karibuni.');
      setMessage('');
      setSent(true);
      reload();
      setTimeout(() => setSent(false), 2000);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Imeshindikana kutuma — jaribu tena.');
    } finally { setSending(false); }
  }

  const inputCls = "w-full rounded-lg border border-brand-grey-300 dark:border-brand-grey-700 bg-white dark:bg-brand-grey-950 px-4 py-2.5 text-brand-grey-900 dark:text-white placeholder-brand-grey-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => router.push('/dashboard')} className="text-brand-grey-400 hover:text-brand-grey-700 transition p-1.5 rounded-lg hover:bg-brand-grey-100">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-brand-grey-900 dark:text-white flex items-center gap-2">
            <ClipboardList size={20} className="text-brand-blue" />
            {t('fb.title')}
          </h1>
          <p className="text-brand-grey-500 dark:text-brand-grey-400 text-xs mt-0.5">{t('fb.subtitle')}</p>
        </div>
      </div>

      <div className="card space-y-3">
        <div>
          <label className="label">{t('fb.message_label')}</label>
          <textarea className={`${inputCls} min-h-[110px]`} value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('fb.message_ph')} />
        </div>
        {err && <div className="bg-brand-red-50 dark:bg-brand-red-100/20 text-brand-red text-sm rounded-lg p-3">{err}</div>}
        {ok && <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-lg p-3">{ok}</div>}
        <div className="flex justify-end">
          <button onClick={submit} disabled={sending}
            className="text-xs px-4 py-1.5 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-blue-700 transition disabled:opacity-40 inline-flex items-center gap-1.5">
            {sending ? t('action.processing') : sent ? t('action.sent') : t('fb.send')}
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
            {(() => {
              const fbTotal = Math.max(1, Math.ceil(items.length / FB_PAGE));
              const fbSafe = Math.min(fbPage, fbTotal);
              const fbItems = items.slice((fbSafe - 1) * FB_PAGE, fbSafe * FB_PAGE);
              return (
                <>
                  {fbItems.map((f) => {
                    const created = parseServerDate(f.created_at);
                    return (
                      <div key={f.id} className="card">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            f.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-brand-gold-100 text-brand-gold-600'
                          }`}>
                            {f.status === 'replied' ? '✓ ' + t('fb.replied') : t('fb.open')}
                          </span>
                          <span className="text-[11px] text-brand-grey-400">
                            {created ? timeAgo(created.getTime(), lang) : ''}
                          </span>
                        </div>
                        <p className="text-sm text-brand-grey-700 dark:text-brand-grey-300 whitespace-pre-wrap break-words">{f.message}</p>
                        {f.admin_reply && (
                          <div className="mt-2 rounded-lg bg-brand-blue-50 dark:bg-brand-blue-100/10 p-2.5">
                            <div className="text-[10px] font-bold text-brand-blue uppercase tracking-wide mb-0.5">{t('fb.admin_reply')}</div>
                            <div className="text-sm text-brand-grey-800 dark:text-brand-grey-200 whitespace-pre-wrap break-words">{f.admin_reply}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {items.length > FB_PAGE && (
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <button type="button" disabled={fbSafe <= 1}
                        onClick={() => setFbPage(fbSafe - 1)}
                        className="min-w-[44px] min-h-[44px] px-3 rounded-xl border border-brand-grey-200 text-sm font-semibold text-brand-grey-700 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition active:scale-95">
                        ← Rudi
                      </button>
                      <span className="text-sm font-bold text-brand-grey-500 px-2">
                        {fbSafe} / {fbTotal}
                      </span>
                      <button type="button" disabled={fbSafe >= fbTotal}
                        onClick={() => setFbPage(fbSafe + 1)}
                        className="min-w-[44px] min-h-[44px] px-3 rounded-xl border border-brand-grey-200 text-sm font-semibold text-brand-grey-700 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition active:scale-95">
                        Endelea →
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
