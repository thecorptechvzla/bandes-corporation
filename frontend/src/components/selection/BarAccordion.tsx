'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Building2, Package, Check, GitMerge } from 'lucide-react';
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
}: BarAccordionProps) {
  const entries = useMemo(() => Object.entries(groups), [groups]);

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
        const isOpen = openGroups.has(clientId);
        const allSelected = isSupplierAllSelected(clientId);
        const someSelected = items.some(i => selectedIds.has(i.id)) && !allSelected;
        const barCount = items.filter(i => i.type === 'bar').length;
        const lotCount = items.filter(i => i.type === 'lot').length;
        const pesoFinoTotal = items.reduce((s, i) => s + i.pesoFino, 0);

        return (
          <div key={clientId} className="rounded-xl border border-[var(--pm-border)]/30 overflow-hidden">
            {/* ─── Supplier Header ─── */}
            <button
              type="button"
              onClick={() => onToggleSupplier(clientId)}
              className="w-full flex items-center justify-between px-4 py-3 bg-blue-950/30 border-b border-blue-900/50 hover:bg-blue-950/50 active:scale-[0.995] transition-all cursor-pointer"
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
                    <Building2 className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                    <span className="text-xs font-sans font-semibold text-white truncate">
                      {items[0].clientName}
                    </span>
                    <span className="text-[10px] font-mono text-blue-200/60">
                      {items[0].clientRif}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] font-mono text-blue-200/80">
                  {barCount > 0 && `${barCount} barra(s)`}
                  {barCount > 0 && lotCount > 0 && ' · '}
                  {lotCount > 0 && `${lotCount} lote(s)`}
                </span>
                {/* Chevron */}
                {isOpen
                  ? <ChevronUp className="w-4 h-4 text-blue-300" />
                  : <ChevronDown className="w-4 h-4 text-blue-300" />
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
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          const isSelected = selectedIds.has(item.id);
                          return (
                            <tr
                              key={item.id}
                              onClick={onOpenDetail ? () => onOpenDetail(item.id) : () => onToggleItem(item.id)}
                              className={`group transition-all duration-100 cursor-pointer active:scale-[0.99] ${
                                isSelected
                                  ? 'bg-[var(--pm-accent-amber)]/10'
                                  : idx % 2 === 0
                                    ? 'bg-transparent'
                                    : 'bg-[var(--pm-bg-deepest)]/20'
                              } hover:bg-[var(--pm-bg-hover)]/30`}
                            >
                              {/* Checkbox */}
                              <td className="px-4 py-1.5 text-center" onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
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
                                      <GitMerge className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                                      <span className="font-bold text-purple-400">MIXTO</span>
                                      <span className="text-purple-300/80">{formatComposition(item.composition)}</span>
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
