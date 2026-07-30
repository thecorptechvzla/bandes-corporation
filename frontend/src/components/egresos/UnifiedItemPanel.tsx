'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronUp, ChevronDown, Check, Package } from 'lucide-react';
import { formatNumber } from '@/lib/format';

export interface UnifiedItem {
  type: 'lot' | 'bar';
  id: string;
  code: string;
  provider: string;
  clientId: string;
  clientName: string;
  clientRif: string;
  pesoBruto: number | null;
  leyAu: number | null;
  pesoFino: number;
  barCount?: number;
}

interface UnifiedItemPanelProps {
  items: UnifiedItem[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filteredItems: UnifiedItem[];
  groupedItems: Record<string, UnifiedItem[]>;
  openGroups: Set<string>;
  selectedIds: Set<string>;
  onToggleItem: (id: string) => void;
  onToggleSupplier: (clientId: string) => void;
  onToggleSupplierItems: (clientId: string) => void;
  isSupplierAllSelected: (clientId: string) => boolean;
  onSetDetailLotId?: (id: string | null) => void;
}

export function UnifiedItemPanel({
  items, searchQuery, onSearchChange, filteredItems, groupedItems,
  openGroups, selectedIds, onToggleItem, onToggleSupplier, onToggleSupplierItems,
  isSupplierAllSelected, onSetDetailLotId,
}: UnifiedItemPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
      className="xl:col-span-3 glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--pm-border)]/20 flex items-center justify-between gap-3">
        <div className="flex items-center flex-1 max-w-xs bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg overflow-hidden transition-colors focus-within:border-[var(--pm-accent-gold)]">
          <div className="pl-3 flex items-center justify-center">
            <Search className="w-3.5 h-3.5 text-[var(--pm-text-dim)]/40" />
          </div>
          <input type="text" placeholder="Buscar lote, barra o proveedor..." value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent py-2 px-3 outline-none text-xs font-mono text-[var(--pm-text-primary)] placeholder:text-[var(--pm-text-dim)]/30" />
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--pm-text-dim)]">
          <span>{filteredItems.filter(i => i.type === 'lot').length} lotes</span>
          <span className="text-[var(--pm-border)]">·</span>
          <span>{filteredItems.filter(i => i.type === 'bar').length} barras</span>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--pm-text-dim)]">
          <Package className="w-10 h-10 text-[var(--pm-accent-gold)]/20 mb-3 animate-pulse" />
          <span className="text-sm font-sans">Sin ítems disponibles</span>
          <p className="text-[10px] font-mono mt-1">Asegúrese de que haya procesos cerrados o barras en stock.</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] v2-scroll">
          {Object.entries(groupedItems).map(([clientId, groupItems]) => {
            const clientName = groupItems[0].clientName;
            const clientRif = groupItems[0].clientRif;
            const supplierTotal = groupItems.reduce((s, i) => s + i.pesoFino, 0);
            const isOpen = openGroups.has(clientId);
            const allSelected = isSupplierAllSelected(clientId);
            const someSelected = groupItems.some(i => selectedIds.has(i.id));
            const lotCount = groupItems.filter(i => i.type === 'lot').length;
            const barCount = groupItems.filter(i => i.type === 'bar').length;

            return (
              <div key={clientId} className="glass-panel rounded-xl border border-[var(--pm-border)]/30 overflow-hidden">
                {/* Supplier Header */}
                <button type="button" onClick={() => onToggleSupplier(clientId)}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-[var(--pm-bg-tertiary)]/50 hover:bg-[var(--pm-accent-gold)]/8 active:scale-[0.99] transition-all cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    <div onClick={e => { e.stopPropagation(); onToggleSupplierItems(clientId); }}
                      className="flex items-center justify-center w-5 h-5 rounded border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)] hover:border-[var(--pm-accent-gold)] transition-colors cursor-pointer shrink-0"
                      style={{ background: allSelected ? 'rgba(212,175,55,0.15)' : undefined, borderColor: allSelected ? 'rgba(212,175,55,0.4)' : undefined }}>
                      {allSelected ? (
                        <Check className="w-3 h-3 text-[var(--pm-accent-gold)]" strokeWidth={3} />
                      ) : someSelected ? (
                        <div className="w-2 h-2 rounded-sm bg-[var(--pm-accent-gold)]/60" />
                      ) : null}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-sans font-semibold text-[var(--pm-text-primary)] truncate block">{clientName}</span>
                        <span className="text-[8px] font-mono text-[var(--pm-text-dim)]">{clientRif}</span>
                      </div>
                      <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">
                        {lotCount > 0 && `${lotCount} lote(s)`}
                        {lotCount > 0 && barCount > 0 && ' · '}
                        {barCount > 0 && `${barCount} barra(s)`}
                        {' · '}{formatNumber(supplierTotal, 4)} g Peso Fino
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${selectedIds.size > 0 ? 'text-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)]/10' : 'text-[var(--pm-text-dim)] bg-[var(--pm-bg-tertiary)]'}`}>
                      {groupItems.filter(i => selectedIds.has(i.id)).length}/{groupItems.length}
                    </span>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[var(--pm-text-dim)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--pm-text-dim)]" />}
                  </div>
                </button>

                {/* Items Table (expandable) */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div className="overflow-x-auto border-t border-[var(--pm-border)]/20">
                        <table className="w-full table-fixed border-collapse text-xs font-sans">
                          <thead>
                            <tr className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">
                              <th className="w-12 text-center px-4 py-3 bg-[var(--pm-bg-base)]/50"></th>
                              <th className="w-[18%] text-left px-4 py-3 bg-[var(--pm-bg-base)]/50">Tipo</th>
                              <th className="w-[20%] text-left px-4 py-3 bg-[var(--pm-bg-base)]/50">Código</th>
                              <th className="w-[20%] text-right px-4 py-3 font-sans font-normal bg-[var(--pm-bg-base)]/50">Peso Bruto (g)</th>
                              <th className="w-[20%] text-right px-4 py-3 font-sans font-normal bg-[var(--pm-bg-base)]/50">Ley Au (‰)</th>
                              <th className="w-[22%] text-right px-4 py-3 font-sans font-normal bg-[var(--pm-bg-base)]/50">Peso Fino (g)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--pm-border)]/20">
                            {groupItems.map((item, idx) => (
                              <tr key={item.id}
                                onClick={() => item.type === 'lot' && onSetDetailLotId ? onSetDetailLotId(item.id) : undefined}
                                className={`group transition-all duration-150 ${item.type === 'lot' ? 'cursor-pointer' : ''} ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--pm-bg-base)]/20'} hover:bg-[var(--pm-bg-hover)]/40 ${selectedIds.has(item.id) ? 'bg-[var(--pm-accent-gold)]/8' : ''}`}>
                                <td className="px-4 py-3 text-center" onClick={e => { e.stopPropagation(); onToggleItem(item.id); }}>
                                  <input type="checkbox" checked={selectedIds.has(item.id)}
                                    readOnly
                                    className="accent-[var(--pm-accent-gold)] cursor-pointer active:scale-90" />
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                                    item.type === 'lot'
                                      ? 'text-[var(--pm-accent-amber)] bg-[var(--pm-accent-amber)]/10 border-[var(--pm-accent-amber)]/25'
                                      : 'text-[var(--pm-accent-teal)] bg-[var(--pm-accent-teal)]/10 border-[var(--pm-accent-teal)]/25' 
                                  }`}>
                                    {item.type === 'lot' ? 'REFUNDIDA' : 'SIN REFUNDIR'}
                                  </span>
                                </td>
                                <td className="text-left px-4 py-3 font-mono font-bold text-[var(--pm-accent-gold)] tracking-wider text-[11px]">{item.code}</td>
                                <td className="text-right px-4 py-3 font-mono text-[var(--pm-text-primary)] text-[11px]">
                                  {item.pesoBruto !== null ? formatNumber(item.pesoBruto, 2) : '—'}
                                </td>
                                <td className="text-right px-4 py-3 font-mono text-[var(--pm-text-primary)] text-[11px]">
                                  {item.leyAu !== null ? formatNumber(Number(item.leyAu), 2) : '—'}
                                </td>
                                <td className="text-right px-4 py-3 font-mono text-[var(--pm-text-primary)] text-[11px]">
                                  {formatNumber(item.pesoFino, 2)}
                                </td>
                              </tr>
                            ))}
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
      )}
    </motion.div>
  );
}
