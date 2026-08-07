'use client';

import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { formatNumber } from '@/lib/format';
import { PanelCard } from '@/components/dashboard/PanelCard';

interface FlowData {
  date: string;
  ingresos: number;
  egresos: number;
}

interface FlowAreaChartProps {
  data: FlowData[];
  isMounted: boolean;
}

const FLOW_ACCENT = '#38BDF8';

function formatTickDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

function FlowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 text-[11px] font-mono space-y-1.5 min-w-[180px]"
      style={{
        background: 'var(--hud-bg-elevated)',
        border: '1px solid var(--hud-border)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p className="text-[10px] text-[var(--hud-text-muted)] uppercase tracking-wider font-bold">
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
  const [mode, setMode] = useState<'AMBAS' | 'INGRESOS' | 'EGRESOS'>('AMBAS');
  const hasData = data.some(d => d.ingresos > 0 || d.egresos > 0);

  const modes = ['AMBAS', 'INGRESOS', 'EGRESOS'] as const;

  const modeButtons = (
    <div className="flex items-center gap-1">
      {modes.map(m => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider uppercase transition-all active:scale-95 cursor-pointer ${
            mode === m
              ? 'text-sky-400'
              : 'text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)]'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );

  return (
    <PanelCard
      accent={FLOW_ACCENT}
      title={
        <>
          <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
          <h3 className="text-xs font-semibold text-slate-100 font-mono tracking-wider uppercase">
            Flujo de Material
          </h3>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">30 días</span>
        </>
      }
      headerRight={modeButtons}
    >
      {!hasData || !isMounted ? (
        <div className="flex items-center justify-center py-20">
          <span className="text-xs font-mono text-[var(--hud-text-muted)]">Sin datos de flujo</span>
        </div>
      ) : (
        <div className="flex-1 px-3 pt-3 pb-2 min-h-0">
          <ResponsiveContainer width="100%" height="100%" minHeight={240}>
            <AreaChart data={data} margin={{ top: 10, right: 24, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="grad-sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--hud-accent-sky)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--hud-accent-sky)" stopOpacity={0} />
                </linearGradient>
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
                tickFormatter={(v: number) => formatNumber(v, 0)}
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
                hide={mode === 'EGRESOS'}
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
                strokeWidth={1.25}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
                hide={mode === 'INGRESOS'}
                dot={false}
                activeDot={{
                  r: 4,
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
    </PanelCard>
  );
}
