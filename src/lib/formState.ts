'use client';

import { useCallback, useState } from 'react';

/**
 * ── MFUMO MMOJA WA HALI YA KISANDUKU ────────────────────────────────────
 * Kila kisanduku cha fomu kina hali MOJA tu kwa wakati:
 *   'neutral'  → hakuna ujumbe
 *   'error'    → ujumbe mmoja mwekundu
 *   'success'  → ujumbe mmoja wa kijani
 * Hali mpya INAFUTA ya zamani kabisa — kosa na mafanikio haviwezi
 * kuonekana pamoja kwenye kisanduku kimoja.
 */
export type FieldState = 'neutral' | 'error' | 'success';

export interface FieldStatus {
  state: FieldState;
  message?: string;
}

export type FieldStatuses = Record<string, FieldStatus>;

export interface FieldStateApi {
  /** Hali ya kila kisanduku kwa jina la kisanduku (mf. 'phone_primary'). */
  statuses: FieldStatuses;
  /** setFieldState('phone_alt', 'error', 'Namba si sahihi') — hufuta hali ya awali kwanza. */
  setFieldState: (field: string, state: FieldState, message?: string) => void;
  /** Hufuta hali zote (mf. baada ya kuhamisha hatua). */
  resetFieldStates: () => void;
}

export function useFieldStates(): FieldStateApi {
  const [statuses, setStatuses] = useState<FieldStatuses>({});

  const setFieldState = useCallback((field: string, state: FieldState, message?: string) => {
    setStatuses((prev) => {
      // neutral (au ujumbe mtupu) = futa hali ya kisanduku hiki KABISA
      if (state === 'neutral' || !message) {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      }
      if (prev[field]?.state === state && prev[field]?.message === message) return prev;
      return { ...prev, [field]: { state, message } };
    });
  }, []);

  const resetFieldStates = useCallback(() => setStatuses({}), []);

  return { statuses, setFieldState, resetFieldStates };
}

/** Class ya mpaka kulingana na hali: '' | 'is-error' | 'is-success'. */
export function fieldClass(status?: FieldStatus): string {
  if (!status || status.state === 'neutral') return '';
  return status.state === 'error' ? 'is-error' : 'is-success';
}
