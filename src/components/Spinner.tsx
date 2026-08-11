'use client';

/** Spinner rahisi na nzuri — inachukua nafasi ya maandishi ya "Inapakia...". */
export default function Spinner({ label, className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <span
        className="inline-block w-5 h-5 rounded-full border-2 border-brand-grey-300 border-t-brand-blue animate-spin"
        role="status"
        aria-label={label || 'Inapakia'}
      />
      {label && <span className="text-sm text-brand-grey-500">{label}</span>}
    </div>
  );
}
