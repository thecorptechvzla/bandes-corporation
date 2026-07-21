'use client';

import React, { useState, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame, Thermometer, User, Weight, Plus, CheckCircle2, Play,
  ChevronRight, ChevronDown, Lock, AlertTriangle, Microscope,
  Layers, Sparkles, X, Zap, Eye, Cpu,
} from 'lucide-react';
import { HudButton } from '@/components/tactical/HudButton';
import { useClients } from '@/hooks/useClients';
import { useBars, useUpdateBar } from '@/hooks/useBars';
import { useProcesses, useCreateProcess, useUpdateProcess } from '@/hooks/useProcesses';
import { useLots, useUpdateLot } from '@/hooks/useLots';
import { formatNumber } from '@/lib/format';
import type { Process, Lot, Bar } from '@/types/api';

export default function V2ProcesosPage() {
  const { data: bars = [] } = useBars();
  const { data: clients = [] } = useClients();
  const { data: processes = [] } = useProcesses();
  const { data: lots = [] } = useLots();
  const createProcess = useCreateProcess();
  const updateBar = useUpdateBar();
  const updateLot = useUpdateLot();
  const updateProcess = useUpdateProcess();

  const [operator, setOperator] = useState('');
  const [moldCode, setMoldCode] = useState('');
  const [castingTemp, setCastingTemp] = useState('1064');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBarIds, setSelectedBarIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  const [activeLot, setActiveLot] = useState<Lot | null>(null);
  const [recoveredWeight, setRecoveredWeight] = useState('');
  const [recoveredLeyAu, setRecoveredLeyAu] = useState('');
  const [recoveredLeyAg, setRecoveredLeyAg] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [hardwareMessage, setHardwareMessage] = useState('');
  const [activeHardwareMode, setActiveHardwareMode] = useState<'WEIGHT' | 'LEY' | null>(null);
  const [hwWeight, setHwWeight] = useState('');
  const [hwLeyAu, setHwLeyAu] = useState('');
  const [hwLeyAg, setHwLeyAg] = useState('');

  const [showCompleted, setShowCompleted] = useState(false);

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
    const lotBarsList = lotBarsMap[lot.id] || [];
    const expectedFA = lotBarsList.reduce((s, b) => s + Number(b.fineWeight), 0);
    setActiveLot(lot);
    setRecoveredWeight(expectedFA.toFixed(4));
    setRecoveredLeyAu('');
    setRecoveredLeyAg('');
    setRecoveryError('');
    setRecoverySuccess(false);
  };

  const activeLotBars = activeLot ? lotBarsMap[activeLot.id] || [] : [];
  const activeLotGross = activeLotBars.reduce((s, b) => s + Number(b.grossWeight), 0);
  const activeLotFA = activeLotBars.reduce((s, b) => s + Number(b.fineWeight), 0);

  const recWeightNum = parseFloat(recoveredWeight) || 0;
  const discrepancy = activeLotFA > 0 ? ((recWeightNum - activeLotFA) / activeLotFA) * 100 : 0;
  const mermaGramos = activeLotFA - recWeightNum;
  const mermaPct = activeLotFA > 0 ? (mermaGramos / activeLotFA) * 100 : 0;

  const handleConfirmRecovery = async () => {
    if (!activeLot) return;
    setRecoveryError('');
    const rw = parseFloat(recoveredWeight);
    if (isNaN(rw) || rw <= 0) {
      setRecoveryError('Ingrese un peso recuperado válido.');
      return;
    }
    setConfirming(true);
    try {
      await updateLot.mutateAsync({
        id: activeLot.id,
        data: { recovered: rw, recoveryAt: new Date().toISOString() },
      });
      const pl = processLotsMap[activeLot.processId] || [];
      const allDone = pl.every(l =>
        l.id === activeLot.id ? rw > 0 : (l.recovered !== null && Number(l.recovered) > 0),
      );
      if (allDone) {
        await updateProcess.mutateAsync({
          id: activeLot.processId,
          data: { status: 'CLOSED' },
        });
      }
      const lb = lotBarsMap[activeLot.id] || [];
      for (const bar of lb) {
        await updateBar.mutateAsync({ id: bar.id, data: { status: 'COMPLETADO' } });
      }
      setRecoverySuccess(true);
      setTimeout(() => { setActiveLot(null); setRecoverySuccess(false); }, 2000);
    } catch (err: any) {
      setRecoveryError(err?.message || 'Error al confirmar recuperación.');
    } finally {
      setConfirming(false);
    }
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
        <div className="space-y-5">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="premium-card overflow-hidden"
          >
            <div className="px-5 pt-5 pb-2 border-b border-[var(--pm-border)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Play className="w-3.5 h-3.5 text-[var(--pm-accent-amber)]" />
                </div>
                <span className="text-xs font-mono font-bold text-[var(--pm-accent-amber)] uppercase tracking-wider">Configurar Fundición</span>
              </div>
            </div>

            <form onSubmit={handleStartSmelting} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3" /> Operador
                  </label>
                  <input type="text" placeholder="Nombre del operador" value={operator}
                    onChange={e => setOperator(e.target.value)}
                    className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-sans text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-amber)] transition-colors placeholder:text-[var(--pm-text-dim)]/30"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Crisol / Molde</label>
                  <input type="text" placeholder="Ej: CR-001" value={moldCode}
                    onChange={e => setMoldCode(e.target.value.toUpperCase())}
                    className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-amber)] transition-colors uppercase placeholder:text-[var(--pm-text-dim)]/30"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
                    <Thermometer className="w-3 h-3" /> Temp. Colada (°C)
                  </label>
                  <input type="number" min="800" max="1400" value={castingTemp}
                    onChange={e => setCastingTemp(e.target.value)}
                    className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-amber)] transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Cliente</label>
                  <select value={selectedClientId} onChange={e => handleClientChange(e.target.value)}
                    className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-sans text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-amber)] transition-colors cursor-pointer"
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientsWithAvailableBars.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bar selection */}
              {selectedClientId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">
                      Barras Disponibles ({clientFilteredBars.length})
                    </span>
                    <button type="button" onClick={handleSelectAllBars}
                      className="text-[9px] font-mono text-[var(--pm-accent-amber)] hover:text-[var(--pm-accent-gold)] active:scale-95 transition-all cursor-pointer"
                    >
                      {selectedBarIds.length === clientFilteredBars.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto v2-scroll border border-[var(--pm-border)] rounded-lg">
                    <table className="premium-table w-full">
                      <thead>
                        <tr>
                          <th className="w-8 text-center">
                            <input type="checkbox" checked={selectedBarIds.length === clientFilteredBars.length && clientFilteredBars.length > 0}
                              onChange={handleSelectAllBars}
                              className="accent-[var(--pm-accent-amber)] cursor-pointer"
                            />
                          </th>
                          <th>Código</th>
                          <th className="text-right">Bruto (g)</th>
                          <th className="text-right">FA (g)</th>
                          <th className="text-right">Au (‰)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientFilteredBars.map((bar, idx) => (
                          <tr key={bar.id} onClick={() => handleBarToggle(bar.id)}
                            className={`odd:bg-[var(--pm-bg-deepest)]/30 hover:bg-[var(--pm-bg-tertiary)]/50 transition-all cursor-pointer ${selectedBarIds.includes(bar.id) ? 'bg-[var(--pm-accent-amber)]/5' : ''}`}
                          >
                            <td className="text-center">
                              <input type="checkbox" checked={selectedBarIds.includes(bar.id)}
                                onChange={() => handleBarToggle(bar.id)}
                                className="accent-[var(--pm-accent-amber)] cursor-pointer"
                              />
                            </td>
                            <td className="font-mono font-bold text-[var(--pm-accent-gold)] tracking-wider text-[11px]">{bar.barNumber}</td>
                            <td className="text-right font-mono text-[var(--pm-text-primary)]">{formatNumber(Number(bar.grossWeight), 2)}</td>
                            <td className="text-right font-mono text-[var(--pm-text-primary)]">{formatNumber(Number(bar.fineWeight), 4)}</td>
                            <td className="text-right font-mono text-[var(--pm-text-dim)]">{bar.purity}‰</td>
                          </tr>
                        ))}
                        {clientFilteredBars.length === 0 && (
                          <tr><td colSpan={5} className="text-center py-6 text-[10px] text-[var(--pm-text-dim)] font-mono italic">Sin barras disponibles</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {selectedMetrics.count > 0 && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 px-3 py-2 rounded-lg border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-[10px] font-mono"
                    >
                      <span className="text-[var(--pm-text-dim)]">{selectedMetrics.count} barras</span>
                      <span className="text-[var(--pm-accent-amber)]">Bruto: {formatNumber(selectedMetrics.gross, 2)} g</span>
                      <span className="text-[var(--pm-accent-gold)]">FA: {formatNumber(selectedMetrics.fa, 4)} g</span>
                    </motion.div>
                  )}
                </div>
              )}

              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-mono bg-[var(--pm-accent-red)]/10 border border-[var(--pm-accent-red)]/25 text-[var(--pm-accent-red)]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
                </div>
              )}
              {formSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-mono bg-[var(--pm-accent-emerald)]/10 border border-[var(--pm-accent-emerald)]/25 text-[var(--pm-accent-emerald)]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />{formSuccess}
                </div>
              )}

              <button type="submit" disabled={creating || selectedBarIds.length === 0}
                className="w-full py-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.1))',
                  color: 'var(--pm-accent-amber)', border: '1px solid rgba(245,158,11,0.3)',
                }}
              >
                {creating ? (
                  <><div className="w-4 h-4 border-2 border-[var(--pm-accent-amber)] border-t-transparent rounded-full animate-spin" /> Iniciando Fundición...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Iniciar Fundición ({selectedBarIds.length} barras)</>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* ═══ RIGHT: Active Processes Matrix ═══ */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
          className="premium-card overflow-hidden"
        >
          <div className="px-5 py-3.5 border-b border-[var(--pm-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--pm-accent-amber)]" />
              <span className="text-xs font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Núcleos Activos</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">{activeProcesses.length} procesos</span>
          </div>

          <div className="divide-y divide-[var(--pm-border)] overflow-y-auto max-h-[calc(100vh-280px)] v2-scroll">
            {Object.keys(groupedProcesses).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[var(--pm-text-dim)]">
                <Flame className="w-10 h-10 text-[var(--pm-accent-amber)]/20 mb-3 animate-pulse" />
                <span className="text-sm font-sans">Sin procesos activos</span>
                <p className="text-[10px] font-mono mt-1">Inicie una fundición desde el panel izquierdo.</p>
              </div>
            ) : (
              Object.entries(groupedProcesses).map(([cId, procs]) => {
                const client = clients.find(c => c.id === cId);
                const totalFA = procs.reduce((sp, p) => {
                  const pl = processLotsMap[p.id] || [];
                  return sp + pl.reduce((sl, l) => {
                    const lb = lotBarsMap[l.id] || [];
                    return sl + lb.reduce((sb, b) => sb + Number(b.fineWeight), 0);
                  }, 0);
                }, 0);
                return (
                  <div key={cId} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-sans font-semibold text-[var(--pm-text-primary)]">{client?.name || cId}</span>
                      <span className="text-[10px] font-mono text-[var(--pm-accent-amber)]">FA: {formatNumber(totalFA, 2)} g</span>
                    </div>
                    <div className="space-y-2">
                      {procs.map(proc => {
                        const pLots = processLotsMap[proc.id] || [];
                        return (
                          <div key={proc.id} className="p-3 rounded-lg border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/40">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-amber)]">{proc.name}</span>
                              <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">{pLots.length} lote{pLots.length !== 1 ? 's' : ''}</span>
                            </div>
                            {pLots.map(lot => {
                              const lb = lotBarsMap[lot.id] || [];
                              const lotFA = lb.reduce((s, b) => s + Number(b.fineWeight), 0);
                              const lotGross = lb.reduce((s, b) => s + Number(b.grossWeight), 0);
                              return (
                                <div key={lot.id} className="p-2 rounded border border-[var(--pm-border)] bg-[var(--pm-bg-primary)] mb-1.5 last:mb-0">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] font-mono font-bold text-[var(--pm-text-primary)]">{lot.name}</span>
                                      {lot.moldCode && <span className="text-[8px] font-mono text-[var(--pm-text-dim)]">({lot.moldCode})</span>}
                                    </div>
                                    <button type="button" onClick={() => handleOpenRecovery(lot)}
                                      className="px-2 py-1 rounded text-[8px] font-mono font-bold uppercase tracking-wider transition-all active:scale-90 cursor-pointer"
                                      style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--pm-accent-amber)', border: '1px solid rgba(245,158,11,0.2)' }}
                                    >Calibrar Colada</button>
                                  </div>
                                  <div className="flex items-center gap-2 text-[9px] font-mono text-[var(--pm-text-dim)] mb-1">
                                    <span className="flex items-center gap-0.5"><User className="w-2.5 h-2.5" />{lot.operator || '—'}</span>
                                    <span>Temp: {lot.castingTemp || '—'}°C</span>
                                    <span>{lb.length} barra{lb.length !== 1 ? 's' : ''}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[9px] font-mono">
                                    <span className="text-[var(--pm-text-dim)]">Bruto: <strong className="text-[var(--pm-text-primary)]">{formatNumber(lotGross, 2)} g</strong></span>
                                    <span>FA: <strong className="text-[var(--pm-accent-gold)]">{formatNumber(lotFA, 4)} g</strong></span>
                                    {lot.recovered && <span>R: <strong className="text-[var(--pm-accent-emerald)]">{formatNumber(Number(lot.recovered), 4)} g</strong></span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Completed Processes */}
      {completedProcesses.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}
          className="premium-card overflow-hidden"
        >
          <button type="button" onClick={() => setShowCompleted(!showCompleted)}
            className="w-full flex items-center justify-between px-5 py-3.5 active:scale-[0.99] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--pm-accent-emerald)]" />
              <span className="text-xs font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Completados</span>
              <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">{completedProcesses.length} procesos</span>
            </div>
            {showCompleted ? <ChevronDown className="w-4 h-4 text-[var(--pm-text-dim)]" /> : <ChevronRight className="w-4 h-4 text-[var(--pm-text-dim)]" />}
          </button>
          <AnimatePresence>
            {showCompleted && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className="divide-y divide-[var(--pm-border)] border-t border-[var(--pm-border)]">
                  {Object.entries(groupedCompleted).map(([cId, procs]) => (
                    <div key={cId} className="px-5 py-3">
                      <span className="text-[10px] font-mono font-semibold text-[var(--pm-text-primary)] block mb-2">
                        {clients.find(c => c.id === cId)?.name || cId}
                      </span>
                      {procs.map(proc => {
                        const pLots = processLotsMap[proc.id] || [];
                        return (
                          <div key={proc.id} onClick={() => handleViewDetail(proc.id)}
                            className="flex items-center justify-between py-1.5 px-1 text-[10px] font-mono cursor-pointer active:scale-[0.99] transition-all rounded-lg hover:bg-[var(--pm-bg-tertiary)]/40 group"
                          >
                            <span className="text-[var(--pm-text-dim)]">{proc.name}</span>
                            <span className="flex items-center gap-2">
                              <span className="text-[var(--pm-accent-emerald)]">
                                {pLots.filter(l => l.recovered).reduce((s, l) => s + Number(l.recovered), 0).toFixed(2)} g recuperados
                              </span>
                              <Eye className="w-3.5 h-3.5 text-[var(--pm-text-dim)]/40 group-hover:text-[var(--pm-accent-gold)] transition-colors" />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Recovery Modal */}
      <AnimatePresence>
        {activeLot && (
          <motion.div key="recovery-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--pm-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <Microscope className="w-4 h-4 text-[var(--pm-accent-amber)]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-amber)] uppercase tracking-wider">Calibrar Colada</span>
                    <h3 className="text-sm font-sans font-semibold text-[var(--pm-text-primary)] mt-0.5">{activeLot.name}</h3>
                  </div>
                </div>
                <button type="button" onClick={() => setActiveLot(null)} disabled={confirming}
                  className="p-1.5 rounded-lg hover:bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] active:scale-90 transition-all cursor-pointer disabled:opacity-40"
                ><X className="w-4 h-4" /></button>
              </div>

              <div className="p-6 space-y-5">
                {/* Loaded mass info */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-center">
                    <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Barras</span>
                    <span className="text-lg font-mono font-bold text-[var(--pm-text-primary)]">{activeLotBars.length}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-center">
                    <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Bruto</span>
                    <span className="text-sm font-mono font-bold text-[var(--pm-text-primary)]">{formatNumber(activeLotGross, 2)} g</span>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-center">
                    <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">FA Cargado</span>
                    <span className="text-sm font-mono font-bold text-[var(--pm-accent-gold)]">{formatNumber(activeLotFA, 4)} g</span>
                  </div>
                </div>

                {/* Recovery inputs */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Peso Recuperado (g)</label>
                    <input type="number" step="0.0001" value={recoveredWeight}
                      onChange={e => setRecoveredWeight(e.target.value)}
                      className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-sm font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-amber)] transition-colors"
                    />
                  </div>
                  <div className="flex justify-start pb-1">
                    <HudButton variant="ghost" className="text-[10px]"
                      onClick={() => {
                        setActiveHardwareMode('WEIGHT');
                        setHwWeight(recoveredWeight);
                      }}
                    >
                      ⚖️ OBTENER PESO
                    </HudButton>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Ley Au (‰)</label>
                      <input type="number" min="0" max="1000" step="0.1" value={recoveredLeyAu}
                        onChange={e => setRecoveredLeyAu(e.target.value)}
                        className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-amber)] transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Ley Ag (‰)</label>
                      <input type="number" min="0" max="1000" step="0.1" value={recoveredLeyAg}
                        onChange={e => setRecoveredLeyAg(e.target.value)}
                        className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-amber)] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex justify-center pt-1">
                    <HudButton variant="ghost" className="text-[10px]"
                      onClick={() => {
                        setActiveHardwareMode('LEY');
                        setHwLeyAu(recoveredLeyAu);
                        setHwLeyAg(recoveredLeyAg);
                      }}
                    >
                      🔬 OBTENER LEYES
                    </HudButton>
                  </div>
                </div>

                {/* Hardware notification overlay */}
                <AnimatePresence>
                  {hardwareMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="p-3 rounded-xl border bg-blue-500/10 border-blue-500/30 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
                      <span className="text-[10px] font-mono text-blue-300/90">{hardwareMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Live discrepancy */}
                {recWeightNum > 0 && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${Math.abs(discrepancy) > 5 ? 'border-[var(--pm-accent-red)]/25 bg-[var(--pm-accent-red)]/5' : 'border-[var(--pm-accent-emerald)]/25 bg-[var(--pm-accent-emerald)]/5'}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider" style={{ color: Math.abs(discrepancy) > 5 ? 'var(--pm-accent-red)' : 'var(--pm-accent-emerald)' }}>
                        <Zap className="w-3 h-3 inline mr-1" />
                        {Math.abs(discrepancy) > 5 ? 'Discrepancia Alta' : 'Discrepancia Normal'}
                      </span>
                      <span className="text-sm font-mono font-bold" style={{ color: discrepancy >= 0 ? 'var(--pm-accent-emerald)' : 'var(--pm-accent-red)' }}>
                        {discrepancy >= 0 ? '+' : ''}{discrepancy.toFixed(2)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                      <div>
                        <span className="text-[var(--pm-text-dim)]">Esperado:</span>
                        <span className="text-[var(--pm-text-primary)] ml-2">{formatNumber(activeLotFA, 4)} g</span>
                      </div>
                      <div>
                        <span className="text-[var(--pm-text-dim)]">Recuperado:</span>
                        <span className="text-[var(--pm-accent-amber)] ml-2">{formatNumber(recWeightNum, 4)} g</span>
                      </div>
                      <div>
                        <span className="text-[var(--pm-text-dim)]">Diferencia:</span>
                        <span className={`ml-2 ${mermaGramos >= 0 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}>
                          {mermaGramos >= 0 ? '+' : ''}{formatNumber(mermaGramos, 4)} g
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--pm-text-dim)]">Merma:</span>
                        <span className={`ml-2 ${Math.abs(mermaPct) <= 5 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}>
                          {mermaPct.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {recoveryError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-mono bg-[var(--pm-accent-red)]/10 border border-[var(--pm-accent-red)]/25 text-[var(--pm-accent-red)]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />{recoveryError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setActiveLot(null)} disabled={confirming}
                    className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                  >Cancelar</button>
                  <button type="button" onClick={handleConfirmRecovery} disabled={confirming}
                    className="flex-1 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{
                      background: Math.abs(discrepancy) > 5 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                      color: Math.abs(discrepancy) > 5 ? 'var(--pm-accent-red)' : 'var(--pm-accent-emerald)',
                      border: `1px solid ${Math.abs(discrepancy) > 5 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                    }}
                  >
                    {confirming ? (
                      <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Confirmando...</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Confirmar Recuperación</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recovery success overlay */}
      <AnimatePresence>
        {recoverySuccess && (
          <motion.div key="rec-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-xs glass-panel rounded-2xl p-8 flex flex-col items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.25)' }}>
                <CheckCircle2 className="w-7 h-7 text-[var(--pm-accent-emerald)]" strokeWidth={2} />
              </div>
              <span className="text-sm font-sans font-bold text-[var(--pm-accent-emerald)]">Colada Calibrada</span>
              <span className="text-[10px] font-mono text-[var(--pm-text-dim)] text-center">
                Oro recuperado y registrado correctamente.
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Process Detail Modal */}
      <AnimatePresence>
        {selectedProcess && (
          <motion.div key="process-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-3xl glass-panel rounded-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--pm-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <CheckCircle2 className="w-4 h-4 text-[var(--pm-accent-emerald)]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-emerald)] uppercase tracking-wider">Recibo Digital de Fundición</span>
                    <h3 className="text-sm font-sans font-semibold text-[var(--pm-text-primary)] mt-0.5">
                      {selectedProcess.name} — {clients.find(c => c.id === selectedProcess.clientId)?.name || '—'}
                    </h3>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedProcessId(null)}
                  className="p-1.5 rounded-lg hover:bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] active:scale-90 transition-all cursor-pointer"
                ><X className="w-4 h-4" /></button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-center">
                    <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Lotes</span>
                    <span className="text-lg font-mono font-bold text-[var(--pm-text-primary)]">{selectedProcessLots.length}</span>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-center">
                    <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">FA</span>
                    <span className="text-sm font-mono font-bold text-[var(--pm-accent-gold)]">
                      {formatNumber(selectedProcessLots.reduce((s, l) => {
                        const lb = lotBarsMap[l.id] || [];
                        return s + lb.reduce((sb, b) => sb + Number(b.fineWeight), 0);
                      }, 0), 4)} g
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-center">
                    <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">FE (FA × 0.99)</span>
                    <span className="text-sm font-mono font-bold text-[var(--pm-accent-cyan)]">
                      {formatNumber(selectedProcessLots.reduce((s, l) => {
                        const lb = lotBarsMap[l.id] || [];
                        return s + lb.reduce((sb, b) => sb + Number(b.fineWeight), 0);
                      }, 0) * 0.99, 4)} g
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-center">
                    <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">R (Recuperado)</span>
                    <span className="text-sm font-mono font-bold text-[var(--pm-accent-emerald)]">
                      {formatNumber(selectedProcessLots.reduce((s, l) => s + Number(l.recovered ?? 0), 0), 4)} g
                    </span>
                  </div>
                </div>

                {/* Lots table */}
                <div className="overflow-x-auto rounded-xl border border-[var(--pm-border)] v2-scroll">
                  <table className="premium-table w-full text-[11px] font-mono">
                    <thead>
                      <tr>
                        <th className="sticky left-0 bg-[var(--pm-bg-primary)] z-10" style={{ minWidth: 140 }}>Lote</th>
                        <th className="text-right">FA (g)</th>
                        <th className="text-right">FE (g)</th>
                        <th className="text-right">R (g)</th>
                        <th className="text-right">DIF (g)</th>
                        <th className="text-right">% RECUP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProcessLots.map((lot, idx) => {
                        const lb = lotBarsMap[lot.id] || [];
                        const fa = lb.reduce((s, b) => s + Number(b.fineWeight), 0);
                        const fe = fa * 0.99;
                        const r = Number(lot.recovered ?? 0);
                        const dif = fa - r;
                        const pctRecup = fa > 0 ? (r / fa) * 100 : 0;
                        const isExpanded = expandedLotId === lot.id;
                        return (
                          <Fragment key={lot.id}>
                            <tr
                              className={`
                                ${idx % 2 === 1 ? 'bg-[var(--pm-bg-deepest)]/30' : ''}
                                cursor-pointer active:scale-[0.98] transition-all duration-150
                                ${isExpanded ? 'bg-[var(--pm-accent-amber)]/[0.04]' : 'hover:bg-[var(--pm-accent-gold)]/[0.03]'}
                              `}
                              onClick={() => setExpandedLotId(isExpanded ? null : lot.id)}
                            >
                              <td className="sticky left-0 bg-[var(--pm-bg-primary)] font-semibold text-[var(--pm-text-primary)] z-10" style={{ minWidth: 140 }}>
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-[var(--pm-accent-gold)] flex-shrink-0 transition-transform duration-200" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-[var(--pm-text-dim)] flex-shrink-0 transition-transform duration-200" />
                                  )}
                                  <span>{lot.name}</span>
                                  {lot.moldCode && <span className="text-[9px] text-[var(--pm-text-dim)] ml-0.5">({lot.moldCode})</span>}
                                </div>
                              </td>
                              <td className="text-right text-[var(--pm-accent-gold)]">{formatNumber(fa, 4)}</td>
                              <td className="text-right text-[var(--pm-accent-cyan)]">{formatNumber(fe, 4)}</td>
                              <td className="text-right text-[var(--pm-accent-emerald)]">{formatNumber(r, 4)}</td>
                              <td className={`text-right ${dif >= 0 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}>
                                {dif >= 0 ? '+' : ''}{formatNumber(dif, 4)}
                              </td>
                              <td className="text-right">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${Math.abs(pctRecup - 100) <= 5 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}>
                                  {formatNumber(pctRecup, 2)}%
                                </span>
                              </td>
                            </tr>
                            {/* Expanded bar details */}
                            {isExpanded && (
                              <tr key={`${lot.id}-bars`}>
                                <td colSpan={6} className="p-0">
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                  >
                                    <div className="border-l-2 border-[var(--pm-accent-gold)]/30 ml-4 mr-4 mb-3 mt-1 rounded-r-xl bg-black/30 overflow-x-auto">
                                      <table className="premium-table w-full text-[10px] font-mono">
                                        <thead>
                                          <tr>
                                            <th className="sticky left-0 bg-[var(--pm-bg-deepest)] z-10 text-left" style={{ minWidth: 120, paddingLeft: 16 }}>CÓDIGO</th>
                                            <th className="text-right">BRUTO (g)</th>
                                            <th className="text-right">PUREZA AU (‰)</th>
                                            <th className="text-right">FA (g)</th>
                                            <th className="text-right">FE (g)</th>
                                            <th className="text-right">LEY AG (‰)</th>
                                            <th className="text-right">AG (g)</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {lb.map((bar, bi) => (
                                            <tr key={bar.id}
                                              className={`${bi % 2 === 1 ? 'bg-black/20' : ''} hover:bg-[var(--pm-accent-gold)]/[0.03] transition-colors`}
                                            >
                                              <td className="sticky left-0 bg-[var(--pm-bg-primary)] font-semibold text-[var(--pm-accent-gold)] z-10" style={{ paddingLeft: 16 }}>
                                                {bar.barNumber}
                                              </td>
                                              <td className="text-right text-[var(--pm-text-primary)]">{formatNumber(Number(bar.grossWeight), 2)}</td>
                                              <td className="text-right text-[var(--pm-text-primary)]">{formatNumber(Number(bar.purity), 1)}</td>
                                              <td className="text-right text-[var(--pm-accent-gold)]">{formatNumber(Number(bar.fineWeight), 4)}</td>
                                              <td className="text-right text-[var(--pm-accent-cyan)]">{formatNumber(Number(bar.fineWeight) * 0.99, 4)}</td>
                                              <td className="text-right text-[var(--pm-text-dim)]">
                                                {bar.leyAg != null ? formatNumber(Number(bar.leyAg), 1) : '—'}
                                              </td>
                                              <td className="text-right text-[var(--pm-text-dim)]">
                                                {bar.fineWeightAg != null ? formatNumber(Number(bar.fineWeightAg), 4) : '—'}
                                              </td>
                                            </tr>
                                          ))}
                                          {lb.length === 0 && (
                                            <tr>
                                              <td colSpan={7} className="text-center py-4 text-[9px] text-[var(--pm-text-dim)] font-mono italic">
                                                Sin barras asignadas a este lote
                                              </td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                      {selectedProcessLots.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-8 text-[10px] text-[var(--pm-text-dim)] font-mono italic">Sin lotes registrados</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[9px] text-[var(--pm-text-dim)] font-mono text-center opacity-50">
        Datos actualizados en tiempo real · Bandes v2 Premium · {activeProcesses.length} procesos activos
      </p>

      {/* Hardware Sync Overlay — full-screen tactical capture */}
      <AnimatePresence>
        {activeHardwareMode && (
          <motion.div
            key="hw-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
            style={{
              background: 'rgba(0,0,0,0.96)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {/* Technical grid pattern */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0,229,255,0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,229,255,0.3) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />

            {/* Scanning radar line */}
            <motion.div
              className="absolute left-0 right-0 h-px z-10"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.6), transparent)',
                boxShadow: '0 0 12px rgba(0,229,255,0.3)',
              }}
              animate={{ top: ['20%', '75%', '20%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Content */}
            <div className="relative z-20 flex flex-col items-center gap-8 w-full max-w-lg px-6">
              {/* Device icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 rounded-2xl border border-cyan-500/30 flex items-center justify-center"
                style={{ background: 'rgba(0,229,255,0.06)' }}
              >
                {activeHardwareMode === 'WEIGHT' ? (
                  <Weight className="w-9 h-9 text-cyan-400" />
                ) : (
                  <Cpu className="w-9 h-9 text-cyan-400" />
                )}
              </motion.div>

              {/* Status text */}
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[10px] font-mono text-cyan-400/80 tracking-[0.15em] animate-pulse">
                  [ SIMULANDO CONEXIÓN CON DISPOSITIVO EXTERNO ]
                </span>
              </div>

              {/* Capture panel */}
              <motion.div
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full p-6 rounded-2xl border border-cyan-500/15 space-y-5"
                style={{ background: 'rgba(0,229,255,0.03)' }}
              >
                {activeHardwareMode === 'WEIGHT' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-[0.15em]">
                      PESO BÁSCULA (g)
                    </label>
                    <input type="number" step="0.0001" value={hwWeight}
                      onChange={e => setHwWeight(e.target.value)}
                      className="w-full bg-black/60 border border-cyan-500/25 rounded-xl px-5 py-4 text-2xl font-mono font-bold text-cyan-300 text-center focus:outline-none focus:border-cyan-400/50 transition-colors"
                      placeholder="0.0000"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-[0.15em]">
                        LEY AU (‰)
                      </label>
                      <input type="number" min="0" max="1000" step="0.1" value={hwLeyAu}
                        onChange={e => setHwLeyAu(e.target.value)}
                        className="w-full bg-black/60 border border-cyan-500/25 rounded-xl px-5 py-4 text-2xl font-mono font-bold text-cyan-300 text-center focus:outline-none focus:border-cyan-400/50 transition-colors"
                        placeholder="0.0"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-[0.15em]">
                        LEY AG (‰)
                      </label>
                      <input type="number" min="0" max="1000" step="0.1" value={hwLeyAg}
                        onChange={e => setHwLeyAg(e.target.value)}
                        className="w-full bg-black/60 border border-cyan-500/25 rounded-xl px-5 py-4 text-2xl font-mono font-bold text-cyan-300 text-center focus:outline-none focus:border-cyan-400/50 transition-colors"
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                )}

                {/* Footnote */}
                <p className="text-[9px] font-mono text-red-400/60 text-center pt-1">
                  {'>_'} NOTA: INTEGRACIÓN AUTOMÁTICA DISPONIBLE EN VERSIÓN 3.0
                </p>
              </motion.div>

              {/* Action buttons */}
              <div className="flex gap-3 w-full">
                <HudButton variant="ghost" className="flex-1 text-[10px]"
                  onClick={() => setActiveHardwareMode(null)}
                >
                  CANCELAR
                </HudButton>
                <HudButton variant="primary" className="flex-1 text-[10px]"
                  onClick={() => {
                    if (activeHardwareMode === 'WEIGHT') {
                      setRecoveredWeight(hwWeight);
                    } else {
                      setRecoveredLeyAu(hwLeyAu);
                      setRecoveredLeyAg(hwLeyAg);
                    }
                    setActiveHardwareMode(null);
                  }}
                >
                  <Zap className="w-3 h-3" />
                  SYNC &amp; CONFIRM
                </HudButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
