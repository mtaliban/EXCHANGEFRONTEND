'use client';

import { stepHeadingParts, type StepKind } from './stepHeading';

interface Props {
  t: (key: string, fallback?: string) => string;
  kind: StepKind;
  data: { category?: string };
}

/**
 * Kichwa cha hatua: sehemu ya ordinal ("Hatua ya Kwanza:") ni bluu,
 * jina la hatua ("Utambulisho Wako") ni jeusi.
 */
export default function StepTitle({ t, kind, data }: Props) {
  const { ordinal, name } = stepHeadingParts(t, kind, data);

  return (
    <h2 className="text-base font-bold mb-1">
      <span className="text-[#1e40af]">{ordinal}:</span>{' '}
      <span className="text-[#0f172a]">{name}</span>
    </h2>
  );
}
