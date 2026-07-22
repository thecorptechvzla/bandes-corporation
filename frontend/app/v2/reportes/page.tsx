'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import {
  FileText, Download, TrendingUp, ArrowDownLeft, Clock,
  Scale, CheckCircle2, RefreshCw, Search, X, Coins,
  Filter, HardDrive, ArrowUpRight, Flame, Warehouse,
} from 'lucide-react';
import { useBars } from '@/hooks/useBars';
import { useClients } from '@/hooks/useClients';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useProcesses } from '@/hooks/useProcesses';
import { useLots } from '@/hooks/useLots';
import { formatWeight, formatNumber } from '@/lib/format';

type StatusFilter = 'ALL' | 'IN_STOCK' | 'COMPLETADO' | 'EXITED';

interface ClientRow {
  id: string;
  name: string;
  fa: number;
  fe: number;
  r: number;
  entregado: number;
  balance: number;
}

function buildSparklineData(bars: { createdAt: string; fineWeight: number }[]): { date: string; value: number }[] {
  const map = new Map<string, number>();
  bars.forEach(b => {
    const day = b.createdAt.slice(0, 10);
    map.set(day, (map.get(day) || 0) + Number(b.fineWeight));
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, value]) => ({ date, value: Math.round(value * 100) / 100 }));
}

