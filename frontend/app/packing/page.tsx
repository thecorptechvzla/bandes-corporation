'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useClients } from '@/hooks/useClients';
import { useBars, useCreateBar, useBulkUploadBars, useUpdateBar } from '@/hooks/useBars';
import { usePackings, usePacking, useValidatePacking, useCreatePacking, useFinalizePacking } from '@/hooks/usePackings';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { generateValidationPDF, type ValidationPackingData } from '@/lib/generateValidationPDF';
import type { Bar, BulkUploadResult } from '@/types/api';
import { FolderUp, AlertTriangle, Check, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FinalizeConfirmationModal } from '@/components/packing/FinalizeConfirmationModal';
import { ConfirmRegistrationModal } from '@/components/packing/ConfirmRegistrationModal';
import { ConfirmBulkUploadModal } from '@/components/packing/ConfirmBulkUploadModal';
import { IngestStatusOverlay } from '@/components/packing/IngestStatusOverlay';
import { EvidenceModal } from '@/components/packing/EvidenceModal';
import { PackingTabBar } from '@/components/packing/PackingTabBar';
import { BarRegistrationForm } from '@/components/packing/BarRegistrationForm';
import { BulkUploadSection } from '@/components/packing/BulkUploadSection';
import { BarInventoryPanel } from '@/components/packing/BarInventoryPanel';
import { PackingListSidebar } from '@/components/packing/PackingListSidebar';
import { ValidationDetailPanel } from '@/components/packing/ValidationDetailPanel';
import { DeleteStatusOverlay } from '@/components/packing/DeleteStatusOverlay';
import { BarDetailModal } from '@/components/packing/BarDetailModal';
import { PackingsTable } from '@/components/historicos/PackingsTable';
import { HistoryFilters } from '@/components/historicos/HistoryFilters';

