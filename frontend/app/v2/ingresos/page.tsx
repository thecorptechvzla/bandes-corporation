'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useClients } from '@/hooks/useClients';
import { useBars, useCreateBar, useBulkUploadBars } from '@/hooks/useBars';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import type { WeightUnit } from '@/lib/format';
import type { Bar, BulkUploadResult } from '@/types/api';
import {
  ClipboardList, Plus, Upload, Download, ChevronDown, ChevronUp,
  FileSpreadsheet, Search, Trash2, AlertTriangle, Check, Weight,
  Microscope, X, Package, Zap,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  IN_STOCK: 'En Bóveda',
  PROCESANDO: 'Procesando',
  COMPLETADO: 'Completado',
  EXITED: 'Egresado',
};

const STATUS_STYLES: Record<string, string> = {
  IN_STOCK: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10',
  PROCESANDO: 'text-[var(--pm-accent-amber)] border-[var(--pm-accent-amber)]/25 bg-[var(--pm-accent-amber)]/10',
  COMPLETADO: 'text-[var(--pm-accent-gold)] border-[var(--pm-accent-gold)]/25 bg-[var(--pm-accent-gold)]/10',
  EXITED: 'text-[var(--pm-text-dim)] border-[var(--pm-border)] bg-[var(--pm-bg-tertiary)]',
};

const PAGE_SIZE = 10;

