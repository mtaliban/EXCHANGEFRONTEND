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
    <div className="reg-wizard">
      {error && (
        <div className="flex items-start gap-2.5 bg-brand-red-50 border border-brand-red-100 text-brand-red text-sm rounded-xl p-3.5 mb-4">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="card p-4 sm:p-5">
        {/* Bar nyembamba ya asilimia — juu kabisa ya kichwa cha hatua */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] text-[#64748b]">
              {t('wizard.step_word')} {step} {t('wizard.of')} {totalSteps}
            </span>
            <span className="text-[12px] font-semibold text-[#1e40af]">{progress}%</span>
          </div>
          <div
            className="h-[4px] w-full rounded-full overflow-hidden"
            style={{ backgroundColor: '#e2e8f0' }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progress}%`}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, backgroundColor: '#1e40af', transition: 'width 0.4s ease' }}
            />
          </div>
        </div>

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
