'use client';

import { useState } from 'react';
import { AlertCircle, Heart, GraduationCap } from 'lucide-react';

interface Props {
  initial: any;
  onBack: () => void;
  onNext: (data: any) => void;
}

export default function Step1bIdara({ initial, onBack, onNext }: Props) {
  const [category, setCategory] = useState<string>(initial.category || '');
  const [error, setError] = useState<string | null>(null);

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!category) { setError('Chagua idara'); return; }
    onNext({ category });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-brand-grey-900 mb-1">Idara</h2>
        <p className="text-sm text-brand-grey-500">
          Unafanya kazi katika idara gani?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => { setCategory('health'); setError(null); }}
          className={`p-4 rounded-xl border-2 text-center transition-all ${
            category === 'health'
              ? 'border-brand-blue bg-brand-blue-50 dark:bg-brand-blue-900/20'
              : 'border-brand-grey-200 dark:border-brand-grey-700 hover:border-brand-blue/50'
          }`}
        >
          <Heart size={28} className={`mx-auto mb-2 ${category === 'health' ? 'text-brand-blue' : 'text-brand-grey-400'}`} />
          <div className={`text-sm font-bold ${category === 'health' ? 'text-brand-blue' : 'text-brand-grey-700 dark:text-brand-grey-300'}`}>
            Afya
          </div>
          <div className="text-[10px] text-brand-grey-400 mt-0.5">
            Madaktari, Wauguzi, nk
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setCategory('education'); setError(null); }}
          className={`p-4 rounded-xl border-2 text-center transition-all ${
            category === 'education'
              ? 'border-brand-blue bg-brand-blue-50 dark:bg-brand-blue-900/20'
              : 'border-brand-grey-200 dark:border-brand-grey-700 hover:border-brand-blue/50'
          }`}
        >
          <GraduationCap size={28} className={`mx-auto mb-2 ${category === 'education' ? 'text-brand-blue' : 'text-brand-grey-400'}`} />
          <div className={`text-sm font-bold ${category === 'education' ? 'text-brand-blue' : 'text-brand-grey-700 dark:text-brand-grey-300'}`}>
            Elimu
          </div>
          <div className="text-[10px] text-brand-grey-400 mt-0.5">
            Walimu wa Msingi/Sekondari
          </div>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-brand-red-50 border border-brand-red-100 text-brand-red text-sm rounded-xl p-3">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-3">
        <button type="button" onClick={onBack} className="btn-outline flex-1 sm:flex-none">Rudi</button>
        <button type="submit" className="btn-primary flex-1 sm:flex-none">Endelea</button>
      </div>
    </form>
  );
}
