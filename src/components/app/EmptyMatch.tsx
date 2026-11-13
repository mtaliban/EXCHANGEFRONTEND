"use client";
/* =========================================================
   HAKUNA MATOKEO (baada ya kuchuja) – idara zote 4
   Njia:  [NANI · mkoa · wilaya · kada]  —( 0 Hakuna )—  [KUJA KWAKO · mkoa wako]
   ========================================================= */
import AppIcon from "@/components/app/AppIcon";
import s from "@/components/app/app.module.css";
import { cx } from "@/components/app/dashboard";

export function EmptyMatch({ nani, kada, mkoa, chini, to }: {
  /** "Walimu wa sekondari" | "Walimu wa msingi" | "Watu wa Afya" | "Watu wa Kilimo" | "Watu wa Umma" */
  nani: string;
  /** kifupi cha kada alichochuja (mf. "ANO", "VEO") – null kama hakuchuja kada */
  kada?: string | null;
  /** mkoa aliochuja – null kama hakuchuja (inaonyesha "Mikoa yote") */
  mkoa: string | null;
  /** wilaya (au "Kituo, Wilaya") aliochujia – hiari */
  chini?: string | null;
  /** mkoa wa mtumiaji aliyeingia (mf. "Mara") */
  to: string;
}) {
  return (
    <div className={cx(s.card, s.emB)}>
      <div className={s.emRoute}>
        {/* Kushoto: wanaotoka */}
        <div className={s.emEnd}>
          <em>{nani}</em>
          <span className={s.emDot}><AppIcon name="swap" size={14} sw={2.2} /></span>
          <b>{mkoa ?? "Mikoa yote"}</b>
          {chini && <small>{chini}</small>}
          {kada && <span className={s.kCode}>{kada}</span>}
        </div>
        {/* Katikati: 0 Hakuna */}
        <div className={s.emMid}>
          <span className={s.emLine}><i /><b className={s.emZero}>0</b><i /></span>
          <small>Hakuna</small>
        </div>
        {/* Kulia: kuja kwako */}
        <div className={s.emEnd}>
          <em>Kuja kwako</em>
          <span className={s.emDot}><AppIcon name="home" size={14} sw={2.2} /></span>
          <b>{to}</b>
        </div>
      </div>
    </div>
  );
}
