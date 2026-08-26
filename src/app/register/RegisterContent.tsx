'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import RegisterWizard from '@/components/RegisterWizard/RegisterWizard';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';

export default function RegisterContent() {
  const t = useT();
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const toastShown = useRef(false);

  function onComplete(data?: any) {
    if (!data?.access_token) {
      // Fallback: kama hakuna token, elekeza login
      router.push(`/login?phone=${encodeURIComponent(data?.phone_primary || '')}`);
      return;
    }
    // AUTO-LOGIN — mtu amesajiliwa, aingie moja kwa moja
    if (!toastShown.current) {
      toastShown.current = true;
      showRegToast();
    }
    setAuth(data.access_token, {
      user_id: data.user_id,
      full_name: data.full_name || '',
      phone_primary: data.phone_primary || '',
      category: data.category,
      cadre_code: data.cadre_code,
      is_admin: false,
      is_verified: false,
    });
    // Redirect dashboard mara moja
    router.push('/dashboard');
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-grey-600 hover:text-brand-blue transition mb-4"
      >
        <ArrowLeft size={16} />
        {t('action.back')}
      </Link>

      <div className="text-center mb-6">
        <span className="inline-flex items-center rounded-full bg-brand-blue-50 border border-brand-blue-100 px-3 py-1 text-xs font-semibold text-brand-blue mb-2">
          {t('reg.badge')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-grey-900 dark:text-white">{t('reg.title')}</h1>
        <p className="text-brand-grey-500 dark:text-brand-grey-400 mt-1">{t('reg.subtitle')}</p>
      </div>

      <RegisterWizard onComplete={(d) => onComplete(d)} />

      <p className="text-center text-sm text-brand-grey-500 dark:text-brand-grey-400 mt-6">
        {t('reg.have_account')}{' '}
        <Link href="/login" className="text-brand-blue font-semibold hover:underline">
          {t('reg.login_link')}
        </Link>
      </p>
    </div>
  );
}

/** Toast — centered, kisomi, ya kiserikali */
function showRegToast() {
  let c = document.getElementById('kv-toasts');
  if (!c) {
    c = document.createElement('div');
    c.id = 'kv-toasts';
    c.className = 'fixed inset-x-0 top-6 z-[100] flex justify-center pointer-events-none';
    document.body.appendChild(c);
  }
  const el = document.createElement('div');
  el.className = 'pointer-events-auto w-fit max-w-sm rounded-xl shadow-lg border border-green-300 bg-white dark:bg-brand-grey-900 px-5 py-3.5 text-sm animate-slide-in';
  el.innerHTML = `
    <div class="flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <div>
        <div class="font-bold text-green-700 dark:text-green-400">Usajili umefanikiwa</div>
        <div class="text-brand-grey-500 text-xs mt-0.5">Unaelekezwa kwenye dashibodi...</div>
      </div>
    </div>
  `;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 2500);
}
