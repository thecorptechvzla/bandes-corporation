'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Layers, Flame } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import type { Process, Lot, Bar, Client } from '@/types/api';

interface ActiveProcessesMatrixProps {
  groupedProcesses: Record<string, Process[]>;
  clients: Client[];
  lotBarsMap: Record<string, Bar[]>;
  processLotsMap: Record<string, Lot[]>;
  onOpenRecovery: (lot: Lot) => void;
}

export function ActiveProcessesMatrix({ groupedProcesses, clients, lotBarsMap, processLotsMap, onOpenRecovery }: ActiveProcessesMatrixProps) {
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
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--pm-text-dim)]">
                              <span>{lot.name}</span>
                              {lot.moldCode && <span>({lot.moldCode})</span>}
                              {lot.castingTemp && <span>Temp: {lot.castingTemp}°C</span>}
                            </div>
                            <button type="button" onClick={() => onOpenRecovery(lot)}
                              className="px-3 py-1.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider transition-all active:scale-90 cursor-pointer"
                              style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--pm-accent-amber)', border: '1px solid rgba(245,158,11,0.2)' }}
                            >⚡ Calibrar Colada</button>
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
    </motion.div>
  );
}
