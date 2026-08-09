'use client';

import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { formatNumber } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, ChevronDown, ChevronLeft, ChevronRight, Search,
} from 'lucide-react';
import type { Bar, Client } from '@/types/api';

interface SupplierDirectoryProps {
  bars: Bar[];
  clients: Client[] | undefined;
  isLoading?: boolean;
  purityFirst?: boolean;
  showSearch?: boolean;
  hideFooter?: boolean;
  filterSupplierId?: string;
  onBarClick?: (barId: string) => void;
}

export function SupplierDirectory({
  bars,
  clients,
  isLoading,
  purityFirst = false,
  showSearch = false,
  hideFooter = false,
  filterSupplierId,
  onBarClick,
}: SupplierDirectoryProps) {
  const SUPPLIERS_PER_PAGE = 10;
  const BARS_PER_PAGE = 10;

  const [searchCode, setSearchCode] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(
    filterSupplierId ?? null,
  );
  const [supplierBarPages, setSupplierBarPages] = useState<Record<string, number>>({});

  useEffect(() => {
    if (filterSupplierId) setExpandedSupplierId(filterSupplierId);
  }, [filterSupplierId]);

  const { visibleClients, barsByClient } = useMemo(() => {
    const q = searchCode.toLowerCase();
    const grouped = new Map<string, Bar[]>();
    const latestDate = new Map<string, number>();

    for (const bar of bars) {
      if (q && !bar.barNumber.toLowerCase().includes(q)) continue;
      if (!grouped.has(bar.clientId)) grouped.set(bar.clientId, []);
      grouped.get(bar.clientId)!.push(bar);
      const d = new Date(bar.createdAt).getTime();
      const prev = latestDate.get(bar.clientId) ?? 0;
      if (d > prev) latestDate.set(bar.clientId, d);
    }

    for (const [, cBars] of grouped) {
      cBars.sort((a, b) => {
        const getPriority = (status: string) => {
          switch (status) {
            case 'PROCESANDO': return 1;
            case 'IN_STOCK': return 2;
            case 'POR_VALIDAR': return 3;
            case 'EXITED': return 4;
            default: return 99;
          }
        };
        const priorityA = getPriority(a.status);
        const priorityB = getPriority(b.status);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.barNumber.localeCompare(b.barNumber);
      });
    }

    const filtered = (clients ?? [])
      .filter((c) => {
        if (filterSupplierId) return c.id === filterSupplierId;
        if (!latestDate.has(c.id)) return false;
        if (!q) return true;
        return grouped.get(c.id)?.some((b) => b.barNumber.toLowerCase().includes(q)) ?? false;
      })
      .sort((a, b) => (latestDate.get(b.id) ?? 0) - (latestDate.get(a.id) ?? 0));

    return { visibleClients: filtered, barsByClient: grouped };
  }, [bars, clients, searchCode, filterSupplierId]);

  const supplierTotalPages = Math.max(1, Math.ceil(visibleClients.length / SUPPLIERS_PER_PAGE));
  const safeSupplierPage = Math.min(currentPage, supplierTotalPages);
  const paginatedClients = visibleClients.slice(
    (safeSupplierPage - 1) * SUPPLIERS_PER_PAGE,
    safeSupplierPage * SUPPLIERS_PER_PAGE,
  );

  const grandTotal = useMemo(() => {
    let grossWeight = 0;
    let fa = 0;
    for (const c of visibleClients) {
      for (const b of barsByClient.get(c.id) ?? []) {
        grossWeight += Number(b.grossWeight);
        fa += Number(b.fineWeight);
      }
    }
    return { grossWeight, fa };
  }, [visibleClients, barsByClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--hud-accent-gold)]/30 border-t-[var(--hud-accent-gold)] animate-spin rounded-full" />
          <span className="text-xs text-[var(--hud-text-dim)]">Cargando barras...</span>
        </div>
      </div>
    );
  }

  return (
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
            {String(visibleClients.length).padStart(2, '0')}
          </span>
        </div>
      )}

      {paginatedClients.length > 0 ? (
        <div className="flex-1 overflow-y-auto scrollbar-thin pb-40 touch-pan-y">
          {paginatedClients.map((client) => {
            const clientBars = barsByClient.get(client.id) ?? [];
            const barPage = supplierBarPages[client.id] ?? 1;
            const barTotalPages = Math.max(1, Math.ceil(clientBars.length / BARS_PER_PAGE));
            const safeBarPage = Math.min(barPage, barTotalPages);
            const paginatedBars = clientBars.slice(
              (safeBarPage - 1) * BARS_PER_PAGE,
              safeBarPage * BARS_PER_PAGE,
            );
            const clientTotals = {
              grossWeight: clientBars.reduce((s, b) => s + Number(b.grossWeight), 0),
              fa: clientBars.reduce((s, b) => s + Number(b.fineWeight), 0),
            };

            return (
              <Fragment key={client.id}>
                <div className="px-4 sm:px-5 pt-4 sm:pt-5 first:pt-0">
                  <div
                    className="glass-panel cursor-pointer active:scale-[0.98] transition-all hover:bg-[var(--hud-accent-gold)]/[0.04] rounded-xl border border-[var(--hud-border)]/40 overflow-hidden"
                    onClick={() =>
                      setExpandedSupplierId((prev) => (prev === client.id ? null : client.id))
                    }
                  >
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Building2 className="w-5 h-5 text-[var(--hud-accent-gold)] flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[var(--hud-text-primary)] uppercase tracking-wider truncate">
                            {client.name}
                          </p>
                          <p className="text-[11px] text-[var(--hud-text-dim)] font-mono truncate">
                            RIF: {client.rif}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[11px] font-mono text-[var(--hud-text-dim)] whitespace-nowrap">
                          Bruto: <span className="text-[var(--hud-accent-gold)] font-bold">{formatNumber(clientTotals.grossWeight, 2)} g</span> · Fino: <span className="text-[var(--hud-text-primary)] font-bold">{formatNumber(clientTotals.fa, 2)} g</span>
                        </span>
                        <span className="text-[11px] font-mono text-[var(--hud-text-dim)] bg-[var(--hud-bg-deepest)]/50 px-2 py-0.5 border border-[var(--hud-border)] rounded whitespace-nowrap">
                          {clientBars.length} BARRAS
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-[var(--hud-text-dim)] transition-transform flex-shrink-0 ${
                            expandedSupplierId === client.id ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedSupplierId === client.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="px-4 sm:px-5 pb-4 sm:pb-5 overflow-hidden">
                      <div className="overflow-x-auto rounded-xl border border-[var(--hud-border)]/20">
                        <table className="w-full table-fixed border-collapse text-xs font-sans">
                          <thead>
                            <tr>
                              <th className="w-[15%] text-left px-4 py-3 bg-[var(--hud-bg-primary)]">Código</th>
                              {purityFirst && <th className="w-[15%] text-right px-4 py-3">Ley Au</th>}
                              <th className="w-[25%] text-right px-4 py-3">Peso Bruto</th>
                              {!purityFirst && <th className="w-[15%] text-right px-4 py-3">Ley Au</th>}
                              <th className="w-[25%] text-right px-4 py-3">Peso Fino</th>
                              <th className="w-[20%] text-right px-4 py-3">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedBars.map((bar, idx) => {
                              return (
                                <tr key={bar.id}
                                  onClick={() => onBarClick?.(bar.id)}
                                  className={`${idx % 2 === 1 ? 'bg-[var(--hud-bg-deepest)]/30' : ''} hover:bg-[var(--hud-accent-gold)]/[0.03] transition-colors${onBarClick ? ' cursor-pointer' : ''}`}>
                                  <td className="text-left px-4 py-3 sticky left-0 bg-[var(--hud-bg-primary)] font-semibold text-[var(--hud-accent-gold)]">
                                    <span className="text-[11px]">{bar.barNumber}</span>
                                  </td>
                                  {purityFirst && (
                                    <td className="text-right px-4 py-3 font-mono text-[var(--hud-accent-cyan)]">{formatNumber(Number(bar.purity), 2)}</td>
                                  )}
                                  <td className="text-right px-4 py-3 font-mono text-[var(--hud-accent-gold)]">{formatNumber(Number(bar.grossWeight), 2)}</td>
                                  {!purityFirst && (
                                    <td className="text-right px-4 py-3 font-mono text-[var(--hud-accent-cyan)]">{formatNumber(Number(bar.purity), 2)}</td>
                                  )}
                                  <td className="text-right px-4 py-3 font-mono text-[var(--hud-text-primary)]">{formatNumber(Number(bar.fineWeight), 2)}</td>
                                  <td className="text-right px-4 py-3 whitespace-nowrap">
                                    <StatusBadge status={bar.status} size="sm" />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {clientBars.length > 0 && (
                            <tfoot>
                              <tr className="border-t border-[var(--hud-border)] bg-[var(--hud-bg-deepest)]/50">
                                <td className="sticky left-0 bg-[var(--hud-bg-deepest)]/50 px-3 py-2 text-[10px] font-bold text-[var(--hud-text-dim)] uppercase tracking-wider">
                                  Total {client.name}
                                </td>
                                {purityFirst && <td />}
                                <td className="text-right px-4 py-3 font-mono text-xs text-[var(--hud-accent-gold)]">{formatNumber(clientTotals.grossWeight, 2)}</td>
                                {!purityFirst && <td />}
                                <td className="text-right px-4 py-3 font-mono text-xs text-[var(--hud-text-primary)]">{formatNumber(clientTotals.fa, 2)}</td>
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
                              onClick={() =>
                                setSupplierBarPages((prev) => ({
                                  ...prev,
                                  [client.id]: safeBarPage - 1,
                                }))
                              }
                              disabled={safeBarPage <= 1}
                              className="p-1 text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] disabled:text-[var(--hud-text-dim)]/30 disabled:cursor-not-allowed transition-all"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() =>
                                setSupplierBarPages((prev) => ({
                                  ...prev,
                                  [client.id]: safeBarPage + 1,
                                }))
                              }
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
          <p className="text-sm text-[var(--hud-text-dim)]">No hay barras registradas.</p>
        </div>
      )}

      {!hideFooter && visibleClients.length > 0 && (
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
  );
}
