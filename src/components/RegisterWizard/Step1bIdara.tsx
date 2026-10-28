'use client';

import { useEffect, useState } from 'react';
import { getDepartments, type Department } from '@/lib/api';
import { useDataVersion } from '@/lib/useDataVersion';
import { useT } from '@/lib/i18n';
import StepTitle from './StepTitle';
import InlineError from './InlineError';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  initial: any;
  onBack: () => void;
  onNext: (data: any) => void;
}

export default function Step1bIdara({ initial, onBack, onNext }: Props) {
  const t = useT();
  const [category, setCategory] = useState<string>(initial.category || '');
  const [error, setError] = useState<string | null>(null);
  /* Kosa la sehemu ya kuchagua — ujumbe mmoja mwekundu chini ya kisanduku. */
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const dv = useDataVersion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener('focus', onFocus);
    return () => { window.removeEventListener('focus', onFocus); };
  }, []);

  useEffect(() => {
    setLoading(true);
    // bypass cache — idara mpya ya admin ionekane PAPO HAPO kwenye usajili
    // (cache ya 60s ilikuwa inaonyesha orodha ya kale hadi dakika moja).
    getDepartments(true)
      .then((list) => {
        const active = list.filter((d) => d.status !== 'disabled');
        // Onyesha idara zote ACTIVE. Zamani tulificha idara isiyo na kada —
        // hii ilifanya idara MPYA ya admin isionekane kwenye usajili hadi
        // kada iongezwe. Sasa idara isiyo na kada inaonyesha ujumbe mzuri
        // kwenye hatua ya Kada ("rudi nyuma"), mtumiaji hakwami.
        setDepartments(active);
        if (initial.category && active.some((d) => d.code === initial.category)) {
          setCategory(initial.category);
        } else {
          setCategory('');
        }
      })
      .catch(() => setError('Imeshindikana kupata idara'))
      .finally(() => setLoading(false));
  }, [dv, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!category) { setCategoryError('Tafadhali jaza idara yako'); return; }
    onNext({ category });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <StepTitle t={t} kind="department" data={initial} />
        <p className="text-sm text-brand-grey-500">
          Unafanya kazi katika idara gani?
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-brand-grey-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Inapakia...</span>
        </div>
      ) : (
        <div>
          <label className="label">Chagua Idara</label>
          <select
            className={`input ${categoryError ? 'is-error' : ''}`}
            value={category}
            onChange={(e) => { setCategory(e.target.value); setCategoryError(null); }}
            required
          >
            <option value="">-- Chagua Idara --</option>
            {departments.map((d) => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </select>
          <InlineError message={categoryError} />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-brand-red-50 border border-brand-red-100 text-brand-red text-sm rounded-xl p-3">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-3">
        <button type="button" onClick={onBack} className="btn-outline flex-1 sm:flex-none">{t('wizard.back')}</button>
        <button type="submit" className="btn-primary flex-1 sm:flex-none">{t('wizard.next')}</button>
      </div>
    </form>
  );
}
