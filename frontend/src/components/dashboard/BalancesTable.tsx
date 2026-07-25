'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Coins } from 'lucide-react';
import { formatNumber } from '@/lib/format';

interface ClientBalance {
  id: string;
  name: string;
  ingresoBruto: number;
  fa: number;
  r: number;
  egresos: number;
  balance: number;
  mermaG: number;
  mermaPct: number;
}

interface BalancesTableProps {
  clientBalances: ClientBalance[];
  totalBalance: number;
  onClientClick: (clientId: string) => void;
}

const fmtG = (val: number) => formatNumber(val, 2);

export function BalancesTable({ clientBalances, totalBalance, onClientClick }: BalancesTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.45 }}
      className="premium-card overflow-hidden mt-5"
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[var(--pm-border)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--pm-text-primary)] font-sans">
            Resumen de Balances
          </h3>
          <p className="text-[11px] text-[var(--pm-text-dim)] font-sans mt-0.5">
            Ingresos, recuperación y egresos por cliente.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[var(--pm-text-dim)] font-mono block">BALANCE TOTAL</span>
          <span
            className={`text-sm font-mono font-bold ${totalBalance >= 0 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}
          >
            {fmtG(Math.abs(totalBalance))}
            {totalBalance < 0 ? ' (negativo)' : ''}
          </span>
        </div>
      </div>

      {clientBalances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--pm-text-dim)]">
          <Coins className="w-10 h-10 text-[var(--pm-accent-gold)]/20 mb-3 animate-pulse" />
          <span className="text-sm font-sans">No hay datos de clientes</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-[180px_repeat(5,120px)_100px_80px] px-6 py-3 border-b border-[var(--pm-border)] text-[10px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)]">
              <div className="text-left">Cliente</div>
              <div className="text-right">Peso Bruto (G)</div>
              <div className="text-right">Peso Fino (G)</div>
              <div className="text-right">R (G)</div>
              <div className="text-right">Egresos (G)</div>
              <div className="text-right">Balance (G)</div>
              <div className="text-right">MERMA (G)</div>
              <div className="text-right">MERMA (%)</div>
            </div>
            {clientBalances.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + idx * 0.04, duration: 0.3 }}
                onClick={() => onClientClick(c.id)}
                className="grid grid-cols-[180px_repeat(5,120px)_100px_80px] px-6 py-3 border-b border-[rgba(30,42,69,0.15)] text-[12px] font-mono transition-all duration-100 hover:bg-white/[0.04] active:scale-[0.98] cursor-pointer"
                style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
              >
                <div className="text-left font-sans font-semibold text-[var(--pm-text-primary)] truncate">
                  {c.name}
                </div>
                <div className="text-right text-[var(--pm-text-dim)]">
                  {fmtG(c.ingresoBruto)}
                </div>
                <div className="text-right text-[var(--pm-accent-gold)]">
                  {fmtG(c.fa)}
                </div>
                <div className="text-right text-[var(--pm-accent-amber)]">
                  {fmtG(c.r)}
                </div>
                <div className="text-right text-[var(--pm-accent-red)]">
                  {fmtG(c.egresos)}
                </div>
                <div className={`text-right font-bold ${c.balance >= 0 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}>
                  {fmtG(Math.abs(c.balance))}
                  {c.balance < 0 ? ' −' : ''}
                </div>
                <div className="text-right text-[var(--pm-accent-red)]">
                  {formatNumber(c.mermaG, 2)}
                </div>
                <div className="text-right text-[var(--pm-accent-rose)]">
                  {formatNumber(c.mermaPct, 1)}%
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
