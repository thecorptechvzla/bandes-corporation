'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Flame, Warehouse, Inbox } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/format';

interface KpiItem {
  label: string;
  value: number;
  sublabel: string;
  subicon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
  tag: string;
  postfix: string;
  spark: number[];
  subValues?: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  }[];
}

const KPI_COLORS = [
  { accent: '#EAB308', label: 'PESO FINO' },
  { accent: '#D97706', label: 'PROCESO' },
  { accent: '#92400E', label: 'R' },
  { accent: '#78350F', label: 'PR' },
];

const KPI_ICONS = [ClipboardList, Flame, Warehouse, Inbox];

function SparklineArea({ data, color, id }: { data: number[]; color: string; id: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] opacity-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
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
  const colors = KPI_COLORS;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {kpiData.map((kpi, idx) => {
        const Icon = icons[idx];
        return (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * idx, duration: 0.45 }}
            className="premium-card relative overflow-hidden cursor-pointer hover:border-[var(--pm-accent-gold)]/20 hover:shadow-[0_0_24px_var(--pm-accent-gold)/08] active:scale-[0.97] transition-all duration-150"
            onClick={() => onCardClick(idx)}
          >
            <SparklineArea data={kpi.spark} color={kpi.accent} id={`kpi-${idx}`} />

            <div className="relative z-10 p-5">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${kpi.accent}12`, border: `1px solid ${kpi.accent}25` }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: kpi.accent }} />
                </div>
                <span
                  className="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded"
                  style={{ background: `${kpi.accent}10`, color: kpi.accent, border: `1px solid ${kpi.accent}20` }}
                >
                  {kpi.tag}
                </span>
              </div>

              <span className="text-[11px] text-[var(--pm-text-dim)] font-sans block mb-1">{kpi.label}</span>
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-2xl font-mono font-bold text-[var(--pm-text-primary)] tracking-tight">
                  {!isMounted
                    ? '0,00'
                    : kpi.postfix === '%'
                      ? `${formatNumber(kpi.value, 1)}`
                      : formatNumber(kpi.value, 2)}
                </span>
                <span className="text-[11px] text-[var(--pm-text-dim)] font-mono">
                  {kpi.postfix || 'g'}
                </span>
              </div>

              {kpi.subValues ? (
                <div className="flex items-center gap-3 pt-3 border-t border-[var(--pm-border)]">
                  {kpi.subValues.map((sv) => (
                    <div key={sv.label} className="flex items-center gap-1.5">
                      <sv.icon className="w-3 h-3 shrink-0" style={{ color: kpi.accent }} />
                      <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">
                        {sv.label}:
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[var(--pm-text-primary)] tabular-nums">
                        {formatNumber(sv.value, 2)} g
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 pt-3 border-t border-[var(--pm-border)]">
                  <KpiSubIcon icon={kpi.subicon} accent={kpi.accent} />
                  <span className="text-[10px] text-[var(--pm-text-dim)] font-mono truncate">{kpi.sublabel}</span>
                </div>
              )}
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
