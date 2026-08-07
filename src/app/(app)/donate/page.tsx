'use client';

import { useEffect, useRef, useState } from 'react';
import { initiatePayment, getPaymentStatus, myPayments } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Method = 'mixx' | 'selcom' | 'airtel' | 'mpesa' | 'halopesa' | 'card';
type Step = 'form' | 'processing' | 'done' | 'failed';

const METHODS: { id: Method; label: string; icon: string; color: string; hint: string }[] = [
  { id: 'mixx', label: 'Mixx by Yas', icon: '📱', color: 'orange', hint: 'USSD push kwenye simu yako' },
  { id: 'mpesa', label: 'M-Pesa', icon: '📱', color: 'red', hint: 'Vodacom M-Pesa push' },
  { id: 'airtel', label: 'Airtel Money', icon: '📱', color: 'red', hint: 'Airtel Money push' },
  { id: 'halopesa', label: 'Halopesa', icon: '📱', color: 'orange', hint: 'TTCL Halopesa push' },
  { id: 'selcom', label: 'Selcom Pesa', icon: '💳', color: 'blue', hint: 'Selcom checkout' },
  { id: 'card', label: 'Kadi (Visa/Mastercard)', icon: '💳', color: 'blue', hint: 'Malipo kwa kadi ya benki' },
];

export default function DonatePage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState(1000);
  const [method, setMethod] = useState<Method>('mixx');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [order, setOrder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [message, setMessage] = useState<string>('');
  const pollRef = useRef<any>(null);

  useEffect(() => { if (user?.phone_primary) setPhone(user.phone_primary); }, [user]);
  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    try { setHistory(await myPayments()); } catch {}
  }

  async function pay() {
    setStep('processing');
    setMessage('Inatuma ombi la malipo...');
    try {
      const o = await initiatePayment({ amount, method, phone, purpose: 'post_vocha' });
      setOrder(o);
      setMessage(o.message || 'Angalia simu yako...');
      if (o.checkout_url) window.open(o.checkout_url, '_blank');
      // poll status every 2s
      pollRef.current = setInterval(async () => {
        try {
          const s = await getPaymentStatus(o.order_id);
          if (s.status === 'paid') {
            clearInterval(pollRef.current);
            setStep('done');
            setMessage('Malipo yamekamilika!');
            loadHistory();
          } else if (s.status === 'failed' || s.status === 'expired') {
            clearInterval(pollRef.current);
            setStep('failed');
            setMessage('Malipo hayakufanikiwa. Jaribu tena.');
          }
        } catch {}
      }, 2000);
      // safety timeout after 2 min
      setTimeout(() => {
        clearInterval(pollRef.current);
        if (step === 'processing') { setStep('failed'); setMessage('Muda umeisha. Jaribu tena.'); }
      }, 120_000);
    } catch (err: any) {
      setStep('failed');
      setMessage(err?.response?.data?.detail || 'Kosa la mtandao. Jaribu tena.');
    }
  }

  function reset() { setStep('form'); setOrder(null); setMessage(''); }

  if (step === 'processing') {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="card text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-orange-100 flex items-center justify-center text-3xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-2xl font-bold text-brand-grey-900 mb-2">Inasubiri Uthibitisho</h2>
          <p className="text-brand-grey-500 mb-1">{message}</p>
          {order && (
            <>
              <p className="text-xs text-brand-grey-400 mt-3">Order ID: {order.order_id}</p>
              <p className="text-xs text-brand-grey-400">TZS {amount.toLocaleString()} — {method.toUpperCase()}</p>
            </>
          )}
          <button onClick={reset} className="btn-outline w-full mt-6 text-sm">Ghairi</button>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="card text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-blue-100 text-brand-blue flex items-center justify-center text-3xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-brand-grey-900 mb-2">Asante Sana!</h2>
          <p className="text-brand-grey-500 mb-2">Umechangia TZS {amount.toLocaleString()} kupitia {method.toUpperCase()}</p>
          {order?.mode === 'mock' && (
            <div className="badge-gold mb-4 mx-auto inline-block">🧪 MOCK MODE — hakuna malipo halisi</div>
          )}
          <button onClick={reset} className="btn-primary w-full mt-4">Changia Tena</button>
        </div>
      </div>
    );
  }

  if (step === 'failed') {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="card text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-red-100 text-brand-red flex items-center justify-center text-3xl mb-4">✗</div>
          <h2 className="text-2xl font-bold text-brand-grey-900 mb-2">Haikufanikiwa</h2>
          <p className="text-brand-grey-500 mb-6">{message}</p>
          <button onClick={reset} className="btn-primary w-full">Jaribu Tena</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-grey-900">Changia Huduma 💝</h1>
        <p className="text-brand-grey-500 text-sm">
          Malipo yanaenda kupitia <b>Selcom</b> (M-Pesa, Mixx by Yas, Airtel Money, Halopesa, kadi).
        </p>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label">Kiasi (TZS)</label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[1000, 5000, 10000, 20000].map((a) => (
              <button key={a} onClick={() => setAmount(a)}
                className={`p-2 rounded-lg border text-sm font-semibold ${amount === a ? 'bg-brand-blue text-white border-brand-blue' : 'border-brand-grey-200 text-brand-grey-700'}`}>
                {a.toLocaleString()}
              </button>
            ))}
          </div>
          <input type="number" className="input" min={500} step={500}
            value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </div>

        <div>
          <label className="label">Njia ya Malipo</label>
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id)}
                className={`p-3 rounded-lg border-2 text-left flex items-center gap-2 text-sm ${method === m.id ? `border-brand-${m.color} bg-brand-${m.color}-50` : 'border-brand-grey-200'}`}>
                <span className="text-xl">{m.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-brand-grey-900">{m.label}</div>
                  <div className="text-[10px] text-brand-grey-500">{m.hint}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Namba ya Simu (yenye pesa)</label>
          <input type="tel" className="input" value={phone}
            onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" />
        </div>

        <button onClick={pay} className="btn-accent w-full text-lg py-3">
          Lipa TZS {amount.toLocaleString()}
        </button>
      </div>

      {history.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-brand-grey-900 mb-2">Historia Yako ya Malipo</h3>
          <div className="divide-y divide-brand-grey-100">
            {history.map((p) => (
              <div key={p.order_id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium">TZS {p.amount?.toLocaleString()} — {p.method}</div>
                  <div className="text-xs text-brand-grey-500">
                    {new Date(p.created_at).toLocaleString('sw-TZ')}
                    {p.mode === 'mock' && <span className="ml-2 text-brand-gold-600">MOCK</span>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  p.status === 'paid' ? 'bg-brand-blue-100 text-brand-blue' :
                  p.status === 'pending' ? 'bg-brand-gold-100 text-brand-gold-600' :
                  'bg-brand-red-100 text-brand-red'
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
