'use client';

import { useEffect, useState } from 'react';
import { sendAnnouncement, adminListAnnouncements, adminUsers, adminDeleteAnnouncement, adminResendAnnouncement, getDepartments } from '@/lib/api';
import { conversationTime } from '@/lib/dates';
import { useT } from '@/lib/i18n';

export default function AdminAnnouncementsPage() {
  const t = useT();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [targetUser, setTargetUser] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetName, setTargetName] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
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

  // REAL-TIME SEARCH: ukiandika tu watu wanakuja PAPO HAPO (debounce 350ms),
  // ukifuta wote wanaondoka — hakuna button ya "Tafuta" tena.
  useEffect(() => {
    if (audience !== 'user' || targetUser.trim().length < 2) {
      setResults(null);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const d = await adminUsers({ q: targetUser.trim(), limit: 10 }, true);
        setResults(d.users || []);
        setTargetName('');
      } catch { setTargetName(t('ann.search_error')); }
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUser, audience]);

  function pickUser(u: any) {
    // Hifadhi _id (ObjectId) — backend inahitaji hiyo, sio namba ya simu!
    setTargetUserId(u._id);
    setTargetName(`${u.full_name} (${u.phone_primary})`);
    setResults(null);
  }

  async function submit() {
    if (!title.trim() || !message.trim()) return;
    setSending(true); setResult(null);
    try {
      const res = await sendAnnouncement({
        title: title.trim(), message: message.trim(),
        audience,
        target_user_id: audience === 'user' ? targetUserId : undefined,
      });
      setResult(`✅ ${t('ann.sent')} ${res.sent_to}`);
      setTitle(''); setMessage(''); setTargetName(''); setTargetUserId(''); setResults(null);
      reload();
    } catch (e: any) {
      setResult(`❌ ${t('ann.send_error')} ${e?.response?.data?.detail || t('msg.try_again')}`);
    } finally { setSending(false); }
  }

  // CRUD: resend (tuma tena kwa walengwa wote wa sasa) + delete.
  const [busyId, setBusyId] = useState<string | null>(null);
  async function resend(a: any) {
    if (!confirm(t('ann.resend_confirm'))) return;
    setBusyId(a.announcement_id);
    try {
      const res = await adminResendAnnouncement(a.announcement_id);
      setResult(`✅ ${t('ann.sent')} ${res.sent_to}`);
      reload();
    } catch (e: any) {
      setResult(`❌ ${t('ann.send_error')} ${e?.response?.data?.detail || t('msg.try_again')}`);
    } finally { setBusyId(null); }
  }
  async function del(a: any) {
    if (!confirm(t('ann.delete_confirm'))) return;
    setBusyId(a.announcement_id);
    try {
      await adminDeleteAnnouncement(a.announcement_id);
      setResult(`✅ ${t('ann.deleted')}`);
      reload();
    } catch (e: any) {
      setResult(`❌ ${t('ann.delete_error')} ${e?.response?.data?.detail || t('msg.try_again')}`);
    } finally { setBusyId(null); }
  }

  // Audience label ya kiswahili kwa dropdown na list
  function audienceLabel(aud: string): string {
    if (aud === 'all') return t('ann.aud_all');
    if (aud === 'user') return t('ann.aud_user');
    const d = departments.find((x) => x.code === aud);
    return d ? `${d.icon ? d.icon + ' ' : ''}${d.name}` : aud;
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
          <div className="space-y-2">
            <input className={`${inputCls}`}
              value={targetUser} onChange={(e) => { setTargetUser(e.target.value); setTargetName(''); }} placeholder={t('ann.search_ph')} />
            {targetUser.trim().length > 0 && targetUser.trim().length < 2 && (
              <div className="text-xs text-brand-grey-500">{t('ann.type_more')}</div>
            )}
            {results && results.length > 0 && (
              <div className="border border-brand-grey-200 dark:border-brand-grey-700 rounded-lg divide-y divide-brand-grey-100 dark:divide-brand-grey-700 overflow-hidden">
                {results.map((u: any) => (
                  <button key={u._id} onClick={() => pickUser(u)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-brand-blue-50 dark:hover:bg-brand-grey-800 transition flex items-center justify-between gap-2">
                    <span className="font-medium">{u.full_name}</span>
                    <span className="text-xs text-brand-grey-500">{u.phone_primary} · {u.cadre_code}</span>
                  </button>
                ))}
              </div>
            )}
            {results && results.length === 0 && <div className="text-xs text-brand-orange">{t('ann.not_found')}</div>}
            {targetName && !results && <div className="text-xs text-green-600">✓ {targetName}</div>}
            {!targetName && !results && targetUser.trim().length >= 2 && (
              <div className="text-xs text-brand-grey-400">{t('ann.searching')}</div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={submit} disabled={sending || !title.trim() || !message.trim()}
            className="btn-accent disabled:opacity-50">
            {sending ? t('ann.sending') : t('ann.send')}
          </button>
          {result && <div className="text-sm text-brand-grey-700 dark:text-brand-grey-300">{result}</div>}
        </div>
      </div>

      {/* History — table ya kisomi + CRUD (resend/delete) */}
      <div className="flex items-center justify-between mt-8 mb-2">
        <h2 className="font-semibold text-brand-grey-700 dark:text-brand-grey-300 text-sm">{t('ann.history')} ({list.length})</h2>
      </div>
      {list.length === 0 ? (
        <div className="text-brand-grey-500 text-sm">{t('ann.empty')}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-grey-100 dark:border-brand-grey-700 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-brand-grey-50 dark:bg-brand-grey-100 text-xs text-brand-grey-500">
              <tr>
                <th className="px-3 py-2 text-left">{t('ann.title_label')}</th>
                <th className="px-3 py-2 text-left">{t('ann.audience_label')}</th>
                <th className="px-3 py-2 text-left">{t('ann.to_people')}</th>
                <th className="px-3 py-2 text-left">{t('ann.sent_by')}</th>
                <th className="px-3 py-2 text-left">{t('ann.sent_at')}</th>
                <th className="px-3 py-2 text-right">{t('admin.col_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-grey-100 dark:divide-brand-grey-700">
              {list.map((a) => (
                <tr key={a.announcement_id} className="hover:bg-brand-grey-50 dark:hover:bg-brand-grey-100/50 align-top">
                  <td className="px-3 py-2.5 max-w-[280px]">
                    <div className="font-medium text-brand-grey-900 dark:text-white truncate">{a.title}</div>
                    <div className="text-xs text-brand-grey-500 dark:text-brand-grey-400 mt-0.5 line-clamp-2">{a.message}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="badge-gold">{audienceLabel(a.audience)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-semibold text-brand-blue tabular-nums">{a.recipient_count}</td>
                  <td className="px-3 py-2.5 text-xs text-brand-grey-600 dark:text-brand-grey-300">{a.created_by_name || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-brand-grey-500 whitespace-nowrap">{conversationTime(a.created_at)}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => resend(a)} disabled={busyId === a.announcement_id}
                      className="text-brand-blue text-xs px-2 hover:underline disabled:opacity-40">
                      ↺ {t('ann.resend')}
                    </button>
                    <button onClick={() => del(a)} disabled={busyId === a.announcement_id}
                      className="text-brand-red text-xs px-2 hover:underline disabled:opacity-40">
                      🗑 {t('action.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
