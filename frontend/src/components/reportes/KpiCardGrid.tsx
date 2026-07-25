'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ArrowDownLeft, Flame, Warehouse, Scale } from 'lucide-react';
import { formatWeight, formatNumber } from '@/lib/format';

function buildSparklineData(bars: { createdAt: string; fineWeight: number }[]): { date: string; value: number }[] {
  const map = new Map<string, number>();
  bars.forEach(b => {
    const day = b.createdAt.slice(0, 10);
    map.set(day, (map.get(day) || 0) + Number(b.fineWeight));
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, value]) => ({ date, value: Math.round(value * 100) / 100 }));
}

function Sparkline({ data, color }: { data: { date: string; value: number }[]; color: string }) {
  if (data.length < 2) return null;
  return (
    <div className="w-full h-12">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5}
            fill={`url(#grad-${color.replace('#', '')})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface KpiItem {
  label: string;
  sublabel: string;
  value: string;
  unit: string;
  icon: typeof ArrowDownLeft;
  accent: string;
  sparklineData: { date: string; value: number }[];
  color: string;
  delay: number;
}

function KpiCard({ label, sublabel, value, unit, icon: Icon, accent, sparklineData, color, delay }: KpiItem) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`glass-panel rounded-2xl border border-[var(--pm-border)]/40 p-5 space-y-3
        transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] ${accent}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg border shrink-0 ${accent.replace('hover:', '').replace('/30', '/15')}`}>
            <Icon className={`w-4 h-4 ${accent.replace('hover:border-', 'text-').replace('/30', '-400')}`} />
          </div>
          <div>
            <p className="text-[9px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">{label}</p>
            <p className="text-[10px] font-mono text-[var(--pm-text-dim)]/50">{sublabel}</p>
          </div>
        </div>
      </div>
      <div>
        <span className="text-2xl font-mono font-bold text-[var(--pm-text-primary)]">{value}</span>
        <span className="text-[10px] font-mono text-[var(--pm-text-dim)] ml-1">{unit}</span>
      </div>
      <Sparkline data={sparklineData} color={color} />
    </motion.div>
  );
}

interface KpiCardGridProps {
  bars: { createdAt: string; fineWeight: number }[];
  filteredBars: { createdAt: string; fineWeight: number }[];
  oroRecibido: { fineWeight: number; barCount: number };
  oroFundido: { totalRecovered: number; lotCount: number; eficiencia: number };
  oroEnEspera: { fineWeight: number };
  totals: { balance: number };
}

export function KpiCardGrid({
  bars, filteredBars, oroRecibido, oroFundido, oroEnEspera, totals,
}: KpiCardGridProps) {
  const oroRecibidoSpark = buildSparklineData(bars.map(b => ({ createdAt: b.createdAt, fineWeight: Number(b.fineWeight) })));
  const filteredSpark = buildSparklineData(filteredBars.map(b => ({ createdAt: b.createdAt, fineWeight: Number(b.fineWeight) })));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="Oro Recibido" sublabel="Total histórico ingresado" value={formatWeight(oroRecibido.fineWeight)}
        unit="g" icon={ArrowDownLeft} accent="hover:border-[var(--pm-accent-emerald)]/30"
        sparklineData={oroRecibidoSpark} color="#10B981" delay={0.05}
      />
      <KpiCard
        label="Oro Fundido (R)" sublabel="Fundiciones completadas" value={formatWeight(oroFundido.totalRecovered)}
        unit="g" icon={Flame} accent="hover:border-[var(--pm-accent-amber)]/30"
        sparklineData={filteredSpark} color="#F59E0B" delay={0.1}
      />
      <KpiCard
        label="Oro en Espera" sublabel="Pendiente por procesar" value={formatWeight(oroEnEspera.fineWeight)}
        unit="g" icon={Warehouse} accent="hover:border-[var(--pm-accent-sky)]/30"
        sparklineData={filteredSpark} color="#0EA5E9" delay={0.15}
      />
      <KpiCard
        label="Balance Global" sublabel={`${formatNumber(oroFundido.eficiencia, 1)}% eficiencia`}
        value={`${totals.balance >= 0 ? '+' : ''}${formatWeight(Math.abs(totals.balance))}`}
        unit="" icon={Scale} accent="hover:border-[var(--pm-accent-gold)]/30"
        sparklineData={filteredSpark} color="#D4AF37" delay={0.2}
      />
    </div>
  );
}
