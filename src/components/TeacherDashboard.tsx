"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  getBoard, getRegions, getDistricts, getFacilities, getMe, getCadres, logContact, bustGetCache,
  isDefaultName, type Region, type District, type Facility, type Cadre,
} from "@/lib/api";
import { useLiveEvents } from "@/lib/useLiveEvents";
import { useLive } from "@/lib/liveSocket";
import { useDataVersion } from "@/lib/useDataVersion";
import { useI18n, useT } from "@/lib/i18n";
import { boardEmptyMessage } from "@/lib/i18n_board";
import { mechi, mechiAfya, ngaziYa, type Mimi } from "@/lib/match";
import { timeAgo } from "@/lib/timeAgo";
import { parseServerDate } from "@/lib/dates";
import AppIcon from "@/components/app/AppIcon";
import {
  InlineDropdown, Pager, SummaryCard, TeacherCard, WelcomeCard, cx, type Opt,
} from "@/components/app/dashboard";
import s from "@/components/app/app.module.css";

const PAGE_SIZE = 5;
const PAY_NUMBER = "0763 795 801";

const SUBJECT_FILTERS = [
  { value: "off", label: "Wote" },
  { value: "all", label: "Yote mawili" },
  { value: "any", label: "Somo moja" },
  { value: "none", label: "Wasio match" },
] as const;

