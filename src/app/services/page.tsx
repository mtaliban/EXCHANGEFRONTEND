"use client";

// Ukurasa wa Huduma Zetu (umma)
import Link from "next/link";
import AppIcon from "@/components/app/AppIcon";
import PublicLayout from "@/components/public/PublicLayout";
import { usePublicLang } from "@/components/public/PublicLang";
import s from "@/components/public/public.module.css";

const HUDUMA = [
  { icon: "steth", sw: "Watumishi wa Afya", en: "Health Workers", swD: "Unganishwa na madaktari, wauguzi na wataalamu wa afya waliothibitishwa karibu nawe.", enD: "Get matched with verified doctors, nurses and health specialists near you." },
  { icon: "cap", sw: "Walimu", en: "Teachers", swD: "Pata walimu bora wa masomo mbalimbali kwa ajili ya wewe au watoto wako.", enD: "Find experienced teachers for a range of subjects, for yourself or your children." },
  { icon: "swap", sw: "Kutafuta Mwenza", en: "Find a Partner", swD: "Tafuta mtu wa kuishi naye, mwenza wa kazi, au rafiki mpya kwa urahisi na usalama.", enD: "Find someone to live with, a work partner or a new friend — easily and safely." },
  { icon: "msg", sw: "Chat & Simu", en: "Chat & Calls", swD: "Ongea moja kwa moja kupitia chat au simu bila kutoa namba yako ya simu.", enD: "Talk directly through chat or calls without giving out your phone number." },
  { icon: "bell", sw: "Taarifa za Haraka", en: "Instant Notifications", swD: "Pokea arifa muhimu kuhusu maombi, ujumbe, na masasisho muhimu mara moja.", enD: "Get important alerts about requests, messages and updates the moment they happen." },
  { icon: "shieldOk", sw: "Uthibitisho", en: "Verification", swD: "Tunathibitisha watumiaji ili uwe na uhakika unazungumza na mtu halisi na waaminifu.", enD: "We verify users so you can be sure you are talking to a real and trustworthy person." },
];

const HATUA = [
  { sw: "Jisajili", en: "Sign Up", swD: "Fungua akaunti yako kwa dakika chache tu.", enD: "Open your account in just a few minutes." },
  { sw: "Tafuta Mwenza", en: "Find a Partner", swD: "Chagua aina ya mtu unayemtaka na uanze kutafuta.", enD: "Choose the kind of partner you want and start searching." },
  { sw: "Kubaliana", en: "Agree", swD: "Ongea, kubaliana, na endelea na hatua inayofuata kwa usalama.", enD: "Talk, agree, and move on to the next step safely." },
];

const TXT = {
  sw: {
    eyebrow: "Huduma Zetu",
    h1: "Kile Tunachotoa",
    lead:
      "Tunatoa huduma za kuaminika zinazokuunganisha na watu sahihi – iwe ni watumishi wa afya, walimu, au mtu wa kuishi naye. Lengo letu ni kukufanya ujisikie salama, uunganishwe kwa urahisi, na upate msaada unapohitaji.",
    how: "Jinsi Inavyofanya Kazi",
    endTitle: "Uko Tayari Kubadilisha Kituo?",
    endSub: "Anza sasa na upate mtu sahihi kwa urahisi.",
    endBtn: "Jisajili Sasa",
  },
  en: {
    eyebrow: "Our Services",
    h1: "What We Offer",
    lead:
      "We provide reliable services that connect you with the right people — whether that is health workers, teachers or a partner to swap stations with. Our goal is to make you feel safe, get matched easily, and find help when you need it.",
    how: "How It Works",
    endTitle: "Ready to Change Your Station?",
    endSub: "Start now and find the right partner with ease.",
    endBtn: "Sign Up Now",
  },
};

export default function HudumaPage() {
  const { lang } = usePublicLang();
  const t = TXT[lang];

  return (
    <PublicLayout active="/services">
      <section className={s.pageHead}>
        <div className={s.wrap}>
          <span className={s.eyebrow}>{t.eyebrow}</span>
          <h1 className={s.h1}>{t.h1}</h1>
          <p className={s.lead}>{t.lead}</p>
        </div>
      </section>

      <section className={s.sectionTight}>
        <div className={`${s.wrap} ${s.svcGrid}`}>
          {HUDUMA.map((h, i) => (
            <div key={h.icon + i} className={s.svcCard}>
              <div className={s.svcTop}>
                <span className={s.icBox}>
                  <AppIcon name={h.icon} size={20} />
                </span>
                <em>{String(i + 1).padStart(2, "0")}</em>
              </div>
              <b>{lang === "en" ? h.en : h.sw}</b>
              <p>{lang === "en" ? h.enD : h.swD}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <h2 className={s.h2}>{t.how}</h2>
          <div className={s.flow3}>
            {HATUA.map((h, i) => (
              <div key={h.sw} className={s.flowStep}>
                <span className={s.stepNum}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <b>{lang === "en" ? h.en : h.sw}</b>
                  <p>{lang === "en" ? h.enD : h.swD}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={`${s.wrap} ${s.cta}`}>
          <h2 className={s.h2}>{t.endTitle}</h2>
          <p className={s.h2Sub}>{t.endSub}</p>
          <Link href="/register" className={s.btnBig} style={{ display: "inline-flex", marginTop: 20 }}>
            {t.endBtn} <AppIcon name="arrowR" size={16} sw={2} />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
