'use client';

import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { formatNumber, formatWeight } from '@/lib/format';
import { LotDetailModal } from '@/components/egresos/LotDetailModal';
import type { Bar, MaterialExit } from '@/types/api';

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

interface ExitedRow {
  key: string;
  code: string;
  isLot: boolean;
  providerId: string;
  providerName: string;
  weightBruto: number;
  weightBalanza: number;
  weightFino: number;
  barCount: number;
  barId?: string;
  isPartialShare?: boolean;
  portionPct?: number;
  lotInfo?: AvailableLot;
}

interface AvailableLot {
  id: string;
  name: string;
  processName: string;
  clientId: string;
  clientName: string;
  clientRif: string;
  availableWeight: number;
  recovered?: number;
  grossWeight?: number;
  photoUrl?: string | null;
  barCount: number;
  isMixed?: boolean;
  composition?: { clientId: string; clientName: string; weight: number; percentage: number }[];
}

interface ExitedGroup {
  providerId: string;
  providerName: string;
  rows: ExitedRow[];
}

interface ExitedBarsModalProps {
  isOpen: boolean;
  title: string;
  showSearch?: boolean;
  exits: MaterialExit[];
  bars?: Bar[];
  filterSupplierId?: string | null;
  onClose: () => void;
  onBarClick?: (id: string) => void;
}

const SUPPLIERS_PER_PAGE = 10;

