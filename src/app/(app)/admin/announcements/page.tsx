'use client';

import { useEffect, useRef, useState } from 'react';
import { sendAnnouncement, adminListAnnouncements, adminUsers, adminDeleteAnnouncement, adminResendAnnouncement, getDepartments } from '@/lib/api';
import { conversationTime } from '@/lib/dates';
import { useT } from '@/lib/i18n';
import { API_URL } from '@/lib/config';

/**
 * REAL-TIME (event-driven): sikiliza /admin/live-events (SSE) — admin akiongeza/
 * kubadilisha/kufuta IDARA kwenye Data Management (hata kwenye tab nyingine),
 * matangazo yanapata idara mpya PAPO HAPO bila refresh ya page. Tunaangalia
 * `data.department_*` events tu (matangazo yanahitaji idara kwa audience).
 */
function useLiveDepartments(onChange: () => void) {
  const lastOwn = useRef(0);
  useEffect(() => {
    let aborter: AbortController | null = null;
    let retry: any = null;
    let stopped = false;
    async function connect() {
      try {
        const raw = sessionStorage.getItem('kv_auth');
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
                  if (Date.now() - lastOwn.current < 1500) continue; // kitendo chetu — puuza mara mbili
                  onChange();
                }
              } catch { /* sio JSON — puuza */ }
            }
          }
        }
      } catch { /* mtandao/abort — reconnect chini */ }
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
  const [result, setResult] = useState<string | null>(null);
  const [list, setList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Idara zinapakuliwa dynamic — admin akiongeza idara mpya inaonekana hapa
  // papo hapo (real-time, bila kurekebisha code).
  useEffect(() => { getDepartments().then(setDepartments).catch(() => {}); }, []);
  // REAL-TIME: idara mpya ikiongezwa/ibadilishwe/ifutwe kwenye Data Management
  // → matangazo yanapata papo hapo bila refresh (event-driven kama WebSocket).
  const liveDepts = useLiveDepartments(() => {
    getDepartments(true).then(setDepartments).catch(() => {});
  });

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
      // PAPO HAPO — tangazo jipya linaongezwa juu bila refetch (event-driven).
      setList((prev) => [{ announcement_id: 'new-' + Date.now(), title: title.trim(), message: message.trim(), audience, created_at: new Date().toISOString(), status: 'sent', sent_to: res.sent_to }, ...(prev || [])]);
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
      setList((prev) => (prev || []).map((x: any) => x.announcement_id === a.announcement_id ? { ...x, status: 'sent', sent_to: res.sent_to } : x));
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
      // PAPO HAPO — tangazo linaondolewa bila refetch (event-driven).
      setList((prev) => (prev || []).filter((x: any) => x.announcement_id !== a.announcement_id));
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

      {/* History — cards za kisomi (responsive kwa device zote) + CRUD */}
      <div className="flex items-center justify-between mt-8 mb-2">
        <h2 className="font-semibold text-brand-grey-700 dark:text-brand-grey-300 text-sm">{t('ann.history')} ({list.length})</h2>
      </div>
      {list.length === 0 ? (
        <div className="text-brand-grey-500 text-sm">{t('ann.empty')}</div>
      ) : (
        <div className="space-y-2">
          {list.map((a) => (
            <div key={a.announcement_id} className="card">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-brand-grey-900 dark:text-white text-sm">{a.title}</span>
                    <span className="badge-gold">{audienceLabel(a.audience)}</span>
                  </div>
                  <p className="text-xs text-brand-grey-600 dark:text-brand-grey-300 mt-1 whitespace-pre-wrap break-words">{a.message}</p>
                  <div className="flex items-center gap-3 flex-wrap mt-2 text-[11px] text-brand-grey-500 dark:text-brand-grey-400">
                    <span>👥 {t('ann.to_people')}: <b className="text-brand-blue">{a.recipient_count}</b></span>
                    <span>✍️ {a.created_by_name || '—'}</span>
                    <span>🕐 {conversationTime(a.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => resend(a)} disabled={busyId === a.announcement_id}
                    className="text-xs px-2.5 py-1 rounded-lg border border-brand-blue text-brand-blue hover:bg-brand-blue-50 transition disabled:opacity-40">
                    ↺ {t('ann.resend')}
                  </button>
                  <button onClick={() => del(a)} disabled={busyId === a.announcement_id}
                    className="text-xs px-2.5 py-1 rounded-lg border border-brand-red text-brand-red hover:bg-brand-red-50 transition disabled:opacity-40">
                    🗑 {t('action.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
