'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { useBars } from '@/hooks/useBars';
import { useClients } from '@/hooks/useClients';
import { useMaterialExits } from '@/hooks/useExits';
import { useProcesses } from '@/hooks/useProcesses';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import {
  ClipboardList, Flame, Warehouse, TrendingDown,
  Coins, Scale, Pickaxe, LayoutGrid, Table2,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Treemap, Tooltip } from 'recharts';
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

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function makeCyanColor(name: string, intensity: number): string {
  const hue = 180 + (hashStr(name) % 16);
  const sat = 75 + (hashStr(name + 'sat') % 20);
  const lit = 28 + intensity * 28;
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

function makeGoldColor(name: string, intensity: number): string {
  const hue = 37 + (hashStr(name) % 14);
  const sat = 55 + (hashStr(name + 'sat') % 20);
  const lit = 28 + intensity * 28;
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

function darkenHsl(hsl: string): string {
  const m = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!m) return 'rgba(10,15,26,0.85)';
  return `hsl(${m[1]}, ${m[2]}%, ${Math.max(6, Math.round(parseInt(m[3]) * 0.25))}%)`;
}

function TreemapTooltip({
  active, payload, accent, scaleLabel, weightUnit,
}: {
  active?: boolean; payload?: any[]; accent: string; scaleLabel: string; weightUnit: string;
}) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  const divisor = weightUnit === 'kg' ? 1000 : 1;
  const dec = weightUnit === 'kg' ? 4 : 2;
  return (
    <div
      className="rounded-lg border px-3.5 py-2.5 text-[10px] font-mono space-y-1 min-w-[170px]"
      style={{
        background: 'rgba(10, 15, 26, 0.88)',
        backdropFilter: 'blur(8px)',
        borderColor: `${accent}40`,
        borderWidth: 1,
        boxShadow: `0 0 20px ${accent}15, 0 4px 16px rgba(0,0,0,0.5)`,
      }}
    >
      <div className="flex items-center gap-2 text-[9px] text-[var(--pm-text-dim)] uppercase tracking-[0.12em] font-bold">
        <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
        {scaleLabel}
      </div>
      <p className="text-[13px] font-bold text-[var(--pm-text-primary)]">{data.name}</p>
      <div className="border-t border-[var(--pm-border)] pt-1.5 mt-1.5 space-y-1">
        <p className="flex justify-between items-center">
          <span className="text-[var(--pm-text-dim)] text-[10px]">MASA TOTAL</span>
          <span className="font-semibold text-[12px]" style={{ color: accent }}>
            {formatNumber(data.value / divisor, dec)} {weightUnit}
          </span>
        </p>
        <p className="flex justify-between items-center">
          <span className="text-[var(--pm-text-dim)] text-[10px]">PROPORCIÓN</span>
          <span className="font-semibold text-[12px]" style={{ color: accent }}>
            {formatNumber(data.pct, 1)}%
          </span>
        </p>
      </div>
    </div>
  );
}

interface CustomBlockProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  pct?: number;
  fill?: string;
  accent?: string;
  glowColor?: string;
  index?: number;
  weightUnit?: string;
}

