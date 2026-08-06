'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(phone, password);
      setAuth(res.access_token, {
        user_id: res.user_id,
        full_name: res.full_name,
        phone_primary: res.phone_primary || phone,
        category: res.category as any,
        cadre_code: res.cadre_code,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Ingia imeshindikana. Kagua namba na password.');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="card">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-brand-grey-900">Karibu Tena</h1>
          <p className="text-brand-grey-500 mt-2">Ingia kwa jina lako na namba ya simu.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Namba ya Simu</label>
            <input type="tel" className="input" placeholder="0712345678"
              value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>

          {error && <div className="bg-brand-red-50 text-brand-red text-sm rounded-lg p-3">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Inaingia...' : 'Ingia'}
          </button>
        </form>

        <p className="text-center text-sm text-brand-grey-500 mt-6">
          Huna akaunti?{' '}
          <Link href="/register" className="text-brand-orange font-semibold hover:underline">Jisajili sasa</Link>
        </p>
      </div>
    </div>
  );
}
