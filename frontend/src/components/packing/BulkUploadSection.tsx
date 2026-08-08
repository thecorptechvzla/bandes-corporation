'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileSpreadsheet, ChevronUp, ChevronDown, Upload, Download, Check } from 'lucide-react';
import type { BulkUploadResult } from '@/types/api';
import type { Client } from '@/types/api';

interface BulkUploadSectionProps {
  clients: Client[];
  isOpen: boolean;
  onToggleOpen: () => void;
  bulkClientId: string;
  onBulkClientIdChange: (v: string) => void;
  bulkFile: File | null;
  onBulkFileChange: (f: File | null) => void;
  bulkError: string;
  bulkResult: BulkUploadResult | null;
  isPending: boolean;
  onUpload: () => void;
  onDownloadTemplate: () => void;
}

export function BulkUploadSection({
  clients, isOpen, onToggleOpen, bulkClientId, onBulkClientIdChange,
  bulkFile, onBulkFileChange, bulkError, bulkResult, isPending, onUpload, onDownloadTemplate,
}: BulkUploadSectionProps) {
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
      className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
      <button type="button" onClick={onToggleOpen}
        className="w-full flex items-center justify-between px-5 py-4 active:scale-[0.99] transition-all cursor-pointer">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[var(--pm-accent-emerald)]" />
          <span className="text-xs font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Carga Masiva</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--pm-text-dim)]" /> : <ChevronDown className="w-4 h-4 text-[var(--pm-text-dim)]" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-5 pb-5 space-y-4 border-t border-[var(--pm-border)]/20 pt-4">
              <select value={bulkClientId} onChange={e => onBulkClientIdChange(e.target.value)}
                className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2 text-xs font-sans text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors cursor-pointer">
                <option value="" disabled>Seleccionar proveedor...</option>
                {clients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <div ref={dropRef} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) onBulkFileChange(f); }}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${dragOver ? 'border-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)]/5' : 'border-[var(--pm-border)] hover:border-[var(--pm-text-dim)]/30'}`}
                onClick={() => document.getElementById('bulk-file-input')?.click()}>
                <input id="bulk-file-input" type="file" accept=".xlsx,.xls" className="hidden" onChange={e => onBulkFileChange(e.target.files?.[0] || null)} />
                <Upload className={`w-6 h-6 mx-auto mb-2 ${dragOver ? 'text-[var(--pm-accent-gold)]' : 'text-[var(--pm-text-dim)]'}`} />
                <p className="text-[11px] font-mono text-[var(--pm-text-dim)]">
                  {bulkFile ? <span className="text-[var(--pm-accent-amber)] font-bold">{bulkFile.name}</span> : 'Arrastra un archivo .xlsx o haz clic para seleccionar'}
                </p>
                <p className="text-[10px] font-mono text-[var(--pm-text-dim)]/70 mt-1">Tamaño máximo: 10 MB</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={onDownloadTemplate}
                  className="flex-1 py-2 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-[11px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5">
                  <Download className="w-3 h-3" /> Plantilla</button>
                <button type="button" onClick={onUpload} disabled={!bulkClientId || !bulkFile || isPending}
                  className="flex-1 py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                  style={{ background: bulkFile ? 'rgba(16,185,129,0.12)' : 'transparent', color: 'var(--pm-accent-emerald)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  {isPending ? 'Subiendo...' : <><Upload className="w-3 h-3" /> Subir</>}
                </button>
              </div>
              {bulkError && <p className="text-[11px] font-mono text-[var(--pm-accent-red)]">{bulkError}</p>}
              {bulkResult && (
                <div className="p-3 rounded-lg border text-[11px] font-mono bg-[var(--pm-accent-emerald)]/5 border-[var(--pm-accent-emerald)]/20 text-[var(--pm-accent-emerald)]">
                  <Check className="w-3 h-3 inline mr-1" /> Creadas: <strong>{bulkResult.created}</strong> | Saltadas: <strong>{bulkResult.skipped}</strong>
                  {bulkResult.packingId && (
                    <span className="ml-2 text-[var(--pm-accent-amber)]">Packing #{bulkResult.packingId.slice(0, 8)}</span>
                  )}
                  {bulkResult.errors.length > 0 && (
                    <div className="mt-2 max-h-24 overflow-y-auto space-y-0.5">
                      {bulkResult.errors.map((e, i) => (
                        <div key={i} className="text-[var(--pm-accent-red)] text-[10px]">Fila {e.row}: {e.message}</div>
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
