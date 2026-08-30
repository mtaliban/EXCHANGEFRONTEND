'use client';

import { useEffect, useState } from 'react';
import { getDepartments, type Department } from '@/lib/api';
import { useDataVersion } from '@/lib/useDataVersion';
import { useT } from '@/lib/i18n';
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
    getDepartments()
      .then((list) => {
        const active = list.filter((d) => d.status !== 'disabled');
        setDepartments(active);
        if (initial.category && active.some((d) => d.code === initial.category)) {
          setCategory(initial.category);
        }
      })
      .catch(() => setError('Imeshindikana kupata idara'))
      .finally(() => setLoading(false));
  }, [dv, tick]); // eslint-disable-line react-hooks/exhaustive-deps

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

      {loading ? (
        <div className="flex items-center justify-center py-8 text-brand-grey-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Inapakia...</span>
        </div>
      ) : (
        <div>
          <label className="label">Chagua Idara *</label>
          <select
            className="input"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setError(null); }}
            required
          >
            <option value="">-- Chagua Idara --</option>
            {departments.map((d) => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </select>
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
