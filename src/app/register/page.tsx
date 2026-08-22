'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import RegisterWizard from '@/components/RegisterWizard/RegisterWizard';
import { useT } from '@/lib/i18n';

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const toastShown = useRef(false);

  function onComplete(data?: any) {
    const phone = data?.phone_primary || '';
    // Show official toast — moja tu
    if (!toastShown.current) {
      toastShown.current = true;
      showRegToast();
    }
    // Redirect to login immediately — phone auto-fill
    router.push(`/login?phone=${encodeURIComponent(phone)}`);
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

function showRegToast() {
  let c = document.getElementById('kv-toasts');
  if (!c) {
    c = document.createElement('div');
    c.id = 'kv-toasts';
    c.className = 'fixed bottom-24 left-3 sm:left-auto sm:right-4 sm:top-3 sm:bottom-auto z-[100] flex flex-col items-end gap-2 pointer-events-none';
    document.body.appendChild(c);
  }
  const el = document.createElement('div');
  el.className = 'pointer-events-auto w-fit min-w-[200px] max-w-[300px] rounded-lg shadow-md border border-green-300 bg-white dark:bg-brand-grey-900 px-4 py-3 text-[12px] font-medium animate-slide-in';
  el.innerHTML = '<div class="font-bold text-green-700 dark:text-green-400">Usajili umefanikiwa — karibu!</div><div class="text-brand-grey-500 mt-0.5">Unaelekezwa kwenye login...</div>';
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
}
