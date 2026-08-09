'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { forgotPassword } from '@/lib/api';
import { useT } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const t = useT();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setMessage(null); setLoading(true);
    try {
      const res = await forgotPassword(phone);
      setMessage(res.message);
      setTimeout(() => router.push(`/reset-password?phone=${encodeURIComponent(phone)}`), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('msg.network_error'));
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="card">
        <h1 className="text-2xl font-bold text-brand-grey-900 mb-2">{t('forgot.title')}</h1>
        <p className="text-brand-grey-500 text-sm mb-6">
          {t('forgot.subtitle')}
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">{t('forgot.phone_label')}</label>
            <input type="tel" className="input" placeholder="0712345678"
              value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
          </div>

          {message && <div className="bg-brand-blue-50 text-brand-blue text-sm rounded-lg p-3">{message}</div>}
          {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-3">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? t('forgot.sending') : t('forgot.submit')}
          </button>
        </form>

        <p className="text-center text-sm text-brand-grey-500 mt-6">
          <Link href="/login" className="text-brand-blue hover:underline">{t('forgot.back')}</Link>
        </p>
      </div>
    </div>
  );
}
