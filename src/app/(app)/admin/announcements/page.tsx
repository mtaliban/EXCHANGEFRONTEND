'use client';

import { useEffect, useRef, useState } from 'react';
import { sendAnnouncement, adminListAnnouncements, adminUsers, adminDeleteAnnouncement, adminResendAnnouncement, getDepartments } from '@/lib/api';
import { conversationTime } from '@/lib/dates';
import { useT } from '@/lib/i18n';
import { API_URL } from '@/lib/config';
import {
  Megaphone, Send, Trash2, RefreshCw, Users, Clock, User, Search,
  CheckCircle2, AlertTriangle, Loader2, Plus, ChevronLeft, ChevronRight,
} from 'lucide-react';

function useLiveDepartments(onChange: () => void) {
  const lastOwn = useRef(0);
  useEffect(() => {
    let aborter: AbortController | null = null;
    let retry: any = null;
    let stopped = false;
    async function connect() {
      try {
        const raw = localStorage.getItem('kv_auth');
        let token: string | null = null;
        try { token = raw ? (JSON.parse(raw)?.state?.token || null) : null; } catch {}
        aborter = new AbortController();
        const res = await fetch(`${API_URL}/admin/live-events`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: aborter.signal,
        });
        if (!res.ok || !res.body) throw new Error('feed failed');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const chunk = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const line = chunk.split('\n').find((l) => l.startsWith('data: '));
            if (line) {
              try {
                const ev = JSON.parse(line.slice(6));
                if (ev?.event_type?.startsWith('data.department')) {
                  if (Date.now() - lastOwn.current < 1500) continue;
                  onChange();
                }
              } catch {}
            }
          }
        }
      } catch {}
      if (!stopped) retry = setTimeout(connect, 3000);
    }
    connect();
    return () => {
      stopped = true;
      aborter?.abort();
      if (retry) clearTimeout(retry);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { markOwn: () => { lastOwn.current = Date.now(); } };
}

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
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [list, setList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const PAGE_SIZE = 3;

  useEffect(() => { getDepartments().then(setDepartments).catch(() => {}); }, []);
  const liveDepts = useLiveDepartments(() => {
    getDepartments(true).then(setDepartments).catch(() => {});
  });

  async function reload() {
    try { const d = await adminListAnnouncements(); setList(d.announcements); } catch {}
  }
  useEffect(() => { reload(); }, []);

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
      setResult({ type: 'success', msg: `${t('ann.sent')} ${res.sent_to} walengwa` });
      setTitle(''); setMessage(''); setTargetName(''); setTargetUserId(''); setResults(null);
      // Reload list kutoka backend kupata announcement_id halisi (sio 'new-...')
      reload();
    } catch (e: any) {
      setResult({ type: 'error', msg: `${t('ann.send_error')} ${e?.response?.data?.detail || t('msg.try_again')}` });
    } finally { setSending(false); }
  }

  const [busyId, setBusyId] = useState<string | null>(null);
  async function resend(a: any) {
    setBusyId(a.announcement_id);
    try {
      const res = await adminResendAnnouncement(a.announcement_id);
      setResult({ type: 'success', msg: `${t('ann.sent')} ${res.sent_to} walengwa` });
      setList((prev) => (prev || []).map((x: any) => x.announcement_id === a.announcement_id ? { ...x, status: 'sent', sent_to: res.sent_to } : x));
    } catch (e: any) {
      setResult({ type: 'error', msg: `${t('ann.send_error')} ${e?.response?.data?.detail || t('msg.try_again')}` });
    } finally { setBusyId(null); }
  }
  async function del(a: any) {
    setBusyId(a.announcement_id);
    try {
      await adminDeleteAnnouncement(a.announcement_id);
      setResult({ type: 'success', msg: t('ann.deleted') });
      setList((prev) => (prev || []).filter((x: any) => x.announcement_id !== a.announcement_id));
    } catch (e: any) {
      setResult({ type: 'error', msg: `${t('ann.delete_error')} ${e?.response?.data?.detail || t('msg.try_again')}` });
    } finally { setBusyId(null); }
  }

  function audienceLabel(aud: string): string {
    if (aud === 'all') return t('ann.aud_all');
    if (aud === 'user') return t('ann.aud_user');
    const d = departments.find((x) => x.code === aud);
    return d ? d.name : aud;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-brand-grey-900 dark:text-white flex items-center gap-2">
          <Megaphone size={22} className="text-brand-blue" />
          {t('ann.title')}
        </h1>
        <p className="text-brand-grey-500 dark:text-brand-grey-400 text-sm mt-1">
          {t('ann.subtitle')}
        </p>
      </div>

      {/* Form ya kutuma tangazo */}
      <div className="bg-white rounded-xl border border-brand-grey-200 p-4 space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-brand-grey-500 mb-1.5 block">{t('ann.title_label')}</label>
          <input className="input"
            value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('ann.title_ph')} maxLength={120} />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-brand-grey-500 mb-1.5 block">{t('ann.message_label')}</label>
          <textarea className="input min-h-[100px]"
            value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('ann.message_ph')} maxLength={2000} />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-brand-grey-500 mb-1.5 block">{t('ann.audience_label')}</label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { v: 'all', label: t('ann.aud_all') },
              ...departments.map((d) => ({ v: d.code, label: d.name })),
              { v: 'user', label: t('ann.aud_user') },
            ].map((o) => (
              <button key={o.v} onClick={() => setAudience(o.v)}
                className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold transition border ${
                  audience === o.v
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : 'border-brand-grey-200 text-brand-grey-600 hover:border-brand-blue hover:bg-brand-blue-50'
                }`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {audience === 'user' && (
          <div className="space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey-400" />
              <input className="input pl-9"
                value={targetUser} onChange={(e) => { setTargetUser(e.target.value); setTargetName(''); }} placeholder={t('ann.search_ph')} />
            </div>
            {targetUser.trim().length > 0 && targetUser.trim().length < 2 && (
              <div className="text-xs text-brand-grey-500">{t('ann.type_more')}</div>
            )}
            {results && results.length > 0 && (
              <div className="border border-brand-grey-200 rounded-lg divide-y divide-brand-grey-100 overflow-hidden">
                {results.map((u: any) => (
                  <button key={u._id} onClick={() => pickUser(u)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-brand-blue-50 transition flex items-center justify-between gap-2">
                    <span className="font-medium text-brand-grey-900">{u.full_name}</span>
                    <span className="text-[11px] text-brand-grey-500">{u.phone_primary} · {u.cadre_code}</span>
                  </button>
                ))}
              </div>
            )}
            {results && results.length === 0 && <div className="text-xs text-orange-600 flex items-center gap-1"><AlertTriangle size={12} /> {t('ann.not_found')}</div>}
            {targetName && !results && <div className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> {targetName}</div>}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={submit} disabled={sending || !title.trim() || !message.trim()}
            className="btn-primary flex items-center gap-1.5">
            {sending ? <><Loader2 size={13} className="animate-spin" /> {t('ann.sending')}</> : <><Send size={13} /> {t('ann.send')}</>}
          </button>
          {result && (
            <div className={`text-xs font-semibold flex items-center gap-1.5 ${result.type === 'success' ? 'text-green-600' : 'text-brand-red'}`}>
              {result.type === 'success' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              {result.msg}
            </div>
          )}
        </div>
      </div>

      {/* History — paginated */}
      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-brand-grey-500 flex items-center gap-1.5">
          <Clock size={13} /> {t('ann.history')} ({list.length})
        </h2>
      </div>
      {list.length === 0 ? (
        <div className="card text-center py-8">
          <Megaphone size={28} className="mx-auto text-brand-grey-300 mb-2" />
          <p className="text-sm text-brand-grey-500 font-medium">{t('ann.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE).map((a) => (
            <div key={a.announcement_id} className="bg-white dark:bg-brand-grey-900 rounded-xl border border-brand-grey-200 dark:border-brand-grey-700 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Megaphone size={14} className="text-brand-grey-400 flex-shrink-0" />
                    <span className="font-bold text-brand-grey-900 dark:text-white text-sm">{a.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-grey-100 dark:bg-brand-grey-800 text-brand-grey-600 dark:text-brand-grey-300 font-semibold">
                      {audienceLabel(a.audience)}
                    </span>
                  </div>
                  <p className="text-[13px] text-brand-grey-700 dark:text-brand-grey-300 mt-2 whitespace-pre-wrap break-words leading-relaxed">{a.message}</p>
                  <div className="flex items-center gap-3 flex-wrap mt-3 text-[11px] text-brand-grey-500 dark:text-brand-grey-400">
                    <span className="inline-flex items-center gap-1"><Users size={11} /> {t('ann.to_people')}: <b className="text-brand-grey-800 dark:text-brand-grey-200">{a.recipient_count}</b></span>
                    <span className="inline-flex items-center gap-1"><User size={11} /> {a.created_by_name || '—'}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={11} /> {conversationTime(a.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => resend(a)} disabled={busyId === a.announcement_id}
                    className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-blue-50 text-brand-blue-700 font-semibold border border-brand-blue-200 hover:bg-brand-blue-100 transition disabled:opacity-40">
                    <RefreshCw size={11} /> {t('ann.resend')}
                  </button>
                  <button onClick={() => del(a)} disabled={busyId === a.announcement_id}
                    className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-red-50 text-brand-red font-semibold border border-brand-red-200 hover:bg-brand-red-100 transition disabled:opacity-40">
                    <Trash2 size={11} /> {t('action.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History pagination */}
      {list.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 pt-3">
          <button disabled={historyPage <= 1} onClick={() => setHistoryPage(historyPage - 1)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-brand-grey-200 text-brand-grey-600 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-brand-grey-500 px-2">{historyPage} / {Math.ceil(list.length / PAGE_SIZE)}</span>
          <button disabled={historyPage >= Math.ceil(list.length / PAGE_SIZE)} onClick={() => setHistoryPage(historyPage + 1)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-brand-grey-200 text-brand-grey-600 disabled:opacity-40 hover:border-brand-blue hover:text-brand-blue transition">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
