"use client";

// Kichwa + menyu + footer ya kurasa za umma (Nyumbani, Kuhusu, Huduma, Miradi, Wasiliana)
import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon from "@/components/app/AppIcon";
import s from "./public.module.css";
import { CONTACT } from "@/lib/contact";

export const PUBLIC_NAV = [
  { href: "/", label: "Nyumbani", icon: "home" },
  { href: "/about", label: "Kuhusu Sisi", icon: "info" },
  { href: "/services", label: "Huduma Zetu", icon: "steth" },
  { href: "/projects", label: "Miradi Yetu", icon: "folder" },
  { href: "/contact", label: "Wasiliana Nasi", icon: "phoneCall" },
];


export default function PublicLayout({ active, children }: { active: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"SW" | "EN">("SW");

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <div className={s.headerIn}>
          <span className={s.spacer} />
          <div className={s.lang}>
            {(["SW", "EN"] as const).map((l) => (
              <button key={l} className={lang === l ? s.langOn : ""} onClick={() => setLang(l)}>{l}</button>
            ))}
          </div>
          <span className={s.spacerR} />
          <button className={`${s.menuBtn} ${open ? s.menuBtnOn : ""}`} aria-label="Menyu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span className={`${s.burger} ${open ? s.burgerX : ""}`}><i /><i /><i /></span>
          </button>

          {/* Menyu ya ☰ */}
          <nav className={`${s.pop} ${open ? s.popOpen : ""}`} aria-hidden={!open}>
            {PUBLIC_NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}
                className={`${s.popItem} ${active === n.href ? s.popItemOn : ""}`}>
                <span className={s.popIc}><AppIcon name={n.icon} size={18} /></span>{n.label}
              </Link>
            ))}
            <div className={s.popBtns}>
              <Link href="/login" className={s.btnOut} tabIndex={open ? 0 : -1}>Ingia</Link>
              <Link href="/register" className={s.btnPrimary} tabIndex={open ? 0 : -1}>Jisajili</Link>
            </div>
          </nav>
        </div>
      </header>
      <div className={`${s.overlay} ${open ? s.overlayOn : ""}`} onClick={() => setOpen(false)} />

      <main>{children}</main>

      <footer className={s.footer}>
        <div className={s.wrap}>
          {/* Mawasiliano (chaguo 4) */}
          <div className={s.fContact}>
            <a href={`tel:${CONTACT.simu}`}>
              <span className={s.fIc}><AppIcon name="phone" size={17} /></span>
              <div><small>Simu</small><b>{CONTACT.simuLabel}</b></div>
              <AppIcon name="chevR" size={15} sw={2} />
            </a>
            <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noreferrer">
              <span className={s.fIc}><AppIcon name="msg" size={17} /></span>
              <div><small>WhatsApp</small><b>{CONTACT.whatsappLabel}</b></div>
              <AppIcon name="chevR" size={15} sw={2} />
            </a>
            <a href={`mailto:${CONTACT.email}`}>
              <span className={s.fIc}><AppIcon name="mail" size={17} /></span>
              <div><small>Barua Pepe</small><b>{CONTACT.email}</b></div>
              <AppIcon name="chevR" size={15} sw={2} />
            </a>
          </div>
          <div className={s.fCols}>
            <div>
              <p className={s.fHead}>Kurasa</p>
              {PUBLIC_NAV.map((n) => <Link key={n.href} href={n.href}><AppIcon name={n.icon} size={16} /> {n.label}</Link>)}
            </div>
            <div>
              <p className={s.fHead}>Akaunti</p>
              <Link href="/register"><AppIcon name="userPlus" size={16} /> Jisajili</Link>
              <Link href="/login"><AppIcon name="login" size={16} /> Ingia</Link>
            </div>
          </div>
          <p className={s.copy}>© {new Date().getFullYear()} Kubadilishana Portal. Haki zote zimehifadhiwa.</p>
        </div>
      </footer>
    </div>
  );
}
