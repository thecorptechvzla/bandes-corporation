'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Check, Download } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { formatNumber } from '@/lib/format';

interface DispatchResult {
  reference: string;
  destination: string;
  totalWeight: number;
  lotCount?: number;
  barCount?: number;
  providerCount: number;
  lots?: { name: string; weight: number; provider: string }[];
  bars?: { barNumber: string; grossWeight: number; purity: number; fineWeight: number; provider: string }[];
  providers: { name: string; count: number; weight: number }[];
  createdAt: string;
  type: 'lots' | 'bars';
}

interface DispatchSuccessOverlayProps {
  isOpen: boolean;
  result: DispatchResult;
  message: string;
  onPDF: () => void;
  onClose: () => void;
}

const fmtWeight = (val: number) => `${formatNumber(val, 2)} g`;

export function DispatchSuccessOverlay({ isOpen, result, message, onPDF, onClose }: DispatchSuccessOverlayProps) {
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

        <div className="w-full p-4 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 space-y-2 text-[10px] font-mono">
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
            <span className="text-[var(--pm-text-dim)]">Peso Total:</span>
            <span className="text-sm font-bold text-[var(--pm-accent-gold)]">{fmtWeight(result.totalWeight)}</span>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button type="button" onClick={onPDF}
            className="flex-[2] py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))', color: 'var(--pm-accent-gold)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <Download className="w-4 h-4" /> Descargar PDF</button>
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">Cerrar</button>
        </div>
      </div>
    </ModalShell>
  );
}
