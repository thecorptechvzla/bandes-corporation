'use client';

import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Boxes, ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Bar, Process } from '@/types/api';

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

interface ProcesoModalProps {
  isOpen: boolean;
  title: string;
  processes: Process[];
  bars: Bar[];
  onClose: () => void;
  onBarClick: (id: string) => void;
}

interface ProcessBar {
  bar: Bar;
}

interface ProcessGroup {
  process: Process;
  items: ProcessBar[];
  supplierCount: number;
  grossWeight: number;
  fineWeight: number;
}

export function ProcesoModal({
  isOpen,
  title,
  processes,
  bars,
  onClose,
  onBarClick,
}: ProcesoModalProps) {
  useBodyScrollLock(isOpen);

  const PROCESSES_PER_PAGE = 10;
  const BARS_PER_PAGE = 10;

  const [searchCode, setSearchCode] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedProcessId, setExpandedProcessId] = useState<string | null>(null);
  const [processBarPages, setProcessBarPages] = useState<Record<string, number>>({});

  const { groups } = useMemo(() => {
    const lotProcess = new Map<string, Process>();
    for (const p of processes) {
      for (const l of p.lots ?? []) {
        if (l.id && p.id) lotProcess.set(l.id, p);
      }
    }

    const byProcess = new Map<string, ProcessGroup>();
    const unassigned: ProcessGroup[] = [];

    const q = searchCode.toLowerCase();

    const push = (group: ProcessGroup, item: ProcessBar) => {
      group.items.push(item);
      group.grossWeight += Number(item.bar.grossWeight);
      group.fineWeight += Number(item.bar.fineWeight);
    };

    for (const bar of bars) {
      if (q && !bar.barNumber.toLowerCase().includes(q)) continue;
      const proc = bar.lotId ? lotProcess.get(bar.lotId) : undefined;
      const item: ProcessBar = { bar };
      if (!proc) {
        let g = unassigned.find((u) => u.process.name === 'Sin Proceso');
        if (!g) {
          g = {
            process: { id: '__sin_proceso__', name: 'Sin Proceso', clientId: '', status: 'OPEN', createdAt: '', updatedAt: '' },
            items: [],
            supplierCount: 0,
            grossWeight: 0,
            fineWeight: 0,
          };
          unassigned.push(g);
        }
        push(g, item);
        continue;
      }
      if (!byProcess.has(proc.id)) {
        byProcess.set(proc.id, {
          process: proc,
          items: [],
          supplierCount: 0,
          grossWeight: 0,
          fineWeight: 0,
        });
      }
      push(byProcess.get(proc.id)!, item);
    }

    for (const g of byProcess.values()) {
      g.supplierCount = new Set(g.items.map((i) => i.bar.clientId)).size;
      g.items.sort((a, b) => new Date(b.bar.createdAt).getTime() - new Date(a.bar.createdAt).getTime());
    }

    const sorted = [...byProcess.values()].sort((a, b) =>
      a.process.name.localeCompare(b.process.name),
    );
    const ordered = [...sorted, ...unassigned].filter((g) => g.items.length > 0);

    return { groups: ordered };
  }, [processes, bars, searchCode]);

  const visibleProcesses = groups;

  const supplierTotalPages = Math.max(1, Math.ceil(visibleProcesses.length / PROCESSES_PER_PAGE));
  const safeSupplierPage = Math.min(currentPage, supplierTotalPages);
  const paginatedProcesses = visibleProcesses.slice(
    (safeSupplierPage - 1) * PROCESSES_PER_PAGE,
    safeSupplierPage * PROCESSES_PER_PAGE,
  );

  const grandTotal = useMemo(() => {
    let grossWeight = 0;
    let fa = 0;
    for (const g of visibleProcesses) {
      grossWeight += g.grossWeight;
      fa += g.fineWeight;
    }
    return { grossWeight, fa };
  }, [visibleProcesses]);

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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={springTransition}
            className="relative w-full max-w-4xl h-[80vh] max-h-[800px] rounded-xl border border-[rgba(30,41,59,0.5)] bg-[var(--hud-bg-card)] shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--hud-border)]">
              <div className="flex items-center gap-3">
                <Boxes className="w-5 h-5 text-[var(--hud-accent-gold)]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--hud-text-primary)]">
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-[var(--hud-bg-deepest)]/50 border border-[var(--hud-border)] flex items-center justify-center text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col min-h-0 flex-1">
              <div className="px-4 sm:px-5 py-3 border-b border-[var(--hud-border)]/10 flex items-center justify-end gap-2">
                <div className="flex items-center w-36 bg-[var(--hud-bg-deepest)] border border-[var(--hud-border)] rounded-lg overflow-hidden transition-all focus-within:border-[var(--hud-accent-gold)]/40">
                  <div className="pl-2.5 flex items-center justify-center">
                    <Search className="w-3.5 h-3.5 text-[var(--hud-text-dim)]" />
                  </div>
                  <input
                    type="text"
                    value={searchCode}
                    onChange={(e) => { setSearchCode(e.target.value); setCurrentPage(1); }}
                    placeholder="Buscar por código..."
                    className="flex-1 bg-transparent py-1.5 px-2 outline-none text-[11px] font-mono text-[var(--hud-text-dim)] placeholder:text-[var(--hud-text-dim)]/30"
                  />
                </div>
                <span className="text-[11px] font-mono text-[var(--hud-text-dim)] bg-[var(--hud-bg-deepest)]/50 px-2 py-0.5 border border-[var(--hud-border)] rounded">
                  {String(visibleProcesses.length).padStart(2, '0')}
                </span>
              </div>

              {paginatedProcesses.length > 0 ? (
                <div className="flex-1 overflow-y-auto scrollbar-thin pb-40 touch-pan-y">
                  {paginatedProcesses.map((group) => {
                    const barPage = processBarPages[group.process.id] ?? 1;
                    const barTotalPages = Math.max(1, Math.ceil(group.items.length / BARS_PER_PAGE));
                    const safeBarPage = Math.min(barPage, barTotalPages);
                    const paginatedItems = group.items.slice(
                      (safeBarPage - 1) * BARS_PER_PAGE,
                      safeBarPage * BARS_PER_PAGE,
                    );

                    return (
                      <Fragment key={group.process.id}>
                        <div className="px-4 sm:px-5 pt-4 sm:pt-5 first:pt-0">
                          <div
                            className="glass-panel cursor-pointer active:scale-[0.98] transition-all hover:bg-[var(--hud-accent-gold)]/[0.04] rounded-xl border border-[var(--hud-border)]/40 overflow-hidden"
                            onClick={() =>
                              setExpandedProcessId((prev) =>
                                prev === group.process.id ? null : group.process.id,
                              )
                            }
                          >
                            <div className="p-4 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <Boxes className="w-5 h-5 text-[var(--hud-accent-gold)] flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-[var(--hud-text-primary)] uppercase tracking-wider truncate">
                                    {group.process.name}
                                  </p>
                                  {group.supplierCount > 1 && (
                                    <p className="text-[11px] text-[var(--hud-text-dim)] font-sans">
                                      Consolidado de {group.supplierCount} proveedores
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-[11px] font-mono text-[var(--hud-text-dim)] whitespace-nowrap">
                                  Bruto: <span className="text-[var(--hud-accent-gold)] font-bold">{formatNumber(group.grossWeight, 2)} g</span> · Fino: <span className="text-[var(--hud-text-primary)] font-bold">{formatNumber(group.fineWeight, 2)} g</span>
                                </span>
                                <span className="text-[11px] font-mono text-[var(--hud-text-dim)] bg-[var(--hud-bg-deepest)]/50 px-2 py-0.5 border border-[var(--hud-border)] rounded whitespace-nowrap">
                                  {group.items.length} BARRAS
                                </span>
                                <ChevronDown
                                  className={`w-4 h-4 text-[var(--hud-text-dim)] transition-transform flex-shrink-0 ${
                                    expandedProcessId === group.process.id ? 'rotate-180' : ''
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedProcessId === group.process.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                              className="px-4 sm:px-5 pb-4 sm:pb-5 overflow-hidden">
                              <div className="overflow-x-auto rounded-xl border border-[var(--hud-border)]/20">
                                <table className="w-full table-fixed border-collapse text-xs font-sans">
                                  <thead>
                                    <tr>
                                      <th className="w-[15%] text-left px-4 py-3 bg-[var(--hud-bg-primary)]">Código</th>
                                      <th className="w-[15%] text-right px-4 py-3">Ley Au</th>
                                      <th className="w-[20%] text-left px-4 py-3">Proveedor</th>
                                      <th className="w-[20%] text-right px-4 py-3">Peso Bruto</th>
                                      <th className="w-[20%] text-right px-4 py-3">Peso Fino</th>
                                      <th className="w-[12%] text-right px-4 py-3">Estado</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {paginatedItems.map((item, idx) => {
                                      const bar = item.bar;
                                      return (
                                        <tr key={bar.id}
                                          onClick={() => onBarClick(bar.id)}
                                          className={`${idx % 2 === 1 ? 'bg-[var(--hud-bg-deepest)]/30' : ''} hover:bg-[var(--hud-accent-gold)]/[0.03] transition-colors cursor-pointer`}>
                                          <td className="text-left px-4 py-3 sticky left-0 bg-[var(--hud-bg-primary)] font-semibold text-[var(--hud-accent-gold)]">
                                            <span className="text-[11px]">{bar.barNumber}</span>
                                          </td>
                                          <td className="text-right px-4 py-3 font-mono text-[var(--hud-accent-cyan)]">{formatNumber(Number(bar.purity), 2)}</td>
                                          <td className="text-left px-4 py-3 font-mono text-[var(--hud-text-dim)] truncate">{bar.client?.name ?? 'Desconocido'}</td>
                                          <td className="text-right px-4 py-3 font-mono text-[var(--hud-accent-gold)]">{formatNumber(Number(bar.grossWeight), 2)}</td>
                                          <td className="text-right px-4 py-3 font-mono text-[var(--hud-text-primary)]">{formatNumber(Number(bar.fineWeight), 2)}</td>
                                          <td className="text-right px-4 py-3 whitespace-nowrap">
                                            <StatusBadge status={bar.status} size="sm" />
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  {group.items.length > 0 && (
                                    <tfoot>
                                      <tr className="border-t border-[var(--hud-border)] bg-[var(--hud-bg-deepest)]/50">
                                        <td className="sticky left-0 bg-[var(--hud-bg-deepest)]/50 px-3 py-2 text-[10px] font-bold text-[var(--hud-text-dim)] uppercase tracking-wider">
                                          Total {group.process.name}
                                        </td>
                                        <td />
                                        <td />
                                        <td className="text-right px-4 py-3 font-mono text-xs text-[var(--hud-accent-gold)]">{formatNumber(group.grossWeight, 2)}</td>
                                        <td className="text-right px-4 py-3 font-mono text-xs text-[var(--hud-text-primary)]">{formatNumber(group.fineWeight, 2)}</td>
                                        <td colSpan={1} />
                                      </tr>
                                    </tfoot>
                                  )}
                                </table>
                              </div>
                              {barTotalPages > 1 && (
                                <div className="flex items-center justify-center gap-3 pt-2">
                                  <span className="text-[10px] font-mono text-[var(--hud-text-dim)]">
                                    Página {safeBarPage} de {barTotalPages}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setProcessBarPages((prev) => ({ ...prev, [group.process.id]: safeBarPage - 1 }))}
                                      disabled={safeBarPage <= 1}
                                      className="p-1 text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] disabled:text-[var(--hud-text-dim)]/30 disabled:cursor-not-allowed transition-all"
                                    >
                                      <ChevronLeft className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setProcessBarPages((prev) => ({ ...prev, [group.process.id]: safeBarPage + 1 }))}
                                      disabled={safeBarPage >= barTotalPages}
                                      className="p-1 text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] disabled:text-[var(--hud-text-dim)]/30 disabled:cursor-not-allowed transition-all"
                                    >
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Fragment>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-[var(--hud-text-dim)]">No hay procesos registrados.</p>
                </div>
              )}

              {visibleProcesses.length > 0 && (
                <div className="flex-shrink-0 border-t border-[var(--hud-accent-gold)]/30 bg-[var(--hud-bg-deepest)]">
                  <div className="hidden sm:flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5">
                    <span className="text-xs font-bold text-[var(--hud-text-primary)] uppercase tracking-wider">
                      GRAN TOTAL
                    </span>
                    <div className="flex items-center gap-5">
                      <span className="text-xs font-mono text-[var(--hud-text-dim)]">
                        Peso Bruto:{' '}
                        <span className="text-[var(--hud-accent-gold)] font-bold text-sm">
                          {formatNumber(grandTotal.grossWeight, 2)}
                        </span>{' '}
                        <span className="text-[11px] text-[var(--hud-text-dim)]">g</span>
                      </span>
                      <span className="text-[11px] text-[var(--hud-text-dim)]/30">|</span>
                      <span className="text-xs font-mono text-[var(--hud-text-dim)]">
                        Peso Fino:{' '}
                        <span className="text-[var(--hud-text-primary)] font-bold text-sm">
                          {formatNumber(grandTotal.fa, 2)}
                        </span>{' '}
                        <span className="text-[11px] text-[var(--hud-text-dim)]">g</span>
                      </span>
                    </div>
                  </div>

                  <div className="sm:hidden px-4 py-3">
                    <div className="text-[11px] font-bold text-[var(--hud-text-primary)] uppercase tracking-wider mb-2">
                      GRAN TOTAL
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <div className="text-[10px] text-[var(--hud-text-dim)] uppercase tracking-wider">Peso Bruto</div>
                        <div className="text-[13px] font-mono font-bold text-[var(--hud-accent-gold)] leading-tight whitespace-nowrap">
                          {formatNumber(grandTotal.grossWeight, 2)}{' '}
                          <span className="text-[11px] font-normal text-[var(--hud-text-dim)]">g</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--hud-text-dim)] uppercase tracking-wider">Peso Fino</div>
                        <div className="text-[13px] font-mono font-bold text-[var(--hud-text-primary)] leading-tight whitespace-nowrap">
                          {formatNumber(grandTotal.fa, 2)}{' '}
                          <span className="text-[11px] font-normal text-[var(--hud-text-dim)]">g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {supplierTotalPages > 1 && (
                <div className="px-4 sm:px-5 py-3 border-t border-[var(--hud-border)]/10 flex items-center justify-center gap-4">
                  <span className="text-[11px] font-mono text-[var(--hud-text-dim)]">
                    Página {safeSupplierPage} de {supplierTotalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safeSupplierPage <= 1}
                      className="p-1.5 text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] disabled:text-[var(--hud-text-dim)]/30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(supplierTotalPages, p + 1))}
                      disabled={safeSupplierPage >= supplierTotalPages}
                      className="p-1.5 text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] disabled:text-[var(--hud-text-dim)]/30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}