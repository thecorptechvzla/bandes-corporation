'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Flame, Layers } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useBars } from '@/hooks/useBars';
import { useProcesses, useCreateProcess } from '@/hooks/useProcesses';
import { useLots } from '@/hooks/useLots';
import { ProcessDetailModal } from '@/components/procesos/ProcessDetailModal';
import { ActiveProcessesMatrix } from '@/components/procesos/ActiveProcessesMatrix';
import { RecoveryModal } from '@/components/procesos/RecoveryModal';
import { SmeltingConfigForm } from '@/components/procesos/SmeltingConfigForm';
import { CompletedProcessesSection } from '@/components/procesos/CompletedProcessesSection';
import type { Process, Lot, Bar } from '@/types/api';

export default function V2ProcesosPage() {
  const { data: bars = [] } = useBars();
  const { data: clients = [] } = useClients();
  const { data: processes = [] } = useProcesses();
  const { data: lots = [] } = useLots();
  const createProcess = useCreateProcess();

  const [operator, setOperator] = useState('');
  const [moldCode, setMoldCode] = useState('');
  const [castingTemp, setCastingTemp] = useState('1064');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBarIds, setSelectedBarIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  const [showCompleted, setShowCompleted] = useState(false);

  const [activeLot, setActiveLot] = useState<Lot | null>(null);

  const availableBars = useMemo(
    () => bars.filter(b => b.status === 'IN_STOCK' && !b.lotId),
    [bars],
  );

  const activeProcesses = useMemo(
    () => processes.filter(p => p.status === 'OPEN'),
    [processes],
  );

  const completedProcesses = useMemo(
    () => processes.filter(p => p.status === 'CLOSED'),
    [processes],
  );

  const groupedProcesses = useMemo(() => {
    const groups: Record<string, Process[]> = {};
    activeProcesses.forEach(p => {
      if (!groups[p.clientId]) groups[p.clientId] = [];
      groups[p.clientId].push(p);
    });
    return groups;
  }, [activeProcesses]);

  const groupedCompleted = useMemo(() => {
    const groups: Record<string, Process[]> = {};
    completedProcesses.forEach(p => {
      if (!groups[p.clientId]) groups[p.clientId] = [];
      groups[p.clientId].push(p);
    });
    return groups;
  }, [completedProcesses]);

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

  const selectedProcess = useMemo(
    () => selectedProcessId ? processes.find(p => p.id === selectedProcessId) ?? null : null,
    [selectedProcessId, processes],
  );
  const selectedProcessLots = useMemo(
    () => selectedProcessId ? (processLotsMap[selectedProcessId] || []) : [],
    [selectedProcessId, processLotsMap],
  );

  const clientFilteredBars = useMemo(() => {
    if (!selectedClientId) return availableBars;
    return availableBars.filter(b => b.clientId === selectedClientId);
  }, [availableBars, selectedClientId]);

  const clientsWithAvailableBars = useMemo(
    () => clients.filter(c => availableBars.some(b => b.clientId === c.id)),
    [clients, availableBars],
  );

  const selectedMetrics = useMemo(() => {
    const sel = bars.filter(b => selectedBarIds.includes(b.id));
    return {
      count: sel.length,
      gross: sel.reduce((s, b) => s + Number(b.grossWeight), 0),
      fa: sel.reduce((s, b) => s + Number(b.fineWeight), 0),
    };
  }, [bars, selectedBarIds]);

  const handleBarToggle = (id: string) => {
    setSelectedBarIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id],
    );
  };

  const handleClientChange = (cId: string) => {
    setSelectedClientId(cId);
    setSelectedBarIds([]);
  };

  const handleSelectAllBars = () => {
    setSelectedBarIds(
      selectedBarIds.length === clientFilteredBars.length
        ? []
        : clientFilteredBars.map(b => b.id),
    );
  };

  const handleStartSmelting = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (selectedBarIds.length === 0) {
      setFormError('Seleccione al menos una barra disponible.');
      return;
    }
    if (!moldCode.trim()) {
      setFormError('Asigne un código de crisol/molde.');
      return;
    }
    if (!operator.trim()) {
      setFormError('Registre el nombre del operador.');
      return;
    }

    const selected = bars.filter(b => selectedBarIds.includes(b.id));
    const uniqueClients = [...new Set(selected.map(b => b.clientId))];
    if (uniqueClients.length > 1) {
      setFormError('No se pueden fundir juntos oros de distintos clientes.');
      return;
    }

    setCreating(true);
    try {
      const clientId = uniqueClients[0];
      await createProcess.mutateAsync({
        clientId,
        barIds: selectedBarIds,
        operator: operator.trim(),
        moldCode: moldCode.trim(),
        castingTemp: parseInt(castingTemp) || 1064,
      });
      setFormSuccess(`Fundición iniciada — ${selectedBarIds.length} barra(s) en crisol.`);
      setSelectedBarIds([]);
      setMoldCode('');
      setOperator('');
      setCastingTemp('1064');
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
            <Flame className="w-6 h-6 text-[var(--pm-accent-amber)]" />
            Monitoreo de <span className="text-[var(--pm-accent-amber)]">Procesos</span>
          </h1>
          <p className="text-xs text-[var(--pm-text-dim)] mt-0.5">Fundición, colada y recuperación de oro.</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--pm-text-dim)]">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-[var(--pm-accent-amber)]" />
            {activeProcesses.length} activos
          </span>
          <span className="hidden sm:inline">
            {lots.length} lotes
          </span>
        </div>
      </motion.div>

      {/* Split pane */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* ═══ LEFT: Form ═══ */}
        <SmeltingConfigForm
          clients={clientsWithAvailableBars}
          clientFilteredBars={clientFilteredBars}
          selectedClientId={selectedClientId}
          selectedBarIds={selectedBarIds}
          selectedMetrics={selectedMetrics}
          operator={operator}
          moldCode={moldCode}
          castingTemp={castingTemp}
          formError={formError}
          formSuccess={formSuccess}
          creating={creating}
          onOperatorChange={setOperator}
          onMoldCodeChange={setMoldCode}
          onCastingTempChange={setCastingTemp}
          onClientChange={handleClientChange}
          onBarToggle={handleBarToggle}
          onSelectAllBars={handleSelectAllBars}
          onSubmit={handleStartSmelting}
        />

        {/* ═══ RIGHT: Active Processes Matrix ═══ */}
        <ActiveProcessesMatrix
          groupedProcesses={groupedProcesses}
          clients={clients}
          lotBarsMap={lotBarsMap}
          processLotsMap={processLotsMap}
          onOpenRecovery={handleOpenRecovery}
        />
      </div>

      {/* Completed Processes */}
      <CompletedProcessesSection
        completedProcesses={completedProcesses}
        groupedCompleted={groupedCompleted}
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

      <p className="text-[9px] text-[var(--pm-text-dim)] font-mono text-center opacity-50">
        Datos actualizados en tiempo real · Bandes v2 Premium · {activeProcesses.length} procesos activos
      </p>

    </motion.div>
  );
}
