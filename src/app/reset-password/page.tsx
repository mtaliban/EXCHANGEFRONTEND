'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/lib/api';

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams?.get('phone');
    if (q) setPhone(q);
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setMessage(null);
    if (password !== password2) { setError('Password hazifanani'); return; }
    if (code.length !== 6) { setError('Code lazima iwe herufi 6'); return; }
    setLoading(true);
    try {
      const res = await resetPassword(phone, code, password);
      setMessage(res.message);
      setTimeout(() => router.push('/login'), 1800);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Kosa');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="card">
        <h1 className="text-2xl font-bold text-brand-grey-900 mb-2">Weka Password Mpya</h1>
        <p className="text-brand-grey-500 text-sm mb-6">Ingiza code uliyopewa + password mpya.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Namba ya Simu</label>
            <input type="tel" className="input" placeholder="0712345678"
              value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <label className="label">Code (herufi 6)</label>
            <input type="text" inputMode="numeric" maxLength={6} className="input text-center text-2xl tracking-widest font-mono"
              placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Password Mpya</label>
              <input type="password" className="input" placeholder="Angalau herufi 6"
                value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label className="label">Rudia</label>
              <input type="password" className="input" placeholder="Rudia"
                value={password2} onChange={(e) => setPassword2(e.target.value)} required />
            </div>
          </div>

          {message && <div className="bg-brand-blue-50 text-brand-blue text-sm rounded-lg p-3">{message}</div>}
          {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-3">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Inasindika...' : 'Badilisha Password'}
          </button>
        </form>

        <p className="text-center text-sm text-brand-grey-500 mt-6">
          <Link href="/forgot-password" className="text-brand-blue hover:underline">Omba code mpya</Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-brand-grey-500">Inapakia...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
