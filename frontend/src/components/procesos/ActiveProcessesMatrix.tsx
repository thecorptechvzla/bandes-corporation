'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Layers, Flame, X, XCircle, AlertTriangle } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Process, Lot, Bar, Client } from '@/types/api';

interface ActiveProcessesMatrixProps {
  groupedProcesses: Record<string, Process[]>;
  clients: Client[];
  lotBarsMap: Record<string, Bar[]>;
  processLotsMap: Record<string, Lot[]>;
  onOpenRecovery: (lot: Lot) => void;
  onCancelProcess?: (processId: string) => Promise<void>;
}

export function ActiveProcessesMatrix({ groupedProcesses, clients, lotBarsMap, processLotsMap, onOpenRecovery, onCancelProcess }: ActiveProcessesMatrixProps) {
  const [pendingCancel, setPendingCancel] = useState<{ id: string; name: string } | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const handleConfirmCancel = async () => {
    if (!pendingCancel || !onCancelProcess) return;
    setCancelLoading(true);
    setCancelError('');
    try {
      await onCancelProcess(pendingCancel.id);
      setPendingCancel(null);
    } catch (err: any) {
      setCancelError(err?.response?.data?.message || err?.message || 'Error al cancelar el proceso');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
      className="premium-card overflow-hidden"
    >
      <div className="px-5 py-3.5 border-b border-[var(--pm-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--pm-accent-amber)]" />
          <span className="text-xs font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Núcleos Activos</span>
        </div>
        <span className="text-[11px] font-mono text-[var(--pm-text-dim)]">
          {Object.values(groupedProcesses).reduce((s, p) => s + p.length, 0)} procesos
        </span>
      </div>

      <div className="divide-y divide-[var(--pm-border)] overflow-y-auto max-h-[calc(100vh-280px)] v2-scroll">
        {Object.keys(groupedProcesses).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--pm-text-dim)]">
            <Flame className="w-10 h-10 text-[var(--pm-accent-amber)]/20 mb-3 animate-pulse" />
            <span className="text-sm font-sans">Sin procesos activos</span>
            <p className="text-[11px] font-mono mt-1">Inicie una fundición desde el panel izquierdo.</p>
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
                  <span className="text-[11px] font-mono text-[var(--pm-accent-amber)]">Peso Fino {formatNumber(totalFA, 2)} g</span>
                </div>
                <div className="space-y-2">
                  {procs.map(proc => {
                    const pLots = processLotsMap[proc.id] || [];
                    const allBars = pLots.flatMap(l => lotBarsMap[l.id] || []);
                    const totalBars = allBars.length;
                    const totalGross = allBars.reduce((s, b) => s + Number(b.grossWeight), 0);
                    const lot = pLots[0];
                    return (
                      <div key={proc.id} className="p-3 rounded-lg border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/40">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold text-[var(--pm-accent-amber)]">
                              {proc.name}
                            </span>
                            {proc.isMixed && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-[var(--pm-accent-gold)]/15 border border-[var(--pm-accent-gold)]/30 text-[var(--pm-accent-gold)]">
                                MIXTO
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">
                            {totalBars} barra{totalBars !== 1 ? 's' : ''} · {formatNumber(totalGross, 2)} g bruto
                          </span>
                        </div>
                        {lot && (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--pm-text-dim)]">
                              <span>{lot.name}</span>
                              {lot.moldCode && <span>({lot.moldCode})</span>}
                              {lot.castingTemp && <span>Temp: {lot.castingTemp}°C</span>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {onCancelProcess && (
                                <button type="button" onClick={() => { setCancelError(''); setPendingCancel({ id: proc.id, name: proc.name }); }}
                                  className="px-2.5 py-1.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                                  style={{ background: 'rgba(244,63,94,0.1)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.25)' }}
                                ><X className="w-3 h-3" /> Cancelar Proceso</button>
                              )}
                              <button type="button" onClick={() => onOpenRecovery(lot)}
                                className="px-3 py-1.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider transition-all active:scale-90 cursor-pointer"
                                style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--pm-accent-amber)', border: '1px solid rgba(245,158,11,0.2)' }}
                              >⚡ Calibrar Colada</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={!!pendingCancel}
        onClose={() => { if (!cancelLoading) setPendingCancel(null); }}
        onConfirm={handleConfirmCancel}
        icon={<XCircle className="w-4 h-4 text-rose-500" />}
        title="Cancelar Proceso"
        description="¿Está seguro de cancelar la fundición? Esto liberará todas las barras asociadas al inventario."
        confirmLabel="CONFIRMAR Y LIBERAR"
        cancelLabel="VOLVER"
        variant="danger"
        loading={cancelLoading}
        size="md"
      >
        {pendingCancel && (
          <p className="text-[10px] font-mono text-[var(--pm-text-dim)]">
            Proceso: <span className="text-[var(--pm-text-primary)] font-bold">{pendingCancel.name}</span>
          </p>
        )}
        {cancelError && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg text-[11px] font-mono bg-[var(--pm-accent-red)]/10 border border-[var(--pm-accent-red)]/25 text-[var(--pm-accent-red)]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{cancelError}
          </div>
        )}
      </ConfirmDialog>
    </motion.div>
  );
}
