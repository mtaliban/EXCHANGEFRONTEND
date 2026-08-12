'use client';

/**
 * SpringSpinner — spinna inayozunguka kama spring (arc moja inakuja-inatoka
 * huku nzima ikizunguka). Inatumika kwenye hali ya "Processing" ya malipo
 * na buttons zenye kusubiri. Rangi inachukuliwa kutoka `text-*` ya mzazi
 * (currentColor).
 */
export default function SpringSpinner({
  size = 20,
  className = '',
  label,
}: {
  size?: number;
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      role={label ? 'status' : undefined}
      aria-label={label}
    >
      <svg
        className="spring-spinner"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="track" cx="12" cy="12" r="10" strokeWidth="3" />
        <circle className="arc" cx="12" cy="12" r="10" strokeWidth="3" />
      </svg>
      {label && <span className="text-sm font-semibold">{label}</span>}
    </span>
  );
}
