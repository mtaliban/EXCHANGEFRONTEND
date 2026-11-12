import { useEffect, useState } from "react";
import Link from "next/link";
import AppIcon from "@/components/app/AppIcon";
import s from "./ChangiaTaarifa.module.css";

/**
 * Notisi inayotokea ndani ya kadi baada ya kubofya Piga / SMS / WhatsApp bila malipo.
 * Inaonekana kwa muda mfupi kisha inasondoka yenyewe.
 */
export default function ChangiaTaarifa({ kiasi = 2500, ms = 2000 }: { kiasi?: number; ms?: number }) {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const a = setTimeout(() => setLeaving(true), ms);
    const b = setTimeout(() => setGone(true), ms + 320);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [ms]);

  if (gone) return null;

  return (
    <div className={leaving ? `${s.note} ${s.noteOut}` : s.note}>
      <span className={s.ic}>
        <AppIcon name="alert" size={18} sw={2} />
      </span>
      <p className={s.text}>
        Changia <b>TZS {kiasi.toLocaleString("en")}</b> upate namba
      </p>
      <Link href="/changia" className={s.btn}>
        Changia
      </Link>
    </div>
  );
}
