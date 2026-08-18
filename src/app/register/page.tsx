'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RegisterWizard from '@/components/RegisterWizard/RegisterWizard';
import { useT } from '@/lib/i18n';

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const [done, setDone] = useState<null | { user_id: string; full_name: string }>(null);

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="card">
          <div className="w-16 h-16 rounded-full bg-brand-blue-100 text-brand-blue mx-auto flex items-center justify-center text-3xl mb-4">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-brand-grey-900 mb-2">{t('reg.success_title')}</h1>
          <p className="text-brand-grey-500 mb-6">
            {t('reg.success_body')} <b>{done.full_name}</b>{t('reg.success_body2')}
          </p>
          <button onClick={() => router.push('/login')} className="btn-primary w-full">
            {t('reg.login_now')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-6">
        <span className="inline-flex items-center rounded-full bg-brand-blue-50 border border-brand-blue-100 px-3 py-1 text-xs font-semibold text-brand-blue mb-2">
          {t('reg.badge')}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-grey-900">{t('reg.title')}</h1>
        <p className="text-brand-grey-500 mt-1">{t('reg.subtitle')}</p>
      </div>

      <RegisterWizard onComplete={(d) => setDone(d)} />

      <p className="text-center text-sm text-brand-grey-500 mt-6">
        {t('reg.have_account')}{' '}
        <Link href="/login" className="text-brand-blue font-semibold hover:underline">
          {t('reg.login_link')}
        </Link>
      </p>
    </div>
  );
}
