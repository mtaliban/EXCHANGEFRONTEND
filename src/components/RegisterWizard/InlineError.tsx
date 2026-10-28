'use client';

/**
 * Ujumbe MMOJA mwekundu wa kawaida chini ya sehemu ya kuchagua.
 *
 * Hakuna kisanduku (hakuna background, border wala mviringo) — maneno tu
 * mekundu pale pale ambapo ujumbe wa kijani "Namba hii ipo huru" unatokea
 * kwenye hatua ya kwanza.
 */
export default function InlineError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      className="flex items-start gap-1.5 font-medium"
      style={{ color: '#dc2626', fontSize: 14, marginTop: 6 }}
    >
      <i
        className="ti ti-alert-circle flex-shrink-0"
        style={{ fontSize: 16, lineHeight: '20px' }}
        aria-hidden="true"
      />
      <span>{message}</span>
    </p>
  );
}
