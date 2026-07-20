'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useBars } from '@/hooks/useBars';
import { useClients } from '@/hooks/useClients';
import { useMaterialExits } from '@/hooks/useExits';
import { useProcesses } from '@/hooks/useProcesses';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import {
  ClipboardList, Flame, Warehouse, TrendingDown,
  Coins, Scale, Pickaxe,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/format';
import { useGoldTraceability } from '@/context/GoldTraceabilityContext';

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

const KPI_COLORS = [
  { accent: '#D4AF37', label: 'FA' },
  { accent: '#0EA5E9', label: 'FE' },
  { accent: '#10B981', label: 'R' },
  { accent: '#EF4444', label: '%' },
];

const KPI_ICONS = [ClipboardList, Flame, Warehouse, TrendingDown];

export default function V2DashboardPage() {
  const { data: bars = [] } = useBars();
  const { data: clients = [] } = useClients();
  const { data: exits = [] } = useMaterialExits();
  const { data: processes = [] } = useProcesses();
  const { data: metrics, isLoading } = useDashboardMetrics();
  const { weightUnit } = useGoldTraceability();

  const flowData = useMemo(() => {
    const days: Record<string, { in: number; out: number }> = {};
    bars.forEach(b => {
      const d = new Date(b.createdAt).toISOString().split('T')[0];
      if (!days[d]) days[d] = { in: 0, out: 0 };
      days[d].in += Number(b.fineWeight);
    });
    exits.forEach(e => {
      const d = new Date(e.createdAt).toISOString().split('T')[0];
      if (!days[d]) days[d] = { in: 0, out: 0 };
      days[d].out += Number(e.totalWeight);
    });
    return Object.values(days);
  }, [bars, exits]);

  const sparkIn = useMemo(() => flowData.map(d => d.in).slice(-14), [flowData]);
  const sparkOut = useMemo(() => flowData.map(d => d.out).slice(-14), [flowData]);
  const sparkNet = useMemo(() => flowData.map(d => d.in - d.out).slice(-14), [flowData]);
  const sparkMerma = useMemo(() => flowData.map(d => Math.abs(d.in - d.out) * 0.02).slice(-14), [flowData]);

  const clientBalances = useMemo(() => {
    if (!clients || !bars) return [];
    return clients.map(client => {
      const clientBars = bars.filter(b => b.clientId === client.id);
      const ingresoBruto = clientBars.reduce((s, b) => s + Number(b.grossWeight), 0);
      const fa = clientBars.reduce((s, b) => s + Number(b.fineWeight), 0);
      const clientProcesses = processes.filter(p => p.clientId === client.id);
      const r = clientProcesses.reduce((s, p) =>
        s + (p.lots?.reduce((sl, l) => sl + Number(l.recovered ?? 0), 0) ?? 0), 0);
      const clientExits = exits.filter(e =>
        e.exitDetails.some(d => d.lot?.process?.client?.id === client.id));
      const egresos = clientExits.reduce((s, e) => s + Number(e.totalWeight), 0);
      const balance = fa + r - egresos;
      return { id: client.id, name: client.name, ingresoBruto, fa, r, egresos, balance };
    })
      .filter(c => c.ingresoBruto > 0 || c.fa > 0 || c.egresos > 0)
      .sort((a, b) => b.ingresoBruto - a.ingresoBruto);
  }, [clients, bars, processes, exits]);

  const totalBalance = useMemo(
    () => clientBalances.reduce((s, c) => s + c.balance, 0),
    [clientBalances],
  );

  const kpiData = [
    {
      label: 'Oro Recibido',
      value: metrics?.oroRecibido.fineWeight ?? 0,
      sublabel: `FA total: ${formatNumber((metrics?.oroRecibido.fineWeight ?? 0) / (weightUnit === 'kg' ? 1000 : 1), weightUnit === 'kg' ? 4 : 2)} ${weightUnit === 'kg' ? 'kg' : 'g'}`,
      subicon: Scale,
      accent: KPI_COLORS[0].accent,
      tag: KPI_COLORS[0].label,
      postfix: '',
      spark: sparkIn,
    },
    {
      label: 'Oro en Proceso',
      value: metrics?.oroEnProceso.fineWeight ?? 0,
      sublabel: `Barras en horno: ${metrics?.oroEnProceso.barCount ?? 0} u`,
      subicon: Flame,
      accent: KPI_COLORS[1].accent,
      tag: KPI_COLORS[1].label,
      postfix: '',
      spark: sparkOut,
    },
    {
      label: 'Oro en Bóveda',
      value: metrics?.oroEnBoveda.fineWeight ?? 0,
      sublabel: `R neto disponible: ${formatNumber((metrics?.oroEnBoveda.fineWeight ?? 0) / (weightUnit === 'kg' ? 1000 : 1), weightUnit === 'kg' ? 4 : 2)} ${weightUnit === 'kg' ? 'kg' : 'g'}`,
      subicon: Pickaxe,
      accent: KPI_COLORS[2].accent,
      tag: KPI_COLORS[2].label,
      postfix: '',
      spark: sparkNet,
    },
    {
      label: 'Merma',
      value: metrics?.merma.porcentaje ?? 0,
      sublabel: `Pérdida total: ${formatNumber((metrics?.merma.gramos ?? 0) / (weightUnit === 'kg' ? 1000 : 1), weightUnit === 'kg' ? 4 : 2)} ${weightUnit === 'kg' ? 'kg' : 'g'} Au`,
      subicon: Scale,
      accent: KPI_COLORS[3].accent,
      tag: KPI_COLORS[3].label,
      postfix: '%',
      spark: sparkMerma,
    },
  ];

  const formatWeightCell = (val: number) =>
    `${formatNumber(val / (weightUnit === 'kg' ? 1000 : 1), weightUnit === 'kg' ? 4 : 2)} ${weightUnit === 'kg' ? 'kg' : 'g'}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpiData.map((kpi, idx) => {
          const Icon = KPI_ICONS[idx];
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * idx, duration: 0.45 }}
              className="premium-card relative overflow-hidden active:scale-[0.97] transition-all duration-150 cursor-default"
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
                    {kpi.postfix === '%'
                      ? `${formatNumber(kpi.value, 1)}`
                      : formatNumber(kpi.value / (weightUnit === 'kg' ? 1000 : 1), weightUnit === 'kg' ? 4 : 2)}
                  </span>
                  <span className="text-[11px] text-[var(--pm-text-dim)] font-mono">
                    {kpi.postfix || (weightUnit === 'kg' ? 'kg' : 'g')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pt-3 border-t border-[var(--pm-border)]">
                  <kpi.subicon className="w-3 h-3 shrink-0" style={{ color: kpi.accent }} />
                  <span className="text-[10px] text-[var(--pm-text-dim)] font-mono truncate">{kpi.sublabel}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Balances Table */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45 }}
        className="premium-card overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[var(--pm-border)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--pm-text-primary)] font-sans">
              Resumen de Balances
            </h3>
            <p className="text-[11px] text-[var(--pm-text-dim)] font-sans mt-0.5">
              Ingresos, recuperación y egresos por cliente.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[var(--pm-text-dim)] font-mono block">BALANCE TOTAL</span>
            <span
              className={`text-sm font-mono font-bold ${totalBalance >= 0 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}
            >
              {formatWeightCell(Math.abs(totalBalance))}
              {totalBalance < 0 ? ' (negativo)' : ''}
            </span>
          </div>
        </div>

        {clientBalances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--pm-text-dim)]">
            <Coins className="w-10 h-10 text-[var(--pm-accent-gold)]/20 mb-3 animate-pulse" />
            <span className="text-sm font-sans">No hay datos de clientes</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table w-full">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th className="text-right">Ingreso Bruto</th>
                  <th className="text-right">FA (g)</th>
                  <th className="text-right">R (g)</th>
                  <th className="text-right">Egresos</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {clientBalances.map((c, idx) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + idx * 0.04, duration: 0.3 }}
                  >
                    <td className="font-sans font-semibold text-[var(--pm-text-primary)]">
                      {c.name}
                    </td>
                    <td className="text-right text-[var(--pm-text-dim)]">
                      {formatWeightCell(c.ingresoBruto)}
                    </td>
                    <td className="text-right text-[var(--pm-accent-gold)]">
                      {formatWeightCell(c.fa)}
                    </td>
                    <td className="text-right text-[var(--pm-accent-amber)]">
                      {formatWeightCell(c.r)}
                    </td>
                    <td className="text-right text-[var(--pm-accent-red)]">
                      {formatWeightCell(c.egresos)}
                    </td>
                    <td
                      className={`text-right font-bold ${c.balance >= 0 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}
                    >
                      {formatWeightCell(Math.abs(c.balance))}
                      {c.balance < 0 ? ' −' : ''}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Footer note */}
      <p className="text-[9px] text-[var(--pm-text-dim)] font-mono text-center opacity-50">
        Datos actualizados en tiempo real · Bandes v2 Premium
      </p>
    </motion.div>
  );
}
