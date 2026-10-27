'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { FieldStatus } from '@/lib/formState';

/**
 * Ujumbe MMOJA chini ya kisanduku: kosa (jekundu) au mafanikio (kijani).
 * Kwa kuwa hali ya kisanduku ni moja tu, ujumbe wa kosa na wa kijani
 * hauwezi kuonekana pamoja kamwe.
 */
export default function FieldMessage({
  status,
  fontSize = 12,
  iconSize = 12,
}: {
  status?: FieldStatus;
  fontSize?: number;
  iconSize?: number;
}) {
  if (!status || !status.message || status.state === 'neutral') return null;
  const isError = status.state === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <p
      className={`flex items-start gap-1 font-medium ${isError ? 'text-brand-red' : 'text-green-600'}`}
      style={{ fontSize, marginTop: 4 }}
    >
      <Icon size={iconSize} className="flex-shrink-0" style={{ marginTop: 2 }} />
      <span>{status.message}</span>
    </p>
  );
}