function Sparkline({ data, color }: { data: { date: string; value: number }[]; color: string }) {
  if (data.length < 2) return null;
  return (
    <div className="w-full h-12">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5}
            fill={`url(#grad-${color.replace('#', '')})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({
  label, sublabel, value, unit, icon: Icon, accent, sparklineData, color, delay,
}: {
  label: string; sublabel: string; value: string; unit: string;
  icon: typeof TrendingUp; accent: string; sparklineData: { date: string; value: number }[]; color: string; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`glass-panel rounded-2xl border border-[var(--pm-border)]/40 p-5 space-y-3
        transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] ${accent}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg border shrink-0 ${accent.replace('hover:', '').replace('/30', '/15')}`}>
            <Icon className={`w-4 h-4 ${accent.replace('hover:border-', 'text-').replace('/30', '-400')}`} />
          </div>
          <div>
            <p className="text-[9px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">{label}</p>
            <p className="text-[10px] font-mono text-[var(--pm-text-dim)]/50">{sublabel}</p>
          </div>
        </div>
      </div>
      <div>
        <span className="text-2xl font-mono font-bold text-[var(--pm-text-primary)]">{value}</span>
        <span className="text-[10px] font-mono text-[var(--pm-text-dim)] ml-1">{unit}</span>
      </div>
      <Sparkline data={sparklineData} color={color} />
    </motion.div>
  );
}

export default function ReportesPage() {
  const { data: bars = [] } = useBars();
  const { data: clients = [] } = useClients();
  const { data: metrics } = useDashboardMetrics();
  const { data: processes = [] } = useProcesses();
  const { data: lots = [] } = useLots();
  const [exporting, setExporting] = useState(false);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterClientId, setFilterClientId] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [clientSearch, setClientSearch] = useState('');

  const filteredBars = useMemo(() => {
    return bars.filter(b => {
      if (dateFrom && b.createdAt < dateFrom) return false;
      if (dateTo && b.createdAt > dateTo + 'T23:59:59') return false;
      if (filterClientId && b.clientId !== filterClientId) return false;
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      return true;
    });
  }, [bars, dateFrom, dateTo, filterClientId, statusFilter]);

  const clientOptions = useMemo(() => {
    let filtered = clients;
    if (clientSearch) {
      const q = clientSearch.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [clients, clientSearch]);

  const oroRecibidoSpark = useMemo(() => buildSparklineData(bars.map(b => ({ createdAt: b.createdAt, fineWeight: Number(b.fineWeight) }))), [bars]);
  const filteredSpark = useMemo(() => buildSparklineData(filteredBars.map(b => ({ createdAt: b.createdAt, fineWeight: Number(b.fineWeight) }))), [filteredBars]);

  const oroRecibido = useMemo(() => {
    const total = filteredBars.reduce((s, b) => s + Number(b.fineWeight || 0), 0);
    const count = filteredBars.length;
    const clientsSet = new Set(filteredBars.map(b => b.clientId)).size;
    return { fineWeight: total, barCount: count, clientCount: clientsSet };
  }, [filteredBars]);

  const oroFundido = useMemo(() => {
    const closedLots = lots.filter(l => l.recovered != null);
    const totalRecovered = closedLots.reduce((s, l) => s + Number(l.recovered || 0), 0);
    const completedBars = filteredBars.filter(b => b.status === 'COMPLETADO' || b.status === 'EXITED');
    const completedLotIds = new Set(closedLots.map(l => l.id));
    const completedLotsBars = filteredBars.filter(b => b.lotId && completedLotIds.has(b.lotId));
    const totalExpected = completedLotsBars.reduce((s, b) => s + Number(b.fineWeight || 0), 0);
    const eficiencia = totalExpected > 0 ? (totalRecovered / totalExpected) * 100 : 0;
    return { totalRecovered, lotCount: closedLots.length, barCount: completedBars.length, eficiencia, totalExpected };
  }, [filteredBars, lots]);

  const oroEnEspera = useMemo(() => {
    const waiting = filteredBars.filter(b => b.status === 'IN_STOCK');
    const fino = waiting.reduce((s, b) => s + Number(b.fineWeight || 0), 0);
    return { count: waiting.length, fineWeight: fino, clientCount: new Set(waiting.map(b => b.clientId)).size };
  }, [filteredBars]);

  const clientRows: ClientRow[] = useMemo(() => {
    const map = new Map<string, { name: string; fa: number; entregado: number; r: number }>();
    filteredBars.forEach(b => {
      const clientName = clients.find(c => c.id === b.clientId)?.name || 'Desconocido';
      const entry = map.get(b.clientId) || { name: clientName, fa: 0, entregado: 0, r: 0 };
      entry.fa += Number(b.fineWeight || 0);
      if (b.status === 'EXITED') entry.entregado += Number(b.fineWeight || 0);
      if ((b.status === 'COMPLETADO' || b.status === 'EXITED') && b.lotId) {
        const lot = lots.find(l => l.id === b.lotId);
        if (lot && lot.recovered != null) {
          entry.r += Number(lot.recovered || 0) / (filteredBars.filter(x => x.lotId === b.lotId).length || 1);
        }
      }
      map.set(b.clientId, entry);
    });
    return Array.from(map.entries()).map(([id, e]) => ({
      id,
      name: e.name,
      fa: e.fa,
      fe: e.fa * 0.99,
      r: e.r,
      entregado: e.entregado,
      balance: e.fa - e.entregado,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredBars, clients, lots]);

  const totals = useMemo(() => ({
    fa: clientRows.reduce((s, r) => s + r.fa, 0),
    fe: clientRows.reduce((s, r) => s + r.fe, 0),
    r: clientRows.reduce((s, r) => s + r.r, 0),
    entregado: clientRows.reduce((s, r) => s + r.entregado, 0),
    balance: clientRows.reduce((s, r) => s + r.balance, 0),
  }), [clientRows]);

  const activeClientCount = useMemo(() => new Set(bars.map(b => b.clientId)).size, [bars]);
  const totalFA = useMemo(() => bars.reduce((s, b) => s + Number(b.fineWeight || 0), 0), [bars]);

  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const element = document.getElementById('report-content');
      if (!element) return;

      const imgData = await toPng(element, {
        backgroundColor: '#0A0F1A',
        pixelRatio: 3,
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pw = 210;
      const m = 15;
      const cw = pw - m * 2;

      let y = 15;

      // Header bar
      pdf.setFillColor(7, 11, 20);
      pdf.rect(0, 0, pw, 42, 'F');
      pdf.setFillColor(212, 175, 55);
      pdf.rect(0, 40, pw, 2, 'F');

      pdf.setTextColor(212, 175, 55);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BANDES', m, y + 10);
      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Sistema de Trazabilidad de Oro Fino', m, y + 18);

      pdf.setTextColor(212, 175, 55);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REPORTE DE CONCILIACION', pw - m, y + 10, { align: 'right' });
      pdf.setTextColor(160, 160, 160);
      pdf.setFontSize(7);
      const dateStr = new Date().toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
      pdf.text(`Generado: ${dateStr}`, pw - m, y + 18, { align: 'right' });

      // KPIs Section
      y = 52;
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.4);
      pdf.line(m, y, pw - m, y);
      y += 10;

      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RESUMEN EJECUTIVO', m, y);
      y += 12;

      const kpiW = (cw - 12) / 4;
      const kpis = [
        { label: 'ORO RECIBIDO (FA)', value: formatWeight(oroRecibido.fineWeight), sub: `${oroRecibido.barCount} barras` },
        { label: 'ORO FUNDIDO (R)', value: formatWeight(oroFundido.totalRecovered), sub: `${oroFundido.lotCount} lotes` },
        { label: 'ORO EN ESPERA', value: formatWeight(oroEnEspera.fineWeight), sub: `${oroEnEspera.count} barras` },
        { label: 'BALANCE GLOBAL', value: formatWeight(totals.balance), sub: `${formatNumber(oroFundido.eficiencia, 1)}% eficiencia` },
      ];

      kpis.forEach((kpi, idx) => {
        const x = m + idx * (kpiW + 4);
        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(x, y - 4, kpiW, 28, 2, 2, 'F');
        pdf.setTextColor(80, 80, 80);
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        pdf.text(kpi.label, x + 3, y + 2);
        pdf.setTextColor(40, 40, 40);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(kpi.value, x + 3, y + 14);
        pdf.setTextColor(120, 120, 120);
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        pdf.text(kpi.sub, x + 3, y + 21);
      });

      y += 36;

      // Filter info
      if (dateFrom || dateTo || filterClientId || statusFilter !== 'ALL') {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.line(m, y, pw - m, y);
        y += 8;
        pdf.setTextColor(80, 80, 80);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');

        const parts: string[] = [];
        if (dateFrom) parts.push(`Desde: ${dateFrom}`);
        if (dateTo) parts.push(`Hasta: ${dateTo}`);
        if (filterClientId) {
          const c = clients.find(x => x.id === filterClientId);
          if (c) parts.push(`Cliente: ${c.name}`);
        }
        if (statusFilter !== 'ALL') {
          const labels: Record<string, string> = { IN_STOCK: 'VALIDADO', COMPLETADO: 'VALIDADO', EXITED: 'EGRESADO' };
          parts.push(`Estado: ${labels[statusFilter] || statusFilter}`);
        }
        if (parts.length > 0) {
          pdf.text(`Filtros aplicados: ${parts.join(' | ')}`, m, y);
          y += 10;
        }
      }

      // Divider
      y += 4;
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.4);
      pdf.line(m, y, pw - m, y);
      y += 10;

      // Balance table header
      pdf.setTextColor(40, 40, 40);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BALANCE POR CLIENTE', m, y);
      y += 8;

      // Table header row
      pdf.setFillColor(7, 11, 20);
      pdf.rect(m, y - 4, cw, 7, 'F');
      pdf.setTextColor(212, 175, 55);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');

      const cols = [
        { label: 'CLIENTE', x: m + 2, align: 'left' as const },
        { label: 'FA (g)', x: m + 52, align: 'right' as const },
        { label: 'FE (g)', x: m + 72, align: 'right' as const },
        { label: 'R (g)', x: m + 92, align: 'right' as const },
        { label: 'ENTREGADO (g)', x: m + 112, align: 'right' as const },
        { label: 'BALANCE (g)', x: m + 145, align: 'right' as const },
      ];

      cols.forEach(col => {
        pdf.text(col.label, col.x, y + 0, { align: col.align });
      });
      y += 11;

      // Table rows
      const rowsToShow = clientRows.length > 0 ? clientRows : [{ id: '', name: 'Sin datos', fa: 0, fe: 0, r: 0, entregado: 0, balance: 0 }];
      rowsToShow.forEach((row, idx) => {
        if (y > 260) {
          pdf.addPage();
          y = 20;
          pdf.setFillColor(7, 11, 20);
          pdf.rect(m, y - 4, cw, 7, 'F');
          pdf.setTextColor(212, 175, 55);
          pdf.setFontSize(6);
          pdf.setFont('helvetica', 'bold');
          cols.forEach(col => pdf.text(col.label, col.x, y + 0, { align: col.align }));
          y += 11;
        }

        if (idx % 2 === 0) {
          pdf.setFillColor(248, 248, 248);
          pdf.rect(m, y - 4, cw, 7, 'F');
        }
        pdf.setTextColor(40, 40, 40);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');

        const isPos = row.balance >= 0;
        const rowData = [
          { text: row.name, x: m + 2, align: 'left' as const, color: '#282828' },
          { text: formatWeight(row.fa), x: m + 52, align: 'right' as const, color: '#282828' },
          { text: formatWeight(row.fe), x: m + 72, align: 'right' as const, color: '#282828' },
          { text: formatWeight(row.r), x: m + 92, align: 'right' as const, color: '#282828' },
          { text: formatWeight(row.entregado), x: m + 112, align: 'right' as const, color: '#282828' },
          { text: `${isPos ? '+' : ''}${formatWeight(Math.abs(row.balance))}`, x: m + 145, align: 'right' as const, color: isPos ? '#059669' : '#DC2626' },
        ];

        rowData.forEach(cell => {
          if (cell.color) pdf.setTextColor(cell.color);
          pdf.text(cell.text, cell.x, y + 1, { align: cell.align });
        });
        y += 7;
      });

      // Totals row
      y += 4;
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(0.6);
      pdf.line(m, y, pw - m, y);
      y += 8;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40, 40, 40);
      const totalIsPos = totals.balance >= 0;
      const totalRow = [
        { text: 'TOTALES', x: m + 2, align: 'left' as const },
        { text: formatWeight(totals.fa), x: m + 52, align: 'right' as const },
        { text: formatWeight(totals.fe), x: m + 72, align: 'right' as const },
        { text: formatWeight(totals.r), x: m + 92, align: 'right' as const },
        { text: formatWeight(totals.entregado), x: m + 112, align: 'right' as const },
        { text: `${totalIsPos ? '+' : ''}${formatWeight(Math.abs(totals.balance))}`, x: m + 145, align: 'right' as const },
      ];
      totalRow.forEach(cell => pdf.text(cell.text, cell.x, y, { align: cell.align }));

      // Signature space
      y += 20;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.2);
      pdf.line(m, y, pw - m, y);
      y += 8;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      pdf.text('_________________________', m, y);
      pdf.text('Responsable de Boveda', m, y + 5);
      pdf.text('_________________________', pw - m - 45, y);
      pdf.text('Gerencia', pw - m - 45, y + 5);

      pdf.save('Reporte_Conciliacion_Bandes.pdf');
    } catch (err) {
      console.error('Error al generar PDF:', err);
    } finally {
      setExporting(false);
    }
  }, [oroRecibido, oroFundido, oroEnEspera, totals, clientRows, dateFrom, dateTo, filterClientId, statusFilter, clients]);

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setFilterClientId('');
    setStatusFilter('ALL');
  };

  const hasActiveFilters = dateFrom || dateTo || filterClientId || statusFilter !== 'ALL';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-sans font-medium text-[var(--pm-text-primary)] tracking-tight flex items-center gap-2">
          <FileText className="w-8 h-8 text-[var(--pm-accent-gold)] drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
          Reportes
          <span className="text-[var(--pm-accent-gold)] font-semibold ml-1">— Conciliación Metalúrgica</span>
        </h1>
        <p className="text-[11px] font-mono text-[var(--pm-text-dim)] mt-1">
          Auditoría de trazabilidad — FA · FE · R · Balance por cliente y exportación PDF.
        </p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Oro Recibido" sublabel="Total histórico ingresado" value={formatWeight(oroRecibido.fineWeight)}
          unit="g" icon={ArrowDownLeft} accent="hover:border-[var(--pm-accent-emerald)]/30"
          sparklineData={oroRecibidoSpark} color="#10B981" delay={0.05}
        />
        <KpiCard
          label="Oro Fundido (R)" sublabel="Fundiciones completadas" value={formatWeight(oroFundido.totalRecovered)}
          unit="g" icon={Flame} accent="hover:border-[var(--pm-accent-amber)]/30"
          sparklineData={filteredSpark} color="#F59E0B" delay={0.1}
        />
        <KpiCard
          label="Oro en Espera" sublabel="Pendiente por procesar" value={formatWeight(oroEnEspera.fineWeight)}
          unit="g" icon={Warehouse} accent="hover:border-[var(--pm-accent-sky)]/30"
          sparklineData={filteredSpark} color="#0EA5E9" delay={0.15}
        />
        <KpiCard
          label="Balance Global" sublabel={`${formatNumber(oroFundido.eficiencia, 1)}% eficiencia`}
          value={`${totals.balance >= 0 ? '+' : ''}${formatWeight(Math.abs(totals.balance))}`}
          unit="" icon={Scale} accent="hover:border-[var(--pm-accent-gold)]/30"
          sparklineData={filteredSpark} color="#D4AF37" delay={0.2}
        />
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-[var(--pm-accent-gold)]" />
            <span className="text-[9px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider font-bold">Filtros</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-mono text-[var(--pm-text-dim)] uppercase">Desde</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-32 bg-[var(--pm-bg-base)]/60 border border-[var(--pm-border)]/40 rounded-lg px-2 py-1.5 text-[10px] font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)]" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-mono text-[var(--pm-text-dim)] uppercase">Hasta</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-32 bg-[var(--pm-bg-base)]/60 border border-[var(--pm-border)]/40 rounded-lg px-2 py-1.5 text-[10px] font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)]" />
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--pm-text-dim)]/50" />
            <input type="text" placeholder="Buscar cliente..." value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
              className="w-40 bg-[var(--pm-bg-base)]/60 border border-[var(--pm-border)]/40 rounded-lg pl-6 pr-2 py-1.5 text-[10px] font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)]" />
            {filterClientId && (
              <div className="absolute left-0 top-full mt-1 z-20 w-56 max-h-40 overflow-y-auto bg-[var(--pm-bg-secondary)] border border-[var(--pm-border)] rounded-lg p-1 shadow-xl">
                {clientOptions.map(c => (
                  <button key={c.id} onClick={() => { setFilterClientId(c.id); setClientSearch(''); }}
                    className={`w-full text-left px-2 py-1.5 rounded text-[10px] font-mono transition-colors active:scale-[0.98]
                      ${filterClientId === c.id ? 'bg-[var(--pm-accent-gold)]/10 text-[var(--pm-accent-gold)]' : 'text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-hover)]'}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-[var(--pm-bg-base)]/60 border border-[var(--pm-border)]/40 rounded-lg px-2 py-1.5 text-[10px] font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)]">
            <option value="ALL">Todos los estados</option>
            <option value="IN_STOCK">VALIDADO</option>
            <option value="COMPLETADO">VALIDADO</option>
            <option value="EXITED">EGRESADO</option>
          </select>

          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1.5 bg-[var(--pm-accent-red)]/10 border border-[var(--pm-accent-red)]/20 text-[var(--pm-accent-red)] rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer">
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>

        {filterClientId && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[9px] font-mono text-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)]/10 px-2 py-0.5 rounded border border-[var(--pm-accent-gold)]/20">
              Cliente: {clients.find(c => c.id === filterClientId)?.name || filterClientId}
            </span>
            <button onClick={() => setFilterClientId('')}
              className="text-[var(--pm-text-dim)] hover:text-[var(--pm-accent-red)] text-[9px] cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Balance Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        id="report-content"
        className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <div className="p-5 border-b border-[var(--pm-border)]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--pm-accent-gold)]" />
            <span className="text-[11px] font-semibold text-[var(--pm-text-primary)] uppercase tracking-wider">
              Balance por Cliente — FA · FE · R
            </span>
          </div>
          <button onClick={handleExportPDF} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--pm-accent-gold)]/10 hover:bg-[var(--pm-accent-gold)]/20
              border border-[var(--pm-accent-gold)]/30 text-[var(--pm-accent-gold)] text-[10px] font-mono font-bold
              uppercase tracking-wider rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer">
            {exporting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {exporting ? 'Generando...' : 'Descargar Reporte PDF'}
          </button>
        </div>

        {clientRows.length === 0 ? (
          <div className="p-16 text-center">
            <Coins className="w-10 h-10 text-[var(--pm-text-dim)]/30 mx-auto mb-3" />
            <p className="text-sm text-[var(--pm-text-primary)] font-semibold">
              {hasActiveFilters ? 'Sin resultados para los filtros aplicados' : 'No hay transacciones registradas'}
            </p>
            <p className="text-[11px] font-mono text-[var(--pm-text-dim)] mt-1">
              Los balances por cliente aparecerán automáticamente al registrar ingresos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto premium-table">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-[var(--pm-border)]/20 text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">
                  <th className="py-3 px-4 bg-[var(--pm-bg-base)]/50 text-left sticky left-0 z-10 min-w-[180px]">Cliente</th>
                  <th className="py-3 px-4 bg-[var(--pm-bg-base)]/50 text-right">FA (g)</th>
                  <th className="py-3 px-4 bg-[var(--pm-bg-base)]/50 text-right">FE (g)</th>
                  <th className="py-3 px-4 bg-[var(--pm-bg-base)]/50 text-right">R (g)</th>
                  <th className="py-3 px-4 bg-[var(--pm-bg-base)]/50 text-right">Entregado (g)</th>
                  <th className="py-3 px-4 bg-[var(--pm-bg-base)]/50 text-right">Balance (g)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--pm-border)]/20">
                {clientRows.map((row, idx) => {
                  const isPos = row.balance >= 0;
                  return (
                    <tr key={row.id}
                      className={`group transition-all duration-150
                        ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--pm-bg-base)]/20'}
                        hover:bg-[var(--pm-bg-hover)]/40 hover:shadow-[inset_0_0_20px_rgba(212,175,55,0.03)]`}>
                      <td className="py-3 px-4 font-mono text-[var(--pm-text-primary)] text-[11px] sticky left-0 z-10
                        bg-[var(--pm-bg-primary)] group-hover:bg-[var(--pm-bg-hover)]/40
                        flex items-center gap-2 min-w-[180px]">
                        <Coins className="w-3.5 h-3.5 text-[var(--pm-accent-gold)] shrink-0" />
                        {row.name}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--pm-accent-emerald)]">
                        {formatWeight(row.fa)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--pm-accent-sky)]">
                        {formatWeight(row.fe)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--pm-accent-amber)]">
                        {formatWeight(row.r)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--pm-text-dim)]">
                        {formatWeight(row.entregado)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center gap-1 font-mono font-bold text-sm ${isPos ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}>
                          <ArrowUpRight className={`w-3 h-3 ${isPos ? '' : 'rotate-180'}`} />
                          {isPos ? '+' : ''}{formatWeight(Math.abs(row.balance))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[var(--pm-accent-gold)]/30 bg-[var(--pm-accent-gold)]/5">
                  <td className="py-4 px-4 font-mono text-sm font-bold text-[var(--pm-accent-gold)] sticky left-0 z-10 bg-[var(--pm-bg-primary)]/95">
                    TOTALES
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-[var(--pm-accent-emerald)] text-sm">
                    {formatWeight(totals.fa)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-[var(--pm-accent-sky)] text-sm">
                    {formatWeight(totals.fe)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-[var(--pm-accent-amber)] text-sm">
                    {formatWeight(totals.r)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-[var(--pm-text-dim)] text-sm">
                    {formatWeight(totals.entregado)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={`inline-flex items-center gap-1 font-mono font-bold text-sm ${totals.balance >= 0 ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-accent-red)]'}`}>
                      <ArrowUpRight className={`w-3 h-3 ${totals.balance >= 0 ? '' : 'rotate-180'}`} />
                      {totals.balance >= 0 ? '+' : ''}{formatWeight(Math.abs(totals.balance))}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </motion.div>

      {/* Status Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="flex items-center gap-4 text-[9px] font-mono text-[var(--pm-text-dim)]/70 border-t border-[var(--pm-border)]/20 pt-3">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--pm-accent-emerald)] shadow-[0_0_6px_var(--pm-accent-emerald)]" />
          DB ONLINE
        </span>
        <HardDrive className="w-3 h-3" />
        <span>{activeClientCount} clientes activos</span>
        <span className="text-[var(--pm-accent-gold)]">{formatWeight(totalFA)} FA total</span>
        <span>{bars.length} barras registradas</span>
      </motion.div>
    </motion.div>
  );
}
