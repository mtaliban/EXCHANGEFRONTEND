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
      setTemplateError('Imeshindwa kupakua');
      setTimeout(() => setTemplateError(null), 4000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl w-full max-w-xs shadow-xl border border-brand-grey-100">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-brand-grey-100">
          <h2 className="font-semibold text-xs text-brand-grey-900">Ingiza Watumiaji</h2>
          <button onClick={onClose} className="text-brand-grey-400 hover:text-brand-grey-600"><X size={14} /></button>
        </div>

        <div className="p-3 space-y-2.5">
          {/* Idara tabs */}
          <div className="flex gap-1">
            {CATEGORIES.map((c) => (
              <button key={c.value} onClick={() => { setCategory(c.value); setFile(null); setResult(null); setFileError(null); }}
                className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border transition ${
                  category === c.value ? 'border-brand-blue bg-brand-blue-50 text-brand-blue' : 'border-brand-grey-200 text-brand-grey-500 hover:border-brand-grey-300'
                }`}>
                {c.label}
              </button>
            ))}
          </div>

          {/* Download template */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-brand-grey-400">Pakua template</span>
            <button onClick={downloadTemplate} className="text-[10px] px-2 py-0.5 rounded bg-brand-grey-100 text-brand-grey-600 font-semibold hover:bg-brand-grey-200 transition">
              <Download size={9} className="inline mr-0.5" />Pakua
            </button>
          </div>
          {templateError && <p className="text-[10px] text-brand-red-500">{templateError}</p>}

          {/* Upload area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border border-dashed rounded py-2 text-center cursor-pointer transition ${
              dragOver ? 'border-brand-blue bg-brand-blue-50' : file ? 'border-green-300 bg-green-50' : 'border-brand-grey-200 hover:border-brand-grey-300'
            }`}>
            <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            {file ? (
              <div className="flex items-center justify-center gap-1.5">
                <FileSpreadsheet size={13} className="text-green-600" />
                <span className="text-[10px] font-semibold text-green-700">{file.name}</span>
              </div>
            ) : (
              <p className="text-[10px] text-brand-grey-400">Bonyeza au drag .xlsx</p>
            )}
          </div>
          {fileError && <p className="text-[10px] text-brand-red-500">{fileError}</p>}

          {/* Import btn */}
          <button onClick={doImport} disabled={!file || busy}
            className="w-full py-1.5 rounded bg-brand-blue text-white text-[11px] font-semibold hover:bg-brand-blue-700 disabled:opacity-40 transition">
            {busy ? <Loader2 size={12} className="animate-spin inline mr-1" /> : null}
            {busy ? 'Inaingiza...' : 'Ingiza'}
          </button>

          {/* Results */}
          {result && (
            <div className={`rounded p-2 text-[10px] space-y-1 ${result.created > 0 ? 'bg-green-50 border border-green-200' : 'bg-brand-red-50 border border-brand-red-200'}`}>
              {result.created > 0 && (
                <div className="flex items-center gap-1 text-green-700 font-bold">
                  <CheckCircle2 size={11} /> {result.created} wameongezwa
                </div>
              )}
              {result.skipped > 0 && (
                <div className="flex items-center gap-1 text-orange-600 font-semibold">
                  <AlertTriangle size={10} /> {result.skipped} zimeachwa
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="max-h-28 overflow-y-auto space-y-0.5 mt-1">
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-[9px] text-brand-red-600 bg-white rounded px-2 py-0.5 border border-brand-red-100">
                      <span className="font-bold">Mstari {e.row}:</span> {e.name && <span>{e.name} — </span>}{e.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
