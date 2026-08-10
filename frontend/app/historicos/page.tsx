'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useBars } from '@/hooks/useBars';
import { useClients } from '@/hooks/useClients';
import { useProcesses } from '@/hooks/useProcesses';
import { useLots } from '@/hooks/useLots';
import { generateReportPDF } from '@/lib/generateReportPDF';
import { formatNumber, formatWeight } from '@/lib/format';
import { History, ArrowDownToLine, ArrowUpFromLine, Scale, Download, RefreshCw } from 'lucide-react';
import { BalanceTable } from '@/components/reportes/BalanceTable';
import { FilterBar } from '@/components/reportes/FilterBar';

type StatusFilter = 'ALL' | 'IN_STOCK' | 'COMPLETADO' | 'EXITED';

interface ClientRow {
  id: string;
  name: string;
  fa: number;
  fe: number;
  r: number;
  entregado: number;
  balance: number;
  puro: number;
  mixto: number;
}

export default function V2HistoricosPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: allBars = [] } = useBars();
  const { data: clients = [] } = useClients();
  const { data: processes = [] } = useProcesses();
  const { data: lots = [] } = useLots();

  const [filterClientId, setFilterClientId] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [clientSearch, setClientSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setFilterClientId('');
    setStatusFilter('ALL');
    setClientSearch('');
  };

  const balance = useMemo(() => {
    let ingresoBruto = 0;
    let ingresoFino = 0;
    let ingresoLeySum = 0;
    let ingresoLeyCount = 0;

    let egresoBruto = 0;
    let egresoFino = 0;
    let egresoLeySum = 0;
    let egresoLeyCount = 0;

    allBars.forEach(bar => {
      const gw = Number(bar.grossWeight);
      const fw = Number(bar.fineWeight);
      const p = Number(bar.purity);
      ingresoBruto += gw;
      ingresoFino += fw;
      if (gw > 0) { ingresoLeySum += p * gw; ingresoLeyCount += gw; }

      if (bar.status === 'EXITED') {
        egresoBruto += gw;
        egresoFino += fw;
        if (gw > 0) { egresoLeySum += p * gw; egresoLeyCount += gw; }
      }
    });

    const avgLeyIngreso = ingresoLeyCount > 0 ? ingresoLeySum / ingresoLeyCount : 0;
    const avgLeyEgreso = egresoLeyCount > 0 ? egresoLeySum / egresoLeyCount : 0;

    return {
      ingresado: { bruto: ingresoBruto, fino: ingresoFino, ley: avgLeyIngreso },
      egresado: { bruto: egresoBruto, fino: egresoFino, ley: avgLeyEgreso },
      balance: {
        bruto: ingresoBruto - egresoBruto,
        fino: ingresoFino - egresoFino,
      },
    };
  }, [allBars]);

  const filteredBars = useMemo(() => {
    return allBars.filter(b => {
      if (dateFrom && b.createdAt < dateFrom) return false;
      if (dateTo && b.createdAt > dateTo + 'T23:59:59') return false;
      if (filterClientId && b.clientId !== filterClientId) return false;
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      return true;
    });
  }, [allBars, dateFrom, dateTo, filterClientId, statusFilter]);

  const clientOptions = useMemo(() => {
    let filtered = clients;
    if (clientSearch) {
      const q = clientSearch.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [clients, clientSearch]);

  const lotIsMixed = useMemo(() => {
    const map = new Map<string, boolean>();
    lots.forEach(l => {
      const p = processes.find(x => x.id === l.processId);
      map.set(l.id, !!p?.isMixed);
    });
    return map;
  }, [lots, processes]);

  const clientRows: ClientRow[] = useMemo(() => {
    const map = new Map<string, { name: string; fa: number; entregado: number; r: number; puro: number; mixto: number }>();
    filteredBars.forEach(b => {
      const clientName = clients.find(c => c.id === b.clientId)?.name || 'Desconocido';
      const entry = map.get(b.clientId) || { name: clientName, fa: 0, entregado: 0, r: 0, puro: 0, mixto: 0 };
      const fw = Number(b.grossWeight || 0);
      entry.fa += fw;
      const mixed = b.lotId ? !!lotIsMixed.get(b.lotId) : false;
      if (mixed) entry.mixto += fw; else entry.puro += fw;
      if (b.status === 'EXITED') entry.entregado += fw;
      if ((b.status === 'COMPLETADO' || b.status === 'EXITED') && b.lotId) {
        const lot = lots.find(l => l.id === b.lotId);
        if (lot && lot.recovered != null) {
          const lotBars = filteredBars.filter(x => x.lotId === b.lotId);
          const grossTotalLote = lotBars.reduce((s, x) => s + Number(x.grossWeight || 0), 0);
          const grossBar = Number(b.grossWeight || 0);
          entry.r += grossTotalLote > 0
            ? Number(lot.recovered || 0) * (grossBar / grossTotalLote)
            : 0;
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
      puro: e.puro,
      mixto: e.mixto,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredBars, clients, lots, lotIsMixed]);

  const totals = useMemo(() => ({
    fa: clientRows.reduce((s, r) => s + r.fa, 0),
    fe: clientRows.reduce((s, r) => s + r.fe, 0),
    r: clientRows.reduce((s, r) => s + r.r, 0),
    entregado: clientRows.reduce((s, r) => s + r.entregado, 0),
    balance: clientRows.reduce((s, r) => s + r.balance, 0),
    puro: clientRows.reduce((s, r) => s + r.puro, 0),
    mixto: clientRows.reduce((s, r) => s + r.mixto, 0),
  }), [clientRows]);

  const hasAnyFilter = !!(dateFrom || dateTo || filterClientId || statusFilter !== 'ALL');

  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const oroRecibido = { fineWeight: totals.fa, barCount: filteredBars.length, clientCount: new Set(filteredBars.map(b => b.clientId)).size };
      const closedLots = lots.filter(l => l.recovered != null);
      const totalRecovered = closedLots.reduce((s, l) => s + Number(l.recovered || 0), 0);
      const completedLotsBars = filteredBars.filter(b => b.lotId && closedLots.some(l => l.id === b.lotId));
      const totalExpected = completedLotsBars.reduce((s, b) => s + Number(b.fineWeight || 0), 0);
      const eficiencia = totalExpected > 0 ? (totalRecovered / totalExpected) * 100 : 0;
      const oroFundido = { totalRecovered, lotCount: closedLots.length, barCount: filteredBars.filter(b => b.status === 'COMPLETADO' || b.status === 'EXITED').length, eficiencia, totalExpected };
      const waiting = filteredBars.filter(b => b.status === 'IN_STOCK');
      const oroEnEspera = { count: waiting.length, fineWeight: waiting.reduce((s, b) => s + Number(b.grossWeight || 0), 0), clientCount: new Set(waiting.map(b => b.clientId)).size };

      await generateReportPDF({
        oroRecibido, oroFundido, oroEnEspera, totals, clientRows,
        filters: { dateFrom, dateTo, filterClientId, statusFilter }, clients,
      });
    } catch (err) {
      console.error('Error al generar PDF:', err);
    } finally {
      setExporting(false);
    }
  }, [totals, filteredBars, lots, clientRows, dateFrom, dateTo, filterClientId, statusFilter, clients]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600/30 to-emerald-900/30 border border-emerald-500/20 flex items-center justify-center">
            <History className="w-5 h-5 text-[var(--pm-accent-emerald)]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--pm-text-primary)] tracking-tight">Históricos</h1>
            <p className="text-[11px] font-mono text-[var(--pm-text-dim)]">Registro auditable de movimientos del sistema</p>
          </div>
        </div>
      </div>

      {/* Balance Global */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl border border-[var(--pm-border)]/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Ingresado</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--pm-text-dim)]">PESO BRUTO</span>
              <span className="text-[var(--pm-text-primary)] font-semibold">{formatWeight(balance.ingresado.bruto, 2)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--pm-text-dim)]">PESO FINO</span>
              <span className="text-[var(--pm-accent-gold)] font-semibold">{formatWeight(balance.ingresado.fino, 2)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--pm-text-dim)]">LEY AU</span>
              <span className="text-[var(--pm-text-primary)] font-semibold">{formatNumber(balance.ingresado.ley, 2)} ‰</span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl border border-[var(--pm-border)]/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <ArrowUpFromLine className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <span className="text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Egresado</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--pm-text-dim)]">PESO BRUTO</span>
              <span className="text-[var(--pm-text-primary)] font-semibold">{formatWeight(balance.egresado.bruto, 2)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--pm-text-dim)]">PESO FINO</span>
              <span className="text-[var(--pm-accent-gold)] font-semibold">{formatWeight(balance.egresado.fino, 2)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--pm-text-dim)]">LEY AU</span>
              <span className="text-[var(--pm-text-primary)] font-semibold">{formatNumber(balance.egresado.ley, 2)} ‰</span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl border border-[var(--pm-border)]/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--pm-accent-emerald)]/10 border border-[var(--pm-accent-emerald)]/20 flex items-center justify-center">
              <Scale className="w-3.5 h-3.5 text-[var(--pm-accent-emerald)]" />
            </div>
            <span className="text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Balance</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--pm-text-dim)]">PESO BRUTO</span>
              <span className="text-[var(--pm-text-primary)] font-semibold">{formatWeight(balance.balance.bruto, 2)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--pm-text-dim)]">PESO FINO</span>
              <span className={`font-semibold ${balance.balance.fino >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatWeight(balance.balance.fino, 2)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[var(--pm-text-dim)]">REMANENTE</span>
              <span className="text-[var(--pm-text-primary)] font-semibold">
                {balance.ingresado.fino > 0 ? formatNumber((balance.balance.fino / balance.ingresado.fino) * 100, 1) : '0.0'}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <FilterBar
        dateFrom={dateFrom} dateTo={dateTo}
        filterClientId={filterClientId} statusFilter={statusFilter}
        clientSearch={clientSearch} clientOptions={clientOptions}
        clients={clients} hasActiveFilters={hasAnyFilter}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo}
        onFilterClientIdChange={setFilterClientId} onStatusFilterChange={setStatusFilter}
        onClientSearchChange={setClientSearch} onClearFilters={clearFilters}
      />
      <div className="relative">
        <BalanceTable clientRows={clientRows} totals={totals} hasActiveFilters={hasAnyFilter} />
        <button onClick={handleExportPDF} disabled={exporting}
          className="absolute top-5 right-5 flex items-center gap-2 px-4 py-2 bg-[var(--pm-accent-emerald)]/10 hover:bg-[var(--pm-accent-emerald)]/20
            border border-[var(--pm-accent-emerald)]/30 text-[var(--pm-accent-emerald)] text-[11px] font-mono font-bold
            uppercase tracking-wider rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer z-10">
          {exporting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {exporting ? 'Generando...' : 'Descargar Reporte PDF'}
        </button>
      </div>
    </div>
  );
}