function CustomTreemapBlock(props: CustomBlockProps) {
  const {
    x = 0, y = 0, width = 0, height = 0,
    name = '', value = 0, pct = 0, fill = '#0D1520',
    accent = '#00E5FF', glowColor = '#00E5FF', weightUnit = 'g',
  } = props;
  const [hovered, setHovered] = useState(false);

  if (width <= 0 || height <= 0) return null;

  const uid = name.replace(/[^a-zA-Z0-9]/g, '');
  const darkFill = darkenHsl(fill);
  const divisor = weightUnit === 'kg' ? 1000 : 1;
  const dec = weightUnit === 'kg' ? 4 : 2;
  const weightLabel = `${formatNumber(value / divisor, dec)} ${weightUnit}`;

  const showName = width > 50 && height > 40;
  const showWeight = width > 60 && height > 60;
  const showPct = width > 70 && height > 80;

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={1} />
          <stop offset="100%" stopColor={darkFill} stopOpacity={1} />
        </linearGradient>
        <filter id={`glow-${uid}`}>
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`url(#bg-${uid})`}
        rx={8}
      />

      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke={accent}
        strokeOpacity={hovered ? 0.5 : 0.2}
        strokeWidth={hovered ? 1.5 : 0.75}
        rx={8}
      />

      {hovered && (
        <>
          <rect
            x={x - 1}
            y={y - 1}
            width={width + 2}
            height={height + 2}
            fill="none"
            stroke={glowColor}
            strokeWidth={2}
            rx={9}
            opacity={0.6}
            filter={`url(#glow-${uid})`}
          />
          <rect
            x={x - 1}
            y={y - 1}
            width={width + 2}
            height={height + 2}
            fill="none"
            stroke={glowColor}
            strokeWidth={6}
            rx={10}
            opacity={0.15}
            style={{ filter: 'blur(5px)' }}
          />
        </>
      )}

      {showName && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showWeight ? 12 : showPct ? 16 : 0)}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#F4F4F5"
          fontFamily="'JetBrains Mono', 'Fira Code', monospace"
          fontSize={height > 100 ? 14 : height > 70 ? 12 : 10}
          fontWeight={800}
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.8)' }}
        >
          {name.length > (width > 120 ? 22 : width > 80 ? 16 : 10)
            ? `${name.slice(0, width > 120 ? 22 : width > 80 ? 16 : 10)}…`
            : name}
        </text>
      )}

      {showWeight && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 14}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#E2E8F0"
          fontFamily="'JetBrains Mono', 'Fira Code', monospace"
          fontSize={height > 100 ? 12 : 10}
          fontWeight={600}
          opacity={0.9}
          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
        >
          {weightLabel}
        </text>
      )}

      {showPct && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 30}
          textAnchor="middle"
          dominantBaseline="central"
          fill={accent}
          fontFamily="'JetBrains Mono', 'Fira Code', monospace"
          fontSize={10}
          fontWeight={600}
          opacity={0.7}
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
        >
          {formatNumber(pct, 1)}%
        </text>
      )}
    </g>
  );
}

function TreemapLegend({
  data, weightUnit,
}: {
  data: { name: string; value: number; pct: number; fill: string }[];
  weightUnit: string;
}) {
  const divisor = weightUnit === 'kg' ? 1000 : 1;
  const dec = weightUnit === 'kg' ? 4 : 2;
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 px-4 pb-3 pt-2.5 border-t border-[var(--pm-border)]/30 text-[9px] font-mono">
      {data.map(item => (
        <div key={item.name} className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.fill }} />
          <span className="text-[var(--pm-text-primary)] font-semibold">{item.name}:</span>
          <span className="text-[var(--pm-text-dim)]">
            {formatNumber(item.value / divisor, dec)} {weightUnit}
          </span>
          <span className="text-[var(--pm-text-dim)] opacity-60">
            ({formatNumber(item.pct, 1)}%)
          </span>
        </div>
      ))}
    </div>
  );
}

