'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, Camera, Check } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import type { Bar } from '@/types/api';

interface EvidenceModalProps {
  barId: string | null;
  bars: Bar[];
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  POR_VALIDAR: 'POR VALIDAR',
  IN_STOCK: 'VALIDADO',
  PROCESANDO: 'EN PROCESO',
  COMPLETADO: 'VALIDADO',
  EXITED: 'EGRESADO',
};

const STATUS_STYLES: Record<string, string> = {
  POR_VALIDAR: 'text-[var(--pm-accent-amber)] bg-[var(--pm-accent-amber)]/10 border-[var(--pm-accent-amber)]/20',
  IN_STOCK: 'text-[var(--pm-accent-emerald)] bg-[var(--pm-accent-emerald)]/10 border-[var(--pm-accent-emerald)]/20',
  PROCESANDO: 'text-[var(--pm-accent-cyan)] bg-[var(--pm-accent-cyan)]/10 border-[var(--pm-accent-cyan)]/20',
  COMPLETADO: 'text-[var(--pm-accent-emerald)] bg-[var(--pm-accent-emerald)]/10 border-[var(--pm-accent-emerald)]/20',
  EXITED: 'text-[var(--pm-text-dim)] bg-[var(--pm-bg-tertiary)]/50 border-[var(--pm-border)]/30',
};

export function EvidenceModal({ barId, bars, onClose }: EvidenceModalProps) {
  if (!barId) return null;
  const bar = bars.find(b => b.id === barId);
  if (!bar) return null;

  const srcProxy = `/api/blob/view?url=${encodeURIComponent(bar.photoUrl || '')}`;

  return (
    <motion.div key="evidence" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden border border-[var(--pm-border)]/40"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--pm-border)]/20">
          <div>
            <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-cyan)] uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5" /> EVIDENCIA
            </span>
            <h2 className="text-lg font-mono font-bold text-[var(--pm-text-primary)] mt-0.5 tracking-tight">
              {bar.barNumber}
            </h2>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${STATUS_STYLES[bar.status] || ''}`}>
              <Check className={`w-3 h-3 ${bar.status === 'PROCESANDO' ? 'text-cyan-400' : bar.status === 'EXITED' ? 'text-[var(--pm-text-dim)]' : 'text-[var(--pm-accent-emerald)]'}`} />
              <span className={`text-[9px] font-mono font-bold ${bar.status === 'PROCESANDO' ? 'text-cyan-400' : bar.status === 'EXITED' ? 'text-[var(--pm-text-dim)]' : 'text-[var(--pm-accent-emerald)]'}`}>{STATUS_LABELS[bar.status] || bar.status}</span>
            </div>
            <span className="text-[8px] font-mono text-[var(--pm-text-dim)] block mt-1">
              {new Date(bar.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-xl overflow-hidden border border-[var(--pm-border)] bg-black/60 flex items-center justify-center min-h-[160px]">
            {bar.photoUrl ? (
              <img
                src={srcProxy}
                alt={`Barra ${bar.barNumber}`}
                className="w-full object-cover max-h-56"
              />
            ) : (
              <div className="text-center p-6">
                <Camera className="w-8 h-8 text-[var(--pm-text-dim)]/30 mx-auto mb-2" />
                <p className="text-[10px] font-mono text-[var(--pm-text-dim)]/40">Sin evidencia fotográfica</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-[var(--pm-accent-gold)]/20 bg-[var(--pm-accent-gold)]/5">
              <span className="text-[8px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">Peso Bruto</span>
              <span className="text-sm font-mono font-bold text-[var(--pm-accent-gold)] block text-center mt-1">{formatNumber(Number(bar.grossWeight), 2)} g</span>
            </div>
            <div className="p-3 rounded-xl border border-[var(--pm-accent-cyan)]/20 bg-[var(--pm-accent-cyan)]/5">
              <span className="text-[8px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">Ley Au</span>
              <span className="text-sm font-mono font-bold text-[var(--pm-accent-cyan)] block text-center mt-1">{formatNumber(Number(bar.purity), 1)} ‰</span>
            </div>
            <div className="p-3 rounded-xl border border-[var(--pm-accent-gold)]/20 bg-[var(--pm-accent-gold)]/5">
              <span className="text-[8px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">Peso Fino</span>
              <span className="text-sm font-mono font-bold text-[var(--pm-accent-gold)] block text-center mt-1">{formatNumber(Number(bar.fineWeight), 4)} g</span>
            </div>
          </div>

          <button type="button" onClick={onClose}
            className="w-full py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
            CERRAR FICHA
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
