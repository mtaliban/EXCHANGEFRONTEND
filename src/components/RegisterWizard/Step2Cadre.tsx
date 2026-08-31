'use client';

import { useEffect, useState } from 'react';
import { getCadres, getSubjects, type Cadre, type Subject } from '@/lib/api';
import { useDataVersion } from '@/lib/useDataVersion';
import { useT } from '@/lib/i18n';
import { AlertCircle, Loader2, BookOpen } from 'lucide-react';

interface Props {
  initial: any;
  onBack: () => void;
  onNext: (data: any) => void;
}

export default function Step2Cadre({ initial, onBack, onNext }: Props) {
  const t = useT();
  const category: string = initial.category || 'health';
  const employmentSector: string | undefined = initial.employment_sector;
  const [cadres, setCadres] = useState<Cadre[]>([]);
  const [cadre_code, setCadreCode] = useState<string>(initial.cadre_code || '');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(initial.subjects || []);
  const [error, setError] = useState<string | null>(null);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const dv = useDataVersion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener('focus', onFocus);
    return () => { window.removeEventListener('focus', onFocus); };
  }, []);
  const forceRefresh = dv + tick;

  // Load cadres — first time kutoka DB, kisha kutoka cache. Fallback ni hardcoded.
  useEffect(() => {
    if (!category) { setCadres([]); return; }
    getCadres(category, employmentSector).then(setCadres).catch(() => setError(t('step2.err_load_cadres')));
  }, [category, employmentSector, forceRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setSelectedSubjects((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      // Masomo 2 pekee
      if (prev.length >= 2) return prev;
      return [...prev, code];
    });
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!category || !cadre_code) { setError(t('step2.err_choose')); return; }
    if (showSubjects && selectedSubjects.length < 2) { setError('Chagua masomo 2 — ni lazima kabisa.'); return; }
    onNext({ category, cadre_code, subjects: selectedSubjects });
  }

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <h2 className="text-base font-bold text-brand-grey-900 mb-1">{t('step2.cadre')}</h2>

      <div>
        <label className="label">{t('step2.cadre')} *</label>
        <select className="input" value={cadre_code} onChange={(e) => setCadreCode(e.target.value)} required>
          <option value="">{t('step2.choose_cadre')}</option>
          {cadres.map((c) => (
            <option key={c.code} value={c.code}>{c.display_name}</option>
          ))}
        </select>
      </div>          {showSubjects && (
        <div>
          <label className="label flex items-center gap-1.5">
            {t('step2.subject')} <span className="text-brand-red text-xs">*</span>
            <span className="text-[10px] font-semibold text-brand-grey-400 normal-case tracking-normal">(lazima somo 2)</span>
          </label>

          {loadingSubjects ? (
            <div className="flex items-center justify-center py-6 text-brand-grey-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-sm">{t('msg.loading')}</span>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-brand-grey-500 mb-2">Chagua somo unalofundisha</p>
              {subjects.map((s) => {
                const checked = selectedSubjects.includes(s.code);
                const disabled = !checked && selectedSubjects.length >= 2;
                return (
                  <label
                    key={s.code}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition cursor-pointer ${
                      checked
                        ? 'border-brand-blue bg-brand-blue-50 dark:bg-brand-blue-900/20'
                        : disabled
                          ? 'border-brand-grey-200 dark:border-brand-grey-700 opacity-50 cursor-not-allowed'
                          : 'border-brand-grey-200 dark:border-brand-grey-700 hover:border-brand-blue/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-brand-grey-300 text-brand-blue focus:ring-brand-blue"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleSubject(s.code)}
                    />
                    <span className={`text-sm ${checked ? 'font-semibold text-brand-blue' : 'text-brand-grey-700 dark:text-brand-grey-300'}`}>
                      {s.name}
                    </span>
                  </label>
                );
              })}
              {selectedSubjects.length > 0 && (
                <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                  <BookOpen size={12} />
                  <span>Umepata: {selectedSubjects.length} somo{selectedSubjects.length > 1 ? 'i' : ''}</span>
                </div>
              )}
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
