'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Hash, Building2, Layers, AlertCircle, FileStack, Printer } from 'lucide-react';
import { formatNumber, formatWeight } from '@/lib/format';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Bar } from '@/types/api';

interface PackingItem {
  id: string;
  packingNumber?: number | null;
  client?: { name?: string } | null;
  _count?: { bars?: number; validated?: number };
  status: string;
  createdAt: string;
  bars?: Bar[];
  fileName?: string;
}

interface PackingsTableProps {
  packings: PackingItem[];
  isLoading: boolean;
  hasAnyFilter: boolean;
  expandedPackingId: string | null;
  expandedPacking: PackingItem | null;
  loadingExpandedPacking: boolean;
  onExpand: (id: string | null) => void;
  onClearFilters: () => void;
  onViewBar?: (bar: Bar) => void;
  onDownloadReport?: (packing: PackingItem) => void;
}

export function PackingsTable({
  packings, isLoading, hasAnyFilter, expandedPackingId,
  expandedPacking, loadingExpandedPacking, onExpand, onClearFilters, onViewBar, onDownloadReport,
}: PackingsTableProps) {
  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--pm-text-dim)]">
          <LoadingSpinner size="md" className="text-[var(--pm-accent-gold)]" />
          <span className="text-xs font-mono">Cargando packings...</span>
        </div>
      </div>
    );
  }

  if (packings.length === 0) {
    return (
      <div className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
        <EmptyState
          icon={<FileStack className="w-10 h-10 opacity-30" />}
          title={hasAnyFilter ? 'Sin resultados para los filtros actuales' : 'No hay packings registrados'}
          action={hasAnyFilter ? { label: 'Limpiar filtros', onClick: onClearFilters } : undefined}
        />
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--pm-border)]/40 bg-[var(--pm-bg-tertiary)]/30">
              <th className="text-left px-4 py-3 text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Packing</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Proveedor</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Barras</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Validación</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Peso Total</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Fecha</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--pm-border)]/20">
            {packings.map(p => {
              const isExpanded = expandedPackingId === p.id;
              const barCount = p._count?.bars ?? 0;
              const validatedCount = p._count?.validated ?? 0;
              const weight = expandedPacking?.bars && expandedPacking.id === p.id
                ? expandedPacking.bars.reduce((s, b) => s + Number(b.grossWeight), 0)
                : null;

              return (
                <React.Fragment key={p.id}>
                  <tr
                    onClick={() => onExpand(isExpanded ? null : p.id)}
                    className="group cursor-pointer transition-all duration-150 hover:bg-[var(--pm-bg-tertiary)]/60"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5 text-[var(--pm-accent-gold)] shrink-0" />
                        <span className="font-mono text-sm font-bold text-[var(--pm-text-primary)]">
                          #{p.packingNumber ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[var(--pm-text-dim)] shrink-0" />
                        <span className="text-sm text-[var(--pm-text-primary)]">
                          {p.client?.name ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-mono font-semibold text-[var(--pm-text-primary)]">
                        {formatNumber(barCount, 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 rounded-full bg-[var(--pm-bg-tertiary)] overflow-hidden">
                          {barCount > 0 && (
                            <div
                              className="h-full rounded-full bg-[var(--pm-accent-emerald)] transition-all"
                              style={{ width: `${Math.round((validatedCount / barCount) * 100)}%` }}
                            />
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-[var(--pm-text-dim)]">
                          {validatedCount}/{barCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-mono text-[var(--pm-text-dim)]">
                        {weight !== null ? formatWeight(weight, 2) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-[var(--pm-text-dim)]">
                        {new Date(p.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric', month: '2-digit', day: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={p.status} type="packing" size="md" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4 text-[var(--pm-text-dim)] group-hover:text-[var(--pm-accent-gold)] transition-colors" />
                      </motion.div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${p.id}-detail`}>
                      <td colSpan={8} className="px-0 py-0">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                          <div className="border-t border-[var(--pm-border)]/40 bg-[var(--pm-bg-secondary)]/50">
                            {loadingExpandedPacking ? (
                              <div className="flex items-center justify-center gap-2 py-8 text-[var(--pm-text-dim)]">
                                <LoadingSpinner size="md" className="text-[var(--pm-accent-gold)]" />
                                <span className="text-xs font-mono">Cargando barras...</span>
                              </div>
                            ) : expandedPacking?.bars && expandedPacking.bars.length > 0 ? (
                              <div className="p-4 space-y-2">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">
                                    <Layers className="w-3 h-3 inline mr-1.5" />
                                    Barras del Packing #{p.packingNumber}
                                  </h4>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-[var(--pm-accent-gold)]">
                                      {formatWeight(weight ?? 0, 2)} total
                                    </span>
                                    <button
                                      onClick={() => onDownloadReport?.(expandedPacking)}
                                      className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                                      style={{
                                        background: 'rgba(217,167,41,0.08)',
                                        color: 'var(--pm-accent-gold)',
                                        border: '1px solid rgba(217,167,41,0.25)',
                                      }}
                                    >
                                      <Printer className="w-3 h-3" /> IMPRIMIR REPORTE
                                    </button>
                                  </div>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-[11px] font-mono">
                                    <thead>
                                      <tr className="border-b border-[var(--pm-border)]/30">
                                        <th className="text-left py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Barra</th>
                                        <th className="text-right py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Peso Bruto</th>
                                        <th className="text-right py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Ley Au</th>
                                        <th className="text-right py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Peso Fino</th>
                                        <th className="text-center py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Estado</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {expandedPacking.bars.map(bar => (
                                        <tr
                                          key={bar.id}
                                          onClick={() => onViewBar?.(bar)}
                                          className="border-b border-[var(--pm-border)]/20 hover:bg-[var(--pm-bg-tertiary)]/40 transition-colors cursor-pointer"
                                        >
                                          <td className="py-2 px-3 text-[var(--pm-text-primary)] font-semibold">{bar.barNumber || '—'}</td>
                                          <td className="py-2 px-3 text-right text-[var(--pm-text-primary)]">{formatWeight(Number(bar.grossWeight), 2)}</td>
                                          <td className="py-2 px-3 text-right text-[var(--pm-text-primary)]">{formatNumber(Number(bar.purity), 1)}</td>
                                          <td className="py-2 px-3 text-right text-[var(--pm-accent-gold)] font-semibold">{formatWeight(Number(bar.fineWeight), 2)}</td>
                                          <td className="py-2 px-3 text-center">
                                            <StatusBadge status={bar.status} type="bar" size="sm" />
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2 py-8 text-[var(--pm-text-dim)]">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-xs font-mono">Sin barras registradas</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
