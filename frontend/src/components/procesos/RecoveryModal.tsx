'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Microscope, AlertTriangle, CheckCircle2, Zap, X, Camera, ImagePlus, RefreshCw } from 'lucide-react';
import { HudButton } from '@/components/tactical/HudButton';
import { formatNumber } from '@/lib/format';
import { ModalShell } from '@/components/ui/ModalShell';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { HardwareSyncOverlay } from './HardwareSyncOverlay';
import { CameraTerminal } from '@/components/tactical/CameraTerminal';
import { useUpdateLot } from '@/hooks/useLots';
import { useUpdateProcess } from '@/hooks/useProcesses';
import { useUpdateBar } from '@/hooks/useBars';
import type { Lot, Bar } from '@/types/api';

interface RecoveryModalProps {
  lot: Lot;
  lotBarsMap: Record<string, Bar[]>;
  processLotsMap: Record<string, Lot[]>;
  onClose: () => void;
  uploadPhoto: (blob: Blob) => Promise<string>;
  isMixedProcess?: boolean;
}

type CameraMode = 'idle' | 'camera' | 'preview';

export function RecoveryModal({ lot, lotBarsMap, processLotsMap, onClose, uploadPhoto, isMixedProcess }: RecoveryModalProps) {
  const updateLot = useUpdateLot();
  const updateProcess = useUpdateProcess();
  const updateBar = useUpdateBar();

  const lotBars = lotBarsMap[lot.id] || [];
  const lotGross = lotBars.reduce((s, b) => s + Number(b.grossWeight), 0);
  const lotFA = lotBars.reduce((s, b) => s + Number(b.fineWeight), 0);

  const [recoveredWeight, setRecoveredWeight] = useState('');
  const [recoveredLeyAu, setRecoveredLeyAu] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [activeHardwareMode, setActiveHardwareMode] = useState<'WEIGHT' | 'LEY' | null>(null);
  const [hwWeight, setHwWeight] = useState(recoveredWeight);
  const [hwLeyAu, setHwLeyAu] = useState(recoveredLeyAu);

  const [cameraMode, setCameraMode] = useState<CameraMode>('idle');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(
    lot.photoUrl ? `/api/blob/view?url=${encodeURIComponent(lot.photoUrl)}` : null,
  );
  const [photoUploadedUrl, setPhotoUploadedUrl] = useState<string | null>(lot.photoUrl ?? null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  const recWeightNum = parseFloat(recoveredWeight) || 0;
  const recoveredLeyAuNum = parseFloat(recoveredLeyAu) || 0;
  const calculatedFineWeight = (recWeightNum * recoveredLeyAuNum) / 1000;
  const diferenciaFino = lotFA - calculatedFineWeight;
  const mermaBruto = lotGross - recWeightNum;
  const discrepancy = lotFA > 0 ? (diferenciaFino / lotFA) * 100 : 0;

  const blockNonNumeric = (e: React.KeyboardEvent) => {
    const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(e.key) || (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key))) return;
    if (/^[0-9]$/.test(e.key)) return;
    if (e.key === ',' || e.key === '.') return;
    e.preventDefault();
  };

  const handlePasteNumeric = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!/^[0-9.,]+$/.test(text)) e.preventDefault();
  };

  const handleCapture = useCallback(async (blob: Blob) => {
    const localUrl = URL.createObjectURL(blob);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = localUrl;
    setPhotoPreviewUrl(localUrl);
    setCameraMode('idle');
    setPhotoUploading(true);
    try {
      const url = await uploadPhoto(blob);
      setPhotoUploadedUrl(url);
      updateLot.mutateAsync({ id: lot.id, data: { photoUrl: url } }).catch(err => {
        console.error('Failed to persist photoUrl:', err);
      });
    } catch (err) {
      console.error('Auto-upload failed:', err);
    } finally {
      setPhotoUploading(false);
    }
  }, [uploadPhoto]);

  const handleRepeatPhoto = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPhotoPreviewUrl(null);
    setPhotoUploadedUrl(null);
    setCameraMode('camera');
  }, []);

  const handleConfirmRecovery = async () => {
    setRecoveryError('');
    const rw = parseFloat(recoveredWeight);
    if (isNaN(rw) || rw <= 0) {
      setRecoveryError('Ingrese un peso bruto válido.');
      return;
    }
    const lau = parseFloat(recoveredLeyAu);
    if (isNaN(lau) || lau <= 0) {
      setRecoveryError('Ingrese una Ley Au válida (‰).');
      return;
    }
    if (!photoUploadedUrl) {
      setRecoveryError('Se requiere foto de evidencia para cerrar la colada.');
      return;
    }
    setConfirming(true);
    try {
      await updateLot.mutateAsync({
        id: lot.id,
        data: {
          recovered: rw,
          purity: lau,
          fineWeight: Math.round(((rw * lau) / 1000) * 100) / 100,
          recoveryAt: new Date().toISOString(),
          photoUrl: photoUploadedUrl,
        },
      });
      const pl = processLotsMap[lot.processId] || [];
      const allDone = pl.every(l =>
        l.id === lot.id ? rw > 0 : (l.recovered !== null && Number(l.recovered) > 0),
      );
      if (allDone) {
        await updateProcess.mutateAsync({
          id: lot.processId,
          data: { status: 'CLOSED' },
        });
      }
      const lb = lotBarsMap[lot.id] || [];
      for (const bar of lb) {
        await updateBar.mutateAsync({ id: bar.id, data: { status: 'COMPLETADO' } });
      }
      setRecoverySuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setRecoveryError(err?.message || 'Error al confirmar recuperación.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <ModalShell
        isOpen
        onClose={onClose}
        noHeader
        noPadding
        size="md"
        closeOnBackdrop={false}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--pm-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Microscope className="w-4 h-4 text-[var(--pm-accent-emerald)]" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-emerald)] uppercase tracking-wider">Calibrar Colada</span>
              <h3 className="text-sm font-sans font-semibold text-[var(--pm-text-primary)] mt-0.5 flex items-center gap-2">
                {lot.name}
                {isMixedProcess && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-[var(--pm-accent-emerald)]/15 border border-[var(--pm-accent-emerald)]/30 text-[var(--pm-accent-emerald)]">
                    MIXTO
                  </span>
                )}
              </h3>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={confirming}
            className="p-1.5 rounded-lg hover:bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] active:scale-90 transition-all cursor-pointer disabled:opacity-40"
          ><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] v2-scroll">
          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-center">
              <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Barras</span>
              <span className="text-sm font-mono font-bold text-[var(--pm-text-primary)]">{lotBars.length}</span>
            </div>
            <div className="p-2 rounded-lg border border-[var(--pm-accent-gold)]/25 bg-[var(--pm-bg-deepest)]/50 text-center">
              <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Peso Bruto</span>
              <span className="text-lg font-mono font-bold text-[var(--pm-accent-gold)]">{formatNumber(lotGross, 2)} g</span>
            </div>
            <div className="p-2 rounded-lg border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-center">
              <span className="text-[8px] font-mono text-[var(--pm-text-dim)] block">FA Cargado</span>
              <span className="text-xs font-mono font-bold text-[var(--pm-accent-gold)]">{formatNumber(lotFA, 2)} g</span>
            </div>
          </div>

          {/* Photo Evidence — mandatory */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3 h-3 text-[var(--pm-accent-cyan)]" />
              Foto de Evidencia
              <span className="text-[var(--pm-accent-red)]">*</span>
            </label>

            {cameraMode === 'camera' && (
              <div className="rounded-xl overflow-hidden border border-[var(--pm-border)] bg-black">
                <CameraTerminal
                  onCapture={handleCapture}
                  onClose={() => setCameraMode('idle')}
                />
              </div>
            )}

            {cameraMode === 'idle' && !photoPreviewUrl && (
              <button
                type="button"
                onClick={() => setCameraMode('camera')}
                className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--pm-accent-cyan)]/30 bg-[var(--pm-accent-cyan)]/5 hover:bg-[var(--pm-accent-cyan)]/10 transition-all flex flex-col items-center gap-2 cursor-pointer"
              >
                <ImagePlus className="w-6 h-6 text-[var(--pm-accent-cyan)]/50" />
                <span className="text-[11px] font-mono text-[var(--pm-accent-cyan)] font-bold uppercase tracking-wider">
                  Capturar Foto
                </span>
                <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">
                  Obligatorio para cerrar la colada
                </span>
              </button>
            )}

            {cameraMode === 'idle' && photoPreviewUrl && (
              <div className="relative rounded-xl overflow-hidden border border-[var(--pm-border)] aspect-video">
                <img src={photoPreviewUrl} alt="Evidencia" className="w-full h-full object-cover object-center bg-black" />
                {photoUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--pm-bg-deepest)]/90 border border-[var(--pm-border)]">
                      <LoadingSpinner size="sm" className="text-[var(--pm-accent-cyan)]" />
                      <span className="text-[11px] font-mono text-[var(--pm-text-dim)]">Subiendo foto...</span>
                    </div>
                  </div>
                )}
                {photoUploadedUrl && (
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--pm-accent-emerald)]/15 border border-[var(--pm-accent-emerald)]/30">
                      <CheckCircle2 className="w-3 h-3 text-[var(--pm-accent-emerald)]" />
                      <span className="text-[9px] font-mono text-[var(--pm-accent-emerald)] font-bold">EVIDENCIA CAPTURADA</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleRepeatPhoto}
                    disabled={photoUploading}
                    className="p-2 rounded-lg bg-[var(--pm-bg-deepest)]/80 border border-[var(--pm-border)] hover:bg-[var(--pm-bg-tertiary)] transition-all cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[var(--pm-accent-cyan)]" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Peso Bruto + button */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Peso Bruto (g)</label>
            <div className="flex gap-2">
              <input type="number" step="0.01" value={recoveredWeight}
                onChange={e => setRecoveredWeight(e.target.value)}
                onKeyDown={blockNonNumeric}
                onPaste={handlePasteNumeric}
                className="flex-1 bg-[var(--pm-bg-deepest)] border border-[var(--pm-accent-gold)]/30 rounded-lg px-3 py-2 text-xl font-bold font-mono text-[var(--pm-accent-gold)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors"
              />
              <HudButton variant="ghost" className="text-[10px] px-3 shrink-0"
                onClick={() => { setActiveHardwareMode('WEIGHT'); setHwWeight(recoveredWeight); }}
              >
                ⚖️ Peso
              </HudButton>
            </div>
          </div>

          {/* Ley Au + button */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Ley Au (‰)</label>
            <div className="flex gap-2">
              <input type="number" min="0" max="1000" step="0.1" value={recoveredLeyAu}
                onChange={e => setRecoveredLeyAu(e.target.value)}
                onKeyDown={blockNonNumeric}
                onPaste={handlePasteNumeric}
                className="flex-1 bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-amber)] transition-colors"
              />
              <HudButton variant="ghost" className="text-[10px] px-3 shrink-0"
                onClick={() => { setActiveHardwareMode('LEY'); setHwLeyAu(recoveredLeyAu); }}
              >
                🔬 Leyes
              </HudButton>
            </div>
          </div>

          {/* Fino Calculado — real-time */}
          {recWeightNum > 0 && recoveredLeyAuNum > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--pm-accent-gold)]/20 bg-[var(--pm-accent-gold)]/5"
            >
              <span className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Fino Calculado (FA)</span>
              <span className="text-sm font-mono font-bold text-[var(--pm-accent-gold)]">{formatNumber(calculatedFineWeight, 2)} g</span>
            </motion.div>
          )}

          {/* Discrepancy */}
          {recWeightNum > 0 && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-xl border ${Math.abs(discrepancy) > 5 ? 'border-[var(--pm-accent-red)]/25 bg-[var(--pm-accent-red)]/5' : 'border-[var(--pm-accent-emerald)]/25 bg-[var(--pm-accent-emerald)]/5'}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: Math.abs(discrepancy) > 5 ? 'var(--pm-accent-red)' : 'var(--pm-accent-emerald)' }}>
                  <Zap className="w-3 h-3 inline mr-1" />
                  {Math.abs(discrepancy) > 5 ? 'Discrepancia Alta' : 'Discrepancia Normal'}
                </span>
                <span className="text-xs font-mono font-bold" style={{ color: discrepancy >= 0 ? 'var(--pm-accent-emerald)' : 'var(--pm-accent-red)' }}>
                  {discrepancy >= 0 ? '+' : ''}{discrepancy.toFixed(2)}%
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 font-mono">
                <div className="space-y-2">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Microscope className="w-3 h-3" /> Fino
                  </span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500">FA Cargado</span>
                    <span className="text-base font-bold text-[var(--pm-accent-gold)]">{formatNumber(lotFA, 2)} g</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500">Fino Calculado</span>
                    <span className="text-base font-bold text-slate-200">{formatNumber(calculatedFineWeight, 2)} g</span>
                  </div>
                  <div className="flex justify-between items-baseline border-t border-[var(--pm-border)]/40 pt-2">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500">Diferencia de Fino</span>
                    <span className={`text-base font-bold ${diferenciaFino >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {diferenciaFino >= 0 ? '+' : ''}{formatNumber(diferenciaFino, 2)} g
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Zap className="w-3 h-3" /> Bruto
                  </span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500">Peso Bruto Original</span>
                    <span className="text-base font-bold text-[var(--pm-accent-gold)]">{formatNumber(lotGross, 2)} g</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500">Peso Bruto Nuevo</span>
                    <span className="text-base font-bold text-slate-200">{formatNumber(recWeightNum, 2)} g</span>
                  </div>
                  <div className="flex justify-between items-baseline border-t border-[var(--pm-border)]/40 pt-2">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500">Merma de Bruto</span>
                    <span className={`text-base font-bold ${mermaBruto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {mermaBruto >= 0 ? '+' : ''}{formatNumber(mermaBruto, 2)} g
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {recoveryError && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-mono bg-[var(--pm-accent-red)]/10 border border-[var(--pm-accent-red)]/25 text-[var(--pm-accent-red)]">
              <AlertTriangle className="w-4 h-4 shrink-0" />{recoveryError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={confirming}
              className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40"
            >Cancelar</button>
            <button type="button" onClick={() => {
              handleConfirmRecovery();
            }} disabled={confirming || !photoUploadedUrl || !(parseFloat(recoveredWeight) > 0) || !(parseFloat(recoveredLeyAu) > 0)}
              className="flex-1 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: !photoUploadedUrl || !(parseFloat(recoveredWeight) > 0) || !(parseFloat(recoveredLeyAu) > 0)
                  ? 'rgba(100,100,100,0.15)'
                  : Math.abs(discrepancy) > 5 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                color: !photoUploadedUrl || !(parseFloat(recoveredWeight) > 0) || !(parseFloat(recoveredLeyAu) > 0)
                  ? 'var(--pm-text-dim)'
                  : Math.abs(discrepancy) > 5 ? 'var(--pm-accent-red)' : 'var(--pm-accent-emerald)',
                border: `1px solid ${!photoUploadedUrl || !(parseFloat(recoveredWeight) > 0) || !(parseFloat(recoveredLeyAu) > 0)
                  ? 'rgba(100,100,100,0.3)'
                  : Math.abs(discrepancy) > 5 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
              }}
            >
              {confirming ? (
                <><LoadingSpinner size="sm" className="text-current" /> Confirmando...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Confirmar Recuperación</>
              )}
            </button>
          </div>
        </div>
      </ModalShell>

      {/* Hardware Sync Overlay */}
      {activeHardwareMode && (
        <HardwareSyncOverlay
          mode={activeHardwareMode}
          weight={hwWeight}
          ley={hwLeyAu}
          onWeightChange={setHwWeight}
          onLeyChange={setHwLeyAu}
          onConfirm={() => {
            if (activeHardwareMode === 'WEIGHT') {
              setRecoveredWeight(hwWeight);
            } else {
              setRecoveredLeyAu(hwLeyAu);
            }
            setActiveHardwareMode(null);
          }}
          onCancel={() => setActiveHardwareMode(null)}
        />
      )}

      {/* Recovery success overlay */}
      <AnimatePresence>
        {recoverySuccess && (
          <motion.div key="rec-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-xs glass-panel rounded-2xl p-8 flex flex-col items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.25)' }}>
                <CheckCircle2 className="w-7 h-7 text-[var(--pm-accent-emerald)]" strokeWidth={2} />
              </div>
              <span className="text-sm font-sans font-bold text-[var(--pm-accent-emerald)]">Colada Calibrada</span>
              <span className="text-[11px] font-mono text-[var(--pm-text-dim)] text-center">
                Oro recuperado y registrado correctamente.
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
