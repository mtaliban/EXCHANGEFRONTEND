"use client";

import { useMemo, useState } from "react";
import AppIcon from "./AppIcon";
import s from "./app.module.css";

export const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(" ");

export type Opt = { value: string; label: string };

/* ---------- Kadi ya Karibu ---------- */
export function WelcomeCard(p: {
  jina: string;
  kada: string;
  idara: string;
  wilaya: string;
  mkoa: string;
  amelipa: boolean;
  namba: string;
}) {
  return (
    <div className={cx(s.card, s.welcome)}>
      <div className={s.wLeft}>
        <span className={s.avatar}>{(p.jina || "?").trim()[0]}</span>
        <div style={{ minWidth: 0 }}>
          <span className={s.muted}>Karibu,</span>
          <p className={s.wName}>{p.jina}</p>
          {p.kada && <p className={s.wLine}>{p.kada}</p>}
          <p className={s.wLine}>
            <span className={s.blue}>{p.idara}</span>
            {(p.wilaya || p.mkoa) && ` · ${[p.wilaya, p.mkoa].filter(Boolean).join(", ")}`}
          </p>
        </div>
      </div>
      <div className={s.wRight}>
        <span className={cx(s.payIcon, p.amelipa ? s.payOk : s.payNo)}>
          <AppIcon name={p.amelipa ? "ok" : "alert"} size={20} sw={2} />
        </span>
        <span className={s.payLabel} style={{ color: p.amelipa ? "#15803d" : "#b91c1c" }}>
          {p.amelipa ? "Ameliipia" : "Haujalipa"}
        </span>
        <span className={s.payNum}>{p.namba}</span>
      </div>
    </div>
  );
}

/* ---------- Muhtasari: 73 walimu · Wanatoka → Wanakuja ---------- */
export function SummaryCard({
  count, from, to, noun = "walimu",
}: { count: number; from: string; to: string; noun?: string }) {
  return (
    <div className={cx(s.card, s.summary)}>
      <div className={s.countBox}>
        <b>{count}</b>
        <span>{noun}</span>
      </div>
      <div className={s.route}>
        <small className={s.rl1}>
          <AppIcon name="map" size={13} /> Wanatoka
        </small>
        <small className={s.rl2}>
          <AppIcon name="pin" size={13} /> Wanakuja
        </small>
        <b className={s.rv1} title={from}>{from}</b>
        <span className={s.arrow}>
          <i />
          <AppIcon name="chevR" size={13} sw={2.4} />
        </span>
        <b className={s.rv2} title={to}>{to}</b>
      </div>
    </div>
  );
}

