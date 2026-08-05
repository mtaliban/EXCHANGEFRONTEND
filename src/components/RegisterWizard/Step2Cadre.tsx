'use client';

import { useEffect, useState } from 'react';
import { getCadres, getSubjects, type Cadre, type Subject } from '@/lib/api';

interface Props {
  initial: any;
  onBack: () => void;
  onNext: (data: any) => void;
}

export default function Step2Cadre({ initial, onBack, onNext }: Props) {
  const [category, setCategory] = useState<'health' | 'education' | ''>(initial.category || '');
  const [cadres, setCadres] = useState<Cadre[]>([]);
  const [cadre_code, setCadreCode] = useState<string>(initial.cadre_code || '');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(initial.subjects || []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) { setCadres([]); return; }
    getCadres(category).then(setCadres).catch(() => setError('Imeshindwa kupakia kada.'));
  }, [category]);

  const currentCadre = cadres.find((c) => c.code === cadre_code);
  const needsSubjects = currentCadre?.requires_subjects;

  useEffect(() => {
    if (needsSubjects && subjects.length === 0) {
      getSubjects().then(setSubjects).catch(() => setError('Imeshindwa kupakia masomo.'));
    }
  }, [needsSubjects, subjects.length]);

  function toggleSubject(code: string) {
    setSelectedSubjects((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!category || !cadre_code) { setError('Tafadhali chagua idara na kada.'); return; }
    if (needsSubjects && selectedSubjects.length === 0) {
      setError('Chagua angalau somo moja.'); return;
    }
    onNext({ category, cadre_code, subjects: needsSubjects ? selectedSubjects : [] });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-xl font-bold text-brand-grey-900 mb-4">Hatua 2: Kada Yako</h2>

      <div>
        <label className="label">Idara *</label>
        <div className="grid grid-cols-2 gap-3">
          <button type="button"
            onClick={() => { setCategory('health'); setCadreCode(''); }}
            className={`p-4 rounded-xl border-2 font-semibold transition ${
              category === 'health'
                ? 'border-brand-blue bg-brand-blue-50 text-brand-blue'
                : 'border-brand-grey-200 bg-white text-brand-grey-700 hover:border-brand-blue'
            }`}>
            🏥 Idara ya Afya
          </button>
          <button type="button"
            onClick={() => { setCategory('education'); setCadreCode(''); }}
            className={`p-4 rounded-xl border-2 font-semibold transition ${
              category === 'education'
                ? 'border-brand-orange bg-brand-orange-50 text-brand-orange'
                : 'border-brand-grey-200 bg-white text-brand-grey-700 hover:border-brand-orange'
            }`}>
            👩‍🏫 Idara ya Elimu
          </button>
        </div>
      </div>

      {category && (
        <div>
          <label className="label">Kada / Cheo Chako *</label>
          <select className="input" value={cadre_code} onChange={(e) => setCadreCode(e.target.value)} required>
            <option value="">-- Chagua kada --</option>
            {cadres.map((c) => (
              <option key={c.code} value={c.code}>{c.display_name}</option>
            ))}
          </select>
        </div>
      )}

      {needsSubjects && (
        <div>
          <label className="label">Somo Unalofundisha * (chagua yote yanayohusika)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {subjects.map((s) => (
              <button key={s.code} type="button" onClick={() => toggleSubject(s.code)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  selectedSubjects.includes(s.code)
                    ? 'bg-brand-gold text-white border-brand-gold'
                    : 'bg-white text-brand-grey-700 border-brand-grey-300 hover:border-brand-gold'
                }`}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-brand-red text-sm">{error}</p>}

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="btn-outline">← Rudi</button>
        <button type="submit" className="btn-primary">Endelea →</button>
      </div>
    </form>
  );
}
