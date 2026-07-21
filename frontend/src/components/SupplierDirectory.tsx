'use client';

import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { formatNumber } from '@/lib/format';
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
  filterSupplierId?: string;
}

const STATUS_STYLES: Record<string, string> = {
  POR_VALIDAR: 'text-[var(--pm-accent-amber)] bg-[var(--pm-accent-amber)]/10 border-[var(--pm-accent-amber)]/20',
  IN_STOCK: 'text-[var(--pm-accent-emerald)] bg-[var(--pm-accent-emerald)]/10 border-[var(--pm-accent-emerald)]/20',
  PROCESANDO: 'text-[var(--pm-accent-cyan)] bg-[var(--pm-accent-cyan)]/10 border-[var(--pm-accent-cyan)]/20',
  COMPLETADO: 'text-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)]/10 border-[var(--pm-accent-gold)]/20',
  EXITED: 'text-[var(--pm-text-dim)] bg-[var(--pm-bg-tertiary)]/50 border-[var(--pm-border)]/30',
};

const STATUS_LABELS: Record<string, string> = {
  POR_VALIDAR: 'Pendiente',
  IN_STOCK: 'En Bóveda',
  PROCESANDO: 'Fundiendo',
  COMPLETADO: 'Fundido',
  EXITED: 'Despachado',
};

