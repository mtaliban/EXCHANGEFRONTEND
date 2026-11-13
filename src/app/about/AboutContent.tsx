"use client";

import AppIcon from "@/components/app/AppIcon";
import PublicLayout from "@/components/public/PublicLayout";
import { usePublicLang } from "@/components/public/PublicLang";
import s from "@/components/public/public.module.css";

const WALENGWA = [
  { icon: "cap", sw: "Walimu", en: "Teachers", swD: "Walimu wa elimu ya msingi na sekondari — lugha, hisabati, sayansi, na masomo mengine.", enD: "Primary and secondary school teachers — languages, mathematics, science and other subjects." },
  { icon: "steth", sw: "Watumishi wa Afya", en: "Health Workers", swD: "Madaktari, wauguzi, wataalamu wa maabara, na watoa huduma za dawa.", enD: "Doctors, nurses, laboratory specialists and pharmaceutical service providers." },
  { icon: "building", sw: "Watumishi wa Umma", en: "Public Servants", swD: "Maafisa na watumishi wa serikali — uhasibu, TEHAMA, utawala.", enD: "Government officers and employees — accounting, ICT and administration." },
  { icon: "wheat", sw: "Wafanyakazi wa Kilimo", en: "Agriculture Workers", swD: "Maafisa kilimo, wakulima wa kitaalamu, na wataalamu wa mifugo.", enD: "Agriculture officers, professional farmers and livestock specialists." },
];

const MATATIZO = {
  sw: [
    "Posts za WhatsApp ni ngumu kutafuta — unascroll mamia ya posts.",
    "Hakuna uthibitisho — wasakinishi wanajifanya kuwa halali.",
    "Format tofauti tofauti — matching ni ngumu.",
    "Post ikishaposti, huwezi kubadilisha unakotaka kuhamia.",
  ],
  en: [
    "WhatsApp posts are hard to search — you scroll through hundreds of them.",
    "No verification — scammers pose as legitimate employees.",
    "Different formats — matching is difficult.",
    "Once posted, you cannot change where you want to move to.",
  ],
};

// TODO: thibitisha taarifa za timu
const TIMU = [
  {
    ini: "HH",
    jina: "Hajj Hussein Hamisi",
    swCheo: "Mwanzilishi",
    enCheo: "Founder",
    swD: "Anasimamia maono ya awali ya mfumo wa Kubadilishana Portal na kuongoza mwelekeo wa muda mrefu wa bidhaa.",
    enD: "Owns the original vision of the Kubadilishana Portal system and leads the product's long-term direction.",
    simu: "0625607088",
    simuLabel: "+255 625 607 088",
    swPiga: "Piga Hajj",
    enPiga: "Call Hajj",
  },
  {
    ini: "HS",
    jina: "Hamisi Selemani Hamisi",
    swCheo: "Afisa Mtendaji Mkuu",
    enCheo: "Chief Executive Officer",
    swD: "Anaongoza utekelezaji, uratibu na mwelekeo wa kila siku wa jukwaa la Kubadilishana.",
    enD: "Leads execution, coordination and the day-to-day direction of the Kubadilishana platform.",
    simu: "0763795801",
    simuLabel: "+255 763 795 801",
    swPiga: "Piga Hamisi",
    enPiga: "Call Hamisi",
  },
];