export default function PackingPage() {
  const [activeTab, setActiveTab] = useState<'registro' | 'validacion'>('registro');
  const { data: clients = [] } = useClients({ role: 'PROVEEDOR' });
  const { data: bars = [] } = useBars({ includePorValidar: true });
  const { data: packings = [] } = usePackings();
  const createBar = useCreateBar();
  const bulkUploadMutation = useBulkUploadBars();
  const updateBar = useUpdateBar();

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

  const [selectedPackingId, setSelectedPackingId] = useState<string | null>(null);
  const { data: selectedPacking } = usePacking(selectedPackingId);
  const validatePacking = useValidatePacking();
  const finalizePacking = useFinalizePacking();
  const [validationEdits, setValidationEdits] = useState<Record<string, { barNumber: string; grossWeight: string; purity: string; leyAg: string }>>({});
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ total: number; success: number; error: number } | null>(null);
  const [confirmFinalizeModal, setConfirmFinalizeModal] = useState(false);
  const [evidenceBarId, setEvidenceBarId] = useState<string | null>(null);
  const [barPhotoUrls, setBarPhotoUrls] = useState<Record<string, string>>({});
  const spValuesRef = useRef<Record<string, { grossWeight: number; purity: number; leyAg?: number }>>({});

  const [detailBar, setDetailBar] = useState<Bar | null>(null);
  const [detailSaving, setDetailSaving] = useState(false);
  const [historyViewBar, setHistoryViewBar] = useState<Bar | null>(null);

  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [historySelectedProvider, setHistorySelectedProvider] = useState('');
  const [expandedHistoryPackingId, setExpandedHistoryPackingId] = useState<string | null>(null);
  const { data: expandedHistoryPacking, isLoading: loadingExpandedHistoryPacking } = usePacking(expandedHistoryPackingId);

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
      const acc: Record<string, boolean> = {};
      clients.forEach(c => { acc[c.id] = false; });
      setOpenAccordions(prev => {
        const hasAll = clients.every(c => prev[c.id] !== undefined);
        return hasAll ? prev : { ...prev, ...acc };
      });
    }
  }, [clients]);

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
    if (isNaN(p) || p < 0 || p > 1000) { setFormError('Ley Au debe estar entre 0 y 1000‰.'); return; }
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
    } catch {
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
      } catch {
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
    if (!bulkClientId) { setBulkError('Seleccione un proveedor.'); return; }
    if (!bulkFile) { setBulkError('Adjunte un archivo .xlsx.'); return; }
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
    } catch {
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
      } catch {
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
      { header: 'LEY AU (‰)', key: 'purity', width: 15 },
      { header: 'PESO FINO (g)', key: 'fineWeight', width: 16 },
    ];
    ws.getColumn(2).numFmt = '#,##0.00';
    ws.getColumn(3).numFmt = '#,##0.00';
    ws.getColumn(4).numFmt = '#,##0.00';
    const hr = ws.getRow(1);
    hr.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    hr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C1C1C' } };
    hr.alignment = { horizontal: 'center', vertical: 'middle' };
    hr.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF2D3139' } },
        left: { style: 'thin', color: { argb: 'FF2D3139' } },
        bottom: { style: 'thin', color: { argb: 'FF2D3139' } },
        right: { style: 'thin', color: { argb: 'FF2D3139' } },
      };
    });
    ws.getColumn(5).width = 42;
    const nr = ws.getRow(2);
    nr.getCell(5).value = '* CÓDIGO, PESO BRUTO y LEY AU son obligatorios. PESO FINO se calcula automáticamente.';
    nr.getCell(5).font = { italic: true, color: { argb: 'FF8C8C8C' }, size: 9, bold: false };
    const totalFormulaRows = 500;
    for (let r = 2; r <= totalFormulaRows + 1; r++) {
      ws.getCell(r, 4).value = { formula: `B${r}*C${r}/1000`, result: 0 };
      ws.getCell(r, 1).dataValidation = {
        type: 'custom',
        allowBlank: true,
        formulae: [`=COUNTIF($A$2:$A$${totalFormulaRows + 1},$A${r})=1`],
        showErrorMessage: true,
        error: 'Código duplicado en la plantilla',
        errorStyle: 'warning',
      };
    }
    ws.getColumn(4).eachCell((cell, rowNumber) => {
      if (rowNumber >= 2) {
        cell.font = { italic: true, color: { argb: 'FF8C8C8C' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F3F7' } };
      }
    });
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

  const handleRowClick = (bar: Bar) => {
    setDetailBar(bar);
  };

  const handleDetailValidate = async (barId: string, data: { grossWeight: number; purity: number; photoUrl?: string }) => {
    if (!selectedPacking) return;

    setDetailSaving(true);
    try {
      await validatePacking.mutateAsync({
        id: selectedPacking.id,
        bars: [{ barId, grossWeight: data.grossWeight, purity: data.purity, photoUrl: data.photoUrl }],
      });
      setDetailBar(null);
    } catch (err) {
      console.error('Validate error:', err);
    } finally {
      setDetailSaving(false);
    }
  };

  const handleDetailSave = async (barId: string, data: { grossWeight: number; purity: number; photoUrl?: string }) => {
    if (!selectedPacking) return;

    setDetailSaving(true);
    try {
      if (detailBar?.status === 'POR_VALIDAR') {
        await validatePacking.mutateAsync({
          id: selectedPacking.id,
          bars: [{ barId, grossWeight: data.grossWeight, purity: data.purity, photoUrl: data.photoUrl }],
        });
      } else {
        await updateBar.mutateAsync({
          id: barId,
          data: {
            grossWeight: data.grossWeight,
            purity: data.purity,
            ...(detailBar?.leyAg != null && { leyAg: detailBar.leyAg }),
            ...(data.photoUrl != null && { photoUrl: data.photoUrl }),
          },
        });
      }
      setDetailBar(null);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setDetailSaving(false);
    }
  };

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

  const historyPackingProviders = useMemo(() => {
    const set = new Set<string>();
    packings.forEach(p => { if (p.client?.name) set.add(p.client.name); });
    return [...set].sort();
  }, [packings]);

  const filteredHistoryPackings = useMemo(() => {
    return packings.filter(p => {
      if (historySearchQuery) {
        const q = historySearchQuery.toLowerCase();
        const clientMatch = p.client?.name?.toLowerCase().includes(q);
        const numMatch = p.packingNumber?.toString().includes(q);
        const fileMatch = p.fileName?.toLowerCase().includes(q);
        if (!clientMatch && !numMatch && !fileMatch) return false;
      }
      if (historyDateFrom && new Date(p.createdAt) < new Date(historyDateFrom)) return false;
      if (historyDateTo) {
        const end = new Date(historyDateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(p.createdAt) > end) return false;
      }
      if (historySelectedProvider && p.client?.name !== historySelectedProvider) return false;
      return true;
    });
  }, [packings, historySearchQuery, historyDateFrom, historyDateTo, historySelectedProvider]);

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

  const handleTabChange = (tab: 'registro' | 'validacion') => {
    setActiveTab(tab);
    if (tab === 'registro') setSelectedPackingId(null);
  };

  const handleDownloadReport = (packing: ValidationPackingData) => {
    generateValidationPDF(packing);
  };

  const handleDownloadHistoryReport = (packing: ValidationPackingData) => {
    generateValidationPDF(packing);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-sans font-medium text-[var(--pm-text-primary)] tracking-tight flex items-center gap-2">
          <FolderUp className="w-8 h-8 text-[var(--pm-accent-emerald)] drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
          Packing
          <span className="text-[var(--pm-accent-emerald)] font-semibold ml-1">— {activeTab === 'registro' ? 'Registro' : 'Validación'}</span>
        </h1>
      </motion.div>

      {/* Tab Navigation */}
      <PackingTabBar activeTab={activeTab} onTabChange={handleTabChange} pendingCount={pendingPackings.length} />

      {/* ═══ TAB: REGISTRO DE PACKING ═══ */}
      {activeTab === 'registro' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <div className="space-y-5">
            <BarRegistrationForm
              clients={clients}
              clientId={clientId} onClientIdChange={setClientId}
              barNumber={barNumber} onBarNumberChange={setBarNumber}
              grossWeight={grossWeight} onGrossWeightChange={setGrossWeight}
              purity={purity} onPurityChange={setPurity}
              leyAg={leyAg} onLeyAgChange={setLeyAg}
              formError={formError} weightWarning={weightWarning} liveFA={liveFA}
              isPending={createBar.isPending} onSubmit={handleSubmitBar} onReset={resetForm}
            />
            <BulkUploadSection
              clients={clients}
              isOpen={isBulkOpen} onToggleOpen={() => setIsBulkOpen(!isBulkOpen)}
              bulkClientId={bulkClientId} onBulkClientIdChange={setBulkClientId}
              bulkFile={bulkFile} onBulkFileChange={setBulkFile}
              bulkError={bulkError} bulkResult={bulkResult}
              isPending={bulkUploadMutation.isPending}
              onUpload={handleBulkUpload} onDownloadTemplate={downloadTemplate}
            />
          </div>

          <BarInventoryPanel
            clients={clients}
            barsByClient={barsByClient}
            searchQuery={searchQuery} onSearchChange={setSearchQuery}
            totalBars={totalBars}
            openAccordions={openAccordions}
            accordionPages={accordionPages}
            packingStatusMap={packingStatusMap}
            onToggleAccordion={toggleAccordion}
            onSetPage={setAccordionPage}
            onSetEvidenceBarId={setEvidenceBarId}
            onSetConfirmDeleteId={setConfirmDeleteId}
          />
        </div>
      )}

      {/* ═══ TAB: VALIDACIÓN DE PACKING ═══ */}
      {activeTab === 'validacion' && (
        <div className="flex flex-col gap-6">
          {/* Parte Superior: Pendientes */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
            <PackingListSidebar
              pendingPackings={pendingPackings}
              selectedPackingId={selectedPackingId}
              onSelectPacking={setSelectedPackingId}
            />
            <ValidationDetailPanel
              selectedPacking={selectedPacking}
              validationResult={validationResult}
              validationEdits={validationEdits}
              allBarsValidated={allBarsValidated}
              validatedCount={validatedCount}
              totalCount={totalCount}
              isPending={finalizePacking.isPending}
              onRowClick={handleRowClick}
              onSetEvidenceBarId={setEvidenceBarId}
              onSetConfirmFinalizeModal={setConfirmFinalizeModal}
              onDownloadReport={handleDownloadReport}
            />
          </div>

          {/* Parte Inferior: Historial de Packings */}
          <div className="mt-10 pt-8 border-t border-[var(--pm-border)]/50 flex flex-col gap-6">
            <h2 className="text-lg font-mono font-bold text-[var(--pm-text-primary)]">
              Historial de Packings
            </h2>
            <HistoryFilters
              activeTab="packings" searchQuery={historySearchQuery} dateFrom={historyDateFrom}
              dateTo={historyDateTo} selectedProvider={historySelectedProvider}
              providers={historyPackingProviders}
              hasAnyFilter={!!(historySearchQuery || historyDateFrom || historyDateTo || historySelectedProvider)}
              onSearchChange={setHistorySearchQuery}
              onDateFromChange={setHistoryDateFrom} onDateToChange={setHistoryDateTo}
              onProviderChange={setHistorySelectedProvider}
              onClear={() => { setHistorySearchQuery(''); setHistoryDateFrom(''); setHistoryDateTo(''); setHistorySelectedProvider(''); }}
            />
            <PackingsTable
              packings={filteredHistoryPackings} isLoading={false}
              hasAnyFilter={!!(historySearchQuery || historyDateFrom || historyDateTo || historySelectedProvider)}
              expandedPackingId={expandedHistoryPackingId}
              expandedPacking={expandedHistoryPacking} loadingExpandedPacking={loadingExpandedHistoryPacking}
              onExpand={setExpandedHistoryPackingId}
              onClearFilters={() => { setHistorySearchQuery(''); setHistoryDateFrom(''); setHistoryDateTo(''); setHistorySelectedProvider(''); }}
              onViewBar={setHistoryViewBar}
              onDownloadReport={handleDownloadHistoryReport}
            />
          </div>
        </div>
      )}

      {/* Finalize Confirmation Modal */}
      <FinalizeConfirmationModal
        isOpen={!!confirmFinalizeModal && !!selectedPacking}
        onClose={() => setConfirmFinalizeModal(false)}
        onConfirm={handleConfirmFinalize}
      />

      {/* Evidence Modal */}
      <EvidenceModal
        barId={evidenceBarId}
        bars={bars}
        packingBars={selectedPacking?.bars}
        spValues={spValuesRef.current}
        barPhotoUrls={barPhotoUrls}
        onClose={() => setEvidenceBarId(null)}
      />

      {/* Bar Detail Modal */}
      {detailBar && (
        <BarDetailModal
          bar={detailBar}
          spValues={spValuesRef.current[detailBar.id]}
          onClose={() => setDetailBar(null)}
          onValidate={handleDetailValidate}
          onSave={handleDetailSave}
          isSaving={detailSaving}
        />
      )}

      {/* History Bar Detail Modal (read-only) */}
      {historyViewBar && (
        <BarDetailModal
          bar={historyViewBar}
          onClose={() => setHistoryViewBar(null)}
          readOnly
          zIndex="z-[110]"
        />
      )}

      {/* Confirm Registration Overlay */}
      {confirmRegOverlay && (
        <ConfirmRegistrationModal
          data={confirmRegOverlay}
          onClose={() => setConfirmRegOverlay(null)}
          onConfirm={handleConfirmBarRegistration}
        />
      )}

      {/* Confirm Bulk Upload Overlay */}
      {confirmBulkOverlay && (
        <ConfirmBulkUploadModal
          data={confirmBulkOverlay}
          fileName={bulkFile?.name}
          onClose={() => setConfirmBulkOverlay(null)}
          onConfirm={handleConfirmBulkUpload}
        />
      )}

      {/* Ingest Status Overlay */}
      <IngestStatusOverlay status={ingestStatus} />

      {/* Delete Confirm Modal */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => handleDeleteBar(confirmDeleteId!)}
        icon={<AlertTriangle className="w-4 h-4 text-[var(--pm-accent-red)]" />}
        title="Eliminar Barra"
        description={bars.find(b => b.id === confirmDeleteId)?.barNumber || ''}
        confirmLabel="Eliminar"
        confirmIcon={<Trash2 className="w-3.5 h-3.5" />}
        variant="danger"
      >
        <p className="text-xs text-[var(--pm-text-dim)] font-sans leading-relaxed">
          ¿Eliminar definitivamente esta barra del registro? Esta acción no se puede deshacer.
        </p>
      </ConfirmDialog>

      {/* Delete Status Overlay */}
      <DeleteStatusOverlay status={deleteStatus} />

      <p className="text-[10px] text-[var(--pm-text-dim)] font-mono text-center opacity-70">
        Packing v2 Premium · {totalBars} barras · {formatNumber(totalFineWeight, 2)} g FA · {pendingPackings.length} packing(s) pendiente(s)
      </p>
    </motion.div>
  );
}
