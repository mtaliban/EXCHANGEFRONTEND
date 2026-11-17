'use client';

/* =========================================================================
   ADMIN – Code ya tarakimu 6 (visanduku 6)
   • Kila tarakimu ina kisanduku chake. Ukiandika, inahamia kisanduku kinachofuata.
   • Ukibandika code nzima (482193) → inajaa visanduku vyote 6 papo hapo.
   • iPhone: "Code kutoka Mail/Messages" juu ya kibodi (autoComplete="one-time-code").
   • Android Chrome: code ikitumwa kwa SMS (yenye mstari "@esstranfer.com #482193")
     → inajazwa YENYEWE (WebOTP).
   • Tarakimu 6 zikijaa → inakaguliwa yenyewe (hakuna kitufe cha kubonyeza).
       Sahihi  → visanduku vyote KIJANI → anaingia papo hapo.
       Si sahihi → visanduku VYEKUNDU + vinatikisika + "Code si sahihi" → vinafutwa ajaribu tena.
   • "Hujapata code? Tuma upya" (baada ya sekunde 45) + "‹ Rudi kwenye kuingia".
   ========================================================================= */

import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import s from './AdminCode.module.css';

const UREFU = 6;
const SUBIRI = 45; // sekunde kabla ya "Tuma upya"

type Hali = 'kawaida' | 'inakagua' | 'kosa' | 'sahihi';

type Props = {
  /** Inarudisha true kama code ni sahihi (API yako). */
  thibitisha: (code: string) => Promise<boolean>;
  /** Inaitwa code ikiwa sahihi (mf. router.push("/admin")). */
  umeingia: () => void;
  /** Tuma code mpya (API yako). */
  tumaUpya: () => Promise<void>;
  /** Rudi kwenye ukurasa wa kuingia. */
  rudi: () => void;
};

const Nyuma = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
);

export default function AdminCode({ thibitisha, umeingia, tumaUpya, rudi }: Props) {
  const [d, setD] = useState<string[]>(Array(UREFU).fill(''));
  const [hali, setHali] = useState<Hali>('kawaida');
  const [sekunde, setSekunde] = useState(SUBIRI);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const lenga = (i: number) => refs.current[Math.max(0, Math.min(UREFU - 1, i))]?.focus();

  // Kisanduku cha kwanza kinapata focus ukurasa ukifunguka
  useEffect(() => {
    lenga(0);
  }, []);

  // Muda wa "Tuma upya"
  useEffect(() => {
    if (sekunde <= 0) return;
    const t = setTimeout(() => setSekunde((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [sekunde]);

  // Android Chrome: soma code kutoka SMS YENYEWE (WebOTP). Kama haiungi mkono → inapuuzwa kimya.
  useEffect(() => {
    if (typeof window === 'undefined' || !('OTPCredential' in window)) return;
    const ac = new AbortController();
    (navigator.credentials as any)
      .get({ otp: { transport: ['sms'] }, signal: ac.signal })
      .then((otp: { code?: string } | null) => {
        if (otp?.code) jaza(otp.code);
      })
      .catch(() => {});
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tarakimu zote 6 zikijaa → kagua yenyewe
  useEffect(() => {
    const code = d.join('');
    if (code.length !== UREFU || hali !== 'kawaida') return;
    setHali('inakagua');
    thibitisha(code)
      .then((sawa) => {
        if (sawa) {
          setHali('sahihi');
          setTimeout(umeingia, 450); // kijani kinaonekana kidogo, kisha anaingia
        } else {
          setHali('kosa');
        }
      })
      .catch(() => setHali('kosa'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);

  // Jaza code nzima (kubandika / iPhone / SMS)
  function jaza(maandishi: string) {
    const tarakimu = maandishi.replace(/\D/g, '').slice(0, UREFU).split('');
    if (!tarakimu.length) return;
    const mpya = Array(UREFU)
      .fill('')
      .map((_, i) => tarakimu[i] ?? '');
    setHali('kawaida');
    setD(mpya);
    lenga(Math.min(tarakimu.length, UREFU - 1));
  }

  function badilika(i: number, v: string) {
    if (hali === 'inakagua' || hali === 'sahihi') return;
    const tar = v.replace(/\D/g, '');
    if (tar.length > 1) {
      jaza(tar);
      return; // iPhone/Android autofill inaweka code nzima kwenye kisanduku kimoja
    }
    const mpya = hali === 'kosa' ? Array(UREFU).fill('') : [...d];
    if (hali === 'kosa') {
      setHali('kawaida');
      mpya[0] = tar;
      setD(mpya);
      lenga(tar ? 1 : 0);
      return;
    }
    mpya[i] = tar;
    setD(mpya);
    if (tar && i < UREFU - 1) lenga(i + 1);
  }

  function kitufe(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !d[i] && i > 0) {
      e.preventDefault();
      const mpya = [...d];
      mpya[i - 1] = '';
      setD(mpya);
      lenga(i - 1);
    }
    if (e.key === 'ArrowLeft') lenga(i - 1);
    if (e.key === 'ArrowRight') lenga(i + 1);
  }

  function bandika(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    jaza(e.clipboardData.getData('text'));
  }

  async function upya() {
    if (sekunde > 0) return;
    setSekunde(SUBIRI);
    setD(Array(UREFU).fill(''));
    setHali('kawaida');
    lenga(0);
    try {
      await tumaUpya();
    } catch {}
  }

  return (
    <div>
      <div className={`${s.otp} ${hali === 'kosa' ? s.kosaSet : ''}`} role="group" aria-label="Code ya tarakimu 6">
        {d.map((x, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={[s.box, x && s.jaa, hali === 'kosa' && s.kosa, hali === 'sahihi' && s.sahihi]
              .filter(Boolean)
              .join(' ')}
            value={x}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={i === 0 ? UREFU : 1}
            aria-label={`Tarakimu ${i + 1}`}
            disabled={hali === 'sahihi'}
            onChange={(e) => badilika(i, e.target.value)}
            onKeyDown={(e) => kitufe(i, e)}
            onPaste={bandika}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>

      {/* Kosa: maandishi mekundu ya kawaida, mstari mmoja */}
      {hali === 'kosa' && <p className={s.ujumbe}>Code si sahihi</p>}

      <p className={s.upya}>
        Hujapata code?{' '}
        <button type="button" onClick={upya} disabled={sekunde > 0} className={s.upyaBtn}>
          {sekunde > 0 ? `Tuma upya (0:${String(sekunde).padStart(2, '0')})` : 'Tuma upya'}
        </button>
      </p>

      <button type="button" className={s.rudi} onClick={rudi}>
        <Nyuma /> Rudi kwenye kuingia
      </button>
    </div>
  );
}
