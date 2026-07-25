'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronUp, ChevronDown, Check, Package } from 'lucide-react';
import { formatNumber } from '@/lib/format';

interface AvailableLot {
  id: string;
  name: string;
  processName: string;
  clientId: string;
  clientName: string;
  clientRif: string;
  availableWeight: number;
  barCount: number;
}

interface AvailableLotsPanelProps {
  lots: AvailableLot[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filteredLots: AvailableLot[];
  groupedFilteredLots: Record<string, AvailableLot[]>;
  openGroups: Set<string>;
  selectedLotIds: Set<string>;
  onToggleLot: (id: string) => void;
  onToggleSupplier: (clientId: string) => void;
  onToggleSupplierLots: (clientId: string) => void;
  isSupplierAllSelected: (clientId: string) => boolean;
  onSetDetailLotId: (id: string | null) => void;
}

export function AvailableLotsPanel({
  lots, searchQuery, onSearchChange, filteredLots, groupedFilteredLots,
  openGroups, selectedLotIds, onToggleLot, onToggleSupplier, onToggleSupplierLots,
  isSupplierAllSelected, onSetDetailLotId,
}: AvailableLotsPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
      className="xl:col-span-3 glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--pm-border)]/20 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--pm-text-dim)]/40" />
          <input type="text" placeholder="Buscar lote, proceso o proveedor..." value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30" />
        </div>
        <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">{filteredLots.length} lotes</span>
      </div>

      {filteredLots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--pm-text-dim)]">
          <Package className="w-10 h-10 text-[var(--pm-accent-gold)]/20 mb-3 animate-pulse" />
          <span className="text-sm font-sans">Sin lotes disponibles</span>
          <p className="text-[10px] font-mono mt-1">Asegúrese de que haya procesos cerrados con recuperación.</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] v2-scroll">
          {Object.entries(groupedFilteredLots).map(([clientId, lots]) => {
            const client = lots[0];
            const supplierTotal = lots.reduce((s, l) => s + l.availableWeight, 0);
            const isOpen = openGroups.has(clientId);
            const allSelected = isSupplierAllSelected(clientId);
            const someSelected = lots.some(l => selectedLotIds.has(l.id));
            return (
              <div key={clientId} className="glass-panel rounded-xl border border-[var(--pm-border)]/30 overflow-hidden">
                {/* Supplier Header */}
                <button type="button" onClick={() => onToggleSupplier(clientId)}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-[var(--pm-bg-tertiary)]/50 hover:bg-[var(--pm-accent-gold)]/8 active:scale-[0.99] transition-all cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    <div onClick={e => { e.stopPropagation(); onToggleSupplierLots(clientId); }}
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
                        <span className="text-xs font-sans font-semibold text-[var(--pm-text-primary)] truncate block">{lots[0].clientName}</span>
                        <span className="text-[8px] font-mono text-[var(--pm-text-dim)]">{lots[0].clientRif}</span>
                      </div>
                      <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">{lots.length} lotes · {formatNumber(supplierTotal, 4)} g Peso Fino</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${selectedLotIds.size > 0 ? 'text-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)]/10' : 'text-[var(--pm-text-dim)] bg-[var(--pm-bg-tertiary)]'}`}>
                      {lots.filter(l => selectedLotIds.has(l.id)).length}/{lots.length}
                    </span>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[var(--pm-text-dim)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--pm-text-dim)]" />}
                  </div>
                </button>

                {/* Lots Table (expandable) */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div className="overflow-x-auto premium-table border-t border-[var(--pm-border)]/20">
                        <table className="w-full text-left text-xs font-sans">
                          <thead>
                            <tr className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">
                              <th className="w-10 text-center py-2.5 px-2 bg-[var(--pm-bg-base)]/50"></th>
                              <th className="py-2.5 bg-[var(--pm-bg-base)]/50">Proceso</th>
                              <th className="py-2.5 bg-[var(--pm-bg-base)]/50">Lote</th>
                              <th className="py-2.5 bg-[var(--pm-bg-base)]/50 text-right">R (g)</th>
                              <th className="py-2.5 bg-[var(--pm-bg-base)]/50 text-center">Barras</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--pm-border)]/20">
                            {lots.map((lot, idx) => (
                              <tr key={lot.id} onClick={() => onSetDetailLotId(lot.id)}
                                className={`group transition-all duration-150 cursor-pointer ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--pm-bg-base)]/20'} hover:bg-[var(--pm-bg-hover)]/40 ${selectedLotIds.has(lot.id) ? 'bg-[var(--pm-accent-gold)]/8' : ''}`}>
                                <td className="py-2.5 px-2 text-center" onClick={e => { e.stopPropagation(); onToggleLot(lot.id); }}>
                                  <input type="checkbox" checked={selectedLotIds.has(lot.id)}
                                    onChange={() => onToggleLot(lot.id)}
                                    className="accent-[var(--pm-accent-gold)] cursor-pointer active:scale-90" />
                                </td>
                                <td className="py-2.5 font-mono text-[var(--pm-text-dim)] text-[11px]">{lot.processName}</td>
                                <td className="py-2.5 font-mono font-bold text-[var(--pm-accent-gold)] tracking-wider text-[11px]">{lot.name}</td>
                                <td className="py-2.5 text-right font-mono text-[var(--pm-text-primary)]">{formatNumber(lot.availableWeight, 4)}</td>
                                <td className="py-2.5 text-center">
                                  <span className="text-[9px] font-mono text-[var(--pm-text-dim)] bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] px-1.5 py-0.5 rounded">{lot.barCount} u</span>
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
