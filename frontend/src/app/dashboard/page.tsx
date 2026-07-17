'use client';

import { useEffect, useState } from 'react';
import { HudCard } from '@/components/ui/hud-card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Treemap } from 'recharts';

const API = 'http://localhost:3001';

const bootSteps = [
  'INITIALIZING GOLD COMMAND CENTER...',
  'LOADING TACTICAL DATABASE...',
  'CALIBRATING SENSORS...',
  'ARMING SYSTEMS...',
  'READY.',
];

const mockChartData = [
  { month: 'ENE', ingresos: 450, egresos: 200 },
  { month: 'FEB', ingresos: 380, egresos: 310 },
  { month: 'MAR', ingresos: 520, egresos: 280 },
  { month: 'ABR', ingresos: 490, egresos: 410 },
  { month: 'MAY', ingresos: 610, egresos: 350 },
  { month: 'JUN', ingresos: 550, egresos: 430 },
];

interface TreeMapItem {
  name: string;
  size: number;
  rif: string;
  [key: string]: any;
}

function CustomTreemapContent(props: any) {
  const { x, y, width, height, name, size, depth } = props;
  if (depth !== 1) return null;
  const intensity = Math.min(1, Math.max(0.3, size / 500));
  const fill = `rgba(255, 157, 0, ${intensity})`;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#111111" strokeWidth={1} />
      {width > 60 && height > 40 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#e0e0e0" fontSize={10} fontFamily="JetBrains Mono">
            {name.length > 18 ? name.slice(0, 16) + '…' : name}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#ff9d00" fontSize={9} fontFamily="JetBrains Mono">
            {size.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
          </text>
        </>
      )}
    </g>
  );
}

function TreeMapTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-hud-surface border border-hud-border px-3 py-2 clip-tactical">
      <p className="text-xs text-hud-amber font-bold">{data.name}</p>
      <p className="text-[10px] text-hud-text">{data.rif}</p>
      <p className="text-[10px] text-hud-amber">
        {data.size.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [bootIndex, setBootIndex] = useState(-1);
  const [visible, setVisible] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [bars, setBars] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalBars: 0, inStock: 0, totalExits: 0 });
  const [error, setError] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBootIndex((prev) => {
        if (prev >= bootSteps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bootIndex >= bootSteps.length - 1) {
      const timer = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, [bootIndex]);

  useEffect(() => {
    if (!visible) return;
    Promise.all([
      fetch(`${API}/clients`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API}/bars`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API}/material-exits`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([clientsData, barsData, exitsData]) => {
        setClients(clientsData);
        setBars(barsData);
        setStats({
          totalBars: barsData.length,
          inStock: barsData.filter((b: any) => b.status === 'IN_STOCK').length,
          totalExits: exitsData.length,
        });
      })
      .catch(() => setError(true));
  }, [visible]);

  const treeMapData: TreeMapItem[] = clients.map((c) => ({
    name: c.name,
    rif: clients.find((x) => x.id === c.id)?.name || '',
    size: Number(
      bars
        .filter((b: any) => b.clientId === c.id && b.status === 'IN_STOCK')
        .reduce((s: number, b: any) => s + Number(b.fineWeight), 0),
    ),
  })).filter((d) => d.size > 0);

  if (!visible) {
    return (
      <div className="flex items-center justify-center h-full bg-hud-dark">
        <div className="text-center">
          <p className="text-hud-amber text-lg font-bold animate-pulse">
            {bootIndex >= 0 ? bootSteps[bootIndex] : ''}
          </p>
          {bootIndex < 0 && (
            <p className="text-hud-muted text-xs mt-4 animate-pulse">
              PRESS ANY KEY TO BOOT...
            </p>
          )}
          <div className="mt-6">
            <div className="w-48 h-[2px] bg-hud-border mx-auto overflow-hidden">
              <div
                className="h-full bg-hud-amber transition-all duration-300"
                style={{ width: `${((bootIndex + 1) / bootSteps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ animation: 'fade-in 0.6s ease-out' }}>
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-hud-amber text-lg font-bold tracking-wider">TACTICAL DASHBOARD</h2>
          <p className="text-hud-muted text-[10px] mt-1">GOLD INVENTORY STATUS // REAL-TIME</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-hud-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-hud-success animate-pulse" />
          LIVE
        </div>
      </header>

      <div className="grid grid-cols-4 gap-4">
        <div className="animate-[fade-in_0.4s_ease-out]">
          <HudCard title="Total Barras" value={String(stats.totalBars)} subtitle="Registradas en sistema" accent="amber" />
        </div>
        <div className="animate-[fade-in_0.5s_ease-out]">
          <HudCard title="En Bóveda" value={String(stats.inStock)} subtitle="Barras IN_STOCK" accent="success" />
        </div>
        <div className="animate-[fade-in_0.6s_ease-out]">
          <HudCard title="Egresos" value={String(stats.totalExits)} subtitle="Operaciones realizadas" accent="amber" />
        </div>
        <div className="animate-[fade-in_0.7s_ease-out]">
          <HudCard title="Clientes" value={String(clients.length)} subtitle="Registrados activos" accent="amber" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-hud-surface p-4 neon-border-amber clip-tactical">
          <p className="text-[11px] text-hud-muted tracking-wider mb-4">
            FLUJO DE ORO // INGRESOS VS EGRESOS
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="ingresosGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="egresosGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="month" stroke="#808080" tick={{ fontSize: 10 }} />
                <YAxis stroke="#808080" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 0, fontSize: 10 }}
                  labelStyle={{ color: '#ff9d00' }}
                />
                <Area
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#ingresosGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="egresos"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#egresosGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-hud-surface p-4 neon-border-amber clip-tactical">
          <p className="text-[11px] text-hud-muted tracking-wider mb-4">
            TREEMAP // DISTRIBUCIÓN POR CLIENTE
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treeMapData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#111111"
                fill="#ff9d00"
                content={<CustomTreemapContent />}
              >
                <Tooltip content={<TreeMapTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          </div>
          {treeMapData.length === 0 && (
            <p className="text-[10px] text-hud-muted text-center mt-2">NO DATA</p>
          )}
        </div>
      </div>
    </div>
  );
}
