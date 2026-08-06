'use client';

import { useState } from 'react';

export default function DonatePage() {
  const [amount, setAmount] = useState(1000);
  const [method, setMethod] = useState<'mixx' | 'selcom' | 'card'>('mixx');
  const [step, setStep] = useState<'form' | 'processing' | 'done'>('form');

  function pay() {
    setStep('processing');
    // DEMO ONLY — hakuna gateway ya kweli
    setTimeout(() => setStep('done'), 2000);
  }

  if (step === 'done') {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="card text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-blue-100 text-brand-blue flex items-center justify-center text-3xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-brand-grey-900 mb-2">Asante Sana!</h2>
          <p className="text-brand-grey-500 mb-4">Umechangia TZS {amount.toLocaleString()} kupitia {method === 'mixx' ? 'Mixx by Yas' : method === 'selcom' ? 'Selcom' : 'Kadi'}.</p>
          <div className="badge-gold mb-6">DEMO — hakuna malipo ya kweli yamefanyika</div>
          <button onClick={() => setStep('form')} className="btn-primary w-full">Changia Tena</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-brand-grey-900">Changia Huduma 💝</h1>
      <p className="text-brand-grey-500 text-sm">Mchango wako unatusaidia kuboresha mfumo na kutoa huduma bure kwa watumishi zaidi wa Tanzania.</p>

      <div className="badge-gold">🧪 DEMO MODE — malipo bado hayajaunganishwa</div>

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
          <div className="space-y-2">
            {[
              { id: 'mixx', label: 'Mixx by Yas', hint: '255710703705', color: 'orange', icon: '📱' },
              { id: 'selcom', label: 'Selcom Pesa', hint: '255710703705', color: 'red', icon: '💳' },
              { id: 'card', label: 'Kadi ya Benki (Visa/Mastercard)', hint: 'Salama', color: 'blue', icon: '💳' },
            ].map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id as any)}
                className={`w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 ${method === m.id ? `border-brand-${m.color} bg-brand-${m.color}-50` : 'border-brand-grey-200'}`}>
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-brand-grey-900">{m.label}</div>
                  <div className="text-xs text-brand-grey-500">{m.hint}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${method === m.id ? `border-brand-${m.color} bg-brand-${m.color}` : 'border-brand-grey-300'}`} />
              </button>
            ))}
          </div>
        </div>

        <button onClick={pay} disabled={step === 'processing'} className="btn-accent w-full">
          {step === 'processing' ? 'Inasindika...' : `Changia TZS ${amount.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}
