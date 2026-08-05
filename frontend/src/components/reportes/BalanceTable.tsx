'use client';

import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Coins, ArrowUpRight } from 'lucide-react';
import { formatWeight } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';

interface BalanceRow {
  id: string;
  name: string;
  fa: number;
  r: number;
  entregado: number;
  balance: number;
  puro: number;
  mixto: number;
}

interface BalanceTableProps {
  clientRows: BalanceRow[];
  totals: { fa: number; r: number; entregado: number; balance: number; puro: number; mixto: number };
  hasActiveFilters: boolean;
}

export function BalanceTable({ clientRows, totals, hasActiveFilters }: BalanceTableProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
      id="report-content"
      className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
      <div className="p-5 border-b border-[var(--pm-border)]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--pm-accent-gold)]" />
          <span className="text-[11px] font-semibold text-[var(--pm-text-primary)] uppercase tracking-wider">
            Balance por Cliente — Peso Bruto
          </span>
        </div>
      </div>

      {clientRows.length === 0 ? (
        <EmptyState
          icon={<Coins className="w-10 h-10 text-[var(--pm-text-dim)]/30 mx-auto mb-3" />}
          title={hasActiveFilters ? 'Sin resultados para los filtros aplicados' : 'No hay transacciones registradas'}
          description="Los balances por cliente aparecerán automáticamente al registrar ingresos."
          className="p-16 text-center"
        />
      ) : (
        <div className="overflow-x-auto premium-table">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[var(--pm-border)]/20 text-[11px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">
                <th className="py-3 px-4 bg-[var(--pm-bg-base)]/50 text-left sticky left-0 z-10 min-w-[180px]">Cliente</th>
                <th className="py-3 px-4 bg-[var(--pm-bg-base)]/50 text-right">Peso Bruto (g)</th>
                <th className="py-3 px-4 bg-[var(--pm-bg-base)]/50 text-right">Puro (g)</th>
                <th className="py-3 px-4 bg-[var(--pm-bg-base)]/50 text-right">Mixto (g)</th>
                <th className="py-3 px-4 bg-[var(--pm-bg-base)]/50 text-right">R (g)</th>
                <th className="py-3 px-4 bg-[var(--pm-bg-base)]/50 text-right">Entregado (g)</th>
                <th className="py-3 px-4 bg-[var(--pm-bg-base)]/50 text-right">Balance (g)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--pm-border)]/20">
              {clientRows.map((row, idx) => {
                const isPos = row.balance >= 0;
                return (
                  <tr key={row.id}
                    className={`group transition-all duration-150
                      ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--pm-bg-base)]/20'}
                      hover:bg-[var(--pm-bg-hover)]/40 hover:shadow-[inset_0_0_20px_rgba(212,175,55,0.03)]`}>
                    <td className="py-3 px-4 font-mono text-[var(--pm-text-primary)] text-[11px] sticky left-0 z-10
                      bg-[var(--pm-bg-primary)] group-hover:bg-[var(--pm-bg-hover)]/40
                      flex items-center gap-2 min-w-[180px]">
                      <Coins className="w-3.5 h-3.5 text-[var(--pm-accent-gold)] shrink-0" />
                      {row.name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[var(--pm-accent-gold)]">
                      {formatWeight(row.fa)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[var(--pm-accent-cyan)]">
                      {formatWeight(row.puro)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[var(--pm-accent-gold)]">
                      {formatWeight(row.mixto)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[var(--pm-accent-amber)]">
                      {formatWeight(row.r)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[var(--pm-text-dim)]">
                      {formatWeight(row.entregado)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center gap-1 font-mono font-bold text-sm ${isPos ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}>
                        <ArrowUpRight className={`w-3 h-3 ${isPos ? '' : 'rotate-180'}`} />
                        {isPos ? '+' : ''}{formatWeight(Math.abs(row.balance))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--pm-accent-gold)]/30 bg-[var(--pm-accent-gold)]/5">
                <td className="py-4 px-4 font-mono text-sm font-bold text-[var(--pm-accent-gold)] sticky left-0 z-10 bg-[var(--pm-bg-primary)]/95">
                  TOTALES
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold text-[var(--pm-accent-gold)] text-sm">
                  {formatWeight(totals.fa)}
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold text-[var(--pm-accent-cyan)] text-sm">
                  {formatWeight(totals.puro)}
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold text-[var(--pm-accent-gold)] text-sm">
                  {formatWeight(totals.mixto)}
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold text-[var(--pm-accent-amber)] text-sm">
                  {formatWeight(totals.r)}
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold text-[var(--pm-text-dim)] text-sm">
                  {formatWeight(totals.entregado)}
                </td>
                <td className="py-4 px-4 text-right">
                  <span className={`inline-flex items-center gap-1 font-mono font-bold text-sm ${totals.balance >= 0 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}>
                    <ArrowUpRight className={`w-3 h-3 ${totals.balance >= 0 ? '' : 'rotate-180'}`} />
                    {totals.balance >= 0 ? '+' : ''}{formatWeight(Math.abs(totals.balance))}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </motion.div>
  );
}
