'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Package, Building2, Send } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { ClientDropdown } from '@/components/egresos/ClientDropdown';
import type { Bar } from '@/types/api';

interface AvailableLot {
  id: string;
  name: string;
  processName: string;
  clientId: string;
  clientName: string;
  clientRif: string;
  availableWeight: number;
  grossWeight: number;
  barCount: number;
}

interface BuyerClient {
  id: string;
  name: string;
  rif: string;
  contactInfo?: string;
}

interface CheckoutSummaryPanelProps {
  selectedLots: AvailableLot[];
  selectedBars: Bar[];
  groupedByClient: Record<string, any[]>;
  totalWeight: number;
  grossTotal: number;
  clientCount: number;
  destinationClient: { id: string; name: string; rif: string; contactInfo?: string } | null;
  onDestinationChange: (v: { id: string; name: string; rif: string; contactInfo?: string } | null) => void;
  buyerClients: BuyerClient[];
  status: string;
  onOpenConfirm: () => void;
}

export function CheckoutSummaryPanel({
  selectedLots, selectedBars, groupedByClient, totalWeight, grossTotal, clientCount,
  destinationClient, onDestinationChange, buyerClients, status, onOpenConfirm,
}: CheckoutSummaryPanelProps) {
  const fmtWeightDisplay = (val: number) => `${formatNumber(val, 2)} g`;
  const lotCount = selectedLots.length;
  const barCount = selectedBars.length;
  const itemCount = lotCount + barCount;

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
      className="xl:col-span-2 glass-panel rounded-2xl border border-[var(--pm-border)]/40">
      <div className="px-5 py-3.5 border-b border-[var(--pm-border)]/20">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[var(--pm-accent-gold)]" />
          <span className="text-xs font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Caja de Salida Global</span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {itemCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-[var(--pm-text-dim)]">
            <Package className="w-8 h-8 text-[var(--pm-text-dim)]/30 mb-2" />
            <span className="text-[11px] font-mono text-center">
              Seleccione lotes o barras del panel izquierdo
            </span>
            <p className="text-[10px] font-mono mt-1 text-center">
              Puede mezclar lotes refundidos y barras individuales en un solo despacho.
            </p>
          </div>
        ) : (
          <>
            {/* Total weight — Peso Bruto destacado */}
            <div className="text-center py-4 px-4 rounded-xl border border-[var(--pm-accent-amber)]/20 bg-[var(--pm-accent-amber)]/5">
              <span className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block mb-1">
                Peso Bruto Total
              </span>
              <span className="text-2xl font-mono font-bold text-[var(--pm-accent-amber)] tracking-tight">
                {fmtWeightDisplay(grossTotal)}
              </span>
              <span className="text-[11px] font-mono text-[var(--pm-text-dim)] block mt-1">
                {clientCount} proveedor{clientCount !== 1 ? 'es' : ''} · {lotCount > 0 && `${lotCount} lote(s)`}{lotCount > 0 && barCount > 0 && ' + '}{barCount > 0 && `${barCount} barra(s)`}
              </span>
              <span className="text-[10px] font-mono text-[var(--pm-text-dim)] block mt-0.5">
                Peso Neto: {fmtWeightDisplay(totalWeight)}
              </span>
            </div>

            {/* Grouped by provider */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block">
                Desglose por Proveedor
              </span>
              {Object.entries(groupedByClient).map(([cId, items]) => {
                const first = items[0];
                const clientName = first.clientName || first.client?.name || 'DESCONOCIDO';
                const clientTotal = items.reduce((s: number, item: any) => s + (item.pesoFino || item.availableWeight || Number(item.fineWeight)), 0);
                return (
                  <div key={cId} className="p-3 rounded-lg border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="w-3.5 h-3.5 shrink-0 text-[var(--pm-accent-gold)]" />
                        <span className="text-[11px] font-sans font-semibold text-[var(--pm-text-primary)] truncate">{clientName}</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[var(--pm-accent-gold)]">{fmtWeightDisplay(clientTotal)}</span>
                    </div>
                    <div className="space-y-1">
                      {items.map((item: any) => {
                        const isLot = item.type === 'lot';
                        const badgeLabel = isLot ? 'REFUNDIDO' : 'SIN REFUNDIR';
                        return (
                          <div key={item.id} className="flex items-center justify-between text-[11px] font-mono">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-20 text-center ${
                                isLot ? 'bg-[var(--pm-accent-amber)]/10 text-[var(--pm-accent-amber)]' : 'bg-slate-500/10 text-slate-400'
                              }`}>{badgeLabel}</span>
                              <span className="text-[var(--pm-text-primary)]">{label}</span>
                            </div>
                            <span className="text-[var(--pm-text-primary)]">{formatNumber(weight, 4)} g</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Buyer / Destination selector */}
            <ClientDropdown value={destinationClient} onChange={onDestinationChange} buyers={buyerClients} />

            <button type="button" onClick={onOpenConfirm}
              disabled={itemCount === 0 || !destinationClient || status === 'processing'}
              className="w-full py-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: itemCount > 0 && destinationClient
                  ? 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))'
                  : 'transparent',
                color: itemCount > 0 && destinationClient ? 'var(--pm-accent-gold)' : 'var(--pm-text-dim)',
                border: `1px solid ${itemCount > 0 && destinationClient ? 'rgba(212,175,55,0.3)' : 'var(--pm-border)'}`,
              }}>
              <Send className="w-4 h-4" />
              Ejecutar Salida · {formatNumber(grossTotal, 2)} g
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
