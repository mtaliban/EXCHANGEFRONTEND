'use client';

/**
 * Ujumbe MMOJA mwekundu wa kawaida chini ya sehemu ya kuchagua.
 *
 * Hakuna kisanduku (hakuna background, border wala mviringo) — maneno tu
 * mekundu pale pale ambapo ujumbe wa kijani "Namba hii ipo huru" unatokea
 * kwenye hatua ya kwanza. Ukubwa (12px, aikoni 12px, nafasi 4px) unafuata
 * ule wa FieldMessage ya hatua ya kwanza ili yote yafanane.
 */
export default function InlineError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      className="flex items-start gap-1 font-medium"
      style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}
    >
      <i
        className="ti ti-alert-circle flex-shrink-0"
        style={{ fontSize: 12, lineHeight: '16px' }}
        aria-hidden="true"
      />
      <span>{message}</span>
    </p>
  );
}
