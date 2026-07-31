'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList, CartesianGrid,
} from 'recharts';
import { formatNumber } from '@/lib/format';

interface ChartEntry {
  displayName: string;
  balance: number;
  color: string;
  gradientIdx: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartEntry }>;
}

interface ClientBalancesBarChartProps {
  clientBalances: { id: string; name: string; balance: number }[];
  isMounted: boolean;
}

function BarTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div
      className="rounded-xl px-4 py-3 text-[10px] font-mono space-y-1.5 min-w-[180px]"
      style={{
        background: 'var(--hud-bg-elevated)',
        border: '1px solid var(--hud-border)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
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

const formatLabel = (v: number) => `${formatNumber(v, 1)}g`;

export function ClientBalancesBarChart({ clientBalances, isMounted }: ClientBalancesBarChartProps) {
  const chartData = useMemo<ChartEntry[]>(() => {
    return clientBalances
      .slice(0, 8)
      .map((c, idx) => ({
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
      className="bg-transparent border border-[var(--hud-border)] rounded-[20px] overflow-hidden h-full"
    >
      <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-[var(--hud-border)]">
        <BarChart3 className="w-3.5 h-3.5 text-[var(--hud-accent-gold)]" />
        <h3 className="text-[10px] font-bold text-[var(--hud-text-primary)] font-mono tracking-wider uppercase">
          Top Balances
        </h3>
        <span className="text-[8px] font-mono text-[var(--hud-text-muted)] ml-auto">
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
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
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
              <Tooltip content={<BarTooltip />} wrapperStyle={{ outline: 'none' }} />
              <Bar
                dataKey="balance"
                radius={[0, 8, 8, 0]}
                barSize={18}
                activeBar={false}
                isAnimationActive={isMounted}
                animationDuration={1000}
                animationEasing="ease-out"
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
