'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { Flame, Layers } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useBars } from '@/hooks/useBars';
import { useProcesses, useCreateProcess, useCancelProcess } from '@/hooks/useProcesses';
import { useLots } from '@/hooks/useLots';
import { ProcessDetailModal } from '@/components/procesos/ProcessDetailModal';
import { ProcessAuditModal } from '@/components/procesos/ProcessAuditModal';
import { ActiveProcessesMatrix } from '@/components/procesos/ActiveProcessesMatrix';
import { RecoveryModal } from '@/components/procesos/RecoveryModal';
import { SmeltingConfigForm } from '@/components/procesos/SmeltingConfigForm';
import { EvidenceModal } from '@/components/packing/EvidenceModal';
import { CompletedProcessesSection } from '@/components/procesos/CompletedProcessesSection';
import type { Process, Lot, Bar } from '@/types/api';

export default function V2ProcesosPage() {
  const { data: bars = [] } = useBars();
  const { data: clients = [] } = useClients();
  const { data: processes = [] } = useProcesses();
  const { data: lots = [] } = useLots();
  const createProcess = useCreateProcess();
  const cancelProcess = useCancelProcess();

  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectedBarIds, setSelectedBarIds] = useState<string[]>([]);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  const [showCompleted, setShowCompleted] = useState(false);
  const [activeLot, setActiveLot] = useState<Lot | null>(null);
  const [evidenceBarId, setEvidenceBarId] = useState<string | null>(null);

  const uploadPhoto = useCallback(async (blob: Blob): Promise<string> => {
    const fd = new FormData();
    fd.append('file', blob, `photo-${Date.now()}.jpg`);
    const res = await fetch('/api/blob/upload', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Error al subir la foto');
    const data = await res.json();
    return data.url as string;
  }, []);

  const availableBars = useMemo(
    () => bars.filter(b => b.status === 'IN_STOCK' && !b.lotId),
    [bars],
  );

  const activeProcesses = useMemo(
    () => processes.filter(p => p.status === 'OPEN'),
    [processes],
  );

  const historyProcesses = useMemo(
    () => [...processes].sort((a, b) => {
      const order: Record<Process['status'], number> = { OPEN: 0, CLOSED: 1, CANCELLED: 2 };
      return order[a.status] - order[b.status] || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }),
    [processes],
  );

  const groupedHistory = useMemo(() => {
    const groups: Record<string, Process[]> = {};
    historyProcesses.forEach(p => {
      if (!groups[p.clientId]) groups[p.clientId] = [];
      groups[p.clientId].push(p);
    });
    return groups;
  }, [historyProcesses]);

  const lotBarsMap = useMemo(() => {
    const map: Record<string, Bar[]> = {};
    bars.forEach(b => {
      if (b.lotId) {
        if (!map[b.lotId]) map[b.lotId] = [];
        map[b.lotId].push(b);
      }
    });
    return map;
  }, [bars]);

  const processLotsMap = useMemo(() => {
    const map: Record<string, Lot[]> = {};
    lots.forEach(l => {
      if (!map[l.processId]) map[l.processId] = [];
      map[l.processId].push(l);
    });
    return map;
  }, [lots]);

  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [expandedLotId, setExpandedLotId] = useState<string | null>(null);
  const handleViewDetail = (id: string) => { setSelectedProcessId(id); setExpandedLotId(null); };

  const [auditProcessId, setAuditProcessId] = useState<string | null>(null);

  const selectedProcess = useMemo(
    () => selectedProcessId ? processes.find(p => p.id === selectedProcessId) ?? null : null,
    [selectedProcessId, processes],
  );
  const selectedProcessLots = useMemo(
    () => selectedProcessId ? (processLotsMap[selectedProcessId] || []) : [],
    [selectedProcessId, processLotsMap],
  );

  const auditProcess = useMemo(
    () => auditProcessId ? processes.find(p => p.id === auditProcessId) ?? null : null,
    [auditProcessId, processes],
  );
  const auditProcessLots = useMemo(
    () => auditProcessId ? (processLotsMap[auditProcessId] || []) : [],
    [auditProcessId, processLotsMap],
  );

  const handleToggleClient = (clientId: string) => {
    setSelectedClientIds(prev => {
      const next = prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId];
      // Remove bars of deselected clients
      if (prev.includes(clientId)) {
        setSelectedBarIds(ids =>
          ids.filter(id => {
            const bar = bars.find(b => b.id === id);
            return bar && next.includes(bar.clientId);
          }),
        );
      }
      return next;
    });
  };

  const handleSelectAllClients = () => {
    const clientsWithBars = clients.filter(c => availableBars.some(b => b.clientId === c.id));
    const allSelected = selectedClientIds.length === clientsWithBars.length;
    if (allSelected) {
      setSelectedClientIds([]);
      setSelectedBarIds([]);
    } else {
      setSelectedClientIds(clientsWithBars.map(c => c.id));
    }
  };

  const handleBarToggle = (barId: string) => {
    setSelectedBarIds(prev =>
      prev.includes(barId) ? prev.filter(id => id !== barId) : [...prev, barId],
    );
  };

  const handleSelectAllBarsOfClient = (clientId: string) => {
    const clientBarIds = availableBars
      .filter(b => b.clientId === clientId)
      .map(b => b.id);
    const allSelected = clientBarIds.every(id => selectedBarIds.includes(id));
    setSelectedBarIds(prev => {
      if (allSelected) {
        return prev.filter(id => !clientBarIds.includes(id));
      } else {
        return [...new Set([...prev, ...clientBarIds])];
      }
    });
  };

  const handleToggleSupplier = (clientId: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId); else next.add(clientId);
      return next;
    });
  };

  const isSupplierAllSelected = useCallback((clientId: string) => {
    const clientBarIds = availableBars
      .filter(b => b.clientId === clientId)
      .map(b => b.id);
    return clientBarIds.length > 0 && clientBarIds.every(id => selectedBarIds.includes(id));
  }, [availableBars, selectedBarIds]);

  // Initialize all groups open when bars change
  React.useEffect(() => {
    const clientsWithBars = clients.filter(c => availableBars.some(b => b.clientId === c.id));
    setOpenGroups(new Set(clientsWithBars.map(c => c.id)));
  }, [availableBars.length, clients.length]);

  const handleStartSmelting = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (selectedBarIds.length === 0) {
      setFormError('Seleccione al menos una barra disponible.');
      return;
    }

    // Pick representative clientId from first selected bar
    const selectedBars = bars.filter(b => selectedBarIds.includes(b.id));
    if (selectedBars.length === 0) {
      setFormError('No se encontraron barras seleccionadas.');
      return;
    }
    const representativeClientId = selectedBars[0].clientId;

    setCreating(true);
    try {
      // Single consolidated process for all selected bars
      await createProcess.mutateAsync({
        clientId: representativeClientId,
        barIds: selectedBarIds,
        operator: 'SISTEMA',
        moldCode: `FND-${Date.now().toString(36).toUpperCase()}`,
      });
      setFormSuccess(
        `Fundición iniciada — ${selectedBarIds.length} barra(s) consolidadas en 1 solo proceso.`,
      );
      setSelectedBarIds([]);
      setSelectedClientIds([]);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Error al iniciar la fundición.');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenRecovery = (lot: Lot) => {
    setActiveLot(lot);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-xl font-semibold text-[var(--pm-text-primary)] font-sans flex items-center gap-2.5">
            <Flame className="w-6 h-6 text-[var(--pm-accent-emerald)]" />
            Monitoreo de <span className="text-[var(--pm-accent-emerald)]">Procesos</span>
          </h1>
          <p className="text-xs text-[var(--pm-text-dim)] mt-0.5">Fundición, colada y recuperación de oro.</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--pm-text-dim)]">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-[var(--pm-accent-emerald)]" />
            {activeProcesses.length} activos
          </span>
          <span className="hidden sm:inline">
            {lots.length} lotes
          </span>
        </div>
      </motion.div>

      {/* Split pane */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* ═══ LEFT: Multi-Provider Selection ═══ */}
        <SmeltingConfigForm
          clients={clients}
          bars={bars}
          selectedClientIds={selectedClientIds}
          selectedBarIds={selectedBarIds}
          openGroups={openGroups}
          formError={formError}
          formSuccess={formSuccess}
          creating={creating}
          onToggleClient={handleToggleClient}
          onSelectAllClients={handleSelectAllClients}
          onBarToggle={handleBarToggle}
          onSelectAllBarsOfClient={handleSelectAllBarsOfClient}
          onToggleSupplier={handleToggleSupplier}
          isSupplierAllSelected={isSupplierAllSelected}
          onOpenDetail={setEvidenceBarId}
          onSubmit={handleStartSmelting}
        />

        {/* ═══ RIGHT: Active Processes Matrix ═══ */}
        <ActiveProcessesMatrix
          activeProcesses={activeProcesses}
          clients={clients}
          lotBarsMap={lotBarsMap}
          processLotsMap={processLotsMap}
          onOpenRecovery={handleOpenRecovery}
          onCancelProcess={(id) => cancelProcess.mutateAsync(id)}
          onOpenProcess={(proc) => setAuditProcessId(proc.id)}
        />
      </div>

      {/* Completed Processes */}
      <CompletedProcessesSection
        processes={historyProcesses}
        groupedProcesses={groupedHistory}
        processLotsMap={processLotsMap}
        clients={clients}
        isExpanded={showCompleted}
        onToggle={() => setShowCompleted(!showCompleted)}
        onViewDetail={handleViewDetail}
      />

      {/* Recovery Modal */}
      {activeLot && (
        <RecoveryModal
          lot={activeLot}
          lotBarsMap={lotBarsMap}
          processLotsMap={processLotsMap}
          onClose={() => setActiveLot(null)}
          uploadPhoto={uploadPhoto}
          isMixedProcess={processes.some(p => p.id === activeLot.processId && p.isMixed)}
        />
      )}

      {/* Process Detail Modal */}
      {selectedProcess && (
        <ProcessDetailModal
          process={selectedProcess}
          lots={selectedProcessLots}
          lotBarsMap={lotBarsMap}
          clients={clients}
          onClose={() => setSelectedProcessId(null)}
        />
      )}

      {/* Process Audit Modal — Ficha Técnica del Proceso */}
      {auditProcess && (
        <ProcessAuditModal
          process={auditProcess}
          lots={auditProcessLots}
          lotBarsMap={lotBarsMap}
          clients={clients}
          onClose={() => setAuditProcessId(null)}
        />
      )}

      {/* Evidence Modal — bar detail from Eye icon */}
      <EvidenceModal
        barId={evidenceBarId}
        bars={bars}
        spValues={{}}
        barPhotoUrls={{}}
        label="DETALLE DE BARRA"
        onClose={() => setEvidenceBarId(null)}
      />

      <p className="text-[10px] text-[var(--pm-text-dim)] font-mono text-center opacity-70">
        Datos actualizados en tiempo real · Bandes v2 Premium · {activeProcesses.length} procesos activos
      </p>

    </motion.div>
  );
}
