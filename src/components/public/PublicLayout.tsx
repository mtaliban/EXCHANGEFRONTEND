"use client";

// Kichwa + menyu + footer ya kurasa za umma (Nyumbani, Kuhusu, Huduma, Miradi, Wasiliana)
import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon from "@/components/app/AppIcon";
import s from "./public.module.css";
import { CONTACT } from "@/lib/contact";
import { usePublicLang, type PubLang } from "./PublicLang";

export const PUBLIC_NAV = [
  { href: "/", icon: "home", sw: "Nyumbani", en: "Home" },
  { href: "/about", icon: "info", sw: "Kuhusu Sisi", en: "About Us" },
  { href: "/services", icon: "steth", sw: "Huduma Zetu", en: "Our Services" },
  { href: "/projects", icon: "folder", sw: "Miradi Yetu", en: "Our Projects" },
  { href: "/contact", icon: "phoneCall", sw: "Wasiliana Nasi", en: "Contact Us" },
];

const T = {
  sw: {
    menu: "Menyu",
    login: "Ingia",
    register: "Jisajili",
    phone: "Simu",
    whatsapp: "WhatsApp",
    email: "Barua Pepe",
    pages: "Kurasa",
    account: "Akaunti",
    rights: "Haki zote zimehifadhiwa.",
  },
  en: {
    menu: "Menu",
    login: "Sign in",
    register: "Sign up",
    phone: "Phone",
    whatsapp: "WhatsApp",
    email: "Email",
    pages: "Pages",
    account: "Account",
    rights: "All rights reserved.",
  },
};

export default function PublicLayout({ active, children }: { active: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { lang, setLang } = usePublicLang();
  const t = T[lang];

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  const label = (n: (typeof PUBLIC_NAV)[number]) => (lang === "en" ? n.en : n.sw);

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <div className={s.headerIn}>
          <span className={s.spacer} />
          <div className={s.lang}>
            {(["SW", "EN"] as const).map((l) => (
              <button
                key={l}
                className={(lang === "sw" ? "SW" : "EN") === l ? s.langOn : ""}
                aria-pressed={(lang === "sw" ? "SW" : "EN") === l}
                onClick={() => setLang(l.toLowerCase() as PubLang)}
              >
                {l}
              </button>
            ))}
          </div>
          <span className={s.spacerR} />
          <button className={`${s.menuBtn} ${open ? s.menuBtnOn : ""}`} aria-label={t.menu} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span className={`${s.burger} ${open ? s.burgerX : ""}`}><i /><i /><i /></span>
          </button>

          {/* Menyu ya ☰ */}
          <nav className={`${s.pop} ${open ? s.popOpen : ""}`} aria-hidden={!open}>
            {PUBLIC_NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}
                className={`${s.popItem} ${active === n.href ? s.popItemOn : ""}`}>
                <span className={s.popIc}><AppIcon name={n.icon} size={18} /></span>{label(n)}
              </Link>
            ))}
            <div className={s.popBtns}>
              <Link href="/login" className={s.btnOut} tabIndex={open ? 0 : -1}>{t.login}</Link>
              <Link href="/register" className={s.btnPrimary} tabIndex={open ? 0 : -1}>{t.register}</Link>
            </div>
          </nav>
        </div>
      </header>
      <div className={`${s.overlay} ${open ? s.overlayOn : ""}`} onClick={() => setOpen(false)} />

      <main>{children}</main>

      <footer className={s.footer}>
        <div className={s.wrap}>
          {/* Mawasiliano */}
          <div className={s.fContact}>
            <a href={`tel:${CONTACT.simu}`}>
              <span className={s.fIc}><AppIcon name="phone" size={17} /></span>
              <div><small>{t.phone}</small><b>{CONTACT.simuLabel}</b></div>
              <AppIcon name="chevR" size={15} sw={2} />
            </a>
            <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noreferrer">
              <span className={s.fIc}><AppIcon name="msg" size={17} /></span>
              <div><small>{t.whatsapp}</small><b>{CONTACT.whatsappLabel}</b></div>
              <AppIcon name="chevR" size={15} sw={2} />
            </a>
            <a href={`mailto:${CONTACT.email}`}>
              <span className={s.fIc}><AppIcon name="mail" size={17} /></span>
              <div><small>{t.email}</small><b>{CONTACT.email}</b></div>
              <AppIcon name="chevR" size={15} sw={2} />
            </a>
          </div>
          <div className={s.fCols}>
            <div>
              <p className={s.fHead}>{t.pages}</p>
              {PUBLIC_NAV.map((n) => <Link key={n.href} href={n.href}><AppIcon name={n.icon} size={16} /> {label(n)}</Link>)}
            </div>
            <div>
              <p className={s.fHead}>{t.account}</p>
              <Link href="/register"><AppIcon name="userPlus" size={16} /> {t.register}</Link>
              <Link href="/login"><AppIcon name="login" size={16} /> {t.login}</Link>
            </div>
          </div>
          <p className={s.copy}>© {new Date().getFullYear()} Kubadilishana Portal. {t.rights}</p>
        </div>
      </footer>
    </div>
  );
}
