'use client';

import { AlertCircle, Building2, Building } from 'lucide-react';
import { useState } from 'react';

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
    if (!sector) { setError('Chagua sehemu ya ajira'); return; }
    onNext({ employment_sector: sector });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-brand-grey-900 mb-1">Sehemu ya Ajira</h2>
        <p className="text-sm text-brand-grey-500">
          Je, unafanya kazi chini ya taasisi gani? Hii itasaidia mfumo kuonyesha vituo sahihi.
        </p>
      </div>

      <div className="space-y-3">
        {/* Wizara ya Afya */}
        <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
          sector === 'wizara_afya'
            ? 'border-brand-blue bg-brand-blue-50 dark:bg-brand-blue-900/20'
            : 'border-brand-grey-200 dark:border-brand-grey-700 hover:border-brand-blue/50'
        }`}>
          <input
            type="radio"
            name="employment_sector"
            value="wizara_afya"
            checked={sector === 'wizara_afya'}
            onChange={(e) => setSector(e.target.value)}
            className="mt-1 w-4 h-4 text-brand-blue"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Building2 size={18} className={sector === 'wizara_afya' ? 'text-brand-blue' : 'text-brand-grey-500'} />
              <span className="font-semibold text-brand-grey-900">Wizara ya Afya</span>
            </div>
            <p className="text-xs text-brand-grey-500 mt-1">
              Hospitali za Rufaa (RRH), Hospitali za Taifa (Muhimbili, Ocean Road, n.k.)
            </p>
            <p className="text-xs text-brand-blue font-medium mt-1">
              Utaandika: Mkoa + Jina la Hospitali
            </p>
          </div>
        </label>

        {/* TAMISEMI */}
        <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
          sector === 'tamisemi'
            ? 'border-brand-blue bg-brand-blue-50 dark:bg-brand-blue-900/20'
            : 'border-brand-grey-200 dark:border-brand-grey-700 hover:border-brand-blue/50'
        }`}>
          <input
            type="radio"
            name="employment_sector"
            value="tamisemi"
            checked={sector === 'tamisemi'}
            onChange={(e) => setSector(e.target.value)}
            className="mt-1 w-4 h-4 text-brand-blue"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Building size={18} className={sector === 'tamisemi' ? 'text-brand-blue' : 'text-brand-grey-500'} />
              <span className="font-semibold text-brand-grey-900">TAMISEMI</span>
            </div>
            <p className="text-xs text-brand-grey-500 mt-1">
              Halmashauri — Zahanati, Vituo vya Afya, Hospitali za Wilaya/Manispaa
            </p>
            <p className="text-xs text-brand-blue font-medium mt-1">
              Utaandika: Mkoa + Halmashauri + Kituo
            </p>
          </div>
        </label>
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
