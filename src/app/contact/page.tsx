// Ukurasa wa Wasiliana Nasi (umma)
import AppIcon from "@/components/app/AppIcon";
import PublicLayout from "@/components/public/PublicLayout";
import { CONTACT } from "@/lib/contact";
import s from "@/components/public/public.module.css";

const NJIA = [
  { icon: "phone", t: "Simu", v: CONTACT.simuLabel, href: `tel:${CONTACT.simu}`, btn: "Piga simu" },
  { icon: "msg", t: "WhatsApp", v: CONTACT.whatsappLabel, href: `https://wa.me/${CONTACT.whatsapp}`, btn: "Tuma ujumbe", ext: true },
  { icon: "mail", t: "Barua Pepe", v: CONTACT.email, href: `mailto:${CONTACT.email}`, btn: "Tuma barua pepe" },
  { icon: "pin", t: "Ofisi", v: CONTACT.ofisi },
];

export default function WasilianaPage() {
  return (
    <PublicLayout active="/contact">
      <section className={s.pageHead}>
        <div className={s.wrap}>
          <span className={s.eyebrow}>Wasiliana Nasi</span>
          <h1 className={s.h1}>Tuko Karibu Nawe</h1>
        </div>
      </section>

      <section className={s.sectionTight}>
        <div className={`${s.wrap} ${s.contactGrid}`}>
          {NJIA.map((n) => (
            <div key={n.t} className={s.contactCard}>
              <span className={s.icBoxLg}>
                <AppIcon name={n.icon} size={24} />
              </span>
              <b>{n.t}</b>
              <span className={`${s.contactVal} ${n.href ? "" : s.contactPlain}`}>
                {n.v}
              </span>
              {n.href && (
                <a
                  href={n.href}
                  className={s.btnOut}
                  {...(n.ext ? { target: "_blank", rel: "noreferrer" } : {})}
                >
                  {n.btn}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
