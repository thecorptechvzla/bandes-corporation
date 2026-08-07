'use client';

import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, CartesianGrid, LabelList,
} from 'recharts';
import { formatNumber } from '@/lib/format';
import type { ClientBalance } from '@/types/api';
import { PanelCard } from '@/components/dashboard/PanelCard';

interface ChartEntry {
  id: string;
  displayName: string;
  balanceGross: number;
}

interface ClientBalancesBarChartProps {
  clientBalances: ClientBalance[];
  isMounted: boolean;
  onBarClick?: (clientId: string) => void;
}

const BALANCE_COLORS = [
  ['#0F2840', '#38BDF8'],   // sky
  ['#0D3524', '#10B981'],   // emerald
  ['#35270D', '#EAB308'],   // gold
  ['#0F3235', '#0D9488'],   // teal
];

const formatLabel = (v: number) => `${formatNumber(v, 2)} g`;

interface CustomBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  fill?: string;
  payload?: ChartEntry;
  onClick?: (id: string) => void;
}

function CustomNeonBar(props: CustomBarProps) {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, payload } = props;
  if (width <= 0 || height <= 0 || !payload) return null;

  const [dark, bright] = BALANCE_COLORS[index % BALANCE_COLORS.length];

  const gid = `balance-bar-${index}-${payload.id}`;
  const rx = 6;
  const capWidth = Math.min(3, width);

  return (
    <g className="cursor-pointer" onClick={() => props.onClick?.(payload.id)}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={dark} stopOpacity={1} />
          <stop offset="100%" stopColor={bright} stopOpacity={1} />
        </linearGradient>
      </defs>
      {/* Barra principal — degradado oscuro→brillante */}
      <rect x={x} y={y} width={width} height={height} fill={`url(#${gid})`} rx={rx} />
      {/* Cap neón brillante en extremo derecho */}
      <rect x={x + width - capWidth} y={y} width={capWidth} height={height} fill={bright} rx={capWidth} />
    </g>
  );
}

export function ClientBalancesBarChart({ clientBalances, isMounted, onBarClick }: ClientBalancesBarChartProps) {
  const chartData = useMemo<ChartEntry[]>(() => {
    return clientBalances
      .slice(0, 8)
      .map((c) => ({
        id: c.id,
        displayName: c.name.length > 14 ? `${c.name.slice(0, 12)}…` : c.name,
        balanceGross: c.ingresoBruto,
      }))
      .reverse();
  }, [clientBalances]);

  const hasData = chartData.length > 0;

  return (
    <PanelCard
      accent="#0D9488"
      delay={0.30}
      title={
        <>
          <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
          <h3 className="text-xs font-semibold text-slate-100 font-mono tracking-wider uppercase">
            Top Balances
          </h3>
          <span className="text-[10px] text-slate-500 font-mono ml-2">por proveedor</span>
        </>
      }
    >
      {!hasData || !isMounted ? (
        <div className="flex items-center justify-center py-20">
          <span className="text-xs font-mono text-slate-500">Sin datos de balances</span>
        </div>
      ) : (
        <div className="px-3 pt-3 pb-3 flex-1 min-h-0">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 48, bottom: 0, left: 0 }}>
              <CartesianGrid
                strokeDasharray="4 8"
                stroke="rgba(30,41,59,0.4)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: 'var(--hud-text-dim)', fontFamily: 'var(--hud-font-mono)' }}
                axisLine={{ stroke: 'rgba(30,41,59,0.6)' }}
                tickLine={false}
                tickFormatter={(v: number) => formatNumber(v, 0)}
                tickCount={5}
              />
              <YAxis
                type="category"
                dataKey="displayName"
                tick={{ fontSize: 10, fill: 'var(--hud-text-dim)', fontFamily: 'var(--hud-font-sans)' }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Bar
                dataKey="balanceGross"
                barSize={18}
                isAnimationActive={isMounted}
                animationDuration={1000}
                animationEasing="ease-out"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                shape={(props: any) => (
                  <CustomNeonBar
                    x={props.x}
                    y={props.y}
                    width={props.width}
                    height={props.height}
                    index={props.index}
                    payload={props.payload}
                    onClick={onBarClick}
                  />
                )}
              >
                <LabelList
                  dataKey="balanceGross"
                  position="insideEnd"
                  offset={10}
                  formatter={formatLabel}
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--hud-font-mono)',
                    fontWeight: 700,
                    fill: '#fff',
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </PanelCard>
  );
}