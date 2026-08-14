'use client';

import { useEffect, useState } from 'react';
import { sendAnnouncement, adminListAnnouncements, adminUsers, getDepartments } from '@/lib/api';
import { conversationTime } from '@/lib/dates';
import { useT } from '@/lib/i18n';

export default function AdminAnnouncementsPage() {
  const t = useT();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [targetUser, setTargetUser] = useState('');
  const [targetName, setTargetName] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [list, setList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Idara zinapakuliwa dynamic — admin akiongeza idara mpya inaonekana hapa
  // papo hapo (real-time, bila kurekebisha code).
  useEffect(() => { getDepartments().then(setDepartments).catch(() => {}); }, []);

  async function reload() {
    try { const d = await adminListAnnouncements(); setList(d.announcements); } catch {}
  }
  useEffect(() => { reload(); }, []);

  async function findUser() {
    if (!targetUser.trim()) return;
    try {
      const d = await adminUsers({ q: targetUser.trim(), limit: 5 });
      const u = d.users?.[0];
      if (u) { setTargetUser(u.phone_primary); setTargetName(`${u.full_name} (${u.phone_primary})`); }
      else setTargetName(t('ann.not_found'));
    } catch { setTargetName(t('ann.search_error')); }
  }

  async function submit() {
    if (!title.trim() || !message.trim()) return;
    setSending(true); setResult(null);
    try {
      const res = await sendAnnouncement({
        title: title.trim(), message: message.trim(),
        audience,
        target_user_id: audience === 'user' ? targetUser : undefined,
      });
      setResult(`✅ ${t('ann.sent')} ${res.sent_to}`);
      setTitle(''); setMessage(''); setTargetName('');
      reload();
    } catch (e: any) {
      setResult(`❌ ${t('ann.send_error')} ${e?.response?.data?.detail || t('msg.try_again')}`);
    } finally { setSending(false); }
  }

  const inputCls = "w-full rounded-lg border border-brand-grey-300 dark:border-brand-grey-700 bg-white dark:bg-brand-grey-950 px-4 py-2.5 text-brand-grey-900 dark:text-white placeholder-brand-grey-500 focus:outline-none focus:ring-2 focus:ring-brand-blue";

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-brand-grey-900 dark:text-white">{t('ann.title')}</h1>
        <p className="text-brand-grey-500 dark:text-brand-grey-400 text-sm mt-1">
          {t('ann.subtitle')}
        </p>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-semibold text-brand-grey-700 dark:text-brand-grey-300 mb-1.5">{t('ann.title_label')}</label>
          <input className={inputCls}
            value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('ann.title_ph')} maxLength={120} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-grey-700 dark:text-brand-grey-300 mb-1.5">{t('ann.message_label')}</label>
          <textarea className={`${inputCls} min-h-[100px]`}
            value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('ann.message_ph')} maxLength={2000} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-grey-700 dark:text-brand-grey-300 mb-1.5">{t('ann.audience_label')}</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { v: 'all', label: t('ann.aud_all') },
              ...departments.map((d) => ({ v: d.code, label: `${d.icon ? `${d.icon} ` : ''}${d.name}` })),
              { v: 'user', label: t('ann.aud_user') },
            ].map((o) => (
              <button key={o.v} onClick={() => setAudience(o.v)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  audience === o.v
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : 'border-brand-grey-200 dark:border-brand-grey-700 text-brand-grey-700 dark:text-brand-grey-300 hover:border-brand-blue'
                }`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {audience === 'user' && (
          <div className="flex gap-2">
            <input className={`${inputCls} flex-1`}
              value={targetUser} onChange={(e) => setTargetUser(e.target.value)} placeholder={t('ann.search_ph')} />
            <button onClick={findUser}
              className="px-4 py-2 rounded-lg border border-brand-grey-300 dark:border-brand-grey-700 text-brand-grey-700 dark:text-brand-grey-300 hover:border-brand-blue transition text-sm">
              {t('ann.search')}
            </button>
          </div>
        )}
        {targetName && <div className="text-xs text-brand-orange">{targetName}</div>}

        <div className="flex items-center gap-3">
          <button onClick={submit} disabled={sending || !title.trim() || !message.trim()}
            className="btn-accent disabled:opacity-50">
            {sending ? t('ann.sending') : t('ann.send')}
          </button>
          {result && <div className="text-sm text-brand-grey-700 dark:text-brand-grey-300">{result}</div>}
        </div>
      </div>

      {/* History */}
      <h2 className="font-semibold text-brand-grey-700 dark:text-brand-grey-300 text-sm mb-2 mt-8">{t('ann.history')} ({list.length})</h2>
      <div className="space-y-2">
        {list.length === 0 && <div className="text-brand-grey-500 text-sm">{t('ann.empty')}</div>}
        {list.map((a) => (
          <div key={a.announcement_id} className="card !py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-sm text-brand-grey-900 dark:text-white">{a.title}</div>
              <div className="text-xs text-brand-grey-500 flex-shrink-0">{conversationTime(a.created_at)}</div>
            </div>
            <div className="text-xs text-brand-grey-500 dark:text-brand-grey-400 mt-1 line-clamp-2">{a.message}</div>
            <div className="text-[11px] text-brand-grey-500 mt-1">
              {a.audience} · {t('ann.to_people')} {a.recipient_count} · {t('ann.dismissed')} {a.dismissed_count} · {a.created_by_name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
