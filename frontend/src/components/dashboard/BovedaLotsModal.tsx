'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Warehouse, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import type { Lot, Process, Client } from '@/types/api';

interface BovedaLot extends Lot {
  process: Process & { client?: { id: string; name: string } };
  client?: { id: string; name: string };
}

interface BovedaLotsModalProps {
  isOpen: boolean;
  lots: BovedaLot[];
  clients: Client[];
  onClose: () => void;
}

export function BovedaLotsModal({ isOpen, lots, clients, onClose }: BovedaLotsModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const LOTS_PER_PAGE = 15;

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

  const totalRecovered = useMemo(
    () => lots.reduce((s, l) => s + Number(l.recovered ?? 0), 0),
    [lots],
  );

  const totalPages = Math.max(1, Math.ceil(lots.length / LOTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLots = lots.slice(
    (safePage - 1) * LOTS_PER_PAGE,
    safePage * LOTS_PER_PAGE,
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
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
            transition={{ duration: 0.2 }}
            className="relative glass-panel w-full max-w-4xl h-[80vh] max-h-[800px] rounded-2xl border border-[var(--pm-border)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--pm-border)]">
              <div className="flex items-center gap-3">
                <Warehouse className="w-5 h-5 text-[var(--pm-accent-gold)]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--pm-text-primary)]">
                  Oro en Bóveda — Lotes Refinados
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-[var(--pm-bg-deepest)]/50 border border-[var(--pm-border)] flex items-center justify-center text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {grouped.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Warehouse className="w-10 h-10 text-[var(--pm-text-dim)] mb-3 opacity-40" />
                  <p className="text-[11px] font-mono text-[var(--pm-text-dim)]">
                    No hay lotes refinados en bóveda
                  </p>
                </div>
              )}

              {grouped.map(({ id, clientName, lots: clientLots }) => (
                <div key={id}>
                  {/* Client header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--pm-accent-gold)]" />
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--pm-text-primary)]">
                      {clientName}
                    </span>
                    <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">
                      ({formatNumber(clientLots.reduce((s, l) => s + Number(l.recovered ?? 0), 0), 2)} g)
                    </span>
                  </div>

                  {/* Table */}
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

            {/* Footer */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/30">
              <div className="flex items-center gap-2">
                {lots.length > LOTS_PER_PAGE && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                      className="w-6 h-6 rounded-md bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] flex items-center justify-center text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">
                      {safePage}/{totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
                      className="w-6 h-6 rounded-md bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] flex items-center justify-center text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">
                  {lots.length} lote{ lots.length !== 1 ? 's' : '' }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)]">
                  GRAN TOTAL
                </span>
                <span className="text-[11px] font-mono font-bold text-[var(--pm-text-primary)] tabular-nums">
                  {formatNumber(totalRecovered, 2)} g
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