export function SupplierDirectory({
  bars,
  clients,
  isLoading,
  purityFirst = false,
  showSearch = false,
  filterSupplierId,
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
      if (!grouped.has(bar.clientId)) grouped.set(bar.clientId, []);
      grouped.get(bar.clientId)!.push(bar);
      const d = new Date(bar.createdAt).getTime();
      const prev = latestDate.get(bar.clientId) ?? 0;
      if (d > prev) latestDate.set(bar.clientId, d);
    }

    for (const [, cBars] of grouped) {
      cBars.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    const ids = new Set(visibleClients.map((c) => c.id));
    const visible = bars.filter((b) => ids.has(b.clientId));
    return {
      grossWeight: visible.reduce((s, b) => s + Number(b.grossWeight), 0),
      fa: visible.reduce((s, b) => s + Number(b.fineWeight), 0),
      fe: visible.reduce((s, b) => s + Number(b.fineWeight) * 0.99, 0),
    };
  }, [bars, visibleClients]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[var(--pm-accent-gold)]/30 border-t-[var(--pm-accent-gold)] animate-spin rounded-full" />
          <span className="text-xs text-[var(--pm-text-dim)]">Cargando barras...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {showSearch && (
        <div className="px-4 sm:px-5 py-3 border-b border-[var(--pm-border)]/10 flex items-center justify-end gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--pm-text-dim)]" />
            <input
              type="text"
              value={searchCode}
              onChange={(e) => { setSearchCode(e.target.value); setCurrentPage(1); }}
              placeholder="Buscar por código..."
              className="w-36 pl-7 pr-2 py-1.5 bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] text-[var(--pm-text-dim)] text-[10px] placeholder:text-[var(--pm-text-dim)]/30 outline-none transition-all focus:border-[var(--pm-accent-gold)]/40 rounded-lg"
            />
          </div>
          <span className="text-[10px] font-mono text-[var(--pm-text-dim)] bg-[var(--pm-bg-deepest)]/50 px-2 py-0.5 border border-[var(--pm-border)] rounded">
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
              fe: clientBars.reduce((s, b) => s + Number(b.fineWeight) * 0.99, 0),
            };

            return (
              <Fragment key={client.id}>
                <div className="px-4 sm:px-5 pt-4 sm:pt-5 first:pt-0">
                  <div
                    className="glass-panel cursor-pointer active:scale-[0.98] transition-all hover:bg-[var(--pm-accent-gold)]/[0.04] rounded-xl border border-[var(--pm-border)]/40 overflow-hidden"
                    onClick={() =>
                      setExpandedSupplierId((prev) => (prev === client.id ? null : client.id))
                    }
                  >
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Building2 className="w-5 h-5 text-[var(--pm-accent-gold)] flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[var(--pm-text-primary)] uppercase tracking-wider truncate">
                            {client.name}
                          </p>
                          <p className="text-[10px] text-[var(--pm-text-dim)] font-mono truncate">
                            RIF: {client.rif}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[10px] font-mono text-[var(--pm-text-dim)] bg-[var(--pm-bg-deepest)]/50 px-2 py-0.5 border border-[var(--pm-border)] rounded whitespace-nowrap">
                          {clientBars.length} BARRAS
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-[var(--pm-text-dim)] transition-transform flex-shrink-0 ${
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
                      <div className="overflow-x-auto rounded-xl border border-[var(--pm-border)]/20">
                        <table className="premium-table w-full text-[11px] font-mono">
                          <thead>
                            <tr>
                              <th className="sticky left-0 bg-[var(--pm-bg-primary)] z-10" style={{ minWidth: 120 }}>Código</th>
                              {purityFirst && <th className="text-right">Ley Au (‰)</th>}
                              <th className="text-right">Bruto (g)</th>
                              {!purityFirst && <th className="text-right">Ley Au (‰)</th>}
                              <th className="text-right">FA (g)</th>
                              <th className="text-right">FE (g)</th>
                              <th className="text-right">Ley Ag (‰)</th>
                              <th className="text-right">Ag (g)</th>
                              <th className="text-right">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedBars.map((bar, idx) => {
                              const fe = Number(bar.fineWeight) * 0.99;
                              return (
                                <tr key={bar.id}
                                  className={`${idx % 2 === 1 ? 'bg-[var(--pm-bg-deepest)]/30' : ''} hover:bg-[var(--pm-accent-gold)]/[0.03] transition-colors`}>
                                  <td className="sticky left-0 bg-[var(--pm-bg-primary)] font-semibold text-[var(--pm-accent-gold)]" style={{ minWidth: 120 }}>
                                    <span className="text-[11px]">{bar.barNumber}</span>
                                  </td>
                                  {purityFirst && (
                                    <td className="text-right text-[var(--pm-text-primary)]">{formatNumber(Number(bar.purity), 1)}</td>
                                  )}
                                  <td className="text-right text-[var(--pm-text-primary)]">{formatNumber(Number(bar.grossWeight), 2)}</td>
                                  {!purityFirst && (
                                    <td className="text-right text-[var(--pm-text-primary)]">{formatNumber(Number(bar.purity), 1)}</td>
                                  )}
                                  <td className="text-right text-[var(--pm-accent-gold)]">{formatNumber(Number(bar.fineWeight), 4)}</td>
                                  <td className="text-right text-[var(--pm-accent-cyan)]">{formatNumber(fe, 4)}</td>
                                  <td className="text-right text-[var(--pm-text-dim)]">
                                    {bar.leyAg != null ? formatNumber(Number(bar.leyAg), 1) : '—'}
                                  </td>
                                  <td className="text-right text-[var(--pm-text-dim)]">
                                    {bar.fineWeightAg != null ? formatNumber(Number(bar.fineWeightAg), 4) : '—'}
                                  </td>
                                  <td className="text-right">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${STATUS_STYLES[bar.status] || ''}`}>
                                      {STATUS_LABELS[bar.status] || bar.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          {clientBars.length > 0 && (
                            <tfoot>
                              <tr className="border-t border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50">
                                <td className="sticky left-0 bg-[var(--pm-bg-deepest)]/50 px-3 py-2 text-[9px] font-bold text-[var(--pm-text-dim)] uppercase tracking-widest">
                                  Total {client.name}
                                </td>
                                {purityFirst && <td />}
                                <td className="text-right text-xs text-[var(--pm-text-primary)]">{formatNumber(clientTotals.grossWeight, 2)}</td>
                                {!purityFirst && <td />}
                                <td className="text-right text-xs text-[var(--pm-accent-gold)]">{formatNumber(clientTotals.fa, 4)}</td>
                                <td className="text-right text-xs text-[var(--pm-accent-cyan)]">{formatNumber(clientTotals.fe, 4)}</td>
                                <td colSpan={3} />
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                      {barTotalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">
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
                              className="p-1 text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] disabled:text-[var(--pm-text-dim)]/30 disabled:cursor-not-allowed transition-all"
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
                              className="p-1 text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] disabled:text-[var(--pm-text-dim)]/30 disabled:cursor-not-allowed transition-all"
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
          <p className="text-sm text-[var(--pm-text-dim)]">No hay barras registradas.</p>
        </div>
      )}

      {visibleClients.length > 0 && (
        <div className="flex-shrink-0 border-t border-[var(--pm-accent-gold)]/30 bg-[var(--pm-bg-deepest)]">
          <div className="hidden sm:flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5">
            <span className="text-xs font-bold text-[var(--pm-text-primary)] uppercase tracking-widest">
              GRAN TOTAL
            </span>
            <div className="flex items-center gap-5">
              <span className="text-xs font-mono text-[var(--pm-text-dim)]">
                Bruto:{' '}
                <span className="text-[var(--pm-accent-gold)] font-bold text-sm">
                  {formatNumber(grandTotal.grossWeight, 2)}
                </span>{' '}
                <span className="text-[10px] text-[var(--pm-text-dim)]">g</span>
              </span>
              <span className="text-[10px] text-[var(--pm-text-dim)]/30">|</span>
              <span className="text-xs font-mono text-[var(--pm-text-dim)]">
                FA:{' '}
                <span className="text-[var(--pm-accent-gold)] font-bold text-sm">
                  {formatNumber(grandTotal.fa, 4)}
                </span>{' '}
                <span className="text-[10px] text-[var(--pm-text-dim)]">g</span>
              </span>
              <span className="text-[10px] text-[var(--pm-text-dim)]/30">|</span>
              <span className="text-xs font-mono text-[var(--pm-text-dim)]">
                FE:{' '}
                <span className="text-[var(--pm-accent-gold)] font-bold text-sm">
                  {formatNumber(grandTotal.fe, 4)}
                </span>{' '}
                <span className="text-[10px] text-[var(--pm-text-dim)]">g</span>
              </span>
            </div>
          </div>

          <div className="sm:hidden px-4 py-3">
            <div className="text-[10px] font-bold text-[var(--pm-text-primary)] uppercase tracking-widest mb-2">
              GRAN TOTAL
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <div className="text-[9px] text-[var(--pm-text-dim)] uppercase tracking-wider">Bruto</div>
                <div className="text-[13px] font-mono font-bold text-[var(--pm-accent-gold)] leading-tight whitespace-nowrap">
                  {formatNumber(grandTotal.grossWeight, 2)}{' '}
                  <span className="text-[10px] font-normal text-[var(--pm-text-dim)]">g</span>
                </div>
              </div>
              <div>
                <div className="text-[9px] text-[var(--pm-text-dim)] uppercase tracking-wider">FA</div>
                <div className="text-[13px] font-mono font-bold text-[var(--pm-accent-gold)] leading-tight whitespace-nowrap">
                  {formatNumber(grandTotal.fa, 4)}{' '}
                  <span className="text-[10px] font-normal text-[var(--pm-text-dim)]">g</span>
                </div>
              </div>
              <div>
                <div className="text-[9px] text-[var(--pm-text-dim)] uppercase tracking-wider">FE</div>
                <div className="text-[13px] font-mono font-bold text-[var(--pm-accent-gold)] leading-tight whitespace-nowrap">
                  {formatNumber(grandTotal.fe, 4)}{' '}
                  <span className="text-[10px] font-normal text-[var(--pm-text-dim)]">g</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {supplierTotalPages > 1 && (
        <div className="px-4 sm:px-5 py-3 border-t border-[var(--pm-border)]/10 flex items-center justify-center gap-4">
          <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">
            Página {safeSupplierPage} de {supplierTotalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeSupplierPage <= 1}
              className="p-1.5 text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] disabled:text-[var(--pm-text-dim)]/30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(supplierTotalPages, p + 1))}
              disabled={safeSupplierPage >= supplierTotalPages}
              className="p-1.5 text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] disabled:text-[var(--pm-text-dim)]/30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
