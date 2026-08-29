'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { Facility } from '@/lib/api';

interface Props {
  facilities: Facility[];
  value: string;
  onChange: (id: string, name: string | null) => void;
  placeholder?: string;
  required?: boolean;
  loading?: boolean;
}

/**
 * HospitalSearch — input ya kutafuta hospitali kwa jina.
 * Inafilter orodha kwa herufi za kwanza na inaonyesha matokeo
 * chini ya input. Inafaa kwa Wizara ya Afya ambapo hospitali
 * ni nyingi kwenye dropdown ya kawaida.
 */
export default function HospitalSearch({ facilities, value, onChange, placeholder = 'Tafuta hospitali kwa jina...', required, loading }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = value ? facilities.find((f: any) => String(f.id || f.code) === value) : null;
  const displayText = selected ? `${selected.name}${(selected as any).type ? ` (${(selected as any).type})` : ''}${(selected as any).district ? ` — ${(selected as any).district}` : ''}` : '';

  const filtered = query.trim()
    ? facilities.filter((f: any) => {
        const q = query.toLowerCase();
        const name = (f.name || '').toLowerCase();
        const type = ((f as any).type || '').toLowerCase();
        const district = ((f as any).district || '').toLowerCase();
        return name.includes(q) || type.includes(q) || district.includes(q);
      }).slice(0, 50)
    : facilities.slice(0, 30);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightIdx >= 0 && filtered[highlightIdx]) {
      e.preventDefault();
      select(filtered[highlightIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function select(f: any) {
    onChange(String(f.id || f.code), f.name || null);
    setQuery('');
    setOpen(false);
    setHighlightIdx(-1);
  }

  function clear() {
    onChange('', null);
    setQuery('');
    setHighlightIdx(-1);
  }

  return (
    <div ref={wrapperRef} className="relative">
      {selected ? (
        /* Selected state — show badge with clear button */
        <div className="input flex items-center gap-2 bg-brand-blue-50 border-brand-blue-200">
          <Search size={14} className="text-brand-blue flex-shrink-0" />
          <span className="text-sm text-brand-grey-900 font-medium truncate flex-1">{displayText}</span>
          <button type="button" onClick={clear} className="text-brand-grey-400 hover:text-brand-red transition p-0.5">
            <X size={14} />
          </button>
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey-400" />
          <input
            ref={inputRef}
            className="input pl-9 pr-3"
            placeholder={loading ? 'Inapakia hospitali...' : placeholder}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setHighlightIdx(-1); setOpen(true); }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            required={required && !value}
            autoComplete="off"
          />
        </div>
      )}

      {/* Dropdown results */}
      {open && !selected && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-brand-grey-200 rounded-xl shadow-lg">
          {loading ? (
            <div className="px-3 py-4 text-center text-sm text-brand-grey-400">Inapakia hospitali...</div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-brand-grey-400">
              {query ? `Hakuna hospitali zinazolingana na "${query}"` : 'Hakuna hospitali kwenye mkoa huu'}
            </div>
          ) : (
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold text-brand-grey-400 uppercase tracking-wide border-b border-brand-grey-100">
                {query ? `${filtered.length} matokeo` : `Hospitali ${filtered.length}${facilities.length > 30 ? ` kati ya ${facilities.length}` : ''}`}
              </div>
              {filtered.map((f: any) => {
                const isSelected = String(f.id || f.code) === value;
                const idx = filtered.indexOf(f);
                return (
                  <button
                    key={f.id || f.code}
                    type="button"
                    onClick={() => select(f)}
                    onMouseEnter={() => setHighlightIdx(idx)}
                    className={`w-full text-left px-3 py-2.5 text-sm transition border-b border-brand-grey-50 last:border-0 ${
                      isSelected ? 'bg-brand-blue-50 text-brand-blue font-semibold' :
                      idx === highlightIdx ? 'bg-brand-grey-50' : 'hover:bg-brand-grey-50'
                    }`}
                  >
                    <div className="font-medium text-brand-grey-900 truncate">{f.name}</div>
                    <div className="text-[11px] text-brand-grey-500 flex items-center gap-1.5 mt-0.5">
                      {f.type && <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-brand-grey-100 text-brand-grey-600 font-medium">{f.type}</span>}
                      {f.district && <span>{f.district}</span>}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
