'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardCheck, Camera, Check, Pencil, X, Zap, Scale, Microscope, Cpu, ChevronRight } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ModalShell } from '@/components/ui/ModalShell';
import { PinPadModal } from '@/components/packing/PinPadModal';
import { CameraTerminal } from '@/components/tactical/CameraTerminal';
import type { Bar } from '@/types/api';

interface BarDetailModalProps {
  bar: Bar;
  spValues?: { grossWeight: number; purity: number; leyAg?: number };
  onClose: () => void;
  onValidate?: (barId: string, data: { grossWeight: number; purity: number; photoUrl?: string }) => void;
  onSave?: (barId: string, data: { grossWeight: number; purity: number; photoUrl?: string }) => void;
  isSaving?: boolean;
  readOnly?: boolean;
  zIndex?: string;
}

export function BarDetailModal({
  bar,
  spValues,
  onClose,
  onValidate,
  onSave,
  isSaving = false,
  readOnly = false,
  zIndex = 'z-50',
}: BarDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPinPad, setShowPinPad] = useState(false);
  const [grossWeight, setGrossWeight] = useState(String(Number(bar.grossWeight)));
  const [purity, setPurity] = useState(String(Number(bar.purity)));

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoUploadedUrl, setPhotoUploadedUrl] = useState<string | null>(null);

  const [isReadingWeight, setIsReadingWeight] = useState(false);
  const [scaleError, setScaleError] = useState<string | null>(null);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);

  const isPorValidar = bar.status === 'POR_VALIDAR';

  useEffect(() => {
    setGrossWeight(String(Number(bar.grossWeight)));
    setPurity(String(Number(bar.purity)));
    setIsEditing(false);
    setShowPinPad(false);
    setShowCameraModal(false);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(null);
    setPhotoUploadedUrl(null);
  }, [bar]);

  const photoUrl = bar.photoUrl || photoUploadedUrl || null;
  const srcProxy = photoUrl
    ? `/api/blob/view?url=${encodeURIComponent(photoUrl)}`
    : null;

  const spGross = spValues?.grossWeight ?? Number(bar.grossWeight);
  const spPurity = spValues?.purity ?? Number(bar.purity);
  const displayGross = grossWeight ? parseFloat(grossWeight) : 0;
  const displayPurity = purity ? parseFloat(purity) : 0;
  const fa = displayGross * (displayPurity / 1000);

  const uploadPhoto = useCallback(async (blob: Blob): Promise<string> => {
    const fd = new FormData();
    fd.append('file', blob, `photo-${Date.now()}.jpg`);
    const res = await fetch('/api/blob/upload', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Error al subir la foto');
    const data = await res.json();
    return data.url as string;
  }, []);

  const handleCapture = useCallback(async (blob: Blob) => {
    const localUrl = URL.createObjectURL(blob);
    setPhotoPreviewUrl(localUrl);
    setShowCameraModal(false);
    try {
      const url = await uploadPhoto(blob);
      setPhotoUploadedUrl(url);
    } catch (err) {
      console.error('Auto-upload failed:', err);
    }
  }, [uploadPhoto]);

  const handleRepeatPhoto = useCallback(() => {
    setShowCameraModal(true);
  }, []);

  const handleEditClick = () => {
    setShowPinPad(true);
  };

  const handlePinSuccess = () => {
    setShowPinPad(false);
    setIsEditing(true);
  };

  const handleValidate = () => {
    if (!onValidate) return;
    const bw = parseFloat(grossWeight);
    const la = parseFloat(purity);
    if (isNaN(bw) || isNaN(la)) return;
    onValidate(bar.id, { grossWeight: bw, purity: la, photoUrl: photoUploadedUrl || undefined });
  };

  const obtenerPeso = async (): Promise<number> => {
    const res = await fetch('/api/scale/weight', { method: 'GET', cache: 'no-store' });

    if (!res.ok) {
      if (res.status === 408) throw new Error('Báscula sin respuesta (timeout de 5 s)');
      if (res.status === 409) throw new Error('El puerto de la báscula está ocupado');
      throw new Error('No se pudo leer la báscula');
    }

    const data = await res.json();
    const value = Number(data.weight);
    if (!Number.isFinite(value)) throw new Error('La báscula no devolvió un peso válido');
    return value;
  };

  const handleGetWeight = async () => {
    setScaleError(null);
    setIsReadingWeight(true);
    try {
      const w = await obtenerPeso();
      setGrossWeight(String(w));
    } catch (err) {
      setScaleError(err instanceof Error ? err.message : 'No se pudo leer la báscula');
    } finally {
      setIsReadingWeight(false);
    }
  };

  const handleSaveChanges = () => {
    if (!onSave) return;
    const bw = parseFloat(grossWeight);
    const la = parseFloat(purity);
    if (isNaN(bw) || isNaN(la)) return;
    onSave(bar.id, { grossWeight: bw, purity: la, photoUrl: photoUploadedUrl || undefined });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setGrossWeight(String(Number(bar.grossWeight)));
    setPurity(String(Number(bar.purity)));
  };

  const canValidate = !isNaN(displayGross) && !isNaN(displayPurity) && displayGross > 0 && displayPurity > 0;
  const hasPhoto = !!photoUploadedUrl || !!bar.photoUrl;
  const showSidebar = !readOnly && (isPorValidar || isEditing);

  return (
    <>
      <ModalShell isOpen onClose={onClose} noHeader noPadding size={showSidebar ? 'xl' : 'lg'} zIndex={zIndex}
        panelClassName="!bg-transparent !backdrop-blur-none !border-transparent max-h-[90vh] flex flex-col"
        bodyClassName="flex-1 min-h-0 flex flex-row gap-4">
        {/* Main card — real modal contents */}
        <div className="flex-1 min-h-0 flex flex-col rounded-2xl overflow-hidden border border-[var(--pm-border)]/40 bg-[var(--pm-bg-base)] shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--pm-border)]/20">
          <div>
            <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-cyan)] uppercase tracking-wider flex items-center gap-1.5">
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
              <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block mt-1">
                {new Date(bar.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button type="button" onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] active:scale-90 transition-all cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body — single column (photo + data) */}
        <div className="flex-1 min-h-0 overflow-y-auto v2-scroll p-6 space-y-5">
          {/* Photo Area — fixed height, read-only display */}
          <div className="relative aspect-video w-full max-h-[40vh] mx-auto rounded-xl overflow-hidden border border-[var(--pm-border)] bg-black/60">
            {srcProxy ? (
              <>
                <img
                  src={srcProxy}
                  alt={`Barra ${bar.barNumber}`}
                  className="w-full h-full object-cover object-center absolute inset-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                {/* Repeat button overlay */}
                {!readOnly && (
                  <div className="absolute bottom-2 right-2">
                    <button type="button" onClick={handleRepeatPhoto}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20 text-white hover:bg-black/80 text-[11px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
                      <Camera className="w-3 h-3" />
                      REPETIR FOTO
                    </button>
                  </div>
                )}
                {/* Upload status */}
                {photoUploadedUrl && (
                  <div className="absolute top-2 right-2">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--pm-accent-emerald)]/20 backdrop-blur-sm border border-[var(--pm-accent-emerald)]/30">
                      <Check className="w-3 h-3 text-[var(--pm-accent-emerald)]" />
                      <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-emerald)]">Foto lista</span>
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center rounded-lg" style={{ background: 'rgba(100,100,100,0.15)', border: '1px solid rgba(100,100,100,0.25)' }}>
                    <Camera className="w-5 h-5 text-[var(--pm-text-dim)]/40" />
                  </div>
                  <p className="text-[11px] font-mono text-[var(--pm-text-dim)]/70">Sin evidencia fotográfica</p>
                </div>
              </div>
            )}
          </div>

          {/* Data Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* SP Values */}
            <div className="p-3 rounded-xl border border-[var(--pm-border)]/40 bg-[var(--pm-bg-deepest)]/30">
              <span className="text-[9px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">SEGÚN PACKING (SP)</span>
              <div className="mt-2 space-y-1 text-center">
                <div>
                  <span className="text-[10px] font-mono text-[var(--pm-text-dim)] block">Bruto</span>
                  <span className="text-sm font-mono font-medium text-slate-200">{formatNumber(spGross, 2)} g</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[var(--pm-text-dim)] block">Ley Au</span>
                  <span className="text-sm font-mono font-medium text-slate-200">{formatNumber(spPurity, 2)} ‰</span>
                </div>
              </div>
            </div>

            {/* Validated / Editable Values */}
            <div className={`p-3 rounded-xl border transition-all ${isEditing ? 'border-[var(--pm-accent-gold)]/40 bg-[var(--pm-accent-gold)]/5' : 'border-[var(--pm-accent-cyan)]/30 bg-[var(--pm-accent-cyan)]/5'}`}>
              <span className={`text-[9px] font-mono uppercase tracking-wider block text-center ${isEditing ? 'text-[var(--pm-accent-gold)]' : 'text-[var(--pm-accent-cyan)]'}`}>
                {isEditing ? 'EDITANDO' : 'REAL (VALIDADO)'}
              </span>
              <div className="mt-2 space-y-2 text-center">
                <div>
                  <span className="text-[10px] font-mono text-[var(--pm-text-dim)] block">Bruto</span>
                  {isEditing ? (
                    <input
                      type="number"
                      step="any"
                      value={grossWeight}
                      onChange={e => setGrossWeight(e.target.value)}
                      className="w-full bg-[var(--pm-bg-deepest)] border-2 border-[var(--pm-accent-gold)]/30 rounded-lg px-2 py-1 text-sm font-mono font-bold text-[var(--pm-accent-gold)] text-center focus:outline-none focus:border-[var(--pm-accent-gold)] transition-all"
                    />
                  ) : (
                    <span className="text-sm font-mono font-medium text-[var(--pm-accent-cyan)]">{formatNumber(displayGross, 2)} g</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[var(--pm-text-dim)] block">Ley Au</span>
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
                    <span className="text-sm font-mono font-medium text-[var(--pm-accent-cyan)]">{formatNumber(displayPurity, 2)} ‰</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fine Weight */}
          <div className="p-3 rounded-xl border border-[var(--pm-accent-gold)]/20 bg-[var(--pm-accent-gold)]/5">
            <span className="text-[9px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block text-center">PESO BRUTO</span>
            <span className="text-sm font-mono font-medium text-[var(--pm-accent-gold)] block text-center">{formatNumber(displayGross, 2)} g</span>
          </div>
        </div>

        {/* Footer — fixed action bar */}
        <div className="shrink-0 flex gap-3 px-6 py-4 border-t border-[var(--pm-border)]/20">
            {isEditing ? (
              <>
                <button type="button" onClick={handleCancelEdit}
                  className="py-3 px-5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
                  Cancelar
                </button>
                <button type="button" onClick={handleSaveChanges} disabled={isSaving}
                  className="flex-1 py-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))',
                    color: 'var(--pm-accent-emerald)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    boxShadow: '0 0 16px rgba(16,185,129,0.15)',
                  }}>
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[var(--pm-accent-emerald)]/30 border-t-[var(--pm-accent-emerald)] rounded-full animate-spin" />
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
                  className="py-3 px-5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">
                  CERRAR
                </button>
                {!readOnly && (
                  <button type="button" onClick={handleEditClick}
                    className="py-3 px-5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
                      color: 'var(--pm-accent-emerald)',
                      border: '1px solid rgba(16,185,129,0.25)',
                    }}>
                    <Pencil className="w-3.5 h-3.5" />
                    EDITAR
                  </button>
                )}
                {!readOnly && isPorValidar && onValidate && (
                  <button type="button" onClick={handleValidate} disabled={isSaving || !canValidate}
                    className="flex-1 py-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        {/* Docked hardware console — slides in from the right */}
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ opacity: { duration: 0.3 }, x: { duration: 0.3, ease: 'easeOut' }, layout: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
            layout
            className={`shrink-0 ${consoleCollapsed ? 'self-center' : 'self-start'}`}
          >
            <motion.div
              initial={false}
              animate={{ width: consoleCollapsed ? 48 : 224 }}
              transition={{ width: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
              className="relative flex flex-col overflow-hidden max-h-full rounded-2xl border border-[var(--pm-border)]/40 bg-[var(--pm-bg-base)] shadow-2xl shadow-black/40"
            >
              <button type="button" onClick={() => setConsoleCollapsed(v => !v)}
                title={consoleCollapsed ? 'Mostrar consola' : 'Ocultar consola'}
                className={`shrink-0 rounded-md hover:bg-[var(--pm-bg-tertiary)] hover:text-white transition-all active:scale-90 cursor-pointer ${consoleCollapsed ? 'self-center my-3 p-1.5 text-[var(--pm-accent-cyan)]' : 'self-end m-2 mb-0 p-1 text-[var(--pm-text-dim)]'}`}>
                <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${consoleCollapsed ? '' : 'rotate-180'}`} />
              </button>

              <AnimatePresence initial={false}>
                {!consoleCollapsed && (
                  <motion.div
                    key="console-body"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ opacity: { duration: 0.15 }, height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
                    className="flex flex-col gap-4 overflow-y-auto min-h-0 p-4 v2-scroll"
                  >
                    <span className="text-[9px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu className="w-3 h-3 text-[var(--pm-accent-cyan)]" /> CONSOLA DE HARDWARE
                    </span>

                    <button type="button" onClick={handleGetWeight} disabled={isReadingWeight}
                      className="group relative w-full py-5 rounded-xl border border-[var(--pm-border)]/60 text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-hover)]/60 text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-wait flex flex-col items-center justify-center gap-2"
                      style={{ WebkitTapHighlightColor: 'transparent' }}>
                      <Scale className="w-5 h-5 text-[var(--pm-accent-gold)] group-hover:drop-shadow-[0_0_6px_rgba(212,175,55,0.4)]" />
                      <span>OBTENER PESO</span>
                      <span className="text-[9px] font-mono text-[var(--pm-text-dim)]/70 normal-case tracking-normal">
                        {isReadingWeight ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 border-2 border-[var(--pm-accent-gold)]/30 border-t-[var(--pm-accent-gold)] rounded-full animate-spin" />
                            Leyendo báscula...
                          </span>
                        ) : 'Báscula serial'}
                      </span>
                    </button>
                    <button type="button" onClick={() => {}}
                      className="group relative w-full py-5 rounded-xl border border-[var(--pm-border)]/60 text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-hover)]/60 text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-2"
                      style={{ WebkitTapHighlightColor: 'transparent' }}>
                      <Microscope className="w-5 h-5 text-[var(--pm-accent-gold)] group-hover:drop-shadow-[0_0_6px_rgba(212,175,55,0.4)]" />
                      <span>OBTENER LEYES</span>
                      <span className="text-[9px] font-mono text-[var(--pm-text-dim)]/70 normal-case tracking-normal">Próximamente</span>
                    </button>
                    <button type="button" onClick={() => setShowCameraModal(true)}
                      className="group relative w-full py-5 rounded-xl border border-[var(--pm-accent-cyan)]/30 bg-[var(--pm-accent-cyan)]/5 text-[var(--pm-accent-cyan)] hover:bg-[var(--pm-accent-cyan)]/10 text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-2"
                      style={{ WebkitTapHighlightColor: 'transparent' }}>
                      <Camera className="w-5 h-5 group-hover:drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]" />
                      <span>ADJUNTAR FOTO</span>
                      {hasPhoto && (
                        <span className="text-[9px] font-mono text-[var(--pm-accent-emerald)] normal-case tracking-normal">✓ Capturada</span>
                      )}
                    </button>

                    {scaleError && (
                      <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-mono bg-[var(--pm-accent-red)]/10 border border-[var(--pm-accent-red)]/25 text-[var(--pm-accent-red)]">
                        <Zap className="w-4 h-4 shrink-0" />{scaleError}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </ModalShell>

      {/* Camera Capture Modal — separate overlay */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl overflow-hidden border border-[var(--pm-border)] bg-[var(--pm-bg-primary)] shadow-2xl">
            {/* Camera header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--pm-border)]/30">
              <span className="text-[11px] font-mono font-bold text-[var(--pm-accent-cyan)] uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> CAPTURA DE EVIDENCIA
              </span>
              <button type="button" onClick={() => setShowCameraModal(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] active:scale-90 transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Camera viewfinder */}
            <div className="relative min-h-[440px] h-[60vh] max-h-[500px] flex flex-col bg-black">
              <CameraTerminal
                onCapture={handleCapture}
                onClose={() => setShowCameraModal(false)}
              />
            </div>
          </div>
        </div>
      )}

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
