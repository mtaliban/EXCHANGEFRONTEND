'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import StepTitle from './StepTitle';
import InlineError from './InlineError';

interface Props {
  initial: any;
  onBack: () => void;
  onNext: (data: any) => void;
}

export default function Step2bEmploymentSector({ initial, onBack, onNext }: Props) {
  const t = useT();
  const [sector, setSector] = useState<string>(initial.employment_sector || '');
  const [sectorError, setSectorError] = useState<string | null>(null);

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!sector) { setSectorError('Tafadhali jaza wizara yako'); return; }
    onNext({ employment_sector: sector });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <StepTitle t={t} kind="ministry" data={initial} />
        <p className="text-sm text-brand-grey-500">
          Je, unafanya kazi chini ya taasisi gani?
        </p>
      </div>

      <div>
        <label className="label">Wizara</label>
        <select
          className={`input ${sectorError ? 'is-error' : ''}`}
          value={sector}
          onChange={(e) => { setSector(e.target.value); setSectorError(null); }}
        >
          <option value="">-- Chagua --</option>
          <option value="wizara_afya">Wizara ya Afya</option>
          <option value="tamisemi">TAMISEMI</option>
        </select>
        <InlineError message={sectorError} />
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-3">
        <button type="button" onClick={onBack} className="btn-outline flex-1 sm:flex-none">Rudi</button>
        <button type="submit" className="btn-primary flex-1 sm:flex-none">Endelea →</button>
      </div>
    </form>
  );
}
