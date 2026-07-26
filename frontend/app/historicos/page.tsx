'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { usePackings, usePacking } from '@/hooks/usePackings';
import { useMaterialExits } from '@/hooks/useExits';
import { useBars } from '@/hooks/useBars';
import { generateDispatchPDF, convertExitToDispatchResult } from '@/lib/generateDispatchPDF';
import { formatNumber, formatWeight } from '@/lib/format';
import { History, Package, Truck, ArrowDownToLine, ArrowUpFromLine, Scale } from 'lucide-react';
import { HistoryFilters } from '@/components/historicos/HistoryFilters';
import { PackingsTable } from '@/components/historicos/PackingsTable';
import { ExitsTable } from '@/components/historicos/ExitsTable';
import type { MaterialExit } from '@/types/api';

type TabId = 'packings' | 'exits';

export default function V2HistoricosPage() {
  const [activeTab, setActiveTab] = useState<TabId>('packings');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [expandedPackingId, setExpandedPackingId] = useState<string | null>(null);
  const [expandedExitId, setExpandedExitId] = useState<string | null>(null);

  const { data: packings = [], isLoading: loadingPackings } = usePackings();
  const { data: exits = [], isLoading: loadingExits } = useMaterialExits();
  const { data: expandedPacking, isLoading: loadingExpandedPacking } = usePacking(expandedPackingId);
  const { data: allBars = [] } = useBars();

  const switchTab = (tab: TabId) => {
    setActiveTab(tab);
    setExpandedPackingId(null);
    setExpandedExitId(null);
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setSelectedProvider('');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setSelectedProvider('');
  };

  const packingProviders = useMemo(() => {
    const set = new Set<string>();
    packings.forEach(p => { if (p.client?.name) set.add(p.client.name); });
    return [...set].sort();
  }, [packings]);

  const exitProviders = useMemo(() => {
    const set = new Set<string>();
    exits.forEach(e => {
      e.exitDetails.forEach(d => {
        const name = d.lot?.process?.client?.name;
        if (name) set.add(name);
      });
    });
    return [...set].sort();
  }, [exits]);

  const filteredPackings = useMemo(() => {
    return packings.filter(p => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const clientMatch = p.client?.name?.toLowerCase().includes(q);
        const numMatch = p.packingNumber?.toString().includes(q);
        const fileMatch = p.fileName?.toLowerCase().includes(q);
        if (!clientMatch && !numMatch && !fileMatch) return false;
      }
      if (dateFrom && new Date(p.createdAt) < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(p.createdAt) > end) return false;
      }
      if (selectedProvider && p.client?.name !== selectedProvider) return false;
      return true;
    });
  }, [packings, searchQuery, dateFrom, dateTo, selectedProvider]);

  const filteredExits = useMemo(() => {
    return exits.filter(e => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const destMatch = e.destination?.toLowerCase().includes(q);
        const providerMatch = e.exitDetails.some(
          d => d.lot?.process?.client?.name?.toLowerCase().includes(q),
        );
        if (!destMatch && !providerMatch) return false;
      }
      if (dateFrom && new Date(e.createdAt) < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(e.createdAt) > end) return false;
      }
      if (selectedProvider) {
        const hasProvider = e.exitDetails.some(
          d => d.lot?.process?.client?.name === selectedProvider,
        );
        if (!hasProvider) return false;
      }
      return true;
    });
  }, [exits, searchQuery, dateFrom, dateTo, selectedProvider]);

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

  const handlePDFCliente = useCallback((exit: MaterialExit) => {
    const result = convertExitToDispatchResult(exit);
    generateDispatchPDF(result, undefined, 'CLIENTE');
  }, []);

  const handlePDFEmpresa = useCallback((exit: MaterialExit) => {
    const result = convertExitToDispatchResult(exit);
    generateDispatchPDF(result, undefined, 'EMPRESA');
  }, []);

  const hasAnyFilter = !!(searchQuery || dateFrom || dateTo || selectedProvider);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-600/30 to-amber-900/30 border border-amber-500/20 flex items-center justify-center">
            <History className="w-5 h-5 text-[var(--pm-accent-gold)]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--pm-text-primary)] tracking-tight">Históricos</h1>
            <p className="text-[10px] font-mono text-[var(--pm-text-dim)]">Registro auditable de movimientos del sistema</p>
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
            <span className="text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Ingresado</span>
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
              <span className="text-[var(--pm-text-primary)] font-semibold">{formatNumber(balance.ingresado.ley, 1)} ‰</span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl border border-[var(--pm-border)]/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <ArrowUpFromLine className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <span className="text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Egresado</span>
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
              <span className="text-[var(--pm-text-primary)] font-semibold">{formatNumber(balance.egresado.ley, 1)} ‰</span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl border border-[var(--pm-border)]/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--pm-accent-gold)]/10 border border-[var(--pm-accent-gold)]/20 flex items-center justify-center">
              <Scale className="w-3.5 h-3.5 text-[var(--pm-accent-gold)]" />
            </div>
            <span className="text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Balance</span>
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

      {/* Tabs */}
      <div className="flex gap-1 glass-panel rounded-xl border border-[var(--pm-border)]/40 p-1 w-fit">
        <button
          onClick={() => switchTab('packings')}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider transition-all duration-200 cursor-pointer
            ${activeTab === 'packings'
              ? 'text-[var(--pm-accent-gold)]'
              : 'text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)]'
            }`}
        >
          {activeTab === 'packings' && (
            <motion.div
              layoutId="tab-bg"
              className="absolute inset-0 bg-[var(--pm-bg-tertiary)] rounded-lg border border-[var(--pm-border)]"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Historial de Packings
          </span>
        </button>
        <button
          onClick={() => switchTab('exits')}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-wider transition-all duration-200 cursor-pointer
            ${activeTab === 'exits'
              ? 'text-[var(--pm-accent-gold)]'
              : 'text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)]'
            }`}
        >
          {activeTab === 'exits' && (
            <motion.div
              layoutId="tab-bg"
              className="absolute inset-0 bg-[var(--pm-bg-tertiary)] rounded-lg border border-[var(--pm-border)]"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Historial de Egresos
          </span>
        </button>
      </div>

      {/* Filters */}
      <HistoryFilters
        activeTab={activeTab} searchQuery={searchQuery} dateFrom={dateFrom}
        dateTo={dateTo} selectedProvider={selectedProvider}
        providers={activeTab === 'packings' ? packingProviders : exitProviders}
        hasAnyFilter={hasAnyFilter} onSearchChange={setSearchQuery}
        onDateFromChange={setDateFrom} onDateToChange={setDateTo}
        onProviderChange={setSelectedProvider} onClear={clearFilters}
      />

      {/* Content */}
      {activeTab === 'packings' && (
        <PackingsTable
          packings={filteredPackings} isLoading={loadingPackings}
          hasAnyFilter={hasAnyFilter} expandedPackingId={expandedPackingId}
          expandedPacking={expandedPacking} loadingExpandedPacking={loadingExpandedPacking}
          onExpand={setExpandedPackingId} onClearFilters={clearFilters}
        />
      )}

      {activeTab === 'exits' && (
        <ExitsTable
          exits={filteredExits} isLoading={loadingExits}
          hasAnyFilter={hasAnyFilter} expandedExitId={expandedExitId}
          onExpand={setExpandedExitId} onClearFilters={clearFilters}
          onPDFCliente={handlePDFCliente}
          onPDFEmpresa={handlePDFEmpresa}
        />
      )}
    </div>
  );
}
