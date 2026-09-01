'use client';

import { useState, useRef, useCallback } from 'react';
import { Download, X, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Eye, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import { adminImportUsers, adminImportTemplate, extractErrorMessage } from '@/lib/api';

type Props = {
  onClose: () => void;
  onImported: (result: { created: number; skipped: number; errors: any[] }) => void;
};

const CATEGORIES = [
  { value: 'education', label: 'Elimu' },
  { value: 'health', label: 'Afya' },
  { value: 'service', label: 'Utumishi' },
];

const REQUIRED_COLS = ['Jina Kamili', 'Simu ya Kawaida', 'Kada', 'Mkoa wa Sasa', 'Wilaya'];
const OPTIONAL_COLS = ['Simu ya WhatsApp', 'Somo 1', 'Somo 2', 'Shule / Kituo', 'Mkoa wa Lengo 1', 'Wilaya za Lengo 1', 'Mkoa wa Lengo 2', 'Wilaya za Lengo 2', 'Miaka ya Kazi'];
const EDUCATION_ONLY = ['Kiwango', 'Somo 1', 'Somo 2'];

type ParsedRow = {
  rowIndex: number;
  name: string;
  phone: string;
  whatsapp: string;
  cadre: string;
  level: string;
  sub1: string;
  sub2: string;
  region: string;
  district: string;
  facility: string;
  dest1Region: string;
  dest1Districts: string;
  dest2Region: string;
  dest2Districts: string;
  yearsOfService: string;
  raw: string[];
  errors: string[];
};

function validateRow(row: string[], category: string): string[] {
  const errs: string[] = [];
  const name = (row[0] || '').trim();
  const phone = (row[1] || '').trim();
  const cadre = (row[3] || '').trim();
  const region = (row[7] || '').trim();
  const district = (row[8] || '').trim();
  const yearsRaw = (row[14] || '').trim();

  if (!name) errs.push('Jina kamili ni lazima');
  if (!phone) errs.push('Simu ni lazima');
  else if (!/^(0|\+?255)\d{8,12}$/.test(phone.replace(/\s/g, ''))) errs.push('Muundo wa simu si sahihi');

  if (row[2]?.trim()) {
    const wa = row[2].trim();
    if (!/^(0|\+?255)\d{8,12}$/.test(wa.replace(/\s/g, ''))) errs.push('Muundo wa WhatsApp si sahihi');
  }

  if (!cadre) errs.push('Kada ni lazima');
  if (!region) errs.push('Mkoa ni lazima');
  if (!district) errs.push('Wilaya ni lazima');

  if (category === 'education') {
    const level = (row[4] || '').trim();
    if (level && !['Primary', 'Secondary'].includes(level)) errs.push('Kiwango: Primary au Secondary tu');
  }

  if (yearsRaw) {
    const n = Number(yearsRaw);
    if (isNaN(n) || n < 1 || n > 30) errs.push('Miaka ya kazi: 1-30 tu');
  }

  return errs;
}

export default function BulkImportModal({ onClose, onImported }: Props) {
  const [category, setCategory] = useState('education');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: any[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Preview state
  const [stage, setStage] = useState<'upload' | 'preview' | 'result'>('upload');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handleFile = useCallback(async (f: File | null) => {
    if (!f) return;
    setFileError(null);
    setPreviewError(null);
    if (!f.name.endsWith('.xlsx')) {
      setFileError('Tumia faili ya Excel (.xlsx) tu');
      return;
    }
    setFile(f);

    // Parse Excel client-side for preview
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any;

      if (data.length < 2) {
        setPreviewError('Hakuna data ndani ya faili');
        return;
      }

      // Skip header row
      const parsed: ParsedRow[] = data.slice(1).filter(r => r.some(c => String(c).trim())).map((r, i) => {
        const raw = r.map(c => String(c ?? '').trim());
        const vals = [...raw, ...Array(15).fill('')].slice(0, 15);
        const errs = validateRow(vals, category);
        return {
          rowIndex: i + 2,
          name: vals[0],
          phone: vals[1],
          whatsapp: vals[2],
          cadre: vals[3],
          level: vals[4],
          sub1: vals[5],
          sub2: vals[6],
          region: vals[7],
          district: vals[8],
          facility: vals[9],
          dest1Region: vals[10],
          dest1Districts: vals[11],
          dest2Region: vals[12],
          dest2Districts: vals[13],
          yearsOfService: vals[14],
          raw: vals,
          errors: errs,
        };
      });

      if (parsed.length === 0) {
        setPreviewError('Hakuna data sahihi ndani ya faili');
        return;
      }

      setRows(parsed);
      setStage('preview');
    } catch {
      setPreviewError('Imeshindwa kusoma faili');
    }
  }, [category]);

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
      setStage('result');
      if (r.created > 0) onImported(r);
    } catch (e: any) {
      setResult({ created: 0, skipped: 0, errors: [{ row: 0, name: '', error: extractErrorMessage(e, 'Import failed') }] });
      setStage('result');
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

  const validCount = rows.filter(r => r.errors.length === 0).length;
  const invalidCount = rows.filter(r => r.errors.length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-xl border border-brand-grey-100 w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-grey-100">
          <div className="flex items-center gap-2">
            {stage === 'preview' && (
              <button onClick={() => { setStage('upload'); setRows([]); setFile(null); setResult(null); }}
                className="text-brand-grey-400 hover:text-brand-grey-600">
                <ArrowLeft size={14} />
              </button>
            )}
            <h2 className="font-semibold text-sm text-brand-grey-900">
              {stage === 'upload' ? 'Ingiza Watumiaji' : stage === 'preview' ? 'Angalia Data Kabla ya Ku-import' : 'Matokeo'}
            </h2>
          </div>
          <button onClick={onClose} className="text-brand-grey-400 hover:text-brand-grey-600"><X size={14} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* ─── STAGE: UPLOAD ─── */}
          {stage === 'upload' && (
            <>
              {/* Idara tabs */}
              <div className="flex gap-1">
                {CATEGORIES.map((c) => (
                  <button key={c.value} onClick={() => { setCategory(c.value); setFile(null); setResult(null); setFileError(null); setRows([]); setStage('upload'); }}
                    className={`px-3 py-1 rounded text-xs font-semibold border transition ${
                      category === c.value ? 'border-brand-blue bg-brand-blue-50 text-brand-blue' : 'border-brand-grey-200 text-brand-grey-500 hover:border-brand-grey-300'
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Constraints */}
              <div className="bg-brand-grey-50 rounded-lg p-3 text-[11px] text-brand-grey-600 space-y-1">
                <p className="font-semibold text-brand-grey-800 text-xs">Vigezo vinavyohitajika:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li><b>Jina Kamili</b> — lazima</li>
                  <li><b>Simu ya Kawaida</b> — lazima, muundo wa Tanzania (0XXXXXXXXX au +255XXXXXXXXX)</li>
                  <li><b>Simu ya WhatsApp</b> — hiari, muundo sawa</li>
                  <li><b>Kada</b> — lazima, mfano: P1, P2, S1, S2, CO, RN</li>
                  {category === 'education' && <li><b>Kiwango</b> — <i>Primary</i> au <i>Secondary</i> tu</li>}
                  <li><b>Mkoa wa Sasa</b> — lazima, lazima iwe mkoa uliorегистriwa</li>
                  <li><b>Wilaya</b> — lazima, lazima iwe ndani ya mkoa husika</li>
                  <li><b>Miaka ya Kazi</b> — hiari, 1-30. Kama &gt;3, inabaki 3+</li>
                  <li><b>Mikoa ya Lengo</b> — hiari, inaweza kuwa 1 au 2 mikoa, wilaya kwa koma</li>
                </ul>
              </div>

              {/* Download template */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-grey-500">Pakua template ya Excel</span>
                <button onClick={downloadTemplate} className="text-xs px-2.5 py-1 rounded bg-brand-grey-100 text-brand-grey-600 font-semibold hover:bg-brand-grey-200 transition">
                  <Download size={10} className="inline mr-1" />Pakua
                </button>
              </div>
              {templateError && <p className="text-[10px] text-brand-red-500">{templateError}</p>}

              {/* Upload area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`border border-dashed rounded-lg py-4 text-center cursor-pointer transition ${
                  dragOver ? 'border-brand-blue bg-brand-blue-50' : file ? 'border-green-300 bg-green-50' : 'border-brand-grey-200 hover:border-brand-grey-300'
                }`}>
                <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
                {file ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <FileSpreadsheet size={14} className="text-green-600" />
                    <span className="text-xs font-semibold text-green-700">{file.name}</span>
                  </div>
                ) : (
                  <p className="text-xs text-brand-grey-400">Bonyeza au drag faili ya .xlsx hapa</p>
                )}
              </div>
              {fileError && <p className="text-[10px] text-brand-red-500">{fileError}</p>}
              {previewError && <p className="text-[10px] text-brand-red-500">{previewError}</p>}
            </>
          )}

          {/* ─── STAGE: PREVIEW ─── */}
          {stage === 'preview' && (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-brand-grey-800">Jumla: {rows.length} safu</span>
                {validCount > 0 && (
                  <span className="flex items-center gap-1 text-green-600 font-bold">
                    <CheckCircle2 size={12} /> {validCount} ziko sawa
                  </span>
                )}
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1 text-brand-red-500 font-bold">
                    <AlertTriangle size={12} /> {invalidCount} zina makosa
                  </span>
                )}
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto border border-brand-grey-100 rounded-lg max-h-[45vh] overflow-y-auto">
                <table className="text-[10px] w-full whitespace-nowrap">
                  <thead className="bg-brand-grey-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-semibold text-brand-grey-600 border-b">#</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-brand-grey-600 border-b">Hali</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-brand-grey-600 border-b">Jina</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-brand-grey-600 border-b">Simu</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-brand-grey-600 border-b">WhatsApp</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-brand-grey-600 border-b">Kada</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-brand-grey-600 border-b">Kiwango</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-brand-grey-600 border-b">Mkoa</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-brand-grey-600 border-b">Wilaya</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-brand-grey-600 border-b">Lengo 1</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-brand-grey-600 border-b">Lengo 2</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-brand-grey-600 border-b">Miaka</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-grey-50">
                    {rows.map((r, i) => (
                      <tr key={i} className={r.errors.length > 0 ? 'bg-brand-red-50/40' : ''}>
                        <td className="px-2 py-1 text-brand-grey-400">{r.rowIndex}</td>
                        <td className="px-2 py-1">
                          {r.errors.length === 0 ? (
                            <CheckCircle2 size={12} className="text-green-500" />
                          ) : (
                            <span className="relative group">
                              <AlertTriangle size={12} className="text-brand-red-500 cursor-help" />
                              <span className="hidden group-hover:block absolute z-10 bottom-full left-0 mb-1 bg-brand-grey-900 text-white rounded px-2 py-1 text-[9px] whitespace-normal w-48 shadow-lg">
                                {r.errors.join(' • ')}
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1 font-semibold text-brand-grey-800">{r.name || '—'}</td>
                        <td className="px-2 py-1 text-brand-grey-600">{r.phone || '—'}</td>
                        <td className="px-2 py-1 text-brand-grey-600">{r.whatsapp || '—'}</td>
                        <td className="px-2 py-1 text-brand-grey-600">{r.cadre || '—'}</td>
                        <td className="px-2 py-1 text-brand-grey-600">{r.level || '—'}</td>
                        <td className="px-2 py-1 text-brand-grey-600">{r.region || '—'}</td>
                        <td className="px-2 py-1 text-brand-grey-600">{r.district || '—'}</td>
                        <td className="px-2 py-1 text-brand-grey-600">
                          {r.dest1Region ? `${r.dest1Region}${r.dest1Districts ? ` (${r.dest1Districts})` : ''}` : '—'}
                        </td>
                        <td className="px-2 py-1 text-brand-grey-600">
                          {r.dest2Region ? `${r.dest2Region}${r.dest2Districts ? ` (${r.dest2Districts})` : ''}` : '—'}
                        </td>
                        <td className="px-2 py-1 text-brand-grey-600">{r.yearsOfService || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Errors summary */}
              {invalidCount > 0 && (
                <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-2 max-h-24 overflow-y-auto space-y-0.5">
                  <p className="text-[10px] font-bold text-brand-red-700">Makosa yaangalie:</p>
                  {rows.filter(r => r.errors.length > 0).map((r, i) => (
                    <div key={i} className="text-[9px] text-brand-red-600">
                      <span className="font-bold">Mstari {r.rowIndex}:</span> {r.name && <span>{r.name} — </span>}{r.errors.join(' • ')}
                    </div>
                  ))}
                </div>
              )}

              {/* Import button */}
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setStage('upload'); setRows([]); setFile(null); }}
                  className="px-3 py-1.5 rounded border border-brand-grey-200 text-brand-grey-600 text-xs font-semibold hover:bg-brand-grey-50 transition">
                  Badilisha
                </button>
                <button onClick={doImport} disabled={busy}
                  className="px-4 py-1.5 rounded bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-700 disabled:opacity-40 transition">
                  {busy ? <Loader2 size={12} className="animate-spin inline mr-1" /> : null}
                  {busy ? 'Inaingiza...' : `Thibitisha Ku-import (${validCount} sawa)`}
                </button>
              </div>
            </>
          )}

          {/* ─── STAGE: RESULT ─── */}
          {stage === 'result' && result && (
            <>
              <div className={`rounded-lg p-3 text-xs space-y-2 ${result.created > 0 ? 'bg-green-50 border border-green-200' : 'bg-brand-red-50 border border-brand-red-200'}`}>
                {result.created > 0 && (
                  <div className="flex items-center gap-1.5 text-green-700 font-bold text-sm">
                    <CheckCircle2 size={14} /> {result.created} wameongezwa kwenye mfumo
                  </div>
                )}
                {result.skipped > 0 && (
                  <div className="flex items-center gap-1.5 text-orange-600 font-semibold">
                    <AlertTriangle size={12} /> {result.skipped} zimeachwa (makosa)
                  </div>
                )}
                {result.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1 mt-2">
                    {result.errors.map((e, i) => (
                      <div key={i} className="text-[10px] text-brand-red-600 bg-white rounded px-2 py-1 border border-brand-red-100">
                        <span className="font-bold">Mstari {e.row}:</span> {e.name && <span>{e.name} — </span>}{e.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button onClick={onClose}
                  className="px-4 py-1.5 rounded bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-700 transition">
                  Funga
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
