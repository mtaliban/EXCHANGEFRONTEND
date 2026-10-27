'use client';

import { useEffect, useRef, useState } from 'react';
import { Award, Briefcase, Check, ChevronDown, Sprout, type LucideIcon } from 'lucide-react';

/** Chaguo za muda wa kazi — thamani zinazotumwa kwenye fomu: "1", "2", "3". */
const OPTIONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: '1', label: 'Mwaka 1', icon: Sprout },
  { value: '2', label: 'Miaka 2', icon: Briefcase },
  { value: '3', label: 'Miaka 3 au zaidi', icon: Award },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Dropdown ndogo ya kisasa (badala ya select ya kivinjari):
 * - inafunguka chini ya kisanduku kwa upana ule ule
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
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        ref={buttonRef}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 bg-white text-left transition-colors"
        style={{
          padding: '8px 10px',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          fontSize: 14,
          color: selected ? '#0f172a' : '#6b7280',
        }}
      >
        <span className="inline-flex items-center gap-2 min-w-0">
          {selected && (
            <selected.icon size={16} className="flex-shrink-0" style={{ color: '#1e40af' }} />
          )}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown
          size={16}
          className="flex-shrink-0 text-brand-grey-400 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-30 bg-white border border-brand-grey-200 dark:border-brand-grey-600"
          style={{
            top: 'calc(100% + 4px)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.10)',
            padding: 4,
          }}
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
                className="flex items-center gap-2 cursor-pointer"
                style={{
                  padding: '6px 8px',
                  minHeight: 32,
                  maxHeight: 36,
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: isSelected ? '#eff6ff' : active === i ? '#f3f4f6' : 'transparent',
                  color: isSelected ? '#1e40af' : '#0f172a',
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <o.icon
                  size={16}
                  className="flex-shrink-0"
                  style={{ color: isSelected ? '#1e40af' : '#6b7280' }}
                />
                <span className="flex-1 truncate">{o.label}</span>
                {isSelected && (
                  <Check size={15} className="flex-shrink-0" style={{ color: '#1e40af' }} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
