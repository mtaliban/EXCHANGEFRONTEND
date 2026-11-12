// Ukurasa wa Nyumbani (umma)
import Link from "next/link";
import AppIcon from "@/components/app/AppIcon";
import PublicLayout from "@/components/public/PublicLayout";
import s from "@/components/public/public.module.css";

const HATUA_FUPI = ["Jisajili", "Chagua Unakotaka", "Tafuta Mwenza"];
// TODO: takwimu halisi
const TAKWIMU = [
  { n: "26", l: "Mikoa Yote" }, { n: "188", l: "Wilaya" },
  { n: "25,000+", l: "Shule" }, { n: "14,000+", l: "Vituo vya Afya" },
];
const HATUA = [
  { t: "Jisajili", d: "Chagua idara na kada yako, weka kituo cha sasa." },
  { t: "Chagua Unakotaka", d: "Onyesha mikoa/wilaya au vituo unavyotaka kwenda." },
  { t: "Tafuta Mwenza", d: "Orodha inaonesha watumishi wenye kada sawa nawe wanaotaka kuja kwako." },
  { t: "Wasiliana", d: "Tuma ujumbe au piga simu — thibitisha na mmoja." },
];

export default function HomePage() {
  return (
    <PublicLayout active="/">
      {/* Juu (hero) */}
      <section className={s.hero}>
        <div className={s.wrap}>
          <h1 className={s.h1}>Badilisha Kituo Chako cha Kazi <em>kwa Urahisi</em></h1>
          <p className={s.lead}>Jukwaa la kwanza Tanzania kwa watumishi wa Serikali (Afya, Elimu na Nyingine) kutafuta wa kubadilishana naye kituo cha kazi kwa haraka na uwazi.</p>
          <div className={s.pills}>
            {HATUA_FUPI.map((h, i) => <span key={h}><b>{i + 1}</b>{h}</span>)}
          </div>
          <div className={s.heroBtns}>
            <Link href="/register" className={s.btnBig}>Anza Sasa — Jisajili Bure <AppIcon name="arrowR" size={16} sw={2} /></Link>
            <Link href="/services" className={s.btnBigOut}>Angalia Huduma</Link>
          </div>
        </div>
      </section>

      {/* Takwimu */}
      <section className={s.section}>
        <div className={`${s.wrap} ${s.stats}`}>
          {TAKWIMU.map((x) => <div key={x.l}><b>{x.n}</b><span>{x.l}</span></div>)}
        </div>
      </section>

      {/* Jinsi inavyofanya kazi */}
      <section className={s.section}>
        <div className={s.wrap}>
          <h2 className={s.h2}>Jinsi Inavyofanya Kazi</h2>
          <p className={s.h2Sub}>Hatua 4 rahisi kupata mtu wa kubadilishana naye kituo.</p>
          <div className={s.steps}>
            {HATUA.map((h, i) => (
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
          <h2 className={s.h2}>Uko Tayari Kubadilisha Kituo?</h2>
          <p className={s.h2Sub}>Jisajili sasa bure. Tumeshakuwa na watumishi wengi wanaotafuta mwenza wa kubadilishana vituo kila mkoa Tanzania.</p>
          <Link href="/register" className={s.btnBig} style={{ display: "inline-flex", marginTop: 20 }}>Jisajili Sasa <AppIcon name="arrowR" size={16} sw={2} /></Link>
        </div>
      </section>
    </PublicLayout>
  );
}
