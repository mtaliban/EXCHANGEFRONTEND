'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { forgotPassword, getPasswordResetStatus } from '@/lib/api';
import { API_URL } from '@/lib/config';
import { useT } from '@/lib/i18n';
import { ArrowLeft, AlertCircle, CheckCircle2, Loader2, KeyRound, User, Phone, Clock, XCircle, Shield } from 'lucide-react';

type Step = 'form' | 'waiting' | 'approved' | 'rejected';

export default function ForgotPasswordPage() {
  const t = useT();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('form');
  const [rejected, setRejected] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const retryRef = useRef<any>(null);

  /* ── SSE listener: poll status every 3s until approved/rejected ── */
  useEffect(() => {
    if (step !== 'waiting') return;
    let stopped = false;

    async function poll() {
      if (stopped) return;
      try {
        const data = await getPasswordResetStatus(phone);
        if (data.status === 'approved') {
          setStep('approved');
          // Redirect to reset-password after 2s
          setTimeout(() => router.push(`/reset-password?phone=${encodeURIComponent(phone)}`), 2000);
          return;
        }
        if (data.status === 'rejected') {
          setStep('rejected');
          setRejected(true);
          return;
        }
      } catch {}
      if (!stopped) retryRef.current = setTimeout(poll, 3000);
    }
    poll();

    // Also try SSE for instant notification
    async function connectSSE() {
      try {
        const raw = localStorage.getItem('kv_auth');
        let token: string | null = null;
        try { token = raw ? (JSON.parse(raw)?.state?.token || null) : null; } catch {}
        abortRef.current = new AbortController();
        const res = await fetch(`${API_URL}/admin/live-events`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: abortRef.current.signal,
        });
        if (!res.ok || !res.body) return;
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
                if (ev?.event_type === 'user.password_reset_approved' && ev?.user_id) {
                  setStep('approved');
                  setTimeout(() => router.push(`/reset-password?phone=${encodeURIComponent(phone)}`), 2000);
                  return;
                }
                if (ev?.event_type === 'user.password_reset_rejected' && ev?.user_id) {
                  setStep('rejected');
                  setRejected(true);
                  return;
                }
              } catch {}
            }
          }
        }
      } catch {}
    }
    connectSSE();

    return () => {
      stopped = true;
      abortRef.current?.abort();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [step, phone, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      await forgotPassword(phone, fullName || undefined);
      setStep('waiting');
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('msg.network_error'));
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="absolute top-4 left-4 sm:top-5 sm:left-6">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-grey-600 hover:text-brand-blue transition px-2 py-1.5 rounded-lg hover:bg-brand-grey-100">
          <ArrowLeft size={16} />
          {t('action.back')}
        </Link>
      </div>

      <div className="card p-4 sm:p-6">
        {/* ── FORM STEP ── */}
        {step === 'form' && (
          <>
            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-blue-50 border border-brand-blue-200 flex items-center justify-center">
                <KeyRound size={20} className="text-brand-blue" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-brand-grey-900">{t('forgot.title')}</h1>
              <p className="text-brand-grey-500 text-sm mt-1">{t('forgot.subtitle')}</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3.5">
              <div>
                <label className="label text-xs font-bold uppercase tracking-wider text-brand-grey-500">Jina Kamili</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey-400" />
                  <input type="text" className="input pl-9" placeholder="Jina lako kamili"
                    value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold uppercase tracking-wider text-brand-grey-500">{t('forgot.phone_label')}</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey-400" />
                  <input type="tel" className="input pl-9" placeholder="0712345678"
                    value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-brand-red-50 text-brand-red text-xs font-semibold rounded-full px-3 py-2 border border-brand-red-200">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || !phone} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? (
                  <><Loader2 size={14} className="animate-spin" /> Inachakata...</>
                ) : (
                  'Omba Kubadilisha Password'
                )}
              </button>
            </form>
          </>
        )}

        {/* ── WAITING FOR ADMIN ── */}
        {step === 'waiting' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center">
              <Clock size={24} className="text-orange-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-grey-900 mb-1">Ombi limetumwa!</h2>
              <p className="text-sm text-brand-grey-500">
                Subiri <span className="font-semibold text-brand-grey-700">admin</span> akubali ombi lako.
                Utapata taarifa papo hapo akiamua.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-full px-3 py-2 border border-orange-200">
              <Loader2 size={12} className="animate-spin" />
              Inasubiri... (inapitia kila sekunde 3)
            </div>
          </div>
        )}

        {/* ── APPROVED ── */}
        {step === 'approved' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-green-700 mb-1">Ombi Limekubaliwa! ✅</h2>
              <p className="text-sm text-brand-grey-500">
                Admin amekubali. Unaelekezwa kwenye fomu ya kuweka password mpya...
              </p>
            </div>
          </div>
        )}

        {/* ── REJECTED ── */}
        {step === 'rejected' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-brand-red-50 border border-brand-red-200 flex items-center justify-center">
              <XCircle size={24} className="text-brand-red" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-red mb-1">Ombi Limekataliwa</h2>
              <p className="text-sm text-brand-grey-500">
                Admin amekataa ombi lako. Wasiliana na ofisi yako kwa maelezo zaidi.
              </p>
            </div>
            <button onClick={() => { setStep('form'); setRejected(false); setError(null); }}
              className="btn-primary w-full flex items-center justify-center gap-2">
              <Shield size={14} />
              Omba Tena
            </button>
          </div>
        )}

        <p className="text-center text-sm text-brand-grey-500 mt-6">
          <Link href="/login" className="text-brand-blue hover:underline">{t('forgot.back')}</Link>
        </p>
      </div>
    </div>
  );
}
