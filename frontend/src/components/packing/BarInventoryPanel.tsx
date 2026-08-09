'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronUp, ChevronDown, Trash2, Package } from 'lucide-react';
import { formatNumber, formatLey } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Bar, Client } from '@/types/api';

const PAGE_SIZE = 10;

interface BarInventoryPanelProps {
  clients: Client[];
  barsByClient: Record<string, Bar[]>;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  totalBars: number;
  openAccordions: Record<string, boolean>;
  accordionPages: Record<string, number>;
  packingStatusMap: Record<string, string>;
  onToggleAccordion: (id: string) => void;
  onSetPage: (clientId: string, page: number) => void;
  onSetEvidenceBarId: (id: string | null) => void;
  onSetConfirmDeleteId: (id: string) => void;
}

export function BarInventoryPanel({
  clients, barsByClient, searchQuery, onSearchChange, totalBars,
  openAccordions, accordionPages, packingStatusMap,
  onToggleAccordion, onSetPage, onSetEvidenceBarId, onSetConfirmDeleteId,
}: BarInventoryPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
      className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--pm-border)]/20">
        <div className="flex items-center flex-1 bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg overflow-hidden transition-colors focus-within:border-[var(--pm-accent-gold)]">
          <div className="pl-3 flex items-center justify-center">
            <Search className="w-3.5 h-3.5 text-[var(--pm-text-dim)]/40" />
          </div>
          <input type="text" placeholder="Buscar barra por código..." value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent py-2 px-3 outline-none text-xs font-mono text-[var(--pm-text-primary)] placeholder:text-[var(--pm-text-dim)]/30" />
        </div>
        <span className="text-[11px] font-mono text-[var(--pm-text-dim)] whitespace-nowrap">{totalBars} barras</span>
      </div>

      <div className="divide-y divide-[var(--pm-border)]/20 overflow-y-auto max-h-[calc(100vh-280px)] v2-scroll">
        {clients.length === 0 ? (
          <EmptyState
            icon={<Package className="w-10 h-10 text-[var(--pm-accent-gold)]/20 mb-3 animate-pulse" />}
            title="Sin proveedores registrados"
          />
        ) : (
          clients.map(client => {
            const clientBars = barsByClient[client.id] || [];
            const isOpen = openAccordions[client.id] ?? false;
            const barCount = clientBars.length;
            const clientFA = clientBars.reduce((s, b) => s + Number(b.fineWeight), 0);
            const currentPage = accordionPages[client.id] || 0;
            const totalPages = Math.ceil(barCount / PAGE_SIZE) || 1;
            const pageBars = clientBars.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

            return (
              <div key={client.id}>
                <button type="button" onClick={() => onToggleAccordion(client.id)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[var(--pm-bg-tertiary)]/50 active:scale-[0.99] transition-all cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[var(--pm-accent-gold)]" /> : <ChevronUp className="w-3.5 h-3.5 shrink-0 text-[var(--pm-text-dim)]" />}
                    <div className="text-left min-w-0">
                      <span className="text-xs font-sans font-semibold text-[var(--pm-text-primary)] truncate block">{client.name}</span>
                      <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">{barCount} barras · FA: {formatNumber(clientFA, 2)} g</span>
                    </div>
                  </div>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${barCount > 0 ? 'text-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)]/10' : 'text-[var(--pm-text-dim)] bg-[var(--pm-bg-tertiary)]'}`}>
                    {barCount} uds
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      {barCount === 0 ? (
                        <div className="px-5 pb-4 text-[11px] font-mono text-[var(--pm-text-dim)]/70 italic">Sin barras registradas</div>
                      ) : (
                        <div className="px-0 pb-2">
                          <table className="premium-table w-full">
                            <thead>
                              <tr>
                                <th className="text-center">Código</th>
                                <th className="text-right">Peso Bruto (g)</th>
                                <th className="text-right">Ley Au (‰)</th>
                                <th className="text-right">Peso Fino (g)</th>
                                <th className="text-center">Estado</th>
                                <th className="text-center">Acción</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageBars.map((bar, idx) => {
                                const isPackingValidated = bar.packingId ? packingStatusMap[bar.packingId] === 'VALIDATED' : false;
                                return (
                                <motion.tr key={bar.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.02, duration: 0.15 }}
                                  onClick={() => { if (isPackingValidated) onSetEvidenceBarId(bar.id); }}
                                  className={`${idx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--pm-bg-deepest)]/30'} transition-all duration-150 ${isPackingValidated ? 'cursor-pointer hover:bg-white/[0.04] active:scale-[0.98]' : 'cursor-default'}`}>
                                  <td className="px-4 py-3 text-center font-mono font-bold text-[var(--pm-accent-gold)] tracking-wider text-[11px]">{bar.barNumber}</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-200">{formatNumber(Number(bar.grossWeight), 2)}</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-200">{bar.purity != null ? formatLey(Number(bar.purity)) : '—'}</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium text-slate-200">{formatNumber(Number(bar.fineWeight), 2)}</td>
                                  <td className="text-center">
                                    <StatusBadge status={bar.status} size="sm" />
                                  </td>
                                  <td className="text-center">
                                    <button type="button" onClick={() => onSetConfirmDeleteId(bar.id)}
                                      disabled={bar.status === 'EXITED'}
                                      className={`p-1 rounded transition-all ${bar.status !== 'EXITED' ? 'text-[var(--pm-text-dim)] hover:text-[var(--pm-accent-red)] hover:bg-[var(--pm-accent-red)]/10 active:scale-90 cursor-pointer' : 'opacity-20 cursor-not-allowed'}`}
                                      title="Eliminar barra"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </td>
                                </motion.tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-2 border-t border-[var(--pm-border)]/20">
                              <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">Pág. {currentPage + 1} de {totalPages}</span>
                              <div className="flex gap-1">
                                <button type="button" onClick={() => onSetPage(client.id, Math.max(0, currentPage - 1))}
                                  disabled={currentPage === 0}
                                  className="px-2.5 py-1 rounded text-[10px] font-mono border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] transition-all disabled:opacity-30 active:scale-95 cursor-pointer">Anterior</button>
                                <button type="button" onClick={() => onSetPage(client.id, Math.min(totalPages - 1, currentPage + 1))}
                                  disabled={currentPage >= totalPages - 1}
                                  className="px-2.5 py-1 rounded text-[10px] font-mono border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] transition-all disabled:opacity-30 active:scale-95 cursor-pointer">Siguiente</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
