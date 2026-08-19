'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, User, Phone, ArrowRight } from 'lucide-react';
import RegisterWizard from '@/components/RegisterWizard/RegisterWizard';
import { useT } from '@/lib/i18n';

type Step = 'wizard' | 'success';

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState<Step>('wizard');
  const [registeredPhone, setRegisteredPhone] = useState('');

  function onComplete(data?: any) {
    // Show success screen, then auto-redirect to login
    setRegisteredPhone(data?.phone_primary || '');
    setStep('success');
  }

  // Auto-redirect to login after 4 seconds
  useEffect(() => {
    if (step !== 'success') return;
    const timer = setTimeout(() => {
      router.push(`/login?phone=${encodeURIComponent(registeredPhone)}`);
    }, 4000);
    return () => clearTimeout(timer);
  }, [step, registeredPhone, router]);

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

      {/* ═══ SUCCESS SCREEN ═══ */}
      {step === 'success' && (
        <div className="card p-6 sm:p-8 text-center space-y-5 animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-brand-grey-900 mb-2">
              Usajili Umekamilika!
            </h1>
            <p className="text-sm text-brand-grey-500 leading-relaxed">
              Akaunti yako imetengenezwa kwa mafanikio.
              Unaelekezwa kwenye kuingia sasa...
            </p>
          </div>

          {registeredPhone && (
            <div className="bg-brand-grey-50 rounded-xl p-4 border border-brand-grey-200">
              <div className="flex items-center justify-center gap-2 text-sm text-brand-grey-700">
                <Phone size={14} className="text-brand-blue" />
                <span className="font-semibold">{registeredPhone}</span>
              </div>
              <p className="text-[11px] text-brand-grey-500 mt-1">
                Namba yako ya simu — itajijaza kwenye login page
              </p>
            </div>
          )}

          {/* Countdown */}
          <div className="flex items-center justify-center gap-2 text-xs text-brand-grey-400">
            <span className="w-6 h-6 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold animate-pulse">4</span>
            sekunde kabla ya kupelekwa login...
          </div>

          <Link
            href={`/login?phone=${encodeURIComponent(registeredPhone)}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-brand-blue-700 transition w-full"
          >
            <User size={16} />
            Ngingia Sasa
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ═══ REGISTRATION WIZARD ═══ */}
      {step === 'wizard' && (
        <>
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
        </>
      )}
    </div>
  );
}
