"use client";

// Ukurasa wa Nyumbani (umma)
import Link from "next/link";
import AppIcon from "@/components/app/AppIcon";
import PublicLayout from "@/components/public/PublicLayout";
import { usePublicLang } from "@/components/public/PublicLang";
import s from "@/components/public/public.module.css";

// TODO: takwimu halisi
const TAKWIMU = [
  { n: "26", sw: "Mikoa Yote", en: "All Regions" },
  { n: "188", sw: "Wilaya", en: "Districts" },
  { n: "25,000+", sw: "Shule", en: "Schools" },
  { n: "14,000+", sw: "Vituo vya Afya", en: "Health Facilities" },
];

const TXT = {
  sw: {
    h1: "Badilisha Kituo Chako cha Kazi",
    em: "kwa Urahisi",
    lead:
      "Jukwaa la kwanza Tanzania kwa watumishi wa Serikali (Afya, Elimu na Nyingine) kutafuta wa kubadilishana naye kituo cha kazi kwa haraka na uwazi.",
    pills: ["Jisajili", "Chagua Unakotaka", "Tafuta Mwenza"],
    cta1: "Anza Sasa — Jisajili Bure",
    cta2: "Angalia Huduma",
    howTitle: "Jinsi Inavyofanya Kazi",
    howSub: "Hatua 4 rahisi kupata mtu wa kubadilishana naye kituo.",
    steps: [
      { t: "Jisajili", d: "Chagua idara na kada yako, weka kituo cha sasa." },
      { t: "Chagua Unakotaka", d: "Onyesha mikoa/wilaya au vituo unavyotaka kwenda." },
      { t: "Tafuta Mwenza", d: "Orodha inaonesha watumishi wenye kada sawa nawe wanaotaka kuja kwako." },
      { t: "Wasiliana", d: "Tuma ujumbe au piga simu — thibitisha na mmoja." },
    ],
    endTitle: "Uko Tayari Kubadilisha Kituo?",
    endSub:
      "Jisajili sasa bure. Tumeshakuwa na watumishi wengi wanaotafuta mwenza wa kubadilishana vituo kila mkoa Tanzania.",
    endBtn: "Jisajili Sasa",
  },
  en: {
    h1: "Change Your Work Station",
    em: "with Ease",
    lead:
      "Tanzania's first platform for government employees (Health, Education and others) to find someone to swap work stations with — fast and transparent.",
    pills: ["Sign Up", "Choose Your Destination", "Find a Partner"],
    cta1: "Start Now — Sign Up Free",
    cta2: "View Services",
    howTitle: "How It Works",
    howSub: "Four simple steps to find someone to swap your station with.",
    steps: [
      { t: "Sign Up", d: "Choose your department and cadre, and add your current station." },
      { t: "Choose Your Destination", d: "Show the regions/districts or stations you want to move to." },
      { t: "Find a Partner", d: "The list shows employees in the same cadre as you who want to come to your area." },
      { t: "Get in Touch", d: "Send a message or make a call — confirm with one person." },
    ],
    endTitle: "Ready to Change Your Station?",
    endSub:
      "Sign up free today. Many employees across every region of Tanzania are already looking for a swap partner.",
    endBtn: "Sign Up Now",
  },
};

export default function HomePage() {
  const { lang } = usePublicLang();
  const t = TXT[lang];

  return (
    <PublicLayout active="/">
      {/* Juu (hero) */}
      <section className={s.hero}>
        <div className={s.wrap}>
          <h1 className={s.h1}>{t.h1} <em>{t.em}</em></h1>
          <p className={s.lead}>{t.lead}</p>
          <div className={s.pills}>
            {t.pills.map((h, i) => <span key={h}><b>{i + 1}</b>{h}</span>)}
          </div>
          <div className={s.heroBtns}>
            <Link href="/register" className={s.btnBig}>{t.cta1} <AppIcon name="arrowR" size={16} sw={2} /></Link>
            <Link href="/services" className={s.btnBigOut}>{t.cta2}</Link>
          </div>
        </div>
      </section>

      {/* Takwimu */}
      <section className={s.section}>
        <div className={`${s.wrap} ${s.stats}`}>
          {TAKWIMU.map((x) => <div key={x.n}><b>{x.n}</b><span>{lang === "en" ? x.en : x.sw}</span></div>)}
        </div>
      </section>

      {/* Jinsi inavyofanya kazi */}
      <section className={s.section}>
        <div className={s.wrap}>
          <h2 className={s.h2}>{t.howTitle}</h2>
          <p className={s.h2Sub}>{t.howSub}</p>
          <div className={s.steps}>
            {t.steps.map((h, i) => (
              <div key={h.t} className={s.stepCard}>
                <span className={s.stepNum}>{i + 1}</span>
                <div><b>{h.t}</b><p>{h.d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mwito wa mwisho */}
      <section className={s.section}>
        <div className={`${s.wrap} ${s.cta}`}>
          <h2 className={s.h2}>{t.endTitle}</h2>
          <p className={s.h2Sub}>{t.endSub}</p>
          <Link href="/register" className={s.btnBig} style={{ display: "inline-flex", marginTop: 20 }}>{t.endBtn} <AppIcon name="arrowR" size={16} sw={2} /></Link>
        </div>
      </section>
    </PublicLayout>
  );
}
