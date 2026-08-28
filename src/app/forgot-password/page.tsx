'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { lookupByName, forgotPassword, resetPassword } from '@/lib/api';
import { ArrowLeft, AlertCircle, CheckCircle2, User, Phone, KeyRound, Loader2, Search, ArrowRight } from 'lucide-react';

type Step = 'lookup' | 'pick' | 'done';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('lookup');
  const [users, setUsers] = useState<any[]>([]);

  // Hatua 1: Tafuta kwa jina
  async function onLookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const res = await lookupByName(fullName.trim());
      setUsers(res.users || []);
      setStep('pick');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Hakuna mtumiaji aliye na jina hili');
    } finally { setLoading(false); }
  }

  // Hatua 2: Chagua namba → ingia moja kwa moja
  function onPickPhone(phone: string) {
    // Ingia moja kwa moja — hakuna password
    router.push(`/login?phone=${encodeURIComponent(phone)}`);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="absolute top-4 left-4 sm:top-5 sm:left-6">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-grey-600 hover:text-brand-blue transition px-2 py-1.5 rounded-lg hover:bg-brand-grey-100">
          <ArrowLeft size={16} />
          Rudi
        </Link>
      </div>

      <div className="card p-4 sm:p-6">
        {/* ── HATUA 1: WEKA JINA ── */}
        {step === 'lookup' && (
          <>
            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-blue-50 border border-brand-blue-200 flex items-center justify-center">
                <Search size={20} className="text-brand-blue" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-brand-grey-900">Sahau Namba yako?</h1>
              <p className="text-brand-grey-500 text-sm mt-1">Weka jina lako kamili tutakuonyesha namba zako zilizosajiliwa</p>
            </div>

            <form onSubmit={onLookup} className="space-y-3.5">
              <div>
                <label className="label text-xs font-bold uppercase tracking-wider text-brand-grey-500">Jina Kamili</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey-400" />
                  <input type="text" className="input pl-9" placeholder="Jina lako kamili kama ulilosajilia"
                    value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-brand-red-50 text-brand-red text-xs font-semibold rounded-full px-3 py-2 border border-brand-red-200">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button type="submit" disabled={loading || !fullName.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={14} className="animate-spin" /> Inatafuta...</> : 'Tafuta Namba Zangu'}
              </button>
            </form>
          </>
        )}

        {/* ── HATUA 2: CHAGUA NAMBA ── */}
        {step === 'pick' && (
          <>
            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                <Phone size={20} className="text-green-600" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-brand-grey-900">Namba Zako</h1>
              <p className="text-brand-grey-500 text-sm mt-1">Chagua namba ya simu ya kuingia nayo</p>
            </div>

            <div className="space-y-2">
              {users.map((u: any) => (
                <div key={u._id} className="bg-white rounded-xl border border-brand-grey-200 p-4 hover:border-brand-blue hover:shadow-md transition cursor-pointer"
                  onClick={() => onPickPhone(u.phone_primary)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-brand-grey-900 text-sm">{u.full_name}</div>
                      <div className="text-brand-blue font-semibold text-sm mt-0.5 flex items-center gap-1.5">
                        <Phone size={13} /> {u.phone_primary}
                      </div>
                      {u.phone_alt && (
                        <div className="text-brand-grey-500 text-xs mt-0.5 flex items-center gap-1.5">
                          <Phone size={11} /> {u.phone_alt}
                        </div>
                      )}
                      <div className="text-[11px] text-brand-grey-400 mt-1">{u.cadre_display || u.cadre_code}</div>
                    </div>
                    <div className="flex items-center gap-1 text-brand-blue text-xs font-semibold">
                      Ingia <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={() => { setStep('lookup'); setUsers([]); setError(null); }}
                className="w-full text-center text-sm text-brand-grey-500 hover:text-brand-blue transition py-2">
                ← Badilisha jina
              </button>
            </div>
          </>
        )}

        {/* ── HATUA 3: IMEFANIKIWA (hii haifiki hapa tena - router.push inatumika) ── */}
        {step === 'done' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-green-700 mb-1">Umefanikiwa!</h2>
              <p className="text-sm text-brand-grey-500">Inaelekezwa kwenye kuingia...</p>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-brand-grey-500 mt-6">
          <Link href="/login" className="text-brand-blue hover:underline">Rudi kwenye kuingia</Link>
        </p>
      </div>
    </div>
  );
}
