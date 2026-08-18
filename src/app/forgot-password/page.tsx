'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { forgotPassword } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { ArrowLeft, AlertCircle, CheckCircle2, Loader2, KeyRound, User, Phone } from 'lucide-react';

export default function ForgotPasswordPage() {
  const t = useT();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setMessage(null); setLoading(true);
    try {
      const res = await forgotPassword(phone, fullName || undefined);
      setMessage(res.message);
      setTimeout(() => router.push(`/reset-password?phone=${encodeURIComponent(phone)}`), 3000);
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
        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-blue-50 border border-brand-blue-200 flex items-center justify-center">
            <KeyRound size={20} className="text-brand-blue" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-grey-900">{t('forgot.title')}</h1>
          <p className="text-brand-grey-500 text-sm mt-1">
            {t('forgot.subtitle')}
          </p>
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

          {message && (
            <div className="flex items-center gap-2 bg-brand-blue-50 text-brand-blue text-xs font-semibold rounded-full px-3 py-2 border border-brand-blue-200">
              <CheckCircle2 size={14} />
              {message}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-brand-red-50 text-brand-red text-xs font-semibold rounded-full px-3 py-2 border border-brand-red-200">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !phone} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Inachakata...
              </>
            ) : (
              t('forgot.submit')
            )}
          </button>
        </form>

        <p className="text-center text-sm text-brand-grey-500 mt-6">
          <Link href="/login" className="text-brand-blue hover:underline">{t('forgot.back')}</Link>
        </p>
      </div>
    </div>
  );
}
