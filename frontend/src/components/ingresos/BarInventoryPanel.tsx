'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, ChevronUp, Package, Trash2 } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Bar } from '@/types/api';

const PAGE_SIZE = 10;

interface BarInventoryPanelProps {
  clients: { id: string; name: string }[];
  barsByClient: Record<string, Bar[]>;
  totalBars: number;
  onDeleteBar: (id: string) => void;
}

export function BarInventoryPanel({ clients, barsByClient, totalBars, onDeleteBar }: BarInventoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [accordionPages, setAccordionPages] = useState<Record<string, number>>({});

  useEffect(() => {
    if (clients.length > 0) {
      const acc: Record<string, boolean> = {};
      clients.forEach(c => { acc[c.id] = true; });
      setOpenAccordions(prev => {
        const hasAll = clients.every(c => prev[c.id] !== undefined);
        return hasAll ? prev : { ...prev, ...acc };
      });
    }
  }, [clients]);

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const setAccordionPage = (clientId: string, page: number) => {
    setAccordionPages(prev => ({ ...prev, [clientId]: page }));
  };

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
      className="premium-card overflow-hidden"
    >
      {/* Search */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--pm-border)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--pm-text-dim)]/40" />
          <input type="text" placeholder="Buscar barra por código..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30"
          />
        </div>
        <span className="text-[10px] font-mono text-[var(--pm-text-dim)] whitespace-nowrap">{totalBars} barras</span>
      </div>

      {/* Accordion list */}
      <div className="divide-y divide-[var(--pm-border)] overflow-y-auto max-h-[calc(100vh-280px)] v2-scroll">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--pm-text-dim)]">
            <Package className="w-10 h-10 text-[var(--pm-accent-gold)]/20 mb-3 animate-pulse" />
            <span className="text-sm font-sans">Sin proveedores registrados</span>
          </div>
        ) : (
          clients.map(client => {
            const clientBars = barsByClient[client.id] || [];
            const isOpen = openAccordions[client.id] ?? true;
            const barCount = clientBars.length;
            const clientFA = clientBars.reduce((s, b) => s + Number(b.fineWeight), 0);
            const currentPage = accordionPages[client.id] || 0;
            const totalPages = Math.ceil(barCount / PAGE_SIZE) || 1;
            const pageBars = clientBars.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

            return (
              <div key={client.id}>
                {/* Accordion header */}
                <button type="button" onClick={() => toggleAccordion(client.id)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[var(--pm-bg-tertiary)]/50 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[var(--pm-accent-gold)]" /> : <ChevronUp className="w-3.5 h-3.5 shrink-0 text-[var(--pm-text-dim)]" />}
                    <div className="text-left min-w-0">
                      <span className="text-xs font-sans font-semibold text-[var(--pm-text-primary)] truncate block">{client.name}</span>
                      <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">{barCount} barras · FA: {formatNumber(clientFA, 2)} g</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${barCount > 0 ? 'text-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)]/10' : 'text-[var(--pm-text-dim)] bg-[var(--pm-bg-tertiary)]'}`}>
                    {barCount} uds
                  </span>
                </button>

                {/* Accordion content */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      {barCount === 0 ? (
                        <div className="px-5 pb-4 text-[10px] font-mono text-[var(--pm-text-dim)]/50 italic">Sin barras registradas</div>
                      ) : (
                        <div className="px-0 pb-2">
                          <table className="premium-table w-full">
                            <thead>
                              <tr>
                                <th className="text-center">Código</th>
                                <th className="text-right">Peso Bruto</th>
                                <th className="text-right">Peso Fino</th>
                                <th className="text-right">Estado</th>
                                <th className="text-center">Acción</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageBars.map((bar, idx) => (
                                <motion.tr key={bar.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.02, duration: 0.15 }}
                                  className="odd:bg-[var(--pm-bg-deepest)]/30 hover:bg-[var(--pm-bg-tertiary)]/40 transition-all duration-150"
                                >
                                  <td className="text-center font-mono font-bold text-[var(--pm-accent-gold)] tracking-wider text-[11px]">{bar.barNumber}</td>
                                  <td className="text-right font-mono text-[var(--pm-text-primary)]">{formatNumber(Number(bar.grossWeight), 2)}</td>
                                  <td className="text-right font-mono text-[var(--pm-text-primary)]">{formatNumber(Number(bar.fineWeight), 4)}</td>
                                  <td className="text-center">
                                    <StatusBadge status={bar.status} size="sm" />
                                  </td>
                                  <td className="text-center">
                                    <button type="button" onClick={() => onDeleteBar(bar.id)}
                                      disabled={bar.status !== 'IN_STOCK'}
                                      className={`p-1 rounded transition-all ${bar.status === 'IN_STOCK' ? 'text-[var(--pm-text-dim)] hover:text-[var(--pm-accent-red)] hover:bg-[var(--pm-accent-red)]/10 active:scale-90 cursor-pointer' : 'opacity-20 cursor-not-allowed'}`}
                                      title="Eliminar barra"
                                    ><Trash2 className="w-3.5 h-3.5" /></button>
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Pagination */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-2 border-t border-[var(--pm-border)]">
                              <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">
                                Pág. {currentPage + 1} de {totalPages}
                              </span>
                              <div className="flex gap-1">
                                <button type="button" onClick={() => setAccordionPage(client.id, Math.max(0, currentPage - 1))}
                                  disabled={currentPage === 0}
                                  className="px-2.5 py-1 rounded text-[9px] font-mono border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] transition-all disabled:opacity-30 active:scale-95 cursor-pointer"
                                >Anterior</button>
                                <button type="button" onClick={() => setAccordionPage(client.id, Math.min(totalPages - 1, currentPage + 1))}
                                  disabled={currentPage >= totalPages - 1}
                                  className="px-2.5 py-1 rounded text-[9px] font-mono border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] transition-all disabled:opacity-30 active:scale-95 cursor-pointer"
                                >Siguiente</button>
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
