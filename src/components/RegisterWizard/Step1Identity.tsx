'use client';

import { useState } from 'react';

interface Props {
  initial: any;
  onNext: (data: any) => void;
}

export default function Step1Identity({ initial, onNext }: Props) {
  const [full_name, setName] = useState(initial.full_name || '');
  const [phone_primary, setPhone] = useState(initial.phone_primary || '');
  const [phone_alt, setPhoneAlt] = useState(initial.phone_alt || '');
  const [password, setPassword] = useState(initial.password || '');
  const [password2, setPassword2] = useState(initial.password || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (full_name.trim().length < 3) e.full_name = 'Jina lazima liwe angalau herufi 3';
    if (!/^(\+?255|0)\d{9}$/.test(phone_primary.replace(/[\s-]/g, ''))) {
      e.phone_primary = 'Namba ya simu si sahihi (mfano: 0712345678)';
    }
    if (phone_alt && !/^(\+?255|0)\d{9}$/.test(phone_alt.replace(/[\s-]/g, ''))) {
      e.phone_alt = 'Namba ya simu ya pili si sahihi';
    }
    if (password.length < 6) e.password = 'Password lazima iwe angalau herufi 6';
    if (password !== password2) e.password2 = 'Password hazifanani';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    onNext({
      full_name: full_name.trim(),
      phone_primary,
      phone_alt: phone_alt || undefined,
      password,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-xl font-bold text-brand-grey-900 mb-4">Hatua 1: Utambulisho Wako</h2>

      <div>
        <label className="label">Jina Kamili *</label>
        <input className="input" value={full_name} onChange={(e) => setName(e.target.value)} placeholder="Mfano: Kieffer Madyedye" required />
        {errors.full_name && <p className="text-brand-red text-xs mt-1">{errors.full_name}</p>}
      </div>

      <div>
        <label className="label">Namba ya Simu *</label>
        <input className="input" value={phone_primary} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" required />
        {errors.phone_primary && <p className="text-brand-red text-xs mt-1">{errors.phone_primary}</p>}
      </div>

      <div>
        <label className="label">Namba ya Simu ya Pili (hiari)</label>
        <input className="input" value={phone_alt} onChange={(e) => setPhoneAlt(e.target.value)} placeholder="0623456789" />
        {errors.phone_alt && <p className="text-brand-red text-xs mt-1">{errors.phone_alt}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Password *</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Angalau herufi 6" required />
          {errors.password && <p className="text-brand-red text-xs mt-1">{errors.password}</p>}
        </div>
        <div>
          <label className="label">Rudia Password *</label>
          <input className="input" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="Rudia password" required />
          {errors.password2 && <p className="text-brand-red text-xs mt-1">{errors.password2}</p>}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button type="submit" className="btn-primary">Endelea →</button>
      </div>
    </form>
  );
}
