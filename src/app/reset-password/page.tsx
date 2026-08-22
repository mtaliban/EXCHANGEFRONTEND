'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword, getPasswordResetStatus } from '@/lib/api';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';
import { CheckCircle2, AlertCircle, Loader2, KeyRound, ArrowLeft, Clock, XCircle } from 'lucide-react';

function ResetPasswordInner() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'approved' | 'pending' | 'rejected' | 'none'>('loading');

  useEffect(() => {
    const q = searchParams?.get('phone');
    if (q) {
      setPhone(q);
      // Check status
      getPasswordResetStatus(q).then((data) => {
        if (data.status === 'approved') setStatus('approved');
        else if (data.status === 'pending') setStatus('pending');
        else if (data.status === 'rejected') setStatus('rejected');
        else setStatus('none');
      }).catch(() => setStatus('none'));
    } else {
      setStatus('none');
    }
  }, [searchParams]);

  // AUTO-POLL: pending status — kila 5 second, angalia kama admin amekubali
  useEffect(() => {
    if (status !== 'pending' || !phone) return;
    const interval = setInterval(async () => {
      try {
        const data = await getPasswordResetStatus(phone);
        if (data.status === 'approved') {
          setStatus('approved');
          clearInterval(interval);
        } else if (data.status === 'rejected') {
          setStatus('rejected');
          clearInterval(interval);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [status, phone]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setMessage(null);
    if (password !== password2) { setError(t('reset.err_mismatch')); return; }
    if (password.length < 6) { setError('Password lazima iwe na herufi 6 au zaidi'); return; }
    setLoading(true);
    try {
      const res = await resetPassword(phone, password);
      setMessage(res.message);
      setTimeout(() => router.push('/login'), 1800);
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('msg.error'));
    } finally { setLoading(false); }
  }

  if (status === 'loading') {
    return <div className="p-10"><Spinner label={t('reset.loading')} /></div>;
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
        {/* ── NO REQUEST / REJECTED ── */}
        {(status === 'none' || status === 'rejected') && (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-brand-grey-100 border border-brand-grey-200 flex items-center justify-center">
              {status === 'rejected' ? <XCircle size={20} className="text-brand-red" /> : <KeyRound size={20} className="text-brand-grey-400" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-grey-900 mb-1">
                {status === 'rejected' ? 'Ombi Limekataliwa' : 'Hakuna Ombi'}
              </h1>
              <p className="text-sm text-brand-grey-500">
                {status === 'rejected'
                  ? 'Admin amekataa ombi lako la kubadilisha password.'
                  : 'Huna ombi la sasa la kubadilisha password. Omba kwanza.'}
              </p>
            </div>
            <Link href="/forgot-password"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-700 transition w-full">
              <KeyRound size={14} />
              Omba Password Mpya
            </Link>
          </div>
        )}

        {/* ── PENDING (waiting for admin) ── */}
        {status === 'pending' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center">
              <Clock size={24} className="text-orange-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-grey-900 mb-1">Bado Inasubiri</h2>
              <p className="text-sm text-brand-grey-500">
                Ombi lako bado linasubiri <span className="font-semibold">admin</span> akubali.
                Subiri kidogo...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-full px-3 py-2 border border-orange-200">
              <Loader2 size={12} className="animate-spin" />
              Inapitia kila sekunde 3...
            </div>
            <Link href="/forgot-password"
              className="text-xs text-brand-blue hover:underline">
              Omba ombi jipya
            </Link>
          </div>
        )}

        {/* ── APPROVED → show password form ── */}
        {status === 'approved' && (
          <>
            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-500" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-brand-grey-900">{t('reset.title')}</h1>
              <p className="text-brand-grey-500 text-sm mt-1">
                Admin amekubali. Weka password mpya hapa chini.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Password Mpya</label>
                  <input type="password" className="input" placeholder="Herufi 6 au zaidi"
                    value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <div>
                  <label className="label">{t('reset.repeat')}</label>
                  <input type="password" className="input" placeholder={t('reset.repeat')}
                    value={password2} onChange={(e) => setPassword2(e.target.value)} required />
                </div>
              </div>

              {message && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm rounded-full px-3 py-2 border border-green-200">
                  <CheckCircle2 size={14} />
                  {message}
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 bg-brand-red-50 text-brand-red text-sm rounded-full px-3 py-2 border border-brand-red-200">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? (
                  <><Loader2 size={14} className="animate-spin" /> Inaweka...</>
                ) : (
                  <><KeyRound size={14} /> Weka Password Mpya</>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const t = useT();
  return (
    <Suspense fallback={<div className="p-10"><Spinner label={t('reset.loading')} /></div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