export default function V2DashboardPage() {
  const { data: bars = [] } = useBars();
  const { data: clients = [] } = useClients();
  const { data: exits = [] } = useMaterialExits();
  const { data: processes = [] } = useProcesses();
  const { data: metrics, isLoading } = useDashboardMetrics();
  const { weightUnit } = useGoldTraceability();

  const [showTableIngresos, setShowTableIngresos] = useState(false);
  const [showTableEgresos, setShowTableEgresos] = useState(false);

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

  const ingresosTreemap = useMemo(() => {
    const map: Record<string, number> = {};
    bars.forEach(b => {
      const name = b.client?.name || 'Desconocido';
      map[name] = (map[name] || 0) + Number(b.grossWeight);
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    const maxVal = Math.max(...Object.values(map), 1);
    return Object.entries(map)
      .map(([name, value]) => {
        const intensity = value / maxVal;
        return { name, value, pct: total > 0 ? (value / total) * 100 : 0, fill: makeCyanColor(name, intensity) };
      })
      .sort((a, b) => b.value - a.value);
  }, [bars]);

  const egresosTreemap = useMemo(() => {
    const map: Record<string, number> = {};
    exits.forEach(e => {
      e.exitDetails.forEach(d => {
        const clientName = d.lot?.process?.client?.name || e.destination || 'Desconocido';
        map[clientName] = (map[clientName] || 0) + Number(d.weightAported);
      });
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    const maxVal = Math.max(...Object.values(map), 1);
    return Object.entries(map)
      .map(([name, value]) => {
        const intensity = value / maxVal;
        return { name, value, pct: total > 0 ? (value / total) * 100 : 0, fill: makeGoldColor(name, intensity) };
      })
      .sort((a, b) => b.value - a.value);
  }, [exits]);

  const kpiData = [
    {
      label: 'Oro Recibido',
      value: metrics?.oroRecibido.fineWeight ?? 0,
      sublabel: `FA total: ${formatNumber((metrics?.oroRecibido.fineWeight ?? 0) / (weightUnit === 'kg' ? 1000 : 1), 2)} ${weightUnit === 'kg' ? 'kg' : 'g'}`,
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
      sublabel: `R neto disponible: ${formatNumber((metrics?.oroEnBoveda.fineWeight ?? 0) / (weightUnit === 'kg' ? 1000 : 1), 2)} ${weightUnit === 'kg' ? 'kg' : 'g'}`,
      subicon: Pickaxe,
      accent: KPI_COLORS[2].accent,
      tag: KPI_COLORS[2].label,
      postfix: '',
      spark: sparkNet,
    },
    {
      label: 'Merma',
      value: metrics?.merma.porcentaje ?? 0,
      sublabel: `Pérdida total: ${formatNumber((metrics?.merma.gramos ?? 0) / (weightUnit === 'kg' ? 1000 : 1), 2)} ${weightUnit === 'kg' ? 'kg' : 'g'} Au`,
      subicon: Scale,
      accent: KPI_COLORS[3].accent,
      tag: KPI_COLORS[3].label,
      postfix: '%',
      spark: sparkMerma,
    },
  ];

  const formatWeightCell = (val: number) =>
    `${formatNumber(val / (weightUnit === 'kg' ? 1000 : 1), 2)} ${weightUnit === 'kg' ? 'kg' : 'g'}`;

  const fmtKg = (val: number) => formatNumber(val / 1000, 2);

  const renderTreemap = (
    data: { name: string; value: number; pct: number; fill: string }[],
    accent: string,
    glowColor: string,
    scaleLabel: string,
  ) => (
    <>
      <ResponsiveContainer width="100%" height={340}>
        <Treemap
          data={data}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="transparent"
          isAnimationActive={true}
          content={<CustomTreemapBlock accent={accent} glowColor={glowColor} weightUnit={weightUnit} />}
        >
          <Tooltip
            content={<TreemapTooltip accent={accent} scaleLabel={scaleLabel} weightUnit={weightUnit} />}
          />
        </Treemap>
      </ResponsiveContainer>
      {data.length > 1 && <TreemapLegend data={data} weightUnit={weightUnit} />}
    </>
  );

  const renderDetailTable = (
    data: { name: string; value: number; pct: number }[],
    accent: string,
  ) => (
    <div className="overflow-x-auto max-h-[340px] overflow-y-auto v2-scroll">
      <table className="w-full">
        <thead className="sticky top-0" style={{ background: 'var(--pm-bg-secondary)' }}>
          <tr>
            <th className="text-[9px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)] text-left px-4 py-2.5 border-b border-[var(--pm-border)]">
              ENTIDAD
            </th>
            <th className="text-[9px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)] text-right px-4 py-2.5 border-b border-[var(--pm-border)]">
              MASA TOTAL
            </th>
            <th className="text-[9px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)] text-right px-4 py-2.5 border-b border-[var(--pm-border)]">
              PROPORCIÓN
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr
              key={item.name}
              className="transition-colors duration-100"
              style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
            >
              <td className="px-4 py-2.5 text-[12px] font-mono text-[var(--pm-text-primary)]">
                <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: accent, opacity: 0.3 + (item.pct / 100) * 0.7 }} />
                {item.name}
              </td>
              <td className="px-4 py-2.5 text-[12px] font-mono text-right font-semibold" style={{ color: accent }}>
                {formatWeightCell(item.value)}
              </td>
              <td className="px-4 py-2.5 text-[12px] font-mono text-right text-[var(--pm-text-dim)]">
                {formatNumber(item.pct, 1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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
                      : formatNumber(kpi.value / (weightUnit === 'kg' ? 1000 : 1), 2)}
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

      {/* Treemaps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        {/* Ingresos Treemap */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-[var(--pm-border)]/30">
            <div>
              <h3 className="text-[11px] font-semibold text-[var(--pm-text-primary)] font-mono tracking-wider">
                INGRESOS POR PROVEEDOR
              </h3>
              <p className="text-[9px] text-[var(--pm-text-dim)] font-mono mt-0.5">
                Proporción de masa bruta recibida
              </p>
            </div>
            <button
              onClick={() => setShowTableIngresos(!showTableIngresos)}
              className="flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-wider uppercase px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95"
              style={{
                background: `${showTableIngresos ? 'rgba(14,165,233,0.12)' : 'transparent'}`,
                color: 'var(--pm-accent-sky)',
                border: '1px solid rgba(14,165,233,0.2)',
              }}
            >
              {showTableIngresos ? <LayoutGrid className="w-3 h-3" /> : <Table2 className="w-3 h-3" />}
              {showTableIngresos ? 'VER GRÁFICA' : 'VER DETALLE'}
            </button>
          </div>

          {ingresosTreemap.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--pm-text-dim)]">
              <Scale className="w-8 h-8 text-[var(--pm-accent-sky)]/20 mb-2" />
              <span className="text-xs font-mono">SIN DATOS DE INGRESOS</span>
            </div>
          ) : showTableIngresos ? (
            renderDetailTable(ingresosTreemap, 'var(--pm-accent-sky)')
          ) : (
            renderTreemap(ingresosTreemap, '#00E5FF', '#00E5FF', 'PROVEEDOR')
          )}
        </motion.div>

        {/* Egresos Treemap */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.45 }}
          className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-[var(--pm-border)]/30">
            <div>
              <h3 className="text-[11px] font-semibold text-[var(--pm-text-primary)] font-mono tracking-wider">
                EGRESOS POR CLIENTE
              </h3>
              <p className="text-[9px] text-[var(--pm-text-dim)] font-mono mt-0.5">
                Proporción de masa despachada
              </p>
            </div>
            <button
              onClick={() => setShowTableEgresos(!showTableEgresos)}
              className="flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-wider uppercase px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95"
              style={{
                background: `${showTableEgresos ? 'rgba(212,175,55,0.12)' : 'transparent'}`,
                color: 'var(--pm-accent-gold)',
                border: '1px solid rgba(212,175,55,0.2)',
              }}
            >
              {showTableEgresos ? <LayoutGrid className="w-3 h-3" /> : <Table2 className="w-3 h-3" />}
              {showTableEgresos ? 'VER GRÁFICA' : 'VER DETALLE'}
            </button>
          </div>

          {egresosTreemap.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--pm-text-dim)]">
              <TrendingDown className="w-8 h-8 text-[var(--pm-accent-gold)]/20 mb-2" />
              <span className="text-xs font-mono">SIN DATOS DE EGRESOS</span>
            </div>
          ) : showTableEgresos ? (
            renderDetailTable(egresosTreemap, 'var(--pm-accent-gold)')
          ) : (
            renderTreemap(egresosTreemap, '#D5B042', '#D5B042', 'CLIENTE')
          )}
        </motion.div>
      </div>

      {/* Balances Table */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45 }}
        className="premium-card overflow-hidden mt-5"
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
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[180px_repeat(5,120px)] px-6 py-3 border-b border-[var(--pm-border)] text-[10px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)]">
                <div className="text-left">Cliente</div>
                <div className="text-right">Ingreso Bruto (KG)</div>
                <div className="text-right">FA (KG)</div>
                <div className="text-right">R (KG)</div>
                <div className="text-right">Egresos (KG)</div>
                <div className="text-right">Balance (KG)</div>
              </div>
              {clientBalances.map((c, idx) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + idx * 0.04, duration: 0.3 }}
                  className="grid grid-cols-[180px_repeat(5,120px)] px-6 py-3 border-b border-[rgba(30,42,69,0.15)] text-[12px] font-mono transition-colors duration-100 hover:bg-[rgba(21,28,45,0.5)]"
                  style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
                >
                  <div className="text-left font-sans font-semibold text-[var(--pm-text-primary)] truncate">
                    {c.name}
                  </div>
                  <div className="text-right text-[var(--pm-text-dim)]">
                    {fmtKg(c.ingresoBruto)}
                  </div>
                  <div className="text-right text-[var(--pm-accent-gold)]">
                    {fmtKg(c.fa)}
                  </div>
                  <div className="text-right text-[var(--pm-accent-amber)]">
                    {fmtKg(c.r)}
                  </div>
                  <div className="text-right text-[var(--pm-accent-red)]">
                    {fmtKg(c.egresos)}
                  </div>
                  <div className={`text-right font-bold ${c.balance >= 0 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}>
                    {fmtKg(Math.abs(c.balance))}
                    {c.balance < 0 ? ' −' : ''}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Footer note */}
      <p className="text-[9px] text-[var(--pm-text-dim)] font-mono text-center opacity-50 mt-5">
        Datos actualizados en tiempo real · Bandes v2 Premium
      </p>
    </motion.div>
  );
}
