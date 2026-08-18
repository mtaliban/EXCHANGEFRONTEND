'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';
import Step1Identity from './Step1Identity';
import Step2Cadre from './Step2Cadre';
import Step3Station from './Step3Station';
import Step4Destinations from './Step4Destinations';
import type { RegisterPayload } from '@/lib/api';
import { register } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';

type WizardData = Partial<RegisterPayload> & { subjects: string[] };

interface Props {
  onComplete: () => void;
}

export default function RegisterWizard({ onComplete }: Props) {
  const t = useT();
  const setAuth = useAuth((s) => s.setAuth);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({ subjects: [], desired_destinations: [] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function next(partial: Partial<WizardData>) {
    setData((d) => ({ ...d, ...partial }));
    setError(null);
    setStep((s) => s + 1);
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit(finalPartial: Partial<WizardData>) {
    const merged = { ...data, ...finalPartial };
    setSubmitting(true);
    setError(null);
    try {
      const res = await register(merged as RegisterPayload);
      setAuth(res.access_token, {
        user_id: res.user_id,
        full_name: res.full_name,
        phone_primary: res.phone_primary || merged.phone_primary!,
        category: (res.category as any) || merged.category,
        cadre_code: res.cadre_code || merged.cadre_code,
      });
      onComplete();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d.msg).join(', ')
            : t('wizard.submit_error')
      );
    } finally {
      setSubmitting(false);
    }
  }

  const STEPS = [
    { n: 1, title: t('wizard.step1') },
    { n: 2, title: t('wizard.step2') },
    { n: 3, title: t('wizard.step3') },
    { n: 4, title: t('wizard.step4') },
  ];

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex-1 flex items-center min-w-0">
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div
                className={clsx(
                  'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition flex-shrink-0',
                  step > s.n
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : step === s.n
                      ? 'bg-brand-blue text-white border-brand-blue'
                      : 'bg-white text-brand-grey-500 border-brand-grey-300'
                )}
              >
                {step > s.n ? '✓' : s.n}
              </div>
              <span className={clsx(
                'text-[10px] sm:text-xs mt-1 text-center truncate w-full px-1 hidden min-[380px]:block',
                step >= s.n ? 'text-brand-grey-900 font-semibold' : 'text-brand-grey-500'
              )}>
                {s.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={clsx(
                'h-1 flex-1 mx-1 rounded transition min-w-0',
                step > s.n ? 'bg-brand-blue' : 'bg-brand-grey-200'
              )} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-brand-red-50 border border-brand-red-100 text-brand-red text-sm rounded-xl p-3.5 mb-4">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="card p-4 sm:p-5">
        {step === 1 && <Step1Identity initial={data} onNext={next} />}
        {step === 2 && <Step2Cadre initial={data} onBack={back} onNext={next} />}
        {step === 3 && <Step3Station initial={data} onBack={back} onNext={next} />}
        {step === 4 && (
          <Step4Destinations
            initial={data}
            onBack={back}
            onSubmit={submit}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}
