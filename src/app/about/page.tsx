import type { Metadata } from 'next';
import AppIcon from "@/components/app/AppIcon";
import PublicLayout from "@/components/public/PublicLayout";
import s from "@/components/public/public.module.css";

export const metadata: Metadata = {
  title: 'Kuhusu Sisi — Kubadilishana Portal',
  description: 'Dhamira, tatizo tunalotatua na timu ya Kubadilishana Portal — jukwaa la watumishi wa Serikali Tanzania kubadilishana vituo vya kazi.',
};

const WALENGWA = [
  { icon: "cap", t: "Walimu", d: "Walimu wa elimu ya msingi na sekondari — lugha, hisabati, sayansi, na masomo mengine." },
  { icon: "steth", t: "Watumishi wa Afya", d: "Madaktari, wauguzi, wataalamu wa maabara, na watoa huduma za dawa." },
  { icon: "building", t: "Watumishi wa Umma", d: "Maafisa na watumishi wa serikali — uhasibu, TEHAMA, utawala." },
  { icon: "wheat", t: "Wafanyakazi wa Kilimo", d: "Maafisa kilimo, wakulima wa kitaalamu, na wataalamu wa mifugo." },
];

const MATATIZO = [
  "Posts za WhatsApp ni ngumu kutafuta — unascroll mamia ya posts.",
  "Hakuna uthibitisho — wasakinishi wanajifanya kuwa halali.",
  "Format tofauti tofauti — matching ni ngumu.",
  "Post ikishaposti, huwezi kubadilisha unakotaka kuhamia.",
];

// TODO: thibitisha taarifa za timu
const TIMU = [
  {
    ini: "HH",
    jina: "Hajj Hussein Hamisi",
    cheo: "Mwanzilishi",
    d: "Anasimamia maono ya awali ya mfumo wa Kubadilishana Portal na kuongoza mwelekeo wa muda mrefu wa bidhaa.",
    simu: "0625607088",
    simuLabel: "+255 625 607 088",
    piga: "Hajj"
  },
  {
    ini: "HS",
    jina: "Hamisi Selemani Hamisi",
    cheo: "Afisa Mtendaji Mkuu",
    d: "Anaongoza utekelezaji, uratibu na mwelekeo wa kila siku wa jukwaa la Kubadilishana.",
    simu: "0763795801",
    simuLabel: "+255 763 795 801",
    piga: "Hamisi"
  },
];

export default function KuhusuPage() {
  return (
    <PublicLayout active="/about">
      <section className={s.pageHead}>
        <div className={s.wrap}>
          <span className={s.eyebrow}>Kuhusu Sisi</span>
          <h1 className={s.h1}>Dhamira Yetu na Hadithi Yetu</h1>
        </div>
      </section>

      {/* Tunaowahudumia */}
      <section className={s.sectionTight}>
        <div className={`${s.wrap} ${s.grid2}`}>
          {WALENGWA.map((w) => (
            <div key={w.t} className={s.rowCard}>
              <span className={s.icBox}>
                <AppIcon name={w.icon} size={20} />
              </span>
              <div>
                <b>{w.t}</b>
                <p>{w.d}</p>
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
              <h3>Nia Yetu</h3>
            </div>
            <p>
              Kuwasaidia watumishi wa Serikali (Idara ya Afya na Elimu)
              kubadilishana vituo vya kazi kwa uwazi, haraka, na bila kupitia
              matapeli. Tunatatua tatizo la posts za WhatsApp zisizo na
              muundo, ambazo hazitoi majibu ya haraka.
            </p>
          </div>

          <div className={s.textCard}>
            <div className={s.tcHead}>
              <span className={s.icBox}>
                <AppIcon name="warn" size={20} />
              </span>
              <h3>Tatizo Tunalotatua</h3>
            </div>
            <ul className={s.bullets}>
              {MATATIZO.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>

          <div className={s.textCard}>
            <div className={s.tcHead}>
              <span className={s.icBox}>
                <AppIcon name="bulb" size={20} />
              </span>
              <h3>Suluhisho Letu</h3>
            </div>
            <p>
              Jukwaa la kidijitali linalotafuta mwenza kiotomatiki — unaingia
              data zako mara moja, mfumo unakuletea watumishi wanaotaka kuja
              kwako na wenye kada sawa nawe. Hakuna kuscroll, hakuna wasakinishi.
            </p>
          </div>
        </div>
      </section>

      {/* Timu */}
      <section className={s.section}>
        <div className={s.wrap}>
          <h2 className={s.h2}>Timu Yetu</h2>
          <p className={s.h2Sub}>
            Viongozi wa Kubadilishana Portal — wahitimu wa Chuo Kikuu cha Dodoma.
          </p>

          <div className={`${s.grid2} ${s.mt22}`}>
            {TIMU.map((m) => (
              <div key={m.jina} className={s.teamCard}>
                <div className={s.teamTop}>
                  <span className={s.teamAv}>{m.ini}</span>
                  <div>
                    <b>{m.jina}</b>
                    <span className={s.role}>{m.cheo}</span>
                  </div>
                </div>

                <p className={s.teamText}>{m.d}</p>

                <div className={s.facts}>
                  <div>
                    <AppIcon name="cap" size={16} />
                    <span>
                      <b>Chuo Kikuu cha Dodoma</b> · Shahada ya Kwanza ya
                      Sayansi ya Uhandisi wa Programu
                    </span>
                  </div>
                  <div>
                    <AppIcon name="award" size={16} />
                    <span>Mhitimu 2026</span>
                  </div>
                  <div>
                    <AppIcon name="pin" size={16} />
                    <span>Dodoma, Tanzania</span>
                  </div>
                </div>

                <a href={`tel:${m.simu}`} className={s.btnPhone}>
                  <AppIcon name="phone" size={15} />
                  Piga {m.piga}
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
