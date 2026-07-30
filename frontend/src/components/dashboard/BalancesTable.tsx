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
      className="hud-card overflow-hidden mt-5"
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[var(--hud-border)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--hud-text-primary)] font-sans">
            Resumen de Balances
          </h3>
          <p className="text-[11px] text-[var(--hud-text-dim)] font-sans mt-0.5">
            Ingresos, recuperación y egresos por cliente.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[var(--hud-text-dim)] font-mono block">BALANCE TOTAL</span>
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
          <Coins className="w-12 h-12 text-gray-500/30 mb-3" />
          <span className="text-sm font-mono text-gray-500/50">No hay datos de clientes</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-[180px_repeat(5,120px)_100px_80px] px-4 py-2.5 border-b border-[var(--hud-border)] text-[9px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--hud-text-muted)]">
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
                className="grid grid-cols-[180px_repeat(5,120px)_100px_80px] px-4 py-2.5 border-b border-[rgba(30,41,59,0.15)] text-[12px] font-mono transition-all duration-100 hover:bg-[var(--hud-bg-hover)] active:scale-[0.98] cursor-pointer"
                style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
              >
                <div className="text-left font-sans font-semibold text-[var(--hud-text-primary)] truncate">
                  {c.name}
                </div>
                <div className="text-right text-[var(--hud-text-dim)]">
                  {fmtG(c.ingresoBruto)}
                </div>
                <div className="text-right text-[var(--hud-accent-gold)]">
                  {fmtG(c.fa)}
                </div>
                <div className="text-right text-[var(--hud-accent-amber)]">
                  {fmtG(c.r)}
                </div>
                <div className="text-right text-[var(--hud-accent-red)]">
                  {fmtG(c.egresos)}
                </div>
                <div className={`text-right font-bold ${c.balance >= 0 ? 'text-[var(--hud-accent-emerald)]' : 'text-[var(--hud-accent-red)]'}`}>
                  {fmtG(Math.abs(c.balance))}
                  {c.balance < 0 ? ' −' : ''}
                </div>
                <div className="text-right text-[var(--hud-accent-red)]">
                  {formatNumber(c.mermaG, 2)}
                </div>
                <div className="text-right text-[var(--hud-accent-red)]">
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