export default function V2IngresosPage() {
  const { data: clients = [] } = useClients({ role: 'PROVEEDOR' });
  const { data: bars = [] } = useBars();
  const createBar = useCreateBar();
  const bulkUploadMutation = useBulkUploadBars();

  const [formWeightUnit, setFormWeightUnit] = useState<WeightUnit>('g');
  const [clientId, setClientId] = useState('');
  const [barNumber, setBarNumber] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [purity, setPurity] = useState('');
  const [leyAg, setLeyAg] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [accordionPages, setAccordionPages] = useState<Record<string, number>>({});

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkClientId, setBulkClientId] = useState('');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkError, setBulkError] = useState('');
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success'>('idle');
  const [ingestStatus, setIngestStatus] = useState<{ barNumber: string; status: 'ingesting' | 'success' } | null>(null);

  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (clients.length > 0) {
      if (!clientId) setClientId(clients[0].id);
      if (!bulkClientId) setBulkClientId(clients[0].id);
      const acc: Record<string, boolean> = {};
      clients.forEach(c => { acc[c.id] = true; });
      setOpenAccordions(prev => {
        const hasAll = clients.every(c => prev[c.id] !== undefined);
        return hasAll ? prev : { ...prev, ...acc };
      });
    }
  }, [clients]);

  const liveFA = useMemo(() => {
    const w = parseFloat(grossWeight);
    if (isNaN(w)) return 0;
    const g = formWeightUnit === 'kg' ? w * 1000 : w;
    const p = parseFloat(purity);
    if (isNaN(p)) return 0;
    return g * (p / 1000);
  }, [grossWeight, purity, formWeightUnit]);

  const liveFE = useMemo(() => liveFA * 0.99, [liveFA]);

  const liveFAkg = useMemo(() => liveFA / 1000, [liveFA]);

  const liveAg = useMemo(() => {
    const w = parseFloat(grossWeight);
    if (isNaN(w)) return 0;
    const g = formWeightUnit === 'kg' ? w * 1000 : w;
    const la = parseFloat(leyAg);
    if (isNaN(la)) return 0;
    return g * (la / 1000);
  }, [grossWeight, leyAg, formWeightUnit]);

  const weightWarning = useMemo(() => {
    const w = parseFloat(grossWeight);
    if (isNaN(w)) return false;
    const g = formWeightUnit === 'kg' ? w * 1000 : w;
    return g > 24900;
  }, [grossWeight, formWeightUnit]);

  const filteredBars = useMemo(() => {
    if (!searchQuery) return bars;
    return bars.filter(b =>
      b.barNumber.toUpperCase().includes(searchQuery.toUpperCase()),
    );
  }, [bars, searchQuery]);

  const barsByClient = useMemo(() => {
    const groups: Record<string, Bar[]> = {};
    clients.forEach(c => { groups[c.id] = []; });
    filteredBars.forEach(b => {
      if (groups[b.clientId]) groups[b.clientId].push(b);
    });
    return groups;
  }, [filteredBars, clients]);

  const totalBars = bars.length;
  const totalFineWeight = bars.reduce((s, b) => s + Number(b.fineWeight), 0);

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const setAccordionPage = (clientId: string, page: number) => {
    setAccordionPages(prev => ({ ...prev, [clientId]: page }));
  };

  const handleSubmitBar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!barNumber.trim() || !grossWeight || !purity || !clientId) {
      setFormError('Complete todos los campos obligatorios.');
      return;
    }

    const g = formWeightUnit === 'kg' ? parseFloat(grossWeight) * 1000 : parseFloat(grossWeight);
    if (isNaN(g) || g <= 0) { setFormError('Peso bruto debe ser un número positivo.'); return; }
    const p = parseFloat(purity);
    if (isNaN(p) || p < 0 || p > 1000) { setFormError('Pureza Au debe estar entre 0 y 1000‰.'); return; }
    const ag = parseFloat(leyAg) || 0;
    if (ag < 0 || ag > 1000) { setFormError('Ley Ag debe estar entre 0 y 1000‰.'); return; }

    const code = barNumber.toUpperCase().trim();
    const existing = bars.find(b => b.clientId === clientId && b.barNumber.toUpperCase() === code);
    if (existing) {
      setFormError(`Código duplicado: "${code}" ya existe para este cliente.`);
      return;
    }

    try {
      await createBar.mutateAsync({ barNumber: code, grossWeight: g, purity: p, clientId, leyAg: ag || undefined });
      setIngestStatus({ barNumber: code, status: 'ingesting' });
      setBarNumber(''); setGrossWeight(''); setPurity(''); setLeyAg('');
      setTimeout(() => setIngestStatus({ barNumber: code, status: 'success' }), 800);
      setTimeout(() => setIngestStatus(null), 2800);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Error al registrar la barra.');
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkClientId || !bulkFile) return;
    setBulkError(''); setBulkResult(null);
    if (bulkFile.size > 10 * 1024 * 1024) { setBulkError('Archivo excede 10 MB.'); return; }
    const fd = new FormData();
    fd.append('file', bulkFile); fd.append('clientId', bulkClientId);
    try {
      const result = await bulkUploadMutation.mutateAsync(fd);
      setBulkResult(result); setBulkFile(null);
      const fi = document.getElementById('bulk-file-input') as HTMLInputElement;
      if (fi) fi.value = '';
    } catch (e: any) {
      setBulkError(e?.response?.data?.message || 'Error en carga masiva.');
    }
  };

  const downloadTemplate = async () => {
    const ExcelJS = await import('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Plantilla Carga Masiva');
    ws.columns = [
      { header: 'CÓDIGO', key: 'code', width: 22 },
      { header: 'PESO BRUTO (g)', key: 'grossWeight', width: 18 },
      { header: 'PUREZA (‰)', key: 'purity', width: 15 },
      { header: 'LEY Ag (‰)', key: 'leyAg', width: 15 },
    ];
    const hr = ws.getRow(1);
    hr.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    hr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C1C1C' } };
    hr.alignment = { horizontal: 'center' };
    ws.addRow(['', '', '', '']);
    const nr = ws.getRow(2);
    nr.getCell(1).value = '* CÓDIGO, PESO BRUTO y PUREZA son obligatorios';
    nr.getCell(1).font = { italic: true, color: { argb: 'FF8C8C8C' }, size: 9 };
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'plantilla-carga-masiva.xlsx';
    a.click(); URL.revokeObjectURL(url);
  };

  const handleDeleteBar = async (id: string) => {
    setConfirmDeleteId(null); setDeleteStatus('deleting');
    try {
      await api.delete(`/bars/${id}`);
      setDeleteStatus('success');
      setTimeout(() => setDeleteStatus('idle'), 2000);
    } catch { setDeleteStatus('idle'); }
  };

  const resetForm = () => {
    setBarNumber(''); setGrossWeight(''); setPurity(''); setLeyAg('');
    setFormError(''); setFormSuccess('');
  };

  const formatWeightInput = (val: number) => formatNumber(val / (formWeightUnit === 'kg' ? 1000 : 1), 2);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-xl font-semibold text-[var(--pm-text-primary)] font-sans flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-[var(--pm-accent-gold)]" />
            Ingreso de <span className="text-[var(--pm-accent-gold)]">Material</span>
          </h1>
          <p className="text-xs text-[var(--pm-text-dim)] mt-0.5">Recepción y registro de barras en bóveda.</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--pm-text-dim)]">
          <span className="flex items-center gap-1"><Package className="w-3 h-3 text-[var(--pm-accent-gold)]" />{totalBars} barras</span>
          <span className="hidden sm:inline">FA total: {formatNumber(totalFineWeight, 2)} g</span>
        </div>
      </motion.div>

      {/* Split pane */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* ═══════ LEFT PANEL: Form ═══════ */}
        <div className="space-y-5">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="premium-card overflow-hidden"
          >
            <div className="px-5 pt-5 pb-2 border-b border-[var(--pm-border)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <Plus className="w-3.5 h-3.5 text-[var(--pm-accent-gold)]" />
                </div>
                <span className="text-xs font-mono font-bold text-[var(--pm-accent-gold)] uppercase tracking-wider">Registro Individual</span>
              </div>
            </div>

            <form onSubmit={handleSubmitBar} className="p-5 space-y-4">
              {/* Client selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Proveedor</label>
                <select value={clientId} onChange={e => setClientId(e.target.value)}
                  className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-sans text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors cursor-pointer"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bar code */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Código de Barra</label>
                  <input type="text" placeholder="Ej: BARRA-A001" value={barNumber}
                    onChange={e => setBarNumber(e.target.value.toUpperCase())}
                    className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors uppercase placeholder:text-[var(--pm-text-dim)]/30"
                    required
                  />
                </div>

                {/* Gross weight */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
                    <Weight className="w-3 h-3" /> Peso Bruto
                  </label>
                  <div className="relative">
                    <input type="number" step="any" placeholder="0.00" value={grossWeight}
                      onChange={e => setGrossWeight(e.target.value)}
                      className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 pr-14 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30"
                      required
                    />
                    <button type="button" onClick={() => setFormWeightUnit(prev => prev === 'g' ? 'kg' : 'g')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer active:scale-90 transition-all"
                      style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--pm-accent-gold)', border: '1px solid rgba(212,175,55,0.2)' }}
                    >{formWeightUnit}</button>
                  </div>
                  {weightWarning && (
                    <span className="text-[9px] font-mono text-[var(--pm-accent-amber)] flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3" /> Peso superior a 24,900 g
                    </span>
                  )}
                </div>

                {/* Purity */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
                    <Microscope className="w-3 h-3" /> Pureza Au (‰)
                  </label>
                  <input type="number" min="0" max="1000" step="0.1" placeholder="999.9" value={purity}
                    onChange={e => setPurity(e.target.value)}
                    className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30"
                    required
                  />
                </div>

                {/* Ley Ag */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">
                    Ley Ag (‰) <span className="opacity-40">(opcional)</span>
                  </label>
                  <input type="number" min="0" max="1000" step="0.1" placeholder="0.00" value={leyAg}
                    onChange={e => setLeyAg(e.target.value)}
                    className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30"
                  />
                </div>
              </div>

              {/* Live calculation box */}
              {(parseFloat(grossWeight) > 0 && parseFloat(purity) > 0) && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl border" style={{ background: 'rgba(212,175,55,0.06)', borderColor: 'rgba(212,175,55,0.2)' }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="w-3.5 h-3.5 text-[var(--pm-accent-gold)]" />
                    <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-gold)] uppercase tracking-wider">Cálculo en Tiempo Real</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">FA (Fino)</span>
                      <span className="text-sm font-mono font-bold text-[var(--pm-text-primary)]">{formatNumber(liveFA, 4)} g</span>
                      <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">{formatNumber(liveFAkg, 6)} kg</span>
                    </div>
                    <div className="border-x border-[var(--pm-border)]">
                      <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">FE (Esperado)</span>
                      <span className="text-sm font-mono font-bold text-[var(--pm-text-primary)]">{formatNumber(liveFE, 4)} g</span>
                      <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">FA × 0.99</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Ag (Plata)</span>
                      <span className="text-sm font-mono font-bold text-[var(--pm-text-primary)]">{formatNumber(liveAg, 4)} g</span>
                      <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">{liveAg > 0 ? 'calculado' : '—'}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-mono bg-[var(--pm-accent-red)]/10 border border-[var(--pm-accent-red)]/25 text-[var(--pm-accent-red)]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={resetForm}
                  className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                >Limpiar</button>
                <button type="submit" disabled={createBar.isPending}
                  className="flex-[2] py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))',
                    color: 'var(--pm-accent-gold)', border: '1px solid rgba(212,175,55,0.3)',
                  }}
                >
                  {createBar.isPending ? (
                    <><div className="w-3.5 h-3.5 border-2 border-[var(--pm-accent-gold)] border-t-transparent rounded-full animate-spin" /> Registrando...</>
                  ) : (
                    <><Plus className="w-3.5 h-3.5" /> Registrar Barra</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* ═══════ BULK UPLOAD ═══════ */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
            className="premium-card overflow-hidden"
          >
            <button type="button" onClick={() => setIsBulkOpen(!isBulkOpen)}
              className="w-full flex items-center justify-between px-5 py-4 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[var(--pm-accent-amber)]" />
                <span className="text-xs font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Carga Masiva</span>
              </div>
              {isBulkOpen ? <ChevronUp className="w-4 h-4 text-[var(--pm-text-dim)]" /> : <ChevronDown className="w-4 h-4 text-[var(--pm-text-dim)]" />}
            </button>

            <AnimatePresence>
              {isBulkOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-5 pb-5 space-y-4 border-t border-[var(--pm-border)] pt-4">
                    <select value={bulkClientId} onChange={e => setBulkClientId(e.target.value)}
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
                      <button type="button" onClick={handleBulkUpload} disabled={!bulkFile || bulkUploadMutation.isPending}
                        className="flex-1 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                        style={{
                          background: bulkFile ? 'rgba(212,175,55,0.12)' : 'transparent',
                          color: 'var(--pm-accent-amber)', border: '1px solid rgba(212,175,55,0.2)',
                        }}
                      >{bulkUploadMutation.isPending ? 'Subiendo...' : <><Upload className="w-3 h-3" /> Subir</>}</button>
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
        </div>

        {/* ═══════ RIGHT PANEL: Inventory ═══════ */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
          className="premium-card overflow-hidden"
        >
          {/* Search */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--pm-border)]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--pm-text-dim)]/40" />
              <input type="text" placeholder="Buscar barra por código..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30"
              />
            </div>
            <span className="text-[10px] font-mono text-[var(--pm-text-dim)] whitespace-nowrap">{totalBars} barras</span>
          </div>

          {/* Accordion list */}
          <div className="divide-y divide-[var(--pm-border)] overflow-y-auto max-h-[calc(100vh-280px)] v2-scroll">
            {clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[var(--pm-text-dim)]">
                <Package className="w-10 h-10 text-[var(--pm-accent-gold)]/20 mb-3 animate-pulse" />
                <span className="text-sm font-sans">Sin proveedores registrados</span>
              </div>
            ) : (
              clients.map(client => {
                const clientBars = barsByClient[client.id] || [];
                const isOpen = openAccordions[client.id] ?? true;
                const barCount = clientBars.length;
                const clientFA = clientBars.reduce((s, b) => s + Number(b.fineWeight), 0);
                const currentPage = accordionPages[client.id] || 0;
                const totalPages = Math.ceil(barCount / PAGE_SIZE) || 1;
                const pageBars = clientBars.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

                return (
                  <div key={client.id}>
                    {/* Accordion header */}
                    <button type="button" onClick={() => toggleAccordion(client.id)}
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[var(--pm-bg-tertiary)]/50 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[var(--pm-accent-gold)]" /> : <ChevronUp className="w-3.5 h-3.5 shrink-0 text-[var(--pm-text-dim)]" />}
                        <div className="text-left min-w-0">
                          <span className="text-xs font-sans font-semibold text-[var(--pm-text-primary)] truncate block">{client.name}</span>
                          <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">{barCount} barras · FA: {formatNumber(clientFA, 2)} g</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${barCount > 0 ? 'text-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)]/10' : 'text-[var(--pm-text-dim)] bg-[var(--pm-bg-tertiary)]'}`}>
                        {barCount} uds
                      </span>
                    </button>

                    {/* Accordion content */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                          {barCount === 0 ? (
                            <div className="px-5 pb-4 text-[10px] font-mono text-[var(--pm-text-dim)]/50 italic">Sin barras registradas</div>
                          ) : (
                            <div className="px-0 pb-2">
                              <table className="premium-table w-full">
                                <thead>
                                  <tr>
                                    <th className="text-center">Código</th>
                                    <th className="text-right">Bruto (g)</th>
                                    <th className="text-right">FA (g)</th>
                                    <th className="text-right">FE (g)</th>
                                    <th className="text-right hidden md:table-cell">Ag (g)</th>
                                    <th className="text-center">Estado</th>
                                    <th className="text-center">Acción</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {pageBars.map((bar, idx) => (
                                    <motion.tr key={bar.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: idx * 0.02, duration: 0.15 }}
                                      className="odd:bg-[var(--pm-bg-deepest)]/30 hover:bg-[var(--pm-bg-tertiary)]/40 transition-all duration-150"
                                    >
                                      <td className="text-center font-mono font-bold text-[var(--pm-accent-gold)] tracking-wider text-[11px]">{bar.barNumber}</td>
                                      <td className="text-right font-mono text-[var(--pm-text-primary)]">{formatNumber(Number(bar.grossWeight), 2)}</td>
                                      <td className="text-right font-mono text-[var(--pm-text-primary)]">{formatNumber(Number(bar.fineWeight), 4)}</td>
                                      <td className="text-right font-mono text-[var(--pm-text-dim)]">{formatNumber(Number(bar.fineWeight) * 0.99, 4)}</td>
                                      <td className="text-right font-mono text-[var(--pm-text-dim)] hidden md:table-cell">{bar.fineWeightAg ? formatNumber(Number(bar.fineWeightAg), 4) : '—'}</td>
                                      <td className="text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-mono font-bold border rounded ${STATUS_STYLES[bar.status] || ''}`}>
                                          {STATUS_LABELS[bar.status] || bar.status}
                                        </span>
                                      </td>
                                      <td className="text-center">
                                        <button type="button" onClick={() => setConfirmDeleteId(bar.id)}
                                          disabled={bar.status !== 'IN_STOCK'}
                                          className={`p-1 rounded transition-all ${bar.status === 'IN_STOCK' ? 'text-[var(--pm-text-dim)] hover:text-[var(--pm-accent-red)] hover:bg-[var(--pm-accent-red)]/10 active:scale-90 cursor-pointer' : 'opacity-20 cursor-not-allowed'}`}
                                          title="Eliminar barra"
                                        ><Trash2 className="w-3.5 h-3.5" /></button>
                                      </td>
                                    </motion.tr>
                                  ))}
                                </tbody>
                              </table>

                              {/* Pagination */}
                              {totalPages > 1 && (
                                <div className="flex items-center justify-between px-5 py-2 border-t border-[var(--pm-border)]">
                                  <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">
                                    Pág. {currentPage + 1} de {totalPages}
                                  </span>
                                  <div className="flex gap-1">
                                    <button type="button" onClick={() => setAccordionPage(client.id, Math.max(0, currentPage - 1))}
                                      disabled={currentPage === 0}
                                      className="px-2.5 py-1 rounded text-[9px] font-mono border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] transition-all disabled:opacity-30 active:scale-95 cursor-pointer"
                                    >Anterior</button>
                                    <button type="button" onClick={() => setAccordionPage(client.id, Math.min(totalPages - 1, currentPage + 1))}
                                      disabled={currentPage >= totalPages - 1}
                                      className="px-2.5 py-1 rounded text-[9px] font-mono border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] transition-all disabled:opacity-30 active:scale-95 cursor-pointer"
                                    >Siguiente</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Ingest status overlay */}
      <AnimatePresence>
        {ingestStatus && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-xs glass-panel rounded-2xl overflow-hidden p-8 flex flex-col items-center gap-4"
            >
              {ingestStatus.status === 'ingesting' ? (
                <><div className="w-10 h-10 border-2 border-[var(--pm-accent-gold)] border-t-transparent rounded-full animate-spin" />
                  <div className="text-center"><span className="text-xs font-mono text-[var(--pm-text-dim)]">Registrando</span>
                    <p className="text-sm font-mono font-bold text-[var(--pm-accent-gold)]">{ingestStatus.barNumber}</p></div></>
              ) : (
                <><div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.25)' }}>
                  <Check className="w-7 h-7 text-[var(--pm-accent-emerald)]" strokeWidth={2.5} /></div>
                  <div className="text-center"><span className="text-sm font-sans font-bold text-[var(--pm-accent-emerald)]">Barra Registrada</span>
                    <p className="text-xs font-mono text-[var(--pm-text-dim)] mt-1">{ingestStatus.barNumber}</p></div></>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {confirmDeleteId && (() => {
          const target = bars.find(b => b.id === confirmDeleteId);
          return (
            <motion.div key="del-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-sm glass-panel rounded-2xl overflow-hidden p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle className="w-4 h-4 text-[var(--pm-accent-red)]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-red)] uppercase tracking-wider">Eliminar Barra</span>
                    <p className="text-xs font-sans font-semibold text-[var(--pm-text-primary)] mt-0.5">{target?.barNumber || ''}</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--pm-text-dim)] font-sans leading-relaxed">
                  ¿Eliminar definitivamente esta barra del registro? Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                  >Cancelar</button>
                  <button type="button" onClick={() => handleDeleteBar(confirmDeleteId)}
                    className="flex-1 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                    style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--pm-accent-red)', border: '1px solid rgba(239,68,68,0.3)' }}
                  ><Trash2 className="w-3.5 h-3.5 inline mr-1" /> Eliminar</button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Delete status overlay */}
      <AnimatePresence>
        {deleteStatus !== 'idle' && (
          <motion.div key="del-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-xs glass-panel rounded-2xl p-8 flex flex-col items-center gap-4"
            >
              {deleteStatus === 'deleting' ? (
                <><div className="w-10 h-10 border-2 border-[var(--pm-accent-red)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono text-[var(--pm-text-dim)]">Eliminando...</span></>
              ) : (
                <><div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.25)' }}>
                  <Check className="w-7 h-7 text-[var(--pm-accent-emerald)]" strokeWidth={2.5} /></div>
                  <span className="text-sm font-sans font-bold text-[var(--pm-accent-emerald)]">Barra Eliminada</span></>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[9px] text-[var(--pm-text-dim)] font-mono text-center opacity-50">
        Datos actualizados en tiempo real · Bandes v2 Premium · {totalBars} barras · {formatNumber(totalFineWeight, 2)} g FA
      </p>
    </motion.div>
  );
}
