"use client";

// Hariri Wasifu — mtindo ule ule wa Wasifu (E): sehemu A, B, C.
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  getMyProfile, updateProfile, getRegions, getDistricts, getFacilities, getCadres, getSubjects,
  getMe, bustGetCache, extractErrorMessage,
  type Region, type District, type Facility, type Cadre, type Subject,
} from "@/lib/api";
import AppIcon from "@/components/app/AppIcon";
import { InlineDropdown, cx, type Opt } from "@/components/app/dashboard";
import s from "@/components/app/app.module.css";

const MAX_MALENGO = 3;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={s.tb}>
      <div className={s.th}>{title}</div>
      <div className={s.eBody}>{children}</div>
    </div>
  );
}

const shortCadre = (name: string) => {
  if (/Msingi/i.test(name)) return "Msingi";
  if (/Sekondari/i.test(name)) return "Sekondari";
  if (/Pekee/i.test(name)) return "Pekee";
  return name.replace(/^Mwalimu wa /i, "");
};

type Goal = { region_id: number; region_name: string; district_id: number | null; district_name: string | null };

export default function HaririWasifu() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [jina, setJina] = useState("");
  const [simu, setSimu] = useState("");
  const [simu2, setSimu2] = useState("");
  const [cadreCode, setCadreCode] = useState("");
  const [masomo, setMasomo] = useState<string[]>([]);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [facilityId, setFacilityId] = useState<string | null>(null);
  const [malengo, setMalengo] = useState<Goal[]>([]);
  const [gRegion, setGRegion] = useState<string | null>(null);
  const [gDistrict, setGDistrict] = useState<string | null>(null);

  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [gDistricts, setGDistricts] = useState<District[]>([]);
  const [cadres, setCadres] = useState<Cadre[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const category = (profile?.category || "education") as "health" | "education";
  const dept = category === "education" ? "Elimu" : category === "health" ? "Afya" : category;

  const selectedCadre = cadres.find((c) => c.code === cadreCode);
  const level: "Primary" | "Secondary" | undefined =
    selectedCadre?.level === "Secondary" ? "Secondary" : selectedCadre?.level === "Primary" ? "Primary" : undefined;

  /* ── Pakia wasifu ── */
  useEffect(() => {
    getMyProfile()
      .then((p: any) => {
        setProfile(p);
        setJina(p.full_name || "");
        setSimu(p.phone_primary || "");
        setSimu2(p.phone_alt || "");
        setCadreCode(p.cadre_code || "");
        setMasomo(p.subjects || []);
        const st = p.current_station || {};
        setRegionId(st.region_id ? String(st.region_id) : null);
        setDistrictId(st.district_id ? String(st.district_id) : null);
        setFacilityId(st.facility_id ? String(st.facility_id) : null);
        setMalengo(
          (p.desired_destinations || []).map((d: any) => ({
            region_id: d.region_id,
            region_name: d.region_name,
            district_id: d.district_id ?? null,
            district_name: d.district_name ?? null,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ── Mikoa + kada ── */
  useEffect(() => {
    getRegions().then(setRegions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!profile) return;
    getCadres(category).then(setCadres).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  /* ── Masomo kwa ngazi ya kada ── */
  useEffect(() => {
    if (!level) { setSubjects([]); return; }
    getSubjects(level).then(setSubjects).catch(() => setSubjects([]));
  }, [level]);

  /* ── Wilaya / vituo vya kituo cha sasa ── */
  useEffect(() => {
    if (!regionId) { setDistricts([]); return; }
    getDistricts(Number(regionId)).then(setDistricts).catch(() => setDistricts([]));
  }, [regionId]);

  useEffect(() => {
    if (!districtId) { setFacilities([]); return; }
    getFacilities(Number(districtId), category, level).then(setFacilities).catch(() => setFacilities([]));
  }, [districtId, category, level]);

  /* ── Wilaya za lengo jipya ── */
  useEffect(() => {
    if (!gRegion) { setGDistricts([]); return; }
    getDistricts(Number(gRegion)).then(setGDistricts).catch(() => setGDistricts([]));
  }, [gRegion]);

  const regionOpts: Opt[] = useMemo(() => regions.map((r) => ({ value: String(r.id), label: r.name })), [regions]);
  const districtOpts: Opt[] = useMemo(() => districts.map((d) => ({ value: String(d.id), label: d.name })), [districts]);
  const facilityOpts: Opt[] = useMemo(
    () => facilities.map((f: any) => ({ value: String(f.id ?? f.code), label: f.name })),
    [facilities]
  );
  const gDistrictOpts: Opt[] = useMemo(() => gDistricts.map((d) => ({ value: String(d.id), label: d.name })), [gDistricts]);

  function toggleSubject(code: string) {
    setMasomo((m) => (m.includes(code) ? m.filter((x) => x !== code) : [...m, code]));
  }

  function addGoal() {
    if (!gRegion) return;
    const r = regions.find((x) => String(x.id) === gRegion);
    if (!r) return;
    const d = gDistrict ? gDistricts.find((x) => String(x.id) === gDistrict) : null;
    if (malengo.length >= MAX_MALENGO) return;
    setMalengo((g) => [
      ...g,
      { region_id: r.id, region_name: r.name, district_id: d?.id ?? null, district_name: d?.name ?? null },
    ]);
    setGRegion(null);
    setGDistrict(null);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!jina.trim()) { setError("Jina kamili linahitajika."); return; }

    setSaving(true);
    try {
      const region = regions.find((r) => String(r.id) === regionId);
      const district = districts.find((d) => String(d.id) === districtId);
      const facility = facilities.find((f: any) => String(f.id ?? f.code) === facilityId);

      await updateProfile({
        full_name: jina.trim(),
        phone_primary: simu.trim() || undefined,
        phone_alt: simu2.trim() || null,
        cadre_code: cadreCode || undefined,
        subjects: level ? masomo : [],
        current_station: region && district
          ? {
              region_id: region.id,
              region_name: region.name,
              district_id: district.id,
              district_name: district.name,
              facility_id: facility ? String((facility as any).id ?? (facility as any).code) : null,
              facility_name: (facility as any)?.name ?? null,
              facility_type: (facility as any)?.type ?? null,
            }
          : undefined,
        desired_destinations: malengo.map((g) => ({
          region_id: g.region_id,
          region_name: g.region_name,
          district_id: g.district_id,
          district_name: g.district_name,
          facility_id: null,
          facility_name: null,
          notes: null,
        })),
      });

      bustGetCache();
      getMe(true).then((me: any) => useAuth.getState().setUser(me)).catch(() => {});
      router.push("/wasifu");
    } catch (err: any) {
      setError(extractErrorMessage(err, "Imeshindikana kuhifadhi. Jaribu tena."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={s.wrap}>
        <div className={s.loading}><span className={s.spin} /> Inapakia...</div>
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <form onSubmit={save}>
        <h1 className={s.pTitleH} style={{ marginTop: 16 }}>Hariri Wasifu</h1>
        <p className={s.pageSub} style={{ marginTop: 4 }}>Badilisha taarifa zako, kisha bofya Hifadhi.</p>

        {error && (
          <div className={s.banner}>
            <AppIcon name="alert" size={14} sw={2} />
            <span>{error}</span>
          </div>
        )}

        <Section title="A. Utambulisho">
          <p className={s.eLabel}>Jina Kamili</p>
          <label className={s.input}>
            <input value={jina} onChange={(e) => setJina(e.target.value)} required />
          </label>

          <div className={s.eGrid}>
            <div>
              <p className={s.eLabel}>Namba ya Simu</p>
              <label className={s.input}>
                <AppIcon name="phone" size={14} />
                <input type="tel" inputMode="tel" value={simu} onChange={(e) => setSimu(e.target.value)} required />
              </label>
            </div>
            <div>
              <p className={s.eLabel}>Simu ya pili <em>(hiari)</em></p>
              <label className={s.input}>
                <AppIcon name="phone" size={14} />
                <input type="tel" inputMode="tel" value={simu2} onChange={(e) => setSimu2(e.target.value)} placeholder="07XX XXX XXX" />
              </label>
            </div>
          </div>

          <p className={s.eLabel}>Idara</p>
          <div className={s.eLocked}>{dept}</div>

          <p className={s.eLabel}>Kada</p>
          {cadres.length > 0 && cadres.length <= 3 ? (
            <div className={s.eSeg}>
              {cadres.map((c) => (
                <button
                  type="button"
                  key={c.code}
                  className={cx(cadreCode === c.code && s.eSegOn)}
                  onClick={() => { setCadreCode(c.code); setMasomo([]); }}
                >
                  {shortCadre(c.display_name)}
                </button>
              ))}
            </div>
          ) : (
            <InlineDropdown
              icon="kit"
              value={cadreCode || null}
              allLabel="Chagua kada"
              options={cadres.map((c) => ({ value: c.code, label: c.display_name }))}
              layout="scroll"
              countLabel="Kada"
              onChange={(v) => { setCadreCode(v || ""); setMasomo([]); }}
            />
          )}

          {level && subjects.length > 0 && (
            <>
              <p className={s.eLabel}>Masomo <em>(chagua unayofundisha)</em></p>
              <div className={s.chips}>
                {subjects.map((sub) => (
                  <button
                    type="button"
                    key={sub.code}
                    className={cx(s.chip, masomo.includes(sub.code) && s.chipOn)}
                    onClick={() => toggleSubject(sub.code)}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </Section>

        <Section title="B. Kituo cha Sasa">
          <p className={s.eLabel}>Mkoa</p>
          <InlineDropdown
            icon="map" value={regionId} allLabel="Chagua mkoa" options={regionOpts} layout="grid3" countLabel="Mikoa"
            onChange={(v) => { setRegionId(v); setDistrictId(null); setFacilityId(null); }}
          />
          <p className={s.eLabel}>Wilaya / Halmashauri</p>
          <InlineDropdown
            icon="pin" value={districtId} allLabel="Chagua wilaya" options={districtOpts} layout="grid2" countLabel="Wilaya"
            disabled={!regionId} disabledText="Chagua mkoa kwanza"
            onChange={(v) => { setDistrictId(v); setFacilityId(null); }}
          />
          <p className={s.eLabel}>Kituo / Shule</p>
          <InlineDropdown
            icon="school" value={facilityId} allLabel="Chagua kituo" options={facilityOpts} layout="scroll" countLabel="Vituo"
            disabled={!districtId} disabledText="Chagua wilaya kwanza"
            onChange={setFacilityId}
          />
        </Section>

        <Section title="C. Ninataka Kwenda">
          {malengo.map((g, i) => (
            <div className={s.eGoal} key={`${g.region_id}-${i}`}>
              <span className={s.eNum}>{i + 1}</span>
              <div className={s.w}>
                <b>{g.region_name}</b>
                {g.district_name && <span>{g.district_name}</span>}
              </div>
              <button
                type="button"
                className={s.eRemove}
                onClick={() => setMalengo((x) => x.filter((_, j) => j !== i))}
              >
                <AppIcon name="x" size={13} /> Ondoa
              </button>
            </div>
          ))}

          {malengo.length < MAX_MALENGO ? (
            <div className={s.eAdd}>
              <p className={s.eAddTitle}>Ongeza eneo <em>(hadi {MAX_MALENGO})</em></p>
              <InlineDropdown
                icon="map" value={gRegion} allLabel="Chagua mkoa" options={regionOpts} layout="grid3" countLabel="Mikoa"
                onChange={(v) => { setGRegion(v); setGDistrict(null); }}
              />
              <div style={{ height: 8 }} />
              <InlineDropdown
                icon="pin" value={gDistrict} allLabel="Wilaya yoyote" options={gDistrictOpts} layout="grid2" countLabel="Wilaya"
                disabled={!gRegion} disabledText="Chagua mkoa kwanza"
                onChange={setGDistrict}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button type="button" className={s.btnOut} disabled={!gRegion} onClick={addGoal}>
                  <AppIcon name="plus" size={14} sw={2} /> Ongeza
                </button>
              </div>
            </div>
          ) : (
            <p className={s.hint}>Umefikia idadi ya juu ya maeneo ({MAX_MALENGO}).</p>
          )}
        </Section>

        <div className={s.eFoot}>
          <button type="button" className={s.btnOut} onClick={() => router.push("/wasifu")}>
            Ghairi
          </button>
          <button type="submit" className={cx(s.pEdit, s.pSaveSolid)} disabled={saving}>
            {saving ? "Inahifadhi..." : "Hifadhi Mabadiliko"}
          </button>
        </div>
      </form>
    </div>
  );
}
