'use client';

/* =========================================================================
   UMESAHAU NAMBA – /forgot-number
   Skrini 1: Tafuta (Jina Kamili)  →  vidoti vya loading  →
   Skrini 2: Namba zako (Simu + WhatsApp, kila moja na "Ingia ›")  →
   /login?phone=…  (namba inajazwa tayari kwenye ukurasa wa Ingia)
   ========================================================================= */

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { lookupByName } from '@/lib/api';
import s from './forgot.module.css';

type Matokeo = { jina: string; kada: string; simu: string; whatsapp: string };

/* API halisi: POST /auth/lookup-by-name → { users: [...] }.
   Inarudisha mtu aliyesajiliwa kwa jina hili, au null kama hakuna. */
async function tafutaNamba(jina: string): Promise<Matokeo | null> {
  const res = await lookupByName(jina);
  const u: any = (res?.users || [])[0];
  if (!u) return null;
  return {
    jina: u.full_name || jina,
    kada: u.cadre_display || u.cadre_code || '',
    simu: u.phone_primary || '',
    whatsapp: u.phone_alt || '',
  };
}

/* ---------- Ikoni ---------- */
const Mtu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5" /><circle cx="12" cy="10" r="3" /><path d="M6.8 18.4a6 6 0 0 1 10.4 0" /></svg>
);
const Simu = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
);
const WhatsApp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" /></svg>
);
const Mbele = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
);

export default function ForgotNumberPage() {
  const router = useRouter();
  const [jina, setJina] = useState('');
  const [loading, setLoading] = useState(false);
  const [kosa, setKosa] = useState('');
  const [mtu, setMtu] = useState<Matokeo | null>(null);

  async function tafuta(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!jina.trim() || loading) return;
    setLoading(true);
    setKosa('');
    try {
      const m = await tafutaNamba(jina.trim());
      if (m) setMtu(m);
      else setKosa('Hakuna namba kwa jina hili');
    } catch {
      setKosa('Hakuna namba kwa jina hili');
    } finally {
      setLoading(false);
    }
  }

  const ingia = (namba: string) => router.push(`/login?phone=${encodeURIComponent(namba)}`);

  return (
    <main className={s.page}>
      <Link href="/login" className={s.back}>
        <ChevronLeft size={16} strokeWidth={2.6} aria-hidden="true" />
        Rudi
      </Link>

      <div className={s.content}>
        <div className={s.logoWrap}>
          <div className={s.logoTile}>
            <Image
              src="/images/LOGOL.png"
              alt="ESSTRANSFER"
              width={170}
              height={170}
              priority
              className={s.logo}
            />
          </div>
        </div>

        {!mtu ? (
          /* ---------- SKRINI 1: Tafuta ---------- */
          <form className={s.form} onSubmit={tafuta}>
            <h1 className={s.title}>Umesahau namba yako?</h1>

            <label htmlFor="jina" className={s.label}>
              Jina Kamili
            </label>
            <div className={s.field}>
              <span className={s.fieldIc}>
                <Mtu />
              </span>
              <input
                id="jina"
                name="jina"
                autoComplete="name"
                placeholder="Jina lako kamili kama ulilosajilia"
                value={jina}
                onChange={(e) => {
                  setJina(e.target.value);
                  setKosa('');
                }}
              />
            </div>
            {kosa && <p className={s.kosa}>{kosa}</p>}

            <button
              type="submit"
              className={s.btnPrimary}
              disabled={!jina.trim() || loading}
              aria-busy={loading}
            >
              {loading ? (
                <span className={s.dots} aria-label="Inatafuta">
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                'Tafuta Namba Zangu'
              )}
            </button>

            <Link href="/login" className={s.btnSec}>
              <ChevronLeft size={16} strokeWidth={2.6} aria-hidden="true" />
              Rudi kwenye kuingia
            </Link>
          </form>
        ) : (
          /* ---------- SKRINI 2: Namba zako ---------- */
          <div className={s.form}>
            <h1 className={s.title}>Namba zako</h1>

            <div className={s.who}>
              <span className={s.whoIc}>
                <Mtu />
              </span>
              <div className={s.w}>
                <p className={s.whoName}>{mtu.jina}</p>
                <p className={s.whoKada}>{mtu.kada}</p>
              </div>
            </div>

            <div className={s.list}>
              <div className={s.row}>
                <span className={s.rowIc}>
                  <Simu />
                </span>
                <div className={s.w}>
                  <small>Simu</small>
                  <b>{mtu.simu}</b>
                </div>
                <button type="button" className={s.go} onClick={() => ingia(mtu.simu)}>
                  Ingia <Mbele />
                </button>
              </div>
              {mtu.whatsapp && (
                <div className={s.row}>
                  <span className={`${s.rowIc} ${s.rowIcWa}`}>
                    <WhatsApp />
                  </span>
                  <div className={s.w}>
                    <small>WhatsApp</small>
                    <b>{mtu.whatsapp}</b>
                  </div>
                  <button type="button" className={s.go} onClick={() => ingia(mtu.whatsapp)}>
                    Ingia <Mbele />
                  </button>
                </div>
              )}
            </div>

            {/* Jina linabaki kwenye kisanduku ili arekebishe tu */}
            <button type="button" className={s.btnSec} onClick={() => setMtu(null)}>
              <ChevronLeft size={16} strokeWidth={2.6} aria-hidden="true" />
              Badilisha jina
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
