'use client';

import { useEffect, useState } from 'react';
import {
  adminListPasswordResets, adminApprovePasswordReset, adminRejectPasswordReset,
} from '@/lib/api';
import { API_URL } from '@/lib/config';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';
import {
  KeyRound, CheckCircle2, XCircle, Clock, User, Phone, AlertTriangle,
  ShieldCheck, Loader2, RefreshCw,
} from 'lucide-react';

type Status = 'pending' | 'approved' | 'rejected';

export default function AdminPasswordResetsPage() {
  const t = useT();
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<Status>('pending');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  async function load(bypass = false) {
    try {
      const data = await adminListPasswordResets(status, bypass);
      setItems(data.items || []);
      setCounts(data.counts || {});
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [status]);

  // REAL-TIME: SSE feed — password reset request mpya inaonekana papo hapo
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
                if (ev?.event_type?.startsWith('user.password_reset')) {
                  load(true); // bust cache + refresh list papo hapo
                }
              } catch {}
            }
          }
        }
      } catch {}
      if (!stopped) retry = setTimeout(connect, 3000);
    }
    connect();
    return () => { stopped = true; aborter?.abort(); if (retry) clearTimeout(retry); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function approve(id: string) {
    setBusyId(id); setFlash(null);
    try {
      await adminApprovePasswordReset(id);
      setFlash({ type: 'success', msg: 'Ombi limekubaliwa' });
      load();
    } catch (e: any) {
      setFlash({ type: 'error', msg: e?.response?.data?.detail || 'Imeshindikana' });
    }
    setBusyId(null);
    setTimeout(() => setFlash(null), 3000);
  }

  async function reject(id: string) {
    setBusyId(id); setFlash(null);
    try {
      await adminRejectPasswordReset(id);
      setFlash({ type: 'success', msg: 'Ombi limekataliwa' });
      load();
    } catch (e: any) {
      setFlash({ type: 'error', msg: e?.response?.data?.detail || 'Imeshindikana' });
    }
    setBusyId(null);
    setTimeout(() => setFlash(null), 3000);
  }

  if (loading) return <div className="p-10"><Spinner label={t('msg.loading')} /></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-brand-grey-900 flex items-center gap-2">
          <KeyRound size={22} className="text-brand-blue" />
          {t('pwdreset.title')}
        </h1>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['pending', 'approved', 'rejected'] as Status[]).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold transition border ${
                status === s
                  ? s === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : s === 'approved' ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-brand-red-50 text-brand-red border-brand-red-200'
                  : 'bg-brand-grey-50 text-brand-grey-600 border-brand-grey-200 hover:bg-brand-grey-100'
              }`}>
              {s === 'pending' ? <Clock size={11} /> : s === 'approved' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
              {s === 'pending' ? t('pwdreset.pending') : s === 'approved' ? t('pwdreset.approved') : t('pwdreset.rejected')}
              <span className="text-[10px] opacity-70">({counts[s] || 0})</span>
            </button>
          ))}
          <button onClick={() => load(true)}
            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-grey-100 text-brand-grey-600 border border-brand-grey-200 font-semibold hover:bg-brand-grey-200 transition">
            <RefreshCw size={11} /> {t('pwdreset.refresh')}
          </button>
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
          <KeyRound size={28} className="mx-auto text-brand-grey-300 mb-2" />
          <p className="text-sm text-brand-grey-500 font-medium">Hakuna ombi la sasa</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item: any, i: number) => (
            <div key={item.id} className="bg-white rounded-xl border border-brand-grey-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-brand-grey-400 w-5 text-center">{i + 1}</span>
                    <span className="font-bold text-brand-grey-900 text-sm">{item.full_name}</span>
                    {item.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                        <Clock size={10} /> Inasubiri
                      </span>
                    )}
                    {item.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 size={10} /> Imekubaliwa
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-red-50 text-brand-red border border-brand-red-200">
                        <XCircle size={10} /> Imekataliwa
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap mt-1.5 text-[11px] text-brand-grey-500">
                    <span className="inline-flex items-center gap-1"><Phone size={11} /> {item.phone}</span>
                    {item.email && <span className="inline-flex items-center gap-1"><ShieldCheck size={11} /> {item.email}</span>}
                    <span className="inline-flex items-center gap-1"><Clock size={11} /> {item.created_at ? new Date(item.created_at).toLocaleString('sw-TZ') : '—'}</span>
                  </div>
                </div>

                {item.status === 'pending' && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => approve(item.id)} disabled={busyId === item.id}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-semibold border border-green-200 hover:bg-green-100 transition disabled:opacity-40">
                      {busyId === item.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                      Kubali
                    </button>
                    <button onClick={() => reject(item.id)} disabled={busyId === item.id}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-brand-red-50 text-brand-red font-semibold border border-brand-red-200 hover:bg-brand-red-100 transition disabled:opacity-40">
                      <XCircle size={11} />
                      Kataa
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
