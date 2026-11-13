// Ukurasa wa Miradi Yetu (umma)
import AppIcon from "@/components/app/AppIcon";
import PublicLayout from "@/components/public/PublicLayout";
import s from "@/components/public/public.module.css";

// Takwimu za TLM Tanzania
const TAKWIMU = [
  { icon: "book", n: "27", l: "Schemes" },
  { icon: "file", n: "1.8K", l: "Lesson Plans" },
  { icon: "users", n: "737", l: "Teachers" },
  { icon: "clip", n: "12", l: "Logbook Entries" },
  { icon: "notebook", n: "108", l: "Lesson Notes" },
];

const SHUGHULI = [
  "Kushiriki mawazo (share your thoughts)",
  "Kuuliza maswali",
  "Kushirikisha mbinu za ufundishaji na ujifunzaji",
  "Kutoa mapendekezo ya kuboresha elimu na matumizi ya teknolojia",
];

const TLM_URL = "https://tlmtanzania.com";

export default function MiradiPage() {
  return (
    <PublicLayout active="/projects">
      <section className={s.pageHead}>
        <div className={s.wrap}>
          <span className={s.eyebrow}>Miradi Yetu</span>
          <h1 className={s.h1}>Ramani ya Mfumo</h1>
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
                <h2 className={s.projTitle}>
                  TLM Tanzania — Jukwaa la Walimu
                </h2>
                <span className={s.status}>
                  <i /> Inaendelea
                </span>
              </div>
            </div>

            <div className={s.projBody}>
              <p>
                Karibu TLM Tanzania! Ndani ya TLM Tanzania kuna walimu
                waajiriwa kutoka maeneo mbalimbali ya Tanzania, pamoja na
                wanafunzi wa vyuo, wahitimu, waombaji wa kazi na wadau
                wengine wa elimu.
              </p>

              <p>
                Hii ni nafasi ya kujifunza, kusaidiana na kubadilishana
                uzoefu. Usisite:
              </p>

              <ul className={s.bullets}>
                {SHUGHULI.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>

              <p>
                TLM Tanzania si chaneli ya mtu mmoja, bali ni jukwaa la
                wote. Mawazo yako yanaweza kuwasaidia maelfu ya walimu,
                wanafunzi na wadau wa elimu nchini.
              </p>

              <p>
                Karibu tushirikiane kujenga jamii yenye maarifa,
                ubunifu na mshikamano.
              </p>
            </div>

            <p className={s.statsHead}>
              Takwimu za TLM Tanzania
            </p>

            <div className={s.projStats}>
              {TAKWIMU.map((x) => (
                <div key={x.l}>
                  <AppIcon name={x.icon} size={18} />
                  <b>{x.n}</b>
                  <span>{x.l}</span>
                </div>
              ))}
            </div>

            <a
              href={TLM_URL}
              target="_blank"
              rel="noreferrer"
              className={s.btnBig}
              style={{ marginTop: 18 }}
            >
              Ingia TLM Tanzania
              <AppIcon name="arrowR" size={16} sw={2} />
            </a>
          </article>
        </div>
      </section>
    </PublicLayout>
  );
}
