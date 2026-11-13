"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  getDonationInfo, submitDonation, myDonations, bustGetCache, extractErrorMessage,
} from "@/lib/api";
import { useLive } from "@/lib/liveSocket";
import { useUnreadStore } from "@/lib/unreadStore";
import { timeAgo } from "@/lib/timeAgo";
import { parseServerDate } from "@/lib/dates";
import AppIcon from "@/components/app/AppIcon";
import { cx } from "@/components/app/dashboard";
import s from "@/components/app/app.module.css";

const SUPPORT_WA = "255556256070";
const SUPPORT_CALL = "0763795801";

type Status = "verifying" | "approved" | "rejected";
type Tab = "all" | Status;

const TABS: { key: Tab; label: string; dot?: string; bg: string; fg: string }[] = [
  { key: "all", label: "Zote", bg: "#f3f4f6", fg: "#6b7280" },
  { key: "verifying", label: "Inasubiri", dot: "#f59e0b", bg: "#fffbeb", fg: "#b45309" },
  { key: "approved", label: "Imekamilika", dot: "#16a34a", bg: "#f0fdf4", fg: "#15803d" },
  { key: "rejected", label: "Imekataliwa", dot: "#dc2626", bg: "#fef2f2", fg: "#b91c1c" },
];

const STATUS: Record<Status, { cls: string; icon: string; label: string }> = {
  verifying: { cls: s.sPd, icon: "clock", label: "Inasubiri" },
  approved: { cls: s.sOk, icon: "ok", label: "Imekamilika" },
  rejected: { cls: s.sNo, icon: "x", label: "Imekataliwa" },
};

const fmtNum = (n: string) => (n || "").replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
const fmtWa = (n: string) => {
  const d = (n || "").replace(/\D/g, "");
  return d.startsWith("255") ? `+255 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}` : `+255 ${d}`;
};

