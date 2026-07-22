'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useClients } from '@/hooks/useClients';
import {
  useBars,
  useCreateBar,
  useBulkUploadBars,
  useUpdateBar,
} from '@/hooks/useBars';
import { api } from '@/lib/api';
import { useRole } from '@/context/RoleContext';
import { formatWeight } from '@/lib/format';
import type { WeightUnit } from '@/lib/format';
import type { Bar, BulkUploadResult } from '@/types/api';
import { TacticalCard } from '@/components/tactical/TacticalCard';
import { ScannerTable, type ColumnDef } from '@/components/tactical/ScannerTable';
import { TerminalPanel } from '@/components/tactical/TerminalPanel';
import { HudButton } from '@/components/tactical/HudButton';
import { MetricsHUD } from '@/components/tactical/MetricsHUD';
import {
  Pencil,
  Trash2,
  Check,
  Upload,
  Download,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Plus,
  Weight,
  Microscope,
} from 'lucide-react';

type IngestStep = 'CLIENTE' | 'CODIGO' | 'PESO' | 'PUREZA' | 'LEY_AG' | 'CONFIRMAR';

const STEPS: IngestStep[] = ['CLIENTE', 'CODIGO', 'PESO', 'PUREZA', 'LEY_AG', 'CONFIRMAR'];

const STATUS_LABELS: Record<string, string> = {
  IN_STOCK: 'VALIDADO',
  PROCESANDO: 'EN PROCESO',
  COMPLETADO: 'VALIDADO',
  EXITED: 'EGRESADO',
};

function formatRif(raw: string) {
  if (raw.length !== 10) return raw;
  return `${raw[0]}-${raw.slice(1, 9)}-${raw[9]}`;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    IN_STOCK: 'text-[var(--tac-accent-green)] border-[var(--tac-accent-green)]/30 bg-[var(--tac-accent-green)]/10',
    PROCESANDO: 'text-[var(--tac-accent-cyan)] border-[var(--tac-accent-cyan)]/30 bg-[var(--tac-accent-cyan)]/10',
    COMPLETADO: 'text-[var(--tac-accent-green)] border-[var(--tac-accent-green)]/30 bg-[var(--tac-accent-green)]/10',
    EXITED: 'text-[var(--tac-text-dim)] border-[var(--tac-border)] bg-[var(--tac-bg-tertiary)]',
  };
  return map[status] || map.IN_STOCK;
}