export function ExitedBarsModal({
  isOpen,
  title,
  showSearch,
  exits,
  bars,
  filterSupplierId,
  onClose,
  onBarClick,
}: ExitedBarsModalProps) {
  useBodyScrollLock(isOpen);

  const [searchCode, setSearchCode] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(
    filterSupplierId ?? null,
  );
  const [selectedLotForModal, setSelectedLotForModal] = useState<AvailableLot | null>(null);

  useEffect(() => {
    if (filterSupplierId) setExpandedSupplierId(filterSupplierId);
  }, [filterSupplierId]);

  const groups = useMemo(() => {
    const q = searchCode.toLowerCase();
    const map = new Map<string, ExitedRow[]>();

    const push = (row: ExitedRow) => {
      if (q && !row.code.toLowerCase().includes(q)) return;
      if (filterSupplierId && row.providerId !== filterSupplierId) return;
      if (!map.has(row.providerId)) map.set(row.providerId, []);
      map.get(row.providerId)!.push(row);
    };

    for (const exit of exits) {
      for (const detail of exit.exitDetails ?? []) {
        const barsOfLot = detail.bars ?? [];
        const grossTotal =
          barsOfLot.reduce((s, b) => s + Number(b.grossWeight ?? 0), 0) ||
          Number(detail.weightAported ?? 0) ||
          0;
        const brLote = Number((detail.lot?.recovered ?? detail.weightAported ?? grossTotal) || 0);
        const fineIn = barsOfLot.reduce((s, b) => s + Number(b.fineWeight ?? 0), 0);
        const lotPurity = Number(detail.lot?.purity ?? 0);
        const finoLote =
          lotPurity > 0
            ? (brLote * lotPurity) / 1000
            : grossTotal > 0
              ? (fineIn / grossTotal) * brLote
              : fineIn;

        const providerMap = new Map<string, { providerName: string; gross: number; count: number }>();
        for (const b of barsOfLot) {
          const pid = b.clientId ?? b.client?.id ?? detail.lot?.process?.client?.id ?? 'desconocido';
          if (!pid) continue;
          const cur = providerMap.get(pid) ?? {
            providerName: b.client?.name ?? detail.lot?.process?.client?.name ?? 'Desconocido',
            gross: 0,
            count: 0,
          };
          cur.gross += Number(b.grossWeight ?? 0);
          cur.count += 1;
          providerMap.set(pid, cur);
        }
        if (providerMap.size === 0) {
          const ownerId = detail.lot?.process?.client?.id ?? 'desconocido';
          providerMap.set(ownerId, {
            providerName: detail.lot?.process?.client?.name ?? 'Desconocido',
            gross: grossTotal,
            count: barsOfLot.length || 1,
          });
        }

        for (const [providerId, part] of providerMap) {
          const ratio = grossTotal > 0 ? part.gross / grossTotal : 1;
          const portionBR = brLote * ratio;
          const portionFino = finoLote * ratio;
          push({
            key: `${exit.id}-${detail.id ?? detail.lotId}-${providerId}`,
            code: detail.lot?.name ?? detail.lotId ?? '—',
            isLot: true,
            providerId,
            providerName: part.providerName,
            weightBruto: part.gross,
            weightBalanza: portionBR,
            weightFino: portionFino,
            barCount: part.count,
            isPartialShare: ratio < 0.9999,
            portionPct: ratio * 100,
            lotInfo: {
              id: detail.lotId,
              name: detail.lot?.name ?? detail.lotId,
              processName: detail.lot?.process?.name ?? '',
              clientId: detail.lot?.process?.client?.id ?? '',
              clientName: detail.lot?.process?.client?.name ?? 'Desconocido',
              clientRif: '',
              availableWeight: finoLote,
              recovered: Number(detail.lot?.recovered ?? 0),
              grossWeight: grossTotal,
              photoUrl: detail.lot?.photoUrl ?? null,
              barCount: barsOfLot.length || 1,
            },
          });
        }
      }
      for (const b of exit.bars ?? []) {
        const gw = Number(b.grossWeight ?? 0);
        push({
          key: `${exit.id}-bar-${b.id}`,
          code: b.barNumber,
          isLot: false,
          providerId: b.client?.id ?? b.clientId ?? 'desconocido',
          providerName: b.client?.name ?? 'Desconocido',
          weightBruto: gw,
          weightBalanza: gw,
          weightFino: Number(b.fineWeight ?? 0),
          barCount: 1,
          barId: b.id,
        });
      }
    }

    const grouped: ExitedGroup[] = Array.from(map.entries()).map(([providerId, rows]) => ({
      providerId,
      providerName: rows[0]?.providerName ?? 'Desconocido',
      rows,
    }));

    grouped.sort((a, b) => a.providerName.localeCompare(b.providerName));
    return grouped;
  }, [exits, searchCode, filterSupplierId]);

  const totalPages = Math.max(1, Math.ceil(groups.length / SUPPLIERS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedGroups = groups.slice(
    (safePage - 1) * SUPPLIERS_PER_PAGE,
    safePage * SUPPLIERS_PER_PAGE,
  );

  const grandTotal = useMemo(() => {
    let bruto = 0;
    let balanza = 0;
    let fino = 0;
    for (const g of groups) {
      for (const r of g.rows) {
        bruto += r.weightBruto;
        balanza += r.weightBalanza;
        fino += r.weightFino;
      }
    }
    return { bruto, balanza, merma: bruto - balanza, fino };
  }, [groups]);

  return (
    <>
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
                <Building2 className="w-5 h-5 text-[var(--hud-accent-gold)]" />
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
              {showSearch && (
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
                    {String(groups.length).padStart(2, '0')}
                  </span>
                </div>
              )}

              {paginatedGroups.length > 0 ? (
                <div className="flex-1 overflow-y-auto scrollbar-thin pb-40 touch-pan-y">
                  {paginatedGroups.map((group) => {
                    const isOpenSupp = expandedSupplierId === group.providerId;
                    const clientTotals = {
                      bruto: group.rows.reduce((s, r) => s + r.weightBruto, 0),
                      balanza: group.rows.reduce((s, r) => s + r.weightBalanza, 0),
                      merma: group.rows.reduce((s, r) => s + (Number(r.weightBruto) - Number(r.weightBalanza)), 0),
                      fino: group.rows.reduce((s, r) => s + r.weightFino, 0),
                    };

                    return (
                      <Fragment key={group.providerId}>
                        <div className="px-4 sm:px-5 pt-4 sm:pt-5 first:pt-0">
                          <div
                            className="glass-panel cursor-pointer active:scale-[0.98] transition-all hover:bg-[var(--hud-accent-gold)]/[0.04] rounded-xl border border-[var(--hud-border)]/40 overflow-hidden"
                            onClick={() =>
                              setExpandedSupplierId((prev) => (prev === group.providerId ? null : group.providerId))
                            }
                          >
                            <div className="p-4 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <Building2 className="w-5 h-5 text-[var(--hud-accent-gold)] flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-[var(--hud-text-primary)] uppercase tracking-wider truncate">
                                    {group.providerName}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-[11px] font-mono text-[var(--hud-text-dim)] whitespace-nowrap">
                            BI: <span className="text-white font-bold">{formatNumber(clientTotals.bruto, 2)} g</span> · BR: <span className="text-amber-400 font-bold">{formatNumber(clientTotals.balanza, 2)} g</span> · M: <span className="text-[var(--hud-accent-red)] font-bold">{formatNumber(clientTotals.merma, 2)} g</span> · Fino: <span className="text-[var(--hud-text-primary)] font-bold">{formatNumber(clientTotals.fino, 2)} g</span>
                          </span>
                                <span className="text-[11px] font-mono text-[var(--hud-text-dim)] bg-[var(--hud-bg-deepest)]/50 px-2 py-0.5 border border-[var(--hud-border)] rounded whitespace-nowrap">
                                  {group.rows.length} REGISTRO{group.rows.length !== 1 ? 'S' : ''}
                                </span>
                                <ChevronDown
                                  className={`w-4 h-4 text-[var(--hud-text-dim)] transition-transform flex-shrink-0 ${isOpenSupp ? 'rotate-180' : ''}`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isOpenSupp && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="px-4 sm:px-5 pb-4 sm:pb-5 overflow-hidden"
                            >
                              <div className="overflow-x-auto rounded-xl border border-[var(--hud-border)]/20">
                                <table className="w-full table-fixed border-collapse text-xs font-sans">
                                  <thead>
                                    <tr>
                                      <th className="w-[24%] text-left px-4 py-3 bg-[var(--hud-bg-primary)]">Código</th>
                                      <th className="w-[15%] text-right px-4 py-3">BI (Bruto Inicial)</th>
                                      <th className="w-[16%] text-right px-4 py-3">BR (Bruto Refundido)</th>
                                      <th className="w-[12%] text-right px-4 py-3">M (Merma)</th>
                                      <th className="w-[13%] text-right px-4 py-3">Peso Fino</th>
                                      <th className="w-[10%] text-right px-4 py-3">N° Barras</th>
                                      <th className="w-[10%] text-right px-4 py-3">Estado</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.rows.map((row, idx) => (
                                      <tr
                                        key={row.key}
                                        onClick={() => {
                                          if (row.isLot && row.lotInfo) {
                                            setSelectedLotForModal(row.lotInfo);
                                          } else if (row.barId) {
                                            onBarClick?.(row.barId);
                                          }
                                        }}
                                        className={`${idx % 2 === 1 ? 'bg-[var(--hud-bg-deepest)]/30' : ''} transition-colors${
                                          row.isLot
                                            ? ' cursor-pointer hover:bg-[#1A202C]/50'
                                            : row.barId && onBarClick
                                              ? ' cursor-pointer hover:bg-[var(--hud-accent-gold)]/[0.03]'
                                              : ''
                                        }`}
                                      >
                                        <td className="text-left px-4 py-3 sticky left-0 bg-[var(--hud-bg-primary)] font-semibold text-[var(--hud-accent-gold)]">
                                          <div className="flex flex-col gap-0.5">
                                            <span className="text-[11px]">{row.code}</span>
                                            {row.isLot && (
                                              <span className="text-[9px] font-mono text-teal-400/80 uppercase tracking-wider flex items-center gap-1">
                                                Lote
                                                {row.isPartialShare && (
                                                  <span className="text-amber-400/90">
                                                    {formatNumber(row.portionPct ?? 0, 1)}%
                                                  </span>
                                                )}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="text-right px-4 py-3 font-mono text-[var(--hud-accent-gold)]">
                                          {formatNumber(Number(row.weightBruto), 2)} g
                                        </td>
                                        <td className="text-right px-4 py-3 font-mono font-bold text-amber-400">
                                          {formatNumber(Number(row.weightBalanza), 2)} g
                                        </td>
                                        <td className="text-right px-4 py-3 font-mono font-semibold text-[var(--hud-accent-red)]">
                                          {formatNumber(Number(row.weightBruto) - Number(row.weightBalanza), 2)} g
                                        </td>
                                        <td className="text-right px-4 py-3 font-mono text-[var(--hud-text-primary)]">
                                          {formatWeight(Number(row.weightFino))}
                                        </td>
                                        <td className="text-right px-4 py-3 font-mono text-[var(--hud-text-primary)]">
                                          {row.barCount}
                                        </td>
                                        <td className="text-right px-4 py-3">
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-500/10 text-slate-300 border border-slate-400/20">
                                            EGRESADO
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t border-[var(--hud-border)] bg-[var(--hud-bg-deepest)]/50">
                                      <td className="sticky left-0 bg-[var(--hud-bg-deepest)]/50 px-3 py-2 text-[10px] font-bold text-[var(--hud-text-dim)] uppercase tracking-wider">
                                        Total {group.providerName}
                                      </td>
                                      <td className="text-right px-4 py-3 font-mono text-xs text-[var(--hud-text-primary)]">{formatNumber(clientTotals.bruto, 2)} g</td>
                                      <td className="text-right px-4 py-3 font-mono text-xs font-bold text-amber-400">{formatNumber(clientTotals.balanza, 2)} g</td>
                                      <td className="text-right px-4 py-3 font-mono text-xs font-bold text-[var(--hud-accent-red)]">{formatNumber(clientTotals.merma, 2)} g</td>
                                      <td className="text-right px-4 py-3 font-mono text-xs text-[var(--hud-text-primary)]">{formatNumber(clientTotals.fino, 2)} g</td>
                                      <td />
                                      <td />
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Fragment>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-[var(--hud-text-dim)]">No hay salidas registradas.</p>
                </div>
              )}

              {groups.length > 0 && (
                <div className="flex-shrink-0 border-t border-[var(--hud-accent-gold)]/30 bg-[var(--hud-bg-deepest)]">
                  <div className="hidden sm:flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5">
                    <span className="text-xs font-bold text-[var(--hud-text-primary)] uppercase tracking-wider">
                      GRAN TOTAL
                    </span>
                    <div className="flex items-center gap-5">
                      <span className="text-xs font-mono text-[var(--hud-text-dim)]">
                        BI (Bruto Inicial):{' '}
                        <span className="text-[var(--hud-accent-gold)] font-bold text-sm">
                          {formatNumber(grandTotal.bruto, 2)}
                        </span>{' '}
                        <span className="text-[11px] text-[var(--hud-text-dim)]">g</span>
                      </span>
                      <span className="text-[11px] text-[var(--hud-text-dim)]/30">|</span>
                      <span className="text-xs font-mono text-[var(--hud-text-dim)]">
                        BR (Bruto Refundido):{' '}
                        <span className="text-amber-400 font-bold text-sm">
                          {formatNumber(grandTotal.balanza, 2)}
                        </span>{' '}
                        <span className="text-[11px] text-[var(--hud-text-dim)]">g</span>
                      </span>
                      <span className="text-[11px] text-[var(--hud-text-dim)]/30">|</span>
                      <span className="text-xs font-mono text-[var(--hud-text-dim)]">
                        M (Merma):{' '}
                        <span className="text-[var(--hud-accent-red)] font-bold text-sm">
                          {formatNumber(grandTotal.merma, 2)}
                        </span>{' '}
                        <span className="text-[11px] text-[var(--hud-text-dim)]">g</span>
                      </span>
                      <span className="text-[11px] text-[var(--hud-text-dim)]/30">|</span>
                      <span className="text-xs font-mono text-[var(--hud-text-dim)]">
                        Peso Fino:{' '}
                        <span className="text-[var(--hud-text-primary)] font-bold text-sm">
                          {formatNumber(grandTotal.fino, 2)}
                        </span>{' '}
                        <span className="text-[11px] text-[var(--hud-text-dim)]">g</span>
                      </span>
                    </div>
                  </div>

                  <div className="sm:hidden px-4 py-3">
                    <div className="text-[11px] font-bold text-[var(--hud-text-primary)] uppercase tracking-wider mb-2">
                      GRAN TOTAL
                    </div>
                    <div className="grid grid-cols-4 gap-x-4 gap-y-2">
                      <div>
                        <div className="text-[10px] text-[var(--hud-text-dim)] uppercase tracking-wider">BI (Bruto Inicial)</div>
                        <div className="text-[13px] font-mono font-bold text-[var(--hud-accent-gold)] leading-tight whitespace-nowrap">
                          {formatNumber(grandTotal.bruto, 2)}{' '}
                          <span className="text-[11px] font-normal text-[var(--hud-text-dim)]">g</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--hud-text-dim)] uppercase tracking-wider">BR (Bruto Refundido)</div>
                        <div className="text-[13px] font-mono font-bold text-amber-400 leading-tight whitespace-nowrap">
                          {formatNumber(grandTotal.balanza, 2)}{' '}
                          <span className="text-[11px] font-normal text-[var(--hud-text-dim)]">g</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--hud-text-dim)] uppercase tracking-wider">M (Merma)</div>
                        <div className="text-[13px] font-mono font-bold text-[var(--hud-accent-red)] leading-tight whitespace-nowrap">
                          {formatNumber(grandTotal.merma, 2)}{' '}
                          <span className="text-[11px] font-normal text-[var(--hud-text-dim)]">g</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--hud-text-dim)] uppercase tracking-wider">Peso Fino</div>
                        <div className="text-[13px] font-mono font-bold text-[var(--hud-text-primary)] leading-tight whitespace-nowrap">
                          {formatNumber(grandTotal.fino, 2)}{' '}
                          <span className="text-[11px] font-normal text-[var(--hud-text-dim)]">g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {totalPages > 1 && (
                <div className="px-4 sm:px-5 py-3 border-t border-[var(--hud-border)]/10 flex items-center justify-center gap-4">
                  <span className="text-[11px] font-mono text-[var(--hud-text-dim)]">
                    Página {safePage} de {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                      className="p-1.5 text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] disabled:text-[var(--hud-text-dim)]/30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
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

      {selectedLotForModal && bars && (
        <LotDetailModal
          lot={selectedLotForModal}
          bars={bars}
          onClose={() => setSelectedLotForModal(null)}
          zIndex="z-[130]"
        />
      )}
    </>
  );
}