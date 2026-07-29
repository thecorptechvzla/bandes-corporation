'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, Table2 } from 'lucide-react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumber } from '@/lib/format';

function isLightColor(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

interface TreemapTooltipProps {
  active?: boolean;
  payload?: any[];
  accent: string;
  scaleLabel: string;
}

function TreemapTooltip({ active, payload, accent, scaleLabel }: TreemapTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
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
            {formatNumber(data.value, 2)} g
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
}

function CustomTreemapBlock(props: CustomBlockProps) {
  const {
    x = 0, y = 0, width = 0, height = 0,
    name = '', value = 0, pct = 0, fill = '#0D1520',
    accent = '#00E5FF', glowColor = '#00E5FF',
  } = props;
  const [hovered, setHovered] = useState(false);

  if (width <= 0 || height <= 0) return null;

  const weightLabel = `${formatNumber(value, 2)} g`;
  const lightText = isLightColor(fill);

  const showName = width > 50 && height > 40;
  const showWeight = width > 60 && height > 60;
  const showPct = width > 70 && height > 80;

  const textColor = lightText ? '#0A0F1A' : '#F4F4F5';
  const shadowIntensity = lightText ? 0.5 : 0.95;

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={8} />

      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2}
        fill="none" stroke="var(--pm-bg-deepest)" strokeWidth={2} rx={7} />

      <rect x={x} y={y} width={width} height={height} fill="none" stroke={fill}
        strokeOpacity={hovered ? 0.7 : 0.3} strokeWidth={hovered ? 1.5 : 0.75} rx={8} />

      {hovered && (
        <>
          <rect x={x - 1} y={y - 1} width={width + 2} height={height + 2}
            fill="none" stroke={glowColor} strokeWidth={2} rx={9} opacity={0.7}
            style={{ filter: 'drop-shadow(0 0 6px ' + glowColor + ')' }} />
          <rect x={x - 1} y={y - 1} width={width + 2} height={height + 2}
            fill="none" stroke={glowColor} strokeWidth={6} rx={10} opacity={0.15}
            style={{ filter: 'blur(5px)' }} />
        </>
      )}

      {showName && (
        <text x={x + width / 2} y={y + height / 2 - (showWeight ? 12 : showPct ? 16 : 0)}
          textAnchor="middle" dominantBaseline="central" fill={textColor}
          fontFamily="'JetBrains Mono', 'Fira Code', monospace"
          fontSize={height > 100 ? 14 : height > 70 ? 12 : 10} fontWeight={800}
          style={{ textShadow: `0 2px 8px rgba(0,0,0,${shadowIntensity}), 0 0 4px rgba(0,0,0,${shadowIntensity})` }}>
          {name.length > (width > 120 ? 22 : width > 80 ? 16 : 10)
            ? `${name.slice(0, width > 120 ? 22 : width > 80 ? 16 : 10)}…`
            : name}
        </text>
      )}

      {showWeight && (
        <text x={x + width / 2} y={y + height / 2 + 14}
          textAnchor="middle" dominantBaseline="central" fill={textColor}
          fontFamily="'JetBrains Mono', 'Fira Code', monospace"
          fontSize={height > 100 ? 12 : 10} fontWeight={600} opacity={0.9}
          style={{ textShadow: `0 2px 6px rgba(0,0,0,${shadowIntensity})` }}>
          {weightLabel}
        </text>
      )}

      {showPct && (
        <text x={x + width / 2} y={y + height / 2 + 30}
          textAnchor="middle" dominantBaseline="central" fill={textColor}
          fontFamily="'JetBrains Mono', 'Fira Code', monospace"
          fontSize={10} fontWeight={600} opacity={0.85}
          style={{ textShadow: `0 2px 6px rgba(0,0,0,${shadowIntensity})` }}>
          {formatNumber(pct, 1)}%
        </text>
      )}
    </g>
  );
}

function TreemapLegend({ data }: { data: { name: string; value: number; pct: number; fill: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 px-4 pb-3 pt-2.5 border-t border-[var(--pm-border)]/30 text-[9px] font-mono">
      {data.map(item => (
        <div key={item.name} className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.fill }} />
          <span className="text-[var(--pm-text-primary)] font-semibold">{item.name}:</span>
          <span className="text-[var(--pm-text-dim)]">{formatNumber(item.value, 2)} g</span>
          <span className="text-[var(--pm-text-dim)] opacity-60">({formatNumber(item.pct, 1)}%)</span>
        </div>
      ))}
    </div>
  );
}

