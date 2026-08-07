'use client';

import React, { useState } from 'react';
import { LayoutGrid, Table2 } from 'lucide-react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumber } from '@/lib/format';
import { PanelCard } from '@/components/dashboard/PanelCard';

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
      className="rounded-lg border px-3.5 py-2.5 text-[11px] font-mono space-y-1 min-w-[170px]"
      style={{
        background: 'var(--hud-bg-card)',
        borderColor: `${accent}40`,
        borderWidth: 1,
        boxShadow: `0 0 20px ${accent}15, 0 4px 20px rgba(0,0,0,0.6)`,
      }}
    >
      <div className="flex items-center gap-2 text-[10px] text-[var(--hud-text-dim)] uppercase tracking-[0.12em] font-bold">
        <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
        {scaleLabel}
      </div>
      <p className="text-[13px] font-bold text-[var(--hud-text-primary)]">{data.name}</p>
      <div className="border-t border-[var(--hud-border)] pt-1.5 mt-1.5 space-y-1">
        <p className="flex justify-between items-center">
          <span className="text-[var(--hud-text-dim)] text-[11px]">MASA TOTAL</span>
          <span className="font-semibold text-[12px]" style={{ color: accent }}>
            {formatNumber(data.value, 2)} g
          </span>
        </p>
        <p className="flex justify-between items-center">
          <span className="text-[var(--hud-text-dim)] text-[11px]">PROPORCIÓN</span>
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
  treemapId?: string;
  depth?: number;
}

