'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/lib/api';
import { useT } from '@/lib/i18n';
import Spinner from '@/components/Spinner';
import { CheckCircle2, AlertCircle, Loader2, KeyRound, ArrowLeft } from 'lucide-react';

function ResetPasswordInner() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams?.get('phone') || '';
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (!phone) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="card p-6 text-center">
          <KeyRound size={28} className="mx-auto text-brand-grey-300 mb-2" />
          <p className="text-sm text-brand-grey-500 font-medium">Hakuna namba ya simu</p>
          <Link href="/forgot-password" className="text-brand-blue text-sm hover:underline mt-2 inline-block">Anza upya</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="absolute top-4 left-4 sm:top-5 sm:left-6">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-grey-600 hover:text-brand-blue transition px-2 py-1.5 rounded-lg hover:bg-brand-grey-100">
          <ArrowLeft size={16} />
          Rudi
        </Link>
      </div>

      <div className="card p-4 sm:p-6">
        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-blue-50 border border-brand-blue-200 flex items-center justify-center">
            <KeyRound size={20} className="text-brand-blue" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-grey-900">Weka Password Mpya</h1>
          <p className="text-brand-grey-500 text-sm mt-1">{phone}</p>
        </div>

        {!message ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Password Mpya</label>
              <input type="password" className="input" placeholder="Herufi 6 au zaidi"
                value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoFocus />
            </div>
            <div>
              <label className="label">{t('reset.repeat')}</label>
              <input type="password" className="input" placeholder={t('reset.repeat')}
                value={password2} onChange={(e) => setPassword2(e.target.value)} required />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-brand-red-50 text-brand-red text-sm rounded-full px-3 py-2 border border-brand-red-200">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /> Inaweka...</>
              ) : (
                <><KeyRound size={14} /> Badilisha Password</>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center py-4 space-y-3">
            <CheckCircle2 size={32} className="mx-auto text-green-500" />
            <p className="text-sm text-green-700 font-semibold">{message}</p>
            <p className="text-xs text-brand-grey-500">Unaelekezwa kwenye kuingia...</p>
          </div>
        )}

        <p className="text-center text-sm text-brand-grey-500 mt-6">
          <Link href="/login" className="text-brand-blue hover:underline">Rudi kwenye kuingia</Link>
        </p>
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
