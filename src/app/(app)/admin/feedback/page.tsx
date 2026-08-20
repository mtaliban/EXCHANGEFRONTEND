'use client';

import { useEffect, useState } from 'react';
import { adminListFeedback, adminReplyFeedback, adminDeleteFeedback } from '@/lib/api';
import { useLive } from '@/lib/liveSocket';
import { useT } from '@/lib/i18n';
import { parseServerDate } from '@/lib/dates';
import { ClipboardList, Phone, Trash2, Send, CheckCircle2, AlertTriangle, Clock, MessageSquare, ShieldCheck } from 'lucide-react';
import { askConfirm } from '@/components/confirm';
import Spinner from '@/components/Spinner';

type Status = '' | 'open' | 'replied';
const PAGE_SIZE = 3;

export default function AdminFeedbackPage() {
  const t = useT();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<Status>('');
  const [q, setQ] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState('');
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [page, setPage] = useState(1);

  const { subscribe } = useLive();

  async function load(bypass = false) {
    try { setData(await adminListFeedback(status, q, bypass)); } catch {}
  }
  useEffect(() => { load(); }, [status, q]);
  useEffect(() => { setPage(1); }, [status, q]);

  useEffect(() => {
    const un = subscribe('notification', (p: any) => {
      if (p.type === 'feedback.new') {
        setFlash({ type: 'success', msg: 'Maoni mapya yamefika' });
        setTimeout(() => setFlash(null), 4000);
        load(true);
      }
    });
    return () => un();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, status, q]);

  async function reply(f: any) {
    const text = (replyText[f.id] || '').trim();
    if (!text) return;
    setReplying(f.id);
    try {
      await adminReplyFeedback(f.id, text);
      setFlash({ type: 'success', msg: 'Jibu limetumwa kwa mtumiaji' });
      setReplyText((prev) => ({ ...prev, [f.id]: '' }));
      load();
    } catch (e: any) {
      setFlash({ type: 'error', msg: e?.response?.data?.detail || 'Imeshindikana' });
    } finally { setReplying(''); }
  }

  async function del(f: any) {
    if (!(await askConfirm({ title: 'Futa maoni haya?', danger: true }))) return;
    try {
      await adminDeleteFeedback(f.id);
      setFlash({ type: 'success', msg: 'Yamefutwa' });
      load();
    } catch (e: any) {
      setFlash({ type: 'error', msg: e?.response?.data?.detail || 'Imeshindikana' });
    }
  }

  if (!data) return <div className="p-10"><Spinner label={t('msg.loading')} /></div>;

  const counts = data.counts || { open: 0, replied: 0 };
  const allItems = data.items || [];
  const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
  const items = allItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-brand-grey-900 dark:text-white flex items-center gap-2">
            <ClipboardList size={22} className="text-brand-blue" />
            {t('fbadmin.title')}
          </h1>
          <p className="text-brand-grey-500 text-sm mt-1">{t('fbadmin.subtitle')}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            <option value="">{t('fbadmin.all')} ({data.total})</option>
            <option value="open">{t('fbadmin.open')} ({counts.open})</option>
            <option value="replied">{t('fbadmin.replied')} ({counts.replied})</option>
          </select>
          <input className="input w-44" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={t('fbadmin.search_ph')} />
        </div>
      </div>

      {flash && (
        <div className={`flex items-center gap-2 text-xs font-semibold rounded-full px-3 py-1.5 ${flash.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-brand-red-50 text-brand-red border border-brand-red-200'}`}>
          {flash.type === 'success' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
          {flash.msg}
        </div>
      )}

      {items.length === 0 ? (
        <div className="card text-center py-10">
          <MessageSquare size={28} className="mx-auto text-brand-grey-300 mb-2" />
          <p className="text-brand-grey-500 text-sm font-medium">{t('fbadmin.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((f: any, i: number) => (
            <div key={f.id} className="bg-white rounded-xl border border-brand-grey-200 p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold text-brand-grey-400 w-5 text-center">{(page - 1) * PAGE_SIZE + i + 1}</span>
                  <span className="font-bold text-brand-grey-900 dark:text-white text-sm truncate">{f.user_name || '—'}</span>
                  {f.user_phone && <a href={`tel:${f.user_phone}`} className="inline-flex items-center gap-1 text-[11px] text-brand-blue hover:underline whitespace-nowrap"><Phone size={11} /> {f.user_phone}</a>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    f.status === 'replied' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                    {f.status === 'replied' ? <><CheckCircle2 size={10} /> {t('fbadmin.replied')}</> : <><Clock size={10} /> {t('fbadmin.open')}</>}
                  </span>
                  <button onClick={() => del(f)} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-brand-red-50 text-brand-red border border-brand-red-200 font-medium hover:bg-brand-red-100 transition">
                    <Trash2 size={10} /> Futa
                  </button>
                </div>
              </div>
              <div className="text-sm font-semibold text-brand-grey-800 dark:text-brand-grey-200">{f.subject}</div>
              <p className="text-sm text-brand-grey-700 dark:text-brand-grey-300 whitespace-pre-wrap break-words mt-0.5">{f.message}</p>
              <div className="text-[11px] text-brand-grey-400 mt-1.5 flex items-center gap-1">
                <Clock size={10} />
                {f.created_at ? (parseServerDate(f.created_at) || new Date()).toLocaleString('sw-TZ') : ''}
              </div>

              {f.admin_reply && (
                <div className="mt-2 rounded-lg bg-brand-blue-50 dark:bg-brand-blue-100/10 p-2.5">
                  <div className="text-[10px] font-bold text-brand-blue uppercase tracking-wide mb-0.5 flex items-center gap-1">
                    <ShieldCheck size={11} /> {t('fbadmin.your_reply')}
                  </div>
                  <div className="text-sm text-brand-grey-800 dark:text-brand-grey-200 whitespace-pre-wrap break-words">{f.admin_reply}</div>
                </div>
              )}

              <div className="mt-2.5 flex gap-2">
                <input className="input flex-1 !py-1.5 text-sm" value={replyText[f.id] || ''}
                  onChange={(e) => setReplyText((prev) => ({ ...prev, [f.id]: e.target.value }))}
                  placeholder={t('fbadmin.reply_ph')} />
                <button onClick={() => reply(f)} disabled={replying === f.id || !(replyText[f.id] || '').trim()}
                  className="btn-primary !text-[11px] !px-3 !py-1.5 flex items-center gap-1">
                  {replying === f.id ? '...' : <><Send size={11} /> {t('fbadmin.reply_btn')}</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination — compact: page numbers + prev/next */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2 flex-wrap">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-brand-grey-200 text-brand-grey-600 disabled:opacity-30 hover:border-brand-blue hover:text-brand-blue transition text-[11px] font-bold">
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold transition ${
                p === page
                  ? 'bg-brand-blue text-white border border-brand-blue'
                  : 'border border-brand-grey-200 text-brand-grey-600 hover:border-brand-blue hover:text-brand-blue'
              }`}>
              {p}
            </button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-brand-grey-200 text-brand-grey-600 disabled:opacity-30 hover:border-brand-blue hover:text-brand-blue transition text-[11px] font-bold">
            →
          </button>
        </div>
      )}
    </div>
  );
}
