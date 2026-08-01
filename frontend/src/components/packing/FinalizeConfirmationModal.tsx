'use client';

import React from 'react';
import { ClipboardCheck, Check } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';

interface FinalizeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function FinalizeConfirmationModal({ isOpen, onClose, onConfirm }: FinalizeConfirmationModalProps) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} noHeader noPadding size="sm">
      <div className="p-6 space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.25)' }}>
            <ClipboardCheck className="w-7 h-7 text-[var(--pm-accent-emerald)]" strokeWidth={2.5} />
          </div>
          <h2 className="text-sm font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Confirmar Validación</h2>
          <p className="text-[11px] font-mono text-[var(--pm-text-dim)] mt-2 leading-relaxed">
            ¿Confirmar recepción técnica del material? Se marcará el Packing como <strong className="text-[var(--pm-accent-emerald)]">VALIDADO</strong>{' '}
            y las barras estarán disponibles para fundición.
          </p>
        </div>
        <div className="h-px bg-[var(--pm-border)]/30" />
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
