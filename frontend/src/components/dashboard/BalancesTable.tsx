'use client';

import React, { useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { Coins } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import type { ClientBalance } from '@/types/api';

interface BalancesTableProps {
  clientBalances: ClientBalance[];
  totalBalance: number;
  onClientClick: (clientId: string) => void;
}

const fmtG = (val: number) => `${formatNumber(val, 2)} g`;

const TH = 'text-right text-[11px] font-sans font-bold tracking-wider uppercase text-[var(--hud-text-muted)] px-4 py-3';
const TH_STICKY = 'sticky left-0 z-10 text-left text-[11px] font-sans font-bold tracking-wider uppercase text-[var(--hud-text-muted)] px-5 py-3';

export function BalancesTable({ clientBalances, totalBalance, onClientClick }: BalancesTableProps) {
  const sorted = useMemo(
    () => [...clientBalances].sort((a, b) => b.balance - a.balance),
    [clientBalances]
  );

  const totals = useMemo(
    () =>
      sorted.reduce(
        (acc, c) => {
          acc.ingresoBruto += c.ingresoBruto;
          acc.fa += c.fa;
          acc.egresos += c.egresos;
          acc.balance += c.balance;
          acc.mermaG += c.mermaG;
          return acc;
        },
        { ingresoBruto: 0, fa: 0, egresos: 0, balance: 0, mermaG: 0 },
      ),
    [sorted],
  );

  const leyTotal = totals.ingresoBruto > 0 ? (totals.fa / totals.ingresoBruto) * 100 : null;

  const handleRowClick = useCallback((e: React.MouseEvent<HTMLTableSectionElement>) => {
    const tr = (e.target as HTMLElement).closest('tr');
    if (tr?.dataset?.clientId) onClientClick(tr.dataset.clientId);
  }, [onClientClick]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.45 }}
      className="hud-card overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[var(--hud-border)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--hud-text-primary)] font-sans">
            Balances
          </h3>
          <p className="text-[11px] text-[var(--hud-text-dim)] font-sans mt-0.5">
            Ciclo completo del oro por cliente.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-[var(--hud-text-muted)] font-mono block uppercase tracking-wider">BALANCE TOTAL</span>
          <span
            className={`text-sm font-mono font-bold ${totalBalance >= 0 ? 'text-[var(--hud-accent-emerald)]' : 'text-[var(--hud-accent-red)]'}`}
          >
            {fmtG(Math.abs(totalBalance))}
            {totalBalance < 0 ? ' (negativo)' : ''}
          </span>
        </div>
      </div>

      {clientBalances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Coins className="w-12 h-12 text-[var(--hud-text-muted)]/30 mb-3" />
          <span className="text-sm font-mono text-[var(--hud-text-muted)]">No hay datos de clientes</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 1200 }}>
            <thead>
              <tr
                className="border-b border-[var(--hud-border)]"
                style={{ background: 'var(--hud-bg-deepest)' }}
              >
                <th className={TH_STICKY} style={{ background: 'var(--hud-bg-deepest)' }}>Cliente</th>
                <th className={TH}>Ingreso Bruto</th>
                <th className={TH}>Peso Fino</th>
                <th className={TH}>Ley Au</th>
                <th className={TH}>Egresos</th>
                <th className={TH}>Balance</th>
                <th className={TH}>Merma</th>
              </tr>
            </thead>
            <tbody onClick={handleRowClick}>
              {sorted.map((c) => (
                <tr
                  key={c.id}
                  data-client-id={c.id}
                  className="balances-row border-b border-white/[0.02] cursor-pointer"
                >
                  <td className="sticky left-0 z-10 text-left text-xs font-sans font-semibold text-[var(--hud-text-primary)] px-5 py-3 truncate max-w-[180px] balances-row-sticky">
                    {c.name}
                  </td>
                  <td className="text-right text-xs font-mono text-[var(--hud-accent-gold)] px-4 py-3">
                    {fmtG(c.ingresoBruto)}
                  </td>
                  <td className="text-right text-xs font-mono text-[var(--hud-text-primary)] px-4 py-3">
                    {fmtG(c.fa)}
                  </td>
                  <td className="text-right text-xs font-mono text-slate-400 px-4 py-3">
                    {formatNumber(c.leyAu, 1)}%
                  </td>
                  <td className="text-right text-xs font-mono text-[var(--hud-accent-red)] px-4 py-3">
                    {fmtG(c.egresos)}
                  </td>
                  <td className={`text-right text-xs font-mono font-bold px-4 py-3 ${c.balance >= 0 ? 'text-[var(--hud-accent-emerald)]' : 'text-[var(--hud-accent-red)]'}`}>
                    {fmtG(Math.abs(c.balance))}
                    {c.balance < 0 ? ' −' : ''}
                  </td>
                  <td className="text-right text-xs font-mono text-[var(--hud-accent-amber)] px-4 py-3">
                    {fmtG(c.mermaG)}
                    <span className="text-[var(--hud-text-muted)] ml-1">({formatNumber(c.mermaPct, 1)}%)</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--hud-border)] bg-[var(--hud-bg-base)] sticky bottom-0">
                <td
                  className="sticky left-0 z-10 text-left text-xs font-sans font-bold uppercase tracking-wider text-[var(--hud-text-primary)] px-5 py-3"
                  style={{ background: 'var(--hud-bg-base)' }}
                >
                  TOTALES
                </td>
                <td className="text-right text-xs font-mono font-bold text-[var(--hud-accent-gold)] px-4 py-3">
                  {fmtG(totals.ingresoBruto)}
                </td>
                <td className="text-right text-xs font-mono font-bold text-[var(--hud-accent-gold)] px-4 py-3">
                  {fmtG(totals.fa)}
                </td>
                <td className="text-right text-xs font-mono font-bold text-[var(--hud-accent-gold)] px-4 py-3">
                  {leyTotal !== null ? `${formatNumber(leyTotal, 2)}%` : '—'}
                </td>
                <td className="text-right text-xs font-mono font-bold text-[var(--hud-accent-gold)] px-4 py-3">
                  {fmtG(totals.egresos)}
                </td>
                <td className={`text-right text-xs font-mono font-bold px-4 py-3 ${totals.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {fmtG(Math.abs(totals.balance))}
                  {totals.balance < 0 ? ' −' : ''}
                </td>
                <td className="text-right text-xs font-mono font-bold text-[var(--hud-accent-gold)] px-4 py-3">
                  {fmtG(totals.mermaG)}
                  <span className="text-[var(--hud-text-muted)] ml-1">(—)</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </motion.div>
  );
}
