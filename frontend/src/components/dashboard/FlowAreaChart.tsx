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
        background: 'var(--hud-bg-card)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
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
      <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-white/5">
        <TrendingUp className="w-3.5 h-3.5 text-[var(--hud-accent-sky)]" />
        <h3 className="text-[10px] font-bold text-[var(--hud-text-primary)] font-mono tracking-wider uppercase">
          Flujo de Material (30 días)
        </h3>
      </div>

      {!hasData || !isMounted ? (
        <div className="flex items-center justify-center py-20">
          <span className="text-xs font-mono text-[var(--hud-text-dim)]/50">Sin datos de flujo</span>
        </div>
      ) : (
        <div className="px-3 pt-4 pb-2">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 5, right: 16, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="grad-sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--hud-accent-sky)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--hud-accent-sky)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--hud-accent-gold)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--hud-accent-gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatTickDate}
                tick={{ fontSize: 9, fill: 'var(--hud-text-dim)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'var(--hud-text-dim)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
              />
              <Tooltip content={<FlowTooltip />} />
              <Legend
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: 9, fontFamily: 'var(--hud-font-mono)', paddingTop: 8 }}
              />
              <Area
                type="monotone"
                dataKey="ingresos"
                name="Ingresos"
                stroke="var(--hud-accent-sky)"
                strokeWidth={2}
                fill="url(#grad-sky)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={isMounted}
              />
              <Area
                type="monotone"
                dataKey="egresos"
                name="Egresos"
                stroke="var(--hud-accent-gold)"
                strokeWidth={2}
                fill="url(#grad-gold)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                isAnimationActive={isMounted}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
