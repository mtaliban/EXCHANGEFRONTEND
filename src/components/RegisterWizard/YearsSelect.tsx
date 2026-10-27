'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/** Chaguo za muda wa kazi — thamani zinazotumwa kwenye fomu: "1", "2", "3". */
const OPTIONS: { value: string; label: string }[] = [
  { value: '1', label: 'Mwaka 1' },
  { value: '2', label: 'Miaka 2' },
  { value: '3', label: 'Miaka 3 au zaidi' },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Dropdown yetu (badala ya select ya kivinjari).
 * - orodha iko kwenye mpangilio wa kawaida (position: static, hakuna z-index),
 *   hivyo inashuka chini na kusukuma vitufe vya "Najisajili"/"Rudi" chini
 *   badala ya kuifunika.
 * - kufunga kwa Esc au kubonyeza nje
 * - kibodi: mishale ya juu/chini + Enter
 */
export default function YearsSelect({ value, onChange, placeholder = 'Chagua miaka ya kazi' }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedIndex = OPTIONS.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? OPTIONS[selectedIndex] : null;

  // Funga kwa Esc au kubonyeza nje ya kisanduku
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onDocKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onDocKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onDocKeyDown);
    };
  }, [open]);

  function openList() {
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function choose(index: number) {
    onChange(OPTIONS[index].value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onButtonKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (open) { e.preventDefault(); setOpen(false); }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { openList(); return; }
      setActive((a) =>
        e.key === 'ArrowDown' ? Math.min(OPTIONS.length - 1, a + 1) : Math.max(0, a - 1)
      );
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) openList();
      else choose(active);
    }
  }

  return (
    <div ref={rootRef}>
      {/* Kisanduku kimefungwa — kimo na ukubwa wa herufi sawa na "Chagua Shule (hiari)"
          (classes zilezile: .input + text-sm) */}
      <button
        type="button"
        ref={buttonRef}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="input text-sm bg-white flex items-center justify-between gap-2 text-left"
        style={{ color: selected ? '#0f172a' : '#6b7280' }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          size={16}
          className="flex-shrink-0 text-brand-grey-400 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="bg-white border border-brand-grey-200 dark:border-brand-grey-600 list-none m-0"
          style={{ marginTop: 4, borderRadius: 10, padding: 4 }}
        >
          {OPTIONS.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className="cursor-pointer"
                style={{
                  height: 36,
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 14,
                  /* Chaguo lililochaguliwa: highlight ya bluu iliyopauka (#eff6ff) na
                   * maandishi ya bluu — si bloksi nene ya bluu iliyokolea. Hakuna tiki. */
                  backgroundColor: isSelected ? '#eff6ff' : active === i ? '#f8fafc' : 'transparent',
                  color: isSelected ? '#1e40af' : '#0f172a',
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <span className="block truncate">{o.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
