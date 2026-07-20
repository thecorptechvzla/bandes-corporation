'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useBars } from '@/hooks/useBars';
import { useMaterialExits } from '@/hooks/useExits';
import { useClients } from '@/hooks/useClients';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useGoldTraceability } from '@/context/GoldTraceabilityContext';
import { formatWeight } from '@/lib/format';
import { MetricsHUD, type MetricItem } from '@/components/tactical/MetricsHUD';
import { ScannerTable, type ColumnDef } from '@/components/tactical/ScannerTable';
import { TacticalCard } from '@/components/tactical/TacticalCard';
import { TerminalPanel } from '@/components/tactical/TerminalPanel';

export default function TacticalDashboardPage() {
  const { data: bars = [] } = useBars();
  const { data: clients = [] } = useClients();
  const { data: exits = [] } = useMaterialExits();
  const { data: metrics, isLoading } = useDashboardMetrics();
  const { weightUnit } = useGoldTraceability();

  const metricsItems: MetricItem[] = useMemo(() => [
    {
      key: 'oro-recibido',
      label: 'ORO RECIBIDO',
      value: formatWeight(metrics?.oroRecibido.fineWeight ?? 0, weightUnit),
      sublabel: `FA total — ${metrics?.oroRecibido.barCount ?? 0} barras`,
      accent: 'green',
      health: 85,
    },
    {
      key: 'oro-proceso',
      label: 'ORO EN PROCESO',
      value: formatWeight(metrics?.oroEnProceso.fineWeight ?? 0, weightUnit),
      sublabel: `Barras en horno: ${metrics?.oroEnProceso.barCount ?? 0} u`,
      accent: 'amber',
      health: metrics?.oroEnProceso.barCount ? Math.min(100, metrics.oroEnProceso.barCount * 10) : 0,
    },
    {
      key: 'oro-boveda',
      label: 'ORO EN BÓVEDA',
      value: formatWeight(metrics?.oroEnBoveda.fineWeight ?? 0, weightUnit),
      sublabel: 'Disponible para despacho',
      accent: 'cyan',
      health: 70,
    },
    {
      key: 'merma',
      label: 'MERMA',
      value: `${(metrics?.merma.porcentaje ?? 0).toFixed(1)}%`,
      sublabel: `Pérdida: ${formatWeight(metrics?.merma.gramos ?? 0, weightUnit)} Au`,
      accent: 'red',
      health: metrics?.merma.porcentaje ? Math.max(0, 100 - metrics.merma.porcentaje) : 100,
    },
  ], [metrics, weightUnit]);

  const supplierData = useMemo(() => {
    return clients.map(c => {
      const cBars = bars.filter(b => b.clientId === c.id);
      const w = cBars.reduce((s, b) => s + Number(b.grossWeight), 0);
      const cnt = cBars.length;
      const avgP = cnt > 0 ? Math.round(cBars.reduce((s, b) => s + Number(b.purity), 0) / cnt) : 0;
      return { id: c.id, name: c.name, rif: c.rif, grossWeight: w, count: cnt, avgPurity: avgP };
    }).filter(s => s.grossWeight > 0).sort((a, b) => b.grossWeight - a.grossWeight);
  }, [bars, clients]);

  const supplierColumns: ColumnDef<typeof supplierData[0]>[] = [
    { key: 'name', label: 'CLIENTE', render: r => <span className="font-bold text-[var(--tac-accent-cyan)]">{r.name}</span> },
    { key: 'rif', label: 'RIF', align: 'center', render: r => <span className="text-[var(--tac-text-dim)]">{r.rif.slice(0, 10)}</span> },
    { key: 'grossWeight', label: `BRUTO (${weightUnit.toUpperCase()})`, align: 'right', render: r => <span className="font-bold">{formatWeight(r.grossWeight, weightUnit)}</span> },
    { key: 'fineWeight', label: `FA (${weightUnit.toUpperCase()})`, align: 'right', render: r => <span className="text-[var(--tac-accent-green)]">{formatWeight(r.grossWeight, weightUnit)}</span> },
    { key: 'count', label: 'BARRAS', align: 'center', render: r => <span className="text-[var(--tac-text-dim)]">{r.count} u</span> },
    { key: 'avgPurity', label: 'PUREZA', align: 'center', render: r => <span>{r.avgPurity}‰</span> },
  ];

  const flowData = useMemo(() => {
    const days: Record<string, { date: string; dateShort: string; in: number; out: number }> = {};
    bars.forEach(b => {
      const d = new Date(b.createdAt);
      const key = d.toISOString().split('T')[0];
      const short = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      if (!days[key]) days[key] = { date: key, dateShort: short, in: 0, out: 0 };
      days[key].in += Number(b.fineWeight);
    });
    exits.forEach(e => {
      const d = new Date(e.createdAt);
      const key = d.toISOString().split('T')[0];
      const short = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      if (!days[key]) days[key] = { date: key, dateShort: short, in: 0, out: 0 };
      days[key].out += Number(e.totalWeight);
    });
    return Object.values(days).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);
  }, [bars, exits]);

  const maxFlow = useMemo(() => {
    return Math.max(...flowData.map(d => Math.max(d.in, d.out)), 1);
  }, [flowData]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* HUD Metrics Row */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.4 }}>
        <MetricsHUD items={metricsItems} cols={4} />
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Breakdown */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
          <TacticalCard title="INGRESOS — DISTRIBUCIÓN POR PROVEEDOR" accent="cyan">
            <ScannerTable
              columns={supplierColumns}
              data={supplierData}
              keyExtractor={r => r.id}
              emptyMessage="NO HAY DATOS DE INGRESOS"
            />
          </TacticalCard>
        </motion.div>

        {/* Client Exits Breakdown */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <TacticalCard title="EGRESOS — DISTRIBUCIÓN POR CLIENTE" accent="amber">
            <ScannerTable
              columns={[
                { key: 'name', label: 'CLIENTE', render: r => <span className="font-bold text-[var(--tac-accent-amber)]">{r.name}</span> },
                { key: 'rif', label: 'RIF', align: 'center', render: r => <span className="text-[var(--tac-text-dim)]">{r.rif.slice(0, 10)}</span> },
                { key: 'total', label: `DESPACHADO (${weightUnit.toUpperCase()})`, align: 'right', render: r => <span className="font-bold">{formatWeight(r.grossWeight, weightUnit)}</span> },
                { key: 'count', label: 'ENVÍOS', align: 'center', render: r => <span className="text-[var(--tac-text-dim)]">{r.count} ops</span> },
              ]}
              data={clients.map(c => {
                const cExits = exits.filter(e => e.exitDetails.some(d => d.lot?.process?.client?.id === c.id));
                const totalW = cExits.reduce((s, e) => s + Number(e.totalWeight), 0);
                return { ...c, grossWeight: totalW, count: cExits.length };
              }).filter(c => c.grossWeight > 0).sort((a, b) => b.grossWeight - a.grossWeight)}
              keyExtractor={r => r.id}
              emptyMessage="NO HAY DATOS DE EGRESOS"
            />
          </TacticalCard>
        </motion.div>
      </div>

      {/* Flow Terminal */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
        <TerminalPanel title="FLUJO DE TRAZABILIDAD — ÚLTIMOS 7 DÍAS" accent="cyan">
          {flowData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[var(--tac-text-dim)]">
              <span className="text-[11px] font-mono">NO HAY TRANSACCIONES REGISTRADAS</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* Header */}
              <div className="flex items-center gap-3 text-[9px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.1em] pb-1.5 border-b border-[var(--tac-border)] mb-2">
                <span className="w-24 shrink-0">FECHA</span>
                <span className="flex-1">INGRESO [IN]</span>
                <span className="w-2 shrink-0" />
                <span className="flex-1 text-right">EGRESO [OUT]</span>
              </div>

              {flowData.map((day, idx) => {
                const inPct = (day.in / maxFlow) * 100;
                const outPct = (day.out / maxFlow) * 100;
                return (
                  <div key={day.date} className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="w-24 shrink-0 text-[var(--tac-text-dim)]">{day.dateShort}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-3 bg-[var(--tac-bg-primary)] relative overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${inPct}%` }}
                          transition={{ delay: 0.4 + idx * 0.08, duration: 0.6, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-[var(--tac-accent-green)] to-[var(--tac-accent-green)]/60"
                        />
                      </div>
                      <span className="w-16 text-right text-[var(--tac-accent-green)] font-bold text-[9px]">
                        {formatWeight(day.in, weightUnit, 1)}
                      </span>
                    </div>
                    <span className="w-2 text-center text-[var(--tac-text-dim)] text-[8px]">|</span>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="w-16 text-left text-[var(--tac-accent-amber)] font-bold text-[9px]">
                        {formatWeight(day.out, weightUnit, 1)}
                      </span>
                      <div className="flex-1 h-3 bg-[var(--tac-bg-primary)] relative overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${outPct}%` }}
                          transition={{ delay: 0.5 + idx * 0.08, duration: 0.6, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-[var(--tac-accent-amber)] to-[var(--tac-accent-amber)]/60 float-right"
                          style={{ direction: 'rtl' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Stats footer */}
              <div className="flex items-center gap-4 mt-3 pt-2 border-t border-[var(--tac-border)] text-[9px] font-mono text-[var(--tac-text-dim)]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[var(--tac-accent-green)]" />
                  IN: {formatWeight(flowData.reduce((s, d) => s + d.in, 0), weightUnit, 1)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[var(--tac-accent-amber)]" />
                  OUT: {formatWeight(flowData.reduce((s, d) => s + d.out, 0), weightUnit, 1)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[var(--tac-accent-cyan)]" />
                  NET: {formatWeight(flowData.reduce((s, d) => s + d.in, 0) - flowData.reduce((s, d) => s + d.out, 0), weightUnit, 1)}
                </span>
              </div>
            </div>
          )}
        </TerminalPanel>
      </motion.div>

      {/* System status line */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="flex items-center gap-4 text-[9px] font-mono text-[var(--tac-text-dim)] border-t border-[var(--tac-border)] pt-3"
      >
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--tac-accent-green)] animate-pulse" />
          TRACKING LIVE
        </span>
        <span>BARRAS: {bars.length}</span>
        <span>CLIENTES: {clients.length}</span>
        <span>EGRESOS: {exits.length}</span>
        <span className="text-[var(--tac-accent-cyan)]">PULSE: {metrics?.oroEnProceso.barCount ? 'ACTIVE' : 'STANDBY'}</span>
      </motion.div>
    </motion.div>
  );
}
