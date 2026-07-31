'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Flame, Warehouse, Inbox, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/format';

interface ProportionItem {
  label: string;
  value: number;
  color: string;
}

interface KpiItem {
  label: string;
  value: number;
  sublabel: string;
  subicon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
  tag: string;
  postfix: string;
  spark: number[];
  sparks?: { data: number[]; color: string; label: string }[];
  proportion?: ProportionItem[];
  subValues?: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  }[];
}

function calcTrend(spark: number[]): { delta: number; direction: 'up' | 'down' | 'flat' } | null {
  if (spark.length < 4) return null;
  const last = spark[spark.length - 1];
  const prevAvg = spark.slice(0, -1).reduce((s, v) => s + v, 0) / (spark.length - 1);
  if (prevAvg === 0) return null;
  const delta = ((last - prevAvg) / prevAvg) * 100;
  return { delta, direction: delta > 0.1 ? 'up' : delta < -0.1 ? 'down' : 'flat' };
}

const KPI_COLORS = [
  { accent: '#EAB308', label: 'PESO FINO' },      // Gold - Oro Recibido
  { accent: '#F59E0B', label: 'PROCESO' },        // Amber - Oro en Proceso
  { accent: '#10B981', label: 'R' },              // Emerald - Oro en Bóveda
  { accent: '#06B6D4', label: 'PR' },             // Sky - Por Refundir
];

const KPI_ICONS = [ClipboardList, Flame, Warehouse, Inbox];

function SparklineArea({ data, color, id }: { data: number[]; color: string; id: string }) {
  const raw = data.length >= 5
    ? data
    : data.length > 0
      ? [data[0] * 0.1, data[0] * 0.4, data[0] * 0.3, data[0] * 0.7, data[0]]
      : [0.1, 0.4, 0.3, 0.7, 1];
  const chartData = raw.map((v, i) => ({ i, v }));
  return (
    <div className="w-full h-14 overflow-hidden relative z-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="50%" stopColor={color} stopOpacity={0.1} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={`url(#spark-${id})`}
            dot={false}
            activeDot={{
              r: 4,
              stroke: '#fff',
              strokeWidth: 2,
              fill: color,
            }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProportionBar({ items }: { items: ProportionItem[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden flex" style={{ background: 'var(--hud-bg-deepest)' }}>
      {items.map(item => (
        <div
          key={item.label}
          className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
          style={{
            width: total > 0 ? `${(item.value / total) * 100}%` : '0%',
            background: item.color,
          }}
        />
      ))}
    </div>
  );
}

interface KpiCardGridProps {
  kpiData: KpiItem[];
  isMounted: boolean;
  onCardClick: (idx: number) => void;
}

export function KpiCardGrid({ kpiData, isMounted, onCardClick }: KpiCardGridProps) {
  const icons = KPI_ICONS;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {kpiData.map((kpi, idx) => {
        const Icon = icons[idx];
        return (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * idx, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ '--kpi-glow': kpi.accent } as React.CSSProperties}
            className="relative overflow-hidden cursor-pointer hud-card kpi-card hover:-translate-y-1 active:scale-95 transition-all duration-300 ease-out"
            onClick={() => onCardClick(idx)}
          >
            <div className="relative z-10 p-7">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${kpi.accent}12` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: kpi.accent }} />
                  </div>
                  <span className="text-[11px] text-slate-400 font-sans">{kpi.label}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const trend = calcTrend(kpi.spark);
                    if (!trend || trend.direction === 'flat') return null;
                    return (
                      <span
                        className={`inline-flex items-center gap-0.5 text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg ${
                          trend.direction === 'up'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-red-400 bg-red-500/10'
                        }`}
                      >
                        {trend.direction === 'up'
                          ? <TrendingUp className="w-2.5 h-2.5" />
                          : <TrendingDown className="w-2.5 h-2.5" />
                        }
                        {Math.abs(trend.delta).toFixed(1)}%
                      </span>
                    );
                  })()}
                  <span
                    className="text-[9px] font-mono font-bold tracking-wider px-3 py-1 rounded-lg"
                    style={{ background: `${kpi.accent}12`, color: kpi.accent, border: `1px solid ${kpi.accent}25` }}
                  >
                    {kpi.tag}
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-3xl xl:text-4xl font-mono font-bold text-slate-100 tracking-tight">
                  {!isMounted
                    ? '0,00'
                    : kpi.postfix === '%'
                      ? `${formatNumber(kpi.value, 1)}`
                      : formatNumber(kpi.value, 2)}
                </span>
                <span className="text-xs text-slate-400 font-mono self-end mb-1">
                  {kpi.postfix || 'g'}
                </span>
              </div>

              {kpi.sparks ? (
                <div className="mb-3 h-16 flex flex-col justify-end gap-1">
                  {kpi.sparks.map((sp, i) => (
                    <div key={i} className="h-6">
                      {isMounted && (
                        <SparklineArea
                          data={sp.data}
                          color={sp.color}
                          id={`kpi-${idx}-${i}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : kpi.proportion ? (
                <div className="mb-3 h-14 flex items-end">
                  <ProportionBar items={kpi.proportion} />
                </div>
              ) : (
                isMounted && <div className="mb-3"><SparklineArea data={kpi.spark} color={kpi.accent} id={`kpi-${idx}`} /></div>
              )}

              <div className="pt-3 border-t border-[var(--hud-border)]">
                {kpi.subValues ? (
                  <div className="flex items-center gap-3">
                    {kpi.subValues.map((sv) => (
                      <div key={sv.label} className="flex items-center gap-1.5">
                        <sv.icon className="w-3 h-3 shrink-0" style={{ color: kpi.accent }} />
                        <span className="text-[9px] font-mono text-slate-400">
                          {sv.label}:
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[var(--hud-text-primary)] tabular-nums">
                          {formatNumber(sv.value, 2)} g
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <KpiSubIcon icon={kpi.subicon} accent={kpi.accent} />
                    <span className="text-[10px] text-slate-400 font-mono truncate">{kpi.sublabel}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function KpiSubIcon({ icon: Icon, accent }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; accent: string }) {
  return <Icon className="w-3 h-3 shrink-0" style={{ color: accent }} />;
}

export { KPI_COLORS };
