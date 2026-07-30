'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Warehouse, X } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { SupplierDirectory } from '@/components/SupplierDirectory';
import type { Lot, Process, Client, Bar } from '@/types/api';

function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);
}

const springTransition = { type: 'spring', damping: 25, stiffness: 300 } as const;

interface BovedaLot extends Lot {
  process: Process & { client?: { id: string; name: string } };
  client?: { id: string; name: string };
}

type Tab = 'fundido' | 'sinFundir';

interface BovedaModalProps {
  isOpen: boolean;
  lots: BovedaLot[];
  bars: Bar[];
  clients: Client[];
  onClose: () => void;
  onBarClick?: (barId: string) => void;
}

export function BovedaModal({ isOpen, lots, bars, clients, onClose, onBarClick }: BovedaModalProps) {
  const [tab, setTab] = useState<Tab>('fundido');
  useBodyScrollLock(isOpen);

  const grouped = useMemo(() => {
    const map = new Map<string, { clientName: string; lots: BovedaLot[] }>();
    for (const lot of lots) {
      const clientId = lot.client?.id ?? lot.process?.clientId ?? 'unknown';
      const clientName = lot.client?.name ?? lot.process?.client?.name ?? 'Desconocido';
      if (!map.has(clientId)) map.set(clientId, { clientName, lots: [] });
      map.get(clientId)!.lots.push(lot);
    }
    return Array.from(map.entries())
      .map(([id, g]) => ({ id, clientName: g.clientName, lots: g.lots }))
      .sort((a, b) => b.lots.length - a.lots.length);
  }, [lots]);

  const totalFundido = useMemo(
    () => lots.reduce((s, l) => s + Number(l.recovered ?? 0), 0),
    [lots],
  );

  const totalSinFundir = useMemo(
    () => bars.reduce((s, b) => s + Number(b.fineWeight ?? 0), 0),
    [bars],
  );

  const tabDefs: { key: Tab; label: string; count: number }[] = [
    { key: 'fundido', label: 'FUNDIDO', count: lots.length },
    { key: 'sinFundir', label: 'SIN REFUNDIR', count: bars.length },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={springTransition}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={springTransition}
            className="relative glass-panel w-full max-w-5xl h-[80vh] max-h-[850px] rounded-2xl border border-[var(--pm-border)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--pm-border)]">
              <div className="flex items-center gap-3">
                <Warehouse className="w-5 h-5 text-[var(--pm-accent-gold)]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--pm-text-primary)]">
                  Oro en Bóveda
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-[var(--pm-bg-deepest)]/50 border border-[var(--pm-border)] flex items-center justify-center text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-4 sm:px-5 pt-3 border-b border-[var(--pm-border)]">
              {tabDefs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 text-[10px] font-mono font-bold tracking-wider rounded-t-lg transition-all border-b-2 ${
                    tab === t.key
                      ? 'bg-[var(--pm-bg-deepest)]/50 text-[var(--pm-accent-gold)] border-[var(--pm-accent-gold)]'
                      : 'text-[var(--pm-text-dim)] border-transparent hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-deepest)]/30'
                  }`}
                >
                  {t.label}
                  <span className="ml-1.5 text-[9px] opacity-60">({t.count})</span>
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {tab === 'fundido' ? (
                <div className="p-4 sm:p-5 space-y-5">
                  {grouped.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                      <Warehouse className="w-10 h-10 text-[var(--pm-text-dim)] mb-3 opacity-40" />
                      <p className="text-[11px] font-mono text-[var(--pm-text-dim)]">
                        No hay lotes refinados en bóveda
                      </p>
                    </div>
                  )}

                  {grouped.map(({ id, clientName, lots: clientLots }) => (
                    <div key={id}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--pm-accent-gold)]" />
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--pm-text-primary)]">
                          {clientName}
                        </span>
                        <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">
                          ({formatNumber(clientLots.reduce((s, l) => s + Number(l.recovered ?? 0), 0), 2)} g)
                        </span>
                      </div>

                      <div className="rounded-xl border border-[var(--pm-border)] overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-[var(--pm-bg-deepest)]/50">
                              <th className="text-[9px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)] text-left px-3 py-2">
                                Proceso
                              </th>
                              <th className="text-[9px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)] text-left px-3 py-2">
                                Lote
                              </th>
                              <th className="text-[9px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)] text-left px-3 py-2">
                                Operador
                              </th>
                              <th className="text-[9px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)] text-right px-3 py-2">
                                Peso Recuperado (g)
                              </th>
                              <th className="text-[9px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)] text-right px-3 py-2">
                                Fecha
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {clientLots.map((lot) => (
                              <tr
                                key={lot.id}
                                className="border-t border-[var(--pm-border)] hover:bg-white/[0.02] transition-colors"
                              >
                                <td className="px-3 py-2 text-[10px] font-mono text-[var(--pm-text-primary)]">
                                  {lot.process?.name ?? '—'}
                                </td>
                                <td className="px-3 py-2 text-[10px] font-mono text-[var(--pm-text-primary)]">
                                  {lot.name}
                                </td>
                                <td className="px-3 py-2 text-[10px] font-mono text-[var(--pm-text-dim)]">
                                  {lot.operator ?? '—'}
                                </td>
                                <td className="px-3 py-2 text-[10px] font-mono text-[var(--pm-text-primary)] text-right tabular-nums">
                                  {formatNumber(Number(lot.recovered ?? 0), 2)}
                                </td>
                                <td className="px-3 py-2 text-[10px] font-mono text-[var(--pm-text-dim)] text-right">
                                  {lot.recoveryAt
                                    ? new Date(lot.recoveryAt).toLocaleDateString('es-AR')
                                    : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 sm:p-5">
                  {bars.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                      <Warehouse className="w-10 h-10 text-[var(--pm-text-dim)] mb-3 opacity-40" />
                      <p className="text-[11px] font-mono text-[var(--pm-text-dim)]">
                        No hay barras en stock para refundir
                      </p>
                    </div>
                  ) : (
                    <SupplierDirectory
                      bars={bars}
                      clients={clients}
                      purityFirst
                      showSearch
                      onBarClick={onBarClick}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/30">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[var(--pm-text-dim)]">
                    Fundido:
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[var(--pm-text-primary)] tabular-nums">
                    {formatNumber(totalFundido, 2)} g
                  </span>
                </div>
                <div className="w-px h-3 bg-[var(--pm-border)]" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[var(--pm-text-dim)]">
                    Sin Fundir:
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[var(--pm-text-primary)] tabular-nums">
                    {formatNumber(totalSinFundir, 2)} g
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)]">
                  GRAN TOTAL
                </span>
                <span className="text-[11px] font-mono font-bold text-[var(--pm-text-primary)] tabular-nums">
                  {formatNumber(totalFundido + totalSinFundir, 2)} g
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
