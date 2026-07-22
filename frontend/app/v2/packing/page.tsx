'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useClients } from '@/hooks/useClients';
import { useBars, useCreateBar, useBulkUploadBars } from '@/hooks/useBars';
import { usePackings, usePacking, useValidatePacking, useCreatePacking, useFinalizePacking } from '@/hooks/usePackings';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import type { Bar, BulkUploadResult } from '@/types/api';
import {
  Camera, Scale, FolderUp, FileSpreadsheet, Plus, Upload, Download, ChevronDown, ChevronUp,
  Search, Trash2, AlertTriangle, Check, Weight, Microscope, X, Package, Zap,
  ClipboardCheck, HardDrive, Edit3, Image,
} from 'lucide-react';
import { HudButton } from '@/components/tactical/HudButton';
import { CameraTerminal } from '@/components/tactical/CameraTerminal';

const STATUS_LABELS: Record<string, string> = {
  POR_VALIDAR: 'POR VALIDAR',
  IN_STOCK: 'VALIDADO',
  PROCESANDO: 'EN PROCESO',
  COMPLETADO: 'VALIDADO',
  EXITED: 'EGRESADO',
};

const STATUS_STYLES: Record<string, string> = {
  POR_VALIDAR: 'text-[var(--pm-accent-amber)] border-[var(--pm-accent-amber)]/25 bg-[var(--pm-accent-amber)]/10',
  IN_STOCK: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10',
  PROCESANDO: 'text-cyan-400 border-cyan-500/25 bg-cyan-500/10',
  COMPLETADO: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10',
  EXITED: 'text-[var(--pm-text-dim)] border-[var(--pm-border)] bg-[var(--pm-bg-tertiary)]',
};

const PAGE_SIZE = 10;

