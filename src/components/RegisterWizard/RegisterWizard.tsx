'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Step1Identity from './Step1Identity';
import Step1bIdara from './Step1bIdara';
import Step2Cadre from './Step2Cadre';
import Step2bEmploymentSector from './Step2bEmploymentSector';
import Step3Station from './Step3Station';
import Step4Destinations from './Step4Destinations';
import type { RegisterPayload } from '@/lib/api';
import { register, extractErrorMessage } from '@/lib/api';
import { useT } from '@/lib/i18n';

type WizardData = Partial<RegisterPayload> & { subjects: string[] };

interface Props {
  onComplete: (data?: any) => void;
}

export default function RegisterWizard({ onComplete }: Props) {
  const t = useT();
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
      // Backend inareturn access_token — tumia ku-auto-login
      onComplete({ ...merged, access_token: res.access_token, user_id: res.user_id });
    } catch (err: any) {
      setError(
        extractErrorMessage(err, t('wizard.submit_error'))
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isHealth = data.category === 'health';
  // Afya: hatua 6 (identity, idara, wizara, kada, kituo, lengo)
  // Elimu/kada nyingine: hatua 5 (identity, idara, kada, kituo, lengo)
  const totalSteps = isHealth ? 6 : 5;
  // Asilimia ya maendeleo: hatua ya sasa / jumla ya hatua (mf. 3/6 = 50%).
  // Inabadilika yenyewe kila "Endelea" au "Rudi" kwa sababu inasoma `step`.
  const progress = Math.round((step / totalSteps) * 100);

  return (
    <div>
      {/* Bar ya asilimia — mahali palipokuwa vizungurushi vya hatua */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-end mb-1.5">
          <span className="text-xs font-bold text-brand-blue">{progress}%</span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-brand-grey-200 overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress}%`}
        >
          <div
            className="h-full rounded-full bg-brand-blue transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-brand-red-50 border border-brand-red-100 text-brand-red text-sm rounded-xl p-3.5 mb-4">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="card p-4 sm:p-5">
        {/* Step 1: Identity — Jina, Simu, WhatsApp */}
        {step === 1 && <Step1Identity initial={data} onNext={next} />}
        {/* Step 2: Idara — Afya / Elimu (wote) */}
        {step === 2 && <Step1bIdara initial={data} onBack={back} onNext={next} />}
        {/* Health: step 3 = Wizara, step 4 = Kada, step 5 = Station, step 6 = Dest */}
        {isHealth && step === 3 && <Step2bEmploymentSector initial={data} onBack={back} onNext={next} />}
        {isHealth && step === 4 && <Step2Cadre initial={data} onBack={back} onNext={next} />}
        {isHealth && step === 5 && <Step3Station initial={data} onBack={back} onNext={next} />}
        {isHealth && step === 6 && (
          <Step4Destinations initial={data} onBack={back} onSubmit={submit} submitting={submitting} />
        )}
        {/* Education: step 3 = Kada, step 4 = Station, step 5 = Dest */}
        {!isHealth && step === 3 && <Step2Cadre initial={data} onBack={back} onNext={next} />}
        {!isHealth && step === 4 && <Step3Station initial={data} onBack={back} onNext={next} />}
        {!isHealth && step === 5 && (
          <Step4Destinations initial={data} onBack={back} onSubmit={submit} submitting={submitting} />
        )}
      </div>
    </div>
  );
}
