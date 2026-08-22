'use client';

import { useEffect, useState } from 'react';
import { getCadres, getDepartments, getSubjects, type Cadre, type Department, type Subject } from '@/lib/api';
import { useDataVersion } from '@/lib/useDataVersion';
import { useT } from '@/lib/i18n';
import { AlertCircle, Loader2, Heart, GraduationCap, BookOpen, Briefcase } from 'lucide-react';

/** Icon mapping kwa department codes — tumia lucide icons, sio emojis */
const DEPT_ICONS: Record<string, React.ReactNode> = {
  health: <Heart size={16} className="text-red-500" />,
  education: <GraduationCap size={16} className="text-blue-500" />,
};
function DeptIcon({ code }: { code: string }) {
  return <>{DEPT_ICONS[code] || <Briefcase size={16} className="text-brand-grey-500" />}</>;
}

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
    if (showSubjects && selectedSubjects.length < 1) { setError('Chagua angalau somo moja (masomo ni lazima).'); return; }
    onNext({ category, cadre_code, subjects: selectedSubjects });
  }

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <h2 className="text-base font-bold text-brand-grey-900 mb-1">{t('step2.title')}</h2>

      <div>
        <label className="label">{t('step2.department')} *</label>          <select className="input text-base py-3" value={category} onChange={(e) => { setCategory(e.target.value); setCadreCode(''); }} required>
          <option value="">-- Chagua Idara --</option>
          {departments.map((d) => (
            <option key={d.code} value={d.code}>{d.name}</option>
          ))}
        </select>
        {/* Onyesha icon ya idara iliyochaguliwa */}
        {category && (
          <div className="flex items-center gap-2 mt-1.5 text-xs text-brand-grey-500">
            <DeptIcon code={category} />
            <span>{departments.find((d) => d.code === category)?.name || category}</span>
          </div>
        )}
      </div>

      {category && (
        <div>
          <label className="label">{t('step2.cadre')} *</label>
          <select className="input text-base py-3" value={cadre_code} onChange={(e) => setCadreCode(e.target.value)} required>
            <option value="">{t('step2.choose_cadre')}</option>
            {cadres.map((c) => (
              <option key={c.code} value={c.code}>{c.display_name}</option>
            ))}
          </select>
        </div>
      )}          {showSubjects && (
        <div>
          <label className="label flex items-center gap-1.5">
            {t('step2.subject')} <span className="text-brand-red text-xs">*</span>
            <span className="text-[10px] font-semibold text-brand-grey-400 normal-case tracking-normal">(chagua masomo — lazima angalau 1)</span>
          </label>

          {loadingSubjects ? (
            <div className="flex items-center justify-center py-6 text-brand-grey-400">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-sm">{t('msg.loading')}</span>
            </div>
          ) : (
            <>
              {/* Dropdown ya somo la kwanza */}
              <select className="input text-base py-3 mb-2" value={selectedSubjects[0] || ''} onChange={(e) => {
                const val = e.target.value;
                if (val) setSelectedSubjects((prev) => [val, prev[1] || ''].filter(Boolean));
                else setSelectedSubjects((prev) => prev.slice(1));
              }}>
                <option value="">-- Somo la kwanza --</option>
                {subjects.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
              {/* Dropdown ya somo la pili (hiari) */}
              <select className="input text-base py-3" value={selectedSubjects[1] || ''} onChange={(e) => {
                const val = e.target.value;
                if (val) setSelectedSubjects((prev) => [prev[0] || '', val].filter(Boolean));
                else setSelectedSubjects((prev) => [prev[0]].filter(Boolean));
              }}>
                <option value="">-- Somo la pili (hiari) --</option>
                {subjects.filter((s) => s.code !== selectedSubjects[0]).map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
              {selectedSubjects.length > 0 && (
                <div className="flex items-center gap-2 mt-1.5 text-xs text-green-600">
                  <BookOpen size={12} />
                  <span>Umepata: {selectedSubjects.length} somo{selectedSubjects.length > 1 ? 'i' : ''}</span>
                </div>
              )}
            </>
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
