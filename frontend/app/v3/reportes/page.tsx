'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Coins, Download } from 'lucide-react';
import { useBars } from '@/hooks/useBars';
import { useClients } from '@/hooks/useClients';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { formatWeight } from '@/lib/format';
import { MetricsHUD, type MetricItem } from '@/components/tactical/MetricsHUD';
import { ScannerTable, type ColumnDef } from '@/components/tactical/ScannerTable';
import { TacticalCard } from '@/components/tactical/TacticalCard';
import { useRole } from '@/context/RoleContext';
import { HudButton } from '@/components/tactical/HudButton';

interface ClientBalance {
  name: string;
  received: number;
  delivered: number;
  balance: number;
}

export default function V2ReportesPage() {
  const { data: bars = [] } = useBars();
  const { data: clients = [] } = useClients();
  const { data: metrics } = useDashboardMetrics();
  const { hasRole } = useRole();
  const canExport = hasRole('OWNER', 'SUPERADMIN');
  const [exporting, setExporting] = useState(false);

  const metricsItems: MetricItem[] = useMemo(() => [
    {
      key: 'oro-recibido',
      label: 'ORO RECIBIDO',
      value: formatWeight(metrics?.oroRecibido.fineWeight ?? 0),
      sublabel: `${metrics?.oroRecibido.barCount ?? 0} BARRAS`,
      accent: 'green',
      health: 85,
    },
    {
      key: 'oro-proceso',
      label: 'ORO EN PROCESO',
      value: formatWeight(metrics?.oroEnProceso.fineWeight ?? 0),
      sublabel: `${metrics?.oroEnProceso.barCount ?? 0} BARRAS`,
      accent: 'amber',
      health: metrics?.oroEnProceso.barCount ? Math.min(100, metrics.oroEnProceso.barCount * 10) : 0,
    },
    {
      key: 'oro-boveda',
      label: 'ORO EN BÓVEDA',
      value: formatWeight(metrics?.oroEnBoveda.fineWeight ?? 0),
      sublabel: 'EN STOCK',
      accent: 'cyan',
      health: 70,
    },
    {
      key: 'merma',
      label: 'MERMA',
      value: formatWeight(metrics?.merma.gramos ?? 0),
      sublabel: `${(metrics?.merma.porcentaje ?? 0).toFixed(2)}%`,
      accent: 'red',
      health: metrics?.merma.porcentaje ? Math.max(0, 100 - metrics.merma.porcentaje) : 100,
    },
  ], [metrics]);

  const clientBalances: ClientBalance[] = useMemo(() => {
    const map = new Map<string, { name: string; received: number; delivered: number }>();
    bars.forEach(b => {
      const clientName = clients.find(c => c.id === b.clientId)?.name || '—';
      const entry = map.get(b.clientId) || { name: clientName, received: 0, delivered: 0 };
      entry.received += Number(b.fineWeight || 0);
      if (b.status === 'EXITED') entry.delivered += Number(b.fineWeight || 0);
      map.set(b.clientId, entry);
    });
    return Array.from(map.values())
      .map(e => ({ ...e, balance: e.received - e.delivered }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [bars, clients]);

  const totalFA = useMemo(() => {
    return bars.reduce((s, b) => s + Number(b.fineWeight || 0), 0);
  }, [bars]);

  const activeClients = useMemo(() => {
    return new Set(bars.map(b => b.clientId)).size;
  }, [bars]);

  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const element = document.getElementById('report-balance-table');
      if (!element) return;
      const imgData = await toPng(element, { backgroundColor: '#0A0A0A', pixelRatio: 2 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 190;
      const img = new Image();
      img.src = imgData;
      await img.decode();
      const pdfHeight = (img.naturalHeight * pdfWidth) / img.naturalWidth;
      let heightLeft = pdfHeight;
      let position = 10;
      pdf.addImage(imgData, 'PNG', 10, position, pdfWidth, pdfHeight);
      while (heightLeft > 270) {
        position = heightLeft - 270;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, -position + 10, pdfWidth, pdfHeight);
        heightLeft -= 270;
      }
      pdf.save('Balance_Por_Cliente.pdf');
    } catch (err) {
      console.error('Error al generar PDF:', err);
    } finally {
      setExporting(false);
    }
  }, []);

  const cardColumns: ColumnDef<ClientBalance>[] = [
    {
      key: 'name',
      label: 'CLIENTE',
      render: r => (
        <span className="flex items-center gap-2 font-bold text-[var(--tac-text-primary)]">
          <Coins className="w-3.5 h-3.5 text-[var(--tac-accent-cyan)]" />
          {r.name}
        </span>
      ),
    },
    {
      key: 'received',
      label: 'FA (g)',
      align: 'right',
      render: r => <span className="text-[var(--tac-accent-green)]">{formatWeight(r.received)}</span>,
    },
    {
      key: 'delivered',
      label: 'ENTREGADO (g)',
      align: 'right',
      render: r => <span className="text-[var(--tac-accent-amber)]">{formatWeight(r.delivered)}</span>,
    },
    {
      key: 'balance',
      label: 'BALANCE (g)',
      align: 'right',
      render: r => {
        const isPos = r.balance >= 0;
        return (
          <span className={`font-bold ${isPos ? 'text-[var(--tac-accent-green)]' : 'text-[var(--tac-accent-red)]'}`}>
            {isPos ? '+' : ''}{formatWeight(Math.abs(r.balance))}
          </span>
        );
      },
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <h1 className="text-lg font-mono font-bold text-[var(--tac-accent-cyan)] tracking-[0.05em]">
          {'>'} INTELIGENCIA ESTRATÉGICA — CENTRO DE MANDO
        </h1>
        <p className="text-[10px] font-mono text-[var(--tac-text-dim)] mt-1 tracking-[0.1em]">
          CONCILIACIÓN METALÚRGICA — ORO RECIBIDO, FUNDIDO, EN ESPERA Y BALANCES
        </p>
      </div>

      <MetricsHUD items={metricsItems} cols={4} />

      <TacticalCard
        title="BALANCE POR CLIENTE — FA | FE | R"
        accent="cyan"
        className="relative"
      >
        <div className="absolute top-2 right-3 z-10">
          <HudButton
            variant={canExport ? 'primary' : 'ghost'}
            prefix=">"
            loading={exporting}
            disabled={!canExport}
            onClick={handleExportPDF}
          >
            {exporting ? 'EXPORTANDO...' : canExport ? 'EXPORTAR PDF' : 'SIN PERMISO'}
          </HudButton>
        </div>
        <div id="report-balance-table" className="pt-6">
          {/* Formula reference */}
          <div className="px-3 py-1.5 mb-2 border border-[var(--tac-border)] bg-[var(--tac-bg-primary)] inline-block text-[8px] font-mono text-[var(--tac-text-dim)]">
            BALANCE = ΣFA(RECIBIDO) − ΣFA(ENTREGADO) &nbsp;|&nbsp; FE = FA × 0.99
          </div>
          <ScannerTable
            columns={cardColumns}
            data={clientBalances}
            keyExtractor={r => r.name}
            stickyFirst
            emptyMessage="NO HAY DATOS DE BALANCE"
          />
        </div>
      </TacticalCard>

      <div className="flex items-center gap-4 text-[9px] font-mono text-[var(--tac-text-dim)] border-t border-[var(--tac-border)] pt-3">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--tac-accent-green)] animate-pulse" />
          DB ONLINE
        </span>
        <span>{activeClients} CLIENTES ACTIVOS</span>
        <span className="text-[var(--tac-accent-cyan)]">{formatWeight(totalFA)} FA TOTAL</span>
      </div>
    </motion.div>
  );
}
