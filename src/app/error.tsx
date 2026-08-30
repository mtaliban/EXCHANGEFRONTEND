'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[RootError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center p-6 sm:p-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-brand-red-50 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-bold text-brand-grey-900 mb-2">
          Kuna hitilafu imetokea
        </h2>
        <p className="text-sm text-brand-grey-500 mb-5">
          Tafadhali jaribu tena. Kama inaendelea, wasiliana na admin.
        </p>
        {error?.message && (
          <p className="text-xs text-brand-grey-400 bg-brand-grey-50 rounded-lg p-2 mb-4 font-mono break-all">
            {error.message.slice(0, 200)}
          </p>
        )}
        <div className="flex gap-3">
          <button onClick={reset} className="btn-primary flex-1">
            Jaribu Tena
          </button>
          <Link href="/" className="btn-outline flex-1 text-center">
            Nyumbani
          </Link>
        </div>
      </div>
    </div>
  );
}
