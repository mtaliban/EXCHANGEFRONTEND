'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Download, X, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { adminImportUsers, adminImportTemplate, extractErrorMessage } from '@/lib/api';
import { useT } from '@/lib/i18n';

type Props = {
  onClose: () => void;
  onImported: (result: { created: number; skipped: number; errors: any[] }) => void;
};

const CATEGORIES = [
  { value: 'education', label: 'Elimu' },
  { value: 'health', label: 'Afya' },
  { value: 'service', label: 'Utumishi' },
];

export default function BulkImportModal({ onClose, onImported }: Props) {
  const t = useT();
  const [category, setCategory] = useState('education');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: any[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    if (!f.name.endsWith('.xlsx')) {
      alert('Tafadhali tumia faili ya Excel (.xlsx)');
      return;
    }
    setFile(f);
    setResult(null);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] || null);
  }, [handleFile]);

  async function doImport() {
    if (!file) return;
    setBusy(true);
    try {
      const r = await adminImportUsers(file, category);
      setResult(r);
      if (r.created > 0) onImported(r);
    } catch (e: any) {
      setResult({ created: 0, skipped: 0, errors: [{ row: 0, name: '', error: extractErrorMessage(e, 'Import failed') }] });
    } finally {
      setBusy(false);
    }
  }

  async function downloadTemplate() {
    try {
      const blob = await adminImportTemplate(category);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${category}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Imeshindwa kupakua template');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-brand-grey-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl border border-brand-grey-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-grey-100">
          <h2 className="font-semibold text-sm text-brand-grey-900">
            Ongeza Watumiaji kwa Excel
          </h2>
          <button onClick={onClose} className="text-brand-grey-400 hover:text-brand-grey-600 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 1. Chagua Idara */}
          <div>
            <label className="text-xs font-bold text-brand-grey-600 mb-2 block">Chagua Idara</label>
            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.value} onClick={() => { setCategory(c.value); setFile(null); setResult(null); }}
                  className={`px-4 py-1.5 rounded-lg border text-xs font-semibold transition ${
                    category === c.value
                      ? 'border-brand-blue bg-brand-blue-50 text-brand-blue'
                      : 'border-brand-grey-200 text-brand-grey-600 hover:border-brand-grey-300'
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Download template */}
          <div className="flex items-center justify-between bg-brand-grey-50 rounded-lg px-3 py-2.5">
            <span className="text-[11px] text-brand-grey-600">Pakua template ya Excel</span>
            <button onClick={downloadTemplate}
              className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-brand-grey-100 text-brand-grey-700 font-semibold hover:bg-brand-grey-200 transition">
              <Download size={11} /> Pakua
            </button>
          </div>

          {/* 3. Upload */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border border-dashed rounded-lg py-4 text-center cursor-pointer transition ${
              dragOver ? 'border-brand-blue bg-brand-blue-50' : file ? 'border-green-300 bg-green-50' : 'border-brand-grey-200 hover:border-brand-grey-300'
            }`}
          >
            <input ref={inputRef} type="file" accept=".xlsx" className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileSpreadsheet size={20} className="text-green-600" />
                <div className="text-left">
                  <p className="text-sm font-bold text-green-700">{file.name}</p>
                  <p className="text-[11px] text-brand-grey-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-brand-grey-500">Bonyeza au drag faili ya Excel hapa</p>
                <p className="text-[10px] text-brand-grey-400 mt-0.5">.xlsx tu</p>
              </>
            )}
          </div>

          {/* 4. Import button */}
          <button onClick={doImport} disabled={!file || busy}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue-700 disabled:opacity-40 transition">
            {busy ? (
              <><Loader2 size={13} className="animate-spin" /> Inaingiza...</>
            ) : (
              <><Upload size={13} /> Ingiza</>
            )}
          </button>

          {/* 5. Results */}
          {result && (
            <div className={`rounded-xl p-4 text-sm space-y-2 ${
              result.created > 0 ? 'bg-green-50 border border-green-200' : 'bg-brand-red-50 border border-brand-red-200'
            }`}>
              {result.created > 0 && (
                <div className="flex items-center gap-2 text-green-700 font-bold">
                  <CheckCircle2 size={16} /> {result.created} watumiaji wameongezwa
                </div>
              )}
              {result.skipped > 0 && (
                <div className="flex items-center gap-2 text-orange-600 font-semibold">
                  <AlertTriangle size={14} /> {result.skipped} zimeachwa (makosa)
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 mt-2">
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-[11px] text-brand-red-600 bg-white rounded-lg px-3 py-1.5 border border-brand-red-100">
                      <span className="font-bold">Mstari {e.row}:</span> {e.name && <span>{e.name} — </span>}{e.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-brand-grey-100 flex justify-end">
          <button onClick={onClose}
            className="text-[11px] px-3 py-1.5 rounded-md border border-brand-grey-200 text-brand-grey-500 font-semibold hover:bg-brand-grey-50 transition">
            Funga
          </button>
        </div>
      </div>
    </div>
  );
}
