'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Flame, Warehouse, Inbox, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/format';

interface ProportionItem {
  label: string;
  value: number;
  color: string;
}

interface TrendInfo {
  value: number;
  isPositive: boolean;
}

interface SparkSeries {
  data: number[];
  color: string;
  label: string;
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
  sparks?: SparkSeries[];
  proportion?: ProportionItem[];
  trend?: TrendInfo;
  subValues?: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  }[];
}

function calcTrend(spark: number[]): TrendInfo | null {
  if (spark.length < 4) return null;
  const last = spark[spark.length - 1];
  const prevAvg = spark.slice(0, -1).reduce((s, v) => s + v, 0) / (spark.length - 1);
  if (prevAvg === 0) return null;
  const delta = ((last - prevAvg) / prevAvg) * 100;
  if (delta > 0.1 || delta < -0.1) return { value: Math.abs(delta), isPositive: delta > 0 };
  return null;
}

const KPI_COLORS = [
  { accent: '#EAB308', label: 'PESO FINO' },      // Gold - Oro Recibido
  { accent: '#F59E0B', label: 'PROCESO' },        // Amber - Oro en Proceso
  { accent: '#10B981', label: 'R' },              // Emerald - Oro en Bóveda
  { accent: '#06B6D4', label: 'PR' },             // Sky - Por Refundir
  { accent: '#10B981', label: 'EGRESADO' },       // Emerald - Oro Egresado
];

const KPI_ICONS = [ClipboardList, Flame, Warehouse, Inbox, TrendingDown];

const EMPTY_SPARK = [0.1, 0.4, 0.3, 0.7, 1];

function prepareSpark(data: number[]): number[] {
  if (data.length >= 5) return data;
  if (data.length > 0) return [data[0] * 0.1, data[0] * 0.4, data[0] * 0.3, data[0] * 0.7, data[0]];
  return EMPTY_SPARK;
}

function SparklineArea({ data, color, id }: { data: number[]; color: string; id: string }) {
  const raw = prepareSpark(data);
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

function MultiSparkline({ series, id }: { series: SparkSeries[]; id: string }) {
  const primary = series[0];
  const secondary = series.slice(1);
  const prepared = series.map(s => prepareSpark(s.data));
  const maxLen = Math.max(...prepared.map(p => p.length), 0);
  const chartData = Array.from({ length: maxLen }, (_, i) => {
    const row: Record<string, number> = { i };
    prepared.forEach((p, si) => { row[`v${si}`] = p[i] ?? 0; });
    return row;
  });
  return (
    <div className="w-full h-14 overflow-hidden relative z-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primary.color} stopOpacity={0.35} />
              <stop offset="50%" stopColor={primary.color} stopOpacity={0.1} />
              <stop offset="100%" stopColor={primary.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {secondary.map((s, si) => (
            <Area
              key={si}
              type="monotone"
              dataKey={`v${si + 1}`}
              stroke={s.color}
              strokeWidth={1}
              strokeOpacity={0.9}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="transparent"
              dot={false}
              isAnimationActive={false}
            />
          ))}
          <Area
            type="monotone"
            dataKey="v0"
            stroke={primary.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={`url(#spark-${id})`}
            dot={false}
            activeDot={{
              r: 4,
              stroke: '#fff',
              strokeWidth: 2,
              fill: primary.color,
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

function TrendIndicator({ trend }: { trend: TrendInfo }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono font-bold ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
      <span className="text-[10px] leading-none">{trend.isPositive ? '▲' : '▼'}</span>
      {trend.isPositive ? '+' : ''}{formatNumber(trend.value, 1)}%
      <span className="text-[10px] font-mono font-normal text-gray-500/80">vs semana anterior</span>
    </span>
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
      {kpiData.map((kpi, idx) => {
        const Icon = icons[idx];
        const isEmpty = kpi.value === 0;
        const trend = kpi.trend ?? calcTrend(kpi.spark);
        return (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * idx, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              '--kpi-glow': kpi.accent,
              background: '#0D1117',
              border: '1px solid rgba(255,255,255,0.05)',
            } as React.CSSProperties}
            className="relative overflow-hidden cursor-pointer kpi-card rounded-xl hover:-translate-y-1 active:scale-95 transition-all duration-300 ease-out"
            onClick={() => onCardClick(idx)}
          >
            <div className="relative z-10 p-7">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${kpi.accent}12` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: kpi.accent, opacity: isEmpty ? 0.5 : 1 }} />
                  </div>
                  <span className="text-xs text-slate-400 font-sans">{kpi.label}</span>
                </div>
              </div>

              <div className="flex items-baseline gap-1.5 mb-1.5">
                <span className={`text-3xl xl:text-4xl font-mono font-bold text-slate-100 tracking-tight ${isEmpty ? 'opacity-50' : ''}`}>
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

              {trend && !isEmpty && (
                <div className="mb-3">
                  <TrendIndicator trend={trend} />
                </div>
              )}

              {isEmpty ? (
                <div className="mb-3 h-14 flex items-center justify-center rounded-lg border border-dashed border-[var(--hud-border)]/40">
                  <span className="text-[10px] font-mono text-gray-500/60 tracking-wider">
                    Sin actividad en el rango
                  </span>
                </div>
              ) : kpi.sparks ? (
                <div className="mb-3">
                  {isMounted && <MultiSparkline series={kpi.sparks} id={`kpi-${idx}`} />}
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
                        <span className="text-[10px] font-mono text-slate-400">
                          {sv.label}:
                        </span>
                        <span className="text-[11px] font-mono font-bold text-[var(--hud-text-primary)] tabular-nums">
                          {formatNumber(sv.value, 2)} g
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <KpiSubIcon icon={kpi.subicon} accent={kpi.accent} />
                    <span className="text-[11px] text-slate-400 font-mono truncate">{kpi.sublabel}</span>
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
