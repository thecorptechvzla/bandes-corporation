'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  FileText, Download, RefreshCw,
} from 'lucide-react';
import { useBars } from '@/hooks/useBars';
import { useClients } from '@/hooks/useClients';
import { useProcesses } from '@/hooks/useProcesses';
import { useLots } from '@/hooks/useLots';
import { generateReportPDF } from '@/lib/generateReportPDF';
import { KpiCardGrid } from '@/components/reportes/KpiCardGrid';
import { FilterBar } from '@/components/reportes/FilterBar';
import { BalanceTable } from '@/components/reportes/BalanceTable';
import { StatusFooter } from '@/components/reportes/StatusFooter';

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

export default function ReportesPage() {
  const { data: bars = [] } = useBars();
  const { data: clients = [] } = useClients();
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
      await generateReportPDF({
        oroRecibido,
        oroFundido,
        oroEnEspera,
        totals,
        clientRows,
        filters: { dateFrom, dateTo, filterClientId, statusFilter },
        clients,
      });
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

  const hasActiveFilters = !!(dateFrom || dateTo || filterClientId || statusFilter !== 'ALL');

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
          Auditoría de trazabilidad — Peso Fino · R · Balance por cliente y exportación PDF.
        </p>
      </motion.div>

      {/* KPIs */}
      <KpiCardGrid
        bars={bars}
        filteredBars={filteredBars}
        oroRecibido={oroRecibido}
        oroFundido={oroFundido}
        oroEnEspera={oroEnEspera}
        totals={totals}
      />

      {/* Filters */}
      <FilterBar
        dateFrom={dateFrom} dateTo={dateTo}
        filterClientId={filterClientId} statusFilter={statusFilter}
        clientSearch={clientSearch} clientOptions={clientOptions}
        clients={clients} hasActiveFilters={hasActiveFilters}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo}
        onFilterClientIdChange={setFilterClientId} onStatusFilterChange={setStatusFilter}
        onClientSearchChange={setClientSearch} onClearFilters={clearFilters}
      />

      {/* Balance Table */}
      <div className="relative">
        <BalanceTable clientRows={clientRows} totals={totals} hasActiveFilters={hasActiveFilters} />
        <button onClick={handleExportPDF} disabled={exporting}
          className="absolute top-5 right-5 flex items-center gap-2 px-4 py-2 bg-[var(--pm-accent-gold)]/10 hover:bg-[var(--pm-accent-gold)]/20
            border border-[var(--pm-accent-gold)]/30 text-[var(--pm-accent-gold)] text-[10px] font-mono font-bold
            uppercase tracking-wider rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer z-10">
          {exporting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {exporting ? 'Generando...' : 'Descargar Reporte PDF'}
        </button>
      </div>

      {/* Status Footer */}
      <StatusFooter activeClientCount={activeClientCount} totalFA={totalFA} barCount={bars.length} />
    </motion.div>
  );
}
