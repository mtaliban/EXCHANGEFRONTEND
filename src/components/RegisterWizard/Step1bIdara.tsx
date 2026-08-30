'use client';

import { useEffect, useState } from 'react';
import { getDepartments, type Department } from '@/lib/api';
import { useDataVersion } from '@/lib/useDataVersion';
import { useT } from '@/lib/i18n';
import { AlertCircle, Heart, GraduationCap, Briefcase, Loader2 } from 'lucide-react';

const DEPT_ICONS: Record<string, React.ReactNode> = {
  health: <Heart size={28} />,
  education: <GraduationCap size={28} />,
};
const DEFAULT_ICON = <Briefcase size={28} />;

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
        <div className="grid grid-cols-2 gap-3">
          {departments.map((d) => (
            <button
              key={d.code}
              type="button"
              onClick={() => { setCategory(d.code); setError(null); }}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                category === d.code
                  ? 'border-brand-blue bg-brand-blue-50 dark:bg-brand-blue-900/20'
                  : 'border-brand-grey-200 dark:border-brand-grey-700 hover:border-brand-blue/50'
              }`}
            >
              <div className={`mx-auto mb-2 ${category === d.code ? 'text-brand-blue' : 'text-brand-grey-400'}`}>
                {DEPT_ICONS[d.code] || DEFAULT_ICON}
              </div>
              <div className={`text-sm font-bold ${category === d.code ? 'text-brand-blue' : 'text-brand-grey-700 dark:text-brand-grey-300'}`}>
                {d.name}
              </div>
            </button>
          ))}
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
