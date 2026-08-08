'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles, AlertTriangle, CheckCircle2, Users, Weight, GitMerge } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BarAccordion, type BarAccordionRow } from '@/components/selection/BarAccordion';
import type { Bar, Client } from '@/types/api';

interface SmeltingConfigFormProps {
  clients: Client[];
  bars: Bar[];
  selectedClientIds: string[];
  selectedBarIds: string[];
  openGroups: Set<string>;
  formError: string;
  formSuccess: string;
  creating: boolean;
  onToggleClient: (clientId: string) => void;
  onSelectAllClients: () => void;
  onBarToggle: (barId: string) => void;
  onSelectAllBarsOfClient: (clientId: string) => void;
  onToggleSupplier: (clientId: string) => void;
  isSupplierAllSelected: (clientId: string) => boolean;
  onOpenDetail?: (barId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

interface ClientGroup {
  client: Client;
  bars: Bar[];
  selectedCount: number;
  grossTotal: number;
  faTotal: number;
}

export function SmeltingConfigForm({
  clients, bars, selectedClientIds, selectedBarIds, openGroups,
  formError, formSuccess, creating,
  onToggleClient, onSelectAllClients, onBarToggle, onSelectAllBarsOfClient,
  onToggleSupplier, isSupplierAllSelected, onOpenDetail, onSubmit,
}: SmeltingConfigFormProps) {
  const MAX_PROCESS_GROSS_G = 5000;

  const availableBars = useMemo(
    () => bars.filter(b => b.status === 'IN_STOCK' && !b.lotId),
    [bars],
  );

  const clientsWithBars = useMemo(
    () => clients.filter(c => availableBars.some(b => b.clientId === c.id)),
    [clients, availableBars],
  );

  const clientGroups = useMemo<ClientGroup[]>(() => {
    return clientsWithBars.map(client => {
      const clientBars = availableBars.filter(b => b.clientId === client.id);
      const selected = clientBars.filter(b => selectedBarIds.includes(b.id));
      return {
        client,
        bars: clientBars,
        selectedCount: selected.length,
        grossTotal: selected.reduce((s, b) => s + Number(b.grossWeight), 0),
        faTotal: selected.reduce((s, b) => s + Number(b.fineWeight), 0),
      };
    }).filter(g => g.bars.length > 0);
  }, [clientsWithBars, availableBars, selectedBarIds]);

  const allSelectedCount = selectedBarIds.length;
  const allGross = clientGroups.reduce((s, g) => s + g.grossTotal, 0);
  const allFa = clientGroups.reduce((s, g) => s + g.faTotal, 0);
  const selectedClientCount = selectedClientIds.length;

  const supplierCount = useMemo(
    () => new Set(bars.filter(b => selectedBarIds.includes(b.id)).map(b => b.clientId)).size,
    [bars, selectedBarIds],
  );
  const isMixedSelection = supplierCount > 1;
  const overMaxGross = allGross > MAX_PROCESS_GROSS_G;
  const allClientsSelected = selectedClientIds.length === clientsWithBars.length && clientsWithBars.length > 0;

  const visibleGroups = useMemo(() => {
    if (selectedClientIds.length === 0) return clientGroups;
    return clientGroups.filter(g => selectedClientIds.includes(g.client.id));
  }, [clientGroups, selectedClientIds]);

  const accordionGroups = useMemo(() => {
    const result: Record<string, BarAccordionRow[]> = {};
    visibleGroups.forEach(group => {
      result[group.client.id] = group.bars.map(bar => ({
        id: bar.id,
        code: bar.barNumber,
        type: 'bar' as const,
        pesoBruto: Number(bar.grossWeight),
        leyAu: bar.purity,
        pesoFino: Number(bar.fineWeight),
        clientName: group.client.name,
        clientRif: group.client.rif,
      }));
    });
    return result;
  }, [visibleGroups]);

  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
      className="premium-card overflow-hidden"
    >
      <div className="px-5 pt-5 pb-2 border-b border-[var(--pm-border)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Play className="w-3.5 h-3.5 text-[var(--pm-accent-emerald)]" />
          </div>
          <span className="text-xs font-mono font-bold text-[var(--pm-accent-emerald)] uppercase tracking-wider">
            Mesa de Selección — Cola de Fundición
          </span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="p-5 space-y-4">

        {/* ─── Multi-Provider Selector ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3 h-3" /> Proveedores con Material Disponible
            </label>
            <button type="button" onClick={onSelectAllClients}
              className="text-[10px] font-mono text-[var(--pm-accent-amber)] hover:text-[var(--pm-accent-gold)] active:scale-95 transition-all cursor-pointer"
            >
              {allClientsSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {clientsWithBars.map(client => {
              const isSelected = selectedClientIds.includes(client.id);
              const count = availableBars.filter(b => b.clientId === client.id).length;
              return (
                <button key={client.id} type="button" onClick={() => onToggleClient(client.id)}
                  className={`px-3 py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer border ${
                    isSelected
                      ? 'border-[var(--pm-accent-amber)]/50 bg-[var(--pm-accent-amber)]/10 text-[var(--pm-accent-amber)]'
                      : 'border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-[var(--pm-text-dim)] hover:border-[var(--pm-accent-amber)]/30 hover:text-[var(--pm-text-primary)]'
                  }`}
                >
                  {client.name}
                  <span className="ml-1.5 text-[9px] opacity-60">{count}b</span>
                </button>
              );
            })}
            {clientsWithBars.length === 0 && (
              <span className="text-[11px] font-mono text-[var(--pm-text-dim)] italic py-2">
                No hay proveedores con material disponible.
              </span>
            )}
          </div>
        </div>

        {/* ─── Bar Selection — Accordion ─── */}
        {visibleGroups.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">
                Barras Disponibles — {selectedClientCount > 0 ? `${selectedClientCount} proveedor${selectedClientCount > 1 ? 'es' : ''}` : 'todos los proveedores'}
              </span>
              <span className="text-[11px] font-mono text-[var(--pm-accent-amber)]">
                {allSelectedCount} seleccionada{allSelectedCount !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="max-h-[420px] overflow-y-auto v2-scroll border border-[var(--pm-border)] rounded-lg p-2">
              <BarAccordion
                groups={accordionGroups}
                openGroups={openGroups}
                selectedIds={new Set(selectedBarIds)}
                onToggleItem={onBarToggle}
                onToggleSupplier={onToggleSupplier}
                onToggleSupplierItems={onSelectAllBarsOfClient}
                isSupplierAllSelected={isSupplierAllSelected}
                onOpenDetail={onOpenDetail}
              />
            </div>
          </div>
        )}

        {/* ─── Totals Glass Panel ─── */}
        {allSelectedCount > 0 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[var(--pm-accent-amber)]/20 bg-[var(--pm-accent-amber)]/5 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Weight className="w-3.5 h-3.5 text-[var(--pm-accent-emerald)]" />
              <span className="text-[11px] font-mono font-bold text-[var(--pm-accent-emerald)] uppercase tracking-wider">Consolidado</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[10px] font-mono text-[var(--pm-text-dim)] block">Barras</span>
                <span className="text-sm font-mono font-bold text-[var(--pm-text-primary)]">{allSelectedCount}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[var(--pm-text-dim)] block">Peso Bruto</span>
                <span className="text-sm font-mono font-bold text-[var(--pm-accent-amber)]">{formatNumber(allGross, 2)} g</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[var(--pm-text-dim)] block">Peso Fino</span>
                <span className="text-sm font-mono font-bold text-[var(--pm-accent-gold)]">{formatNumber(allFa, 2)} g</span>
              </div>
            </div>
            {selectedClientCount > 1 && (
              <p className="text-[9px] font-mono text-[var(--pm-accent-amber)] text-center mt-2">
                Se consolidará en 1 solo proceso mixto ({selectedClientCount} proveedores)
              </p>
            )}
          </motion.div>
        )}

        {/* ─── Weight Warning ─── */}
        {allSelectedCount > 0 && overMaxGross && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-mono bg-[var(--pm-accent-amber)]/10 border border-[var(--pm-accent-amber)]/25 text-[var(--pm-accent-amber)]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              El peso bruto seleccionado (<span className="font-bold">{formatNumber(allGross, 2)} g</span>) supera el máximo recomendado de 5 kg para un proceso de fundición. Puedes continuar, pero verifica la capacidad del horno.
            </span>
          </div>
        )}

