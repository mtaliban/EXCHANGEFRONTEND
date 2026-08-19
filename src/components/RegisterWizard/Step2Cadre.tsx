'use client';

import { useEffect, useState } from 'react';
import { getCadres, getDepartments, getSubjects, type Cadre, type Department, type Subject } from '@/lib/api';
import { useDataVersion } from '@/lib/useDataVersion';
import { useT } from '@/lib/i18n';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  initial: any;
  onBack: () => void;
  onNext: (data: any) => void;
}

export default function Step2Cadre({ initial, onBack, onNext }: Props) {
  const t = useT();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [category, setCategory] = useState<string>('');
  const [cadres, setCadres] = useState<Cadre[]>([]);
  const [cadre_code, setCadreCode] = useState<string>(initial.cadre_code || '');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(initial.subjects || []);
  const [error, setError] = useState<string | null>(null);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const dv = useDataVersion();
  // EVENT-DRIVEN: refetch on focus (user rudi kutoka tab/kingine) + emitDataChanged
  // (admin anapoongeza/badilisha data). Hakuna polling ya 30s — inasababisha flicker.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener('focus', onFocus);
    return () => { window.removeEventListener('focus', onFocus); };
  }, []);
  const forceRefresh = dv + tick;

  useEffect(() => {
    getDepartments()
      .then((list) => {
        const active = list.filter((d) => d.status !== 'disabled');
        setDepartments(active);
        if (initial.category && active.some((d) => d.code === initial.category)) {
          setCategory(initial.category);
        } else if (!category && active.length > 0) {
          setCategory(active[0].code);
        }
      })
      .catch(() => setError(t('step2.err_load_cadres')));
  }, [forceRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!category) { setCadres([]); return; }
    getCadres(category).then(setCadres).catch(() => setError(t('step2.err_load_cadres')));
  }, [category, forceRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentCadre = cadres.find((c) => c.code === cadre_code);
  const needsSubjects = currentCadre?.requires_subjects;
  const subjectLevel: 'Primary' | 'Secondary' | undefined =
    currentCadre?.level === 'Primary' ? 'Primary' : currentCadre?.level === 'Secondary' ? 'Secondary' : undefined;
  const showSubjects = !!currentCadre && (!!subjectLevel || !!needsSubjects);

  useEffect(() => {
    if (showSubjects && subjectLevel) {
      // Only show loading spinner on FIRST load, not on silent background refresh
      if (!subjects.length) setLoadingSubjects(true);
      getSubjects(subjectLevel)
        .then((list) => {
          setSubjects(list);
          const codes = new Set(list.map((s) => s.code));
          setSelectedSubjects((prev) => prev.filter((c) => codes.has(c)));
        })
        .catch(() => setError(t('step2.err_load_subjects')))
        .finally(() => setLoadingSubjects(false));
    } else if (!showSubjects) {
      setSubjects([]);
    }
  }, [showSubjects, subjectLevel, forceRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSubject(code: string) {
    setSelectedSubjects((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!category || !cadre_code) { setError(t('step2.err_choose')); return; }
    onNext({ category, cadre_code, subjects: selectedSubjects });
  }

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <h2 className="text-base font-bold text-brand-grey-900 mb-1">{t('step2.title')}</h2>

      <div>
        <label className="label">{t('step2.department')} *</label>
        <div className="grid grid-cols-2 gap-2">
          {departments.map((d) => (
            <button key={d.code} type="button"
              onClick={() => { setCategory(d.code); setCadreCode(''); }}
              className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition ${category === d.code ? 'border-brand-blue bg-brand-blue-50 text-brand-blue' : 'border-brand-grey-200 bg-white text-brand-grey-700 hover:border-brand-blue'}`}>
              {d.icon ? `${d.icon} ` : ''}{d.name}
            </button>
          ))}
        </div>
      </div>

      {category && (
        <div>
          <label className="label">{t('step2.cadre')} *</label>
          <select className="input" value={cadre_code} onChange={(e) => setCadreCode(e.target.value)} required>
            <option value="">{t('step2.choose_cadre')}</option>
            {cadres.map((c) => (
              <option key={c.code} value={c.code}>{c.display_name}</option>
            ))}
          </select>
        </div>
      )}

      {showSubjects && (
        <div>
          <label className="label flex items-center gap-1.5">
            {t('step2.subject')}
            <span className="text-[10px] font-semibold text-brand-grey-400 normal-case tracking-normal">({t('msg.optional')})</span>
          </label>

          {loadingSubjects ? (
            <div className="flex items-center justify-center py-6 text-brand-grey-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-sm">{t('msg.loading')}</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((s) => (
                <button key={s.code} type="button" onClick={() => toggleSubject(s.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition whitespace-nowrap ${selectedSubjects.includes(s.code) ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-brand-grey-700 border-brand-grey-300 hover:border-brand-blue'}`}>
                  {s.name}
                </button>
              ))}
            </div>
          )}
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
