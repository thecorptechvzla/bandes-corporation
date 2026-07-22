'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePackings, usePacking } from '@/hooks/usePackings';
import { useMaterialExits } from '@/hooks/useExits';
import { formatNumber, formatWeight } from '@/lib/format';
import {
  Search, Calendar, ChevronDown, ChevronUp, Package, Truck,
  History, X, Box, Layers, AlertCircle, Hash, Weight,
  Building2, CheckCircle2, Clock, FileStack,
} from 'lucide-react';

type TabId = 'packings' | 'exits';

const STATUS_STYLES: Record<string, string> = {
  PENDING:    'text-amber-400 bg-amber-500/10 border-amber-500/20',
  VALIDATED:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:   'PENDIENTE',
  VALIDATED: 'VALIDADO',
};

const BAR_STATUS_STYLES: Record<string, string> = {
  POR_VALIDAR: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  IN_STOCK:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  PROCESANDO:  'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  COMPLETADO:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  EXITED:      'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

const BAR_STATUS_LABELS: Record<string, string> = {
  POR_VALIDAR: 'POR VALIDAR',
  IN_STOCK:    'EN STOCK',
  PROCESANDO:  'EN PROCESO',
  COMPLETADO:  'COMPLETADO',
  EXITED:      'EGRESADO',
};

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

  // --- PACKINGS ---

  const packingProviders = useMemo(() => {
    const set = new Set<string>();
    packings.forEach(p => { if (p.client?.name) set.add(p.client.name); });
    return [...set].sort();
  }, [packings]);

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

  // --- EXITS ---

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

  // --- RENDER HELPERS ---

  const renderPackingRow = (p: (typeof packings)[number]) => {
    const isExpanded = expandedPackingId === p.id;
    const barCount = p._count?.bars ?? 0;
    const validatedCount = p._count?.validated ?? 0;
    const weight = expandedPacking?.bars
      ? expandedPacking.bars.reduce((s, b) => s + Number(b.grossWeight), 0)
      : null;

    return (
      <React.Fragment key={p.id}>
        <tr
          onClick={() => setExpandedPackingId(isExpanded ? null : p.id)}
          className="group cursor-pointer transition-all duration-150 hover:bg-[var(--pm-bg-tertiary)]/60"
        >
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-[var(--pm-accent-gold)] shrink-0" />
              <span className="font-mono text-sm font-bold text-[var(--pm-text-primary)]">
                #{p.packingNumber ?? '—'}
              </span>
            </div>
          </td>
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-[var(--pm-text-dim)] shrink-0" />
              <span className="text-sm text-[var(--pm-text-primary)]">
                {p.client?.name ?? '—'}
              </span>
            </div>
          </td>
          <td className="px-4 py-3.5">
            <span className="text-sm font-mono font-semibold text-[var(--pm-text-primary)]">
              {formatNumber(barCount, 0)}
            </span>
          </td>
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 rounded-full bg-[var(--pm-bg-tertiary)] overflow-hidden">
                {barCount > 0 && (
                  <div
                    className="h-full rounded-full bg-[var(--pm-accent-emerald)] transition-all"
                    style={{ width: `${Math.round((validatedCount / barCount) * 100)}%` }}
                  />
                )}
              </div>
              <span className="text-[11px] font-mono text-[var(--pm-text-dim)]">
                {validatedCount}/{barCount}
              </span>
            </div>
          </td>
          <td className="px-4 py-3.5">
            <span className="text-sm font-mono text-[var(--pm-text-dim)]">
              {weight !== null ? formatWeight(weight, 2) : '—'}
            </span>
          </td>
          <td className="px-4 py-3.5">
            <span className="text-xs font-mono text-[var(--pm-text-dim)]">
              {new Date(p.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric', month: '2-digit', day: '2-digit',
              })}
            </span>
          </td>
          <td className="px-4 py-3.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${STATUS_STYLES[p.status] ?? ''}`}>
              {STATUS_LABELS[p.status] ?? p.status}
            </span>
          </td>
          <td className="px-4 py-3.5 text-right">
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-[var(--pm-text-dim)] group-hover:text-[var(--pm-accent-gold)] transition-colors" />
            </motion.div>
          </td>
        </tr>
        {isExpanded && (
          <tr key={`${p.id}-detail`}>
            <td colSpan={8} className="px-0 py-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <div className="border-t border-[var(--pm-border)]/40 bg-[var(--pm-bg-secondary)]/50">
                  {loadingExpandedPacking ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-[var(--pm-text-dim)]">
                      <div className="w-4 h-4 border-2 border-[var(--pm-accent-gold)] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-mono">Cargando barras...</span>
                    </div>
                  ) : expandedPacking?.bars && expandedPacking.bars.length > 0 ? (
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">
                          <Layers className="w-3 h-3 inline mr-1.5" />
                          Barras del Packing #{p.packingNumber}
                        </h4>
                        <span className="text-xs font-mono text-[var(--pm-accent-gold)]">
                          {formatWeight(weight ?? 0, 2)} total
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] font-mono">
                          <thead>
                            <tr className="border-b border-[var(--pm-border)]/30">
                              <th className="text-left py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Barra</th>
                              <th className="text-right py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Peso Bruto</th>
                              <th className="text-right py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Pureza</th>
                              <th className="text-right py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Peso Fino</th>
                              <th className="text-right py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Ley Ag</th>
                              <th className="text-center py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expandedPacking.bars.map(bar => (
                              <tr key={bar.id} className="border-b border-[var(--pm-border)]/20 hover:bg-[var(--pm-bg-tertiary)]/40 transition-colors">
                                <td className="py-2 px-3 text-[var(--pm-text-primary)] font-semibold">{bar.barNumber || '—'}</td>
                                <td className="py-2 px-3 text-right text-[var(--pm-text-primary)]">{formatWeight(Number(bar.grossWeight), 2)}</td>
                                <td className="py-2 px-3 text-right text-[var(--pm-text-primary)]">{formatNumber(Number(bar.purity), 1)}</td>
                                <td className="py-2 px-3 text-right text-[var(--pm-accent-gold)] font-semibold">{formatWeight(Number(bar.fineWeight), 2)}</td>
                                <td className="py-2 px-3 text-right text-[var(--pm-text-dim)]">
                                  {bar.leyAg != null ? formatNumber(Number(bar.leyAg), 1) : '—'}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${BAR_STATUS_STYLES[bar.status] ?? ''}`}>
                                    {BAR_STATUS_LABELS[bar.status] ?? bar.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-8 text-[var(--pm-text-dim)]">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-mono">Sin barras registradas</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  const hasAnyFilter = searchQuery || dateFrom || dateTo || selectedProvider;

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
      <div className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider mb-1.5">
              <Search className="w-3 h-3 inline mr-1" />
              Buscar
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={activeTab === 'packings' ? 'Buscar por proveedor, #packing...' : 'Buscar por destino, proveedor...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--pm-bg-primary)] border border-[var(--pm-border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] placeholder:text-[var(--pm-text-dim)]/50 focus:outline-none focus:border-[var(--pm-accent-gold)]/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider mb-1.5">
              <Calendar className="w-3 h-3 inline mr-1" />
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="bg-[var(--pm-bg-primary)] border border-[var(--pm-border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)]/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider mb-1.5">
              <Calendar className="w-3 h-3 inline mr-1" />
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="bg-[var(--pm-bg-primary)] border border-[var(--pm-border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)]/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider mb-1.5">
              <Building2 className="w-3 h-3 inline mr-1" />
              Proveedor
            </label>
            <select
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value)}
              className="bg-[var(--pm-bg-primary)] border border-[var(--pm-border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)]/50 transition-colors min-w-[160px]"
            >
              <option value="">Todos</option>
              {(activeTab === 'packings' ? packingProviders : exitProviders).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {hasAnyFilter && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold font-mono text-[var(--pm-text-dim)] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'packings' && (
        <div className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
          {loadingPackings ? (
            <div className="flex items-center justify-center gap-2 py-16 text-[var(--pm-text-dim)]">
              <div className="w-5 h-5 border-2 border-[var(--pm-accent-gold)] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono">Cargando packings...</span>
            </div>
          ) : filteredPackings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--pm-text-dim)]">
              <FileStack className="w-10 h-10 opacity-30" />
              <span className="text-xs font-mono">
                {hasAnyFilter ? 'Sin resultados para los filtros actuales' : 'No hay packings registrados'}
              </span>
              {hasAnyFilter && (
                <button onClick={clearFilters} className="text-[10px] font-bold font-mono text-[var(--pm-accent-gold)] hover:underline cursor-pointer">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--pm-border)]/40 bg-[var(--pm-bg-tertiary)]/30">
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Packing</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Proveedor</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Barras</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Validación</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Peso Total</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--pm-border)]/20">
                  {filteredPackings.map(renderPackingRow)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'exits' && (
        <div className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
          {loadingExits ? (
            <div className="flex items-center justify-center gap-2 py-16 text-[var(--pm-text-dim)]">
              <div className="w-5 h-5 border-2 border-[var(--pm-accent-gold)] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono">Cargando egresos...</span>
            </div>
          ) : filteredExits.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--pm-text-dim)]">
              <Truck className="w-10 h-10 opacity-30" />
              <span className="text-xs font-mono">
                {hasAnyFilter ? 'Sin resultados para los filtros actuales' : 'No hay egresos registrados'}
              </span>
              {hasAnyFilter && (
                <button onClick={clearFilters} className="text-[10px] font-bold font-mono text-[var(--pm-accent-gold)] hover:underline cursor-pointer">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--pm-border)]/40 bg-[var(--pm-bg-tertiary)]/30">
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Despacho</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Proveedores</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Lotes</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Peso Total</th>
                    <th className="text-left px-4 py-3 text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--pm-border)]/20">
                  {filteredExits.map(e => {
                    const isExpanded = expandedExitId === e.id;
                    const providerNames = [...new Set(
                      e.exitDetails.map(d => d.lot?.process?.client?.name).filter(Boolean),
                    )] as string[];
                    const lotCount = e.exitDetails.length;

                    return (
                      <React.Fragment key={e.id}>
                        <tr
                          onClick={() => setExpandedExitId(isExpanded ? null : e.id)}
                          className="group cursor-pointer transition-all duration-150 hover:bg-[var(--pm-bg-tertiary)]/60"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <Truck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span className="font-mono text-xs font-bold text-[var(--pm-text-primary)]">
                                {e.id.slice(0, 8).toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {providerNames.map(name => (
                                <span key={name} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-primary)] border border-[var(--pm-border)]/30">
                                  {name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-mono font-semibold text-[var(--pm-text-primary)]">
                              {formatNumber(lotCount, 0)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-mono font-semibold text-[var(--pm-accent-gold)]">
                              {formatWeight(Number(e.totalWeight), 2)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-xs font-mono text-[var(--pm-text-dim)]">
                              {new Date(e.createdAt).toLocaleDateString('es-ES', {
                                year: 'numeric', month: '2-digit', day: '2-digit',
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown className="w-4 h-4 text-[var(--pm-text-dim)] group-hover:text-[var(--pm-accent-gold)] transition-colors" />
                            </motion.div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${e.id}-detail`}>
                            <td colSpan={6} className="px-0 py-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                              >
                                <div className="border-t border-[var(--pm-border)]/40 bg-[var(--pm-bg-secondary)]/50 p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider">
                                      <FileStack className="w-3 h-3 inline mr-1.5" />
                                      Detalle del Despacho
                                    </h4>
                                    <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">
                                      Destino: <span className="text-[var(--pm-text-primary)]">{e.destination}</span>
                                    </span>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-[11px] font-mono">
                                      <thead>
                                        <tr className="border-b border-[var(--pm-border)]/30">
                                          <th className="text-left py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Lote</th>
                                          <th className="text-left py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Proveedor</th>
                                          <th className="text-right py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Barras</th>
                                          <th className="text-right py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Peso Aportado</th>
                                          <th className="text-left py-2 px-3 text-[var(--pm-text-dim)] font-semibold">Barras</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {e.exitDetails.map(detail => (
                                          <tr key={detail.id} className="border-b border-[var(--pm-border)]/20 hover:bg-[var(--pm-bg-tertiary)]/40 transition-colors">
                                            <td className="py-2 px-3 text-[var(--pm-text-primary)] font-semibold">
                                              {detail.lot?.name ?? '—'}
                                            </td>
                                            <td className="py-2 px-3 text-[var(--pm-text-dim)]">
                                              {detail.lot?.process?.client?.name ?? '—'}
                                            </td>
                                            <td className="py-2 px-3 text-right text-[var(--pm-text-primary)]">
                                              {detail.bars?.length ?? 0}
                                            </td>
                                            <td className="py-2 px-3 text-right text-[var(--pm-accent-gold)] font-semibold">
                                              {formatWeight(Number(detail.weightAported), 2)}
                                            </td>
                                            <td className="py-2 px-3">
                                              <div className="flex flex-wrap gap-1">
                                                {detail.bars?.map(bar => (
                                                  <span key={bar.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] border border-[var(--pm-border)]/30">
                                                    {bar.barNumber}
                                                    <span className="text-[var(--pm-accent-gold)]">({formatWeight(Number(bar.fineWeight), 1)})</span>
                                                  </span>
                                                ))}
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