const formatWeightCell = (val: number) => `${formatNumber(val, 2)} g`;

interface TreemapPanelProps {
  title: string;
  subtitle: string;
  data: { name: string; value: number; pct: number; fill: string }[];
  accent: string;
  glowColor: string;
  scaleLabel: string;
  isTableMode: boolean;
  isMounted: boolean;
  onToggleView: () => void;
  emptyIcon: React.ComponentType<{ className?: string }>;
  emptyLabel: string;
}

export function TreemapPanel({
  title,
  subtitle,
  data,
  accent,
  glowColor,
  scaleLabel,
  isTableMode,
  isMounted,
  onToggleView,
  emptyIcon: EmptyIcon,
  emptyLabel,
}: TreemapPanelProps) {
  const renderTreemap = () => (
    <>
      <ResponsiveContainer width="100%" height={340}>
        <Treemap
          data={data}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="transparent"
          isAnimationActive={true}
          content={<CustomTreemapBlock accent={accent} glowColor={glowColor} />}
        >
          <Tooltip content={<TreemapTooltip accent={accent} scaleLabel={scaleLabel} />} />
        </Treemap>
      </ResponsiveContainer>
      {data.length > 1 && <TreemapLegend data={data} />}
    </>
  );

  const renderDetailTable = () => (
    <div className="overflow-x-auto max-h-[340px] overflow-y-auto v2-scroll">
      <table className="w-full">
        <thead className="sticky top-0" style={{ background: 'var(--pm-bg-secondary)' }}>
          <tr>
            <th className="text-[9px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)] text-left px-4 py-2.5 border-b border-[var(--pm-border)]">ENTIDAD</th>
            <th className="text-[9px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)] text-right px-4 py-2.5 border-b border-[var(--pm-border)]">MASA TOTAL</th>
            <th className="text-[9px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)] text-right px-4 py-2.5 border-b border-[var(--pm-border)]">PROPORCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item.name} className="transition-colors duration-100"
              style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
              <td className="px-4 py-2.5 text-[12px] font-mono text-[var(--pm-text-primary)]">
                <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: item.fill }} />
                {item.name}
              </td>
              <td className="px-4 py-2.5 text-[12px] font-mono text-right font-semibold" style={{ color: item.fill }}>
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

  const toggleBg = isTableMode ? `${accent}12` : 'transparent';
  const toggleColor = accent;
  const toggleBorder = `${accent}20`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 0 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.45 }}
      className="bg-[#0A0F1C]/60 backdrop-blur-md border border-white/[0.06] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-[var(--pm-border)]/30">
        <div>
          <h3 className="text-[11px] font-semibold text-[var(--pm-text-primary)] font-mono tracking-wider">
            {title}
          </h3>
          <p className="text-[9px] text-[var(--pm-text-dim)] font-mono mt-0.5">
            {subtitle}
          </p>
        </div>
        <button
          onClick={onToggleView}
          className="flex items-center gap-1.5 text-[9px] font-mono font-bold tracking-wider uppercase px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95"
          style={{
            background: toggleBg,
            color: toggleColor,
            border: `1px solid ${toggleBorder}`,
          }}
        >
          {isTableMode ? <LayoutGrid className="w-3 h-3" /> : <Table2 className="w-3 h-3" />}
          {isTableMode ? 'VER GRÁFICA' : 'VER DETALLE'}
        </button>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <EmptyIcon className="w-12 h-12 text-gray-500/30 mb-3" />
          <span className="text-xs font-mono text-gray-500/50">{emptyLabel}</span>
        </div>
      ) : isTableMode ? (
        renderDetailTable()
      ) : isMounted ? (
        renderTreemap()
      ) : (
        <div className="flex items-center justify-center py-20 text-[var(--pm-text-dim)]">
          <span className="text-xs font-mono">Cargando gráfica...</span>
        </div>
      )}
    </motion.div>
  );
}
