'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Camera, Check, Pencil, X, Zap } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ModalShell } from '@/components/ui/ModalShell';
import { PinPadModal } from '@/components/packing/PinPadModal';
import type { Bar } from '@/types/api';

interface BarDetailModalProps {
  bar: Bar;
  spValues?: { grossWeight: number; purity: number; leyAg?: number };
  onClose: () => void;
  onValidate?: (barId: string) => void;
  onSave?: (barId: string, data: { grossWeight: number; purity: number }) => void;
  isSaving?: boolean;
}

export function BarDetailModal({
  bar,
  spValues,
  onClose,
  onValidate,
  onSave,
  isSaving = false,
}: BarDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPinPad, setShowPinPad] = useState(false);
  const [grossWeight, setGrossWeight] = useState(String(Number(bar.grossWeight)));
  const [purity, setPurity] = useState(String(Number(bar.purity)));

  const isPorValidar = bar.status === 'POR_VALIDAR';

  useEffect(() => {
    setGrossWeight(String(Number(bar.grossWeight)));
    setPurity(String(Number(bar.purity)));
    setIsEditing(false);
    setShowPinPad(false);
  }, [bar]);

  const photoUrl = bar.photoUrl || null;
  const srcProxy = photoUrl
    ? `/api/blob/view?url=${encodeURIComponent(photoUrl)}`
    : null;

  const spGross = spValues?.grossWeight ?? Number(bar.grossWeight);
  const spPurity = spValues?.purity ?? Number(bar.purity);
  const displayGross = Number(bar.grossWeight);
  const displayPurity = Number(bar.purity);
  const fa = displayGross * (displayPurity / 1000);

  const handleEditClick = () => {
    setShowPinPad(true);
  };

  const handlePinSuccess = () => {
    setShowPinPad(false);
    setIsEditing(true);
  };

  const handleValidate = () => {
    if (!onValidate) return;
    onValidate(bar.id);
  };

  const handleSaveChanges = () => {
    if (!onSave) return;
    const bw = parseFloat(grossWeight);
    const la = parseFloat(purity);
    if (isNaN(bw) || isNaN(la)) return;
    onSave(bar.id, { grossWeight: bw, purity: la });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setGrossWeight(String(Number(bar.grossWeight)));
    setPurity(String(Number(bar.purity)));
  };

  return (
    <>
      <ModalShell isOpen onClose={onClose} noHeader noPadding size="lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--pm-border)]/20">
          <div>
            <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-cyan)] uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5" /> DETALLE DE BARRA
            </span>
            <h2 className="text-lg font-mono font-bold text-[var(--pm-text-primary)] mt-0.5 tracking-tight">
              {bar.barNumber}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--pm-border)]/40">
                <StatusBadge status={bar.status} size="sm" className="border-0 bg-transparent px-0" />
              </div>
              <span className="text-[8px] font-mono text-[var(--pm-text-dim)] block mt-1">
                {new Date(bar.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button type="button" onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] active:scale-90 transition-all cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Photo */}
          <div className="rounded-xl overflow-hidden border border-[var(--pm-border)] bg-black/60 flex items-center justify-center min-h-[160px]">
            {srcProxy ? (
              <img
                src={srcProxy}
                alt={`Barra ${bar.barNumber}`}
                className="w-full object-cover max-h-56"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.fallback-icon')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'fallback-icon text-center p-6';
                    fallback.innerHTML = `
                      <div class="w-8 h-8 mx-auto mb-2 flex items-center justify-center rounded-lg" style="background: rgba(100,100,100,0.1); border: 1px solid rgba(100,100,100,0.2)">
                        <svg class="w-4 h-4 text-[var(--pm-text-dim)]/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                      </div>
                      <p class="text-[10px] font-mono text-[var(--pm-text-dim)]/40">Cámara no disponible</p>
                    `;
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <div className="text-center p-6">
                <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center rounded-lg" style={{ background: 'rgba(100,100,100,0.1)', border: '1px solid rgba(100,100,100,0.2)' }}>
                  <Camera className="w-4 h-4 text-[var(--pm-text-dim)]/40" />
                </div>
                <p className="text-[10px] font-mono text-[var(--pm-text-dim)]/40">Sin evidencia fotográfica</p>
              </div>
            )}
          </div>

          {/* Data Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* SP Values */}
            <div className="p-3 rounded-xl border border-[var(--pm-border)]/40 bg-[var(--pm-bg-deepest)]/30">
              <span className="text-[8px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">SEGÚN PACKING (SP)</span>
              <div className="mt-2 space-y-1 text-center">
                <div>
                  <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Bruto</span>
                  <span className="text-sm font-mono font-bold text-[var(--pm-text-primary)]">{formatNumber(spGross, 2)} g</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Ley Au</span>
                  <span className="text-sm font-mono font-bold text-[var(--pm-text-primary)]">{formatNumber(spPurity, 1)} ‰</span>
                </div>
              </div>
            </div>

            {/* Validated / Editable Values */}
            <div className={`p-3 rounded-xl border transition-all ${isEditing ? 'border-[var(--pm-accent-gold)]/40 bg-[var(--pm-accent-gold)]/5' : 'border-[var(--pm-accent-cyan)]/30 bg-[var(--pm-accent-cyan)]/5'}`}>
              <span className={`text-[8px] font-mono uppercase tracking-wider block text-center ${isEditing ? 'text-[var(--pm-accent-gold)]' : 'text-[var(--pm-accent-cyan)]'}`}>
                {isEditing ? 'EDITANDO' : 'REAL (VALIDADO)'}
              </span>
              <div className="mt-2 space-y-2 text-center">
                <div>
                  <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Bruto</span>
                  {isEditing ? (
                    <input
                      type="number"
                      step="any"
                      value={grossWeight}
                      onChange={e => setGrossWeight(e.target.value)}
                      className="w-full bg-[var(--pm-bg-deepest)] border-2 border-[var(--pm-accent-gold)]/30 rounded-lg px-2 py-1 text-sm font-mono font-bold text-[var(--pm-accent-gold)] text-center focus:outline-none focus:border-[var(--pm-accent-gold)] transition-all"
                    />
                  ) : (
                    <span className="text-sm font-mono font-bold text-[var(--pm-accent-cyan)]">{formatNumber(displayGross, 2)} g</span>
                  )}
                </div>
                <div>
                  <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Ley Au</span>
                  {isEditing ? (
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="1000"
                      value={purity}
                      onChange={e => setPurity(e.target.value)}
                      className="w-full bg-[var(--pm-bg-deepest)] border-2 border-[var(--pm-accent-gold)]/30 rounded-lg px-2 py-1 text-sm font-mono font-bold text-[var(--pm-accent-gold)] text-center focus:outline-none focus:border-[var(--pm-accent-gold)] transition-all"
                    />
                  ) : (
                    <span className="text-sm font-mono font-bold text-[var(--pm-accent-cyan)]">{formatNumber(displayPurity, 1)} ‰</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fine Weight */}
          <div className="p-3 rounded-xl border border-[var(--pm-accent-gold)]/20 bg-[var(--pm-accent-gold)]/5">
            <span className="text-[8px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">PESO FINO</span>
            <span className="text-sm font-mono font-bold text-[var(--pm-accent-gold)] block text-center">{formatNumber(fa, 4)} g</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button type="button" onClick={handleCancelEdit}
                  className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
                  Cancelar
                </button>
                <button type="button" onClick={handleSaveChanges} disabled={isSaving}
                  className="flex-[2] py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))',
                    color: 'var(--pm-accent-gold)',
                    border: '1px solid rgba(212,175,55,0.3)',
                    boxShadow: '0 0 16px rgba(212,175,55,0.15)',
                  }}>
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[var(--pm-accent-gold)]/30 border-t-[var(--pm-accent-gold)] rounded-full animate-spin" />
                      GUARDANDO...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      GUARDAR CAMBIOS
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={onClose}
                  className="py-2.5 px-4 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
                  CERRAR
                </button>
                <button type="button" onClick={handleEditClick}
                  className="py-2.5 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                    color: 'var(--pm-accent-gold)',
                    border: '1px solid rgba(212,175,55,0.25)',
                  }}>
                  <Pencil className="w-3.5 h-3.5" />
                  EDITAR
                </button>
                {isPorValidar && onValidate && (
                  <button type="button" onClick={handleValidate} disabled={isSaving}
                    className="flex-[2] py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))',
                      color: 'var(--pm-accent-emerald)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      boxShadow: '0 0 16px rgba(16,185,129,0.15)',
                    }}>
                    {isSaving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-[var(--pm-accent-emerald)]/30 border-t-[var(--pm-accent-emerald)] rounded-full animate-spin" />
                        VALIDANDO...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        VALIDAR BARRA
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </ModalShell>

      {/* PIN Pad Modal */}
      <PinPadModal
        isOpen={showPinPad}
        onClose={() => setShowPinPad(false)}
        onUnlock={handlePinSuccess}
        title="PIN DE SEGURIDAD"
        subtitle="Ingrese 4 dígitos para desbloquear edición"
        mode="unlock"
      />
    </>
  );
}
