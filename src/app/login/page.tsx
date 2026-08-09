'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, adminLogin, requestEmailVerification, confirmEmailVerification } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';

type Tab = 'user' | 'admin';

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);

  const [tab, setTab] = useState<Tab>('user');

  // Watumiaji (namba)
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Admin (email)
  const [email, setEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Email verification flow
  const [verifyMode, setVerifyMode] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      const res = await login(phone, password);
      setAuth(res.access_token, {
        user_id: res.user_id,
        full_name: res.full_name,
        phone_primary: res.phone_primary || phone,
        category: res.category as any,
        cadre_code: res.cadre_code,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('login.error_user'));
    } finally { setLoading(false); }
  }

  async function onAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      const res = await adminLogin(email, adminPassword);
      setAuth(res.access_token, {
        user_id: res.user_id,
        full_name: res.full_name,
        phone_primary: res.phone_primary || '',
        category: res.category as any,
        cadre_code: res.cadre_code,
      });
      router.push('/admin');
    } catch (err: any) {
      const detail = err?.response?.data?.detail || t('login.error_admin');
      setError(typeof detail === 'string' ? detail : t('login.error_admin'));
    } finally { setLoading(false); }
  }

  async function onRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      const res = await requestEmailVerification(email, adminPassword, verifyPhone || undefined);
      setSuccess(res.message || t('login.code_sent'));
      setVerifyMode(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('msg.network_error'));
    } finally { setLoading(false); }
  }

  async function onConfirmCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      const res = await confirmEmailVerification(email, verifyCode);
      setSuccess(res.message || t('login.email_verified'));
      setVerifyCode('');
      setVerifyMode(false);
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('msg.error'));
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="card">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-brand-grey-900">{t('login.welcome')}</h1>
          <p className="text-brand-grey-500 mt-2">{t('login.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-brand-grey-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setTab('user'); setError(null); setSuccess(null); setVerifyMode(false); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              tab === 'user' ? 'bg-white text-brand-grey-900 shadow' : 'text-brand-grey-500 hover:text-brand-grey-700'
            }`}
          >
            {t('login.tab_users')}
          </button>
          <button
            type="button"
            onClick={() => { setTab('admin'); setError(null); setSuccess(null); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              tab === 'admin' ? 'bg-brand-orange text-white shadow' : 'text-brand-grey-500 hover:text-brand-grey-700'
            }`}
          >
            {t('login.tab_admin')}
          </button>
        </div>

        {tab === 'user' && (
          <form onSubmit={onUserSubmit} className="space-y-4">
            <div>
              <label className="label">{t('login.phone_label')}</label>
              <input type="tel" className="input" placeholder="0712345678"
                value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
            </div>
            <div>
              <label className="label">{t('login.password_label')}</label>
              <input type="password" className="input" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>

            {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-3">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('login.logging_in') : t('login.submit')}
            </button>
          </form>
        )}

        {tab === 'admin' && (
          <div className="space-y-5">
            <form onSubmit={onAdminSubmit} className="space-y-4">
              <div>
                <label className="label">{t('login.admin_email_label')}</label>
                <input type="email" className="input" placeholder="admin@kubadilishana.go.tz"
                  value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div>
                <label className="label">{t('login.password_label')}</label>
                <input type="password" className="input" placeholder="••••••••"
                  value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required autoComplete="current-password" />
              </div>

              {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-3">{error}</div>}
              {success && <div className="bg-brand-green-50 text-brand-green text-sm rounded-lg p-3">{success}</div>}

              <button type="submit" disabled={loading} className="btn-primary w-full bg-brand-orange">
                {loading ? t('login.logging_in') : t('login.admin_login')}
              </button>
            </form>

            {/* Email verification */}
            {!verifyMode ? (
              <form onSubmit={onRequestCode} className="space-y-3 border-t border-brand-grey-100 pt-4">
                <p className="text-sm text-brand-grey-500">
                  {t('login.verify_prompt')} <span className="font-semibold text-brand-grey-700">{t('login.verify_span')}</span>{' '}
                  {t('login.verify_prompt2')}
                </p>
                <div>
                  <label className="label">{t('login.verify_phone_label')}</label>
                  <input type="tel" className="input" placeholder="0763795801"
                    value={verifyPhone} onChange={(e) => setVerifyPhone(e.target.value)} autoComplete="tel" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full bg-brand-grey-900">
                  {loading ? t('login.sending_code') : t('login.send_code')}
                </button>
              </form>
            ) : (
              <form onSubmit={onConfirmCode} className="space-y-3 border-t border-brand-grey-100 pt-4">
                <p className="text-sm text-brand-grey-500">
                  {t('login.enter_code')} <span className="font-semibold">{email}</span>.
                  <span className="block text-brand-grey-400 text-xs mt-1">{t('login.dev_hint')} <code className="bg-brand-grey-100 px-1 rounded">docker logs kv_backend</code></span>
                </p>
                <div>
                  <label className="label">{t('login.code_label')}</label>
                  <input type="text" className="input text-center text-xl tracking-[0.5em] font-mono"
                    placeholder="000000" maxLength={6} value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} required />
                </div>
                {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-3">{error}</div>}
                {success && <div className="bg-brand-green-50 text-brand-green text-sm rounded-lg p-3">{success}</div>}
                <button type="submit" disabled={loading} className="btn-primary w-full bg-brand-orange">
                  {loading ? t('login.verifying') : `${t('login.verify_email')} ✓`}
                </button>
              </form>
            )}
          </div>
        )}

        <p className="text-center text-sm text-brand-grey-500 mt-3">
          <Link href="/forgot-password" className="text-brand-blue hover:underline">{t('login.forgot')}</Link>
        </p>
        <p className="text-center text-sm text-brand-grey-500 mt-3">
          {t('login.no_account')}{' '}
          <Link href="/register" className="text-brand-orange font-semibold hover:underline">{t('login.register_now')}</Link>
        </p>
      </div>
    </div>
  );
}