export default function TeacherDashboard() {
  const t = useT();
  const lang = useI18n((st) => st.lang);
  const { user } = useAuth();
  const myStation = (user?.current_station || {}) as any;
  const dests = (user?.desired_destinations || []) as any[];
  const isAdmin = !!(user as any)?.is_admin;
  const isEdu = isAdmin ? true : user?.category === "education";

  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [regionSel, setRegionSel] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [facilityId, setFacilityId] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<"off" | "any" | "all" | "none">("off");
  const [cadreCode, setCadreCode] = useState<string | null>(null);
  const [cadres, setCadres] = useState<Cadre[]>([]);
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(Date.now());

  const { messages, connected } = useLiveEvents([
    "match.found", "user.registered", "user.profile_updated", "user.changed", "user.removed", "contact.toggled",
  ]);
  const liveOnline = useLive((st) => st.onlineUserIds);
  const dv = useDataVersion();

  // Toast ya kadi (moja kwa wakati)
  const [cardToast, setCardToast] = useState<{ msg: string | null; uid: string; tick: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showCardToast(msg: string, uid: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setCardToast(null);
    setTimeout(() => {
      setCardToast({ msg, uid, tick: 0 });
      toastTimer.current = setTimeout(() => setCardToast(null), 3500);
    }, 40);
  }
  // Notisi ya "Changia ... upate namba" — inabaki hadi mtumiaji aendelee
  function showPayNote(uid: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setCardToast((prev) => ({
      msg: null,
      uid,
      tick: (prev && prev.uid === uid ? prev.tick : 0) + 1,
    }));
  }

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Mikoa (dropdown) — inajirefresh pale admin anabadilisha data
  useEffect(() => {
    getRegions(true).then(setRegions).catch(() => {});
  }, [dv]);

  // Kada (kwa Afya na idara zisizo na masomo) — kutoka DB
  useEffect(() => {
    getCadres(isAdmin ? undefined : (user?.category as any)).then(setCadres).catch(() => {});
  }, [isAdmin, user?.category]);

  // Wilaya za mkoa uliochaguliwa
  useEffect(() => {
    const rid = regionSel ? Number(regionSel) : NaN;
    if (!Number.isNaN(rid)) getDistricts(rid).then(setDistricts).catch(() => setDistricts([]));
    else setDistricts([]);
  }, [regionSel]);

  // Vituo vya wilaya iliyochaguliwa
  useEffect(() => {
    const did = districtId ? Number(districtId) : NaN;
    if (!Number.isNaN(did)) {
      if (isAdmin) {
        Promise.all([
          getFacilities(did, "health").catch(() => [] as Facility[]),
          getFacilities(did, "education").catch(() => [] as Facility[]),
        ]).then(([h, e]) => setFacilities([...h, ...e])).catch(() => setFacilities([]));
      } else {
        getFacilities(did, (user?.category as any) || "health").then(setFacilities).catch(() => setFacilities([]));
      }
    } else {
      setFacilities([]);
    }
  }, [districtId, user?.category, isAdmin]);

  const loadBoard = useCallback(
    async (forceFresh = false) => {
      setLoading(true);
      try {
        const params: any = { scope: "incoming" };
        if (regionSel) params.region_ids = regionSel;
        if (districtId) params.district_id = Number(districtId);
        if (facilityId) params.facility_id = facilityId;
        if (subjectFilter !== "off") params.subject_filter = subjectFilter;
        if (cadreCode) params.cadre_code = cadreCode;
        bustGetCache();
        const b = await getBoard(params, forceFresh);
        setBoard(b);
      } finally {
        setLoading(false);
      }
    },
    [regionSel, districtId, facilityId, subjectFilter, cadreCode]
  );

  useEffect(() => {
    loadBoard(true);
  }, [loadBoard]);

  // REFRESH user (malipo/mawasiliano) kila mtu anapoingia
  useEffect(() => {
    getMe(true).then((me: any) => useAuth.getState().setUser(me)).catch(() => {});
  }, []);

  // Live: mtu mpya/profile/contact → board ijirefresh yenyewe
  useEffect(() => {
    if (!messages.length) return;
    const latest = messages[messages.length - 1];
    if (
      latest.topic === "match.found" || latest.topic === "user.registered" ||
      latest.topic === "user.profile_updated" || latest.topic === "user.changed" ||
      latest.topic === "user.removed" || latest.topic === "contact.toggled"
    ) {
      bustGetCache();
      const id = setTimeout(() => loadBoard(true), 300);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, loadBoard]);

  const regionOpts: Opt[] = useMemo(
    () => regions.map((r) => ({ value: String(r.id), label: r.name })),
    [regions]
  );
  const districtOpts: Opt[] = useMemo(
    () => districts.map((d) => ({ value: String(d.id), label: d.name })),
    [districts]
  );
  const facilityOpts: Opt[] = useMemo(
    () => facilities.map((f: any) => ({ value: String(f.id ?? f.code), label: f.name })),
    [facilities]
  );
  const cadreOpts: Opt[] = useMemo(
    () => cadres.map((c) => ({ value: c.code, label: c.display_name, code: c.code })),
    [cadres]
  );

  const regionName = useMemo(() => {
    if (!regionSel) return "Mikoa yote";
    return regions.find((r) => String(r.id) === regionSel)?.name || "Mikoa yote";
  }, [regionSel, regions]);

  const mySubjects = useMemo(() => (user?.subjects || []) as string[], [user?.subjects]);
  const myRegionName = myStation.region_name || "";

  // Kadi: wanaolingana nawe wanakaa JUU (asilimia kubwa kwanza), wengine chini
  const rows = useMemo(() => {
    const list = [...((board?.candidates as any[]) || [])];
    list.forEach((c) => { c.online = liveOnline.has(c.user_id) || !!c.online; });

    const mimi: Mimi = {
      ngazi: ngaziYa(user?.cadre_display || user?.cadre_code, mySubjects),
      mkoa: myRegionName,
      wilaya: myStation.district_name || "",
      malengo: ((user?.desired_destinations || []) as any[]).map((d) => ({
        region_name: d?.region_name, district_name: d?.district_name,
      })),
      masomo: mySubjects,
    };

    const niAfya = user?.category === "health";

    return list
      .map((c) => {
        const destinations = (c.desired_destinations?.length
          ? c.desired_destinations
          : c.matching_destination ? [c.matching_destination] : []) as any[];
        const mtu = { current_station: c.current_station, destinations, masomo: c.subjects || [], kada_code: c.cadre_code };
        const m = mimi.mkoa && mimi.malengo.length
          ? niAfya
            ? mechiAfya({ kadaCode: user?.cadre_code || "", mkoa: mimi.mkoa, wilaya: mimi.wilaya, malengo: mimi.malengo }, mtu)
            : mechi(mimi, mtu)
          : null;
        return { c, m };
      })
      .sort((a, b) => (b.m?.pct ?? -1) - (a.m?.pct ?? -1));
  }, [board, liveOnline, user?.category, user?.cadre_display, user?.cadre_code, user?.desired_destinations, mySubjects, myRegionName, myStation.district_name]);

  const total = board?.total ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [rows, safePage]
  );

  // Malipo / ruhusa ya kuwasiliana — sheria ile ile ya sasa ya mfumo
  const requirePayment = !!(user as any)?.require_payment_for_contact;
  const contactEnabled = !!(user as any)?.contact_enabled;
  const viewedPaid = !!(user as any)?.is_verified || isDefaultName(user?.full_name || "") || contactEnabled;
  const canContact = !requirePayment || viewedPaid;

  const resetFilters = () => {
    setRegionSel(null);
    setDistrictId(null);
    setFacilityId(null);
    setSubjectFilter("off");
    setCadreCode(null);
    setPage(1);
  };

  const deptName =
    user?.category === "education" ? "Elimu" : user?.category === "health" ? "Afya" : (user?.category || "Mwanachama");

  const empty = boardEmptyMessage(myRegionName, lang);

  return (
    <div className={s.wrap}>
      <WelcomeCard
        jina={user?.full_name || ""}
        kada={user?.cadre_display || user?.cadre_code || ""}
        idara={deptName}
        wilaya={myStation.district_name || ""}
        mkoa={myRegionName}
        amelipa={viewedPaid}
        namba={PAY_NUMBER}
      />

      <SummaryCard
        count={total}
        noun={isEdu ? "walimu" : "watumishi"}
        from={[regionName, districtOpts.find((d) => d.value === districtId)?.label].filter(Boolean).join(" · ")}
        to={myRegionName || "Mkoa wako"}
      />

      {/* ═══ Kuchuja ═══ */}
      <div className={s.card}>
        {
          <>
            <p className={s.label} style={{ marginTop: 0 }}>Mkoa wanakotoka</p>
            <InlineDropdown
              icon="map"
              value={regionSel}
              allLabel="Mikoa yote"
              options={regionOpts}
              layout="grid3"
              countLabel="Mikoa"
              onChange={(v) => { setRegionSel(v); setDistrictId(null); setFacilityId(null); setPage(1); }}
            />

            <p className={s.label}>Wilaya / Halmashauri</p>
            <InlineDropdown
              icon="pin"
              value={districtId}
              allLabel="Wilaya zote"
              options={districtOpts}
              layout="grid2"
              countLabel="Wilaya"
              disabled={!regionSel}
              disabledText="Chagua mkoa kwanza"
              onChange={(v) => { setDistrictId(v); setFacilityId(null); setPage(1); }}
            />

            <p className={s.label}>{isEdu ? "Kituo / Shule" : "Kituo"} <em>(hiari)</em></p>
            <InlineDropdown
              icon="school"
              value={facilityId}
              allLabel="Vituo vyote"
              options={facilityOpts}
              layout="scroll"
              countLabel="Vituo"
              disabled={!districtId}
              disabledText="Chagua wilaya kwanza"
              onChange={(v) => { setFacilityId(v); setPage(1); }}
            />

            <div className={s.divider} />

            {isEdu && (
              <>
                <p className={s.label}>Masomo</p>
                <div className={s.chips}>
                  {SUBJECT_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      className={cx(s.chip, subjectFilter === f.value && s.chipOn)}
                      aria-pressed={subjectFilter === f.value}
                      onClick={() => { setSubjectFilter(f.value); setPage(1); }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {(!isEdu || isAdmin) && (
              <>
                {isEdu && <div className={s.divider} />}
                <p className={s.label}>Kada</p>
                <InlineDropdown
                  icon="kit"
                  value={cadreCode}
                  allLabel="Kada zote"
                  options={cadreOpts}
                  layout="scroll"
                  countLabel="Kada"
                  onChange={(v) => { setCadreCode(v); setPage(1); }}
                />
              </>
            )}

            <div className={s.clearRow}>
              <span className={s.liveRow} style={{ margin: 0 }}>
                <span className={cx(s.liveDot, !connected && s.liveDotOff)} />
                {connected ? t("board.live", "Live") : "Inaunganisha..."}
                <span className={s.pill}>
                  <AppIcon name="users" size={11} sw={2} /> {total}
                </span>
              </span>
              {(regionSel || districtId || facilityId || subjectFilter !== "off" || cadreCode) && (
                <button type="button" className={s.clearBtn} onClick={resetFilters}>
                  Ondoa vichujio
                </button>
              )}
            </div>
          </>
        }
      </div>

      {/* ═══ Kadi za walimu ═══ */}
      {loading && rows.length === 0 ? (
        <div className={s.loading}>
          <span className={s.spin} /> Inapakia...
        </div>
      ) : pageItems.length === 0 ? (
        <div className={cx(s.card, s.empty)}>
          <span className={s.subIcon} style={{ margin: "0 auto", width: 44, height: 44, borderRadius: 12 }}>
            <AppIcon name="users" size={20} />
          </span>
          <h3>{empty.title}</h3>
          <p>{empty.hint}</p>
        </div>
      ) : (
        <>
          {pageItems.map(({ c, m }) => {
            const createdTs = c.created_at ? (parseServerDate(c.created_at)?.getTime() ?? now) : now;
            const ago = timeAgo(createdTs, lang);
            const dateLabel = new Date(createdTs).toLocaleDateString("sw-TZ", {
              day: "numeric", month: "short", year: "numeric",
            });

            const call = async () => {
              if (!canContact) { showPayNote(c.user_id); return; }
              showCardToast(`Piga ${c.full_name}`, c.user_id);
              try { await logContact(c.user_id, "call", "initiated"); } catch {}
              window.location.href = `tel:${c.phone_primary}`;
            };
            const sms = async () => {
              if (!canContact) { showPayNote(c.user_id); return; }
              showCardToast(`SMS kwa ${c.full_name}`, c.user_id);
              try { await logContact(c.user_id, "sms", "initiated"); } catch {}
              const body = `Habari ${c.full_name}, mimi ni ${user?.full_name || ""}${myRegionName ? `, niko ${myRegionName}` : ""}. Naomba kujadili kubadilishana vituo.`;
              window.location.href = `sms:${c.phone_primary}?body=${encodeURIComponent(body)}`;
            };
            const wa = async () => {
              if (!canContact) { showPayNote(c.user_id); return; }
              showCardToast(`WhatsApp kwa ${c.full_name}`, c.user_id);
              try { await logContact(c.user_id, "whatsapp", "initiated"); } catch {}
              const digits = String(c.phone_alt || "").replace(/\D/g, "").replace(/^0/, "255");
              window.open(`https://wa.me/${digits}`, "_blank");
            };

            return (
              <TeacherCard
                key={c.user_id}
                c={c}
                myRegionName={myRegionName}
                mySubjects={mySubjects}
                ago={ago}
                dateLabel={dateLabel}
                canContact={canContact}
                onCall={call}
                onSMS={sms}
                onWhatsApp={wa}
                toast={cardToast && cardToast.uid === c.user_id ? cardToast.msg : null}
                payTick={cardToast && cardToast.uid === c.user_id ? cardToast.tick : 0}
                match={m}
              />
            );
          })}

          {totalPages > 1 && (
            <Pager page={safePage} pages={totalPages} onPage={setPage} />
          )}
        </>
      )}
    </div>
  );
}
