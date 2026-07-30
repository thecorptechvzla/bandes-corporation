'use client';

import React from 'react';
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
      className="rounded-xl px-3.5 py-2.5 text-[10px] font-mono space-y-1 min-w-[150px]"
      style={{
        background: 'var(--hud-bg-card)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
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
      <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-white/5">
        <Warehouse className="w-3.5 h-3.5 text-[var(--hud-accent-emerald)]" />
        <h3 className="text-[10px] font-bold text-[var(--hud-text-primary)] font-mono tracking-wider uppercase">
          Estado Bóveda
        </h3>
      </div>

      {!hasData || !isMounted ? (
        <div className="flex items-center justify-center py-20">
          <span className="text-xs font-mono text-[var(--hud-text-dim)]/50">Sin datos en bóveda</span>
        </div>
      ) : (
        <div className="relative px-3 pt-4 pb-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={78}
                strokeWidth={0}
                isAnimationActive={isMounted}
              >
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: 24 }}>
            <span className="text-[8px] font-mono text-[var(--hud-text-muted)] uppercase tracking-[0.15em]">
              En Bóveda
            </span>
            <span className="text-lg font-bold font-mono text-[var(--hud-text-primary)] mt-0.5">
              {formatNumber(total, 2)}
            </span>
            <span className="text-[8px] font-mono text-[var(--hud-text-muted)]">gramos</span>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-2">
            {chartData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5 text-[9px] font-mono">
                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className="text-[var(--hud-text-dim)]">{item.name}:</span>
                <span className="font-semibold" style={{ color: item.color }}>
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
