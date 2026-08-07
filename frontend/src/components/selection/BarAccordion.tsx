'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Building2, Package, Check, GitMerge, Eye } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { formatComposition } from '@/lib/composition';

export interface BarAccordionRow {
  id: string;
  code: string;
  type: 'lot' | 'bar';
  pesoBruto: number | null;
  leyAu: number | null;
  pesoFino: number;
  clientName: string;
  clientRif: string;
  isMixed?: boolean;
  barCount?: number;
  composition?: { clientId: string; clientName: string; weight: number; percentage: number }[];
}

interface BarAccordionProps {
  groups: Record<string, BarAccordionRow[]>;
  openGroups: Set<string>;
  selectedIds: Set<string>;
  onToggleItem: (id: string) => void;
  onToggleSupplier: (clientId: string) => void;
  onToggleSupplierItems: (clientId: string) => void;
  isSupplierAllSelected: (clientId: string) => boolean;
  onOpenDetail?: (id: string) => void;
  mixedGroupKey?: string;
}

function CheckboxIcon({ checked, indeterminate }: { checked: boolean; indeterminate?: boolean }) {
  if (checked) {
    return (
      <div className="w-4 h-4 rounded border border-[var(--pm-accent-amber)] bg-[var(--pm-accent-amber)]/20 flex items-center justify-center">
        <Check className="w-2.5 h-2.5 text-[var(--pm-accent-amber)]" strokeWidth={3} />
      </div>
    );
  }
  if (indeterminate) {
    return (
      <div className="w-4 h-4 rounded border border-[var(--pm-accent-amber)] bg-[var(--pm-accent-amber)]/10 flex items-center justify-center">
        <div className="w-2 h-0.5 rounded-sm bg-[var(--pm-accent-amber)]" />
      </div>
    );
  }
  return (
    <div className="w-4 h-4 rounded border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)] hover:border-[var(--pm-accent-amber)]/50 transition-colors" />
  );
}

