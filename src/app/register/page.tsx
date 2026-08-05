'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RegisterWizard from '@/components/RegisterWizard/RegisterWizard';

export default function RegisterPage() {
  const router = useRouter();
  const [done, setDone] = useState<null | { user_id: string; full_name: string }>(null);

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="card">
          <div className="w-16 h-16 rounded-full bg-brand-blue-100 text-brand-blue mx-auto flex items-center justify-center text-3xl mb-4">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-brand-grey-900 mb-2">Umefanikiwa Kujisajili!</h1>
          <p className="text-brand-grey-500 mb-6">
            Karibu <b>{done.full_name}</b>. Akaunti yako imeundwa vizuri.
          </p>
          <button onClick={() => router.push('/login')} className="btn-primary w-full">
            Ingia Sasa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-6">
        <span className="badge-gold mb-2">Usajili</span>
        <h1 className="text-3xl font-bold text-brand-grey-900">Jaza Taarifa Zako</h1>
        <p className="text-brand-grey-500 mt-1">Hatua 4 rahisi. Utamaliza chini ya dakika 3.</p>
      </div>

      <RegisterWizard onComplete={(d) => setDone(d)} />

      <p className="text-center text-sm text-brand-grey-500 mt-6">
        Una akaunti tayari?{' '}
        <Link href="/login" className="text-brand-blue font-semibold hover:underline">
          Ingia hapa
        </Link>
      </p>
    </div>
  );
}
