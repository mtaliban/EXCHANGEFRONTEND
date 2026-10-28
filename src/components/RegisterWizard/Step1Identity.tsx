'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/lib/i18n';
import StepTitle from './StepTitle';
import { checkPhone } from '@/lib/api';
import { useFieldStates, fieldClass, type FieldStatus } from '@/lib/formState';
import FieldMessage from '@/components/FieldMessage';
import { Phone, MessageCircle, User, Loader2, CheckCircle2, AlertCircle, type LucideIcon } from 'lucide-react';

interface Props {
  initial: any;
  onNext: (data: any) => void;
}

/** Muundo wa namba ya simu: 07XXXXXXXX, 06XXXXXXXX au +2557XXXXXXXX. */
const PHONE_RE = /^(\+?255|0)\d{9}$/;
const normalizePhone = (v: string) => v.replace(/[\s-]/g, '');
const TAKEN_MSG = 'Namba hii tayari inatumiwa na mtu mwingine';
const FREE_MSG = 'Namba hii ipo huru';
/** Debounce ya kikaguzi cha server (ms). */
const CHECK_DEBOUNCE_MS = 400;

type CheckState = 'idle' | 'checking' | 'available' | 'taken';

function FieldLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <label className="label flex items-center gap-1.5">
      <Icon size={14} className="text-brand-blue flex-shrink-0" />
      {children}
    </label>
  );
}

/** Aikoni ya hali NDANI ya kisanduku (inapakia / imefanikiwa / kosa). */
function TrailingIcon({ status, check }: { status?: FieldStatus; check: CheckState }) {
  if (status?.state === 'error') return <AlertCircle size={14} className="text-brand-red" />;
  if (status?.state === 'success') return <CheckCircle2 size={14} className="text-green-500" />;
  if (check === 'checking') return <Loader2 size={14} className="animate-spin text-brand-grey-400" />;
  return null;
}

