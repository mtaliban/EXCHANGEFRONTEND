"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getMyProfile } from "@/lib/api";
import s from "@/components/app/app.module.css";

const fmt = (n: string) => (n || "").replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");

function Table({ title, rows }: { title: string; rows: [string, React.ReactNode][] }) {
  return (
    <div className={s.tb}>
      <div className={s.th}>{title}</div>
      {rows.map(([k, v], i) => (
        <div className={s.tr} key={`${k}-${i}`}>
          <span>{k}</span>
          <b>{v}</b>
        </div>
      ))}
    </div>
  );
}

export default function Wasifu() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    getMyProfile().then(setProfile).catch(() => {});
  }, []);

  // API ndiyo chanzo; session inatumika kama fallback wakati bado inapakia
  const p: any = profile || user || {};
  const station = p.current_station || {};
  const dests: any[] = p.desired_destinations || [];
  const dept =
    p.category === "education" ? "Elimu" : p.category === "health" ? "Afya" : p.category || "—";

  return (
    <div className={s.wrap}>
      <div className={s.pHead}>
        <h1 className={s.pTitleH}>Wasifu <span className={s.chBlue}>Wangu</span></h1>
        <Link className={s.pEdit} href="/wasifu/hariri">
          Hariri
        </Link>
      </div>

      <Table
        title="A. Utambulisho"
        rows={[
          ["Jina Kamili", p.full_name || "—"],
          ["Namba ya Simu", p.phone_primary ? fmt(p.phone_primary) : <em className={s.pNone}>—</em>],
          ["Simu ya pili", p.phone_alt ? fmt(p.phone_alt) : <em className={s.pNone}>—</em>],
          ["Idara", dept],
          ["Kada", p.cadre_display || p.cadre_code || "—"],
          [
            "Masomo",
            p.subjects?.length ? p.subjects.join(", ") : <em className={s.pNone}>—</em>,
          ],
        ]}
      />

      <Table
        title="B. Kituo cha Sasa"
        rows={[
          ["Mkoa", station.region_name || "—"],
          ["Wilaya", station.district_name || "—"],
          ["Kituo", station.facility_name || <em className={s.pNone}>—</em>],
        ]}
      />

      <Table
        title="C. Ninataka Kwenda"
        rows={
          dests.length
            ? dests.map(
                (d: any, i: number) =>
                  [
                    `Chaguo ${i + 1}`,
                    <span className={s.pGo} key={i}>
                      {d.region_name || "—"}
                      {d.district_name && <i>{d.district_name}</i>}
                    </span>,
                  ] as [string, React.ReactNode]
              )
            : [["Chaguo", <em className={s.pNone} key="none">Hakuna lengo lililowekwa</em>]]
        }
      />
    </div>
  );
}
