'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { login, login2FA, requestEmailVerification, confirmEmailVerification } from '@/lib/api';
import { useAuth, isTokenExpired } from '@/lib/auth';
import { useT } from '@/lib/i18n';

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
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
  // Password inaonekana BY DEFAULT (rahisi kwa watumiaji — macho yanaficha)
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);

  // Email verification flow
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyPhone, setVerifyPhone] = useState('');
  const [verifyMode, setVerifyMode] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');

  // 2FA
  const [twoFA, setTwoFA] = useState<{ email: string; message?: string; devCode?: string } | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAExpiresAt, setTwoFAExpiresAt] = useState<number | null>(null);
  const [twoFACountdown, setTwoFACountdown] = useState(0);
  const twoFASubmitTimer = useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEmail = identifier.trim().includes('@');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      const res: any = await login(identifier.trim(), password);
      if (res.two_factor_required) {
        setTwoFA({ email: res.email, message: res.message, devCode: res.dev_code });
        setTwoFACode(res.dev_code || '');
        return;
      }
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
      if (isEmail && /thibitish|verif/i.test(msg)) {
        setVerifyEmail(identifier.trim());
        setVerifyOpen(true);
        setVerifyMode(false);
        setVerifyCode('');
      }
      setError(msg);
    } finally { setLoading(false); }
  }

  // 2FA
  const twoFARef = useRef(twoFA);
  twoFARef.current = twoFA;
  async function submitTwoFA(code: string = twoFACode) {
    if (code.length !== 6 || twoFALoading) return;
    setError(null); setSuccess(null); setTwoFALoading(true);
    try {
      const res = await login2FA(twoFA!.email, code);
      setAuth(res.access_token, {
        user_id: res.user_id, full_name: res.full_name,
        phone_primary: res.phone_primary || twoFA!.email,
        category: (res.category as 'health' | 'education') || undefined,
        cadre_code: res.cadre_code, is_admin: res.is_admin,
      });
      router.push('/admin');
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('login.error_admin'));
    } finally { setTwoFALoading(false); }
  }

  function onTwoFAChange(v: string) {
    setTwoFACode(v); setError(null);
    if (twoFASubmitTimer.current) clearTimeout(twoFASubmitTimer.current);
    if (v.length === 6) twoFASubmitTimer.current = setTimeout(() => submitTwoFA(v), 250);
  }

  useEffect(() => {
    if (!twoFA) return;
    setTwoFAExpiresAt(Date.now() + 10 * 60 * 1000);
    setTwoFACountdown(10 * 60);
    if (twoFA.devCode && twoFA.devCode.length === 6) {
      const t = setTimeout(() => submitTwoFA(), 500);
      return () => clearTimeout(t);
    }
  }, [twoFA]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!twoFA || !twoFAExpiresAt) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((twoFAExpiresAt - Date.now()) / 1000));
      setTwoFACountdown(left);
      if (left <= 0) setTwoFACountdown(0);
    }, 1000);
    return () => clearInterval(id);
  }, [twoFA, twoFAExpiresAt]);

  async function onTwoFASubmit(e: React.FormEvent) {
    e.preventDefault(); await submitTwoFA();
  }

  async function onRequestCode(e: React.FormEvent) {
    e.preventDefault(); setError(null); setSuccess(null); setLoading(true);
    try {
      const res = await requestEmailVerification(verifyEmail, password, verifyPhone || undefined);
      setSuccess(res.message || t('login.code_sent'));
      setVerifyMode(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('msg.network_error'));
    } finally { setLoading(false); }
  }

  const confirmTimer = useRef<any>(null);
  async function submitVerifyCode(code: string = verifyCode) {
    if (code.length !== 6 || loading) return;
    setError(null); setSuccess(null); setLoading(true);
    try {
      const res = await confirmEmailVerification(verifyEmail, code);
      setSuccess(res.message || t('login.email_verified'));
      setVerifyCode(''); setVerifyMode(false); setVerifyOpen(false); setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('msg.error'));
    } finally { setLoading(false); }
  }

  function onVerifyCodeChange(v: string) {
    setVerifyCode(v); setError(null);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    if (v.length === 6) confirmTimer.current = setTimeout(() => submitVerifyCode(v), 250);
  }

  async function onConfirmCode(e: React.FormEvent) {
    e.preventDefault(); await submitVerifyCode();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 relative">
      {/* Mshale wa kurudi Home — juu kushoto */}
      <div className="absolute top-4 left-4 sm:top-5 sm:left-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-grey-600 hover:text-brand-blue transition px-2 py-1.5 rounded-lg hover:bg-brand-grey-100">
          <ArrowLeft size={16} />
          {t('action.back')}
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="card p-4 sm:p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-grey-900">{t('login.welcome')}</h1>
            <p className="text-brand-grey-500 mt-1 text-sm">{t('login.subtitle')}</p>
          </div>

          {/* Form — namba ya simu au email ya admin */}
          <form onSubmit={onSubmit} className="space-y-3.5">
            <div>
              <label className="label">{t('login.phone_label')}</label>
              <input type="text" className="input" placeholder="0712345678"
                value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username" />
            </div>
            <div>
              <label className="label">{t('login.password_label')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className="input pr-9" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-grey-400 hover:text-brand-grey-600 transition"
                  aria-label={showPassword ? 'Ficha password' : 'Onyesha password'}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {error && <div className="bg-brand-red-50 border border-brand-red-100 text-brand-red text-xs font-medium rounded-xl p-3">{error}</div>}
            {success && <div className="bg-brand-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-xl p-3">{success}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  {t('login.logging_in')}
                </>
              ) : (
                t('login.submit')
              )}
            </button>
          </form>

          {/* 2FA */}
          {twoFA && (
            <div className="mt-5 border-t border-brand-grey-100 pt-4">
              <form onSubmit={onTwoFASubmit} className="space-y-3 mt-3">
                <input type="text" inputMode="numeric" className="input text-center text-xl tracking-[0.5em] font-mono"
                  placeholder="000000" maxLength={6} value={twoFACode}
                  onChange={(e) => onTwoFAChange(e.target.value.replace(/\D/g, ''))} required autoFocus disabled={twoFALoading} />
                {twoFALoading && (
                  <div className="flex items-center justify-center gap-2 text-sm text-brand-blue font-semibold">
                    <span className="inline-block w-5 h-5 rounded-full border-2 border-brand-blue-200 border-t-brand-blue animate-spin" />
                    {t('login.verifying')}
                  </div>
                )}
                {error && <div className="bg-brand-red-50 border border-brand-red-100 text-brand-red text-xs font-medium rounded-xl p-3">{error}</div>}
                <button type="submit" disabled={twoFALoading || twoFACountdown <= 0} className="hidden">
                  {twoFALoading ? t('login.verifying') : t('login.twofa_submit')}
                </button>
              </form>
            </div>
          )}

          {/* Admin: thibitisha email */}
          {verifyOpen && (
            <div className="mt-5 border-t border-brand-grey-100 pt-4">
              {!verifyMode && (
                <form onSubmit={onRequestCode} className="space-y-3 mt-3">
                  <p className="text-xs text-brand-grey-500">{t('login.verify_prompt2')}</p>
                  <input type="email" className="input" placeholder="admin@kubadilishana.go.tz"
                    value={verifyEmail} onChange={(e) => setVerifyEmail(e.target.value)} required />
                  <input type="tel" className="input" placeholder={t('login.verify_phone_label')}
                    value={verifyPhone} onChange={(e) => setVerifyPhone(e.target.value)} autoComplete="tel" />
                  <input type="text" className="input" placeholder={t('login.password_label')}
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  {error && <div className="bg-brand-red-50 border border-brand-red-100 text-brand-red text-xs font-medium rounded-xl p-3">{error}</div>}
                  {success && <div className="bg-brand-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-xl p-3">{success}</div>}
                  <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        {t('login.sending_code')}
                      </>
                    ) : (
                      t('login.send_code')
                    )}
                  </button>
                </form>
              )}

              {verifyMode && (
                <form onSubmit={onConfirmCode} className="space-y-3 mt-3">
                  <input type="text" className="input text-center text-xl tracking-[0.5em] font-mono"
                    placeholder="000000" maxLength={6} value={verifyCode}
                    onChange={(e) => onVerifyCodeChange(e.target.value.replace(/\D/g, ''))} required autoFocus disabled={loading} />
                  {loading && (
                    <div className="flex items-center justify-center gap-2 text-sm text-brand-blue font-semibold">
                      <span className="inline-block w-5 h-5 rounded-full border-2 border-brand-blue-200 border-t-brand-blue animate-spin" />
                      {t('login.verifying')}
                    </div>
                  )}
                  {error && <div className="bg-brand-red-50 border border-brand-red-100 text-brand-red text-xs font-medium rounded-xl p-3">{error}</div>}
                  {success && <div className="bg-brand-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-xl p-3">{success}</div>}
                  <button type="submit" disabled={loading} className="hidden">
                    {loading ? t('login.verifying') : t('login.verify_email')}
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
            <Link href="/register" className="text-brand-blue font-semibold hover:underline">{t('login.register_now')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