export default function Changia() {
  const { user } = useAuth();
  const { subscribe } = useLive();

  const [namba, setNamba] = useState("0763795801");
  const [currency, setCurrency] = useState("TZS");
  const [history, setHistory] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [kiasi, setKiasi] = useState("");
  const [simu, setSimu] = useState("");
  const [sms, setSms] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  async function loadHistory() {
    try { setHistory(await myDonations()); } catch {}
  }

  useEffect(() => {
    getDonationInfo()
      .then((info: any) => {
        if (info?.phone) setNamba(info.phone);
        if (info?.currency) setCurrency(info.currency);
      })
      .catch(() => {});
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.phone_primary) setSimu(user.phone_primary);
  }, [user?.phone_primary]);

  // Badge ya /changia iondolewe ukurasa unapofunguliwa
  useEffect(() => { useUnreadStore.getState().clear("/changia"); }, []);

  // Real-time: admin akithibitisha/kukataa
  useEffect(() => {
    const un = subscribe("notification", (p: any) => {
      if (p?.type === "payment.approved") {
        setFlash("✓ Malipo yamethibitishwa");
        bustGetCache();
        loadHistory();
      } else if (p?.type === "payment.rejected") {
        setFlash("✗ Malipo yamekataliwa");
        bustGetCache();
        loadHistory();
      } else if (p?.type === "payment.submitted" || p?.type === "payment.reply") {
        bustGetCache();
        loadHistory();
      } else {
        return;
      }
      setTimeout(() => setFlash(null), 6000);
    });
    return () => un();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe]);

  const counts = useMemo(
    () => ({
      all: history.length,
      verifying: history.filter((p) => p.status === "verifying").length,
      approved: history.filter((p) => p.status === "approved").length,
      rejected: history.filter((p) => p.status === "rejected").length,
    }),
    [history]
  );

  const list = tab === "all" ? history : history.filter((p) => p.status === tab);

  async function copy() {
    try {
      await navigator.clipboard?.writeText(namba);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const amount = Number(String(kiasi).replace(/[^\d]/g, ""));
    if (!amount || amount < 500) { setError("Kiasi cha chini ni TZS 500."); return; }
    if (sms.trim().length < 3) { setError("Bandika SMS ya uthibitisho uliyopokea."); return; }

    setSending(true);
    try {
      await submitDonation({ amount, phone: simu.trim(), sms_text: sms.trim(), purpose: "donation" });
      setSms("");
      setFlash("✓ Malipo yamewasilishwa — yanasubiri uthibitisho");
      bustGetCache();
      await loadHistory();
      setTimeout(() => setFlash(null), 6000);
    } catch (err: any) {
      setError(extractErrorMessage(err, "Imeshindikana kutuma. Angalia mtandao kisha ujaribu tena."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={s.wrap}>
      <h1 className={s.pageTitle}>Changia <span className={s.chBlue}>Huduma</span></h1>
      <p className={s.pageSub}>
        Lipa kwa namba hapa chini (M-Pesa, Tigo Pesa, Airtel Money, Halopesa), kisha nakili SMS ya kuthibitisha.
      </p>

      {flash && (
        <div className={s.banner} style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#15803d" }}>
          <AppIcon name="ok" size={14} sw={2} />
          <span>{flash}</span>
        </div>
      )}

      {/* Namba ya malipo */}
      <div className={s.card}>
        <div className={s.row}>
          <div style={{ minWidth: 0 }}>
            <span className={s.small}>Lipa kwa namba hii</span>
            <b className={s.bigNum}>{fmtNum(namba)}</b>
          </div>
          <button type="button" className={s.btnOut} onClick={copy}>
            <AppIcon name={copied ? "ok" : "copy"} size={14} />
            {copied ? "Imenakiliwa" : "Nakili"}
          </button>
        </div>

        <div className={s.steps}>
          <div><span>1</span><p>Lipa</p></div>
          <i />
          <div><span>2</span><p>Nakili SMS</p></div>
          <i />
          <div><span>3</span><p>Thibitisha</p></div>
        </div>
      </div>

      {/* Fomu ya kuthibitisha */}
      <form className={s.card} onSubmit={submit}>
        <p className={s.formTitle}>Thibitisha malipo yako</p>

        <p className={s.label}>Kiasi ({currency})</p>
        <label className={s.input}>
          <span className={s.prefix}>{currency}</span>
          <input
            inputMode="numeric"
            value={kiasi}
            onChange={(e) => setKiasi(e.target.value)}
            placeholder="2,500"
            disabled={sending}
            required
          />
        </label>

        <p className={s.label}>Namba ya Simu uliyolipia</p>
        <label className={s.input}>
          <AppIcon name="phone" size={14} />
          <input
            type="tel"
            value={simu}
            onChange={(e) => setSimu(e.target.value)}
            placeholder="+255 612 500 600"
            disabled={sending}
            required
          />
        </label>

        <p className={s.label}>SMS ya Kuthibitisha Malipo</p>
        <textarea
          className={s.textarea}
          value={sms}
          onChange={(e) => { setSms(e.target.value); setError(""); }}
          placeholder="Mf. C2H8MZ3JX1 Confirmed. You have received TZS 2,500.00 from ..."
          disabled={sending}
          required
        />
        <p className={s.hint}>Bandika SMS nzima uliyopokea baada ya kulipa.</p>

        {error && (
          <div className={s.banner}>
            <AppIcon name="alert" size={14} sw={2} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button type="submit" className={s.btnPrimary} disabled={sending}>
            {sending ? "Inatuma..." : "Thibitisha"}
          </button>
        </div>
      </form>

      {/* Malipo yangu */}
      <h2 className={s.sectionTitle}>Malipo yangu</h2>

      <div className={s.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={cx(s.tab, tab === t.key && s.tabOn)}
            onClick={() => setTab(t.key)}
          >
            {t.dot && <i style={{ background: t.dot }} />}
            {t.label}
            <em style={tab !== t.key ? { background: t.bg, color: t.fg } : undefined}>
              {counts[t.key]}
            </em>
          </button>
        ))}
      </div>

      <div className={cx(s.card, s.list)}>
        {list.length === 0 && <div className={s.empty}>Hakuna malipo hapa.</div>}

        {list.map((p: any) => {
          const st = STATUS[(p.status as Status) || "verifying"] || STATUS.verifying;
          const ts = parseServerDate(p.created_at);
          const when = ts
            ? `${ts.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })} · ${ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
            : "—";

          return (
            <div className={s.pay} key={p.order_id || p.id}>
              <div className={s.payRow}>
                <span className={s.payIc}>
                  <AppIcon name="cash" size={16} />
                </span>

                <div className={s.w}>
                  <p className={s.amt}>TZS {Number(p.amount || 0).toLocaleString("en")}</p>
                  <p className={s.time}>{when}</p>
                </div>

                <div className={s.payRight}>
                  <span className={cx(s.status, st.cls)}>
                    <AppIcon name={st.icon} size={13} sw={2} />
                    {st.label}
                  </span>
                  {ts && <span className={s.ago}>{timeAgo(ts.getTime(), "sw")}</span>}
                </div>
              </div>

              {p.status === "verifying" && (
                <p className={cx(s.note, s.notePd)}>Admin anakagua malipo yako.</p>
              )}

              {p.status === "rejected" && (
                <p className={s.note}>
                  {p.note ? `${p.note} · ` : "Pesa haijaingia · "}
                  <a href={`https://wa.me/${SUPPORT_WA}`} target="_blank" rel="noreferrer">
                    Wasiliana na Admin ›
                  </a>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Msaada */}
      <div className={s.card}>
        <p className={s.formTitle}>Maswali au matatizo?</p>
        <p className={s.hint} style={{ fontSize: 12.5, margin: "2px 0 6px" }}>
          Wasiliana nasi, tutakusaidia.
        </p>

        <div className={s.helpLine}>
          <span className={cx(s.helpIc, s.helpIcCall)}>
            <AppIcon name="phone" size={16} />
          </span>
          <div className={s.w}>
            <span className={s.small}>Piga simu</span>
            <b>{fmtNum(SUPPORT_CALL)}</b>
          </div>
          <a className={cx(s.helpBtn, s.helpBtnCall)} href={`tel:${SUPPORT_CALL}`}>
            <AppIcon name="phone" size={14} /> Piga
          </a>
        </div>

        <div className={s.helpLine}>
          <span className={cx(s.helpIc, s.helpIcWa)}>
            <AppIcon name="waLogo" size={16} />
          </span>
          <div className={s.w}>
            <span className={s.small}>WhatsApp</span>
            <b>{fmtWa(SUPPORT_WA)}</b>
          </div>
          <a
            className={cx(s.helpBtn, s.helpBtnWa)}
            href={`https://wa.me/${SUPPORT_WA}`}
            target="_blank"
            rel="noreferrer"
          >
            <AppIcon name="waLogo" size={14} /> Ujumbe
          </a>
        </div>
      </div>
    </div>
  );
}
