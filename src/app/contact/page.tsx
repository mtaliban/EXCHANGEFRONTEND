"use client";

// Ukurasa wa Wasiliana Nasi (umma)
import AppIcon from "@/components/app/AppIcon";
import PublicLayout from "@/components/public/PublicLayout";
import { usePublicLang } from "@/components/public/PublicLang";
import { CONTACT } from "@/lib/contact";
import s from "@/components/public/public.module.css";

const TXT = {
  sw: {
    eyebrow: "Wasiliana Nasi",
    h1: "Tuko Karibu Nawe",
    phone: "Simu",
    call: "Piga simu",
    whatsapp: "WhatsApp",
    msg: "Tuma ujumbe",
    email: "Barua Pepe",
    mail: "Tuma barua pepe",
    office: "Ofisi",
  },
  en: {
    eyebrow: "Contact Us",
    h1: "We Are Close to You",
    phone: "Phone",
    call: "Call now",
    whatsapp: "WhatsApp",
    msg: "Send a message",
    email: "Email",
    mail: "Send an email",
    office: "Office",
  },
};

export default function WasilianaPage() {
  const { lang } = usePublicLang();
  const t = TXT[lang];

  const NJIA = [
    { icon: "phone", t: t.phone, v: CONTACT.simuLabel, href: `tel:${CONTACT.simu}`, btn: t.call },
    { icon: "msg", t: t.whatsapp, v: CONTACT.whatsappLabel, href: `https://wa.me/${CONTACT.whatsapp}`, btn: t.msg, ext: true },
    { icon: "mail", t: t.email, v: CONTACT.email, href: `mailto:${CONTACT.email}`, btn: t.mail },
    { icon: "pin", t: t.office, v: CONTACT.ofisi },
  ];

  return (
    <PublicLayout active="/contact">
      <section className={s.pageHead}>
        <div className={s.wrap}>
          <span className={s.eyebrow}>{t.eyebrow}</span>
          <h1 className={s.h1}>{t.h1}</h1>
        </div>
      </section>

      <section className={s.sectionTight}>
        <div className={`${s.wrap} ${s.contactGrid}`}>
          {NJIA.map((n) => (
            <div key={n.icon} className={s.contactCard}>
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
