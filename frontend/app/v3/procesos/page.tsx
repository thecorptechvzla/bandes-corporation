'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame, Thermometer, User, Weight, Plus, CheckCircle2, Play,
  ChevronRight, Lock,
} from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useBars, useUpdateBar } from '@/hooks/useBars';
import { useProcesses, useCreateProcess, useUpdateProcess } from '@/hooks/useProcesses';
import { useLots, useCreateLot, useUpdateLot } from '@/hooks/useLots';
import { useRole } from '@/context/RoleContext';
import { formatWeight } from '@/lib/format';
import { HudButton } from '@/components/tactical/HudButton';
import { TerminalPanel } from '@/components/tactical/TerminalPanel';
import { TacticalCard } from '@/components/tactical/TacticalCard';
import type { Process, Lot, Bar } from '@/types/api';

export default function ReactorCorePage() {
  const { data: bars = [] } = useBars();
  const { data: clients = [] } = useClients();
  const { data: processes = [] } = useProcesses();
  const { data: lots = [] } = useLots();
  const { hasRole } = useRole();
  const canOperate = hasRole('ADMIN', 'OWNER', 'SUPERADMIN');
  const canDispatch = hasRole('OWNER', 'SUPERADMIN');

  const createProcess = useCreateProcess();
  const createLot = useCreateLot();
  const updateBar = useUpdateBar();
  const updateLot = useUpdateLot();
  const updateProcess = useUpdateProcess();

  const [operator, setOperator] = useState('');
  const [moldCode, setMoldCode] = useState('');
  const [castingTemp, setCastingTemp] = useState('1064');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBarIds, setSelectedBarIds] = useState<string[]>([]);
  const [batchError, setBatchError] = useState('');
  const [batchSuccess, setBatchSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  const [activeLot, setActiveLot] = useState<Lot | null>(null);
  const [recoveredWeight, setRecoveredWeight] = useState('');
  const [recoveredLeyAu, setRecoveredLeyAu] = useState('');
  const [recoveredLeyAg, setRecoveredLeyAg] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const availableBars = useMemo(() => bars.filter(b => b.status === 'IN_STOCK' && !b.lotId), [bars]);
  const activeProcesses = useMemo(() => processes.filter(p => p.status === 'OPEN'), [processes]);

  const groupedProcesses = useMemo(() => {
    const groups: Record<string, Process[]> = {};
    activeProcesses.forEach(p => {
      if (!groups[p.clientId]) groups[p.clientId] = [];
      groups[p.clientId].push(p);
    });
    return groups;
  }, [activeProcesses]);

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

  const clientFilteredBars = useMemo(() => {
    if (!selectedClientId) return availableBars;
    return availableBars.filter(b => b.clientId === selectedClientId);
  }, [availableBars, selectedClientId]);

  const selectedMetrics = useMemo(() => {
    const sel = bars.filter(b => selectedBarIds.includes(b.id));
    const weight = sel.reduce((s, b) => s + Number(b.grossWeight), 0);
    const fino = sel.reduce((s, b) => s + Number(b.fineWeight), 0);
    return { weight, fino, count: sel.length };
  }, [bars, selectedBarIds]);

  const totalActiveLots = useMemo(() => {
    return activeProcesses.reduce((s, p) => s + (processLotsMap[p.id]?.length || 0), 0);
  }, [activeProcesses, processLotsMap]);

  const handleBarToggle = (id: string) => {
    setSelectedBarIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleClientChange = (cId: string) => {
    setSelectedClientId(cId);
    setSelectedBarIds([]);
  };

  const handleSelectAllBars = () => {
    if (selectedBarIds.length === clientFilteredBars.length) {
      setSelectedBarIds([]);
    } else {
      setSelectedBarIds(clientFilteredBars.map(b => b.id));
    }
  };

  const handleStartSmelting = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchError('');
    setBatchSuccess('');

    if (selectedBarIds.length === 0) {
      setBatchError('Debe seleccionar al menos una barra disponible en bóveda.');
      return;
    }
    if (!moldCode.trim()) {
      setBatchError('Asigne un código de crisol/molde.');
      return;
    }
    if (!operator.trim()) {
      setBatchError('Registre el nombre del operador.');
      return;
    }

    const selectedBars = bars.filter(b => selectedBarIds.includes(b.id));
    const uniqueClients = [...new Set(selectedBars.map(b => b.clientId))];
    if (uniqueClients.length > 1) {
      setBatchError('No se pueden fundir juntos oros de distintos clientes.');
      return;
    }

    setCreating(true);
    try {
      const clientId = uniqueClients[0];
      const processName = `P-${new Date().toISOString().slice(0, 10)}-${clientId.slice(0, 6)}`;

      const process = await createProcess.mutateAsync({ name: processName, clientId });
      const lot = await createLot.mutateAsync({
        name: `LOTE-${moldCode}`,
        processId: process.id,
        operator,
        castingTemp: parseInt(castingTemp) || 1064,
        moldCode,
      });

      for (const barId of selectedBarIds) {
        await updateBar.mutateAsync({ id: barId, data: { lotId: lot.id, status: 'PROCESANDO' } });
      }

      setBatchSuccess(`Fundición iniciada — ${selectedBarIds.length} barra(s) en crisol.`);
      setSelectedBarIds([]);
      setMoldCode('');
      setOperator('');
      setCastingTemp('1064');
    } catch (err: any) {
      setBatchError(err?.message || 'Error al iniciar la fundición.');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenRecovery = (lot: Lot) => {
    const lotBarsList = lotBarsMap[lot.id] || [];
    const expectedFA = lotBarsList.reduce((s, b) => s + Number(b.fineWeight), 0);
    setActiveLot(lot);
    setRecoveredWeight(expectedFA.toFixed(4));
    setRecoveredLeyAu('');
    setRecoveredLeyAg('');
    setRecoveryError('');
    setRecoverySuccess(false);
  };

  const handleConfirmRecovery = async () => {
    if (!activeLot) return;
    setRecoveryError('');

    const recWeight = parseFloat(recoveredWeight);
    if (isNaN(recWeight) || recWeight <= 0) {
      setRecoveryError('Ingrese un peso recuperado válido.');
      return;
    }

    setConfirming(true);
    try {
      await updateLot.mutateAsync({
        id: activeLot.id,
        data: { recovered: recWeight, recoveryAt: new Date().toISOString() },
      });

      const processLots = processLotsMap[activeLot.processId] || [];
      const allLotsHaveRecovered = processLots.every(l =>
        l.id === activeLot.id ? recWeight > 0 : (l.recovered !== null && Number(l.recovered) > 0)
      );

      if (allLotsHaveRecovered) {
        await updateProcess.mutateAsync({
          id: activeLot.processId,
          data: { status: 'CLOSED' },
        });
      }

      const lotBarsList = lotBarsMap[activeLot.id] || [];
      for (const bar of lotBarsList) {
        await updateBar.mutateAsync({ id: bar.id, data: { status: 'COMPLETADO' } });
      }

      setRecoverySuccess(true);
      setTimeout(() => {
        setActiveLot(null);
        setRecoverySuccess(false);
      }, 2000);
    } catch (err: any) {
      setRecoveryError(err?.message || 'Error al confirmar recuperación.');
    } finally {
      setConfirming(false);
    }
  };

  const activeLotBars = activeLot ? lotBarsMap[activeLot.id] || [] : [];
  const activeLotGross = activeLotBars.reduce((s, b) => s + Number(b.grossWeight), 0);
  const activeLotFA = activeLotBars.reduce((s, b) => s + Number(b.fineWeight), 0);
  const recWeightNum = parseFloat(recoveredWeight) || 0;
  const discrepancy = activeLotFA > 0 ? ((recWeightNum - activeLotFA) / activeLotFA) * 100 : 0;
  const mermaGramos = activeLotFA > 0 ? activeLotFA - recWeightNum : 0;
  const mermaPct = activeLotFA > 0 ? (mermaGramos / activeLotFA) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-lg font-mono font-bold text-[var(--tac-text-primary)] tracking-tight flex items-center gap-2">
          <Flame className="w-5 h-5 text-[var(--tac-accent-amber)]" />
          {'>'} REACTOR CORE{' '}
          <span className="text-[var(--tac-accent-amber)] font-semibold">— NÚCLEOS EN FUSIÓN</span>
        </h1>
        <p className="text-[10px] font-mono text-[var(--tac-text-dim)] mt-1 tracking-[0.05em]">
          MONITOREO DE FUNDICIÓN DE ORO EN VIVO
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
          <TerminalPanel title="CONFIGURAR FUNDICIÓN" accent="amber">
            {availableBars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--tac-text-dim)] space-y-2">
                <Lock className="w-6 h-6 text-[var(--tac-text-dim)]/30" />
                <span className="text-[10px] font-mono">BÓVEDA SIN BARRAS DISPONIBLES</span>
              </div>
            ) : (
              <form onSubmit={handleStartSmelting} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.1em]">OPERADOR</label>
                  <input
                    type="text"
                    placeholder="Ej: Carlos Mendoza"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] px-2.5 py-2 text-[11px] font-mono text-[var(--tac-text-primary)] focus:outline-none focus:border-[var(--tac-accent-amber)]/60 transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.1em]">MOLDE/CRISOL</label>
                    <input
                      type="text"
                      placeholder="CRISOL-B12"
                      value={moldCode}
                      onChange={(e) => setMoldCode(e.target.value.toUpperCase())}
                      className="w-full bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] px-2.5 py-2 text-[11px] font-mono text-[var(--tac-text-primary)] focus:outline-none focus:border-[var(--tac-accent-amber)]/60 transition-colors uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.1em]">TEMP (°C)</label>
                    <input
                      type="number"
                      placeholder="1064"
                      value={castingTemp}
                      onChange={(e) => setCastingTemp(e.target.value)}
                      className="w-full bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] px-2.5 py-2 text-[11px] font-mono text-[var(--tac-text-primary)] focus:outline-none focus:border-[var(--tac-accent-amber)]/60 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.1em]">CLIENTE</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] px-2.5 py-2 text-[11px] font-mono text-[var(--tac-text-primary)] focus:outline-none focus:border-[var(--tac-accent-amber)]/60 transition-colors"
                  >
                    <option value="">TODOS</option>
                    {clients.filter(c => availableBars.some(b => b.clientId === c.id)).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.1em]">
                    <span>BARRA</span>
                    {clientFilteredBars.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAllBars}
                        className="text-[var(--tac-accent-amber)] hover:underline font-bold active:scale-95 cursor-pointer"
                      >
                        {selectedBarIds.length === clientFilteredBars.length ? 'DESELECCIONAR TODO' : 'SELECCIONAR TODO'}
                      </button>
                    )}
                  </div>

                  <div className="max-h-44 overflow-y-auto border border-[var(--tac-border)] divide-y divide-[var(--tac-border)]/50 bg-[var(--tac-bg-primary)]">
                    {clientFilteredBars.map(bar => {
                      const c = clients.find(cl => cl.id === bar.clientId);
                      const isChecked = selectedBarIds.includes(bar.id);
                      return (
                        <label
                          key={bar.id}
                          className={`flex items-center justify-between px-2.5 py-2 cursor-pointer transition-colors text-[10px] font-mono active:scale-95
                            ${isChecked ? 'bg-[var(--tac-bg-tertiary)] text-[var(--tac-accent-amber)]' : 'hover:bg-[var(--tac-bg-tertiary)]/50 text-[var(--tac-text-primary)]'}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleBarToggle(bar.id)}
                              className="accent-[var(--tac-accent-amber)] shrink-0"
                            />
                            <span className="font-bold truncate">{bar.barNumber}</span>
                            <span className="text-[var(--tac-text-dim)]">| {bar.purity}‰</span>
                          </div>
                          <span className="text-[var(--tac-accent-amber)] shrink-0 ml-2">
                            {formatWeight(bar.grossWeight, 'kg', 4)}
                          </span>
                          <span className="text-[var(--tac-text-dim)]/60 text-[8px] ml-1 truncate max-w-[60px]">
                            {c?.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {selectedMetrics.count > 0 && (
                  <div className="border border-[var(--tac-accent-amber)]/30 bg-[var(--tac-bg-primary)] p-2.5 space-y-1 font-mono text-[10px]">
                    <div className="flex justify-between text-[var(--tac-text-dim)] text-[9px] uppercase tracking-[0.1em]">
                      <span>Seleccionadas</span>
                      <span>{selectedMetrics.count} barra(s)</span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--tac-border)]/50 pt-1.5">
                      <span className="text-[var(--tac-text-dim)]">Peso Total:</span>
                      <span className="text-[var(--tac-text-primary)] font-bold">{formatWeight(selectedMetrics.weight, 'kg', 4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--tac-text-dim)]">FA Total:</span>
                      <span className="text-[var(--tac-accent-amber)] font-bold">{formatWeight(selectedMetrics.fino, 'kg', 4)}</span>
                    </div>
                  </div>
                )}

                {batchError && (
                  <div className="p-2.5 border border-[var(--tac-accent-red)]/40 bg-[var(--tac-accent-red)]/10 text-[var(--tac-accent-red)] text-[10px] font-mono">
                    {batchError}
                  </div>
                )}
                {batchSuccess && (
                  <div className="p-2.5 border border-[var(--tac-accent-green)]/40 bg-[var(--tac-accent-green)]/10 text-[var(--tac-accent-green)] text-[10px] font-mono">
                    {batchSuccess}
                  </div>
                )}

                <HudButton variant="primary" type="submit" loading={creating} disabled={!canOperate} className="w-full">
                  <Play className="w-3 h-3" />
                  {canOperate ? 'INICIAR FUNDIDO' : 'SOLO LECTURA'}
                </HudButton>
              </form>
            )}
          </TerminalPanel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="xl:col-span-2 space-y-4"
        >
          <div className="flex items-center gap-2 border border-[var(--tac-border)] bg-[var(--tac-bg-secondary)] px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-[var(--tac-accent-green)] animate-ping" />
            <span className="text-[9px] font-mono font-bold text-[var(--tac-accent-cyan)] uppercase tracking-[0.12em]">
              PING — {activeProcesses.length} NÚCLEO(S) EN FUSIÓN
            </span>
          </div>

          <div className="relative border border-[var(--tac-border)] bg-[var(--tac-bg-primary)] overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[var(--tac-accent-amber)]/8 to-transparent pointer-events-none" />
            <div className="absolute left-0 inset-y-0 w-px bg-gradient-to-b from-[var(--tac-accent-amber)]/40 via-[var(--tac-accent-amber)]/10 to-transparent pointer-events-none" />
            <div className="absolute right-0 inset-y-0 w-px bg-gradient-to-b from-[var(--tac-accent-amber)]/40 via-[var(--tac-accent-amber)]/10 to-transparent pointer-events-none" />

            <div className="absolute left-1.5 inset-y-14 w-0.5 flex flex-col justify-between opacity-30 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <span key={i} className="w-full h-0.5 bg-[var(--tac-accent-amber)]" />
              ))}
            </div>
            <div className="absolute right-1.5 inset-y-14 w-0.5 flex flex-col justify-between opacity-30 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <span key={i} className="w-full h-0.5 bg-[var(--tac-accent-amber)]" />
              ))}
            </div>

            <div className="text-center py-3 border-b border-[var(--tac-border)] relative">
              <span className="text-[8px] font-mono text-[var(--tac-text-dim)] tracking-[0.3em] uppercase select-none">
                • INDUCTION HEATING MATRIX •
              </span>
            </div>

            <div className="p-4 md:p-5 space-y-5 relative z-10">
              {activeProcesses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="w-12 h-12 border border-[var(--tac-border)] bg-[var(--tac-bg-secondary)] flex items-center justify-center">
                    <Flame className="w-6 h-6 text-[var(--tac-accent-amber)]/30" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <h3 className="text-sm font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.12em]">
                      CÁMARA VACÍA
                    </h3>
                    <p className="text-[10px] font-mono text-[var(--tac-text-dim)]/60 max-w-xs mx-auto">
                      Todos los crisoles han sido solidificados. Configure una nueva fundición para iniciar el ciclo de fusión.
                    </p>
                    <p className="text-[9px] font-mono text-[var(--tac-accent-amber)]/50 mt-3">
                      [ SIN NÚCLEOS ACTIVOS EN LA MATRIZ DE INDUCCIÓN ]
                    </p>
                  </div>
                </div>
              ) : (
                Object.keys(groupedProcesses).map((clientId, gIdx) => {
                  const client = clients.find(c => c.id === clientId);
                  const clientProcesses = groupedProcesses[clientId];
                  return (
                    <TacticalCard
                      key={clientId}
                      title={`${client?.name || 'DESCONOCIDO'} — ${clientProcesses.length} proceso(s)`}
                      accent="amber"
                    >
                      {clientProcesses.map(process => {
                        const processLots = processLotsMap[process.id] || [];
                        return (
                          <div key={process.id} className="mb-4 last:mb-0">
                            <div className="flex items-center gap-2 mb-3 border-b border-[var(--tac-border)]/50 pb-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--tac-accent-amber)] animate-pulse" />
                              <span className="text-[9px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.1em]">
                                {process.name}
                              </span>
                              <span className="text-[8px] font-mono text-[var(--tac-text-dim)]/50">
                                {processLots.length} lote(s)
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {processLots.map((lot, lIdx) => {
                                const lotBarsList = lotBarsMap[lot.id] || [];
                                const grossTotal = lotBarsList.reduce((s, b) => s + Number(b.grossWeight), 0);
                                const finoTotal = lotBarsList.reduce((s, b) => s + Number(b.fineWeight), 0);
                                const temp = lot.castingTemp || 1064;
                                const heatWidth = Math.min(100, (temp / 1200) * 100);

                                return (
                                  <motion.div
                                    key={lot.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + gIdx * 0.1 + lIdx * 0.05, duration: 0.35 }}
                                    className="border border-[var(--tac-border)] bg-[var(--tac-bg-secondary)] overflow-hidden group"
                                  >
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--tac-border)] bg-[var(--tac-bg-primary)]/50">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[8px] font-mono font-bold text-[var(--tac-accent-amber)] bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] px-1.5 py-0.5 uppercase shrink-0">
                                          {lot.moldCode || 'N/A'}
                                        </span>
                                        <span className="text-[10px] font-mono font-bold text-[var(--tac-text-primary)] truncate">
                                          {lot.name}
                                        </span>
                                      </div>
                                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 border border-[var(--tac-accent-red)]/40 text-[var(--tac-accent-red)] bg-[var(--tac-accent-red)]/5 shrink-0">
                                        {temp}°C
                                      </span>
                                    </div>

                                    <div className="p-3 space-y-2.5">
                                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-[var(--tac-text-dim)]">
                                        <User className="w-3 h-3" />
                                        <span>{lot.operator || 'SIN OPERADOR'}</span>
                                      </div>

                                      <div className="space-y-1">
                                        <div className="flex justify-between text-[8px] font-mono text-[var(--tac-text-dim)]/60">
                                          <span>CARGA TÉRMICA</span>
                                          <span>{temp}°C / 1200°C</span>
                                        </div>
                                        <div className="h-2 bg-[var(--tac-bg-primary)] overflow-hidden">
                                          <div
                                            className="h-full bg-gradient-to-r from-[var(--tac-accent-amber)] to-[var(--tac-accent-red)] transition-all duration-700"
                                            style={{ width: `${heatWidth}%` }}
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-1">
                                        <span className="text-[8px] font-mono font-bold text-[var(--tac-text-dim)]/50 uppercase tracking-[0.1em]">
                                          MATRIZ DE LINGOTES
                                        </span>
                                        <div className="grid grid-cols-2 gap-1.5">
                                          {lotBarsList.map(bar => (
                                            <div
                                              key={bar.id}
                                              className="relative border border-[var(--tac-border)] bg-[var(--tac-bg-primary)] p-1.5 text-center overflow-hidden"
                                            >
                                              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-[var(--tac-accent-amber)] via-[var(--tac-accent-amber)] to-[var(--tac-accent-red)] animate-pulse" />
                                              <span className="text-[9px] font-mono font-bold text-[var(--tac-accent-amber)] block">
                                                {bar.barNumber.split('-').pop() || bar.barNumber}
                                              </span>
                                              <span className="text-[7px] font-mono text-[var(--tac-text-dim)]">
                                                {formatWeight(bar.grossWeight, 'kg', 4)} | {bar.purity}‰
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="border-t border-[var(--tac-border)]/50 pt-2 flex justify-between text-[9px] font-mono">
                                        <span className="text-[var(--tac-text-dim)]">
                                          Total Bruto: <strong className="text-[var(--tac-text-primary)]">{formatWeight(grossTotal, 'kg', 4)}</strong>
                                        </span>
                                        <span className="text-[var(--tac-accent-amber)]">
                                          FA: <strong>{formatWeight(finoTotal, 'kg', 4)}</strong>
                                        </span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => canOperate && handleOpenRecovery(lot)}
                                        disabled={!canOperate}
                                        className={`w-full flex items-center justify-center gap-1 py-1.5 border border-[var(--tac-border)] text-[9px] font-mono font-bold transition-colors active:scale-95 cursor-pointer ${canOperate ? 'text-[var(--tac-accent-amber)] hover:bg-[var(--tac-bg-tertiary)]' : 'text-[var(--tac-text-dim)]/40 cursor-not-allowed'}`}
                                      >
                                        {canOperate ? 'CALIBRAR COLADA' : 'SOLO LECTURA'} <ChevronRight className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </TacticalCard>
                  );
                })
              )}
            </div>

            <div className="h-1 bg-[var(--tac-bg-secondary)] border-t border-[var(--tac-border)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--tac-accent-amber)]/20 to-transparent animate-pulse" />
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="flex items-center gap-3 text-[8px] font-mono text-[var(--tac-text-dim)] border-t border-[var(--tac-border)] pt-2"
      >
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-[var(--tac-accent-green)]" />
          DB ONLINE
        </span>
        <span>{activeProcesses.length} proceso(s) activo(s)</span>
        <span>{totalActiveLots} lote(s) en fusión</span>
      </motion.div>

      <AnimatePresence>
        {activeLot && (
          <motion.div
            key="recovery-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[16px] bg-black/90"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              <TacticalCard accent="amber" className="w-full max-w-lg">
                <div className="mb-4 border-b border-[var(--tac-border)] pb-3">
                  <span className="text-[10px] font-mono font-bold text-[var(--tac-accent-amber)] uppercase tracking-[0.12em]">
                    {'>'} SECUENCIA DE RECUPERACIÓN — CIERRE DE COLADA
                  </span>
                  <h3 className="text-sm font-mono font-bold text-[var(--tac-text-primary)] mt-2">
                    {activeLot.name}
                  </h3>
                  <p className="text-[9px] font-mono text-[var(--tac-text-dim)]">
                    {activeLot.operator && `Operador: ${activeLot.operator} · `}
                    Molde: {activeLot.moldCode || 'N/A'} · {activeLot.processId.slice(0, 8)}
                  </p>
                </div>

                <div className="border border-[var(--tac-border)] bg-[var(--tac-bg-primary)] p-2.5 mb-4 space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between text-[var(--tac-text-dim)]">
                    <span>Gross loaded:</span>
                    <span className="text-[var(--tac-text-primary)] font-bold">{formatWeight(activeLotGross, 'kg', 4)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--tac-text-dim)]">
                    <span>FA expected:</span>
                    <span className="text-[var(--tac-accent-amber)] font-bold">{formatWeight(activeLotFA, 'kg', 4)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.1em]">
                      PESO RECUPERADO (R)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="0.0000"
                        value={recoveredWeight}
                        onChange={(e) => setRecoveredWeight(e.target.value)}
                        className="w-full bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] px-2.5 py-2 pr-14 text-[11px] font-mono font-bold text-[var(--tac-text-primary)] focus:outline-none focus:border-[var(--tac-accent-amber)]/60 transition-colors"
                      />
                      <span className="absolute right-2.5 top-2 text-[9px] font-mono text-[var(--tac-text-dim)]">kg</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.1em]">
                        LEY AU ‰
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="1000"
                        placeholder="995"
                        value={recoveredLeyAu}
                        onChange={(e) => setRecoveredLeyAu(e.target.value)}
                        className="w-full bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] px-2.5 py-2 text-[11px] font-mono text-[var(--tac-text-primary)] focus:outline-none focus:border-[var(--tac-accent-amber)]/60 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.1em]">
                        LEY AG ‰
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="1000"
                        placeholder="5"
                        value={recoveredLeyAg}
                        onChange={(e) => setRecoveredLeyAg(e.target.value)}
                        className="w-full bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] px-2.5 py-2 text-[11px] font-mono text-[var(--tac-text-primary)] focus:outline-none focus:border-[var(--tac-accent-amber)]/60 transition-colors"
                      />
                    </div>
                  </div>

                  {recWeightNum > 0 && (
                    <div className="border border-[var(--tac-border)] bg-[var(--tac-bg-primary)] p-2.5 space-y-1 font-mono text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-[var(--tac-text-dim)]">FA (Σ):</span>
                        <span className="text-[var(--tac-accent-amber)] font-bold">{formatWeight(activeLotFA, 'kg', 4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--tac-text-dim)]">R (Recuperado):</span>
                        <span className="text-[var(--tac-text-primary)] font-bold">{formatWeight(recWeightNum, 'kg', 4)}</span>
                      </div>
                      <div className="flex justify-between border-t border-[var(--tac-border)]/50 pt-1">
                        <span className="text-[var(--tac-text-dim)]">MERMA:</span>
                        <span className={`font-bold ${mermaPct > 5 ? 'text-[var(--tac-accent-red)]' : 'text-[var(--tac-accent-green)]'}`}>
                          {formatWeight(mermaGramos, 'kg', 4)} ({mermaPct.toFixed(2)}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-[8px]">
                        <span className="text-[var(--tac-text-dim)]">Discrepancia vs FA:</span>
                        <span className={discrepancy < -10 || discrepancy > 10 ? 'text-[var(--tac-accent-red)]' : 'text-[var(--tac-accent-green)]'}>
                          {discrepancy >= 0 ? '+' : ''}{discrepancy.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {recoveryError && (
                    <div className="p-2 border border-[var(--tac-accent-red)]/40 bg-[var(--tac-accent-red)]/10 text-[var(--tac-accent-red)] text-[10px] font-mono">
                      {recoveryError}
                    </div>
                  )}

                  {recoverySuccess && (
                    <div className="p-2 border border-[var(--tac-accent-green)]/40 bg-[var(--tac-accent-green)]/10 text-[var(--tac-accent-green)] text-[10px] font-mono flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      RECUPERACIÓN CONFIRMADA — COLADA CERRADA
                    </div>
                  )}

                  {!recoverySuccess && (
                    <div className="flex gap-3 pt-1">
                      <HudButton variant="ghost" onClick={() => setActiveLot(null)} className="flex-1">
                        CANCELAR
                      </HudButton>
                      <HudButton variant="primary" onClick={handleConfirmRecovery} loading={confirming} className="flex-1">
                        <CheckCircle2 className="w-3 h-3" />
                        CONFIRMAR RECUPERACIÓN
                      </HudButton>
                    </div>
                  )}
                </div>
              </TacticalCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