export function BarAccordion({
  groups,
  openGroups,
  selectedIds,
  onToggleItem,
  onToggleSupplier,
  onToggleSupplierItems,
  isSupplierAllSelected,
  onOpenDetail,
  mixedGroupKey,
}: BarAccordionProps) {
  const entries = useMemo(() => {
    return Object.entries(groups).sort(([aKey, aItems], [bKey, bItems]) => {
      const isMixedA = mixedGroupKey !== undefined && aKey === mixedGroupKey;
      const isMixedB = mixedGroupKey !== undefined && bKey === mixedGroupKey;
      if (isMixedA !== isMixedB) return isMixedA ? -1 : 1;
      return (aItems[0]?.clientName ?? '').localeCompare(bItems[0]?.clientName ?? '');
    });
  }, [groups, mixedGroupKey]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--pm-text-dim)]">
        <Package className="w-10 h-10 text-[var(--pm-accent-gold)]/20 mb-3 animate-pulse" />
        <span className="text-sm font-sans">Sin ítems disponibles</span>
        <p className="text-[11px] font-mono mt-1">Asegúrese de que haya procesos cerrados o barras en stock.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map(([clientId, items]) => {
        const isMixedGroup = mixedGroupKey !== undefined && clientId === mixedGroupKey;
        const isOpen = openGroups.has(clientId);
        const allSelected = isSupplierAllSelected(clientId);
        const someSelected = items.some(i => selectedIds.has(i.id)) && !allSelected;
        const barCount = items.filter(i => i.type === 'bar').length;
        const lotCount = items.filter(i => i.type === 'lot').length;
        const totalBars = items.reduce((s, i) => s + (i.barCount ?? 0), 0);
        const pesoFinoTotal = items.reduce((s, i) => s + i.pesoFino, 0);

        return (
          <div
            key={clientId}
            className={`rounded-xl border overflow-hidden ${
              isMixedGroup
                ? 'border-teal-500/30 bg-teal-950/10'
                : 'border-[var(--pm-border)]/30'
            }`}
          >
            {/* ─── Supplier Header ─── */}
            <button
              type="button"
              onClick={() => onToggleSupplier(clientId)}
              className={`w-full flex items-center justify-between px-4 py-3 border-b active:scale-[0.995] transition-all cursor-pointer ${
                isMixedGroup
                  ? 'bg-teal-950/30 border-teal-900/50 hover:bg-teal-950/50'
                  : 'bg-emerald-950/30 border-emerald-900/50 hover:bg-emerald-950/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Select-all checkbox */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={e => { e.stopPropagation(); onToggleSupplierItems(clientId); }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleSupplierItems(clientId); } }}
                  className="cursor-pointer shrink-0"
                >
                  <CheckboxIcon checked={allSelected} indeterminate={someSelected} />
                </div>

                {/* Client name + info */}
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-2">
                    {isMixedGroup
                      ? <GitMerge className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      : <Building2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    }
                    <span className={`text-xs font-sans font-semibold truncate ${isMixedGroup ? 'text-teal-200' : 'text-white'}`}>
                      {isMixedGroup ? '📦 BARRAS MIXTAS' : items[0].clientName}
                    </span>
                    {isMixedGroup ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-teal-500/20 text-teal-200">
                        MIXTO ({items.length})
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-200/60">
                        {items[0].clientRif}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[11px] font-mono ${isMixedGroup ? 'text-teal-200/80' : 'text-emerald-200/80'}`}>
                  {isMixedGroup
                    ? `${totalBars} BARRAS`
                    : `${barCount > 0 ? `${barCount} barra(s)` : ''}${barCount > 0 && lotCount > 0 ? ' · ' : ''}${lotCount > 0 ? `${lotCount} lote(s)` : ''}`}
                </span>
                {/* Chevron */}
                {isOpen
                  ? <ChevronUp className={`w-4 h-4 ${isMixedGroup ? 'text-teal-300' : 'text-emerald-300'}`} />
                  : <ChevronDown className={`w-4 h-4 ${isMixedGroup ? 'text-teal-300' : 'text-emerald-300'}`} />
                }
              </div>
            </button>

            {/* ─── Expanded Table ─── */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="overflow-x-auto border-t border-[var(--pm-border)]/20">
                    <table className="w-full border-collapse text-xs">
                      <thead className="sticky top-0 z-10 bg-[var(--pm-bg-secondary)]">
                        <tr className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">
                          <th className="w-10 px-4 py-2.5 bg-[var(--pm-bg-secondary)]">
                            {/* checkbox column spacer */}
                          </th>
                          <th className="px-4 py-2.5 text-left bg-[var(--pm-bg-secondary)]">Código</th>
                          <th className="px-4 py-2.5 text-left bg-[var(--pm-bg-secondary)]">Status</th>
                          <th className="px-4 py-2.5 text-right bg-[var(--pm-bg-secondary)]">Bruto (g)</th>
                          <th className="px-4 py-2.5 text-right bg-[var(--pm-bg-secondary)]">Ley (‰)</th>
                          <th className="px-4 py-2.5 text-right bg-[var(--pm-bg-secondary)]">Fino (g)</th>
                          <th className="w-8 px-2 py-2.5 bg-[var(--pm-bg-secondary)]">
                            <span className="sr-only">Ver detalle</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          const isSelected = selectedIds.has(item.id);
                          return (
                            <tr
                              key={item.id}
                              onClick={() => onToggleItem(item.id)}
                              className={`group transition-all duration-100 cursor-pointer active:scale-[0.99] ${
                                isSelected
                                  ? 'bg-[var(--pm-accent-amber)]/10'
                                  : idx % 2 === 0
                                    ? 'bg-transparent'
                                    : 'bg-[var(--pm-bg-deepest)]/20'
                              } hover:bg-neutral-800/50`}
                            >
                              {/* Checkbox — toggles selection (stopPropagation evita doble toggle con la fila) */}
                              <td className="px-4 py-1.5 text-center" onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => onToggleItem(item.id)}
                                  className="accent-[var(--pm-accent-amber)] cursor-pointer w-3.5 h-3.5"
                                />
                              </td>
                              {/* Código */}
                              <td className="px-4 py-1.5 text-left">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-mono font-bold text-amber-400 tracking-wider text-[11px] hover:text-amber-300 transition-colors">
                                    {item.code}
                                  </span>
                                  {item.type === 'lot' && item.isMixed && item.composition && item.composition.length > 1 && (
                                    <span className="flex items-center gap-1 text-[8px] font-mono">
                                      <GitMerge className="w-2.5 h-2.5 text-teal-400 shrink-0" />
                                      <span className="font-bold text-teal-400">MIXTO</span>
                                      <span className="text-teal-300/80">{formatComposition(item.composition)}</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                              {/* Status */}
                              <td className="px-4 py-1.5 text-left">
                                <span
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 w-20 text-center ${
                                    item.type === 'lot'
                                      ? 'text-[var(--pm-accent-amber)] bg-[var(--pm-accent-amber)]/10'
                                      : 'text-slate-400 bg-slate-500/10'
                                  }`}
                                >
                                  {item.type === 'lot' ? 'REFUNDIDO' : 'SIN REFUNDIR'}
                                </span>
                              </td>
                              {/* Peso Bruto */}
                              <td className="px-4 py-1.5 text-right font-mono font-medium text-slate-100 text-[12px]">
                                {item.pesoBruto !== null ? formatNumber(item.pesoBruto, 2) : '—'}
                              </td>
                              {/* Ley Au */}
                              <td className="px-4 py-1.5 text-right font-mono font-medium text-cyan-400/80 text-[12px]">
                                {item.leyAu !== null ? `${formatNumber(Number(item.leyAu), 2)}‰` : '—'}
                              </td>
                              {/* Peso Fino */}
                              <td className="px-4 py-1.5 text-right font-mono font-medium text-slate-400 text-[12px]">
                                {formatNumber(item.pesoFino, 2)}
                              </td>
                              {/* Detalle affordance — Eye abre el detalle sin seleccionar */}
                              <td className="px-3 py-1.5 text-right">
                                <button
                                  type="button"
                                  title="Ver detalle"
                                  aria-label={`Ver detalle de ${item.code}`}
                                  onClick={(e) => { e.stopPropagation(); onOpenDetail?.(item.id); }}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-all active:scale-90 hover:bg-[var(--pm-bg-hover)]/40"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500 hover:text-[var(--pm-accent-gold)] transition-colors" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
