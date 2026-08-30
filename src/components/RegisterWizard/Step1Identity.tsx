'use client';

import { useState, useEffect, useRef } from 'react';
import { useT } from '@/lib/i18n';
import { checkPhone } from '@/lib/api';
import { AlertCircle, Phone, MessageCircle, User, Loader2, CheckCircle2, Heart, GraduationCap, type LucideIcon } from 'lucide-react';

interface Props {
  initial: any;
  onNext: (data: any) => void;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-start gap-1 text-brand-red text-xs mt-1">
      <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
      <span>{msg}</span>
    </p>
  );
}

function FieldLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <label className="label flex items-center gap-1.5">
      <Icon size={14} className="text-brand-blue flex-shrink-0" />
      {children}
    </label>
  );
}

export default function Step1Identity({ initial, onNext }: Props) {
  const t = useT();
  const [full_name, setName] = useState(initial.full_name || '');
  const [phone_primary, setPhone] = useState(initial.phone_primary || '');
  const [phone_alt, setPhoneAlt] = useState(initial.phone_alt || '');
  const [category, setCategory] = useState(initial.category || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  // PHONE CHECK: real-time availability check (debounced)
  const [phoneCheck, setPhoneCheck] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const phoneTimer = useRef<any>(null);
  // WHATSAPP CHECK: same real-time availability check
  const [altCheck, setAltCheck] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const altTimer = useRef<any>(null);

  // Debounced phone check — 500ms baada ya user kuacha kuandika
  useEffect(() => {
    if (!phone_primary || phone_primary.length < 10) { setPhoneCheck('idle'); return; }
    const cleaned = phone_primary.replace(/[\s-]/g, '');
    if (!/^(\+?255|0)\d{9}$/.test(cleaned)) { setPhoneCheck('idle'); return; }
    setPhoneCheck('checking');
    if (phoneTimer.current) clearTimeout(phoneTimer.current);
    phoneTimer.current = setTimeout(() => {
      checkPhone(cleaned).then((r) => {
        setPhoneCheck(r.available ? 'available' : 'taken');
      }).catch(() => setPhoneCheck('idle'));
    }, 500);
    return () => { if (phoneTimer.current) clearTimeout(phoneTimer.current); };
  }, [phone_primary]);

  // Debounced WhatsApp check
  useEffect(() => {
    if (!phone_alt || phone_alt.length < 10) { setAltCheck('idle'); return; }
    const cleaned = phone_alt.replace(/[\s-]/g, '');
    if (!/^(\+?255|0)\d{9}$/.test(cleaned)) { setAltCheck('idle'); return; }
    setAltCheck('checking');
    if (altTimer.current) clearTimeout(altTimer.current);
    altTimer.current = setTimeout(() => {
      checkPhone(cleaned).then((r) => {
        setAltCheck(r.available ? 'available' : 'taken');
      }).catch(() => setAltCheck('idle'));
    }, 500);
    return () => { if (altTimer.current) clearTimeout(altTimer.current); };
  }, [phone_alt]);

  function validate() {
    const e: Record<string, string> = {};
    if (full_name.trim().length < 3) e.full_name = t('step1.err_name');
    if (!/^(\+?255|0)\d{9}$/.test(phone_primary.replace(/[\s-]/g, ''))) {
      e.phone_primary = t('step1.err_phone');
    } else if (phoneCheck === 'taken') {
      e.phone_primary = 'Namba hii tayari inatumiwa';
    }
    if (!category) e.category = 'Chagua idara';
    if (!phone_alt) {
      e.phone_alt = t('step1.err_phone_alt_required');
    } else if (!/^(\+?255|0)\d{9}$/.test(phone_alt.replace(/[\s-]/g, ''))) {
      e.phone_alt = t('step1.err_phone_alt');
    } else    if (altCheck === 'taken') {
      e.phone_alt = 'Namba hii tayari inatumiwa na mtu mwingine';
    }
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
      category,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3.5" noValidate>
      <h2 className="text-base font-bold text-brand-grey-900 mb-1">{t('step1.title')}</h2>

      <div>
        <FieldLabel icon={User}>{t('step1.full_name')} *</FieldLabel>
        <input className="input" value={full_name} onChange={(e) => setName(e.target.value)} placeholder={t('step1.name_ph')} required />
        <FieldError msg={errors.full_name} />
      </div>

      <div>
        <FieldLabel icon={Phone}>{t('step1.phone_normal')} *</FieldLabel>
        <div className="relative">
          <input className={`input pr-9 ${phoneCheck === 'taken' ? '!border-brand-red focus:!ring-brand-red' : phoneCheck === 'available' ? '!border-green-500 focus:!ring-green-500' : ''}`} value={phone_primary} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {phoneCheck === 'checking' && <Loader2 size={14} className="animate-spin text-brand-grey-400" />}
            {phoneCheck === 'available' && <CheckCircle2 size={14} className="text-green-500" />}
            {phoneCheck === 'taken' && <AlertCircle size={14} className="text-brand-red" />}
          </div>
        </div>
        {phoneCheck === 'taken' && (
          <p className="flex items-center gap-1 text-brand-red text-xs mt-1 font-medium">
            <AlertCircle size={11} /> Namba hii tayari inatumiwa na mtu mwingine
          </p>
        )}
        {phoneCheck === 'available' && (
          <p className="flex items-center gap-1 text-green-600 text-xs mt-1 font-medium">
            <CheckCircle2 size={11} /> Namba hii ipo huru
          </p>
        )}
        <FieldError msg={errors.phone_primary} />
      </div>

      <div>
        <FieldLabel icon={MessageCircle}>{t('step1.phone_whatsapp')} *</FieldLabel>
        <div className="relative">
          <input className={`input pr-9 ${altCheck === 'taken' ? '!border-brand-red focus:!ring-brand-red' : altCheck === 'available' ? '!border-green-500 focus:!ring-green-500' : ''}`} value={phone_alt} onChange={(e) => setPhoneAlt(e.target.value)} placeholder="0623456789" required />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {altCheck === 'checking' && <Loader2 size={14} className="animate-spin text-brand-grey-400" />}
            {altCheck === 'available' && <CheckCircle2 size={14} className="text-green-500" />}
            {altCheck === 'taken' && <AlertCircle size={14} className="text-brand-red" />}
          </div>
        </div>
        {altCheck === 'taken' && (
          <p className="flex items-center gap-1 text-brand-red text-xs mt-1 font-medium">
            <AlertCircle size={11} /> Namba hii tayari inatumiwa na mtu mwingine
          </p>
        )}
        {altCheck === 'available' && (
          <p className="flex items-center gap-1 text-green-600 text-xs mt-1 font-medium">
            <CheckCircle2 size={11} /> Namba hii ipo huru
          </p>
        )}
        <FieldError msg={errors.phone_alt} />
      </div>


      <div>
        <FieldLabel icon={Heart}>{t('step2.department')} *</FieldLabel>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="">-- Chagua Idara --</option>
          <option value="health">Afya</option>
          <option value="education">Elimu</option>
        </select>
        <FieldError msg={errors.category} />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary">{t('wizard.next')}</button>
      </div>
    </form>
  );
}
