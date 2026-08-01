'use client';

import React from 'react';
import { Camera, Scale, Microscope, Zap, Check } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { HudButton } from '@/components/tactical/HudButton';
import { CameraTerminal } from '@/components/tactical/CameraTerminal';
import { formatNumber } from '@/lib/format';
import type { Bar } from '@/types/api';

interface ConfirmModalData {
  barId: string;
  basculaWeight: string;
  leyAu: string;
  leyAg: string;
}

interface DeviceSimulationModalProps {
  confirmModal: ConfirmModalData;
  selectedPackingBars?: Bar[];
  cameraMode: 'idle' | 'camera' | 'preview';
  photoPreviewUrl: string | null;
  photoUploadedUrl: string | null;
  modalLiveFA: number;
  isPending: boolean;
  onClose: () => void;
  onSyncValidate: () => void;
  onCameraModeChange: (mode: 'idle' | 'camera' | 'preview') => void;
  onCapture: (blob: Blob) => void;
  onRepeat: () => void;
  onFieldChange: (field: string, value: string) => void;
}

export function DeviceSimulationModal({
  confirmModal,
  selectedPackingBars,
  cameraMode,
  photoPreviewUrl,
  photoUploadedUrl,
  modalLiveFA,
  isPending,
  onClose,
  onSyncValidate,
  onCameraModeChange,
  onCapture,
  onRepeat,
  onFieldChange,
}: DeviceSimulationModalProps) {
  if (!confirmModal) return null;

  const targetBar = selectedPackingBars?.find(b => b.id === confirmModal.barId);

  return (
    <ModalShell isOpen onClose={onClose} noHeader noPadding size="md">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className={`transition-all duration-300 ${photoUploadedUrl ? 'opacity-100' : 'opacity-20'}`}>
            <Camera className={`w-5 h-5 ${photoUploadedUrl ? 'text-[var(--pm-accent-emerald)] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-[var(--pm-text-dim)]'}`} />
          </div>
          <Scale className="w-5 h-5 text-[var(--pm-text-dim)] opacity-20" />
          <Microscope className="w-5 h-5 text-[var(--pm-text-dim)] opacity-20" />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-mono font-bold text-[var(--pm-accent-gold)] tracking-wider">PROXIMAMENTE</h2>
          <p className="text-[11px] font-mono text-[var(--pm-text-dim)] mt-1 uppercase tracking-wider">
            Lectura de dispositivos externos (Báscula / Espectrómetro / Cámara)
          </p>
        </div>

        <div className="h-px bg-[var(--pm-border)]/30" />

        {cameraMode === 'camera' ? (
          <CameraTerminal
            onCapture={onCapture}
            onClose={() => onCameraModeChange('idle')}
          />
        ) : cameraMode === 'preview' ? (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border-2 border-[var(--pm-accent-cyan)]/30 bg-black">
              {photoPreviewUrl && (
                <img src={photoPreviewUrl} alt="Preview" className="w-full object-cover max-h-64" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {photoUploadedUrl ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--pm-accent-emerald)]/10 border border-[var(--pm-accent-emerald)]/20">
                    <Check className="w-3 h-3 text-[var(--pm-accent-emerald)]" />
                    <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-emerald)]">Foto lista</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--pm-accent-amber)]/10 border border-[var(--pm-accent-amber)]/20">
                    <LoadingSpinner size="xs" className="text-[var(--pm-accent-amber)]" />
                    <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-amber)]">Subiendo...</span>
                  </span>
                )}
              </div>
              <button type="button" onClick={onRepeat}
                className="px-4 py-2 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
                🔁 REPETIR
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3 h-3 text-[var(--pm-accent-gold)]" /> PESO BRUTO (g)
                </label>
                <input type="number" step="any" value={confirmModal.basculaWeight}
                  onChange={e => onFieldChange('basculaWeight', e.target.value)}
                  className="w-full bg-[var(--pm-bg-deepest)] border-2 border-[var(--pm-accent-gold)]/30 rounded-xl px-3 py-2 text-sm font-mono font-bold text-[var(--pm-text-primary)] text-right focus:outline-none focus:border-[var(--pm-accent-gold)] transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1.5">
                  <Microscope className="w-3 h-3 text-[var(--pm-accent-gold)]" /> LEY AU (‰)
                </label>
                <input type="number" step="0.1" min="0" max="1000" value={confirmModal.leyAu}
                  onChange={e => onFieldChange('leyAu', e.target.value)}
                  className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--pm-text-primary)] text-right focus:outline-none focus:border-[var(--pm-accent-gold)] transition-all" />
              </div>
            </div>
            {photoUploadedUrl ? (() => {
              const thumbProxy = photoUploadedUrl.startsWith('data:')
                ? photoUploadedUrl
                : `/api/blob/view?url=${encodeURIComponent(photoUploadedUrl)}`;
              return (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--pm-accent-emerald)]/30 bg-[var(--pm-accent-emerald)]/5">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-[var(--pm-border)] shrink-0 bg-black">
                  <img
                    src={thumbProxy}
                    alt="Foto adjunta"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-mono font-bold text-[var(--pm-accent-emerald)] flex items-center gap-1.5">
                    <Check className="w-3 h-3" /> Foto adjunta
                  </span>
                  <button type="button" onClick={() => onCameraModeChange('camera')}
                    className="text-[10px] font-mono text-[var(--pm-accent-cyan)] hover:underline mt-0.5 block cursor-pointer">
                    📷 Reemplazar foto
                  </button>
                </div>
              </div>
            );})() : (
              <HudButton variant="primary" onClick={() => onCameraModeChange('camera')} className="w-full justify-center">
                <Camera className="w-3.5 h-3.5" /> ADJUNTAR FOTO
              </HudButton>
            )}
          </>
        )}

        <div className="p-3 rounded-xl" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <span className="text-[9px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">PESO FINO</span>
          <span className="text-sm font-mono font-bold text-[var(--pm-accent-gold)] block text-center">{formatNumber(modalLiveFA, 2)} g</span>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
            Cancelar
          </button>
          <button type="button" onClick={onSyncValidate} disabled={isPending}
            className="flex-[2] py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))', color: 'var(--pm-accent-gold)', border: '1px solid rgba(212,175,55,0.3)' }}>
            {isPending ? (
              <><LoadingSpinner size="sm" className="text-[var(--pm-accent-gold)]" /> SINCRONIZANDO...</>
            ) : (
              <><Zap className="w-3.5 h-3.5" /> SINCRONIZAR Y VALIDAR</>
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
