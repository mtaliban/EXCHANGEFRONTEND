'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { AlertCircle, Phone, MessageCircle, User, LockKeyhole, type LucideIcon } from 'lucide-react';

interface Props {
  initial: any;
  onNext: (data: any) => void;
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-start gap-1.5 text-brand-red text-xs mt-1.5">
      <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
      <span>{msg}</span>
    </p>
  );
}

function FieldLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <label className="label flex items-center gap-1.5">
      <Icon size={15} className="text-brand-blue flex-shrink-0" />
      {children}
    </label>
  );
}

export default function Step1Identity({ initial, onNext }: Props) {
  const t = useT();
  const [full_name, setName] = useState(initial.full_name || '');
  const [phone_primary, setPhone] = useState(initial.phone_primary || '');
  const [phone_alt, setPhoneAlt] = useState(initial.phone_alt || '');
  const [password, setPassword] = useState(initial.password || '');
  const [password2, setPassword2] = useState(initial.password || '');
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (full_name.trim().length < 3) e.full_name = t('step1.err_name');
    if (!/^(\+?255|0)\d{9}$/.test(phone_primary.replace(/[\s-]/g, ''))) {
      e.phone_primary = t('step1.err_phone');
    }
    // WhatsApp namba ni LAZIMA — kama haijawekwa, button ya WhatsApp haifanyi kazi.
    if (!phone_alt) {
      e.phone_alt = t('step1.err_phone_alt_required');
    } else if (!/^(\+?255|0)\d{9}$/.test(phone_alt.replace(/[\s-]/g, ''))) {
      e.phone_alt = t('step1.err_phone_alt');
    }
    if (password.length < 6) e.password = t('step1.err_password');
    if (password !== password2) e.password2 = t('step1.err_password2');
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
    <form onSubmit={submit} className="space-y-4" noValidate>
      <h2 className="text-lg font-bold text-brand-grey-900 mb-4">{t('step1.title')}</h2>

      <div>
        <FieldLabel icon={User}>{t('step1.full_name')} *</FieldLabel>
        <input className="input" value={full_name} onChange={(e) => setName(e.target.value)} placeholder={t('step1.name_ph')} required />
        <FieldError msg={errors.full_name} />
      </div>

      <div>
        <FieldLabel icon={Phone}>{t('step1.phone_normal')} *</FieldLabel>
        <input className="input" value={phone_primary} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" />
        <p className="text-[11px] text-brand-grey-400 mt-0.5">{t('step1.phone_normal_hint')}</p>
        <FieldError msg={errors.phone_primary} />
      </div>

      <div>
        <FieldLabel icon={MessageCircle}>{t('step1.phone_whatsapp')} *</FieldLabel>
        <input className="input" value={phone_alt} onChange={(e) => setPhoneAlt(e.target.value)} placeholder="0623456789" required />
        <p className="text-[11px] text-brand-grey-400 mt-0.5">{t('step1.phone_whatsapp_hint')}</p>
        <FieldError msg={errors.phone_alt} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel icon={LockKeyhole}>{t('step1.password')} *</FieldLabel>
          <div className="relative">
            <input className="input pr-11" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('step1.min6')} required />
            <button type="button" tabIndex={-1} onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey-400 hover:text-brand-grey-600 transition"
              aria-label="Onyesha/Ficha password">
              <EyeIcon open={showPw} />
            </button>
          </div>
          <FieldError msg={errors.password} />
        </div>
        <div>
          <FieldLabel icon={LockKeyhole}>{t('step1.repeat_password')} *</FieldLabel>
          <div className="relative">
            <input className="input pr-11" type={showPw2 ? 'text' : 'password'} value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder={t('step1.repeat_ph')} required />
            <button type="button" tabIndex={-1} onClick={() => setShowPw2(!showPw2)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey-400 hover:text-brand-grey-600 transition"
              aria-label="Onyesha/Ficha password">
              <EyeIcon open={showPw2} />
            </button>
          </div>
          <FieldError msg={errors.password2} />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button type="submit" className="btn-primary">{t('wizard.next')}</button>
      </div>
    </form>
  );
}
