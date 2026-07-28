'use client';

import React, { useState, Fragment } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight, ChevronDown, X } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { ModalShell } from '@/components/ui/ModalShell';
import type { Process, Lot, Bar, Client } from '@/types/api';

interface ProcessDetailModalProps {
  process: Process;
  lots: Lot[];
  lotBarsMap: Record<string, Bar[]>;
  clients: Client[];
  onClose: () => void;
}

export function ProcessDetailModal({ process, lots, lotBarsMap, clients, onClose }: ProcessDetailModalProps) {
  const [expandedLotId, setExpandedLotId] = useState<string | null>(null);

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      noHeader
      noPadding
      size="lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--pm-border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle2 className="w-4 h-4 text-[var(--pm-accent-emerald)]" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-emerald)] uppercase tracking-wider">Recibo Digital de Fundición</span>
            <h3 className="text-sm font-sans font-semibold text-[var(--pm-text-primary)] mt-0.5">
              {process.name} — {clients.find(c => c.id === process.clientId)?.name || '—'}
            </h3>
          </div>
        </div>
        <button type="button" onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] active:scale-90 transition-all cursor-pointer"
        ><X className="w-4 h-4" /></button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-center">
                  <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Lotes</span>
                  <span className="text-lg font-mono font-bold text-[var(--pm-text-primary)]">{lots.length}</span>
                </div>
                <div className="p-3 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-center">
                  <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Peso Fino</span>
                  <span className="text-sm font-mono font-bold text-[var(--pm-accent-gold)]">
                    {formatNumber(lots.reduce((s, l) => {
                      const lb = lotBarsMap[l.id] || [];
                      return s + lb.reduce((sb, b) => sb + Number(b.fineWeight), 0);
                    }, 0), 2)} g
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-center">
                  <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Recuperado</span>
                  <span className="text-sm font-mono font-bold text-[var(--pm-accent-emerald)]">
                    {formatNumber(lots.reduce((s, l) => s + Number(l.recovered ?? 0), 0), 2)} g
                  </span>
                </div>
              </div>

              {/* Lots table */}
              <div className="overflow-x-auto rounded-xl border border-[var(--pm-border)] v2-scroll">
                <table className="w-full table-fixed border-collapse font-sans text-xs">
                  <thead>
                    <tr className="border-b border-[var(--pm-border)]">
                      <th className="w-[30%] sticky left-0 bg-[var(--pm-bg-primary)] z-10 text-left px-4 py-3 text-[var(--pm-text-dim)] font-semibold uppercase tracking-wider">Lote</th>
                      <th className="w-[17.5%] text-right px-4 py-3 text-[var(--pm-text-dim)] font-semibold uppercase tracking-wider">Peso Fino (g)</th>
                      <th className="w-[17.5%] text-right px-4 py-3 text-[var(--pm-text-dim)] font-semibold uppercase tracking-wider">R (g)</th>
                      <th className="w-[17.5%] text-right px-4 py-3 text-[var(--pm-text-dim)] font-semibold uppercase tracking-wider">DIF (g)</th>
                      <th className="w-[17.5%] text-right px-4 py-3 text-[var(--pm-text-dim)] font-semibold uppercase tracking-wider">% RECUP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lots.map((lot, idx) => {
                      const lb = lotBarsMap[lot.id] || [];
                      const fa = lb.reduce((s, b) => s + Number(b.fineWeight), 0);
                      const r = Number(lot.recovered ?? 0);
                      const dif = fa - r;
                      const pctRecup = fa > 0 ? (r / fa) * 100 : 0;
                      const isExpanded = expandedLotId === lot.id;
                      return (
                        <Fragment key={lot.id}>
                          <tr
                            className={`
                              ${idx % 2 === 1 ? 'bg-[var(--pm-bg-deepest)]/30' : ''}
                              cursor-pointer active:scale-[0.98] transition-all duration-150
                              ${isExpanded ? 'bg-[var(--pm-accent-amber)]/[0.04]' : 'hover:bg-[var(--pm-accent-gold)]/[0.03]'}
                            `}
                            onClick={() => setExpandedLotId(isExpanded ? null : lot.id)}
                          >
                            <td className="sticky left-0 bg-[var(--pm-bg-primary)] font-semibold text-[var(--pm-text-primary)] z-10 text-left px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-[var(--pm-accent-gold)] flex-shrink-0 transition-transform duration-200" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-[var(--pm-text-dim)] flex-shrink-0 transition-transform duration-200" />
                                )}
                                <span>{lot.name}</span>
                                {lot.moldCode && <span className="text-[9px] text-[var(--pm-text-dim)] ml-0.5">({lot.moldCode})</span>}
                              </div>
                            </td>
                            <td className="text-right px-4 py-3 font-mono text-[var(--pm-accent-gold)]">{formatNumber(fa, 2)}</td>
                            <td className="text-right px-4 py-3 font-mono text-[var(--pm-accent-emerald)]">{formatNumber(r, 2)}</td>
                            <td className={`text-right px-4 py-3 font-mono ${dif >= 0 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}>
                              {dif >= 0 ? '+' : ''}{formatNumber(dif, 2)}
                            </td>
                            <td className="text-right px-4 py-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${Math.abs(pctRecup - 100) <= 5 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}>
                                {formatNumber(pctRecup, 2)}%
                              </span>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${lot.id}-bars`}>
                              <td colSpan={5} className="p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                                  className="overflow-hidden"
                                >
                                  <div className="border-l-2 border-[var(--pm-accent-gold)]/30 ml-4 mr-4 mb-3 mt-1 rounded-r-xl bg-black/30 overflow-x-auto">
                                    <table className="w-full table-fixed border-collapse font-sans text-[10px]">
                                      <thead>
                                        <tr className="border-b border-[var(--pm-border)]">
                                          <th className="w-[25%] sticky left-0 bg-[var(--pm-bg-deepest)] z-10 text-left px-4 py-2.5 text-[var(--pm-text-dim)] font-semibold uppercase tracking-wider">Código</th>
                                          <th className="w-[25%] text-right px-4 py-2.5 text-[var(--pm-text-dim)] font-semibold uppercase tracking-wider">Peso Bruto (g)</th>
                                          <th className="w-[25%] text-right px-4 py-2.5 text-[var(--pm-text-dim)] font-semibold uppercase tracking-wider">Ley Au (‰)</th>
                                          <th className="w-[25%] text-right px-4 py-2.5 text-[var(--pm-text-dim)] font-semibold uppercase tracking-wider">Peso Fino (g)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {lb.map((bar, bi) => (
                                          <tr key={bar.id}
                                            className={`${bi % 2 === 1 ? 'bg-black/20' : ''} hover:bg-[var(--pm-accent-gold)]/[0.03] transition-colors`}
                                          >
                                            <td className="sticky left-0 bg-[var(--pm-bg-primary)] font-semibold text-[var(--pm-accent-gold)] z-10 text-left px-4 py-2.5">
                                              {bar.barNumber}
                                            </td>
                                            <td className="text-right px-4 py-2.5 font-mono text-[var(--pm-text-primary)]">{formatNumber(Number(bar.grossWeight), 2)}</td>
                                            <td className="text-right px-4 py-2.5 font-mono text-[var(--pm-text-primary)]">{formatNumber(Number(bar.purity), 2)}</td>
                                            <td className="text-right px-4 py-2.5 font-mono text-[var(--pm-accent-gold)]">{formatNumber(Number(bar.fineWeight), 2)}</td>
                                          </tr>
                                        ))}
                                        {lb.length === 0 && (
                                          <tr>
                                            <td colSpan={4} className="text-center py-4 text-[9px] text-[var(--pm-text-dim)] font-mono italic">
                                              Sin barras asignadas a este lote
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                    {lots.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-8 text-[10px] text-[var(--pm-text-dim)] font-mono italic">Sin lotes registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
    </ModalShell>
  );
}
