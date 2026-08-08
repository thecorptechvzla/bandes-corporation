'use client';

import React, { useMemo } from 'react';
import { Send } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { formatNumber } from '@/lib/format';
import type { Bar } from '@/types/api';

interface AvailableLot {
  name: string;
  grossWeight: number;
  recovered?: number;
  clientName: string;
}

interface DestinationClient {
  id: string;
  name: string;
  rif: string;
  contactInfo?: string;
}

interface ConfirmDispatchModalProps {
  isOpen: boolean;
  destinationClient: DestinationClient | null;
  clientCount: number;
  selectedBars: Bar[];
  selectedLots: AvailableLot[];
  onConfirm: () => void;
  onCancel: () => void;
}

const fmtWeight = (val: number) => `${formatNumber(val, 2)} g`;

export function ConfirmDispatchModal({
  isOpen,
  destinationClient,
  clientCount,
  selectedBars,
  selectedLots,
  onConfirm,
  onCancel,
}: ConfirmDispatchModalProps) {
  const lotCount = selectedLots.length;
  const barCount = selectedBars.length;
  const itemCount = lotCount + barCount;

  const balanzaTotal = useMemo(
    () =>
      selectedLots.reduce(
        (s, l) =>
          s +
          (l.recovered && l.recovered > 0
            ? Number(l.recovered)
            : Number(l.grossWeight || 0)),
        0,
      ) + selectedBars.reduce((s, b) => s + Number(b.grossWeight || 0), 0),
    [selectedLots, selectedBars],
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onCancel}
      size="md"
      title="Confirmar Despacho Global"
      subtitle="Resumen de Salida Multi-Proveedor"
      header={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Send className="w-4 h-4 text-[var(--pm-accent-emerald)]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-emerald)] uppercase tracking-wider">Confirmar Despacho Global</span>
            <h3 className="text-sm font-sans font-semibold text-[var(--pm-text-primary)] mt-0.5">Resumen de Salida Multi-Proveedor</h3>
          </div>
        </div>
      }
      footer={
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">Cancelar</button>
          <button type="button" onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))', color: 'var(--pm-accent-emerald)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <Send className="w-4 h-4" /> Confirmar Despacho</button>
        </div>
      }
    >
      <div className="p-4 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 space-y-2 text-[11px] font-mono">
        <div className="flex justify-between">
          <span className="text-[var(--pm-text-dim)]">Destinatario:</span>
          <span className="text-[var(--pm-accent-gold)] font-bold text-right">{destinationClient?.name?.toUpperCase()}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-[var(--pm-text-dim)]">RIF:</span>
          <span className="text-[var(--pm-text-primary)]">{destinationClient?.rif || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--pm-text-dim)]">Proveedores:</span>
          <span className="text-[var(--pm-text-primary)] font-bold">{clientCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--pm-text-dim)]">Ítems:</span>
          <span className="text-[var(--pm-text-primary)] font-bold">
            {lotCount > 0 && `${lotCount} lote(s)`}
            {lotCount > 0 && barCount > 0 && ' + '}
            {barCount > 0 && `${barCount} barra(s)`}
          </span>
        </div>
        <div className="border-t border-[var(--pm-border)] pt-2 flex justify-between">
          <span className="text-[var(--pm-text-dim)]">Peso Balanza:</span>
          <span className="text-lg font-bold text-[var(--pm-accent-gold)]">{fmtWeight(balanzaTotal)}</span>
        </div>
        <div className="pt-1 text-[10px] text-[var(--pm-text-dim)]">
          Se entregarán {lotCount > 0 && `${lotCount} lote(s)`}{lotCount > 0 && barCount > 0 && ' + '}{barCount > 0 && `${barCount} barra(s)`} de {clientCount} proveedor{clientCount !== 1 ? 'es' : ''} con un peso balanza de {fmtWeight(balanzaTotal)} a <strong className="text-[var(--pm-text-primary)]">{destinationClient?.name?.toUpperCase()}</strong>.
        </div>
      </div>
    </ModalShell>
  );
}