        {/* ─── Errors / Success ─── */}
        {formError && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-mono bg-[var(--pm-accent-red)]/10 border border-[var(--pm-accent-red)]/25 text-[var(--pm-accent-red)]">
            <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
          </div>
        )}
        {formSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-mono bg-[var(--pm-accent-emerald)]/10 border border-[var(--pm-accent-emerald)]/25 text-[var(--pm-accent-emerald)]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />{formSuccess}
          </div>
        )}

        {/* ─── Execute Button ─── */}
        <button type="submit" disabled={creating || allSelectedCount === 0}
          className="w-full py-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
          style={
            isMixedSelection
              ? {
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.22), rgba(34,211,238,0.08))',
                  color: '#a78bfa', border: '1px solid rgba(139,92,246,0.35)',
                  boxShadow: '0 0 20px rgba(139,92,246,0.12)',
                }
              : {
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))',
                  color: 'var(--pm-accent-emerald)', border: '1px solid rgba(16,185,129,0.3)',
                  boxShadow: '0 0 20px rgba(16,185,129,0.1)',
                }
          }
        >
          {creating ? (
            <><LoadingSpinner size="sm" className="text-[var(--pm-accent-emerald)]" /> Iniciando Fundición...</>
          ) : isMixedSelection ? (
            <><GitMerge className="w-4 h-4" /> ⚡ Iniciar Fundición Mixta ({allSelectedCount} barra{allSelectedCount !== 1 ? 's' : ''})</>
          ) : (
            <><Sparkles className="w-4 h-4" /> ⚡ Iniciar Fundición ({allSelectedCount} barra{allSelectedCount !== 1 ? 's' : ''})</>
          )}
        </button>
      </form>
    </motion.div>
  );
}
