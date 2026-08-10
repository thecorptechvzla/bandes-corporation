'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBars } from '@/hooks/useBars';
import { useClients } from '@/hooks/useClients';
import { useMaterialExits } from '@/hooks/useExits';
import { useProcesses } from '@/hooks/useProcesses';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import {
  Flame, Warehouse, Inbox, TrendingDown, Scale, ArrowUpRight,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/format';
import DashboardFilters from '@/components/DashboardFilters';
import { EvidenceModal } from '@/components/dashboard/EvidenceModal';
import { SupplierDirectoryModal } from '@/components/dashboard/SupplierDirectoryModal';
import { ProcesoModal } from '@/components/dashboard/ProcesoModal';
import { BovedaModal } from '@/components/dashboard/BovedaModal';
import { KpiCardGrid, KPI_COLORS } from '@/components/dashboard/KpiCardGrid';
import { ExitedBarsModal } from '@/components/dashboard/ExitedBarsModal';
import { BalancesTable } from '@/components/dashboard/BalancesTable';
import { computeClientEgresoBR } from '@/lib/prorateEgresoBR';
import { TreemapPanel } from '@/components/dashboard/TreemapPanel';
import { FlowAreaChart } from '@/components/dashboard/FlowAreaChart';
import { ClientBalancesBarChart } from '@/components/dashboard/ClientBalancesBarChart';
import { InventoryDonutChart } from '@/components/dashboard/InventoryDonutChart';
import { INGRESOS_RAMP, EGRESOS_RAMP, sequentialFill } from '@/lib/treemapColors';

function SparklineArea({ data, color, id }: { data: number[]; color: string; id: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] opacity-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.15} />
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
  const [isEgresadoModalOpen, setIsEgresadoModalOpen] = useState(false);
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
        (e.bars ?? []).some((b) => b.clientId === filterClientId)
        || (e.exitDetails ?? []).some((d) =>
          (d.bars ?? []).some((b) => b.clientId === filterClientId),
        ),
      );
    }
    if (filterStartDate) result = result.filter((e) => new Date(e.createdAt) >= new Date(filterStartDate));
    if (filterEndDate) result = result.filter((e) => new Date(e.createdAt) <= new Date(filterEndDate + 'T23:59:59'));
    return result;
  }, [exits, filterClientId, filterStartDate, filterEndDate]);

  const ingresoBars = filteredBars;

  const totalIngresoGross = useMemo(
    () => ingresoBars.reduce((s, b) => s + Number(b.grossWeight), 0),
    [ingresoBars],
  );

  const procesoBars = useMemo(
    () => filteredBars.filter((b) => b.status === 'PROCESANDO'),
    [filteredBars],
  );

  const procesoGross = useMemo(
    () => procesoBars.reduce((s, b) => s + Number(b.grossWeight), 0),
    [procesoBars],
  );

  const inStockBars = useMemo(
    () => filteredBars.filter((b) => b.status === 'IN_STOCK'),
    [filteredBars],
  );

  const dispatchedLotIds = useMemo(
    () =>
      new Set(
        exits.flatMap((e) =>
          (e.exitDetails ?? []).map((d) => d.lotId).filter(Boolean),
        ),
      ),
    [exits],
  );

  const bovedaLots = useMemo(() => {
    return processes
      .filter((p) => p.status === 'CLOSED')
      .flatMap((p) =>
        (p.lots ?? [])
          .filter((l) => l.recovered != null && !dispatchedLotIds.has(l.id))
          .map((l) => ({ ...l, process: p, client: p.client })),
      )
      .filter((l) => {
        if (filterClientId) return l.client?.id === filterClientId;
        return true;
      });
  }, [processes, filterClientId, dispatchedLotIds]);

  const flowData = useMemo(() => {
    const days: Record<string, { in: number; out: number }> = {};
    filteredBars.forEach(b => {
      const d = new Date(b.createdAt).toISOString().split('T')[0];
      if (!days[d]) days[d] = { in: 0, out: 0 };
      days[d].in += Number(b.grossWeight);
    });
    filteredExits.forEach(e => {
      const d = new Date(e.createdAt).toISOString().split('T')[0];
      if (!days[d]) days[d] = { in: 0, out: 0 };
      const outGross =
        (e.bars ?? []).reduce((s, b) => s + Number(b.grossWeight), 0)
        + (e.exitDetails ?? []).reduce(
            (s, dt) => s + (dt.bars ?? []).reduce((s2, b) => s2 + Number(b.grossWeight), 0),
            0,
          );
      days[d].out += outGross;
    });
    return Object.values(days);
  }, [filteredBars, filteredExits]);

  const sparkIn = useMemo(() => flowData.map(d => d.in).slice(-14), [flowData]);
  const sparkOut = useMemo(() => flowData.map(d => d.out).slice(-14), [flowData]);
  const sparkNet = useMemo(() => flowData.map(d => d.in - d.out).slice(-14), [flowData]);
  const sparkPorRefundir = useMemo(() => flowData.map(d => d.in).slice(-14), [flowData]);

  const egresadoGross = useMemo(
    () => filteredBars
      .filter(b => b.status === 'EXITED')
      .reduce((s, b) => s + Number(b.grossWeight), 0),
    [filteredBars],
  );

  const egresadoBalanza = useMemo(
    () =>
      filteredExits.reduce(
        (s, e) =>
          s
          + (e.exitDetails ?? []).reduce(
              (sd, d) => sd + Number(d.lot?.recovered ?? d.weightAported ?? 0),
              0,
            )
          + (e.bars ?? []).reduce((sb, b) => sb + Number(b.grossWeight ?? 0), 0),
        0,
      ),
    [filteredExits],
  );

  const egresadoMerma = egresadoGross - egresadoBalanza;

  const sparkEgresado = useMemo(() => {
    const days: Record<string, number> = {};
    filteredBars
      .filter(b => b.status === 'EXITED')
      .forEach(b => {
        const d = new Date(b.createdAt).toISOString().split('T')[0];
        days[d] = (days[d] || 0) + Number(b.grossWeight);
      });
    return Object.values(days).slice(-14);
  }, [filteredBars]);

  const sparkFundido = useMemo(() => {
    const days: Record<string, number> = {};
    filteredBars
      .filter(b => b.status === 'COMPLETADO' || b.status === 'EXITED')
      .forEach(b => {
        const d = new Date(b.createdAt).toISOString().split('T')[0];
        days[d] = (days[d] || 0) + Number(b.grossWeight);
      });
    return Object.values(days).slice(-14);
  }, [filteredBars]);

  const sparkSinFundir = useMemo(() => {
    const days: Record<string, number> = {};
    filteredBars
      .filter(b => b.status === 'IN_STOCK')
      .forEach(b => {
        const d = new Date(b.createdAt).toISOString().split('T')[0];
        days[d] = (days[d] || 0) + Number(b.grossWeight);
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
      const lotRecovered = (lots: { id: string; recovered?: number | null }[]) =>
        lots
          .filter((l) => !dispatchedLotIds.has(l.id))
          .reduce((sl, l) => sl + Number(l.recovered ?? 0), 0);
      const r = clientProcesses.reduce((s, p) => s + lotRecovered(p.lots ?? []), 0);
      const egresoBI = clientBars
        .filter(b => b.status === 'EXITED')
        .reduce((s, b) => s + Number(b.grossWeight), 0);
      const egresoBR = filteredExits.reduce(
        (sum, e) => sum + computeClientEgresoBR(e, client.id),
        0,
      );
      const egresos = egresoBI;
      const balance = ingresoBruto - egresos;
      const leyAu = ingresoBruto > 0 ? (fa / ingresoBruto) * 1000 : 0;
      const sinFundir = Math.max(0, fa - r);
      const mermaG = egresoBI - egresoBR;
      const mermaPct = egresoBI > 0 ? (mermaG / egresoBI) * 100 : 0;
      return { id: client.id, name: client.name, ingresoBruto, fa, leyAu, ingreso: fa, r, sinFundir, egresos, egresoBI, egresoBR, balance, mermaG, mermaPct };
    })
      .filter(c => c.ingresoBruto > 0 || c.fa > 0 || c.egresos > 0)
      .sort((a, b) => b.ingresoBruto - a.ingresoBruto);
  }, [clients, filteredBars, processes, filteredExits, dispatchedLotIds]);

  const totalBalance = useMemo(
    () => clientBalances.reduce((s, c) => s + c.ingresoBruto, 0),
    [clientBalances],
  );

  const lotGrossWeight = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of bovedaLots) map[l.id] = Number(l.recovered ?? 0);
    for (const b of bars) if (b.lotId && b.status !== 'EXITED' && !(b.lotId in map)) map[b.lotId] = (map[b.lotId] || 0) + Number(b.grossWeight);
    return map;
  }, [bovedaLots, bars]);

  const lotFineWeight = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of bovedaLots) map[l.id] = l.fineWeight != null ? Number(l.fineWeight) : 0;
    for (const b of bars) if (b.lotId && b.status !== 'EXITED' && !(b.lotId in map)) map[b.lotId] = (map[b.lotId] || 0) + Number(b.fineWeight);
    return map;
  }, [bovedaLots, bars]);

  const sinFundirGross = useMemo(
    () => inStockBars.reduce((s, b) => s + Number(b.grossWeight), 0),
    [inStockBars],
  );

  const fundidoGross = useMemo(
    () => bovedaLots.reduce((s, l) => s + Number(l.recovered ?? 0), 0),
    [bovedaLots],
  );

  const bovedaGross = fundidoGross + sinFundirGross;

  const ingresosTreemap = useMemo(() => {
    const map: Record<string, number> = {};
    filteredBars.forEach(b => {
      const name = b.client?.name || 'Desconocido';
      map[name] = (map[name] || 0) + Number(b.grossWeight);
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    const maxValue = Math.max(...Object.values(map), 0);
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .map(({ name, value }) => ({
        name, value,
        pct: total > 0 ? (value / total) * 100 : 0,
        fill: sequentialFill(value, maxValue, INGRESOS_RAMP),
        depth: 1,
      }));
  }, [filteredBars]);

  const egresosTreemap = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExits.forEach(e => {
      (e.bars ?? []).forEach(b => {
        const name = b.client?.name || e.destination || 'Desconocido';
        map[name] = (map[name] || 0) + Number(b.grossWeight);
      });
      (e.exitDetails ?? []).forEach(d => {
        (d.bars ?? []).forEach(b => {
          const name = d.lot?.process?.client?.name || b.client?.name || e.destination || 'Desconocido';
          map[name] = (map[name] || 0) + Number(b.grossWeight);
        });
      });
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    const maxValue = Math.max(...Object.values(map), 0);
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .map(({ name, value }) => ({
        name, value,
        pct: total > 0 ? (value / total) * 100 : 0,
        fill: sequentialFill(value, maxValue, EGRESOS_RAMP),
        depth: 1,
      }));
  }, [filteredExits]);

  const kpiData = [
    {
      label: 'Oro Ingresado',
      value: totalIngresoGross,
      subicon: Scale,
      sublabel: `PESO BRUTO: ${formatNumber(totalIngresoGross, 2)} g`,
      accent: KPI_COLORS[0].accent,
      tag: 'PESO BRUTO',
      postfix: '',
      spark: sparkIn,
    },
    {
      label: 'Oro en Proceso',
      value: procesoGross,
      subicon: Flame,
      sublabel: `Barras en horno: ${metrics?.oroEnProceso.barCount ?? 0} u`,
      accent: KPI_COLORS[1].accent,
      tag: KPI_COLORS[1].label,
      postfix: '',
      spark: sparkOut,
    },
    {
      label: 'Oro en Bóveda',
      value: bovedaGross,
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
        { label: 'Fundido', value: fundidoGross, icon: Warehouse },
        { label: 'Sin Fundir', value: sinFundirGross, icon: Inbox },
      ],
    },
    {
      label: 'Por Refundir',
      value: sinFundirGross,
      subicon: Inbox,
      sublabel: `Barras en stock: ${formatNumber(sinFundirGross, 2)} g en espera`,
      accent: KPI_COLORS[3].accent,
      tag: KPI_COLORS[3].label,
      postfix: '',
      spark: sparkPorRefundir,
    },
    {
      label: 'Oro Egresado',
      value: egresadoBalanza,
      subicon: ArrowUpRight,
      sublabel: `BI: ${formatNumber(egresadoGross, 2)} g | M: ${formatNumber(egresadoMerma, 2)} g`,
      accent: KPI_COLORS[4].accent,
      tag: 'DESPACHADO',
      postfix: '',
      spark: sparkEgresado,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      {/* Filters */}
      <div className="mb-8">
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

      {/* ═══ BENTO GRID — 12 COL ═══ */}
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>

        {/* ── Fila 1: KPIs (full width) ── */}
        <div className="col-span-12">
          <KpiCardGrid
            kpiData={kpiData}
            isMounted={isMounted}
            onCardClick={(idx) => {
              if (idx === 0) setIsIngresoModalOpen(true);
              else if (idx === 1) setIsProcesoModalOpen(true);
              else if (idx === 2) setIsBovedaModalOpen(true);
              else if (idx === 3) setIsPorRefundirModalOpen(true);
              else if (idx === 4) setIsEgresadoModalOpen(true);
            }}
          />
        </div>

        {/* ── Fila 2: Flujo de Material + Donut Bóveda ── */}
        <div className="col-span-12 lg:col-span-8">
          <FlowAreaChart data={metrics?.dailyFlow ?? []} isMounted={isMounted} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <InventoryDonutChart
            fundido={fundidoGross}
            sinFundir={sinFundirGross}
            isMounted={isMounted}
          />
        </div>

        {/* ── Fila 3: Treemap Ingresos (6) + Treemap Egresos (6) ── */}
        <div className="col-span-12 lg:col-span-6 flex flex-col">
          <TreemapPanel
            title="INGRESOS POR PROVEEDOR"
            subtitle="Proporción de masa bruta recibida"
            data={ingresosTreemap}
            accent="#10B981"
            glowColor="#10B981"
            scaleLabel="PROVEEDOR"
            isTableMode={showTableIngresos}
            isMounted={isMounted}
            onToggleView={() => setShowTableIngresos(!showTableIngresos)}
            emptyIcon={Scale}
            emptyLabel="SIN DATOS DE INGRESOS"
            treemapId="ingresos"
          />
        </div>
        <div className="col-span-12 lg:col-span-6 flex flex-col">
          <TreemapPanel
            title="EGRESOS POR CLIENTE"
            subtitle="Proporción de masa despachada"
            data={egresosTreemap}
            accent="#0D9488"
            glowColor="#0D9488"
            scaleLabel="CLIENTE"
            isTableMode={showTableEgresos}
            isMounted={isMounted}
            onToggleView={() => setShowTableEgresos(!showTableEgresos)}
            emptyIcon={TrendingDown}
            emptyLabel="SIN DATOS DE EGRESOS"
            treemapId="egresos"
          />
        </div>

        {/* ── Fila 4: Tabla Balances (8 col) + Top Balances Chart (4 col) ── */}
        <div className="col-span-12 lg:col-span-8">
          <BalancesTable
            clientBalances={clientBalances}
            totalBalance={totalBalance}
            onClientClick={(id) => { setSelectedClientId(id); setIsClientBarModalOpen(true); }}
          />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <ClientBalancesBarChart clientBalances={clientBalances} isMounted={isMounted} onBarClick={(id) => { setSelectedClientId(id); setIsClientBarModalOpen(true); }} />
        </div>
      </div>

      {/* Footer note */}
      <p className="text-[10px] text-[var(--hud-text-muted)] font-mono text-center mt-6">
        Datos actualizados en tiempo real · Bandes Analytics
      </p>

      {/* ═══ MODALS ═══ */}

      {/* Client bar detail modal */}
      <SupplierDirectoryModal
        isOpen={isClientBarModalOpen && !!selectedClientId}
        title={clients.find((cl) => cl.id === selectedClientId)?.name ?? 'Detalle de barras'}
        filterSupplierId={selectedClientId}
        bars={ingresoBars}
        clients={clients}
        onClose={() => setIsClientBarModalOpen(false)}
        onBarClick={(id) => setEvidenceBarId(id)}
      />

      {/* Supplier directory modal — Oro Recibido */}
      <SupplierDirectoryModal
        isOpen={isIngresoModalOpen}
        title="Material Ingresado"
        showSearch
        bars={ingresoBars}
        clients={clients}
        onClose={() => setIsIngresoModalOpen(false)}
        onBarClick={(id) => setEvidenceBarId(id)}
      />

      {/* Oro en Proceso modal */}
      <ProcesoModal
        isOpen={isProcesoModalOpen}
        title="Oro en Proceso"
        processes={processes}
        bars={procesoBars}
        onClose={() => setIsProcesoModalOpen(false)}
        onBarClick={(id) => setEvidenceBarId(id)}
      />

      {/* Oro en Bóveda modal */}
      <BovedaModal
        isOpen={isBovedaModalOpen}
        lots={bovedaLots}
        bars={inStockBars}
        allBars={bars}
        clients={clients}
        lotGrossWeight={lotGrossWeight}
        lotFineWeight={lotFineWeight}
        onClose={() => setIsBovedaModalOpen(false)}
        onBarClick={(id) => setEvidenceBarId(id)}
      />

      {/* Por Refundir modal */}
      <SupplierDirectoryModal
        isOpen={isPorRefundirModalOpen}
        title="Por Refundir"
        showSearch
        bars={inStockBars}
        clients={clients}
        onClose={() => setIsPorRefundirModalOpen(false)}
        onBarClick={(id) => setEvidenceBarId(id)}
      />

      {/* Barras Egresadas modal */}
      <ExitedBarsModal
        isOpen={isEgresadoModalOpen}
        title="Barras Egresadas"
        showSearch
        exits={filteredExits}
        bars={bars}
        onClose={() => setIsEgresadoModalOpen(false)}
        onBarClick={(id) => setEvidenceBarId(id)}
      />

      {/* Evidence Modal */}
      <AnimatePresence>
        <EvidenceModal barId={evidenceBarId} bars={bars} onClose={() => setEvidenceBarId(null)} />
      </AnimatePresence>
    </motion.div>
  );
}
