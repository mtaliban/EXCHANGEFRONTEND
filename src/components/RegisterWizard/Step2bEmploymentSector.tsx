'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  initial: any;
  onBack: () => void;
  onNext: (data: any) => void;
}

export default function Step2bEmploymentSector({ initial, onBack, onNext }: Props) {
  const [sector, setSector] = useState<string>(initial.employment_sector || '');
  const [error, setError] = useState<string | null>(null);

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!sector) { setError('Chagua wizara'); return; }
    onNext({ employment_sector: sector });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-brand-grey-900 mb-1">Wizara</h2>
        <p className="text-sm text-brand-grey-500">
          Je, unafanya kazi chini ya taasisi gani?
        </p>
      </div>

      <div>
        <label className="label">Wizara</label>
        <select
          className="input"
          value={sector}
          onChange={(e) => { setSector(e.target.value); setError(null); }}
        >
          <option value="">-- Chagua --</option>
          <option value="wizara_afya">Wizara</option>
          <option value="tamisemi">Halmashauri</option>
        </select>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-brand-red-50 border border-brand-red-100 text-brand-red text-sm rounded-xl p-3">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-3">
        <button type="button" onClick={onBack} className="btn-outline flex-1 sm:flex-none">Rudi</button>
        <button type="submit" className="btn-primary flex-1 sm:flex-none">Endelea →</button>
      </div>
    </form>
  );
}