export default function Step1Identity({ initial, onNext }: Props) {
  const t = useT();
  const [full_name, setName] = useState(initial.full_name || '');
  const [phone_primary, setPhone] = useState(initial.phone_primary || '');
  const [phone_alt, setPhoneAlt] = useState(initial.phone_alt || '');

  /* MFUMO MMOJA WA HALI — neutral | error | success; ujumbe MMOJA kwa kisanduku. */
  const { statuses, setFieldState } = useFieldStates();

  /* Kosa linaonekana baada ya kutoka kwenye kisanduku (blur) au kubonyeza
   * "Endelea" — si mtu anapoanza kuandika. Likishaonekana, linafutwa mara
   * moja thamani ikiwa sahihi. */
  const shown = useRef<Record<string, boolean>>({});

  /* Kikaguzi cha server: debounce 400ms; jibu la ombi la ZAMANI linapuuzwa. */
  const [phoneCheck, setPhoneCheck] = useState<CheckState>('idle');
  const [altCheck, setAltCheck] = useState<CheckState>('idle');
  const phoneReq = useRef(0);
  const altReq = useRef(0);

  /* Ujumbe wa uhakiki wa muundo — huhesabiwa kutoka THAMANI ya sasa,
   * kamwe haubebi hali ya zamani ya makosa. */
  const nameMsg = (v: string) => {
    const cleaned = v.trim();
    if (!cleaned) return t('step1.err_name_required');            // "Tafadhali ingiza majina yako."
    return cleaned.length < 3 ? t('step1.err_name') : null;       // herufi 3+ baada ya trim
  };
  const primaryMsg = (v: string) => {
    const cleaned = normalizePhone(v);
    if (!cleaned) return t('step1.err_phone_required');           // tupu → "Tafadhali ingiza namba yako ya simu."
    return PHONE_RE.test(cleaned) ? null : t('step1.err_phone');
  };
  const altMsg = (v: string) => {
    const cleaned = normalizePhone(v);
    if (!cleaned) return t('step1.err_phone_alt_empty');          // tupu → "Tafadhali ingiza namba yako ya WhatsApp."
    return PHONE_RE.test(cleaned) ? null : t('step1.err_phone_alt');
  };

  /** Onyesha hali mara moja: ujumbe mpya unafuta kosa AU mafanikio ya zamani kabisa. */
  function applyMsg(field: string, msg: string | null) {
    if (msg) setFieldState(field, 'error', msg);
    else if (statuses[field]) setFieldState(field, 'neutral');
  }

  /** Kila mtu anapoandika: hesabu UPYA; kosa linaondolewa thamani ikiwa sahihi. */
  function revalidate(field: string, msg: string | null) {
    if (msg && shown.current[field]) applyMsg(field, msg);
    else applyMsg(field, null);
  }

  /* ── Kikaguzi cha namba ya kwanza: ombi la mwisho pekee linaandika hali ── */
  useEffect(() => {
    const cleaned = normalizePhone(phone_primary);
    if (!PHONE_RE.test(cleaned)) {
      phoneReq.current++;            // kikaguzi chochote kinachoendelea kimekataliwa
      setPhoneCheck('idle');
      return;
    }
    const id = ++phoneReq.current;
    setPhoneCheck('checking');
    const timer = setTimeout(() => {
      checkPhone(cleaned)
        .then((r) => {
          if (id !== phoneReq.current) return;   // jibu la ombi la zamani — lipuuzwe
          setPhoneCheck(r.available ? 'available' : 'taken');
          setFieldState(
            'phone_primary',
            r.available ? 'success' : 'error',
            r.available ? FREE_MSG : TAKEN_MSG
          );
        })
        .catch(() => { if (id === phoneReq.current) setPhoneCheck('idle'); });
    }, CHECK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [phone_primary, setFieldState]);

  /* ── Kikaguzi cha WhatsApp — kanuni ileile ── */
  useEffect(() => {
    const cleaned = normalizePhone(phone_alt);
    if (!PHONE_RE.test(cleaned)) {
      altReq.current++;
      setAltCheck('idle');
      return;
    }
    const id = ++altReq.current;
    setAltCheck('checking');
    const timer = setTimeout(() => {
      checkPhone(cleaned)
        .then((r) => {
          if (id !== altReq.current) return;
          setAltCheck(r.available ? 'available' : 'taken');
          setFieldState(
            'phone_alt',
            r.available ? 'success' : 'error',
            r.available ? FREE_MSG : TAKEN_MSG
          );
        })
        .catch(() => { if (id === altReq.current) setAltCheck('idle'); });
    }, CHECK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [phone_alt, setFieldState]);

  function changeName(v: string) {
    setName(v);
    revalidate('full_name', nameMsg(v));
  }

  function changePhone(v: string) {
    setPhone(v);
    phoneReq.current++;              // hali ya kikaguzi cha thamani ya zamani imefutwa
    setPhoneCheck('idle');
    revalidate('phone_primary', primaryMsg(v));
  }

  function changeAlt(v: string) {
    setPhoneAlt(v);
    altReq.current++;
    setAltCheck('idle');
    revalidate('phone_alt', altMsg(v));
  }

  function blurName() {
    if (!full_name.trim() && !shown.current.full_name) return;
    shown.current.full_name = true;
    applyMsg('full_name', nameMsg(full_name));
  }

  function blurPhone() {
    if (!phone_primary.trim() && !shown.current.phone_primary) return;
    shown.current.phone_primary = true;
    applyMsg('phone_primary', primaryMsg(phone_primary));
  }

  function blurAlt() {
    if (!phone_alt.trim() && !shown.current.phone_alt) return;
    shown.current.phone_alt = true;
    applyMsg('phone_alt', altMsg(phone_alt));
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    /* "Endelea" hupima kila kisanduku UPYA kutoka thamani iliyopo sasa —
     * haitegemei hali yoyote ya zamani ya makosa. */
    shown.current = { full_name: true, phone_primary: true, phone_alt: true };
    const nameErr = nameMsg(full_name);
    const primaryErr = primaryMsg(phone_primary);
    const altErr = altMsg(phone_alt);
    const primaryTaken = !primaryErr && phoneCheck === 'taken';
    const altTaken = !altErr && altCheck === 'taken';

    applyMsg('full_name', nameErr);
    applyMsg('phone_primary', primaryErr || (primaryTaken ? TAKEN_MSG : null));
    applyMsg('phone_alt', altErr || (altTaken ? TAKEN_MSG : null));

    if (nameErr || primaryErr || altErr || primaryTaken || altTaken) return;

    onNext({
      full_name: full_name.trim(),
      phone_primary,
      phone_alt: phone_alt || undefined,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3.5" noValidate>
      <StepTitle t={t} kind="identity" data={initial} />

      <div>
        <FieldLabel icon={User}>{t('step1.full_name')}</FieldLabel>
        <input
          className={`input ${fieldClass(statuses.full_name)}`}
          value={full_name}
          onChange={(e) => changeName(e.target.value)}
          onInput={(e) => changeName((e.target as HTMLInputElement).value)}
          onBlur={blurName}
          placeholder={t('step1.name_ph')}
        />
        <FieldMessage status={statuses.full_name} />
      </div>

      <div>
        <FieldLabel icon={Phone}>{t('step1.phone_normal')}</FieldLabel>
        <div className="relative">
          <input
            className={`input pr-9 ${fieldClass(statuses.phone_primary)}`}
            value={phone_primary}
            onChange={(e) => changePhone(e.target.value)}
            onInput={(e) => changePhone((e.target as HTMLInputElement).value)}
            onBlur={blurPhone}
            placeholder="0712345678"
            inputMode="tel"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <TrailingIcon status={statuses.phone_primary} check={phoneCheck} />
          </div>
        </div>
        <FieldMessage status={statuses.phone_primary} />
      </div>

      <div>
        <FieldLabel icon={MessageCircle}>{t('step1.phone_whatsapp')}</FieldLabel>
        <div className="relative">
          <input
            className={`input pr-9 ${fieldClass(statuses.phone_alt)}`}
            value={phone_alt}
            onChange={(e) => changeAlt(e.target.value)}
            onInput={(e) => changeAlt((e.target as HTMLInputElement).value)}
            onBlur={blurAlt}
            placeholder="0623456789"
            inputMode="tel"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <TrailingIcon status={statuses.phone_alt} check={altCheck} />
          </div>
        </div>
        <FieldMessage status={statuses.phone_alt} />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary">{t('wizard.next')}</button>
      </div>
    </form>
  );
}
