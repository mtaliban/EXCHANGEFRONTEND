"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLive } from "@/lib/liveSocket";
import { useUnreadStore } from "@/lib/unreadStore";
import { myFeedback, submitFeedback } from "@/lib/api";
import { timeAgo } from "@/lib/timeAgo";
import { parseServerDate } from "@/lib/dates";
import AppIcon from "@/components/app/AppIcon";
import { cx } from "@/components/app/dashboard";
import s from "@/components/app/app.module.css";

const PAGE_SIZE = 5;
const MAX_CHARS = 500;

export default function Maoni() {
  const { subscribe } = useLive();
  const [text, setText] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [page, setPage] = useState(1);

  async function reload() {
    try {
      const d: any = await myFeedback();
      setItems(d?.items || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { useUnreadStore.getState().clear("/maoni"); }, []);

  // Jibu la admin linafika papo hapo (WebSocket)
  useEffect(() => {
    const un = subscribe("notification", (p: any) => {
      if (p?.type === "feedback.replied") reload();
    });
    return () => un();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe]);

  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const pageItems = useMemo(
    () => items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [items, safePage]
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    const t = text.trim();
    if (t.length < 3) { setError("Andika maoni yako kwanza."); return; }

    setSending(true);
    try {
      // Kichwa kinatokana na maoni yenyewe — mtumiaji anaandika sanduku moja.
      const subject = t.length > 60 ? `${t.slice(0, 60)}…` : t;
      await submitFeedback({ subject, message: t });
      setOk("✓ Maoni yako yametumwa kwa admin — utajibiwa hivi karibuni.");
      setText("");
      setPage(1);
      await reload();
      setTimeout(() => setOk(""), 5000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Imeshindikana kutuma — jaribu tena.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={cx(s.wrap, s.mPage)}>
      <h1 className={s.mTitle}>Maoni na Malalamiko</h1>
      <p className={s.mSub}>Una swali, ushauri au tatizo? Tuandikie hapa na tutakujibu.</p>

      <form onSubmit={submit} className={s.mForm}>
        <textarea
          className={s.mBox}
          value={text}
          maxLength={MAX_CHARS}
          onChange={(e) => { setText(e.target.value); setError(""); }}
          placeholder="Eleza maoni au tatizo lako kwa ufupi..."
          disabled={sending}
        />
        <div className={s.mFoot}>
          <span className={s.mHint}>
            <i><AppIcon name="chats" size={15} sw={1.9} /></i> Jibu la admin litaonekana hapa chini
          </span>
          <button
            type="submit"
            className={s.btnPrimary}
            disabled={sending || !text.trim()}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px" }}
          >
            <AppIcon name="send" size={13} sw={2} /> {sending ? "Inatuma..." : "Tuma"}
          </button>
        </div>

        {error && (
          <div className={s.banner}>
            <AppIcon name="alert" size={14} sw={2} />
            <span>{error}</span>
          </div>
        )}
        {ok && (
          <div className={s.banner} style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#15803d" }}>
            <AppIcon name="ok" size={14} sw={2} />
            <span>{ok}</span>
          </div>
        )}
      </form>

      <h2 className={s.sectionTitle}>Maoni yangu ({items.length})</h2>

      {loading ? (
        <div className={s.loading}><span className={s.spin} /> Inapakia...</div>
      ) : items.length === 0 ? (
        <div className={cx(s.card, s.empty)}>Bado hujatuma maoni yoyote.</div>
      ) : (
        pageItems.map((f: any) => {
          const created = parseServerDate(f.created_at);
          const replied = f.status === "replied" || !!f.admin_reply;
          return (
            <div className={s.mCard} key={f.id}>
              <div className={s.mTop}>
                {replied ? (
                  <span className={cx(s.status, s.sOk)}>
                    <AppIcon name="ok" size={13} sw={2} /> Yamejibiwa
                  </span>
                ) : (
                  <span className={cx(s.status, s.sPd)}>
                    <AppIcon name="clock" size={13} sw={2} /> Yanasubiri
                  </span>
                )}
                <span className={s.ago}>{created ? timeAgo(created.getTime(), "sw") : ""}</span>
              </div>

              <p className={s.mText}>{f.message}</p>

              {f.admin_reply && (
                <div className={s.mAdmin}>
                  <b>Jibu la admin</b>
                  <p>{f.admin_reply}</p>
                </div>
              )}
            </div>
          );
        })
      )}

      {items.length > PAGE_SIZE && (
        <div className={s.pager}>
          <button type="button" className={s.pageBtn} disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
            <AppIcon name="chevL" size={14} sw={2.2} /> Rudi
          </button>
          <span className={s.pageInfo}>
            <b style={{ color: "#111827" }}>{safePage}</b> / {pages}
          </span>
          <button type="button" className={s.pageBtn} disabled={safePage >= pages} onClick={() => setPage(safePage + 1)}>
            Endelea <AppIcon name="chevR" size={14} sw={2.2} />
          </button>
        </div>
      )}
    </div>
  );
}
