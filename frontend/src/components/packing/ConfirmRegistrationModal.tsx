'use client';

import React from 'react';
import { ClipboardCheck, Check, Package } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { formatNumber } from '@/lib/format';

interface ConfirmRegistrationData {
  barNumber: string;
  grossWeight: number;
  purity: number;
  leyAg?: number;
  clientId: string;
  packingNumber: number;
  packingId: string | null;
  clientName: string;
}

interface ConfirmRegistrationModalProps {
  data: ConfirmRegistrationData;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmRegistrationModal({ data, onClose, onConfirm }: ConfirmRegistrationModalProps) {
  return (
    <ModalShell isOpen onClose={onClose} noHeader noPadding size="sm">
      <div className="p-6 space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.25)' }}>
            <ClipboardCheck className="w-7 h-7 text-[var(--pm-accent-emerald)]" strokeWidth={2.5} />
          </div>
          <h2 className="text-sm font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Confirmar Registro</h2>
        </div>

        <div className="p-4 rounded-xl border border-[var(--pm-border)]/40 bg-[var(--pm-bg-deepest)]/30 space-y-2">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-[var(--pm-text-dim)]">Código</span>
            <span className="font-bold text-[var(--pm-accent-gold)]">{data.barNumber}</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-[var(--pm-text-dim)]">Peso Bruto</span>
            <span className="font-bold text-[var(--pm-text-primary)]">{formatNumber(data.grossWeight, 2)} g</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-[var(--pm-text-dim)]">Ley Au</span>
            <span className="font-bold text-[var(--pm-text-primary)]">{formatNumber(data.purity, 2)} ‰</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--pm-accent-cyan)]/30 bg-[var(--pm-accent-cyan)]/5 text-center">
          <Package className="w-5 h-5 text-[var(--pm-accent-cyan)] mx-auto mb-2" />
          <p className="text-[11px] font-mono text-[var(--pm-text-primary)] leading-relaxed">
            Esta barra se asignará al <strong className="text-[var(--pm-accent-cyan)]">Packing #{data.packingNumber}</strong> del proveedor <strong className="text-[var(--pm-text-primary)]">{data.clientName}</strong>
          </p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm}
            className="flex-[2] py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))', color: 'var(--pm-accent-emerald)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <Check className="w-4 h-4" /> CONFIRMAR
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