export default function IngresosPage() {
  const { data: clients = [] } = useClients({ role: 'PROVEEDOR' });
  const { data: bars = [], isLoading: barsLoading } = useBars();
  const createBar = useCreateBar();
  const updateBar = useUpdateBar();
  const bulkUploadMutation = useBulkUploadBars();

  const { hasRole } = useRole();
  const canAdminister = hasRole('ADMIN', 'OWNER', 'SUPERADMIN');
  const canDelete = hasRole('OWNER', 'SUPERADMIN');

  const [showTerminal, setShowTerminal] = useState(false);
  const [editingBar, setEditingBar] = useState<Bar | null>(null);
  const [step, setStep] = useState<IngestStep>('CLIENTE');
  const [clientId, setClientId] = useState('');
  const [barNumber, setBarNumber] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('g');
  const [purity, setPurity] = useState('');
  const [leyAg, setLeyAg] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<{ barNumber: string } | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkClientId, setBulkClientId] = useState('');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkError, setBulkError] = useState('');
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null);

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showTerminal && inputRef.current) inputRef.current.focus();
  }, [showTerminal, step]);

  useEffect(() => {
    if (clients.length > 0) {
      if (!clientId) setClientId(clients[0].id);
      const acc: Record<string, boolean> = {};
      clients.forEach(c => { acc[c.id] = true; });
      setOpenAccordions(prev => {
        const hasAll = clients.every(c => prev[c.id] !== undefined);
        return hasAll ? prev : { ...prev, ...acc };
      });
    }
  }, [clients]);

  const liveFA = useMemo(() => {
    const wRaw = parseFloat(grossWeight);
    if (isNaN(wRaw)) return 0;
    const w = weightUnit === 'kg' ? wRaw * 1000 : wRaw;
    const p = parseFloat(purity);
    if (isNaN(p)) return 0;
    return w * (p / 1000);
  }, [grossWeight, purity, weightUnit]);

  const liveFE = useMemo(() => liveFA * 0.99, [liveFA]);
  const liveFAkg = useMemo(() => liveFA / 1000, [liveFA]);

  const openTerminal = (bar?: Bar) => {
    if (bar) {
      setEditingBar(bar);
      setClientId(bar.clientId);
      setBarNumber(bar.barNumber);
      setGrossWeight(bar.grossWeight.toString());
      setWeightUnit('g');
      setPurity(bar.purity.toString());
      setLeyAg((bar.leyAg || '').toString());
      setStep('CONFIRMAR');
    } else {
      setEditingBar(null);
      setClientId(clients[0]?.id || '');
      setBarNumber('');
      setGrossWeight('');
      setWeightUnit('g');
      setPurity('');
      setLeyAg('');
      setStep('CLIENTE');
    }
    setFormError('');
    setFormSuccess('');
    setShowTerminal(true);
  };

  const closeTerminal = () => {
    setShowTerminal(false);
    setEditingBar(null);
    setStep('CLIENTE');
    setBarNumber('');
    setGrossWeight('');
    setPurity('');
    setLeyAg('');
    setFormError('');
    setFormSuccess('');
  };

  const advanceStep = () => {
    setFormError('');
    if (step === 'CLIENTE') {
      if (!clientId) { setFormError('SELECCIONE UN PROVEEDOR'); return; }
      setStep('CODIGO');
    } else if (step === 'CODIGO') {
      if (!barNumber.trim()) { setFormError('INGRESE UN CÓDIGO DE BARRA'); return; }
      const code = barNumber.toUpperCase().trim();
      const existing = bars.find(b => b.clientId === clientId && b.barNumber.toUpperCase() === code);
      if (existing) { setFormError(`CÓDIGO DUPLICADO — ${code} YA EXISTE PARA ESTE CLIENTE`); return; }
      setStep('PESO');
    } else if (step === 'PESO') {
      const w = parseFloat(grossWeight);
      if (isNaN(w) || w <= 0) { setFormError('INGRESE UN PESO VÁLIDO'); return; }
      setStep('PUREZA');
    } else if (step === 'PUREZA') {
      const p = parseFloat(purity);
      if (isNaN(p) || p < 0 || p > 1000) { setFormError('PUREZA DEBE SER 0–1000‰'); return; }
      setStep('LEY_AG');
    } else if (step === 'LEY_AG') {
      const ag = parseFloat(leyAg) || 0;
      if (ag < 0 || ag > 1000) { setFormError('LEY AG DEBE SER 0–1000‰'); return; }
      setStep('CONFIRMAR');
    }
  };

  const prevStep = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step !== 'CONFIRMAR') advanceStep();
    if (e.key === 'Escape') closeTerminal();
  };

  const handleSubmit = async () => {
    setFormError('');
    setIsSubmitting(true);
    const wRaw = parseFloat(grossWeight);
    const w = weightUnit === 'kg' ? wRaw * 1000 : wRaw;
    const p = parseFloat(purity);
    const ag = parseFloat(leyAg) || 0;
    const code = barNumber.toUpperCase().trim();

    try {
      if (editingBar) {
        await updateBar.mutateAsync({
          id: editingBar.id,
          data: { grossWeight: w, purity: p, leyAg: ag || undefined },
        });
        setFormSuccess('BARRA ACTUALIZADA');
      } else {
        await createBar.mutateAsync({
          barNumber: code,
          grossWeight: w,
          purity: p,
          clientId,
          leyAg: ag || undefined,
        });
        setIngestSuccess({ barNumber: code });
        setTimeout(() => setIngestSuccess(null), 1500);
      }
      setIsSubmitting(false);
      if (editingBar) {
        setTimeout(() => { closeTerminal(); setFormSuccess(''); }, 1200);
      } else {
        setBarNumber('');
        setGrossWeight('');
        setPurity('');
        setLeyAg('');
        setStep('CLIENTE');
      }
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'ERROR AL PROCESAR INGESTA');
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkClientId || !bulkFile) return;
    setBulkError('');
    setBulkResult(null);
    if (bulkFile.size > 10 * 1024 * 1024) {
      setBulkError('EL ARCHIVO EXCEDE 10 MB');
      return;
    }
    const formData = new FormData();
    formData.append('file', bulkFile);
    formData.append('clientId', bulkClientId);
    try {
      const result = await bulkUploadMutation.mutateAsync(formData);
      setBulkResult(result);
      setBulkFile(null);
      const fi = document.getElementById('bulk-file-input') as HTMLInputElement;
      if (fi) fi.value = '';
    } catch (e: any) {
      setBulkError(e?.response?.data?.message || 'ERROR EN CARGA MASIVA');
    }
  };

  const downloadTemplate = async () => {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Plantilla Carga Masiva');
    sheet.columns = [
      { header: 'CÓDIGO', key: 'code', width: 22 },
      { header: 'PESO BRUTO (g)', key: 'grossWeight', width: 18 },
      { header: 'PUREZA (‰)', key: 'purity', width: 15 },
      { header: 'LEY Ag (‰)', key: 'leyAg', width: 15 },
    ];
    const hr = sheet.getRow(1);
    hr.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    hr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C1C1C' } };
    hr.alignment = { horizontal: 'center' };
    sheet.addRow(['', '', '', '']);
    const nr = sheet.getRow(2);
    nr.getCell(1).value = '* CÓDIGO, PESO BRUTO y PUREZA son obligatorios';
    nr.getCell(1).font = { italic: true, color: { argb: 'FF8C8C8C' }, size: 9 };
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-carga-masiva.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteBar = async (id: string) => {
    setConfirmDeleteId(null);
    setDeleteStatus('deleting');
    try {
      await api.delete(`/bars/${id}`);
      setDeleteStatus('success');
      setTimeout(() => setDeleteStatus('idle'), 2000);
    } catch {
      setDeleteStatus('error');
      setTimeout(() => setDeleteStatus('idle'), 2000);
    }
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
  const totalGrossWeight = bars.reduce((s, b) => s + Number(b.grossWeight), 0);
  const totalFineWeight = bars.reduce((s, b) => s + Number(b.fineWeight), 0);

  const columns: ColumnDef<Bar>[] = [
    {
      key: 'barNumber',
      label: 'CÓDIGO',
      align: 'center',
      width: '140px',
      render: r => (
        <span className="font-mono font-bold text-[var(--tac-accent-cyan)] tracking-wider">
          {r.barNumber}
        </span>
      ),
    },
    {
      key: 'grossWeight',
      label: 'BRUTO (KG)',
      align: 'right',
      render: r => (
        <span className="font-mono text-[var(--tac-text-primary)]">
          {formatWeight(Number(r.grossWeight), 'kg')}
        </span>
      ),
    },
    {
      key: 'fineWeight',
      label: 'FA (KG)',
      align: 'right',
      render: r => (
        <span className="font-mono text-[var(--tac-accent-amber)]">
          {formatWeight(Number(r.fineWeight), 'kg')}
        </span>
      ),
    },
    {
      key: 'purity',
      label: 'LEY',
      align: 'center',
      width: '80px',
      render: r => (
        <span className="font-mono text-[var(--tac-text-dim)]">
          {r.purity}‰
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      width: '120px',
      render: r => (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold border ${statusBadge(r.status)}`}>
          <span className={`w-1 h-1 rounded-full ${r.status === 'IN_STOCK' ? 'bg-[var(--tac-accent-green)]' : r.status === 'PROCESANDO' ? 'bg-[var(--tac-accent-amber)]' : r.status === 'COMPLETADO' ? 'bg-[var(--tac-accent-cyan)]' : 'bg-[var(--tac-text-dim)]'}`} />
          {STATUS_LABELS[r.status] || r.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      align: 'center',
      width: '90px',
      render: r => (
        <div className="flex items-center justify-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); openTerminal(r); }}
            disabled={r.status !== 'IN_STOCK' || !canAdminister}
            className={`p-1 transition-all ${r.status !== 'IN_STOCK' || !canAdminister ? 'opacity-30 cursor-not-allowed' : 'text-[var(--tac-text-dim)] hover:text-[var(--tac-accent-cyan)] active:scale-90'}`}
            title="Editar barra"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(r.id); }}
            disabled={r.status !== 'IN_STOCK' || !canDelete}
            className={`p-1 transition-all ${r.status !== 'IN_STOCK' || !canDelete ? 'opacity-30 cursor-not-allowed' : 'text-[var(--tac-text-dim)] hover:text-[var(--tac-accent-red)] active:scale-90'}`}
            title="Eliminar barra"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const stepLabel = (s: IngestStep) => {
    const labels: Record<IngestStep, string> = {
      CLIENTE: 'SELECCIONAR PROVEEDOR',
      CODIGO: 'CÓDIGO DE BARRA',
      PESO: 'PESO BRUTO',
      PUREZA: 'PUREZA AU (‰)',
      LEY_AG: 'LEY AG (‰)',
      CONFIRMAR: 'CONFIRMAR INGESTA',
    };
    return labels[s];
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <span className="text-[9px] font-mono font-bold text-[var(--tac-accent-cyan)] uppercase tracking-[0.2em]">
            {'>'} LOGÍSTICA DE MATERIAL — INGEST TERMINAL
          </span>
          <p className="text-[10px] font-mono text-[var(--tac-text-dim)] mt-1">
            REGISTRO FÍSICO DE BARRAS DE ORO
          </p>
        </div>
        <HudButton
          variant="primary"
          prefix=">"
          onClick={() => showTerminal ? closeTerminal() : openTerminal()}
          className="shrink-0 self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" />
          {showTerminal ? 'CERRAR TERMINAL' : 'NUEVA INGESTA'}
        </HudButton>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Terminal Panel */}
        <AnimatePresence>
          {showTerminal && (
            <motion.div
              key="terminal-panel"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="lg:col-span-2 space-y-4"
            >
              <TerminalPanel
                title={editingBar ? `EDITAR: ${editingBar.barNumber}` : 'INGESTA DE BARRAS'}
                accent={formError ? 'red' : 'cyan'}
              >
                <div className="space-y-3" onKeyDown={handleKeyDown}>
                  {/* Step progress */}
                  <div className="flex items-center gap-1 text-[8px] font-mono text-[var(--tac-text-dim)] mb-2">
                    {STEPS.map((s, i) => (
                      <React.Fragment key={s}>
                        <span className={`${i <= stepIndex ? 'text-[var(--tac-accent-cyan)]' : ''}`}>
                          [{i + 1}]
                        </span>
                        {i < STEPS.length - 1 && (
                          <span className="text-[var(--tac-border)]">-</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Step 1: CLIENTE */}
                  <div className={`transition-opacity ${stepIndex >= 0 ? step === 'CLIENTE' ? 'opacity-100' : 'opacity-40' : 'opacity-30'}`}>
                    <div className="flex items-start gap-2 text-[11px] font-mono">
                      <span className="text-[var(--tac-text-dim)] shrink-0">CLIENTE</span>
                      <span className="text-[var(--tac-accent-cyan)] shrink-0">&gt;</span>
                      {step === 'CLIENTE' ? (
                        <select
                          ref={inputRef as any}
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          className="flex-1 bg-transparent border-b border-[var(--tac-accent-cyan)]/40 text-[var(--tac-text-primary)] font-mono text-[11px] focus:outline-none focus:border-[var(--tac-accent-cyan)] pb-0.5 cursor-pointer"
                          autoFocus
                        >
                          <option value="" className="bg-[var(--tac-bg-primary)]">SELECCIONAR...</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id} className="bg-[var(--tac-bg-primary)]">
                              {formatRif(c.rif)} — {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[var(--tac-text-primary)] font-bold">
                          {clients.find(c => c.id === clientId)?.name || '—'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Step 2: CÓDIGO */}
                  {stepIndex >= 1 && (
                    <div className={`transition-opacity ${step === 'CODIGO' ? 'opacity-100' : 'opacity-40'}`}>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-[var(--tac-text-dim)] shrink-0">CÓDIGO_BARRA</span>
                        <span className="text-[var(--tac-accent-cyan)] shrink-0">&gt;</span>
                        {step === 'CODIGO' ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={barNumber}
                            onChange={(e) => setBarNumber(e.target.value.toUpperCase())}
                            className="flex-1 bg-transparent border-b border-[var(--tac-accent-cyan)]/40 text-[var(--tac-text-primary)] font-mono text-[11px] focus:outline-none focus:border-[var(--tac-accent-cyan)] px-1 pb-0.5 uppercase"
                            placeholder="BAR-XXXX-0000"
                            autoFocus
                          />
                        ) : (
                          <span className="text-[var(--tac-accent-cyan)] font-bold">{barNumber || '—'}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: PESO */}
                  {stepIndex >= 2 && (
                    <div className={`transition-opacity ${step === 'PESO' ? 'opacity-100' : 'opacity-40'}`}>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-[var(--tac-text-dim)] shrink-0">PESO_BRUTO</span>
                        <span className="text-[var(--tac-accent-cyan)] shrink-0">&gt;</span>
                        {step === 'PESO' ? (
                          <div className="flex-1 flex items-center gap-1">
                            <input
                              ref={inputRef}
                              type="number"
                              step="0.01"
                              value={grossWeight}
                              onChange={(e) => setGrossWeight(e.target.value)}
                              className="w-20 bg-transparent border-b border-[var(--tac-accent-cyan)]/40 text-[var(--tac-text-primary)] font-mono text-[11px] focus:outline-none focus:border-[var(--tac-accent-cyan)] px-1 pb-0.5"
                              placeholder="0.00"
                              autoFocus
                            />
                            <button
                              onClick={() => setWeightUnit(prev => prev === 'kg' ? 'g' : 'kg')}
                              className="text-[9px] font-mono font-bold px-1.5 py-0.5 border border-[var(--tac-border)] text-[var(--tac-text-dim)] hover:text-[var(--tac-accent-cyan)] hover:border-[var(--tac-accent-cyan)]/40 active:scale-95 transition-all"
                            >
                              {weightUnit}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[var(--tac-text-primary)] font-bold">
                            {grossWeight ? formatWeight(parseFloat(grossWeight), weightUnit) : '—'}
                          </span>
                        )}
                      </div>
                      {step === 'PESO' && grossWeight && purity && (
                        <div className="mt-1 ml-[100px] text-[9px] font-mono text-[var(--tac-accent-amber)]">
                          FA (kg): {formatWeight(liveFA, 'kg')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4: PUREZA */}
                  {stepIndex >= 3 && (
                    <div className={`transition-opacity ${step === 'PUREZA' ? 'opacity-100' : 'opacity-40'}`}>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-[var(--tac-text-dim)] shrink-0">PUREZA</span>
                        <span className="text-[var(--tac-accent-cyan)] shrink-0">&gt;</span>
                        {step === 'PUREZA' ? (
                          <div className="flex-1 flex items-center gap-1">
                            <input
                              ref={inputRef}
                              type="number"
                              step="1"
                              min="0"
                              max="1000"
                              value={purity}
                              onChange={(e) => setPurity(e.target.value)}
                              className="w-20 bg-transparent border-b border-[var(--tac-accent-cyan)]/40 text-[var(--tac-text-primary)] font-mono text-[11px] focus:outline-none focus:border-[var(--tac-accent-cyan)] px-1 pb-0.5"
                              placeholder="900"
                              autoFocus
                            />
                            <span className="text-[9px] text-[var(--tac-text-dim)]">‰</span>
                          </div>
                        ) : (
                          <span className="text-[var(--tac-text-primary)] font-bold">
                            {purity ? `${purity}‰` : '—'}
                          </span>
                        )}
                      </div>
                      {step === 'PUREZA' && liveFA > 0 && (
                        <div className="mt-1 ml-[100px] text-[9px] font-mono text-[var(--tac-accent-amber)]">
                          FA: {formatWeight(liveFA, 'kg')} | FE: {formatWeight(liveFE, 'kg')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 5: LEY_AG */}
                  {stepIndex >= 4 && (
                    <div className={`transition-opacity ${step === 'LEY_AG' ? 'opacity-100' : 'opacity-40'}`}>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-[var(--tac-text-dim)] shrink-0">LEY_AG</span>
                        <span className="text-[var(--tac-text-dim)]/50 shrink-0">(OPCIONAL)</span>
                        <span className="text-[var(--tac-accent-cyan)] shrink-0">&gt;</span>
                        {step === 'LEY_AG' ? (
                          <div className="flex-1 flex items-center gap-1">
                            <input
                              ref={inputRef}
                              type="number"
                              step="1"
                              min="0"
                              max="1000"
                              value={leyAg}
                              onChange={(e) => setLeyAg(e.target.value)}
                              className="w-20 bg-transparent border-b border-[var(--tac-accent-cyan)]/40 text-[var(--tac-text-primary)] font-mono text-[11px] focus:outline-none focus:border-[var(--tac-accent-cyan)] px-1 pb-0.5"
                              placeholder="40"
                              autoFocus
                            />
                            <span className="text-[9px] text-[var(--tac-text-dim)]">‰</span>
                          </div>
                        ) : (
                          <span className="text-[var(--tac-text-primary)] font-bold">
                            {leyAg ? `${leyAg}‰` : '—'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 6: CONFIRMAR */}
                  {step === 'CONFIRMAR' && (
                    <div className="space-y-3 pt-2 border-t border-[var(--tac-border)]">
                      <div className="text-[9px] font-mono text-[var(--tac-text-dim)] uppercase tracking-[0.12em]">
                        RESUMEN DE INGESTA
                      </div>
                      <div className="space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-[var(--tac-text-dim)]">CLIENTE:</span>
                          <span className="text-[var(--tac-text-primary)] font-bold">
                            {clients.find(c => c.id === clientId)?.name || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--tac-text-dim)]">BARRA:</span>
                          <span className="text-[var(--tac-accent-cyan)] font-bold">{barNumber.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--tac-text-dim)]">BRUTO:</span>
                          <span className="text-[var(--tac-text-primary)] font-bold">
                            {grossWeight ? formatWeight(parseFloat(grossWeight), weightUnit) : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--tac-text-dim)]">PUREZA:</span>
                          <span className="text-[var(--tac-text-primary)] font-bold">{purity}‰</span>
                        </div>
                        {leyAg && (
                          <div className="flex justify-between">
                            <span className="text-[var(--tac-text-dim)]">LEY AG:</span>
                            <span className="text-[var(--tac-text-primary)] font-bold">{leyAg}‰</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-[var(--tac-border)] pt-1 mt-1">
                          <span className="text-[var(--tac-text-dim)]">FA ESTIMADO:</span>
                          <span className="text-[var(--tac-accent-amber)] font-bold">
                            {formatWeight(liveFA, 'kg')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--tac-text-dim)]">FE (×0.99):</span>
                          <span className="text-[var(--tac-accent-cyan)] font-bold">
                            {formatWeight(liveFE, 'kg')}
                          </span>
                        </div>
                        {liveFA > 0 && (
                          <div className="flex justify-between">
                            <span className="text-[var(--tac-text-dim)]">MERMA ESPERADA (1%):</span>
                            <span className="text-[var(--tac-accent-green)] font-bold">
                              {formatWeight(liveFA - liveFE, 'kg')}
                            </span>
                          </div>
                        )}
                      </div>

                      {formError && (
                        <div className="p-2 border border-[var(--tac-accent-red)]/40 text-[var(--tac-accent-red)] text-[9px] font-mono">
                          ! {formError}
                        </div>
                      )}

                      {formSuccess && (
                        <div className="p-2 border border-[var(--tac-accent-green)]/40 text-[var(--tac-accent-green)] text-[9px] font-mono flex items-center gap-1">
                          <Check className="w-3 h-3" /> {formSuccess}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <HudButton variant="ghost" onClick={closeTerminal} className="flex-1">
                          CANCELAR
                        </HudButton>
                        <HudButton
                          variant="primary"
                          prefix=">"
                          loading={isSubmitting}
                          onClick={handleSubmit}
                          className="flex-1"
                        >
                          {editingBar ? 'ACTUALIZAR' : 'EJECUTAR INGESTA'}
                        </HudButton>
                      </div>
                    </div>
                  )}

                  {/* Navigation for non-confirm steps */}
                  {step !== 'CONFIRMAR' && (
                    <div className="flex items-center justify-between pt-1">
                      {step !== 'CLIENTE' ? (
                        <HudButton variant="ghost" onClick={prevStep} className="text-[9px]">
                          &lt;&lt; ANTERIOR
                        </HudButton>
                      ) : (
                        <div />
                      )}
                      <HudButton variant="primary" onClick={advanceStep} className="text-[9px]">
                        SIGUIENTE &gt;&gt;
                      </HudButton>
                    </div>
                  )}
                </div>
              </TerminalPanel>

              {/* Edit tools (matching v2 style) */}
              {step === 'CONFIRMAR' && editingBar && (
                <TerminalPanel title="HERRAMIENTAS" accent="amber">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col items-center gap-1 py-2 bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] hover:border-[var(--tac-accent-cyan)]/30 active:scale-95 transition-all cursor-pointer">
                      <Weight className="w-4 h-4 text-[var(--tac-accent-cyan)]" />
                      <span className="text-[8px] font-mono text-[var(--tac-text-dim)] uppercase">Peso</span>
                      <input type="file" accept="image/*" className="hidden" />
                    </label>
                    <label className="flex flex-col items-center gap-1 py-2 bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] hover:border-[var(--tac-accent-cyan)]/30 active:scale-95 transition-all cursor-pointer">
                      <Microscope className="w-4 h-4 text-[var(--tac-accent-cyan)]" />
                      <span className="text-[8px] font-mono text-[var(--tac-text-dim)] uppercase">Leyes</span>
                      <input type="file" accept="image/*" className="hidden" />
                    </label>
                  </div>
                </TerminalPanel>
              )}

              {/* Bulk Import */}
              <TacticalCard
                title="DATA_IMPORT"
                accent="green"
                onClick={() => setIsBulkOpen(!isBulkOpen)}
                hoverable
              >
                <div className="space-y-3">
                  {!isBulkOpen && (
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--tac-text-dim)]">
                      <span>CARGA MASIVA XLSX/CSV</span>
                      <ChevronDown className="w-3 h-3" />
                    </div>
                  )}
                  {isBulkOpen && (
                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="text-[10px] font-mono text-[var(--tac-text-dim)] flex items-center justify-between">
                        <span>CARGA MASIVA XLSX/CSV</span>
                        <ChevronUp className="w-3 h-3" />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-[var(--tac-text-dim)] uppercase">CLIENTE</span>
                        <select
                          value={bulkClientId}
                          onChange={(e) => setBulkClientId(e.target.value)}
                          className="w-full bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] px-2 py-1.5 text-[10px] font-mono text-[var(--tac-text-primary)] focus:outline-none focus:border-[var(--tac-accent-cyan)] cursor-pointer"
                        >
                          <option value="" className="bg-[var(--tac-bg-primary)]">SELECCIONAR...</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id} className="bg-[var(--tac-bg-primary)]">{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="border-2 border-dashed border-[var(--tac-border)] p-4 text-center hover:border-[var(--tac-accent-cyan)]/40 transition-colors">
                        <Upload className="w-6 h-6 text-[var(--tac-accent-green)] mx-auto mb-1" />
                        <label className="flex flex-col items-center gap-1 cursor-pointer">
                          <span className="text-[10px] font-mono text-[var(--tac-text-primary)]">
                            {bulkFile ? bulkFile.name : 'SELECCIONAR ARCHIVO'}
                          </span>
                          <span className="text-[8px] font-mono text-[var(--tac-text-dim)]">
                            {bulkFile ? `${(bulkFile.size / 1024).toFixed(1)} KB` : '.xlsx, .csv — máx 10 MB'}
                          </span>
                          <input
                            id="bulk-file-input"
                            type="file"
                            accept=".xlsx,.csv"
                            onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {bulkError && (
                        <div className="p-2 border border-[var(--tac-accent-red)]/40 text-[var(--tac-accent-red)] text-[9px] font-mono">
                          ! {bulkError}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <HudButton
                          variant="primary"
                          onClick={handleBulkUpload}
                          disabled={!bulkClientId || !bulkFile}
                          loading={bulkUploadMutation.isPending}
                          className="flex-1 text-[9px]"
                        >
                          <Upload className="w-3 h-3" />
                          SUBIR ARCHIVO
                        </HudButton>
                        <HudButton variant="ghost" onClick={downloadTemplate} className="text-[9px]">
                          <Download className="w-3 h-3" />
                          PLANTILLA
                        </HudButton>
                      </div>
                    </div>
                  )}
                </div>
              </TacticalCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inventory Table */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className={`${showTerminal ? 'lg:col-span-3' : 'lg:col-span-5'} space-y-4`}
        >
          <TacticalCard title={`BARRAS EN BÓVEDA — ${totalBars} REGISTROS`} accent="cyan">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="BUSCAR POR CÓDIGO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-56 bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] pl-2 pr-2 py-1.5 text-[10px] font-mono text-[var(--tac-text-primary)] focus:outline-none focus:border-[var(--tac-accent-cyan)] placeholder:text-[var(--tac-text-dim)]/30"
                />
              </div>
            </div>

            {barsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-[var(--tac-text-dim)]">
                <span className="w-2 h-2 rounded-full bg-[var(--tac-accent-amber)] animate-pulse mb-2" />
                <span className="text-[10px] font-mono">CARGANDO INVENTARIO...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {clients.map(client => {
                  const groupBars = barsByClient[client.id] || [];
                  const isExpanded = openAccordions[client.id];
                  const totalW = groupBars.reduce((sum, b) => sum + Number(b.grossWeight), 0);
                  const totalFA = groupBars.reduce((sum, b) => sum + Number(b.fineWeight), 0);

                  return (
                    <div key={client.id} className="bg-[var(--tac-bg-secondary)] border border-[var(--tac-border)]">
                      <button
                        onClick={() => toggleAccordion(client.id)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[var(--tac-bg-tertiary)] transition-colors active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 border border-[var(--tac-accent-cyan)]/30 bg-[var(--tac-bg-primary)] flex items-center justify-center font-bold text-[10px] text-[var(--tac-accent-cyan)]">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-[var(--tac-text-primary)] uppercase tracking-wider">
                              {client.name}
                            </span>
                            <span className="text-[8px] font-mono text-[var(--tac-text-dim)] ml-2">
                              {formatRif(client.rif)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block">
                            <span className="text-[8px] text-[var(--tac-text-dim)]/50 block uppercase font-mono">BRUTO / FA</span>
                            <span className="text-[9px] font-mono font-bold text-[var(--tac-accent-amber)]">
                              {formatWeight(totalW, 'kg')} / {formatWeight(totalFA, 'kg')}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-[var(--tac-text-dim)] bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] px-2 py-0.5">
                            {groupBars.length} u
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 text-[var(--tac-text-dim)]" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-[var(--tac-text-dim)]" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-[var(--tac-border)] bg-[var(--tac-bg-primary)]/30">
                          {groupBars.length === 0 ? (
                            <div className="text-center py-6 text-[10px] font-mono text-[var(--tac-text-dim)]">
                              NO HAY BARRAS REGISTRADAS PARA ESTE CLIENTE
                            </div>
                          ) : (
                            <ScannerTable
                              columns={columns}
                              data={groupBars}
                              keyExtractor={b => b.id}
                              emptyMessage="NO HAY BARRAS"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TacticalCard>

          {/* Metrics Row */}
          <MetricsHUD
            items={[
              {
                key: 'total-bars',
                label: 'TOTAL BARRAS',
                value: `${totalBars} u`,
                accent: 'cyan',
              },
              {
                key: 'total-gross',
                label: 'MASA BRUTA',
                value: formatWeight(totalGrossWeight, 'kg'),
                accent: 'cyan',
              },
              {
                key: 'total-fa',
                label: 'TOTAL FA AU',
                value: formatWeight(totalFineWeight, 'kg'),
                accent: 'amber',
              },
              {
                key: 'avg-purity',
                label: 'PUREZA PROMEDIO',
                value: bars.length > 0
                  ? `${(bars.reduce((s, b) => s + Number(b.purity), 0) / bars.length).toFixed(0)}‰`
                  : '—',
                accent: 'green',
              },
            ]}
            cols={4}
          />
        </motion.div>
      </div>

      {/* Ingest Success Overlay */}
      <AnimatePresence>
        {ingestSuccess && (
          <motion.div
            key="ingest-success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm"
            >
              <TacticalCard accent="green" className="shadow-[0_0_40px_rgba(57,255,20,0.08)]">
                <div className="flex flex-col items-center py-6 space-y-4 text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                    className="w-14 h-14 border-2 border-[var(--tac-accent-green)]/40 flex items-center justify-center"
                  >
                    <Check className="w-7 h-7 text-[var(--tac-accent-green)]" strokeWidth={2.5} />
                  </motion.div>
                  <div>
                    <span className="text-[9px] font-mono font-bold text-[var(--tac-accent-green)] uppercase tracking-[0.15em]">
                      INGESTA COMPLETA
                    </span>
                    <h3 className="text-sm font-mono font-bold text-[var(--tac-text-primary)] mt-1">
                      {ingestSuccess.barNumber}
                    </h3>
                  </div>
                  <p className="text-[10px] font-mono text-[var(--tac-text-dim)]">
                    BARRA REGISTRADA EN EL SISTEMA
                  </p>
                </div>
              </TacticalCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {confirmDeleteId && (() => {
          const target = bars.find(b => b.id === confirmDeleteId);
          if (!target) return null;
          return (
            <motion.div
              key="delete-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md"
              >
                <TacticalCard accent="red" className="shadow-[0_0_40px_rgba(255,51,85,0.12)]">
                  <div className="space-y-4 text-center">
                    <div className="w-10 h-10 mx-auto border-2 border-[var(--tac-accent-red)] flex items-center justify-center">
                      <span className="text-[var(--tac-accent-red)] font-mono font-bold text-lg">!</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-bold text-[var(--tac-accent-red)] uppercase tracking-[0.15em]">
                        ADVERTENCIA
                      </span>
                      <h3 className="text-sm font-mono font-bold text-[var(--tac-text-primary)] mt-1">
                        ELIMINAR BARRA DEL REGISTRO
                      </h3>
                    </div>
                    <div className="bg-[var(--tac-bg-primary)] p-3 space-y-1 text-[10px] font-mono text-left">
                      <div className="flex justify-between">
                        <span className="text-[var(--tac-text-dim)]">BARRA:</span>
                        <span className="text-[var(--tac-accent-cyan)] font-bold">{target.barNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--tac-text-dim)]">PESO:</span>
                        <span className="text-[var(--tac-text-primary)] font-bold">{formatWeight(Number(target.grossWeight), 'kg')}</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-mono text-[var(--tac-text-dim)] leading-relaxed">
                      Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <HudButton variant="ghost" onClick={() => setConfirmDeleteId(null)} className="flex-1">
                        CANCELAR
                      </HudButton>
                      <HudButton variant="danger" prefix="!" onClick={() => handleDeleteBar(confirmDeleteId)} className="flex-1">
                        CONFIRMAR
                      </HudButton>
                    </div>
                  </div>
                </TacticalCard>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Delete status overlay */}
      <AnimatePresence>
        {deleteStatus !== 'idle' && (
          <motion.div
            key="delete-status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm"
            >
              <TacticalCard accent={deleteStatus === 'deleting' ? 'amber' : deleteStatus === 'success' ? 'green' : 'red'}>
                <div className="flex flex-col items-center py-4 space-y-3">
                  {deleteStatus === 'deleting' && (
                    <>
                      <span className="w-8 h-8 border-2 border-[var(--tac-accent-amber)] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-mono text-[var(--tac-text-dim)]">ELIMINANDO BARRA...</span>
                    </>
                  )}
                  {deleteStatus === 'success' && (
                    <>
                      <Check className="w-8 h-8 text-[var(--tac-accent-green)]" />
                      <span className="text-[10px] font-mono text-[var(--tac-accent-green)]">BARRA ELIMINADA</span>
                    </>
                  )}
                  {deleteStatus === 'error' && (
                    <>
                      <span className="text-[var(--tac-accent-red)] font-mono font-bold text-lg">!</span>
                      <span className="text-[10px] font-mono text-[var(--tac-accent-red)]">ERROR AL ELIMINAR</span>
                    </>
                  )}
                </div>
              </TacticalCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk result overlay */}
      <AnimatePresence>
        {bulkResult && (
          <motion.div
            key="bulk-result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <TacticalCard accent={bulkResult.errors.length > 0 ? 'amber' : 'green'}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 border-2 flex items-center justify-center ${bulkResult.errors.length > 0 ? 'border-[var(--tac-accent-amber)]/40' : 'border-[var(--tac-accent-green)]/40'}`}>
                      {bulkResult.errors.length > 0
                        ? <AlertTriangle className="w-5 h-5 text-[var(--tac-accent-amber)]" />
                        : <Check className="w-5 h-5 text-[var(--tac-accent-green)]" />
                      }
                    </div>
                    <div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 font-bold uppercase tracking-[0.12em] border ${bulkResult.errors.length > 0 ? 'text-[var(--tac-accent-amber)] border-[var(--tac-accent-amber)]/30' : 'text-[var(--tac-accent-green)] border-[var(--tac-accent-green)]/30'}`}>
                        {bulkResult.errors.length > 0 ? 'CARGA PARCIAL' : 'CARGA EXITOSA'}
                      </span>
                      <h3 className="text-xs font-mono font-bold text-[var(--tac-text-primary)] mt-1">RESULTADO DE CARGA MASIVA</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] p-3 text-center">
                      <span className="text-[8px] text-[var(--tac-text-dim)] font-mono uppercase block">CREADAS</span>
                      <strong className="text-lg font-bold text-[var(--tac-accent-green)]">{bulkResult.created}</strong>
                    </div>
                    <div className="bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] p-3 text-center">
                      <span className="text-[8px] text-[var(--tac-text-dim)] font-mono uppercase block">ERRORES</span>
                      <strong className="text-lg font-bold text-[var(--tac-accent-amber)]">{bulkResult.errors.length}</strong>
                    </div>
                  </div>

                  {bulkResult.errors.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      <span className="text-[9px] font-mono text-[var(--tac-text-dim)] uppercase">DETALLE DE ERRORES</span>
                      {bulkResult.errors.map((err, i) => (
                        <div key={i} className="p-1.5 border border-[var(--tac-accent-red)]/30 text-[9px] font-mono text-[var(--tac-accent-red)] bg-[var(--tac-accent-red)]/5">
                          FILA {err.row}: {err.message}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <HudButton variant="primary" onClick={() => setBulkResult(null)}>
                      ACEPTAR
                    </HudButton>
                  </div>
                </div>
              </TacticalCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Status Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-3 text-[8px] font-mono text-[var(--tac-text-dim)] border-t border-[var(--tac-border)] pt-3"
      >
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-[var(--tac-accent-green)] animate-pulse" />
          DB ONLINE
        </span>
        <span>{totalBars} BARRAS EN BÓVEDA</span>
        <span>{formatWeight(totalFineWeight, 'kg')} FA TOTAL</span>
        <span>{clients.length} PROVEEDORES</span>
      </motion.div>
    </motion.div>
  );
}
