'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Cell, LabelList, CartesianGrid,
} from 'recharts';
import { formatNumber } from '@/lib/format';

interface ChartEntry {
  id: string;
  displayName: string;
  balance: number;
  color: string;
  gradientIdx: number;
}

interface ClientBalancesBarChartProps {
  clientBalances: { id: string; name: string; balance: number }[];
  isMounted: boolean;
  onBarClick?: (clientId: string) => void;
}

const BALANCE_GRADIENTS: [string, string][] = [
  ['#10B981', '#059669'],
  ['#06B6D4', '#0891B2'],
  ['#EAB308', '#CA8A04'],
  ['#F59E0B', '#D97706'],
  ['#8B5CF6', '#7C3AED'],
  ['#EC4899', '#DB2777'],
  ['#14B8A6', '#0D9488'],
  ['#6366F1', '#4F46E5'],
];

const formatLabel = (v: number) => `${formatNumber(v, 2)} g`;

export function ClientBalancesBarChart({ clientBalances, isMounted, onBarClick }: ClientBalancesBarChartProps) {
  const chartData = useMemo<ChartEntry[]>(() => {
    return clientBalances
      .slice(0, 8)
      .map((c, idx) => ({
        id: c.id,
        displayName: c.name.length > 14 ? `${c.name.slice(0, 12)}…` : c.name,
        balance: c.balance,
        color: c.balance >= 0
          ? BALANCE_GRADIENTS[idx % BALANCE_GRADIENTS.length][0]
          : '#EF4444',
        gradientIdx: c.balance >= 0 ? idx % BALANCE_GRADIENTS.length : 0,
      }))
      .reverse();
  }, [clientBalances]);

  const hasData = chartData.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.30, duration: 0.45 }}
      className="top-balances-chart bg-transparent border border-[var(--hud-border)] rounded-[20px] overflow-hidden h-full"
    >
      <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-[var(--hud-border)]">
        <BarChart3 className="w-3.5 h-3.5 text-[var(--hud-accent-gold)]" />
        <h3 className="text-[11px] font-bold text-[var(--hud-text-primary)] font-mono tracking-wider uppercase">
          Top Balances
        </h3>
        <span className="text-[9px] font-mono text-[var(--hud-text-muted)] ml-auto">
          por cliente
        </span>
      </div>

      {!hasData || !isMounted ? (
        <div className="flex items-center justify-center py-20">
          <span className="text-xs font-mono text-[var(--hud-text-muted)]">Sin datos de balances</span>
        </div>
      ) : (
        <div className="px-3 pt-3 pb-3">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 48, bottom: 0, left: 0 }}>
              <defs>
                {chartData.map((entry) => (
                  <linearGradient key={entry.gradientIdx} id={`bar-grad-${entry.gradientIdx}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={BALANCE_GRADIENTS[entry.gradientIdx][0]} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={BALANCE_GRADIENTS[entry.gradientIdx][1]} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="4 8"
                stroke="rgba(255,255,255,0.03)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: 'var(--hud-text-dim)', fontFamily: 'var(--hud-font-mono)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.04)' }}
                tickLine={false}
                tickFormatter={(v: number) => formatNumber(v, 0)}
                tickCount={5}
              />
              <YAxis
                type="category"
                dataKey="displayName"
                tick={{ fontSize: 10, fill: 'var(--hud-text-dim)', fontFamily: 'var(--hud-font-sans)' }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Bar
                dataKey="balance"
                radius={[0, 8, 8, 0]}
                barSize={18}
                activeBar={false}
                isAnimationActive={isMounted}
                animationDuration={1000}
                animationEasing="ease-out"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={(entry: any) => onBarClick?.(entry.id as string)}
              >
                {chartData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={`url(#bar-grad-${entry.gradientIdx})`}
                    fillOpacity={1}
                  />
                ))}
                <LabelList
                  dataKey="balance"
                  position="insideEnd"
                  offset={8}
                  formatter={formatLabel}
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--hud-font-mono)',
                    fontWeight: 700,
                    fill: 'var(--hud-text-primary)',
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
