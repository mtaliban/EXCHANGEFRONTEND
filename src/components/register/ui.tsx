'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon';
import s from './register.module.css';

export const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(' ');

/** Chaguo la jumla: thamani (id/code) + jina linaloonekana. */
export interface Opt {
  value: string;
  label: string;
  icon?: string;
}

/* ---------------- Stepper ---------------- */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  const fill = ((current - 1) / (steps.length - 1)) * 80;
  return (
    <div className={s.stepper}>
      <i className={s.stepFill} style={{ width: `${fill}%` }} />
      {steps.map((name, i) => {
        const n = i + 1;
        return (
          <div key={name} className={cx(s.step, n < current && s.stepDone, n === current && s.stepOn)}>
            <span className={s.dot}>{n}</span>
            <span className={s.stepLabel}>{name}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Label ---------------- */
export function Label({ icon, children, note }: { icon?: string; children: React.ReactNode; note?: string }) {
  return (
    <div className={s.label}>
      {icon && <Icon name={icon} size={17} strokeWidth={2} />}
      {children}
      {note && <em>({note})</em>}
    </div>
  );
}

/* ---------------- OptionList (Idara) ---------------- */
export function OptionList({
  options,
  value,
  onChange,
}: {
  options: Opt[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className={s.options} role="radiogroup">
      {options.map((o) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === o.value}
          key={o.value}
          className={cx(s.option, value === o.value && s.optionOn)}
          onClick={() => onChange(o.value)}
        >
          <span className={s.optIcon}><Icon name={o.icon || 'building'} size={16} /></span>
          <span className={s.optText}>{o.label}</span>
          <span className={s.radio} />
        </button>
      ))}
    </div>
  );
}

/* ---------------- Segmented ---------------- */
export function Segmented({
  options,
  value,
  onChange,
  iconSize = 15,
}: {
  options: Opt[];
  value: string | null;
  onChange: (v: string) => void;
  /** Ukubwa wa ikoni ndani ya kitufe (kada inatumia 20). */
  iconSize?: number;
}) {
  return (
    <div className={s.seg} role="radiogroup">
      {options.map((o) => (
        <button
          type="button"
          role="radio"
          aria-checked={value === o.value}
          key={o.value}
          className={cx(s.segBtn, value === o.value && s.segOn)}
          onClick={() => onChange(o.value)}
        >
          {o.icon && <Icon name={o.icon} size={iconSize} strokeWidth={1.9} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Dropdown ---------------- */
export function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  disabledText,
  layout = 'list',
  countLabel,
}: {
  value: string | null;
  onChange: (v: string) => void;
  options: Opt[];
  placeholder: string;
  disabled?: boolean;
  disabledText?: string;
  layout?: 'grid3' | 'grid2' | 'list';
  countLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const list = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())),
    [options, q],
  );
  const current = options.find((o) => o.value === value) || null;

  return (
    <div ref={ref} className={cx(s.dd, open && s.ddOpen, !!current && s.ddFilled, disabled && s.ddDisabled)}>
      <button
        type="button"
        className={s.ddTrigger}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          setQ('');
          setOpen((o) => !o);
        }}
      >
        {current ? (
          <span>{current.label}</span>
        ) : (
          <span className={s.ddPlaceholder}>{disabled ? disabledText : placeholder}</span>
        )}
        <Icon name="chevronDown" size={16} strokeWidth={2} />
      </button>

      {open && (
        <div className={s.ddPanel}>
          <label className={s.search}>
            <Icon name="search" size={15} strokeWidth={2.2} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tafuta..." />
          </label>
          <div className={s.count}>
            {countLabel} <b>{list.length}</b>
            {layout === 'list' && list.length > 6 && ' · shusha chini kuona zaidi'}
          </div>
          {list.length === 0 ? (
            <div className={s.ddEmpty}>Hakuna kinacholingana</div>
          ) : (
            <div className={layout === 'grid3' ? s.grid3 : layout === 'grid2' ? s.grid2 : s.scroll}>
              {list.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  title={o.label}
                  className={cx(s.ddItem, o.value === value && s.ddItemOn)}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- SubjectPicker ---------------- */
export function SubjectPicker({
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
  const labelOf = (code: string) => options.find((o) => o.value === code)?.label || code;

  const toggle = (code: string) => {
    if (value.includes(code)) onChange(value.filter((x) => x !== code));
    else if (!full) onChange([...value, code]);
  };

  const highlight = (text: string) => {
    if (!q.trim()) return text;
    const i = text.toLowerCase().indexOf(q.trim().toLowerCase());
    if (i < 0) return text;
    const L = q.trim().length;
    return (
      <>
        {text.slice(0, i)}
        <mark>{text.slice(i, i + L)}</mark>
        {text.slice(i + L)}
      </>
    );
  };

  return (
    <>
      <div className={s.slots}>
        {Array.from({ length: max }).map((_, i) =>
          value[i] ? (
            <button type="button" key={i} className={cx(s.slot, s.slotFull)} onClick={() => toggle(value[i])} title="Ondoa">
              <span>{i + 1}. {labelOf(value[i])}</span>
              <Icon name="x" size={12} strokeWidth={2.6} />
            </button>
          ) : (
            <div key={i} className={s.slot}><span>Somo la {i + 1}</span></div>
          ),
        )}
      </div>
      <p className={s.slotHint}>
        {full ? `Umechagua masomo ${max}. Bonyeza ✕ kuondoa somo.` : 'Bonyeza somo kwenye orodha kulichagua.'}
      </p>
      <label className={s.search} style={{ background: '#fff', borderColor: '#d1d5db' }}>
        <Icon name="search" size={15} strokeWidth={2.2} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tafuta somo..." />
      </label>
      <div className={s.subList}>
        {list.length === 0 && <div className={s.ddEmpty}>Hakuna somo linalolingana na &quot;{q}&quot;</div>}
        {list.map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              type="button"
              key={o.value}
              className={cx(s.subItem, on && s.subOn, !on && full && s.subDis)}
              onClick={() => toggle(o.value)}
              disabled={!on && full}
            >
              <span>{highlight(o.label)}</span>
              {on && <i>{value.indexOf(o.value) + 1}</i>}
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- ChipSelect (Wilaya) ---------------- */
export function ChipSelect({
  options,
  value,
  onChange,
}: {
  options: Opt[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  return (
    <div className={s.chips}>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          className={cx(s.chip, value.includes(o.value) && s.chipOn)}
          onClick={() => toggle(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
