'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, WifiOff, X } from 'lucide-react';
import { login, login2FA } from '@/lib/api';
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

function ErrorAlert({ msg, type }: { msg: string; type?: 'network' | 'validation' }) {
  const Icon = type === 'network' ? WifiOff : AlertCircle;
  return (
    <div className="flex items-start gap-2.5 bg-brand-red-50 border border-brand-red-100 text-brand-red text-xs font-medium rounded-xl p-3">
      <Icon size={16} className="flex-shrink-0 mt-0.5" />
      <span className="leading-relaxed">{msg}</span>
    </div>
  );
}

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      const returnTo = sessionStorage.getItem('kv_return_to');
      if (returnTo) { sessionStorage.removeItem('kv_return_to'); router.replace(returnTo); }
      else router.replace((user as any)?.is_admin ? '/admin' : '/dashboard');
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);

  // 2FA — button ya "Ingia" inabadilika kuwa CODE INPUT pale pale
  const [twoFA, setTwoFA] = useState<{ email: string } | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'network' | 'validation' | undefined>(undefined);

  function isErrorNetwork(err: any): boolean {
    return !err?.response && (err?.message === 'Network Error' || err?.code === 'ERR_NETWORK' || err?.code === 'ERR_CONNECTION_REFUSED');
  }

  // Submit — kama admin, 2FA inaanza (button inabadilika kuwa code input)
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setErrorType(undefined); setLoading(true);
    try {
      const res: any = await login(identifier.trim(), password);
      if (res.two_factor_required) {
        // BUTTON INABADILIKA kuwa CODE INPUT pale pale
        setTwoFA({ email: res.email });
        setTwoFACode('');
        setLoading(false);
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
      // Redirect to saved return URL if any, else dashboard/admin
      const returnTo = sessionStorage.getItem('kv_return_to');
      if (returnTo) { sessionStorage.removeItem('kv_return_to'); router.push(returnTo); }
      else router.push(res.is_admin ? '/admin' : '/dashboard');
    } catch (err: any) {
      if (isErrorNetwork(err)) {
        setError(t('login.error_network'));
        setErrorType('network');
      } else {
        const detail = err?.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : t('login.error_user'));
        setErrorType('validation');
      }
    } finally { setLoading(false); }
  }

  // Auto-submit — mtu akiweka code 6 tarakimu, ingia moja kwa moja
  async function submitTwoFA(code: string) {
    if (code.length !== 6 || twoFALoading) return;
    setError(null); setErrorType(undefined); setTwoFALoading(true);
    try {
      const res = await login2FA(twoFA!.email, code);
      setAuth(res.access_token, {
        user_id: res.user_id, full_name: res.full_name,
        phone_primary: res.phone_primary || twoFA!.email,
        category: (res.category as 'health' | 'education') || undefined,
        cadre_code: res.cadre_code, is_admin: res.is_admin,
      });
      const returnTo = sessionStorage.getItem('kv_return_to');
      if (returnTo) { sessionStorage.removeItem('kv_return_to'); router.push(returnTo); }
      else router.push('/admin');
    } catch (err: any) {
      if (isErrorNetwork(err)) {
        setError(t('login.error_network'));
        setErrorType('network');
      } else {
        setError(err?.response?.data?.detail || t('login.error_user'));
        setErrorType('validation');
      }
    } finally { setTwoFALoading(false); }
  }

  function onTwoFAChange(v: string) {
    const code = v.replace(/\D/g, '');
    setTwoFACode(code);
    setError(null); setErrorType(undefined);
    // Auto-submit mara 6 tarakimu zinapoisha
    if (code.length === 6) {
      submitTwoFA(code);
    }
  }

  function cancelTwoFA() {
    setTwoFA(null);
    setTwoFACode('');
    setError(null); setErrorType(undefined);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 relative">
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

          <form onSubmit={twoFA ? (e) => { e.preventDefault(); } : onSubmit} className="space-y-3.5">
            {/* Email/Password — toujours visible, disabled wakati wa 2FA */}
            <div>
              <label className="label">{t('login.phone_label')}</label>
              <input type="text" className="input" placeholder="0712345678"
                value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                required autoComplete="username" disabled={!!twoFA} />
            </div>
            <div>
              <label className="label">{t('login.password_label')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className="input pr-9" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password" disabled={!!twoFA} />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-grey-400 hover:text-brand-grey-600 transition"
                  disabled={!!twoFA}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {error && <ErrorAlert msg={error} type={errorType} />}

            {/* ═══ SEHEMU MOJA: button au code input — pale pale ═══ */}
            {!twoFA ? (
              /* BUTTON YA KAWAIDA — "Ingia" */
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
            ) : (
              /* CODE INPUT — pale pale, nafasi ya button, inazunguka na KUINGIA */
              <div className="relative">
                <input type="text" inputMode="numeric"
                  className="input text-center text-xl tracking-[0.5em] font-mono pr-10"
                  placeholder="000000" maxLength={6}
                  value={twoFACode}
                  onChange={(e) => onTwoFAChange(e.target.value)}
                  autoFocus disabled={twoFALoading} />
                {/* X button — cancel, rudi kwenye "Ingia" */}
                <button type="button" onClick={cancelTwoFA}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-grey-400 hover:text-brand-grey-600 transition p-0.5"
                  title="Rudi">
                  <X size={16} />
                </button>
                {/* Spinner ya kuingia — inaonekana mtu akiweka code na kusubiri */}
                {twoFALoading && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="inline-block w-5 h-5 rounded-full border-2 border-brand-blue-200 border-t-brand-blue animate-spin" />
                  </div>
                )}
              </div>
            )}
          </form>

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
