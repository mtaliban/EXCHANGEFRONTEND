'use client';

import { useMemo, useState } from 'react';
import Icon from './Icon';
import s from './register.module.css';

export const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(' ');

/** Chaguo la jumla: thamani (id/code) + jina linaloonekana. */
export interface Opt {
  value: string;
  label: string;
  icon?: string;
  /** Kifupi kinachoonekana kwenye beji (mf. ANO, VEO). */
  code?: string;
  /** Aina inayoonekana kwenye beji (mf. Zahanati, Kata, Kijiji). */
  aina?: string;
}

/* ---------------- Stepper ---------------- */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  const n = steps.length;
  const fill = n > 1 ? ((current - 1) / (n - 1)) * (100 - 100 / n) : 0;
  return (
    <div className={s.stepper} style={{ ['--n' as string]: n } as React.CSSProperties}>
      <i className={s.stepFill} style={{ width: `${fill}%` }} />
      {steps.map((name, i) => {
        const k = i + 1;
        return (
          <div key={name} className={cx(s.step, k < current && s.stepDone, k === current && s.stepOn)}>
            <span className={s.dot}>{k}</span>
            <span className={s.stepLabel}>{name}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Label (ikoni ndani ya mraba wa bluu hafifu) ---------------- */
export function Label({
  icon,
  children,
  note,
  err,
}: {
  icon?: string;
  children: React.ReactNode;
  note?: string;
  /** Kosa la hatua: mstari mmoja mekundu chini ya kichwa, ikoni ikiwa nyekundu. */
  err?: string | null;
}) {
  return (
    <>
      <div className={cx(s.label, err && s.labelNo)}>
        {icon && <span className={cx(s.lblIc, err && s.lblIcNo)}><Icon name={icon} size={16} strokeWidth={2.1} /></span>}
        {children}
        {note && <em className={note === 'hiari' ? s.noteBold : undefined}>({note})</em>}
      </div>
      {err && <Kosa>{err}</Kosa>}
    </>
  );
}

/* ---------- Ujumbe wa kosa (mtu akibonyeza Endelea bila kujaza) ---------- */
export function Kosa({ children }: { children: React.ReactNode }) {
  return (
    <p className={s.kosa} data-kosa role="alert">
      <Icon name="alertCircle" size={14} strokeWidth={2.4} /> <span>{children}</span>
    </p>
  );
}

/* ---------------- Namba ya simu: kisanduku + hali (ngao / !) ---------------- */
export type HaliNamba = null | 'si_sahihi' | 'huru' | 'imetumika';

export function PhoneField({
  value,
  onChange,
  onBlur,
  placeholder,
  hali,
  checking,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder: string;
  hali: HaliNamba;
  checking?: boolean;
}) {
  return (
    <>
      <div className={cx(s.phBox, hali === 'huru' && s.phOk, (hali === 'si_sahihi' || hali === 'imetumika') && s.phNo)}>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          type="tel"
          inputMode="tel"
        />
        <span className={cx(s.phIc, hali === 'huru' ? s.phIcOk : (hali === 'si_sahihi' || hali === 'imetumika') ? s.phIcNo : '')}>
          {checking ? (
            <span className={s.spin} />
          ) : hali === 'huru' ? (
            <Icon name="shieldOk" size={15} strokeWidth={2.4} />
          ) : hali === 'si_sahihi' || hali === 'imetumika' ? (
            <Icon name="alertCircle" size={15} strokeWidth={2.4} />
          ) : null}
        </span>
      </div>
      {hali === 'si_sahihi' && <p className={cx(s.phMsg, s.phMsgNo)} data-kosa>Namba si sahihi</p>}
      {hali === 'huru' && <p className={cx(s.phMsg, s.phMsgOk)}>Namba hii ipo huru</p>}
      {hali === 'imetumika' && (
        <p className={cx(s.phMsg, s.phMsgNo)} data-kosa>
          Namba hii imeshasajiliwa. <a href="/login">Ingia hapa</a>
        </p>
      )}
    </>
  );
}

/* ---------------- Orodha ya idara (kichwa, duara kushoto, ikoni kulia) ---------------- */
export function IdaraList({
  title,
  options,
  value,
  onChange,
  branchOf,
  branchValue,
  onBranch,
  kada,
}: {
  title: string;
  options: Opt[];
  value: string | null;
  onChange: (v: string) => void;
  /** idara ipi ina tawi (mf. afya → wizara, elimu → ngazi) */
  branchOf: Record<string, Opt[]>;
  branchValue: string | null;
  onBranch: (v: string) => void;
  /** Umma: kada zinafunguka ndani ya idara iliyochaguliwa, kama tawi. */
  kada?: { options: Opt[]; value: string | null; onChange: (v: string) => void };
}) {
  return (
    <div className={s.idList} role="radiogroup">
      <div className={s.idHead}>
        <span>{title}</span>
        <span>{options.length}</span>
      </div>
      {options.map((o) => {
        const on = value === o.value;
        const sub = on ? branchOf[o.value] : undefined;
        return (
          <div key={o.value} className={s.idItem}>
            <button
              type="button"
              role="radio"
              aria-checked={on}
              className={cx(s.idRow, on && s.idOn)}
              onClick={() => onChange(o.value)}
            >
              <i className={s.idRadio} />
              <span className={s.idName}>{o.label}</span>
              <span className={s.idIc}><Icon name={o.icon || 'building'} size={16} strokeWidth={2} /></span>
            </button>
            {on && kada && kada.options.length > 0 && (
              <div className={s.idBranch} role="radiogroup">
                {kada.options.map((k) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={kada.value === k.value}
                    key={k.value}
                    className={cx(s.idSub, kada.value === k.value && s.idOn)}
                    onClick={() => kada.onChange(k.value)}
                  >
                    <i className={s.idRadio} />
                    <span className={s.idName}>{k.label}</span>
                    {k.code && (
                      <b className={kada.value === k.value ? s.kdBadgeOn : s.kdBadge}>
                        {k.code.replace(/_/g, ' ')}
                      </b>
                    )}
                  </button>
                ))}
              </div>
            )}
            {sub && sub.length > 0 && (
              <div className={s.idBranch} role="radiogroup">
                {sub.map((b) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={branchValue === b.value}
                    key={b.value}
                    className={cx(s.idSub, branchValue === b.value && s.idOn)}
                    onClick={() => onBranch(b.value)}
                  >
                    <i className={s.idRadio} />
                    <span className={s.idName}>{b.label}</span>
                    <span className={s.idIc}><Icon name={b.icon || 'building'} size={16} strokeWidth={2} /></span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Jedwali la muhtasari ---------------- */
export function Summary({ rows }: { rows: { k: string; icon: string; v: string }[] }) {
  return (
    <div className={s.sum}>
      {rows.map((r) => (
        <div key={r.k} className={s.sumRow}>
          <span className={s.sumK}>{r.k}</span>
          <span className={s.sumV}>
            <span className={s.sumIc}><Icon name={r.icon} size={13} strokeWidth={2} /></span>
            {r.v}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Kada (tafuta jina au kifupi) ---------------- */
export function KadaPicker({
  group,
  options,
  value,
  onChange,
  mfano,
}: {
  group: string;
  options: Opt[];
  value: string | null;
  onChange: (v: string) => void;
  mfano: string;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(!value);
  const qq = q.trim().toLowerCase();
  const list = options.filter(
    (o) => o.label.toLowerCase().includes(qq) || (o.code ?? '').toLowerCase().includes(qq),
  );
  const current = options.find((o) => o.value === value) || null;
  /* Kifupi kirefu: `_` inakuwa nafasi, kisha kinakatwa kwa "…" */
  const codeLabel = (c: string) => c.replace(/_/g, ' ');

  /* Kada ikiwa imechaguliwa, orodha inajifunga kuwa kadi moja */
  if (current && !open) {
    return (
      <div className={s.plCard}>
        <span className={s.plCardIc}><Icon name="idBadge" size={15} strokeWidth={2} /></span>
        <div className={s.kdPickBody}>
          <b>{current.label}</b>
          {current.code && <span className={s.kdBadgeOn}>{codeLabel(current.code)}</span>}
        </div>
        <button type="button" onClick={() => setOpen(true)}>Badilisha</button>
      </div>
    );
  }

  return (
    <>
      <label className={cx(s.msSearch, q && s.msSearchOn)}>
        <Icon name="search" size={15} strokeWidth={2.2} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Tafuta kada au kifupi (mf. ${mfano})…`} />
      </label>
      <div className={cx(s.msWrap, list.length > 5 && s.msFade)}>
        <div className={s.msList}>
          <div className={s.msHead}>
            <span>KADA · {group.toUpperCase()}</span>
            <span>{list.length}</span>
          </div>
          <div className={s.msScroll} role="radiogroup">
            {list.length === 0 && <div className={s.msEmpty}>Hakuna kada inayolingana na &quot;{q}&quot;</div>}
            {list.map((o) => (
              <button
                type="button"
                role="radio"
                aria-checked={value === o.value}
                key={o.value}
                className={cx(s.kdRow, value === o.value && s.kdOn)}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                <i className={s.idRadio} />
                <span className={s.kdName}>{o.label}</span>
                {o.code && <b className={s.kdCode}>{codeLabel(o.code)}</b>}
              </button>
            ))}
          </div>
        </div>
      </div>
      {list.length > 5 && (
        <p className={s.msMore}>
          <Icon name="chevronDown" size={13} strokeWidth={2.4} /> Shusha ndani ya orodha kuona kada zote {options.length}
        </p>
      )}
    </>
  );
}

/* ---------------- Masomo (nafasi N + tafuta + orodha) ---------------- */
export function MasomoPicker({
  options,
  value,
  onChange,
  max,
}: {
  options: Opt[];
  value: string[];
  onChange: (v: string[]) => void;
  max: number;
}) {
  const [q, setQ] = useState('');
  const full = value.length >= max;
  const list = options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()));
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label || v;

  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else if (!full) onChange([...value, v]);
  };

  const MAJINA = ['Somo la kwanza', 'Somo la pili', 'Somo la tatu'];

  return (
    <>
      <div className={s.msSlots}>
        {Array.from({ length: max }).map((_, i) =>
          value[i] ? (
            <div key={i} className={cx(s.msSlot, s.msSlotOn)}>
              <b>{i + 1}</b>
              <span>{labelOf(value[i])}</span>
              <button type="button" aria-label="Ondoa somo" onClick={() => toggle(value[i])}>
                <Icon name="x" size={12} strokeWidth={2.8} />
              </button>
            </div>
          ) : (
            <div key={i} className={s.msSlot}>
              {i + 1}. {MAJINA[i] ?? `Somo la ${i + 1}`}
            </div>
          ),
        )}
      </div>
      <label className={cx(s.msSearch, q && s.msSearchOn)}>
        <Icon name="search" size={15} strokeWidth={2.2} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tafuta somo..." />
      </label>
      <div className={cx(s.msWrap, list.length > 5 && s.msFade)}>
        <div className={s.msList}>
          <div className={s.msHead}>
            <span>MASOMO · {list.length}</span>
            <span>
              UMECHAGUA <b>{value.length}</b>/{max}
            </span>
          </div>
          <div className={s.msScroll}>
            {list.length === 0 && <div className={s.msEmpty}>Hakuna somo linaloitwa &quot;{q}&quot;</div>}
            {list.map((o) => {
              const p = value.indexOf(o.value);
              const on = p >= 0;
              return (
                <button
                  type="button"
                  key={o.value}
                  className={cx(s.msRow, on && s.msOn, !on && full && s.msDis)}
                  onClick={() => toggle(o.value)}
                  disabled={!on && full}
                >
                  <i className={s.msBox}>{on ? p + 1 : ''}</i>
                  <span>{o.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {list.length > 5 && (
        <p className={s.msMore}>
          <Icon name="chevronDown" size={13} strokeWidth={2.4} /> Shusha ndani ya orodha kuona masomo {options.length}
        </p>
      )}
    </>
  );
}

/* ---------------- Miaka ya kazi ---------------- */
export function YearsBand({
  options,
  value,
  onChange,
}: {
  options: Opt[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className={s.yr} role="radiogroup">
      {options.map((o) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === o.value}
          key={o.value}
          className={cx(s.yrBtn, value === o.value && s.yrOn)}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* =========================================================
   Mahali: Mkoa → Wilaya → ngazi ya tatu
   ========================================================= */

/** Vitufe vya hatua ndogo: Mkoa → Wilaya → Kituo/Shule/Ofisi/Hospitali */
export function Progress({ items, at }: { items: { l: string; i: string }[]; at: number }) {
  return (
    <div className={s.pg}>
      {items.map((x, n) => (
        <span key={x.l} className={cx(s.pgItem, n < at && s.pgDone, n === at && s.pgOn)}>
          <Icon name={x.i} size={15} strokeWidth={2.1} />
          {x.l}
        </span>
      ))}
    </div>
  );
}

export function ListHead({ k, n }: { k: string; n: number }) {
  return (
    <div className={s.plHead}>
      <span>{k}</span>
      <b>{n}</b>
    </div>
  );
}

export function Chosen({ icon, text, onChange }: { icon: string; text: string; onChange: () => void }) {
  return (
    <div className={s.plCard}>
      <span className={s.plCardIc}><Icon name={icon} size={15} strokeWidth={2} /></span>
      <b>{text}</b>
      <button type="button" onClick={onChange}>Badilisha</button>
    </div>
  );
}

/** Gridi ya mikoa (safu 3) */
export function RegionGrid({
  options,
  value,
  onPick,
  hidden,
}: {
  options: Opt[];
  value: string | null;
  onPick: (v: string) => void;
  hidden?: string[];
}) {
  const list = options.filter((o) => !hidden?.includes(o.value));
  return (
    <>
      <ListHead k="MIKOA" n={list.length} />
      <div className={s.mkGrid}>
        {list.map((o) => (
          <button
            type="button"
            key={o.value}
            className={cx(s.mkBtn, value === o.value && s.mkOn)}
            onClick={() => onPick(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </>
  );
}

/** Vitufe vya mraba (wilaya / wilaya za lengo) */
export function SquareChips({
  options,
  value,
  onToggle,
  anyLabel,
  anyOn,
  onAny,
}: {
  options: Opt[];
  value: string[];
  onToggle: (v: string) => void;
  anyLabel?: string;
  anyOn?: boolean;
  onAny?: () => void;
}) {
  return (
    <div className={s.sqWrap}>
      {anyLabel && (
        <button type="button" className={cx(s.sq, s.sqAny, anyOn && s.sqOn)} onClick={onAny}>
          {anyLabel}
        </button>
      )}
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          className={cx(s.sq, value.includes(o.value) && s.sqOn)}
          onClick={() => onToggle(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Orodha ya ngazi ya tatu: tafuta + scroll ndani + beji ya aina (+ Ruka kama ni hiari) */
export function ThirdList({
  head,
  options,
  value,
  onToggle,
  placeholder,
  skipLabel,
  multi,
  loading,
  onClose,
}: {
  head: string;
  options: Opt[];
  value: string[];
  onToggle: (v: string) => void;
  placeholder: string;
  skipLabel?: string;
  multi?: boolean;
  loading?: boolean;
  /** Orodha ya hiari: kitufe cha "× Funga" kinachoirudisha kwenye kitufe cha + Chagua */
  onClose?: () => void;
}) {
  const [q, setQ] = useState('');
  const list = options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()));
  const many = list.length > 4;
  return (
    <>
      <label className={cx(s.msSearch, q && s.msSearchOn)}>
        <Icon name="search" size={15} strokeWidth={2.2} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
      </label>
      {loading ? (
        <div className={s.loadRow}><span className={s.spin} /> Inapakia...</div>
      ) : (
        <div className={cx(s.msWrap, many && s.msFade)}>
          <div className={s.msList}>
            <div className={s.msHead}>
              <span>{head}</span>
              {onClose ? (
                <button type="button" className={s.msClose} onClick={onClose}>× Ghairi</button>
              ) : (
                <b>{list.length}</b>
              )}
            </div>
            <div className={s.msScroll}>
              {skipLabel && !q && (
                <button
                  type="button"
                  role="radio"
                  aria-checked={value.length === 0}
                  className={cx(s.kdRow, value.length === 0 && s.kdOnSkip)}
                  onClick={() => onToggle('')}
                >
                  <i className={s.idRadio} />
                  <span className={s.kdName}>{skipLabel}</span>
                </button>
              )}
              {list.length === 0 && <div className={s.msEmpty}>Hakuna kinacholingana na &quot;{q}&quot;</div>}
              {list.map((o) => {
                const on = value.includes(o.value);
                return (
                  <button
                    type="button"
                    key={o.value}
                    role={multi ? 'checkbox' : 'radio'}
                    aria-checked={on}
                    className={cx(s.kdRow, on && s.kdOn)}
                    onClick={() => onToggle(o.value)}
                  >
                    <i className={s.idRadio} />
                    <span className={s.kdName}>{o.label}</span>
                    {o.aina && <b className={s.kdCode}>{o.aina}</b>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {many && (
        <p className={s.msMore}>
          <Icon name="chevronDown" size={13} strokeWidth={2.4} /> Shusha ndani ya orodha kuona zote
        </p>
      )}
    </>
  );
}
