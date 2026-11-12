'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { login, login2FA, extractErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import styles from './login.module.css';

export default function LoginContent() {
  const t = useT();
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);

  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErr, setShowErr] = useState(false);
  const identifierRef = useRef<HTMLInputElement>(null);

  // 2FA — code input inachukua nafasi ya button pale pale
  const [twoFA, setTwoFA] = useState<{ email: string } | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);

  const isEmail = identifier.includes('@');

  // Namba inaweza kuja moja kwa moja kutoka usajili: /login?phone=0712...
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search).get('phone');
    if (p) setIdentifier(decodeURIComponent(p));
  }, []);

  /** Ujumbe wa kosa kwa thamani ya sasa (email ya admin hairuhusiwi kulazimishwa muundo wa namba). */
  function identifierMsg(v: string): string | null {
    const s = v.trim();
    if (!s) return t('login.err_phone_required');
    if (!s.includes('@') && !/^(\+?255|0)\d{9}$/.test(s.replace(/[\s-]/g, ''))) {
      return t('login.err_phone_invalid');
    }
    return null;
  }

  function changeIdentifier(v: string) {
    setIdentifier(v);
    setError(null);
    if (showErr) setError(identifierMsg(v));
  }

  function blurIdentifier() {
    if (!identifier.trim() && !showErr) return; // kosa lisianze kabla mtu kuandika
    setShowErr(true);
    setError(identifierMsg(identifier));
  }

  function validateIdentifier(): boolean {
    setShowErr(true);
    const msg = identifierMsg(identifier);
    if (msg) {
      setError(msg);
      identifierRef.current?.focus();
      return false;
    }
    setError(null);
    return true;
  }

  function isErrorNetwork(err: any): boolean {
    return (
      !err?.response &&
      (err?.message === 'Network Error' ||
        err?.code === 'ERR_NETWORK' ||
        err?.code === 'ERR_CONNECTION_REFUSED')
    );
  }

  // Submit — namba ya simu inaingia moja kwa moja; email ya admin inaweza kuomba 2FA
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateIdentifier()) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = await login(identifier.trim());
      if (res.two_factor_required) {
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
      const returnTo = sessionStorage.getItem('kv_return_to');
      if (returnTo) {
        sessionStorage.removeItem('kv_return_to');
        router.push(returnTo);
      } else {
        router.push(res.is_admin ? '/admin' : '/dashboard');
      }
    } catch (err: any) {
      if (isErrorNetwork(err)) {
        setError(t('login.error_network'));
      } else {
        const detail = err?.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : t('login.error_user'));
      }
    } finally {
      setLoading(false);
    }
  }

  // Auto-submit — code 6 tarakimu inajiingiza yenyewe
  async function submitTwoFA(code: string) {
    if (code.length !== 6 || twoFALoading) return;
    setTwoFALoading(true);
    setError(null);
    try {
      const res = await login2FA(twoFA!.email, code);
      setAuth(res.access_token, {
        user_id: res.user_id,
        full_name: res.full_name,
        phone_primary: res.phone_primary || twoFA!.email,
        category: (res.category as 'health' | 'education') || undefined,
        cadre_code: res.cadre_code,
        is_admin: res.is_admin,
        is_verified: res.is_verified,
      });
      const returnTo = sessionStorage.getItem('kv_return_to');
      if (returnTo) {
        sessionStorage.removeItem('kv_return_to');
        router.push(returnTo);
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      if (isErrorNetwork(err)) {
        setError(t('login.error_network'));
      } else {
        setError(extractErrorMessage(err, t('login.error_user')));
      }
    } finally {
      setTwoFALoading(false);
    }
  }

  function onTwoFAChange(v: string) {
    const code = v.replace(/\D/g, '');
    setTwoFACode(code);
    setError(null);
    if (code.length === 6) submitTwoFA(code);
  }

  function cancelTwoFA() {
    setTwoFA(null);
    setTwoFACode('');
    setError(null);
  }

  // Kosa la kisanduku linaonekana chini ya kisanduku; kosa la API chini ya button
  const fieldError = showErr ? identifierMsg(identifier) : null;
  const formError = error && error !== fieldError ? error : null;

  return (
    <main className={styles.page}>
      {/* 1. Kitufe cha Rudi – juu kushoto, hakihesabiwi kwenye kundi la katikati */}
      <Link href="/" className={styles.back}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Rudi
      </Link>

      {/* 2. Kundi la katikati: LOGO + FOMU vimekusanyika pamoja */}
      <div className={styles.content}>
        {/* 2a. Logo – iko NJE ya fomu, juu yake, ndani ya kibox chake */}
        <div className={styles.logoWrap}>
          <div className={styles.logoTile}>
            <Image
              src="/images/LOGOL.png"
              alt="ESSTRANSFER"
              width={170}
              height={170}
              priority
              className={styles.logo}
            />
          </div>
        </div>

        {/* 2b. Fomu – HAINA boda, HAINA kivuli, HAINA background */}
        <form className={styles.form} onSubmit={twoFA ? (e) => e.preventDefault() : onSubmit} noValidate>
          <h1 className={styles.title}>{t('login.welcome')}</h1>
          <p className={styles.subtitle}>{t('login.subtitle')}</p>

          <label htmlFor="phone" className={styles.label}>
            {isEmail ? 'Email ya Admin' : t('login.phone_label')}
          </label>
          <div className={`${styles.field} ${fieldError ? styles.fieldError : ''}`}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
            </svg>
            <input
              ref={identifierRef}
              id="phone"
              name="phone"
              type={isEmail ? 'text' : 'tel'}
              inputMode={isEmail ? 'email' : 'tel'}
              autoComplete={isEmail ? 'email' : 'tel'}
              placeholder={isEmail ? 'admin@kubadilishana.go.tz' : '0712345678'}
              value={identifier}
              onChange={(e) => changeIdentifier(e.target.value)}
              onBlur={blurIdentifier}
              required
              disabled={!!twoFA}
            />
          </div>
          {fieldError && <p className={styles.fieldMsg}>{fieldError}</p>}

          {formError && <p className={styles.fieldMsg} role="alert">{formError}</p>}

          {twoFA ? (
            /* 3. Code ya 2FA – inachukua nafasi ya button pale pale */
            <div className={styles.codeWrap}>
              <div className={`${styles.field} ${styles.codeField}`}>
                <input
                  type="text"
                  inputMode="numeric"
                  className={styles.codeInput}
                  placeholder="000000"
                  maxLength={6}
                  value={twoFACode}
                  onChange={(e) => onTwoFAChange(e.target.value)}
                  autoFocus
                  disabled={twoFALoading}
                  aria-label="Code ya uthibitisho"
                />
              </div>
              <button type="button" onClick={cancelTwoFA} className={styles.codeX} title="Rudi">
                <X size={16} />
              </button>
              <p className={styles.codeNote}>
                Code ya tarakimu 6 imetumwa kwa {twoFA.email}
              </p>
            </div>
          ) : (
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? t('login.logging_in') : t('login.submit')}
            </button>
          )}

          <Link href="/forgot-password" className={styles.link}>
            Umesahau namba? Bonyeza hapa
          </Link>

          <Link href="/register" className={styles.btnOutline}>
            {t('login.register_now')}
          </Link>
        </form>
      </div>
    </main>
  );
}
