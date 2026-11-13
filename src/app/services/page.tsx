// Ukurasa wa Huduma Zetu (umma)
import Link from "next/link";
import AppIcon from "@/components/app/AppIcon";
import PublicLayout from "@/components/public/PublicLayout";
import s from "@/components/public/public.module.css";

const HUDUMA = [
  { icon: "steth", t: "Watumishi wa Afya", d: "Unganishwa na madaktari, wauguzi na wataalamu wa afya waliothibitishwa karibu nawe." },
  { icon: "cap", t: "Walimu", d: "Pata walimu bora wa masomo mbalimbali kwa ajili ya wewe au watoto wako." },
  { icon: "swap", t: "Kutafuta Mwenza", d: "Tafuta mtu wa kuishi naye, mwenza wa kazi, au rafiki mpya kwa urahisi na usalama." },
  { icon: "msg", t: "Chat & Simu", d: "Ongea moja kwa moja kupitia chat au simu bila kutoa namba yako ya simu." },
  { icon: "bell", t: "Taarifa za Haraka", d: "Pokea arifa muhimu kuhusu maombi, ujumbe, na masasisho muhimu mara moja." },
  { icon: "shieldOk", t: "Uthibitisho", d: "Tunathibitisha watumiaji ili uwe na uhakika unazungumza na mtu halisi na waaminifu." },
];

const HATUA = [
  { t: "Jisajili", d: "Fungua akaunti yako kwa dakika chache tu." },
  { t: "Tafuta Mwenza", d: "Chagua aina ya mtu unayemtaka na uanze kutafuta." },
  { t: "Kubaliana", d: "Ongea, kubaliana, na endelea na hatua inayofuata kwa usalama." },
];

export default function HudumaPage() {
  return (
    <PublicLayout active="/services">
      <section className={s.pageHead}>
        <div className={s.wrap}>
          <span className={s.eyebrow}>Huduma Zetu</span>
          <h1 className={s.h1}>Kile Tunachotoa</h1>
          <p className={s.lead}>
            Tunatoa huduma za kuaminika zinazokuunganisha na watu sahihi – iwe ni
            watumishi wa afya, walimu, au mtu wa kuishi naye. Lengo letu ni kukufanya
            ujisikie salama, uunganishwe kwa urahisi, na upate msaada unapohitaji.
          </p>
        </div>
      </section>

      <section className={s.sectionTight}>
        <div className={`${s.wrap} ${s.svcGrid}`}>
          {HUDUMA.map((h, i) => (
            <div key={h.t} className={s.svcCard}>
              <div className={s.svcTop}>
                <span className={s.icBox}>
                  <AppIcon name={h.icon} size={20} />
                </span>
                <em>{String(i + 1).padStart(2, "0")}</em>
              </div>
              <b>{h.t}</b>
              <p>{h.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <h2 className={s.h2}>Jinsi Inavyofanya Kazi</h2>
          <div className={s.flow3}>
            {HATUA.map((h, i) => (
              <div key={h.t} className={s.flowStep}>
                <span className={s.stepNum}>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <b>{h.t}</b>
                  <p>{h.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={`${s.wrap} ${s.cta}`}>
          <h2 className={s.h2}>Uko Tayari Kubadilisha Kituo?</h2>
          <p className={s.h2Sub}>Anza sasa na upate mtu sahihi kwa urahisi.</p>
          <Link href="/register" className={s.btnBig} style={{ display: "inline-flex", marginTop: 20 }}>
            Jisajili Sasa <AppIcon name="arrowR" size={16} sw={2} />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
