"use client";

// Ukurasa wa Miradi Yetu (umma)
import AppIcon from "@/components/app/AppIcon";
import PublicLayout from "@/components/public/PublicLayout";
import { usePublicLang } from "@/components/public/PublicLang";
import s from "@/components/public/public.module.css";

// Takwimu za TLM Tanzania
const TAKWIMU = [
  { icon: "book", n: "27", l: "Schemes" },
  { icon: "file", n: "1.8K", l: "Lesson Plans" },
  { icon: "users", n: "737", l: "Teachers" },
  { icon: "clip", n: "12", l: "Logbook Entries" },
  { icon: "notebook", n: "108", l: "Lesson Notes" },
];

const SHUGHULI = {
  sw: [
    "Kushiriki mawazo (share your thoughts)",
    "Kuuliza maswali",
    "Kushirikisha mbinu za ufundishaji na ujifunzaji",
    "Kutoa mapendekezo ya kuboresha elimu na matumizi ya teknolojia",
  ],
  en: [
    "Share your thoughts",
    "Ask questions",
    "Share teaching and learning methods",
    "Give suggestions for improving education and the use of technology",
  ],
};

const TLM_URL = "https://home-haji-downloads-fieldmanagementdockerysy-production.up.railway.app/curriculum/";

const TXT = {
  sw: {
    eyebrow: "Miradi Yetu",
    h1: "Ramani ya Mfumo",
    title: "TLM Tanzania — Jukwaa la Walimu",
    status: "Inaendelea",
    p1:
      "Karibu TLM Tanzania! Ndani ya TLM Tanzania kuna walimu waajiriwa kutoka maeneo mbalimbali ya Tanzania, pamoja na wanafunzi wa vyuo, wahitimu, waombaji wa kazi na wadau wengine wa elimu.",
    p2: "Hii ni nafasi ya kujifunza, kusaidiana na kubadilishana uzoefu. Usisite:",
    p3:
      "TLM Tanzania si chaneli ya mtu mmoja, bali ni jukwaa la wote. Mawazo yako yanaweza kuwasaidia maelfu ya walimu, wanafunzi na wadau wa elimu nchini.",
    p4: "Karibu tushirikiane kujenga jamii yenye maarifa, ubunifu na mshikamano.",
    statsHead: "Takwimu za TLM Tanzania",
    btn: "Ingia TLM Tanzania",
  },
  en: {
    eyebrow: "Our Projects",
    h1: "System Roadmap",
    title: "TLM Tanzania — Teachers' Platform",
    status: "In progress",
    p1:
      "Welcome to TLM Tanzania! TLM Tanzania brings together employed teachers from different parts of Tanzania, along with college students, graduates, job applicants and other education stakeholders.",
    p2: "This is a space to learn, help one another and share experience. Do not hesitate to:",
    p3:
      "TLM Tanzania is not one person's channel — it is a platform for everyone. Your ideas can help thousands of teachers, students and education stakeholders across the country.",
    p4: "Join us in building a community built on knowledge, creativity and solidarity.",
    statsHead: "TLM Tanzania Statistics",
    btn: "Enter TLM Tanzania",
  },
};

export default function MiradiPage() {
  const { lang } = usePublicLang();
  const t = TXT[lang];

  return (
    <PublicLayout active="/projects">
      <section className={s.pageHead}>
        <div className={s.wrap}>
          <span className={s.eyebrow}>{t.eyebrow}</span>
          <h1 className={s.h1}>{t.h1}</h1>
        </div>
      </section>

      <section className={s.sectionTight}>
        <div className={s.wrap}>
          <article className={s.project}>
            <div className={s.projHead}>
              <span className={s.icBox}>
                <AppIcon name="cap" size={22} />
              </span>
              <div>
                <h2 className={s.projTitle}>{t.title}</h2>
                <span className={s.status}>
                  <i /> {t.status}
                </span>
              </div>
            </div>

            <div className={s.projBody}>
              <p>{t.p1}</p>
              <p>{t.p2}</p>

              <ul className={s.bullets}>
                {SHUGHULI[lang].map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>

              <p>{t.p3}</p>
              <p>{t.p4}</p>
            </div>

            <p className={s.statsHead}>{t.statsHead}</p>

            <div className={s.projStats}>
              {TAKWIMU.map((x) => (
                <div key={x.l}>
                  <AppIcon name={x.icon} size={18} />
                  <b>{x.n}</b>
                  <span>{x.l}</span>
                </div>
              ))}
            </div>

            <a href={TLM_URL} target="_blank" rel="noreferrer" className={s.btnBig} style={{ marginTop: 18 }}>
              {t.btn}
              <AppIcon name="arrowR" size={16} sw={2} />
            </a>
          </article>
        </div>
      </section>
    </PublicLayout>
  );
}
