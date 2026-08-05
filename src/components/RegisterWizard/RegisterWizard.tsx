'use client';

import { useState } from 'react';
import clsx from 'clsx';
import Step1Identity from './Step1Identity';
import Step2Cadre from './Step2Cadre';
import Step3Station from './Step3Station';
import Step4Destinations from './Step4Destinations';
import type { RegisterPayload } from '@/lib/api';
import { register } from '@/lib/api';

type WizardData = Partial<RegisterPayload> & { subjects: string[] };

const STEPS = [
  { n: 1, title: 'Utambulisho' },
  { n: 2, title: 'Kada Yako' },
  { n: 3, title: 'Kituo cha Sasa' },
  { n: 4, title: 'Unakotaka Kwenda' },
];

interface Props {
  onComplete: (data: { user_id: string; full_name: string }) => void;
}

export default function RegisterWizard({ onComplete }: Props) {
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
      localStorage.setItem('kv_token', res.access_token);
      localStorage.setItem('kv_user_id', res.user_id);
      localStorage.setItem('kv_full_name', res.full_name);
      onComplete({ user_id: res.user_id, full_name: res.full_name });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: any) => d.msg).join(', ')
            : 'Usajili umeshindwa. Jaribu tena.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition',
                  step > s.n
                    ? 'bg-brand-blue text-white border-brand-blue'
                    : step === s.n
                      ? 'bg-brand-orange text-white border-brand-orange'
                      : 'bg-white text-brand-grey-500 border-brand-grey-300'
                )}
              >
                {step > s.n ? '✓' : s.n}
              </div>
              <span className={clsx(
                'text-xs mt-1 text-center hidden sm:block',
                step >= s.n ? 'text-brand-grey-900 font-semibold' : 'text-brand-grey-500'
              )}>
                {s.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={clsx(
                'h-1 flex-1 mx-1 rounded transition',
                step > s.n ? 'bg-brand-blue' : 'bg-brand-grey-200'
              )} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <div className="card">
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
