import Link from "next/link";
import AppIcon from "@/components/app/AppIcon";
import s from "./ChangiaTaarifa.module.css";

/** Notisi inayotokea ndani ya kadi baada ya kubofya Piga / SMS / WhatsApp bila malipo. */
export default function ChangiaTaarifa({ kiasi = 2500 }: { kiasi?: number }) {
  return (
    <div className={s.note}>
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
