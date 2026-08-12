'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, requestEmailVerification, confirmEmailVerification } from '@/lib/api';
import { useAuth, isTokenExpired } from '@/lib/auth';
import { useT } from '@/lib/i18n';

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const { token, user } = useAuth();

  // Tayari ameingia? Rudi dashibodi moja kwa moja (login ni ya wageni)
  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      router.replace((user as any)?.is_admin ? '/admin' : '/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Form moja — namba ya simu AU email (admin inatambuliwa kiotomatiki)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email verification flow — inaonekana tu INAPOHAJITIKA (admin anapoingia
  // na email haijathibitishwa) — sio mara kwa mara kwenye login page.
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyPhone, setVerifyPhone] = useState('');
  const [verifyMode, setVerifyMode] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEmail = identifier.trim().includes('@');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      // Backend ina-detect: email → admin, namba → user (primary AU alt)
      const res = await login(identifier.trim(), password);
      setAuth(res.access_token, {
        user_id: res.user_id,
        full_name: res.full_name,
        phone_primary: res.phone_primary || identifier.trim(),
        category: (res.category as 'health' | 'education') || undefined,
        cadre_code: res.cadre_code,
        is_admin: res.is_admin,
      });
      router.push(res.is_admin ? '/admin' : '/dashboard');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (isEmail ? t('login.error_admin') : t('login.error_user'));
      // Email haijathibitishwa? → onyesha verification form kiotomatiki
      if (isEmail && /thibitish|verif/i.test(msg)) {
        setVerifyEmail(identifier.trim());
        setVerifyOpen(true);
        setVerifyMode(false);
        setVerifyCode('');
      }
      setError(msg);
    } finally { setLoading(false); }
  }

  async function onRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      const res = await requestEmailVerification(verifyEmail, password, verifyPhone || undefined);
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
      const res = await confirmEmailVerification(verifyEmail, verifyCode);
      setSuccess(res.message || t('login.email_verified'));
      setVerifyCode('');
      setVerifyMode(false);
      setVerifyOpen(false); // maliza — rudi kwenye login
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('msg.error'));
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="card p-4 sm:p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-grey-900">{t('login.welcome')}</h1>
          <p className="text-brand-grey-500 mt-2">{t('login.subtitle')}</p>
        </div>

        {/* Form moja tu — namba ya simu au email ya admin */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">{t('login.phone_label')}</label>
            {/* Form rahisi: namba ya simu + password. Admin anajua mwenyewe kuwa
                anaingia kwa email (backend ina-detect kiotomatiki) — hatangazi. */}
            <input type="text" className="input" placeholder="0712345678"
              value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" />
          </div>
          <div>
            <label className="label">{t('login.password_label')}</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} className="input pr-11" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey-400 hover:text-brand-grey-600 transition"
                aria-label={showPassword ? 'Ficha password' : 'Onyesha password'}>
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-3">{error}</div>}
          {success && <div className="bg-brand-green-50 text-brand-green text-sm rounded-lg p-3">{success}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? t('login.logging_in') : (isEmail ? t('login.admin_login') : t('login.submit'))}
          </button>
        </form>

        {/* Admin: thibitisha email — inaonekana TU inapohitajika (ikijaribu kuingia kwa email ambayo haijathibitishwa, form inafunguka kiotomatiki). Sio mara kwa mara. */}
        {verifyOpen && (
        <div className="mt-5 border-t border-brand-grey-100 pt-4">
          {!verifyMode && (
            <form onSubmit={onRequestCode} className="space-y-3 mt-3">
              <p className="text-xs text-brand-grey-500">{t('login.verify_prompt2')}</p>
              <input type="email" className="input" placeholder="admin@kubadilishana.go.tz"
                value={verifyEmail} onChange={(e) => setVerifyEmail(e.target.value)} required />
              <input type="tel" className="input" placeholder={t('login.verify_phone_label')}
                value={verifyPhone} onChange={(e) => setVerifyPhone(e.target.value)} autoComplete="tel" />
              <input type="password" className="input" placeholder={t('login.password_label')}
                value={password} onChange={(e) => setPassword(e.target.value)} required />
              {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-3">{error}</div>}
              {success && <div className="bg-brand-green-50 text-brand-green text-sm rounded-lg p-3">{success}</div>}
              <button type="submit" disabled={loading} className="btn-primary w-full bg-brand-grey-900">
                {loading ? t('login.sending_code') : t('login.send_code')}
              </button>
            </form>
          )}

          {verifyMode && (
            <form onSubmit={onConfirmCode} className="space-y-3 mt-3">
              <p className="text-xs text-brand-grey-500">
                {t('login.enter_code')} <span className="font-semibold">{verifyEmail}</span>.
                <span className="block text-brand-grey-400 mt-1">{t('login.dev_hint')} <code className="bg-brand-grey-100 px-1 rounded">docker logs kv_backend</code></span>
              </p>
              <input type="text" className="input text-center text-xl tracking-[0.5em] font-mono"
                placeholder="000000" maxLength={6} value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} required />
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
