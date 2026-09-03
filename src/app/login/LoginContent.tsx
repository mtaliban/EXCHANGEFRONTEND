'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, WifiOff, X, Phone } from 'lucide-react';
import { login, login2FA, extractErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';

function ErrorAlert({ msg, type }: { msg: string; type?: 'network' | 'validation' }) {
  const Icon = type === 'network' ? WifiOff : AlertCircle;
  return (
    <div className="flex items-start gap-2.5 bg-brand-red-50 border border-brand-red-100 text-brand-red text-xs font-medium rounded-xl p-3">
      <Icon size={16} className="flex-shrink-0 mt-0.5" />
      <span className="leading-relaxed">{msg}</span>
    </div>
  );
}

export default function LoginContent() {
  const t = useT();
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const { token, user } = useAuth();

  // NOTE: login page does NOT auto-redirect on existing token —
  // that caused redirect loops. Redirect only happens AFTER successful login
  // in onSubmit / submitTwoFA below.

  // Auto-fill phone from URL param (after registration)
  const [searchPhone, setSearchPhone] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('phone');
      if (p) setSearchPhone(decodeURIComponent(p));
    }
  }, []);
  const [identifier, setIdentifier] = useState('');
  // Set identifier from URL param once
  useEffect(() => {
    if (searchPhone && !identifier) setIdentifier(searchPhone);
  }, [searchPhone]);

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

  // Submit — kama ni namba ya simu, ingia moja kwa moja; kama ni email, 2FA
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setErrorType(undefined); setLoading(true);
    try {
      const res: any = await login(identifier.trim());
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
        is_verified: res.is_verified,
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
        is_verified: res.is_verified,
      });
      const returnTo = sessionStorage.getItem('kv_return_to');
      if (returnTo) { sessionStorage.removeItem('kv_return_to'); router.push(returnTo); }
      else router.push('/admin');
    } catch (err: any) {
      if (isErrorNetwork(err)) {
        setError(t('login.error_network'));
        setErrorType('network');
      } else {
        setError(extractErrorMessage(err, t('login.error_user')));
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
            <img src="/images/LOGOL.jpeg" alt="Logo" className="mx-auto mb-4 h-20 sm:h-24 w-auto rounded-xl shadow-md" />
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-grey-900">{t('login.welcome')}</h1>
            <p className="text-brand-grey-500 mt-1 text-sm">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={twoFA ? (e) => { e.preventDefault(); } : onSubmit} className="space-y-3.5">
            {/* Email/Password — toujours visible, disabled wakati wa 2FA */}
            <div>
              <label className="label">{identifier.includes('@') ? 'Email ya Admin' : t('login.phone_label')}</label>
              <div className="relative">
                <input type="text" className="input pl-9" placeholder={identifier.includes('@') ? 'admin@kubadilishana.go.tz' : '0712345678'}
                  value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                  required autoComplete="username" disabled={!!twoFA} />
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey-400" />
              </div>

            </div>

            {error && <ErrorAlert msg={error} type={errorType} />}

            {twoFA && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold rounded-xl px-3 py-2 border border-green-200">
                <AlertCircle size={14} className="text-green-500 flex-shrink-0" />
                <span>Code ya tarakimu 6 imetumwa kwa <strong>{twoFA.email}</strong> — angalia email yako</span>
              </div>
            )}

            {/* ═══ SEHEMU MOJA: button au code input — pale pale ═══ */}
            {!twoFA ? (
              /* BUTTON YA KAWAIDA — "Ingia" */
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="inline-block w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
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


          <p className="text-center text-xs text-brand-grey-500 mt-3">
            <Link href="/forgot-password" className="text-brand-blue hover:underline font-medium">Sahau namba yako?</Link>
          </p>
          <div className="mt-4">
            <Link href="/register" className="btn-primary w-full flex items-center justify-center gap-2" style={{ background: 'transparent', color: 'rgb(var(--brand-blue))', border: '2px solid rgb(var(--brand-blue) / 0.3)' }}>
              {t('login.register_now')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
