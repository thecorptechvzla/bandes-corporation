'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileSpreadsheet, ChevronDown, ChevronUp, Download, Upload, Check } from 'lucide-react';
import type { BulkUploadResult } from '@/types/api';

interface BulkUploadSectionProps {
  clients: { id: string; name: string }[];
  bulkClientId: string;
  onBulkClientIdChange: (v: string) => void;
  isPending: boolean;
  onUpload: (fd: FormData) => Promise<BulkUploadResult>;
}

export function BulkUploadSection({ clients, bulkClientId, onBulkClientIdChange, isPending, onUpload }: BulkUploadSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkError, setBulkError] = useState('');
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const downloadTemplate = async () => {
    const ExcelJS = await import('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Plantilla Carga Masiva');
    ws.columns = [
      { header: 'CÓDIGO', key: 'code', width: 22 },
      { header: 'PESO BRUTO (g)', key: 'grossWeight', width: 18 },
      { header: 'LEY AU (‰)', key: 'purity', width: 15 },
    ];
    const hr = ws.getRow(1);
    hr.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    hr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C1C1C' } };
    hr.alignment = { horizontal: 'center' };
    ws.addRow(['', '', '', '']);
    const nr = ws.getRow(2);
    nr.getCell(1).value = '* CÓDIGO, PESO BRUTO y LEY AU son obligatorios';
    nr.getCell(1).font = { italic: true, color: { argb: 'FF8C8C8C' }, size: 9 };
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'plantilla-carga-masiva.xlsx';
    a.click(); URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async () => {
    if (!bulkClientId || !bulkFile) return;
    setBulkError(''); setBulkResult(null);
    if (bulkFile.size > 10 * 1024 * 1024) { setBulkError('Archivo excede 10 MB.'); return; }
    const fd = new FormData();
    fd.append('file', bulkFile); fd.append('clientId', bulkClientId);
    try {
      const result = await onUpload(fd);
      setBulkResult(result); setBulkFile(null);
      const fi = document.getElementById('bulk-file-input') as HTMLInputElement;
      if (fi) fi.value = '';
    } catch (e: any) {
      setBulkError(e?.response?.data?.message || 'Error en carga masiva.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
      className="premium-card overflow-hidden"
    >
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 active:scale-[0.99] transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[var(--pm-accent-amber)]" />
          <span className="text-xs font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Carga Masiva</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--pm-text-dim)]" /> : <ChevronDown className="w-4 h-4 text-[var(--pm-text-dim)]" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 space-y-4 border-t border-[var(--pm-border)] pt-4">
              <select value={bulkClientId} onChange={e => onBulkClientIdChange(e.target.value)}
                className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2 text-xs font-sans text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors cursor-pointer"
              >
                {clients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>

              {/* Dropzone */}
              <div ref={dropRef} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) setBulkFile(f); }}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${dragOver ? 'border-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)]/5' : 'border-[var(--pm-border)] hover:border-[var(--pm-text-dim)]/30'}`}
                onClick={() => document.getElementById('bulk-file-input')?.click()}
              >
                <input id="bulk-file-input" type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setBulkFile(e.target.files?.[0] || null)} />
                <Upload className={`w-6 h-6 mx-auto mb-2 ${dragOver ? 'text-[var(--pm-accent-gold)]' : 'text-[var(--pm-text-dim)]'}`} />
                <p className="text-[11px] font-mono text-[var(--pm-text-dim)]">
                  {bulkFile ? <span className="text-[var(--pm-accent-amber)] font-bold">{bulkFile.name}</span> : 'Arrastra un archivo .xlsx o haz clic para seleccionar'}
                </p>
                <p className="text-[9px] font-mono text-[var(--pm-text-dim)]/50 mt-1">Tamaño máximo: 10 MB</p>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={downloadTemplate}
                  className="flex-1 py-2 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                ><Download className="w-3 h-3" /> Plantilla</button>
                <button type="button" onClick={handleBulkUpload} disabled={!bulkFile || isPending}
                  className="flex-1 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                  style={{
                    background: bulkFile ? 'rgba(212,175,55,0.12)' : 'transparent',
                    color: 'var(--pm-accent-amber)', border: '1px solid rgba(212,175,55,0.2)',
                  }}
                >{isPending ? 'Subiendo...' : <><Upload className="w-3 h-3" /> Subir</>}</button>
              </div>

              {bulkError && <p className="text-[10px] font-mono text-[var(--pm-accent-red)]">{bulkError}</p>}
              {bulkResult && (
                <div className="p-3 rounded-lg border text-[10px] font-mono bg-[var(--pm-accent-emerald)]/5 border-[var(--pm-accent-emerald)]/20 text-[var(--pm-accent-emerald)]">
                  <Check className="w-3 h-3 inline mr-1" /> Creadas: <strong>{bulkResult.created}</strong> | Saltadas: <strong>{bulkResult.skipped}</strong>
                  {bulkResult.errors.length > 0 && (
                    <div className="mt-2 max-h-24 overflow-y-auto space-y-0.5">
                      {bulkResult.errors.map((e, i) => (
                        <div key={i} className="text-[var(--pm-accent-red)] text-[9px]">Fila {e.row}: {e.message}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
