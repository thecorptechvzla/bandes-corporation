'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Check, Download, User, Building } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { formatNumber } from '@/lib/format';

interface DispatchResult {
  reference: string;
  destination: string;
  totalWeight: number;
  grossWeight?: number;
  lotCount?: number;
  barCount?: number;
  providerCount: number;
  lots?: { name: string; weight: number; provider: string }[];
  bars?: { barNumber: string; grossWeight: number; purity: number; fineWeight: number; provider: string }[];
  providers: { name: string; count: number; weight: number }[];
  createdAt: string;
  type: 'lots' | 'bars' | 'mixed';
}

interface DispatchSuccessOverlayProps {
  isOpen: boolean;
  result: DispatchResult;
  message: string;
  onPDFCliente: () => void;
  onPDFEmpresa: () => void;
  onClose: () => void;
}

const fmtWeight = (val: number) => `${formatNumber(val, 2)} g`;

export function DispatchSuccessOverlay({ isOpen, result, message, onPDFCliente, onPDFEmpresa, onClose }: DispatchSuccessOverlayProps) {
  const itemCount = result.type === 'bars' ? result.barCount : result.lotCount;
  const itemLabel = result.type === 'bars' ? 'Barras' : 'Lotes';

  return (
    <ModalShell isOpen={onClose ? isOpen : false} onClose={onClose} size="md" hideCloseButton>
      <div className="flex flex-col items-center space-y-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.25)' }}>
          <Check className="w-8 h-8 text-[var(--pm-accent-emerald)]" strokeWidth={2.5} />
        </motion.div>
        <span className="text-sm font-sans font-bold text-[var(--pm-accent-emerald)]">Despacho Exitoso</span>
        <span className="text-xs text-[var(--pm-text-dim)] text-center">{message}</span>

        <div className="w-full p-4 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 space-y-2 text-[11px] font-mono">
          <div className="flex justify-between">
            <span className="text-[var(--pm-text-dim)]">Destinatario:</span>
            <span className="text-[var(--pm-accent-gold)] font-bold">{result.destination}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--pm-text-dim)]">Proveedores:</span>
            <span className="text-[var(--pm-text-primary)] font-bold">{result.providerCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--pm-text-dim)]">{itemLabel}:</span>
            <span className="text-[var(--pm-text-primary)] font-bold">{itemCount}</span>
          </div>
          <div className="border-t border-[var(--pm-border)] pt-2 flex justify-between">
            <span className="text-[var(--pm-text-dim)]">PESO BRUTO:</span>
            <span className="text-sm font-bold text-[var(--pm-accent-gold)]">{fmtWeight(result.grossWeight ?? result.totalWeight)}</span>
          </div>
        </div>

        <div className="flex gap-2 w-full">
          <button type="button" onClick={onPDFCliente}
            className="flex-1 py-2.5 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))', color: 'var(--pm-accent-emerald)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <User className="w-3.5 h-3.5" /> Comprobante Cliente
          </button>
          <button type="button" onClick={onPDFEmpresa}
            className="flex-1 py-2.5 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.06))', color: 'var(--pm-accent-emerald)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Building className="w-3.5 h-3.5" /> Comprobante Empresa
          </button>
        </div>

        <button type="button" onClick={onClose}
          className="w-full py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">Cerrar</button>
      </div>
    </ModalShell>
  );
}
