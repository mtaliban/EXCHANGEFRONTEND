'use client';

import { useEffect, useState } from 'react';
import { adminListFeedback, adminReplyFeedback, adminDeleteFeedback } from '@/lib/api';
import { useLive } from '@/lib/liveSocket';
import { useT } from '@/lib/i18n';
import { parseServerDate } from '@/lib/dates';
import { ClipboardList } from 'lucide-react';
import { askConfirm } from '@/components/confirm';
import Spinner from '@/components/Spinner';

type Status = '' | 'open' | 'replied';

export default function AdminFeedbackPage() {
  const t = useT();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<Status>('');
  const [q, setQ] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState('');
  const [flash, setFlash] = useState('');

  const { subscribe } = useLive();

  async function load() {
    try { setData(await adminListFeedback(status, q)); } catch {}
  }
  useEffect(() => { load(); }, [status, q]);

  // REAL-TIME: maoni mapya yanafika PAPO HAPO bila refresh (WS feedback.new).
  useEffect(() => {
    const un = subscribe('notification', (p: any) => {
      if (p.type === 'feedback.new') {
        setFlash('💬 Maoni mapya yamefika!');
        setTimeout(() => setFlash(''), 4000);
        load();
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
      setFlash('✓ Jibu limetumwa kwa mtumiaji — anapata papo hapo.');
      setReplyText((prev) => ({ ...prev, [f.id]: '' }));
      load();
    } catch (e: any) {
      setFlash(`✗ ${e?.response?.data?.detail || 'Imeshindikana'}`);
    } finally { setReplying(''); }
  }

  async function del(f: any) {
    if (!(await askConfirm({ title: 'Futa maoni haya?', danger: true }))) return;
    try {
      await adminDeleteFeedback(f.id);
      setFlash('✓ Yamefutwa.');
      load();
    } catch (e: any) {
      setFlash(`✗ ${e?.response?.data?.detail || 'Imeshindikana'}`);
    }
  }

  if (!data) return <div className="p-10"><Spinner label={t('msg.loading')} /></div>;

  const counts = data.counts || { open: 0, replied: 0 };
  const items = data.items || [];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-brand-grey-900 dark:text-white flex items-center gap-2">
            <ClipboardList size={24} className="text-brand-blue" />
            {t('fbadmin.title')}
          </h1>
          <p className="text-brand-grey-500 text-sm mt-1">{t('fbadmin.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            <option value="">{t('fbadmin.all')} ({data.total})</option>
            <option value="open">{t('fbadmin.open')} ({counts.open})</option>
            <option value="replied">{t('fbadmin.replied')} ({counts.replied})</option>
          </select>
          <input className="input w-44" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={t('fbadmin.search_ph')} />
        </div>
      </div>

      {flash && <div className={`rounded-lg px-3 py-2 text-sm ${flash.startsWith('✓') ? 'bg-brand-blue-50 text-brand-blue' : 'bg-brand-red-50 text-brand-red'}`}>{flash}</div>}

      {items.length === 0 ? (
        <div className="card text-center py-10 text-brand-grey-500 text-sm">{t('fbadmin.empty')}</div>
      ) : (
        <div className="space-y-2.5">
          {items.map((f: any) => (
            <div key={f.id} className="card">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-brand-grey-900 dark:text-white text-sm truncate">{f.user_name || '—'}</span>
                  {f.user_phone && <a href={`tel:${f.user_phone}`} className="text-xs text-brand-blue hover:underline whitespace-nowrap">📞 {f.user_phone}</a>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    f.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-brand-gold-100 text-brand-gold-600'
                  }`}>
                    {f.status === 'replied' ? '✓ ' + t('fbadmin.replied') : t('fbadmin.open')}
                  </span>
                  <button onClick={() => del(f)} className="text-brand-red text-xs hover:underline">🗑</button>
                </div>
              </div>
              <div className="text-sm font-semibold text-brand-grey-800 dark:text-brand-grey-200">{f.subject}</div>
              <p className="text-sm text-brand-grey-700 dark:text-brand-grey-300 whitespace-pre-wrap break-words mt-0.5">{f.message}</p>
              <div className="text-[11px] text-brand-grey-400 mt-1.5">
                {f.created_at ? (parseServerDate(f.created_at) || new Date()).toLocaleString('sw-TZ') : ''}
              </div>

              {f.admin_reply && (
                <div className="mt-2 rounded-lg bg-brand-blue-50 dark:bg-brand-blue-100/10 p-2.5">
                  <div className="text-[10px] font-bold text-brand-blue uppercase tracking-wide mb-0.5">👑 {t('fbadmin.your_reply')}</div>
                  <div className="text-sm text-brand-grey-800 dark:text-brand-grey-200 whitespace-pre-wrap break-words">{f.admin_reply}</div>
                </div>
              )}

              <div className="mt-2.5 flex gap-2">
                <input className="input flex-1 !py-1.5 text-sm" value={replyText[f.id] || ''}
                  onChange={(e) => setReplyText((prev) => ({ ...prev, [f.id]: e.target.value }))}
                  placeholder={t('fbadmin.reply_ph')} />
                <button onClick={() => reply(f)} disabled={replying === f.id || !(replyText[f.id] || '').trim()}
                  className="text-xs px-3 py-1.5 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-blue-700 transition disabled:opacity-40">
                  {replying === f.id ? '...' : t('fbadmin.reply_btn')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
