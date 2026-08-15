'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, login2FA, requestEmailVerification, confirmEmailVerification } from '@/lib/api';
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

  // 2FA (two-factor auth): admin anapoingia kwa email+password sahihi, backend
  // inatuma code ya tarakimu 6 kwa EMAIL yake — anaiweka hapa kukamilisha.
  // SMTP ikibidi isijasanidiwe, backend inarudisha `dev_code` (break-glass) —
  // code hiyo inaonyeshwa kwenye skrini ili admin asifungiwe nje (inaondoka
  // mara tu SMTP ikishasanidiwa; basi code inaenda email tu).
  const [twoFA, setTwoFA] = useState<{ email: string; message?: string; devCode?: string } | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  // Countdown ya code (dakika 10 — backend TTL): inapofika 0, code imeisha.
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
      // Backend ina-detect: email → admin, namba → user (primary AU alt)
      const res: any = await login(identifier.trim(), password);
      // 2FA inahitajika? → backend imetuma code kwa email — tuelekeze kwenye step ya code.
      if (res.two_factor_required) {
        setTwoFA({ email: res.email, message: res.message, devCode: res.dev_code });
        setTwoFACode(res.dev_code || ''); // break-glass: code ikiwa kwenye response, jaza kiotomatiki
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

  // AUTO-SUBMIT: code ya tarakimu 6 inapoandikwa, inajiingiza YENYEWE
  // (pause ya 250ms — usi-submit katikati ya kuandika). Hakuna kubofya.
  async function submitTwoFA() {
    if (twoFACode.length !== 6 || twoFALoading) return;
    setError(null); setSuccess(null); setTwoFALoading(true);
    try {
      const res = await login2FA(twoFA!.email, twoFACode);
      setAuth(res.access_token, {
        user_id: res.user_id,
        full_name: res.full_name,
        phone_primary: res.phone_primary || twoFA!.email,
        category: (res.category as 'health' | 'education') || undefined,
        cadre_code: res.cadre_code,
        is_admin: res.is_admin,
      });
      router.push('/admin');
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('login.error_admin'));
    } finally { setTwoFALoading(false); }
  }

  function onTwoFAChange(v: string) {
    setTwoFACode(v);
    setError(null);
    if (twoFASubmitTimer.current) clearTimeout(twoFASubmitTimer.current);
    if (v.length === 6) twoFASubmitTimer.current = setTimeout(submitTwoFA, 250);
  }

  // Countdown ya 2FA code — anza sekunde 10*60 kutoka anapopata code.
  useEffect(() => {
    if (!twoFA) return;
    setTwoFAExpiresAt(Date.now() + 10 * 60 * 1000);
    setTwoFACountdown(10 * 60);
  }, [twoFA]);
  useEffect(() => {
    if (!twoFA || !twoFAExpiresAt) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((twoFAExpiresAt - Date.now()) / 1000));
      setTwoFACountdown(left);
      if (left <= 0) setTwoFACountdown(0);
    }, 1000);
    return () => clearInterval(id);
  }, [twoFA, twoFAExpiresAt]);

  // Hatua ya pili: weka code ya 2FA iliyotumwa kwa email
  async function onTwoFASubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitTwoFA();
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

  // AUTO-SUBMIT pia hapa: code ya tarakimu 6 → inathibitisha yenyewe.
  const confirmTimer = useRef<any>(null);
  async function submitVerifyCode() {
    if (verifyCode.length !== 6 || loading) return;
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

  function onVerifyCodeChange(v: string) {
    setVerifyCode(v);
    setError(null);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    if (v.length === 6) confirmTimer.current = setTimeout(submitVerifyCode, 250);
  }

  async function onConfirmCode(e: React.FormEvent) {
    e.preventDefault();
    await submitVerifyCode();
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
            {loading ? t('login.logging_in') : t('login.submit')}
          </button>
        </form>

        {/* ═══ 2FA: PIN pekee — hakuna maneno mengi, weka code tu ═══ */}
        {twoFA && (
          <div className="mt-5 border-t border-brand-grey-100 pt-4">
            <form onSubmit={onTwoFASubmit} className="space-y-3 mt-3">
              {twoFA.devCode && (
                <div className="bg-brand-orange-50 border border-brand-orange-200 rounded-lg p-3 text-center">
                  <div className="text-[11px] font-bold text-brand-orange uppercase tracking-wide">Code yako (SMTP haijasanidiwa — weka email kwenye Mipangilio)</div>
                  <div className="text-3xl font-extrabold tracking-[0.4em] font-mono text-brand-grey-900 mt-1">{twoFA.devCode}</div>
                </div>
              )}
              <input type="text" inputMode="numeric" className="input text-center text-xl tracking-[0.5em] font-mono"
                placeholder="000000" maxLength={6} value={twoFACode}
                onChange={(e) => onTwoFAChange(e.target.value.replace(/\D/g, ''))} required autoFocus />
              <p className="text-[11px] text-brand-blue flex items-center gap-1.5">⚡ {t('login.code_auto')}</p>
              {/* COUNTDOWN — code inaisha wakati gani (backend TTL dakika 10) */}
              {twoFACountdown > 0 ? (
                <div className="inline-flex items-center gap-2 rounded-lg bg-brand-gold-50 border border-brand-gold-200 px-3 py-1.5 text-xs font-bold text-brand-gold-700">
                  ⏳ {t('login.code_expires_in')}: {String(Math.floor(twoFACountdown / 60)).padStart(2, '0')}:{String(twoFACountdown % 60).padStart(2, '0')}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-brand-red bg-brand-red-50 rounded-lg px-3 py-2">
                    ⏳ {t('login.code_expired')}
                  </div>
                  <button type="button" onClick={() => setTwoFA(null)}
                    className="text-xs font-semibold text-brand-blue hover:underline w-full text-center">
                    🔄 {t('login.code_send_new')}
                  </button>
                </div>
              )}
              {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-3">{error}</div>}
              {success && <div className="bg-brand-green-50 text-brand-green text-sm rounded-lg p-3">{success}</div>}
              <button type="submit" disabled={twoFALoading || twoFACountdown <= 0} className="btn-primary w-full bg-brand-orange">
                {twoFALoading ? t('login.verifying') : `${t('login.twofa_submit')} ✓`}
              </button>
              <button type="button" onClick={() => { setTwoFA(null); setError(null); }}
                className="text-xs text-brand-grey-500 hover:underline w-full text-center">
                {t('login.twofa_back')}
              </button>
            </form>
          </div>
        )}

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
                onChange={(e) => onVerifyCodeChange(e.target.value.replace(/\D/g, ''))} required />
              <p className="text-[11px] text-brand-blue flex items-center gap-1.5">⚡ {t('login.code_auto')}</p>
              <p className="text-[11px] text-brand-grey-500">⏳ {t('login.code_expires_min')}</p>
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
