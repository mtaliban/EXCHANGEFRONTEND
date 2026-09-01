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
  const [fileError, setFileError] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File | null) => {
    if (!f) return;
    setFileError(null);
    if (!f.name.endsWith('.xlsx')) {
      setFileError('Tumia faili ya Excel (.xlsx) tu');
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
    setTemplateError(null);
    try {
      const blob = await adminImportTemplate(category);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${category}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setTemplateError('Imeshindwa kupakua template');
      setTimeout(() => setTemplateError(null), 4000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl border border-brand-grey-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-grey-100">
          <h2 className="font-semibold text-sm text-brand-grey-900">Ingiza Watumiaji</h2>
          <button onClick={onClose} className="text-brand-grey-400 hover:text-brand-grey-600 transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* 1. Chagua Idara */}
          <div>
            <label className="text-[11px] font-semibold text-brand-grey-500 mb-1.5 block">Idara</label>
            <div className="flex gap-1.5">
              {CATEGORIES.map((c) => (
                <button key={c.value} onClick={() => { setCategory(c.value); setFile(null); setResult(null); setFileError(null); }}
                  className={`px-3 py-1 rounded-md border text-[11px] font-semibold transition ${
                    category === c.value
                      ? 'border-brand-blue bg-brand-blue-50 text-brand-blue'
                      : 'border-brand-grey-200 text-brand-grey-500 hover:border-brand-grey-300'
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Download template */}
          <div className="flex items-center justify-between bg-brand-grey-50 rounded-md px-3 py-2">
            <span className="text-[11px] text-brand-grey-500">Pakua template</span>
            <button onClick={downloadTemplate}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-brand-grey-100 text-brand-grey-600 font-semibold hover:bg-brand-grey-200 transition">
              <Download size={10} /> Pakua
            </button>
          </div>
          {templateError && (
            <div className="text-[11px] text-brand-red-600 bg-brand-red-50 rounded-md px-3 py-1.5 border border-brand-red-100">
              {templateError}
            </div>
          )}

          {/* 3. Upload */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border border-dashed rounded-md py-3 text-center cursor-pointer transition ${
              dragOver ? 'border-brand-blue bg-brand-blue-50' : file ? 'border-green-300 bg-green-50' : 'border-brand-grey-200 hover:border-brand-grey-300'
            }`}
          >
            <input ref={inputRef} type="file" accept=".xlsx" className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileSpreadsheet size={16} className="text-green-600" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-green-700">{file.name}</p>
                  <p className="text-[10px] text-brand-grey-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-brand-grey-500">Bonyeza au drag faili ya Excel hapa</p>
            )}
          </div>
          {fileError && (
            <div className="text-[11px] text-brand-red-600 bg-brand-red-50 rounded-md px-3 py-1.5 border border-brand-red-100">
              {fileError}
            </div>
          )}

          {/* 4. Import button */}
          <button onClick={doImport} disabled={!file || busy}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-brand-blue text-white font-semibold text-xs hover:bg-brand-blue-700 disabled:opacity-40 transition">
            {busy ? (
              <><Loader2 size={12} className="animate-spin" /> Inaingiza...</>
            ) : (
              <><Upload size={12} /> Ingiza</>
            )}
          </button>

          {/* 5. Results */}
          {result && (
            <div className={`rounded-md p-3 text-xs space-y-1.5 ${
              result.created > 0 ? 'bg-green-50 border border-green-200' : 'bg-brand-red-50 border border-brand-red-200'
            }`}>
              {result.created > 0 && (
                <div className="flex items-center gap-1.5 text-green-700 font-bold">
                  <CheckCircle2 size={13} /> {result.created} watumiaji wameongezwa
                </div>
              )}
              {result.skipped > 0 && (
                <div className="flex items-center gap-1.5 text-orange-600 font-semibold">
                  <AlertTriangle size={12} /> {result.skipped} zimeachwa
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="max-h-36 overflow-y-auto space-y-1 mt-1.5">
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-[10px] text-brand-red-600 bg-white rounded px-2 py-1 border border-brand-red-100">
                      <span className="font-bold">Mstari {e.row}:</span> {e.name && <span>{e.name} — </span>}{e.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-brand-grey-100 flex justify-end">
          <button onClick={onClose}
            className="text-[11px] px-3 py-1 rounded-md border border-brand-grey-200 text-brand-grey-500 font-semibold hover:bg-brand-grey-50 transition">
            Funga
          </button>
        </div>
      </div>
    </div>
  );
}
