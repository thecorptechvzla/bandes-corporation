'use client';

import React, { useCallback, useMemo } from 'react';
import { Coins } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import type { ClientBalance } from '@/types/api';
import { PanelCard } from '@/components/dashboard/PanelCard';

interface BalancesTableProps {
  clientBalances: ClientBalance[];
  totalBalance: number;
  onClientClick: (clientId: string) => void;
}

const fmtG = (val: number) => `${formatNumber(val, 2)} g`;

const TH = 'text-right text-xs font-semibold tracking-wider uppercase text-slate-500 px-4 py-3 font-sans';
const TH_STICKY = 'sticky left-0 z-10 text-left text-xs font-semibold tracking-wider uppercase text-slate-500 px-5 py-3 font-sans';

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
          acc.egresoBI += c.egresoBI;
          acc.egresoBR += c.egresoBR;
          acc.balance += c.balance;
          acc.mermaG += c.mermaG;
          return acc;
        },
        { ingresoBruto: 0, fa: 0, egresos: 0, egresoBI: 0, egresoBR: 0, balance: 0, mermaG: 0 },
      ),
    [sorted],
  );

  const leyTotal = totals.ingresoBruto > 0 ? (totals.fa / totals.ingresoBruto) * 100 : null;
  const mermaTotalPct = totals.egresoBI > 0 ? (totals.mermaG / totals.egresoBI) * 100 : null;

  const handleRowClick = useCallback((e: React.MouseEvent<HTMLTableSectionElement>) => {
    const tr = (e.target as HTMLElement).closest('tr');
    if (tr?.dataset?.clientId) onClientClick(tr.dataset.clientId);
  }, [onClientClick]);

  return (
    <PanelCard
      accent="#10B981"
      delay={0.35}
      title={
        <>
          <div>
            <h3 className="text-xs font-semibold text-slate-100 font-mono tracking-wider uppercase">
              Balances
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Ciclo completo del oro por Provedor.
            </p>
          </div>
        </>
      }
      headerRight={
        <div className="text-right">
          <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">BALANCE TOTAL</span>
          <span
            className={`text-sm font-mono font-bold ${totalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            {fmtG(Math.abs(totalBalance))}
            {totalBalance < 0 ? ' (negativo)' : ''}
          </span>
        </div>
      }
    >
      {clientBalances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Coins className="w-12 h-12 text-slate-600/30 mb-3" />
          <span className="text-sm font-mono text-slate-500">No hay datos de clientes</span>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="w-full border-collapse" style={{ minWidth: 1350 }}>
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className={TH_STICKY} style={{ background: 'transparent' }}>Proveedor</th>
                <th className={TH}>Ingreso Bruto</th>
                <th className={TH}>Peso Fino</th>
                <th className={TH}>Ley Au (‰)</th>
                <th className={TH}>Egresos BI</th>
                <th className={TH}>Egresos BR</th>
                <th className={TH}>Balance</th>
                <th className={TH}>Merma</th>
              </tr>
            </thead>
            <tbody onClick={handleRowClick}>
              {sorted.map((c) => (
                <tr
                  key={c.id}
                  data-client-id={c.id}
                  className="balances-row border-b border-slate-800/20 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="sticky left-0 z-10 text-left text-xs font-sans font-semibold text-slate-100 px-5 py-3 truncate max-w-[180px] balances-row-sticky">
                    {c.name}
                  </td>
                  <td className="text-right text-xs font-mono text-amber-400 px-4 py-3">
                    {fmtG(c.ingresoBruto)}
                  </td>
                  <td className="text-right text-xs font-mono text-slate-200 px-4 py-3">
                    {fmtG(c.fa)}
                  </td>
                  <td className="text-right text-xs font-mono text-slate-400 px-4 py-3">
                    {formatNumber(c.leyAu, 2)}‰
                  </td>
                  <td className="text-right text-xs font-mono text-rose-400 px-4 py-3">
                    {fmtG(c.egresoBI)}
                  </td>
                  <td className="text-right text-xs font-mono text-rose-300 px-4 py-3">
                    {fmtG(c.egresoBR)}
                  </td>
                  <td className={`text-right text-xs font-mono font-bold px-4 py-3 ${c.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {fmtG(Math.abs(c.balance))}
                    {c.balance < 0 ? ' −' : ''}
                  </td>
                  <td className="text-right text-xs font-mono text-amber-500 px-4 py-3">
                    {fmtG(c.mermaG)}
                    <span className="text-slate-500 ml-1">({formatNumber(c.mermaPct, 1)}%)</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-800/60 bg-[#15171F] sticky bottom-0">
                <td
                  className="sticky left-0 z-10 text-left text-xs font-sans font-bold uppercase tracking-wider text-slate-100 px-5 py-3"
                  style={{ background: '#15171F' }}
                >
                  TOTALES
                </td>
                <td className="text-right text-xs font-mono font-bold text-amber-400 px-4 py-3">
                  {fmtG(totals.ingresoBruto)}
                </td>
                <td className="text-right text-xs font-mono font-bold text-amber-400 px-4 py-3">
                  {fmtG(totals.fa)}
                </td>
                <td className="text-right text-xs font-mono font-bold text-amber-400 px-4 py-3">
                  {leyTotal !== null ? `${formatNumber(leyTotal, 2)}%` : '—'}
                </td>
                <td className="text-right text-xs font-mono font-bold text-amber-400 px-4 py-3">
                  {fmtG(totals.egresoBI)}
                </td>
                <td className="text-right text-xs font-mono font-bold text-amber-400 px-4 py-3">
                  {fmtG(totals.egresoBR)}
                </td>
                <td className={`text-right text-xs font-mono font-bold px-4 py-3 ${totals.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {fmtG(Math.abs(totals.balance))}
                  {totals.balance < 0 ? ' −' : ''}
                </td>
                <td className="text-right text-xs font-mono font-bold text-amber-400 px-4 py-3">
                  {fmtG(totals.mermaG)}
                  <span className="text-slate-500 ml-1">
                    {mermaTotalPct !== null ? `(${formatNumber(mermaTotalPct, 1)}%)` : '(—)'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </PanelCard>
  );
}
