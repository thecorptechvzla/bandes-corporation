'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { formatNumber } from '@/lib/format';

interface ClientBalance {
  id: string;
  name: string;
  balance: number;
}

interface ClientBalancesBarChartProps {
  clientBalances: ClientBalance[];
  isMounted: boolean;
}

function BarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 text-[10px] font-mono space-y-1 min-w-[170px]"
      style={{
        background: 'var(--hud-bg-card)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <p className="text-[var(--hud-text-primary)] font-semibold text-[11px]">{entry.displayName}</p>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
        <span className="text-[var(--hud-text-dim)]">Balance:</span>
        <span className="font-semibold" style={{ color: entry.color }}>
          {formatNumber(Math.abs(entry.balance), 2)} g
        </span>
      </div>
    </div>
  );
}

const BALANCE_PALETTE = ['#10B981', '#06B6D4', '#EAB308', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

export function ClientBalancesBarChart({ clientBalances, isMounted }: ClientBalancesBarChartProps) {
  const chartData = useMemo(() => {
    return clientBalances
      .slice(0, 8)
      .map((c, idx) => ({
        displayName: c.name.length > 14 ? `${c.name.slice(0, 12)}…` : c.name,
        balance: c.balance,
        color: c.balance >= 0
          ? BALANCE_PALETTE[idx % BALANCE_PALETTE.length]
          : '#EF4444',
      }))
      .reverse();
  }, [clientBalances]);

  const hasData = chartData.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.30, duration: 0.45 }}
      className="hud-card overflow-hidden h-full"
    >
      <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-white/5">
        <BarChart3 className="w-3.5 h-3.5 text-[var(--hud-accent-gold)]" />
        <h3 className="text-[10px] font-bold text-[var(--hud-text-primary)] font-mono tracking-wider uppercase">
          Top Balances
        </h3>
        <span className="text-[8px] font-mono text-[var(--hud-text-dim)] ml-auto">
          por cliente
        </span>
      </div>

      {!hasData || !isMounted ? (
        <div className="flex items-center justify-center py-20">
          <span className="text-xs font-mono text-[var(--hud-text-dim)]/50">Sin datos de balances</span>
        </div>
      ) : (
        <div className="px-3 pt-3 pb-3">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
              <XAxis
                type="number"
                tick={{ fontSize: 9, fill: 'var(--hud-text-dim)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
              />
              <YAxis
                type="category"
                dataKey="displayName"
                tick={{ fontSize: 9, fill: 'var(--hud-text-dim)' }}
                axisLine={false}
                tickLine={false}
                width={95}
              />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="balance" radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={isMounted}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} fillOpacity={0.85} />
                ))}
                <LabelList
                  dataKey="balance"
                  position="right"
                  formatter={(v: number) => `${formatNumber(v, 1)} g`}
                  style={{ fontSize: 9, fontFamily: 'var(--hud-font-mono)', fontWeight: 600, fill: 'var(--hud-text-dim)' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
