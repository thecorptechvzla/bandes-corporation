'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Warehouse } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/format';

interface InventoryDonutChartProps {
  fundido: number;
  sinFundir: number;
  isMounted: boolean;
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div
      className="rounded-xl px-4 py-3 text-[10px] font-mono space-y-1.5 min-w-[160px]"
      style={{
        background: 'var(--hud-bg-elevated)',
        border: '1px solid var(--hud-border)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ background: entry.payload.color }} />
        <span className="text-[var(--hud-text-dim)]">{entry.name}</span>
      </div>
      <span className="font-semibold text-[12px]" style={{ color: entry.payload.color }}>
        {formatNumber(entry.value, 2)} g
      </span>
    </div>
  );
}

export function InventoryDonutChart({ fundido, sinFundir, isMounted }: InventoryDonutChartProps) {
  const total = fundido + sinFundir;
  const hasData = total > 0;

  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(380);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setChartWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const h = Math.round(Math.max(220, chartWidth * 0.45));
  const outerRadius = Math.round(h * 0.42);
  const innerRadius = Math.round(outerRadius * 0.74);
  const totalStr = formatNumber(total, 2);
  const fitFont = Math.floor(((innerRadius * 2) * 0.94) / (0.6 * totalStr.length));
  const fontSize = Math.min(44, Math.max(16, fitFont));

  const chartData = [
    { name: 'Fundido', value: fundido, color: '#10B981' },
    { name: 'Sin Fundir', value: sinFundir, color: '#06B6D4' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.45 }}
      className="hud-card overflow-hidden h-full"
    >
      <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-[var(--hud-border)]">
        <Warehouse className="w-3.5 h-3.5 text-[var(--hud-accent-emerald)]" />
        <h3 className="text-[10px] font-bold text-[var(--hud-text-primary)] font-mono tracking-wider uppercase">
          Estado Bóveda
        </h3>
      </div>

      {!hasData || !isMounted ? (
        <div className="flex items-center justify-center py-20">
          <span className="text-xs font-mono text-[var(--hud-text-muted)]">Sin datos en bóveda</span>
        </div>
      ) : (
        <div className="px-3 pt-4 pb-4">
          <div className="relative" ref={chartRef}>
            <ResponsiveContainer width="100%" height={h}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  strokeWidth={2}
                  stroke="var(--hud-bg-deepest)"
                  isAnimationActive={isMounted}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} wrapperStyle={{ outline: 'none' }} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] font-mono text-[var(--hud-text-muted)] uppercase tracking-[0.18em]">
                En Bóveda
              </span>
              <span className="font-bold font-mono text-[var(--hud-text-primary)] mt-1 whitespace-nowrap tabular-nums" style={{ fontSize }}>
                {totalStr}
              </span>
              <span className="text-[9px] font-mono text-[var(--hud-text-muted)] uppercase tracking-wider">g</span>
            </div>
          </div>

          {/* Legend — pills */}
          <div className="flex items-center justify-center gap-3 mt-3">
            {chartData.map(item => (
              <div
                key={item.name}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: 'var(--hud-bg-deepest)', border: '1px solid var(--hud-border)' }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                <span className="text-[9px] font-mono text-[var(--hud-text-dim)]">{item.name}</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: item.color }}>
                  {formatNumber(item.value, 2)} g
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