/* ---------- Dropdown inayofunguka NDANI ya kadi ---------- */
export function InlineDropdown({
  icon,
  value,
  allLabel,
  options,
  onChange,
  disabled,
  disabledText,
  layout,
  countLabel,
}: {
  icon: string;
  value: string | null;
  allLabel: string;
  options: Opt[];
  onChange: (v: string | null) => void;
  disabled?: boolean;
  disabledText?: string;
  layout: "grid3" | "grid2" | "scroll";
  countLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const list = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())),
    [options, q]
  );
  const current = options.find((o) => o.value === value);
  const pick = (v: string | null) => {
    onChange(v);
    setOpen(false);
    setQ("");
  };

  return (
    <div
      className={cx(
        s.dd,
        open && s.ddOpen,
        (!!value || !disabled) && s.ddFilled,
        disabled && s.ddDisabled
      )}
    >
      <button
        type="button"
        className={s.ddBtn}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={s.ddIcon}>
          <AppIcon name={icon} size={14} />
        </span>
        <span>{disabled ? disabledText : current?.label ?? allLabel}</span>
        <AppIcon name="down" size={15} sw={2} />
      </button>
      {open && (
        <div className={s.ddPanel}>
          <label className={s.search}>
            <AppIcon name="search" size={14} sw={2} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tafuta..." />
          </label>
          <div className={s.ddCount}>
            {countLabel} <b>{list.length}</b>
            {layout === "scroll" && " · shusha chini kuona zaidi"}
          </div>
          <div className={s[layout === "scroll" ? "scrollList" : layout]}>
            {!q && (
              <button
                type="button"
                className={cx(s.opt, s.optAll, !value && s.optOn)}
                onClick={() => pick(null)}
              >
                {allLabel}
              </button>
            )}
            {list.map((o) => (
              <button
                type="button"
                key={o.value}
                title={o.label}
                className={cx(s.opt, o.value === value && s.optOn)}
                onClick={() => pick(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Kadi ya mwalimu ---------- */
export function TeacherCard({
  c,
  myRegionName,
  mySubjects,
  ago,
  dateLabel,
  canContact,
  onCall,
  onSMS,
  onWhatsApp,
  toast,
}: {
  c: any;
  myRegionName: string;
  mySubjects: string[];
  ago: string;
  dateLabel: string;
  canContact: boolean;
  onCall: () => void;
  onSMS: () => void;
  onWhatsApp: () => void;
  toast?: string | null;
}) {
  const from = c.current_station || {};
  const to = c.matching_destination || c.desired_destinations?.[0] || null;
  const subjects: string[] = c.subjects || [];
  const matched = subjects.filter((m) => mySubjects.includes(m));
  const years = c.years_of_service === 3 ? "3+" : String(c.years_of_service || "");
  const isEdu = c.category === "education";
  const dept =
    c.category === "education" ? "Elimu" : c.category === "health" ? "Afya" : c.category || "—";

  return (
    <div className={s.card} style={{ padding: 16 }}>
      <div className={s.tTop}>
        <span className={s.tAvatar}>{(c.full_name || "?").trim()[0]}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p className={s.tName}>{c.full_name}</p>
          <p className={s.tSub}>
            <span className={s.blue}>{dept}</span>
            <span className={s.dotSep} />
            <span style={{ minWidth: 0 }}>{c.cadre_display || c.cadre_code || "—"}</span>
            {!isEdu && c.cadre_code && <span className={s.cadreBadge}>{c.cadre_code}</span>}
            {c.online && <span style={{ color: "#16a34a", fontWeight: 700 }}>● mtandaoni</span>}
          </p>
        </div>
      </div>

      <div className={s.trip}>
        <div className={s.stop}>
          <i />
          <div>
            <small>Kutoka</small>
            <p>
              <b>{from.region_name || "—"}</b>
              {from.district_name && <span>, {from.district_name}</span>}
            </p>
          </div>
        </div>
        <div className={cx(s.stop, s.stopTo)}>
          <i />
          <div>
            <small>Anataka</small>
            <p>
              <b>{to?.region_name || "—"}</b>
              {to?.district_name && <span>, {to.district_name}</span>}
            </p>
          </div>
        </div>
        <div className={cx(s.stop, s.stopCome)}>
          <i />
          <div>
            <small>Anakuja</small>
            <p>
              <b>{myRegionName || "—"}</b>
            </p>
          </div>
        </div>
      </div>

      <div className={s.facts}>
        <div className={s.fact}>
          <small>Miaka ya kazi</small>
          <div className={s.years}>
            {(["1", "2", "3+"] as const).map((y) => (
              <span key={y} className={years === y ? s.yOn : ""}>
                {y}
              </span>
            ))}
          </div>
        </div>
        <div className={s.fact}>
          <small>Amejisajili</small>
          <b>{ago}</b>
          <em>
            <AppIcon name="cal" size={12} /> {dateLabel}
          </em>
        </div>
      </div>

      {isEdu && subjects.length > 0 && (
        <div className={s.subjects}>
          <div className={s.subHead}>
            <span className={s.subIcon}>
              <AppIcon name="cap" size={16} />
            </span>
            Masomo
          </div>
          <div className={s.subRow}>
            {subjects.map((m) => (
              <span key={m} className={cx(s.subj, matched.includes(m) && s.subjOn)}>
                {m}
              </span>
            ))}
            {matched.length > 0 && (
              <span className={s.match}>
                <AppIcon name="target" size={12} sw={2} /> Masomo yanalingana
              </span>
            )}
          </div>
        </div>
      )}

      <div className={s.actions}>
        <button type="button" className={s.act} onClick={onCall} disabled={!c.phone_primary}>
          <AppIcon name="phone" size={14} /> Piga
        </button>
        <button type="button" className={s.act} onClick={onSMS} disabled={!c.phone_primary}>
          <AppIcon name="msg" size={14} /> SMS
        </button>
        <button
          type="button"
          className={cx(s.act, s.actWa)}
          onClick={onWhatsApp}
          disabled={!c.phone_alt}
        >
          <AppIcon name="waLogo" size={14} /> WhatsApp
        </button>
      </div>

      {/* Toast inatokea TU baada ya kubonyeza kitufe — hakuna maandishi ya malipo kabla */}
      {toast &&
        (canContact ? (
          <div className={s.toast}>
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {toast}
            </span>
          </div>
        ) : (
          <a
            href="/changia"
            className={s.toast}
            style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#b91c1c" }}
          >
            <AppIcon name="alert" size={14} sw={2} />
            <span style={{ flex: 1, minWidth: 120 }}>{toast}</span>
            <span style={{ whiteSpace: "nowrap" }}>Changia →</span>
          </a>
        ))}
    </div>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  return (
    <div className={s.pager}>
      <button type="button" className={s.pageBtn} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <AppIcon name="chevL" size={14} sw={2.2} /> Iliyopita
      </button>
      <span className={s.pageInfo}>
        Ukurasa <b style={{ color: "#111827" }}>{page}</b> / {pages}
      </span>
      <button type="button" className={s.pageBtn} disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Inayofuata <AppIcon name="chevR" size={14} sw={2.2} />
      </button>
    </div>
  );
}
