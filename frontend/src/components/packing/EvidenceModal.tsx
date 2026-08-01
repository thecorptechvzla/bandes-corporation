'use client';

import React from 'react';
import { ClipboardCheck, Check, Camera } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatNumber } from '@/lib/format';
import type { Bar } from '@/types/api';

interface EvidenceModalProps {
  barId: string | null;
  bars: Bar[];
  packingBars?: Bar[];
  spValues: Record<string, { grossWeight: number; purity: number; leyAg?: number }>;
  barPhotoUrls: Record<string, string>;
  onClose: () => void;
}

export function EvidenceModal({ barId, bars, packingBars, spValues, barPhotoUrls, onClose }: EvidenceModalProps) {
  const bar = bars.find(b => b.id === barId) || packingBars?.find(b => b.id === barId);
  if (!bar) return null;

  const sp = spValues[bar.id];
  const spGross = sp?.grossWeight ?? Number(bar.grossWeight);
  const spPurity = sp?.purity ?? Number(bar.purity);
  const validatedGross = Number(bar.grossWeight);
  const validatedPurity = Number(bar.purity);
  const fa = validatedGross * (validatedPurity / 1000);
  const photoUrl = bar.photoUrl || barPhotoUrls[bar.id] || null;
  const srcProxy = photoUrl?.startsWith('data:')
    ? photoUrl
    : `/api/blob/view?url=${encodeURIComponent(photoUrl || '')}`;
  const validatedAt = bar.updatedAt;

  return (
    <ModalShell isOpen onClose={onClose} noHeader noPadding size="lg">
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--pm-border)]/20">
        <div>
          <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-cyan)] uppercase tracking-wider flex items-center gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5" /> EVIDENCIA DE VALIDACIÓN
          </span>
          <h2 className="text-lg font-mono font-bold text-[var(--pm-text-primary)] mt-0.5 tracking-tight">
            {bar.barNumber}
          </h2>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border">
            <Check className={`w-3 h-3 ${bar.status === 'PROCESANDO' ? 'text-cyan-400' : bar.status === 'EXITED' ? 'text-[var(--pm-text-dim)]' : 'text-[var(--pm-accent-emerald)]'}`} />
            <StatusBadge status={bar.status} size="sm" className="border-0 bg-transparent px-0" />
          </div>
          {validatedAt && (
            <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block mt-1">
              {new Date(validatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="rounded-xl overflow-hidden border border-[var(--pm-border)] bg-black/60 flex items-center justify-center min-h-[160px]">
          {photoUrl ? (
            <img
              src={srcProxy}
              alt={`Barra ${bar.barNumber}`}
              className="w-full object-cover max-h-56"
            />
          ) : (
            <div className="text-center p-6">
              <Camera className="w-8 h-8 text-[var(--pm-text-dim)]/30 mx-auto mb-2" />
              <p className="text-[11px] font-mono text-[var(--pm-text-dim)]/60">Sin evidencia fotográfica</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border border-[var(--pm-border)]/40 bg-[var(--pm-bg-deepest)]/30">
            <span className="text-[9px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">SEGÚN PACKING (SP)</span>
            <div className="mt-2 space-y-1 text-center">
              <div>
                <span className="text-[10px] font-mono text-[var(--pm-text-dim)] block">Bruto</span>
                <span className="text-sm font-mono font-medium text-slate-200">{formatNumber(spGross, 2)} g</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[var(--pm-text-dim)] block">Ley Au</span>
                <span className="text-sm font-mono font-medium text-slate-200">{formatNumber(spPurity, 1)} ‰</span>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl border border-[var(--pm-accent-cyan)]/30 bg-[var(--pm-accent-cyan)]/5">
            <span className="text-[9px] font-mono text-[var(--pm-accent-cyan)] uppercase tracking-wider block text-center">REAL (VALIDADO)</span>
            <div className="mt-2 space-y-1 text-center">
              <div>
                <span className="text-[10px] font-mono text-[var(--pm-text-dim)] block">Bruto</span>
                <span className="text-sm font-mono font-medium text-[var(--pm-accent-cyan)]">{formatNumber(validatedGross, 2)} g</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[var(--pm-text-dim)] block">Ley Au</span>
                <span className="text-sm font-mono font-medium text-[var(--pm-accent-cyan)]">{formatNumber(validatedPurity, 1)} ‰</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-[var(--pm-accent-gold)]/20 bg-[var(--pm-accent-gold)]/5">
          <span className="text-[9px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">PESO FINO</span>
          <span className="text-sm font-mono font-medium text-[var(--pm-accent-gold)] block text-center">{formatNumber(fa, 4)} g</span>
        </div>

        <button type="button" onClick={onClose}
          className="w-full py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
          CERRAR FICHA
        </button>
      </div>
    </ModalShell>
  );
}