export default function PackingPage() {
  const [activeTab, setActiveTab] = useState<'registro' | 'validacion'>('registro');
  const { data: clients = [] } = useClients({ role: 'PROVEEDOR' });
  const { data: bars = [] } = useBars({ includePorValidar: true });
  const { data: packings = [] } = usePackings();
  const createBar = useCreateBar();
  const bulkUploadMutation = useBulkUploadBars();


  const [clientId, setClientId] = useState('');
  const [barNumber, setBarNumber] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [purity, setPurity] = useState('');
  const [leyAg, setLeyAg] = useState('');
  const [formError, setFormError] = useState('');

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

  const [selectedPackingId, setSelectedPackingId] = useState<string | null>(null);
  const { data: selectedPacking } = usePacking(selectedPackingId);
  const validatePacking = useValidatePacking();
  const finalizePacking = useFinalizePacking();
  const [validationEdits, setValidationEdits] = useState<Record<string, { barNumber: string; grossWeight: string; purity: string; leyAg: string }>>({});
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ total: number; success: number; error: number } | null>(null);
  const [confirmFinalizeModal, setConfirmFinalizeModal] = useState(false);
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    barId: string;
    basculaWeight: string;
    leyAu: string;
    leyAg: string;
  } | null>(null);
  const [cameraMode, setCameraMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoUploadedUrl, setPhotoUploadedUrl] = useState<string | null>(null);
  const [evidenceBarId, setEvidenceBarId] = useState<string | null>(null);
  const [barPhotoUrls, setBarPhotoUrls] = useState<Record<string, string>>({});
  const spValuesRef = useRef<Record<string, { grossWeight: number; purity: number; leyAg?: number }>>({});
  const createPacking = useCreatePacking();
  const [confirmRegOverlay, setConfirmRegOverlay] = useState<{
    barNumber: string;
    grossWeight: number;
    purity: number;
    leyAg?: number;
    clientId: string;
    packingNumber: number;
    packingId: string | null;
    clientName: string;
  } | null>(null);
  const [confirmBulkOverlay, setConfirmBulkOverlay] = useState<{
    clientId: string;
    packingNumber: number;
    packingId: string | null;
    clientName: string;
  } | null>(null);

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

  // Reset validation edits when packing changes
  useEffect(() => {
    if (selectedPacking?.bars) {
      const edits: Record<string, { barNumber: string; grossWeight: string; purity: string; leyAg: string }> = {};
      const sp: Record<string, { grossWeight: number; purity: number; leyAg?: number }> = {};
      selectedPacking.bars.forEach(b => {
        edits[b.id] = {
          barNumber: b.barNumber,
          grossWeight: String(Number(b.grossWeight)),
          purity: String(Number(b.purity)),
          leyAg: b.leyAg != null ? String(Number(b.leyAg)) : '',
        };
        sp[b.id] = {
          grossWeight: Number(b.grossWeight),
          purity: Number(b.purity),
          leyAg: b.leyAg != null ? Number(b.leyAg) : undefined,
        };
      });
      setValidationEdits(edits);
      spValuesRef.current = sp;
      setValidationResult(null);
    }
  }, [selectedPacking]);

  const liveFA = useMemo(() => {
    const w = parseFloat(grossWeight);
    if (isNaN(w)) return 0;
    const p = parseFloat(purity);
    if (isNaN(p)) return 0;
    return w * (p / 1000);
  }, [grossWeight, purity]);

  const liveFE = useMemo(() => liveFA * 0.99, [liveFA]);

  const liveAg = useMemo(() => {
    const w = parseFloat(grossWeight);
    if (isNaN(w)) return 0;
    const la = parseFloat(leyAg);
    if (isNaN(la)) return 0;
    return w * (la / 1000);
  }, [grossWeight, leyAg]);

  const weightWarning = useMemo(() => {
    const w = parseFloat(grossWeight);
    if (isNaN(w)) return false;
    return w > 24900;
  }, [grossWeight]);

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
    if (!barNumber.trim() || !grossWeight || !purity || !clientId) {
      setFormError('Complete todos los campos obligatorios.');
      return;
    }
    const g = parseFloat(grossWeight);
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
      const info = await api.get(`/packings/next-info/${clientId}`).then(r => r.data);
      setConfirmRegOverlay({
        barNumber: code,
        grossWeight: g,
        purity: p,
        leyAg: ag || undefined,
        clientId,
        packingNumber: info.packingNumber,
        packingId: info.packingId,
        clientName: info.clientName,
      });
    } catch (err: any) {
      setFormError('Error al obtener información del packing.');
    }
  };

  const handleConfirmBarRegistration = async () => {
    if (!confirmRegOverlay) return;
    const { barNumber, grossWeight, purity, leyAg, clientId, packingNumber, packingId } = confirmRegOverlay;

    let targetPackingId = packingId;
    if (!targetPackingId) {
      try {
        const packing = await createPacking.mutateAsync({ fileName: `PACKING #${packingNumber}`, clientId });
        targetPackingId = packing.id;
      } catch (err) {
        setFormError('Error al crear el packing.');
        setConfirmRegOverlay(null);
        return;
      }
    }

    setConfirmRegOverlay(null);
    try {
      await createBar.mutateAsync({ barNumber, grossWeight, purity, clientId, leyAg, packingId: targetPackingId });
      setIngestStatus({ barNumber, status: 'ingesting' });
      setBarNumber(''); setGrossWeight(''); setPurity(''); setLeyAg('');
      setTimeout(() => setIngestStatus({ barNumber, status: 'success' }), 800);
      setTimeout(() => setIngestStatus(null), 2800);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Error al registrar la barra.');
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkClientId || !bulkFile) return;
    setBulkError(''); setBulkResult(null);
    if (bulkFile.size > 10 * 1024 * 1024) { setBulkError('Archivo excede 10 MB.'); return; }
    try {
      const info = await api.get(`/packings/next-info/${bulkClientId}`).then(r => r.data);
      setConfirmBulkOverlay({
        clientId: bulkClientId,
        packingNumber: info.packingNumber,
        packingId: info.packingId,
        clientName: info.clientName,
      });
    } catch (e) {
      setBulkError('Error al obtener información del packing.');
    }
  };

  const handleConfirmBulkUpload = async () => {
    if (!confirmBulkOverlay || !bulkFile) return;
    const { clientId, packingNumber, packingId } = confirmBulkOverlay;

    let targetPackingId = packingId;
    if (!targetPackingId) {
      try {
        const packing = await createPacking.mutateAsync({ fileName: `PACKING #${packingNumber}`, clientId });
        targetPackingId = packing.id;
      } catch (err) {
        setBulkError('Error al crear el packing.');
        setConfirmBulkOverlay(null);
        return;
      }
    }

    setConfirmBulkOverlay(null);
    const fd = new FormData();
    fd.append('file', bulkFile); fd.append('clientId', clientId);
    if (targetPackingId) fd.append('packingId', targetPackingId);
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
    setFormError('');
  };

  // Validation handlers
  const handleEditChange = (barId: string, field: string, value: string) => {
    setValidationEdits(prev => ({
      ...prev,
      [barId]: { ...prev[barId], [field]: value },
    }));
  };

  const computeDelta = (bar: Bar) => {
    const edit = validationEdits[bar.id];
    if (!edit) return 0;
    const orig = Number(bar.grossWeight);
    const phys = parseFloat(edit.grossWeight);
    if (isNaN(phys)) return 0;
    return phys - orig;
  };

  const handleRowSelect = (barId: string, status: string) => {
    if (status !== 'POR_VALIDAR') return;
    setSelectedBarId(prev => prev === barId ? null : barId);
  };

  const handleConfirmBar = () => {
    if (!selectedBarId || !selectedPacking?.bars) return;
    const bar = selectedPacking.bars.find(b => b.id === selectedBarId);
    if (!bar) return;
    resetPhotoState();
    setConfirmModal({
      barId: selectedBarId,
      basculaWeight: String(Number(bar.grossWeight)),
      leyAu: String(Number(bar.purity)),
      leyAg: bar.leyAg != null ? String(Number(bar.leyAg)) : '',
    });
  };

  const handleSyncValidate = async () => {
    if (!confirmModal || !selectedPacking) return;
    const { barId, basculaWeight, leyAu, leyAg } = confirmModal;
    const bw = parseFloat(basculaWeight);
    const la = parseFloat(leyAu);
    const lag = parseFloat(leyAg) || 0;
    if (isNaN(bw) || isNaN(la)) return;

    handleEditChange(barId, 'grossWeight', basculaWeight);
    handleEditChange(barId, 'purity', leyAu);
    if (leyAg) handleEditChange(barId, 'leyAg', leyAg);

    let url = photoUploadedUrl;
    if ((!url || url.startsWith('data:')) && photoBlob) {
      url = await uploadPhoto(photoBlob);
    }

    const apiUrl = url || undefined;

    try {
      await validatePacking.mutateAsync({
        id: selectedPacking.id,
        bars: [{ barId, grossWeight: bw, purity: la, leyAg: lag > 0 ? lag : undefined, photoUrl: apiUrl }],
      });
      if (url) {
        setBarPhotoUrls(prev => ({ ...prev, [barId]: url }));
      }
      setConfirmModal(null);
      setSelectedBarId(null);
      resetPhotoState();
    } catch (err) {
      console.error('Sync error:', err);
    }
  };

  const uploadPhoto = useCallback(async (blob: Blob): Promise<string> => {
    const fd = new FormData();
    fd.append('file', blob, `photo-${Date.now()}.jpg`);
    const res = await fetch('/api/blob/upload', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Error al subir la foto');
    const data = await res.json();
    return data.url as string;
  }, []);

  const handleCapture = useCallback(async (blob: Blob) => {
    const localUrl = URL.createObjectURL(blob);
    setPhotoBlob(blob);
    setPhotoPreviewUrl(localUrl);
    setCameraMode('preview');
    try {
      const url = await uploadPhoto(blob);
      setPhotoUploadedUrl(url);
      if (confirmModal) {
        setBarPhotoUrls(prev => ({ ...prev, [confirmModal.barId]: url }));
      }
    } catch (err) {
      console.error('Auto-upload failed, will retry on sync:', err);
    }
  }, [uploadPhoto, confirmModal]);

  const resetPhotoState = useCallback(() => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoBlob(null);
    setPhotoPreviewUrl(null);
    setPhotoUploadedUrl(null);
    setCameraMode('idle');
  }, [photoPreviewUrl]);

  const modalLiveFA = useMemo(() => {
    if (!confirmModal) return 0;
    const w = parseFloat(confirmModal.basculaWeight);
    const p = parseFloat(confirmModal.leyAu);
    if (isNaN(w) || isNaN(p)) return 0;
    return w * (p / 1000);
  }, [confirmModal]);

  const pendingPackings = useMemo(() =>
    packings.filter(p => p.status === 'PENDING'),
  [packings]);

  const validatedCount = useMemo(() =>
    selectedPacking?.bars?.filter(b => b.status !== 'POR_VALIDAR').length ?? 0,
  [selectedPacking]);

  const totalCount = selectedPacking?.bars?.length ?? 0;
  const allBarsValidated = totalCount > 0 && validatedCount === totalCount;
  const packingStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    packings.forEach(p => { map[p.id] = p.status; });
    return map;
  }, [packings]);

  const handleConfirmFinalize = async () => {
    if (!selectedPacking) return;
    setConfirmFinalizeModal(false);
    setValidating(true);
    try {
      await finalizePacking.mutateAsync(selectedPacking.id);
      setValidationResult({ total: totalCount, success: validatedCount, error: 0 });
      setTimeout(() => { setSelectedPackingId(null); setValidationResult(null); }, 3000);
    } catch (err: any) {
      console.error('Finalize error:', err);
    } finally {
      setValidating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-sans font-medium text-[var(--pm-text-primary)] tracking-tight flex items-center gap-2">
          <FolderUp className="w-8 h-8 text-[var(--pm-accent-gold)] drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
          Packing
          <span className="text-[var(--pm-accent-gold)] font-semibold ml-1">— Recepción de Material</span>
        </h1>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-1 glass-panel rounded-xl border border-[var(--pm-border)]/40 p-1 w-fit">
        <button onClick={() => { setActiveTab('registro'); setSelectedPackingId(null); }}
          className={`px-5 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer
            ${activeTab === 'registro' ? 'bg-[var(--pm-accent-gold)]/15 text-[var(--pm-accent-gold)] border border-[var(--pm-accent-gold)]/25 shadow-[0_0_12px_rgba(212,175,55,0.1)]' : 'text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)]'}`}>
          <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1.5" />
          Registro de Packing
        </button>
        <button onClick={() => setActiveTab('validacion')}
          className={`px-5 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer
            ${activeTab === 'validacion' ? 'bg-[var(--pm-accent-gold)]/15 text-[var(--pm-accent-gold)] border border-[var(--pm-accent-gold)]/25 shadow-[0_0_12px_rgba(212,175,55,0.1)]' : 'text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)]'}`}>
          <ClipboardCheck className="w-3.5 h-3.5 inline mr-1.5" />
          Validación de Packing
          {pendingPackings.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[var(--pm-accent-amber)]/15 text-[var(--pm-accent-amber)] text-[8px]">
              {pendingPackings.length}
            </span>
          )}
        </button>
      </div>

      {/* ═══ TAB: REGISTRO DE PACKING ═══ */}
      {activeTab === 'registro' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {/* LEFT PANEL: Forms */}
          <div className="space-y-5">
            {/* Individual Registration */}
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
              className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
              <div className="px-5 pt-5 pb-2 border-b border-[var(--pm-border)]/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
                    <Plus className="w-3.5 h-3.5 text-[var(--pm-accent-gold)]" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[var(--pm-accent-gold)] uppercase tracking-wider">Registro Individual</span>
                </div>
              </div>
              <form onSubmit={handleSubmitBar} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Proveedor</label>
                  <select value={clientId} onChange={e => setClientId(e.target.value)}
                    className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-sans text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors cursor-pointer">
                    {clients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Código de Barra</label>
                    <input type="text" placeholder="Ej: BARRA-A001" value={barNumber}
                      onChange={e => setBarNumber(e.target.value.toUpperCase())}
                      className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors uppercase placeholder:text-[var(--pm-text-dim)]/30" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
                      <Weight className="w-3 h-3" /> Peso Bruto
                    </label>
                    <input type="number" step="any" placeholder="0.00" value={grossWeight}
                      onChange={e => setGrossWeight(e.target.value)}
                      className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30" required />
                    {weightWarning && (
                      <span className="text-[9px] font-mono text-[var(--pm-accent-amber)] flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" /> Peso superior a 24,900 g
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
                      <Microscope className="w-3 h-3" /> Pureza Au (‰)
                    </label>
                    <input type="number" min="0" max="1000" step="0.1" placeholder="999.9" value={purity}
                      onChange={e => setPurity(e.target.value)}
                      className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">
                      Ley Ag (‰) <span className="opacity-40">(opcional)</span>
                    </label>
                    <input type="number" min="0" max="1000" step="0.1" placeholder="0.00" value={leyAg}
                      onChange={e => setLeyAg(e.target.value)}
                      className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30" />
                  </div>
                </div>
                {(parseFloat(grossWeight) > 0 && parseFloat(purity) > 0) && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border" style={{ background: 'rgba(212,175,55,0.06)', borderColor: 'rgba(212,175,55,0.2)' }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Zap className="w-3.5 h-3.5 text-[var(--pm-accent-gold)]" />
                      <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-gold)] uppercase tracking-wider">Cálculo en Tiempo Real</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">FA (Fino)</span>
                        <span className="text-sm font-mono font-bold text-[var(--pm-text-primary)]">{formatNumber(liveFA, 4)} g</span>

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
                    className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">Limpiar</button>
                  <button type="submit" disabled={createBar.isPending}
                    className="flex-[2] py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))', color: 'var(--pm-accent-gold)', border: '1px solid rgba(212,175,55,0.3)' }}>
                    {createBar.isPending ? (
                      <><div className="w-3.5 h-3.5 border-2 border-[var(--pm-accent-gold)] border-t-transparent rounded-full animate-spin" /> Registrando...</>
                    ) : (<><Plus className="w-3.5 h-3.5" /> Registrar Barra</>)}
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Bulk Upload */}
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
              className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
              <button type="button" onClick={() => setIsBulkOpen(!isBulkOpen)}
                className="w-full flex items-center justify-between px-5 py-4 active:scale-[0.99] transition-all cursor-pointer">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[var(--pm-accent-amber)]" />
                  <span className="text-xs font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Carga Masiva</span>
                </div>
                {isBulkOpen ? <ChevronUp className="w-4 h-4 text-[var(--pm-text-dim)]" /> : <ChevronDown className="w-4 h-4 text-[var(--pm-text-dim)]" />}
              </button>
              <AnimatePresence>
                {isBulkOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <div className="px-5 pb-5 space-y-4 border-t border-[var(--pm-border)]/20 pt-4">
                      <select value={bulkClientId} onChange={e => setBulkClientId(e.target.value)}
                        className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2 text-xs font-sans text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors cursor-pointer">
                        {clients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                      <div ref={dropRef} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) setBulkFile(f); }}
                        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${dragOver ? 'border-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)]/5' : 'border-[var(--pm-border)] hover:border-[var(--pm-text-dim)]/30'}`}
                        onClick={() => document.getElementById('bulk-file-input')?.click()}>
                        <input id="bulk-file-input" type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setBulkFile(e.target.files?.[0] || null)} />
                        <Upload className={`w-6 h-6 mx-auto mb-2 ${dragOver ? 'text-[var(--pm-accent-gold)]' : 'text-[var(--pm-text-dim)]'}`} />
                        <p className="text-[11px] font-mono text-[var(--pm-text-dim)]">
                          {bulkFile ? <span className="text-[var(--pm-accent-amber)] font-bold">{bulkFile.name}</span> : 'Arrastra un archivo .xlsx o haz clic para seleccionar'}
                        </p>
                        <p className="text-[9px] font-mono text-[var(--pm-text-dim)]/50 mt-1">Tamaño máximo: 10 MB</p>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={downloadTemplate}
                          className="flex-1 py-2 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5">
                          <Download className="w-3 h-3" /> Plantilla</button>
                        <button type="button" onClick={handleBulkUpload} disabled={!bulkFile || bulkUploadMutation.isPending}
                          className="flex-1 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                          style={{ background: bulkFile ? 'rgba(212,175,55,0.12)' : 'transparent', color: 'var(--pm-accent-amber)', border: '1px solid rgba(212,175,55,0.2)' }}>
                          {bulkUploadMutation.isPending ? 'Subiendo...' : <><Upload className="w-3 h-3" /> Subir</>}
                        </button>
                      </div>
                      {bulkError && <p className="text-[10px] font-mono text-[var(--pm-accent-red)]">{bulkError}</p>}
                      {bulkResult && (
                        <div className="p-3 rounded-lg border text-[10px] font-mono bg-[var(--pm-accent-emerald)]/5 border-[var(--pm-accent-emerald)]/20 text-[var(--pm-accent-emerald)]">
                          <Check className="w-3 h-3 inline mr-1" /> Creadas: <strong>{bulkResult.created}</strong> | Saltadas: <strong>{bulkResult.skipped}</strong>
                          {bulkResult.packingId && (
                            <span className="ml-2 text-[var(--pm-accent-amber)]">Packing #{bulkResult.packingId.slice(0, 8)}</span>
                          )}
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

          {/* RIGHT PANEL: Inventory */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
            className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--pm-border)]/20">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--pm-text-dim)]/40" />
                <input type="text" placeholder="Buscar barra por código..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30" />
              </div>
              <span className="text-[10px] font-mono text-[var(--pm-text-dim)] whitespace-nowrap">{totalBars} barras</span>
            </div>

            <div className="divide-y divide-[var(--pm-border)]/20 overflow-y-auto max-h-[calc(100vh-280px)] v2-scroll">
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
                      <button type="button" onClick={() => toggleAccordion(client.id)}
                        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[var(--pm-bg-tertiary)]/50 active:scale-[0.99] transition-all cursor-pointer">
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
                                    {pageBars.map((bar, idx) => {
                                      const isPackingValidated = bar.packingId ? packingStatusMap[bar.packingId] === 'VALIDATED' : false;
                                      return (
                                      <motion.tr key={bar.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.02, duration: 0.15 }}
                                        onClick={() => { if (isPackingValidated) setEvidenceBarId(bar.id); }}
                                        className={`${idx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--pm-bg-deepest)]/30'} transition-all duration-150 ${isPackingValidated ? 'cursor-pointer hover:bg-white/[0.04] active:scale-[0.98]' : 'cursor-default'}`}>
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
                                            disabled={bar.status === 'EXITED'}
                                            className={`p-1 rounded transition-all ${bar.status !== 'EXITED' ? 'text-[var(--pm-text-dim)] hover:text-[var(--pm-accent-red)] hover:bg-[var(--pm-accent-red)]/10 active:scale-90 cursor-pointer' : 'opacity-20 cursor-not-allowed'}`}
                                            title="Eliminar barra"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </td>
                                      </motion.tr>
                                    );
                                    })}
                                  </tbody>
                                </table>
                                {totalPages > 1 && (
                                  <div className="flex items-center justify-between px-5 py-2 border-t border-[var(--pm-border)]/20">
                                    <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">Pág. {currentPage + 1} de {totalPages}</span>
                                    <div className="flex gap-1">
                                      <button type="button" onClick={() => setAccordionPage(client.id, Math.max(0, currentPage - 1))}
                                        disabled={currentPage === 0}
                                        className="px-2.5 py-1 rounded text-[9px] font-mono border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] transition-all disabled:opacity-30 active:scale-95 cursor-pointer">Anterior</button>
                                      <button type="button" onClick={() => setAccordionPage(client.id, Math.min(totalPages - 1, currentPage + 1))}
                                        disabled={currentPage >= totalPages - 1}
                                        className="px-2.5 py-1 rounded text-[9px] font-mono border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] transition-all disabled:opacity-30 active:scale-95 cursor-pointer">Siguiente</button>
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
      )}

      {/* ═══ TAB: VALIDACIÓN DE PACKING ═══ */}
      {activeTab === 'validacion' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
          {/* LEFT PANEL: Packing List */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="xl:col-span-2 glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
            <div className="p-4 border-b border-[var(--pm-border)]/20">
              <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-gold)] uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Packings Pendientes
                {pendingPackings.length > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-[var(--pm-accent-amber)]/15 text-[var(--pm-accent-amber)] text-[9px]">{pendingPackings.length}</span>
                )}
              </span>
            </div>
            <div className="divide-y divide-[var(--pm-border)]/20 overflow-y-auto max-h-[calc(100vh-320px)] v2-scroll">
              {pendingPackings.length === 0 ? (
                <div className="p-8 text-center">
                  <ClipboardCheck className="w-8 h-8 text-[var(--pm-accent-emerald)]/30 mx-auto mb-2" />
                  <p className="text-[11px] font-mono text-[var(--pm-text-dim)]">No hay packings pendientes de validación</p>
                </div>
              ) : (
                pendingPackings.map(p => {
                  const isSelected = selectedPackingId === p.id;
                  return (
                    <button key={p.id} onClick={() => setSelectedPackingId(p.id)}
                      className={`w-full text-left px-4 py-3.5 transition-all active:scale-[0.99] cursor-pointer ${isSelected ? 'bg-[var(--pm-accent-gold)]/8 border-l-2 border-[var(--pm-accent-gold)]' : 'hover:bg-[var(--pm-bg-tertiary)]/40 border-l-2 border-transparent'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold text-[var(--pm-text-primary)] truncate">{p.fileName}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${isSelected ? 'text-[var(--pm-accent-amber)] bg-[var(--pm-accent-amber)]/10' : 'text-[var(--pm-text-dim)]'}`}>
                          {p._count?.pending ?? '?'} pend.
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-[var(--pm-text-dim)]">
                        <span>{p.client?.name || p.clientId?.slice(0, 8)}</span>
                        <span>·</span>
                        <span>{new Date(p.createdAt).toLocaleDateString('es-ES')}</span>
                        <span>·</span>
                        <span>{(p._count?.bars ?? 0)} barras</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* RIGHT PANEL: Validation Detail */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
            className="xl:col-span-3 glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
            {!selectedPacking ? (
              <div className="p-12 text-center">
                <ClipboardCheck className="w-12 h-12 text-[var(--pm-text-dim)]/20 mx-auto mb-3" />
                <p className="text-sm text-[var(--pm-text-primary)] font-semibold">Selecciona un packing para validar</p>
                <p className="text-[11px] font-mono text-[var(--pm-text-dim)] mt-1">Elige un packing pendiente del panel izquierdo</p>
              </div>
            ) : validationResult ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.25)' }}>
                  <Check className="w-7 h-7 text-[var(--pm-accent-emerald)]" strokeWidth={2.5} />
                </div>
                <p className="text-sm font-sans font-bold text-[var(--pm-accent-emerald)]">Packing Validado</p>
                <p className="text-[11px] font-mono text-[var(--pm-text-dim)] mt-1">
                  {validationResult.success} de {validationResult.total} barras validadas correctamente
                </p>
                {validationResult.error > 0 && (
                  <p className="text-[11px] font-mono text-[var(--pm-accent-red)]">{validationResult.error} errores</p>
                )}
              </div>
            ) : (
              <div>
                {/* Packing Header */}
                <div className="p-4 border-b border-[var(--pm-border)]/20 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-mono font-bold text-[var(--pm-text-primary)]">{selectedPacking.fileName}</h3>
                    <p className="text-[9px] font-mono text-[var(--pm-text-dim)] mt-0.5">
                      {selectedPacking.client?.name} · {new Date(selectedPacking.createdAt).toLocaleDateString('es-ES')} · {selectedPacking.bars?.length ?? 0} barras
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-mono whitespace-nowrap ${allBarsValidated ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-text-dim)]'}`}>
                      {validatedCount} de {totalCount} barras validadas
                    </span>
                    <button onClick={() => setConfirmFinalizeModal(true)} disabled={!allBarsValidated || finalizePacking.isPending}
                      className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 ${allBarsValidated ? 'active:scale-95' : ''}`}
                      style={{
                        background: allBarsValidated
                          ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))'
                          : 'rgba(100,100,100,0.08)',
                        color: allBarsValidated ? 'var(--pm-accent-emerald)' : 'var(--pm-text-dim)',
                        border: allBarsValidated
                          ? '1px solid rgba(16,185,129,0.3)'
                          : '1px solid rgba(100,100,100,0.15)',
                        boxShadow: allBarsValidated ? '0 0 16px rgba(16,185,129,0.15)' : 'none',
                      }}>
                      {finalizePacking.isPending ? (
                        <><div className="w-3 h-3 border-2 border-[var(--pm-accent-emerald)] border-t-transparent rounded-full animate-spin" /> Finalizando...</>
                      ) : (<><ClipboardCheck className="w-3.5 h-3.5" /> CONFIRMAR VALIDACIÓN</>)}
                    </button>
                  </div>
                </div>

                {/* Confirm Bar — shown when a row is selected */}
                <AnimatePresence>
                  {selectedBarId && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-b border-[var(--pm-border)]/20">
                      <div className="px-4 py-3 flex items-center justify-between bg-[var(--pm-accent-gold)]/5">
                        <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">
                          Barra seleccionada: <strong className="text-[var(--pm-accent-gold)]">
                            {selectedPacking?.bars?.find(b => b.id === selectedBarId)?.barNumber ?? ''}
                          </strong>
                        </span>
                        <button onClick={handleConfirmBar}
                          className="px-5 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                          style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1))', color: 'var(--pm-accent-gold)', border: '1px solid rgba(212,175,55,0.4)', boxShadow: '0 0 16px rgba(212,175,55,0.15)' }}>
                          <Zap className="w-3.5 h-3.5" /> CONFIRMAR BARRA
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Editable Bars Table */}
                <div className="overflow-x-auto premium-table">
                  <table className="w-full text-left text-[10px] font-mono">
                    <thead>
                      <tr className="border-b border-[var(--pm-border)]/20 text-[9px] text-[var(--pm-text-dim)] uppercase tracking-wider">
                        <th className="py-2.5 px-3 text-center w-8"></th>
                        <th className="py-2.5 px-3 text-center min-w-[120px]">Código <span className="text-[var(--pm-accent-gold)]">✎</span></th>
                        <th className="py-2.5 px-3 text-right">Según Packing (SP)</th>
                        <th className="py-2.5 px-3 text-right min-w-[110px]">Peso Físico (g) <span className="text-[var(--pm-accent-gold)]">✎</span></th>
                        <th className="py-2.5 px-3 text-right">Ley SP (‰)</th>
                        <th className="py-2.5 px-3 text-right min-w-[100px]">Ley Física (‰) <span className="text-[var(--pm-accent-gold)]">✎</span></th>
                        <th className="py-2.5 px-3 text-center">Delta (g)</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--pm-border)]/20">
                      {(selectedPacking.bars ?? []).map((bar, idx) => {
                        const edit = validationEdits[bar.id];
                        const delta = computeDelta(bar);
                        const isPorValidar = bar.status === 'POR_VALIDAR';
                        const isSelected = selectedBarId === bar.id;
                        const origGross = Number(bar.grossWeight);
                        const origPurity = Number(bar.purity);
                        return (
                          <tr key={bar.id} onClick={() => {
                            if (bar.status === 'IN_STOCK' || bar.status === 'COMPLETADO') {
                              setEvidenceBarId(bar.id);
                            } else if (bar.status === 'POR_VALIDAR') {
                              handleRowSelect(bar.id, bar.status);
                            }
                          }}
                            className={`
                              ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--pm-bg-base)]/20'}
                              hover:bg-[var(--pm-bg-hover)]/40 transition-all
                              ${bar.status === 'IN_STOCK' || bar.status === 'COMPLETADO' ? 'cursor-pointer hover:bg-[var(--pm-accent-emerald)]/5' : ''}
                              ${bar.status === 'POR_VALIDAR' ? 'cursor-pointer' : ''}
                              ${!isPorValidar && bar.status !== 'IN_STOCK' && bar.status !== 'COMPLETADO' ? 'opacity-50' : ''}
                              ${isSelected ? 'ring-1 ring-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)]/5' : ''}
                            `}>
                            <td className="py-2.5 px-3 text-center">
                              {isPorValidar && (
                                <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${isSelected ? 'border-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)] shadow-[0_0_6px_rgba(212,175,55,0.4)]' : 'border-[var(--pm-text-dim)]/30'}`} />
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isPorValidar ? (
                                <input type="text" value={edit?.barNumber ?? ''}
                                  onChange={e => handleEditChange(bar.id, 'barNumber', e.target.value.toUpperCase())}
                                  onClick={e => e.stopPropagation()}
                                  className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded px-2 py-1 text-[10px] font-mono text-[var(--pm-text-primary)] text-center focus:outline-none focus:border-[var(--pm-accent-gold)] uppercase" />
                              ) : (
                                <span className="text-[var(--pm-text-dim)]">{bar.barNumber}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[var(--pm-text-primary)]">{formatNumber(origGross, 2)}</td>
                            <td className="py-2.5 px-3 text-right">
                              {isPorValidar ? (
                                <input type="number" step="any" value={edit?.grossWeight ?? ''}
                                  onChange={e => handleEditChange(bar.id, 'grossWeight', e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded px-2 py-1 text-[10px] font-mono text-[var(--pm-text-primary)] text-right focus:outline-none focus:border-[var(--pm-accent-gold)]" />
                              ) : (
                                <span className="text-[var(--pm-text-dim)]">{formatNumber(origGross, 2)}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[var(--pm-text-primary)]">{formatNumber(origPurity, 1)}</td>
                            <td className="py-2.5 px-3 text-right">
                              {isPorValidar ? (
                                <input type="number" step="any" min="0" max="1000" value={edit?.purity ?? ''}
                                  onChange={e => handleEditChange(bar.id, 'purity', e.target.value)}
                                  onClick={e => e.stopPropagation()}
                                  className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded px-2 py-1 text-[10px] font-mono text-[var(--pm-text-primary)] text-right focus:outline-none focus:border-[var(--pm-accent-gold)]" />
                              ) : (
                                <span className="text-[var(--pm-text-dim)]">{formatNumber(origPurity, 1)}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {isPorValidar ? (
                                <span className={delta === 0 ? 'text-[var(--pm-text-dim)]' : delta > 0 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}>
                                  {delta >= 0 ? '+' : ''}{formatNumber(delta, 2)}
                                </span>
                              ) : (
                                <span className="text-[var(--pm-text-dim)]">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-mono font-bold border rounded ${STATUS_STYLES[bar.status] || ''}`}>
                                {STATUS_LABELS[bar.status] || bar.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Device Simulation Modal */}
                <AnimatePresence>
                  {confirmModal && selectedPacking && (() => {
                    const targetBar = selectedPacking.bars?.find(b => b.id === confirmModal.barId);
                    const origGross = targetBar ? Number(targetBar.grossWeight) : 0;
                    const newDelta = modalLiveFA - origGross;
                    return (
                      <motion.div key="dev-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.92, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                          className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden p-6 space-y-5 border border-[var(--pm-border)]/40">
                          {/* Decorative icons — Camera now interactive */}
                          <div className="flex items-center justify-center gap-4 mb-2">
                            <div className={`transition-all duration-300 ${photoUploadedUrl ? 'opacity-100' : 'opacity-20'}`}>
                              <Camera className={`w-5 h-5 ${photoUploadedUrl ? 'text-[var(--pm-accent-emerald)] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-[var(--pm-text-dim)]'}`} />
                            </div>
                            <Scale className="w-5 h-5 text-[var(--pm-text-dim)] opacity-20" />
                            <Microscope className="w-5 h-5 text-[var(--pm-text-dim)] opacity-20" />
                          </div>

                          {/* Title */}
                          <div className="text-center">
                            <h2 className="text-lg font-mono font-bold text-[var(--pm-accent-gold)] tracking-wider">PROXIMAMENTE</h2>
                            <p className="text-[10px] font-mono text-[var(--pm-text-dim)] mt-1 uppercase tracking-wider">
                              Lectura de dispositivos externos (Báscula / Espectrómetro / Cámara)
                            </p>
                          </div>

                          <div className="h-px bg-[var(--pm-border)]/30" />

                          {/* Camera Mode — replaces input fields */}
                          {cameraMode === 'camera' ? (
                            <CameraTerminal
                              onCapture={handleCapture}
                              onClose={() => setCameraMode('idle')}
                            />
                          ) : cameraMode === 'preview' ? (
                              <div className="space-y-3">
                                <div className="rounded-xl overflow-hidden border-2 border-[var(--pm-accent-cyan)]/30 bg-black">
                                  {photoPreviewUrl && (
                                    <img src={photoPreviewUrl} alt="Preview" className="w-full object-cover max-h-64" />
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {photoUploadedUrl ? (
                                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--pm-accent-emerald)]/10 border border-[var(--pm-accent-emerald)]/20">
                                        <Check className="w-3 h-3 text-[var(--pm-accent-emerald)]" />
                                        <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-emerald)]">Foto lista</span>
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--pm-accent-amber)]/10 border border-[var(--pm-accent-amber)]/20">
                                        <div className="w-2.5 h-2.5 border-2 border-[var(--pm-accent-amber)] border-t-transparent rounded-full animate-spin" />
                                        <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-amber)]">Subiendo...</span>
                                      </span>
                                    )}
                                  </div>
                                  <button type="button" onClick={() => { if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl); setPhotoBlob(null); setPhotoPreviewUrl(null); setPhotoUploadedUrl(null); setCameraMode('camera'); }}
                                    className="px-4 py-2 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
                                    🔁 REPETIR
                                  </button>
                                </div>
                              </div>
                          ) : (
                            <>
                              {/* Báscula */}
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1.5">
                                  <Scale className="w-3 h-3 text-[var(--pm-accent-gold)]" /> PESO BÁSCULA (g)
                                </label>
                                <input type="number" step="any" value={confirmModal.basculaWeight}
                                  onChange={e => setConfirmModal(prev => prev ? { ...prev, basculaWeight: e.target.value } : null)}
                                  className="w-full bg-[var(--pm-bg-deepest)] border-2 border-[var(--pm-accent-gold)]/30 rounded-xl px-4 py-3 text-lg font-mono font-bold text-[var(--pm-text-primary)] text-right focus:outline-none focus:border-[var(--pm-accent-gold)] transition-all" />
                              </div>

                              {/* Espectrómetro */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1.5">
                                    <Microscope className="w-3 h-3 text-[var(--pm-accent-gold)]" /> LEY AU (‰)
                                  </label>
                                  <input type="number" step="0.1" min="0" max="1000" value={confirmModal.leyAu}
                                    onChange={e => setConfirmModal(prev => prev ? { ...prev, leyAu: e.target.value } : null)}
                                    className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-sm font-mono text-[var(--pm-text-primary)] text-right focus:outline-none focus:border-[var(--pm-accent-gold)] transition-all" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">LEY AG (‰)</label>
                                  <input type="number" step="0.1" min="0" max="1000" value={confirmModal.leyAg}
                                    onChange={e => setConfirmModal(prev => prev ? { ...prev, leyAg: e.target.value } : null)}
                                    className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-sm font-mono text-[var(--pm-text-primary)] text-right focus:outline-none focus:border-[var(--pm-accent-gold)] transition-all" />
                                </div>
                              </div>

                              {/* Photo attachment */}
                              {photoUploadedUrl ? (
                                <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--pm-accent-emerald)]/30 bg-[var(--pm-accent-emerald)]/5">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-[var(--pm-border)] shrink-0 bg-black">
                                    <img
                                      src={photoUploadedUrl?.startsWith('data:') ? photoUploadedUrl : `/api/blob/view?url=${encodeURIComponent(photoUploadedUrl!)}`}
                                      alt="Foto adjunta"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-emerald)] flex items-center gap-1.5">
                                      <Check className="w-3 h-3" /> Foto adjunta
                                    </span>
                                    <button type="button" onClick={() => setCameraMode('camera')}
                                      className="text-[9px] font-mono text-[var(--pm-accent-cyan)] hover:underline mt-0.5 block cursor-pointer">
                                      📷 Reemplazar foto
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <HudButton variant="primary" onClick={() => setCameraMode('camera')} className="w-full justify-center">
                                  <Camera className="w-3.5 h-3.5" /> ADJUNTAR FOTO
                                </HudButton>
                              )}
                            </>
                          )}

                          {/* Live FA + Delta */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                              <span className="text-[8px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">FINO CALCULADO (FA)</span>
                              <span className="text-sm font-mono font-bold text-[var(--pm-accent-gold)] block text-center">{formatNumber(modalLiveFA, 2)} g</span>
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                              <span className="text-[8px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">DELTA vs SP</span>
                              <span className={`text-sm font-mono font-bold block text-center ${newDelta >= 0 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}>
                                {newDelta >= 0 ? '+' : ''}{formatNumber(newDelta, 2)} g
                              </span>
                            </div>
                          </div>

                          {/* Buttons — always visible */}
                          <div className="flex gap-3 pt-1">
                            <button type="button" onClick={() => { setConfirmModal(null); setSelectedBarId(null); resetPhotoState(); }}
                              className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
                              Cancelar
                            </button>
                            <button type="button" onClick={handleSyncValidate} disabled={validatePacking.isPending}
                              className="flex-[2] py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                              style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))', color: 'var(--pm-accent-gold)', border: '1px solid rgba(212,175,55,0.3)' }}>
                              {validatePacking.isPending ? (
                                <><div className="w-3.5 h-3.5 border-2 border-[var(--pm-accent-gold)] border-t-transparent rounded-full animate-spin" /> SINCRONIZANDO...</>
                              ) : (
                                <><Zap className="w-3.5 h-3.5" /> SINCRONIZAR Y VALIDAR</>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Finalize Confirmation Modal */}
      <AnimatePresence>
        {confirmFinalizeModal && selectedPacking && (
          <motion.div key="finalize-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm glass-panel rounded-2xl overflow-hidden p-6 space-y-5 border border-[var(--pm-border)]/40">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.25)' }}>
                  <ClipboardCheck className="w-7 h-7 text-[var(--pm-accent-emerald)]" strokeWidth={2.5} />
                </div>
                <h2 className="text-sm font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Confirmar Validación</h2>
                <p className="text-[10px] font-mono text-[var(--pm-text-dim)] mt-2 leading-relaxed">
                  ¿Confirmar recepción técnica del material? Se marcará el Packing como <strong className="text-[var(--pm-accent-emerald)]">VALIDADO</strong>{' '}
                  y las barras estarán disponibles para fundición.
                </p>
              </div>
              <div className="h-px bg-[var(--pm-border)]/30" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmFinalizeModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
                  Cancelar
                </button>
                <button type="button" onClick={handleConfirmFinalize}
                  className="flex-[2] py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))', color: 'var(--pm-accent-emerald)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <Check className="w-4 h-4" /> CONFIRMAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evidence Modal */}
      <AnimatePresence>
        {evidenceBarId && (() => {
          const bar = bars.find(b => b.id === evidenceBarId) || selectedPacking?.bars?.find(b => b.id === evidenceBarId);
          if (!bar) return null;
          const sp = spValuesRef.current[bar.id];
          const spGross = sp?.grossWeight ?? Number(bar.grossWeight);
          const spPurity = sp?.purity ?? Number(bar.purity);
          const spLeyAg = sp?.leyAg;
          const validatedGross = Number(bar.grossWeight);
          const validatedPurity = Number(bar.purity);
          const validatedLeyAg = bar.leyAg != null ? Number(bar.leyAg) : undefined;
          const fa = validatedGross * (validatedPurity / 1000);
          const fe = fa * 0.99;
          const delta = validatedGross - spGross;
          const photoUrl = bar.photoUrl || barPhotoUrls[bar.id] || null;
          const validatedAt = bar.updatedAt;
          return (
            <motion.div key={evidenceBarId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setEvidenceBarId(null)}
            >
              <motion.div initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden border border-[var(--pm-border)]/40"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--pm-border)]/20">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-cyan)] uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardCheck className="w-3.5 h-3.5" /> EVIDENCIA DE VALIDACIÓN
                    </span>
                    <h2 className="text-lg font-mono font-bold text-[var(--pm-text-primary)] mt-0.5 tracking-tight">
                      {bar.barNumber}
                    </h2>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${STATUS_STYLES[bar.status] || ''}`}>
                      <Check className={`w-3 h-3 ${bar.status === 'PROCESANDO' ? 'text-cyan-400' : bar.status === 'EXITED' ? 'text-[var(--pm-text-dim)]' : 'text-[var(--pm-accent-emerald)]'}`} />
                      <span className={`text-[9px] font-mono font-bold ${bar.status === 'PROCESANDO' ? 'text-cyan-400' : bar.status === 'EXITED' ? 'text-[var(--pm-text-dim)]' : 'text-[var(--pm-accent-emerald)]'}`}>{STATUS_LABELS[bar.status] || bar.status}</span>
                    </div>
                    {validatedAt && (
                      <span className="text-[8px] font-mono text-[var(--pm-text-dim)] block mt-1">
                        {new Date(validatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Photo */}
                  <div className="rounded-xl overflow-hidden border border-[var(--pm-border)] bg-black/60 flex items-center justify-center min-h-[160px]">
                    {photoUrl ? (
                      <img
                        src={photoUrl.startsWith('data:') ? photoUrl : `/api/blob/view?url=${encodeURIComponent(photoUrl)}`}
                        alt={`Barra ${bar.barNumber}`}
                        className="w-full object-cover max-h-56"
                      />
                    ) : (
                      <div className="text-center p-6">
                        <Camera className="w-8 h-8 text-[var(--pm-text-dim)]/30 mx-auto mb-2" />
                        <p className="text-[10px] font-mono text-[var(--pm-text-dim)]/40">Sin evidencia fotográfica</p>
                      </div>
                    )}
                  </div>

                  {/* Technical Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-[var(--pm-border)]/40 bg-[var(--pm-bg-deepest)]/30">
                      <span className="text-[8px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">SEGÚN PACKING (SP)</span>
                      <div className="mt-2 space-y-1 text-center">
                        <div>
                          <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Bruto</span>
                          <span className="text-sm font-mono font-bold text-[var(--pm-text-primary)]">{formatNumber(spGross, 2)} g</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Ley Au</span>
                          <span className="text-sm font-mono font-bold text-[var(--pm-text-primary)]">{formatNumber(spPurity, 1)} ‰</span>
                        </div>
                        {spLeyAg != null && (
                          <div>
                            <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Ley Ag</span>
                            <span className="text-sm font-mono font-bold text-[var(--pm-text-primary)]">{formatNumber(spLeyAg, 1)} ‰</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border border-[var(--pm-accent-cyan)]/30 bg-[var(--pm-accent-cyan)]/5">
                      <span className="text-[8px] font-mono text-[var(--pm-accent-cyan)] uppercase tracking-wider block text-center">REAL (VALIDADO)</span>
                      <div className="mt-2 space-y-1 text-center">
                        <div>
                          <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Bruto</span>
                          <span className="text-sm font-mono font-bold text-[var(--pm-accent-cyan)]">{formatNumber(validatedGross, 2)} g</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Ley Au</span>
                          <span className="text-sm font-mono font-bold text-[var(--pm-accent-cyan)]">{formatNumber(validatedPurity, 1)} ‰</span>
                        </div>
                        {validatedLeyAg != null && (
                          <div>
                            <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Ley Ag</span>
                            <span className="text-sm font-mono font-bold text-[var(--pm-accent-cyan)]">{formatNumber(validatedLeyAg, 1)} ‰</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* FA + FE + Delta */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl border border-[var(--pm-accent-gold)]/20 bg-[var(--pm-accent-gold)]/5">
                      <span className="text-[8px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">FA</span>
                      <span className="text-sm font-mono font-bold text-[var(--pm-accent-gold)] block text-center">{formatNumber(fa, 4)} g</span>
                    </div>
                    <div className="p-3 rounded-xl border border-[var(--pm-accent-cyan)]/20 bg-[var(--pm-accent-cyan)]/5">
                      <span className="text-[8px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">FE</span>
                      <span className="text-sm font-mono font-bold text-[var(--pm-accent-cyan)] block text-center">{formatNumber(fe, 4)} g</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${delta >= 0 ? 'border-[var(--pm-accent-emerald)]/20 bg-[var(--pm-accent-emerald)]/5' : 'border-[var(--pm-accent-red)]/20 bg-[var(--pm-accent-red)]/5'}`}>
                      <span className="text-[8px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">DELTA</span>
                      <span className={`text-sm font-mono font-bold block text-center ${delta >= 0 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}>
                        {delta >= 0 ? '+' : ''}{formatNumber(delta, 2)} g
                      </span>
                    </div>
                  </div>

                  {/* Close */}
                  <button type="button" onClick={() => setEvidenceBarId(null)}
                    className="w-full py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
                    CERRAR FICHA
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Confirm Registration Overlay */}
      <AnimatePresence>
        {confirmRegOverlay && (
          <motion.div key="confirm-reg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmRegOverlay(null)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm glass-panel rounded-2xl overflow-hidden p-6 space-y-5 border border-[var(--pm-border)]/40"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(212,175,55,0.1)', border: '2px solid rgba(212,175,55,0.25)' }}>
                  <ClipboardCheck className="w-7 h-7 text-[var(--pm-accent-gold)]" strokeWidth={2.5} />
                </div>
                <h2 className="text-sm font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Confirmar Registro</h2>
              </div>

              <div className="p-4 rounded-xl border border-[var(--pm-border)]/40 bg-[var(--pm-bg-deepest)]/30 space-y-2">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-[var(--pm-text-dim)]">Código</span>
                  <span className="font-bold text-[var(--pm-accent-gold)]">{confirmRegOverlay.barNumber}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-[var(--pm-text-dim)]">Peso Bruto</span>
                  <span className="font-bold text-[var(--pm-text-primary)]">{formatNumber(confirmRegOverlay.grossWeight, 2)} g</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-[var(--pm-text-dim)]">Pureza Au</span>
                  <span className="font-bold text-[var(--pm-text-primary)]">{formatNumber(confirmRegOverlay.purity, 1)} ‰</span>
                </div>
                {confirmRegOverlay.leyAg != null && confirmRegOverlay.leyAg > 0 && (
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-[var(--pm-text-dim)]">Ley Ag</span>
                    <span className="font-bold text-[var(--pm-text-primary)]">{formatNumber(confirmRegOverlay.leyAg, 1)} ‰</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-[var(--pm-accent-cyan)]/30 bg-[var(--pm-accent-cyan)]/5 text-center">
                <Package className="w-5 h-5 text-[var(--pm-accent-cyan)] mx-auto mb-2" />
                <p className="text-[11px] font-mono text-[var(--pm-text-primary)] leading-relaxed">
                  Esta barra se asignará al <strong className="text-[var(--pm-accent-cyan)]">Packing #{confirmRegOverlay.packingNumber}</strong> del proveedor <strong className="text-[var(--pm-text-primary)]">{confirmRegOverlay.clientName}</strong>
                </p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmRegOverlay(null)}
                  className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
                  Cancelar
                </button>
                <button type="button" onClick={handleConfirmBarRegistration}
                  className="flex-[2] py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))', color: 'var(--pm-accent-gold)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  <Check className="w-4 h-4" /> CONFIRMAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Bulk Upload Overlay */}
      <AnimatePresence>
        {confirmBulkOverlay && (
          <motion.div key="confirm-bulk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmBulkOverlay(null)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm glass-panel rounded-2xl overflow-hidden p-6 space-y-5 border border-[var(--pm-border)]/40"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.25)' }}>
                  <Upload className="w-7 h-7 text-[var(--pm-accent-amber)]" strokeWidth={2.5} />
                </div>
                <h2 className="text-sm font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Confirmar Carga Masiva</h2>
              </div>

              <div className="p-4 rounded-xl border border-[var(--pm-border)]/40 bg-[var(--pm-bg-deepest)]/30 text-center">
                <FileSpreadsheet className="w-5 h-5 text-[var(--pm-accent-amber)] mx-auto mb-1" />
                <p className="text-[10px] font-mono text-[var(--pm-text-dim)] truncate">{bulkFile?.name}</p>
              </div>

              <div className="p-4 rounded-xl border border-[var(--pm-accent-cyan)]/30 bg-[var(--pm-accent-cyan)]/5 text-center">
                <Package className="w-5 h-5 text-[var(--pm-accent-cyan)] mx-auto mb-2" />
                <p className="text-[11px] font-mono text-[var(--pm-text-primary)] leading-relaxed">
                  Este archivo se asignará al <strong className="text-[var(--pm-accent-cyan)]">Packing #{confirmBulkOverlay.packingNumber}</strong> del proveedor <strong className="text-[var(--pm-text-primary)]">{confirmBulkOverlay.clientName}</strong>
                </p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmBulkOverlay(null)}
                  className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
                  Cancelar
                </button>
                <button type="button" onClick={handleConfirmBulkUpload}
                  className="flex-[2] py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.1))', color: 'var(--pm-accent-amber)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <Check className="w-4 h-4" /> CONFIRMAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ingest Status Overlay */}
      <AnimatePresence>
        {ingestStatus && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-xs glass-panel rounded-2xl overflow-hidden p-8 flex flex-col items-center gap-4">
              {ingestStatus.status === 'ingesting' ? (
                <><div className="w-10 h-10 border-2 border-[var(--pm-accent-gold)] border-t-transparent rounded-full animate-spin" />
                  <div className="text-center"><span className="text-xs font-mono text-[var(--pm-text-dim)]">Registrando</span>
                    <p className="text-sm font-mono font-bold text-[var(--pm-accent-gold)]">{ingestStatus.barNumber}</p></div></>
              ) : (
                <><div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.25)' }}>
                  <Check className="w-7 h-7 text-[var(--pm-accent-emerald)]" strokeWidth={2.5} /></div>
                  <div className="text-center"><span className="text-sm font-sans font-bold text-[var(--pm-accent-emerald)]">Barra Registrada</span>
                    <p className="text-xs font-mono text-[var(--pm-text-dim)] mt-1">{ingestStatus.barNumber} (Pendiente de validación)</p></div></>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {confirmDeleteId && (() => {
          const target = bars.find(b => b.id === confirmDeleteId);
          return (
            <motion.div key="del-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-sm glass-panel rounded-2xl overflow-hidden p-6 space-y-4">
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
                    className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">Cancelar</button>
                  <button type="button" onClick={() => handleDeleteBar(confirmDeleteId)}
                    className="flex-1 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                    style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--pm-accent-red)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Eliminar</button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Delete Status Overlay */}
      <AnimatePresence>
        {deleteStatus !== 'idle' && (
          <motion.div key="del-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-xs glass-panel rounded-2xl p-8 flex flex-col items-center gap-4">
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
        Packing v2 Premium · {totalBars} barras · {formatNumber(totalFineWeight, 2)} g FA · {pendingPackings.length} packing(s) pendiente(s)
      </p>
    </motion.div>
  );
}