const TXT = {
  sw: {
    eyebrow: "Kuhusu Sisi",
    h1: "Dhamira Yetu na Hadithi Yetu",
    aimTitle: "Nia Yetu",
    aim:
      "Kuwasaidia watumishi wa Serikali (Idara ya Afya na Elimu) kubadilishana vituo vya kazi kwa uwazi, haraka, na bila kupitia matapeli. Tunatatua tatizo la posts za WhatsApp zisizo na muundo, ambazo hazitoi majibu ya haraka.",
    probTitle: "Tatizo Tunalotatua",
    solTitle: "Suluhisho Letu",
    sol:
      "Jukwaa la kidijitali linalotafuta mwenza kiotomatiki — unaingia data zako mara moja, mfumo unakuletea watumishi wanaotaka kuja kwako na wenye kada sawa nawe. Hakuna kuscroll, hakuna wasakinishi.",
    teamTitle: "Timu Yetu",
    teamSub: "Viongozi wa Kubadilishana Portal — wahitimu wa Chuo Kikuu cha Dodoma.",
    uni: "Chuo Kikuu cha Dodoma",
    degree: "Shahada ya Kwanza ya Sayansi ya Uhandisi wa Programu",
    grad: "Mhitimu 2026",
    place: "Dodoma, Tanzania",
  },
  en: {
    eyebrow: "About Us",
    h1: "Our Mission and Our Story",
    aimTitle: "Our Mission",
    aim:
      "To help government employees (Health and Education departments) swap work stations transparently, quickly and without falling for scammers. We are solving the problem of unstructured WhatsApp posts that give no quick answers.",
    probTitle: "The Problem We Solve",
    solTitle: "Our Solution",
    sol:
      "A digital platform that matches partners automatically — you enter your details once and the system brings you employees who want to move to your area and work in the same cadre as you. No scrolling, no scammers.",
    teamTitle: "Our Team",
    teamSub: "The leaders of Kubadilishana Portal — graduates of the University of Dodoma.",
    uni: "University of Dodoma",
    degree: "Bachelor of Science in Software Engineering",
    grad: "Class of 2026",
    place: "Dodoma, Tanzania",
  },
};

export default function AboutContent() {
  const { lang } = usePublicLang();
  const t = TXT[lang];

  return (
    <PublicLayout active="/about">
      <section className={s.pageHead}>
        <div className={s.wrap}>
          <span className={s.eyebrow}>{t.eyebrow}</span>
          <h1 className={s.h1}>{t.h1}</h1>
        </div>
      </section>

      {/* Tunaowahudumia */}
      <section className={s.sectionTight}>
        <div className={`${s.wrap} ${s.grid2}`}>
          {WALENGWA.map((w) => (
            <div key={w.icon} className={s.rowCard}>
              <span className={s.icBox}>
                <AppIcon name={w.icon} size={20} />
              </span>
              <div>
                <b>{lang === "en" ? w.en : w.sw}</b>
                <p>{lang === "en" ? w.enD : w.swD}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Nia, Tatizo, Suluhisho */}
      <section className={s.section}>
        <div className={`${s.wrap} ${s.stack}`}>
          <div className={s.textCard}>
            <div className={s.tcHead}>
              <span className={s.icBox}>
                <AppIcon name="target" size={20} />
              </span>
              <h3>{t.aimTitle}</h3>
            </div>
            <p>{t.aim}</p>
          </div>

          <div className={s.textCard}>
            <div className={s.tcHead}>
              <span className={s.icBox}>
                <AppIcon name="warn" size={20} />
              </span>
              <h3>{t.probTitle}</h3>
            </div>
            <ul className={s.bullets}>
              {MATATIZO[lang].map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>

          <div className={s.textCard}>
            <div className={s.tcHead}>
              <span className={s.icBox}>
                <AppIcon name="bulb" size={20} />
              </span>
              <h3>{t.solTitle}</h3>
            </div>
            <p>{t.sol}</p>
          </div>
        </div>
      </section>

      {/* Timu */}
      <section className={s.section}>
        <div className={s.wrap}>
          <h2 className={s.h2}>{t.teamTitle}</h2>
          <p className={s.h2Sub}>{t.teamSub}</p>

          <div className={`${s.grid2} ${s.mt22}`}>
            {TIMU.map((m) => (
              <div key={m.jina} className={s.teamCard}>
                <div className={s.teamTop}>
                  <span className={s.teamAv}>{m.ini}</span>
                  <div>
                    <b>{m.jina}</b>
                    <span className={s.role}>{lang === "en" ? m.enCheo : m.swCheo}</span>
                  </div>
                </div>

                <p className={s.teamText}>{lang === "en" ? m.enD : m.swD}</p>

                <div className={s.facts}>
                  <div>
                    <AppIcon name="cap" size={16} />
                    <span>
                      <b>{t.uni}</b> · {t.degree}
                    </span>
                  </div>
                  <div>
                    <AppIcon name="award" size={16} />
                    <span>{t.grad}</span>
                  </div>
                  <div>
                    <AppIcon name="pin" size={16} />
                    <span>{lang === "en" ? t.place : "Dodoma, Tanzania"}</span>
                  </div>
                </div>

                <a href={`tel:${m.simu}`} className={s.btnPhone}>
                  <AppIcon name="phone" size={15} />
                  {lang === "en" ? m.enPiga : m.swPiga}
                  <em>{m.simuLabel}</em>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
