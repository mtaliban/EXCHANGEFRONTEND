'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import RegisterWizard from '@/components/RegisterWizard/RegisterWizard';
import { useT } from '@/lib/i18n';

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function onComplete() {
    // Mtumiaji ameingia tayari (token ipo) — elekeza moja kwa moja kwa dashboard.
    router.push('/dashboard');
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      {/* Mshale wa kurudi home */}
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

      <RegisterWizard onComplete={onComplete} />

      <p className="text-center text-sm text-brand-grey-500 dark:text-brand-grey-400 mt-6">
        {t('reg.have_account')}{' '}
        <Link href="/login" className="text-brand-blue font-semibold hover:underline">
          {t('reg.login_link')}
        </Link>
      </p>
    </div>
  );
}
