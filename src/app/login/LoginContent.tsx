'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { login, login2FA } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import AdminCode from '@/components/admin/AdminCode';
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

  /* ---------- CODE YA ADMIN (visanduku 6) ---------- */

  /** Inakagua code kwa API; ikisahihi inahifadhi session. */
  async function thibitishaCode(code: string): Promise<boolean> {
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
      return true;
    } catch {
      return false;
    }
  }

  /** Code ikiwa sahihi (baada ya kijani kuonekana) → ingia. */
  function ingiaAdmin() {
    const returnTo = sessionStorage.getItem('kv_return_to');
    if (returnTo) {
      sessionStorage.removeItem('kv_return_to');
      router.push(returnTo);
    } else {
      router.push('/admin');
    }
  }

  /** Tuma code mpya — login tena kwa email inatuma code nyingine. */
  async function tumaCodeUpya() {
    await login(twoFA!.email);
  }

  function rudiKwenyeKuingia() {
    setTwoFA(null);
    setError(null);
  }

  // Kosa la kisanduku linaonekana chini ya kisanduku; kosa la API chini ya button
  const fieldError = showErr ? identifierMsg(identifier) : null;
  const formError = error && error !== fieldError ? error : null;

  return (
    <main className={styles.page}>
      {/* 1. Kitufe cha Rudi – juu kushoto */}
      <Link href="/" className={styles.back}>
        <ChevronLeft size={16} strokeWidth={2.6} aria-hidden="true" />
        Rudi
      </Link>

      {/* 2. Kundi la katikati: LOGO + FOMU vimekusanyika pamoja */}
      <div className={styles.content}>
        {/* 2a. Logo – iko NJE ya fomu, ndani ya kisanduku chake (kama ilivyokuwa) */}
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
            {/* type="text" + inputMode="text": keyboard isiwe ya namba peke yake —
                Admin anaingia kwa email, namba za simu bado zinapokelewa. */}
            {isEmail ? (
              /* Ikoni ya barua kwa "Email ya Admin" */
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
              </svg>
            )}
            <input
              ref={identifierRef}
              id="phone"
              name="phone"
              type="text"
              inputMode={isEmail ? 'email' : 'text'}
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
            /* 3. Admin: code ya tarakimu 6 kwenye visanduku 6 (hakuna vitufe wala links) */
            <AdminCode
              thibitisha={thibitishaCode}
              umeingia={ingiaAdmin}
              tumaUpya={tumaCodeUpya}
              rudi={rudiKwenyeKuingia}
            />
          ) : (
            <>
              <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading ? t('login.logging_in') : t('login.submit')}
              </button>

              <Link href="/forgot-number" className={styles.link}>
                Umesahau namba? Bonyeza hapa
              </Link>

              <Link href="/register" className={styles.btnOutline}>
                {t('login.register_now')}
              </Link>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
