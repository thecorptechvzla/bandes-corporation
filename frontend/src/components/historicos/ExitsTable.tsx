'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Truck, FileStack, Download, User, Building } from 'lucide-react';
import { formatNumber, formatWeight } from '@/lib/format';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

interface ExitDetail {
  id: string;
  lot?: { name?: string; process?: { client?: { name?: string } } } | null;
  bars?: { id: string; barNumber: string; fineWeight?: number; grossWeight?: number }[];
  weightAported: string | number;
}

interface ExitItem {
  id: string;
  destination?: string;
  grossWeight: number;
  createdAt: string;
  exitDetails: ExitDetail[];
}

interface ExitsTableProps {
  exits: ExitItem[];
  isLoading: boolean;
  hasAnyFilter: boolean;
  expandedExitId: string | null;
  onExpand: (id: string | null) => void;
  onClearFilters: () => void;
  onPDFCliente: (exit: ExitItem) => void;
  onPDFEmpresa: (exit: ExitItem) => void;
}

export function ExitsTable({
  exits, isLoading, hasAnyFilter, expandedExitId, onExpand, onClearFilters,
  onPDFCliente, onPDFEmpresa,
}: ExitsTableProps) {
  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
        <div className="flex items-center justify-center gap-2 py-16 text-[var(--pm-text-dim)]">
          <LoadingSpinner size="md" className="text-[var(--pm-accent-gold)]" />
          <span className="text-xs font-mono">Cargando egresos...</span>
        </div>
      </div>
    );
  }

  if (exits.length === 0) {
    return (
      <div className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
        <EmptyState
          icon={<Truck className="w-10 h-10 opacity-30" />}
          title={hasAnyFilter ? 'Sin resultados para los filtros actuales' : 'No hay egresos registrados'}
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
              <th className="text-left px-4 py-3 text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Despacho</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Proveedores</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Lotes</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Peso Bruto</th>
              <th className="text-left px-4 py-3 text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Fecha</th>
              <th className="text-center px-4 py-3 text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Comprobantes</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--pm-border)]/20">
            {exits.map(e => {
              const isExpanded = expandedExitId === e.id;
              const providerNames = [...new Set(
                e.exitDetails.map(d => d.lot?.process?.client?.name).filter(Boolean),
              )] as string[];
              const lotCount = e.exitDetails.length;

              return (
                <React.Fragment key={e.id}>
                  <tr
                    onClick={() => onExpand(isExpanded ? null : e.id)}
                    className="group cursor-pointer transition-all duration-150 hover:bg-[var(--pm-bg-tertiary)]/60"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          {e.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {providerNames.length === 1 ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-primary)] border border-[var(--pm-border)]/30">
                          {providerNames[0]}
                        </span>
                      ) : (
                        <span className="text-sm font-mono font-semibold text-[var(--pm-text-dim)]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-mono font-semibold text-[var(--pm-text-primary)]">
                        {formatNumber(lotCount, 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-mono font-semibold text-[var(--pm-accent-gold)]">
                        {formatWeight(Number(e.grossWeight), 2)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-[var(--pm-text-dim)]">
                        {new Date(e.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric', month: '2-digit', day: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5" onClick={ev => ev.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onPDFCliente(e)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border border-transparent bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all active:scale-95 cursor-pointer"
                          title="Descargar Comprobante Cliente"
                        >
                          <User className="w-3 h-3" /> Cliente
                        </button>
                        <button
                          type="button"
                          onClick={() => onPDFEmpresa(e)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border border-transparent bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all active:scale-95 cursor-pointer"
                          title="Descargar Comprobante Empresa"
                        >
                          <Building className="w-3 h-3" /> Empresa
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4 text-[var(--pm-text-dim)] group-hover:text-[var(--pm-accent-gold)] transition-colors" />
                      </motion.div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${e.id}-detail`}>
                      <td colSpan={7} className="px-0 py-0">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                          <div className="border-t border-[var(--pm-border)]/40 bg-slate-900/40 p-4">
                            <div className="flex gap-4">
                              <div className="w-1 shrink-0 self-stretch rounded-full bg-[var(--pm-accent-emerald)]/70" />
                              <div className="flex-1 space-y-3 min-w-0">
                                <h4 className="text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">
                                  <FileStack className="w-3 h-3 inline mr-1.5" />
                                  Detalle del Despacho
                                </h4>
                                <div className="space-y-3">
                                  {e.exitDetails.map(detail => (
                                    <div
                                      key={detail.id}
                                      className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border border-[var(--pm-border)]/20 bg-[var(--pm-bg-tertiary)]/25"
                                    >
                                      {/* 1 · Identificación */}
                                      <div className="min-w-0">
                                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Lote / Barra</span>
                                        <span className="mt-1 block text-sm font-medium text-white truncate">
                                          {detail.lot?.name ?? '—'}
                                        </span>
                                        {detail.bars && detail.bars.length > 0 && (
                                          <div className="mt-2 flex flex-wrap gap-1">
                                            {detail.bars.map(bar => (
                                              <span
                                                key={bar.id}
                                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] border border-[var(--pm-border)]/30"
                                              >
                                                {bar.barNumber}
                                                <span className="text-[var(--pm-accent-gold)]">({formatWeight(Number(bar.fineWeight), 1)})</span>
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                        <span className="mt-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cant. Barras</span>
                                        <span className="mt-0.5 block text-sm font-medium text-white">{detail.bars?.length ?? 0}</span>
                                      </div>

                                      {/* 2 · Actores */}
                                      <div className="min-w-0">
                                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Proveedor</span>
                                        <span className="mt-1 block text-sm font-medium text-white truncate">
                                          {detail.lot?.process?.client?.name ?? '—'}
                                        </span>
                                        <span className="mt-3 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Destino</span>
                                        <span className="mt-0.5 block text-sm font-medium text-white truncate">{e.destination}</span>
                                      </div>

                                      {/* 3 · Métricas */}
                                      <div className="min-w-0">
                                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Peso Aportado</span>
                                        <span className="mt-1 block text-lg font-semibold text-[var(--pm-accent-gold)]">
                                          {formatWeight(Number(detail.weightAported), 2)}
                                        </span>
                                      </div>

                                      {/* 4 · Acciones */}
                                      <div className="flex flex-col items-start md:items-end justify-center gap-2 min-w-0" onClick={ev => ev.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={() => onPDFCliente(e)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border border-transparent bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all active:scale-95 cursor-pointer"
                                          title="Descargar Comprobante Cliente"
                                        >
                                          <Download className="w-3 h-3" /> Cliente
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => onPDFEmpresa(e)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border border-transparent bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all active:scale-95 cursor-pointer"
                                          title="Descargar Comprobante Empresa"
                                        >
                                          <Download className="w-3 h-3" /> Empresa
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
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