function CustomTreemapBlock(props: CustomBlockProps) {
  const {
    x = 0, y = 0, width = 0, height = 0,
    name = '', value = 0, pct = 0, fill = '#0D9488',
    accent = '#0D9488', index = 0, treemapId = 'default', depth = 1,
  } = props;
  const [hovered, setHovered] = useState(false);

  if (width <= 0 || height <= 0) return null;
  if (depth !== 1) return <g />; // hide root node

  const uid = `${treemapId}-block-${index}`;
  const weightLabel = `${formatNumber(value, 2)} g`;
  const glow = accent || fill;

  const gap = 6;
  const ix = x + gap / 2;
  const iy = y + gap / 2;
  const iw = width - gap;
  const ih = height - gap;

  const showName = iw > 50 && ih > 40;
  const showWeight = iw > 60 && ih > 60;
  const showPct = iw > 70 && ih > 80;

  const shadowStyle = { textShadow: '0 2px 4px rgba(0,0,0,0.8)' };

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <defs>
        {/* Top glow — translucent, fades to 0 downward */}
        <linearGradient id={`tm-glow-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={glow} stopOpacity={0.4} />
          <stop offset="100%" stopColor={glow} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Dark flat base */}
      <rect x={ix} y={iy} width={iw} height={ih}
        fill="#0D1117" rx={12} />

      {/* Top glow overlay */}
      <rect x={ix} y={iy} width={iw} height={ih}
        fill={`url(#tm-glow-${uid})`} rx={12} />

      {/* Mini top accent line — computed per value */}
      <rect x={ix} y={iy} width={iw} height={3}
        fill={glow} opacity={0.9} rx={1.5} />

      {/* Hover overlay */}
      {hovered && (
        <rect x={ix} y={iy} width={iw} height={ih}
          fill="rgba(255,255,255,0.05)" rx={12} />
      )}

      {showName && (
        <text x={ix + iw / 2} y={iy + ih / 2 - (showWeight ? 12 : showPct ? 16 : 0)}
          textAnchor="middle" dominantBaseline="central" fill="#FFFFFF"
          fontFamily="'JetBrains Mono', 'Fira Code', monospace"
          fontSize={ih > 100 ? 14 : ih > 70 ? 12 : 10} fontWeight={800}
          style={shadowStyle}>
          {name.length > (iw > 120 ? 22 : iw > 80 ? 16 : 10)
            ? `${name.slice(0, iw > 120 ? 22 : iw > 80 ? 16 : 10)}…`
            : name}
        </text>
      )}

      {showWeight && (
        <text x={ix + iw / 2} y={iy + ih / 2 + 14}
          textAnchor="middle" dominantBaseline="central" fill="#FFFFFF"
          fontFamily="'JetBrains Mono', 'Fira Code', monospace"
          fontSize={ih > 100 ? 12 : 10} fontWeight={600} opacity={0.9}
          style={shadowStyle}>
          {weightLabel}
        </text>
      )}

      {showPct && (
        <text x={ix + iw / 2} y={iy + ih / 2 + 30}
          textAnchor="middle" dominantBaseline="central" fill="#FFFFFF"
          fontFamily="'JetBrains Mono', 'Fira Code', monospace"
          fontSize={10} fontWeight={600} opacity={0.85}
          style={shadowStyle}>
          {formatNumber(pct, 1)}%
        </text>
      )}
    </g>
  );
}

function TreemapLegend({ data }: { data: { name: string; value: number; pct: number; fill: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 px-4 pb-3 pt-2.5 border-t border-[var(--hud-border)] text-[10px] font-mono">
      {data.map(item => (
        <div key={item.name} className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.fill }} />
          <span className="text-[var(--hud-text-primary)] font-semibold">{item.name}:</span>
          <span className="text-[var(--hud-text-dim)]">{formatNumber(item.value, 2)} g</span>
          <span className="text-[var(--hud-text-dim)] opacity-60">({formatNumber(item.pct, 1)}%)</span>
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
  treemapId: string;
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
  treemapId,
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
          content={<CustomTreemapBlock accent={glowColor} glowColor={glowColor} treemapId={treemapId} />}
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
        <thead className="sticky top-0" style={{ background: 'var(--hud-bg-base)' }}>
          <tr>
            <th className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--hud-text-muted)] text-left px-4 py-2.5 border-b border-[var(--hud-border)]">ENTIDAD</th>
            <th className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--hud-text-muted)] text-right px-4 py-2.5 border-b border-[var(--hud-border)]">MASA TOTAL</th>
            <th className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--hud-text-muted)] text-right px-4 py-2.5 border-b border-[var(--hud-border)]">PROPORCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item.name} className="transition-colors duration-100 hover:bg-[var(--hud-bg-hover)]"
              style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
              <td className="px-4 py-2.5 text-[12px] font-mono text-[var(--hud-text-primary)]">
                <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle" style={{ background: item.fill }} />
                {item.name}
              </td>
              <td className="px-4 py-2.5 text-[12px] font-mono text-right font-semibold" style={{ color: item.fill }}>
                {formatWeightCell(item.value)}
              </td>
              <td className="px-4 py-2.5 text-[12px] font-mono text-right text-[var(--hud-text-dim)]">
                {formatNumber(item.pct, 1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <PanelCard
      accent={accent}
      className="flex-1"
      title={
        <>
          <div>
            <h3 className="text-xs font-semibold text-slate-100 font-mono tracking-wider uppercase">
              {title}
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{subtitle}</p>
          </div>
        </>
      }
      headerRight={
        <button
          onClick={onToggleView}
          className="flex items-center gap-1.5 text-[10px] font-mono font-semibold tracking-wider uppercase transition-colors hover:opacity-80 cursor-pointer"
          style={{ color: accent }}
        >
          {isTableMode ? <LayoutGrid className="w-3 h-3" /> : <Table2 className="w-3 h-3" />}
          {isTableMode ? 'GRÁFICA' : 'DETALLE'}
        </button>
      }
    >
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
        <div className="flex items-center justify-center py-20 text-[var(--hud-text-dim)]">
          <span className="text-xs font-mono text-[var(--hud-text-dim)]">Cargando gráfica...</span>
        </div>
      )}
    </PanelCard>
  );
}