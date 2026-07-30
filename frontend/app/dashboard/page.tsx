'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBars } from '@/hooks/useBars';
import { useClients } from '@/hooks/useClients';
import { useMaterialExits } from '@/hooks/useExits';
import { useProcesses } from '@/hooks/useProcesses';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import {
  ClipboardList, Flame, Warehouse, Inbox, TrendingDown,
  Scale, Pickaxe,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/format';
import DashboardFilters from '@/components/DashboardFilters';
import { EvidenceModal } from '@/components/dashboard/EvidenceModal';
import { SupplierDirectoryModal } from '@/components/dashboard/SupplierDirectoryModal';
import { BovedaModal } from '@/components/dashboard/BovedaModal';
import { KpiCardGrid, KPI_COLORS } from '@/components/dashboard/KpiCardGrid';
import { BalancesTable } from '@/components/dashboard/BalancesTable';
import { TreemapPanel } from '@/components/dashboard/TreemapPanel';

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

const KPI_ICONS = [ClipboardList, Flame, Warehouse, Inbox];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const GREEN_PALETTE = ['rgba(16, 185, 129, 0.6)', 'rgba(5, 150, 105, 0.6)', 'rgba(4, 120, 87, 0.6)'];

export default function V2DashboardPage() {
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterSupplierId, setFilterSupplierId] = useState('');
  const [filterClientId, setFilterClientId] = useState('');

  const filters = {
    startDate: filterStartDate || undefined,
    endDate: filterEndDate || undefined,
    supplierId: filterSupplierId || undefined,
    clientId: filterClientId || undefined,
  };

  const { data: bars = [] } = useBars({ includePorValidar: true });
  const { data: clients = [] } = useClients();
  const { data: exits = [] } = useMaterialExits();
  const { data: processes = [] } = useProcesses();
  const { data: metrics, isLoading } = useDashboardMetrics(
    filterStartDate || filterEndDate || filterSupplierId || filterClientId
      ? filters
      : undefined,
  );

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const [showTableIngresos, setShowTableIngresos] = useState(false);
  const [showTableEgresos, setShowTableEgresos] = useState(false);
  const [isIngresoModalOpen, setIsIngresoModalOpen] = useState(false);
  const [isProcesoModalOpen, setIsProcesoModalOpen] = useState(false);
  const [isBovedaModalOpen, setIsBovedaModalOpen] = useState(false);
  const [isPorRefundirModalOpen, setIsPorRefundirModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isClientBarModalOpen, setIsClientBarModalOpen] = useState(false);
  const [evidenceBarId, setEvidenceBarId] = useState<string | null>(null);

  const filteredBars = useMemo(() => {
    let result = bars;
    if (filterSupplierId) result = result.filter((b) => b.clientId === filterSupplierId);
    if (filterStartDate) result = result.filter((b) => new Date(b.createdAt) >= new Date(filterStartDate));
    if (filterEndDate) result = result.filter((b) => new Date(b.createdAt) <= new Date(filterEndDate + 'T23:59:59'));
    return result;
  }, [bars, filterSupplierId, filterStartDate, filterEndDate]);

  const filteredExits = useMemo(() => {
    let result = exits;
    if (filterClientId) {
      result = result.filter((e) =>
        e.exitDetails.some((d) => d.lot?.process?.client?.id === filterClientId),
      );
    }
    if (filterStartDate) result = result.filter((e) => new Date(e.createdAt) >= new Date(filterStartDate));
    if (filterEndDate) result = result.filter((e) => new Date(e.createdAt) <= new Date(filterEndDate + 'T23:59:59'));
    return result;
  }, [exits, filterClientId, filterStartDate, filterEndDate]);

  const ingresoBars = filteredBars;

  const procesoBars = useMemo(
    () => filteredBars.filter((b) => b.status === 'PROCESANDO'),
    [filteredBars],
  );

  const inStockBars = useMemo(
    () => filteredBars.filter((b) => b.status === 'IN_STOCK'),
    [filteredBars],
  );

  const bovedaLots = useMemo(() => {
    return processes
      .filter((p) => p.status === 'CLOSED')
      .flatMap((p) =>
        (p.lots ?? [])
          .filter((l) => l.recovered != null)
          .map((l) => ({ ...l, process: p, client: p.client })),
      )
      .filter((l) => {
        if (filterClientId) return l.client?.id === filterClientId;
        return true;
      });
  }, [processes, filterClientId]);

  const flowData = useMemo(() => {
    const days: Record<string, { in: number; out: number }> = {};
    filteredBars.forEach(b => {
      const d = new Date(b.createdAt).toISOString().split('T')[0];
      if (!days[d]) days[d] = { in: 0, out: 0 };
      days[d].in += Number(b.fineWeight);
    });
    filteredExits.forEach(e => {
      const d = new Date(e.createdAt).toISOString().split('T')[0];
      if (!days[d]) days[d] = { in: 0, out: 0 };
      days[d].out += Number(e.totalWeight);
    });
    return Object.values(days);
  }, [filteredBars, filteredExits]);

  const sparkIn = useMemo(() => flowData.map(d => d.in).slice(-14), [flowData]);
  const sparkOut = useMemo(() => flowData.map(d => d.out).slice(-14), [flowData]);
  const sparkNet = useMemo(() => flowData.map(d => d.in - d.out).slice(-14), [flowData]);
  const sparkMerma = useMemo(() => flowData.map(d => Math.abs(d.in - d.out) * 0.02).slice(-14), [flowData]);
  const sparkPorRefundir = useMemo(() => flowData.map(d => d.in).slice(-14), [flowData]);

  const sparkFundido = useMemo(() => {
    const days: Record<string, number> = {};
    filteredBars
      .filter(b => b.status === 'COMPLETADO' || b.status === 'EXITED')
      .forEach(b => {
        const d = new Date(b.createdAt).toISOString().split('T')[0];
        days[d] = (days[d] || 0) + Number(b.fineWeight);
      });
    return Object.values(days).slice(-14);
  }, [filteredBars]);

  const sparkSinFundir = useMemo(() => {
    const days: Record<string, number> = {};
    filteredBars
      .filter(b => b.status === 'IN_STOCK')
      .forEach(b => {
        const d = new Date(b.createdAt).toISOString().split('T')[0];
        days[d] = (days[d] || 0) + Number(b.fineWeight);
      });
    return Object.values(days).slice(-14);
  }, [filteredBars]);

  const clientBalances = useMemo(() => {
    if (!clients || !filteredBars) return [];
    return clients.map(client => {
      const clientBars = filteredBars.filter(b => b.clientId === client.id);
      const ingresoBruto = clientBars.reduce((s, b) => s + Number(b.grossWeight), 0);
      const fa = clientBars.reduce((s, b) => s + Number(b.fineWeight), 0);
      const clientProcesses = processes.filter(p => p.clientId === client.id);
      const r = clientProcesses.reduce((s, p) =>
        s + (p.lots?.reduce((sl, l) => sl + Number(l.recovered ?? 0), 0) ?? 0), 0);
      const clientExits = filteredExits.filter(e =>
        e.exitDetails.some(d => d.lot?.process?.client?.id === client.id));
      const egresos = clientExits.reduce((s, e) => s + Number(e.totalWeight), 0);
      const balance = fa + r - egresos;
      const faProcesado = clientBars
        .filter(b => b.status === 'COMPLETADO' || b.status === 'EXITED')
        .reduce((s, b) => s + Number(b.fineWeight), 0);
      const mermaG = Math.max(0, faProcesado - r);
      const mermaPct = faProcesado > 0 ? (mermaG / faProcesado) * 100 : 0;
      return { id: client.id, name: client.name, ingresoBruto, fa, r, egresos, balance, mermaG, mermaPct };
    })
      .filter(c => c.ingresoBruto > 0 || c.fa > 0 || c.egresos > 0)
      .sort((a, b) => b.ingresoBruto - a.ingresoBruto);
  }, [clients, filteredBars, processes, filteredExits]);

  const totalBalance = useMemo(
    () => clientBalances.reduce((s, c) => s + c.balance, 0),
    [clientBalances],
  );

  const ingresosTreemap = useMemo(() => {
    const map: Record<string, number> = {};
    filteredBars.forEach(b => {
      const name = b.client?.name || 'Desconocido';
      map[name] = (map[name] || 0) + Number(b.grossWeight);
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    const maxVal = Math.max(...Object.values(map), 1);
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .map(({ name, value }, idx) => ({
        name, value,
        pct: total > 0 ? (value / total) * 100 : 0,
        fill: GREEN_PALETTE[idx % GREEN_PALETTE.length],
      }));
  }, [filteredBars]);

  const egresosTreemap = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExits.forEach(e => {
      e.exitDetails.forEach(d => {
        const clientName = d.lot?.process?.client?.name || e.destination || 'Desconocido';
        map[clientName] = (map[clientName] || 0) + Number(d.weightAported);
      });
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    const maxVal = Math.max(...Object.values(map), 1);
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .map(({ name, value }, idx) => ({
        name, value,
        pct: total > 0 ? (value / total) * 100 : 0,
        fill: GREEN_PALETTE[idx % GREEN_PALETTE.length],
      }));
  }, [filteredExits]);

  const kpiData = [
    {
      label: 'Oro Recibido',
      value: metrics?.oroRecibido.fineWeight ?? 0,
      subicon: Scale,
      sublabel: `Peso Fino total: ${formatNumber(metrics?.oroRecibido.fineWeight ?? 0, 2)} g`,
      accent: KPI_COLORS[0].accent,
      tag: KPI_COLORS[0].label,
      postfix: '',
      spark: sparkIn,
    },
    {
      label: 'Oro en Proceso',
      value: metrics?.oroEnProceso.fineWeight ?? 0,
      subicon: Flame,
      sublabel: `Barras en horno: ${metrics?.oroEnProceso.barCount ?? 0} u`,
      accent: KPI_COLORS[1].accent,
      tag: KPI_COLORS[1].label,
      postfix: '',
      spark: sparkOut,
    },
    {
      label: 'Oro en Bóveda',
      value: metrics?.oroEnBoveda.fineWeight ?? 0,
      subicon: Warehouse,
      sublabel: '',
      accent: KPI_COLORS[2].accent,
      tag: KPI_COLORS[2].label,
      postfix: '',
      spark: sparkNet,
      sparks: [
        { data: sparkFundido, color: '#10B981', label: 'Fundido' },
        { data: sparkSinFundir, color: '#F97316', label: 'Sin Fundir' },
      ],
      subValues: [
        { label: 'Fundido', value: metrics?.oroEnBoveda.fundido ?? 0, icon: Warehouse },
        { label: 'Sin Fundir', value: metrics?.oroEnBoveda.sinFundir ?? 0, icon: Inbox },
      ],
    },
    {
      label: 'Por Refundir',
      value: metrics?.porRefundir.fineWeight ?? 0,
      subicon: Inbox,
      sublabel: `Barras en stock: ${formatNumber(metrics?.porRefundir.fineWeight ?? 0, 2)} g en espera`,
      accent: KPI_COLORS[3].accent,
      tag: KPI_COLORS[3].label,
      postfix: '',
      spark: sparkPorRefundir,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      {/* Filters */}
      <div className="mb-10">
        <DashboardFilters
          startDate={filterStartDate}
          endDate={filterEndDate}
          supplierId={filterSupplierId}
          clientId={filterClientId}
          onChange={({ startDate, endDate, supplierId, clientId }) => {
            setFilterStartDate(startDate);
            setFilterEndDate(endDate);
            setFilterSupplierId(supplierId);
            setFilterClientId(clientId);
          }}
        />
      </div>

      {/* KPI Cards */}
      <KpiCardGrid
        kpiData={kpiData}
        isMounted={isMounted}
        onCardClick={(idx) => {
          if (idx === 0) setIsIngresoModalOpen(true);
          else if (idx === 1) setIsProcesoModalOpen(true);
          else if (idx === 2) setIsBovedaModalOpen(true);
          else if (idx === 3) setIsPorRefundirModalOpen(true);
        }}
      />

      {/* Treemaps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <TreemapPanel
          title="INGRESOS POR PROVEEDOR"
          subtitle="Proporción de masa bruta recibida"
          data={ingresosTreemap}
          accent="var(--pm-accent-gold)"
          glowColor="#EAB308"
          scaleLabel="PROVEEDOR"
          isTableMode={showTableIngresos}
          isMounted={isMounted}
          onToggleView={() => setShowTableIngresos(!showTableIngresos)}
          emptyIcon={Scale}
          emptyLabel="SIN DATOS DE INGRESOS"
        />
        <TreemapPanel
          title="EGRESOS POR CLIENTE"
          subtitle="Proporción de masa despachada"
          data={egresosTreemap}
          accent="var(--pm-accent-sky)"
          glowColor="#D97706"
          scaleLabel="CLIENTE"
          isTableMode={showTableEgresos}
          isMounted={isMounted}
          onToggleView={() => setShowTableEgresos(!showTableEgresos)}
          emptyIcon={TrendingDown}
          emptyLabel="SIN DATOS DE EGRESOS"
        />
      </div>

      {/* Balances Table */}
      <BalancesTable
        clientBalances={clientBalances}
        totalBalance={totalBalance}
        onClientClick={(id) => { setSelectedClientId(id); setIsClientBarModalOpen(true); }}
      />

      {/* Footer note */}
      <p className="text-[9px] text-[var(--pm-text-dim)] font-mono text-center opacity-50 mt-5">
        Datos actualizados en tiempo real · Bandes v2 Premium
      </p>

      {/* Client bar detail modal — triggered from balance table row */}
      <SupplierDirectoryModal
        isOpen={isClientBarModalOpen && !!selectedClientId}
        title={clients.find((cl) => cl.id === selectedClientId)?.name ?? 'Detalle de barras'}
        filterSupplierId={selectedClientId}
        bars={ingresoBars}
        clients={clients}
        onClose={() => setIsClientBarModalOpen(false)}
        onBarClick={(id) => setEvidenceBarId(id)}
      />

      {/* Supplier directory modal — triggered from Oro Recibido card */}
      <SupplierDirectoryModal
        isOpen={isIngresoModalOpen}
        title="Material Ingresado"
        showSearch
        bars={ingresoBars}
        clients={clients}
        onClose={() => setIsIngresoModalOpen(false)}
        onBarClick={(id) => setEvidenceBarId(id)}
      />

      {/* Oro en Proceso modal — triggered from card index 1 */}
      <SupplierDirectoryModal
        isOpen={isProcesoModalOpen}
        title="Oro en Proceso"
        showSearch
        bars={procesoBars}
        clients={clients}
        onClose={() => setIsProcesoModalOpen(false)}
        onBarClick={(id) => setEvidenceBarId(id)}
      />

      {/* Oro en Bóveda modal — triggered from card index 2 */}
      <BovedaModal
        isOpen={isBovedaModalOpen}
        lots={bovedaLots}
        bars={inStockBars}
        clients={clients}
        onClose={() => setIsBovedaModalOpen(false)}
        onBarClick={(id) => setEvidenceBarId(id)}
      />

      {/* Por Refundir modal — triggered from card index 3 */}
      <SupplierDirectoryModal
        isOpen={isPorRefundirModalOpen}
        title="Por Refundir"
        showSearch
        bars={inStockBars}
        clients={clients}
        onClose={() => setIsPorRefundirModalOpen(false)}
        onBarClick={(id) => setEvidenceBarId(id)}
      />

      {/* Evidence Modal — triggered from SupplierDirectory bar row click */}
      <AnimatePresence>
        <EvidenceModal barId={evidenceBarId} bars={bars} onClose={() => setEvidenceBarId(null)} />
      </AnimatePresence>
    </motion.div>
  );
}
