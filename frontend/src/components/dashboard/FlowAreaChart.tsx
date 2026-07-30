'use client';

import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { formatNumber } from '@/lib/format';

interface FlowData {
  date: string;
  ingresos: number;
  egresos: number;
}

interface FlowAreaChartProps {
  data: FlowData[];
  isMounted: boolean;
}

function formatTickDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

function FlowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
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
      <p className="text-[9px] text-[var(--hud-text-muted)] uppercase tracking-widest font-bold">
        {new Date(label).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-[var(--hud-text-dim)] capitalize">{entry.dataKey}</span>
          </div>
          <span className="font-semibold text-[11px]" style={{ color: entry.color }}>
            {formatNumber(entry.value, 2)} g
          </span>
        </div>
      ))}
    </div>
  );
}

export function FlowAreaChart({ data, isMounted }: FlowAreaChartProps) {
  const hasData = data.some(d => d.ingresos > 0 || d.egresos > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.45 }}
      className="hud-card overflow-hidden h-full"
    >
      <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-[var(--hud-border)]">
        <TrendingUp className="w-3.5 h-3.5 text-[var(--hud-accent-sky)]" />
        <h3 className="text-[10px] font-bold text-[var(--hud-text-primary)] font-mono tracking-wider uppercase">
          Flujo de Material (30 días)
        </h3>
      </div>

      {!hasData || !isMounted ? (
        <div className="flex items-center justify-center py-20">
          <span className="text-xs font-mono text-[var(--hud-text-muted)]">Sin datos de flujo</span>
        </div>
      ) : (
        <div className="px-3 pt-4 pb-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 10, right: 24, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="grad-sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--hud-accent-sky)" stopOpacity={0.4} />
                  <stop offset="30%" stopColor="var(--hud-accent-sky)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--hud-accent-sky)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--hud-accent-gold)" stopOpacity={0.4} />
                  <stop offset="30%" stopColor="var(--hud-accent-gold)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--hud-accent-gold)" stopOpacity={0} />
                </linearGradient>
                <filter id="glow-sky" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid
                strokeDasharray="4 8"
                stroke="rgba(255,255,255,0.03)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatTickDate}
                tick={{ fontSize: 10, fill: 'var(--hud-text-dim)', fontFamily: 'var(--hud-font-mono)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.04)' }}
                tickLine={false}
                interval="preserveStartEnd"
                tickMargin={8}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--hud-text-dim)', fontFamily: 'var(--hud-font-mono)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
                tickCount={5}
                dy={-4}
              />
              <Tooltip content={<FlowTooltip />} wrapperStyle={{ outline: 'none' }} />
              <Legend
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: 9, fontFamily: 'var(--hud-font-mono)', paddingTop: 12 }}
              />
              <Area
                type="monotone"
                dataKey="ingresos"
                name="Ingresos"
                stroke="var(--hud-accent-sky)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="url(#grad-sky)"
                filter="url(#glow-sky)"
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: '#fff',
                  strokeWidth: 2,
                  fill: 'var(--hud-accent-sky)',
                }}
                isAnimationActive={isMounted}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="egresos"
                name="Egresos"
                stroke="var(--hud-accent-gold)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="url(#grad-gold)"
                filter="url(#glow-gold)"
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: '#fff',
                  strokeWidth: 2,
                  fill: 'var(--hud-accent-gold)',
                }}
                isAnimationActive={isMounted}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
