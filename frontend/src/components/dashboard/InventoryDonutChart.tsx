'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Warehouse } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/format';
import { PanelCard } from '@/components/dashboard/PanelCard';

interface InventoryDonutChartProps {
  fundido: number;
  sinFundir: number;
  isMounted: boolean;
}

const DONUT_ACCENT = '#10B981';

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div
      className="px-4 py-3 rounded-xl text-[11px] font-mono space-y-1.5 min-w-[160px] shadow-xl"
      style={{
        background: '#0B0F19',
        border: '1px solid var(--hud-border)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        zIndex: 70,
        position: 'relative',
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
    { name: 'Sin Fundir', value: sinFundir, color: '#0D9488' },
  ];

  return (
    <PanelCard
      accent={DONUT_ACCENT}
      title={
        <>
          <Warehouse className="w-3.5 h-3.5 text-[var(--hud-accent-emerald)]" />
          <h3 className="text-xs font-semibold text-slate-100 font-mono tracking-wider uppercase">
            Estado Bóveda
          </h3>
        </>
      }
    >
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
                  stroke="#0D1117"
                  isAnimationActive={isMounted}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} cursor={false} wrapperStyle={{ outline: 'none', zIndex: 70 }} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-mono text-[var(--hud-text-muted)] uppercase tracking-[0.18em]">
                En Bóveda
              </span>
              <span className="font-bold font-mono text-[var(--hud-text-primary)] mt-1 whitespace-nowrap tabular-nums" style={{ fontSize }}>
                {totalStr}
              </span>
              <span className="text-[10px] font-mono text-[var(--hud-text-muted)] uppercase tracking-wider">g</span>
            </div>
          </div>

          {/* Legend — plain rows */}
          <div className="flex items-center justify-center gap-5 mt-3">
            {chartData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className="text-[10px] font-mono text-[var(--hud-text-dim)] uppercase tracking-wider">
                  {item.name}
                </span>
                <span className="text-[11px] font-mono font-bold" style={{ color: item.color }}>
                  {formatNumber(item.value, 2)} g
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </PanelCard>
  );
}
