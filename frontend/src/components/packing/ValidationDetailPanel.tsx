'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardCheck, Zap, Check } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DeviceSimulationModal } from '@/components/packing/DeviceSimulationModal';
import type { Bar } from '@/types/api';

interface SelectedPacking {
  id: string;
  fileName: string;
  bars?: Bar[];
  client?: { name: string };
  createdAt: string;
}

interface ValidationDetailPanelProps {
  selectedPacking: SelectedPacking | null;
  validationResult: { total: number; success: number; error: number } | null;
  validationEdits: Record<string, { barNumber: string; grossWeight: string; purity: string; leyAg: string }>;
  selectedBarId: string | null;
  allBarsValidated: boolean;
  validatedCount: number;
  totalCount: number;
  isPending: boolean;
  confirmModal: { barId: string; basculaWeight: string; leyAu: string; leyAg: string } | null;
  cameraMode: 'idle' | 'camera' | 'preview';
  photoPreviewUrl: string | null;
  photoUploadedUrl: string | null;
  modalLiveFA: number;
  onEditChange: (barId: string, field: string, value: string) => void;
  onComputeDelta: (bar: Bar) => number;
  onRowSelect: (barId: string, status: string) => void;
  onConfirmBar: () => void;
  onSyncValidate: () => void;
  onDeviceClose: () => void;
  onCapture: (blob: Blob) => void;
  onRepeatPhoto: () => void;
  onDeviceFieldChange: (field: string, value: string) => void;
  onCameraModeChange: (mode: 'idle' | 'camera' | 'preview') => void;
  onSetEvidenceBarId: (id: string | null) => void;
  onSetConfirmFinalizeModal: (v: boolean) => void;
}

export function ValidationDetailPanel({
  selectedPacking, validationResult, validationEdits, selectedBarId,
  allBarsValidated, validatedCount, totalCount, isPending,
  confirmModal, cameraMode, photoPreviewUrl, photoUploadedUrl, modalLiveFA,
  onEditChange, onComputeDelta, onRowSelect, onConfirmBar,
  onSyncValidate, onDeviceClose, onCapture, onRepeatPhoto, onDeviceFieldChange,
  onCameraModeChange, onSetEvidenceBarId, onSetConfirmFinalizeModal,
}: ValidationDetailPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
      className="xl:col-span-3 glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
      {!selectedPacking ? (
        <div className="p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-[var(--pm-text-dim)]/20 mx-auto mb-3" />
          <p className="text-sm text-[var(--pm-text-primary)] font-semibold">Selecciona un packing para validar</p>
          <p className="text-[11px] font-mono text-[var(--pm-text-dim)] mt-1">Elige un packing pendiente del panel izquierdo</p>
        </div>
      ) : validationResult ? (
        <div className="p-12 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.25)' }}>
            <Check className="w-7 h-7 text-[var(--pm-accent-emerald)]" strokeWidth={2.5} />
          </div>
          <p className="text-sm font-sans font-bold text-[var(--pm-accent-emerald)]">Packing Validado</p>
          <p className="text-[11px] font-mono text-[var(--pm-text-dim)] mt-1">
            {validationResult.success} de {validationResult.total} barras validadas correctamente
          </p>
          {validationResult.error > 0 && (
            <p className="text-[11px] font-mono text-[var(--pm-accent-red)]">{validationResult.error} errores</p>
          )}
        </div>
      ) : (
        <div>
          {/* Packing Header */}
          <div className="p-4 border-b border-[var(--pm-border)]/20 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono font-bold text-[var(--pm-text-primary)]">{selectedPacking.fileName}</h3>
              <p className="text-[9px] font-mono text-[var(--pm-text-dim)] mt-0.5">
                {selectedPacking.client?.name} · {new Date(selectedPacking.createdAt).toLocaleDateString('es-ES')} · {selectedPacking.bars?.length ?? 0} barras
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-mono whitespace-nowrap ${allBarsValidated ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-text-dim)]'}`}>
                {validatedCount} de {totalCount} barras validadas
              </span>
              <button onClick={() => onSetConfirmFinalizeModal(true)} disabled={!allBarsValidated || isPending}
                className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 ${allBarsValidated ? 'active:scale-95' : ''}`}
                style={{
                  background: allBarsValidated
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))'
                    : 'rgba(100,100,100,0.08)',
                  color: allBarsValidated ? 'var(--pm-accent-emerald)' : 'var(--pm-text-dim)',
                  border: allBarsValidated
                    ? '1px solid rgba(16,185,129,0.3)'
                    : '1px solid rgba(100,100,100,0.15)',
                  boxShadow: allBarsValidated ? '0 0 16px rgba(16,185,129,0.15)' : 'none',
                }}>
                {isPending ? (
                  <><LoadingSpinner size="sm" className="text-[var(--pm-accent-emerald)]" /> Finalizando...</>
                ) : (<><ClipboardCheck className="w-3.5 h-3.5" /> CONFIRMAR VALIDACIÓN</>)}
              </button>
            </div>
          </div>

          {/* Confirm Bar — shown when a row is selected */}
          <AnimatePresence>
            {selectedBarId && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-[var(--pm-border)]/20">
                <div className="px-4 py-3 flex items-center justify-between bg-[var(--pm-accent-gold)]/5">
                  <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">
                    Barra seleccionada: <strong className="text-[var(--pm-accent-gold)]">
                      {selectedPacking?.bars?.find(b => b.id === selectedBarId)?.barNumber ?? ''}
                    </strong>
                  </span>
                  <button onClick={onConfirmBar}
                    className="px-5 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1))', color: 'var(--pm-accent-gold)', border: '1px solid rgba(212,175,55,0.4)', boxShadow: '0 0 16px rgba(212,175,55,0.15)' }}>
                    <Zap className="w-3.5 h-3.5" /> CONFIRMAR BARRA
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editable Bars Table */}
          <div className="overflow-x-auto premium-table">
            <table className="w-full text-left text-[10px] font-mono">
              <thead>
                <tr className="border-b border-[var(--pm-border)]/20 text-[9px] text-[var(--pm-text-dim)] uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-center w-8"></th>
                  <th className="py-2.5 px-3 text-center min-w-[120px]">Código <span className="text-[var(--pm-accent-gold)]">✎</span></th>
                  <th className="py-2.5 px-3 text-right">Según Packing (SP)</th>
                  <th className="py-2.5 px-3 text-right min-w-[110px]">Peso Físico (g) <span className="text-[var(--pm-accent-gold)]">✎</span></th>
                  <th className="py-2.5 px-3 text-right">Ley SP (‰)</th>
                  <th className="py-2.5 px-3 text-right min-w-[100px]">Ley Física (‰) <span className="text-[var(--pm-accent-gold)]">✎</span></th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--pm-border)]/20">
                {(selectedPacking.bars ?? []).map((bar, idx) => {
                  const edit = validationEdits[bar.id];
                  const isPorValidar = bar.status === 'POR_VALIDAR';
                  const isSelected = selectedBarId === bar.id;
                  const origGross = Number(bar.grossWeight);
                  const origPurity = Number(bar.purity);
                  return (
                    <tr key={bar.id} onClick={() => {
                      if (bar.status === 'IN_STOCK' || bar.status === 'COMPLETADO') {
                        onSetEvidenceBarId(bar.id);
                      } else if (bar.status === 'POR_VALIDAR') {
                        onRowSelect(bar.id, bar.status);
                      }
                    }}
                      className={`
                        ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--pm-bg-base)]/20'}
                        hover:bg-[var(--pm-bg-hover)]/40 transition-all
                        ${bar.status === 'IN_STOCK' || bar.status === 'COMPLETADO' ? 'cursor-pointer hover:bg-[var(--pm-accent-emerald)]/5' : ''}
                        ${bar.status === 'POR_VALIDAR' ? 'cursor-pointer' : ''}
                        ${!isPorValidar && bar.status !== 'IN_STOCK' && bar.status !== 'COMPLETADO' ? 'opacity-50' : ''}
                        ${isSelected ? 'ring-1 ring-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)]/5' : ''}
                      `}>
                      <td className="py-2.5 px-3 text-center">
                        {isPorValidar && (
                          <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${isSelected ? 'border-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)] shadow-[0_0_6px_rgba(212,175,55,0.4)]' : 'border-[var(--pm-text-dim)]/30'}`} />
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isPorValidar ? (
                          <input type="text" value={edit?.barNumber ?? ''}
                            onChange={e => onEditChange(bar.id, 'barNumber', e.target.value.toUpperCase())}
                            onClick={e => e.stopPropagation()}
                            className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded px-2 py-1 text-[10px] font-mono text-[var(--pm-text-primary)] text-center focus:outline-none focus:border-[var(--pm-accent-gold)] uppercase" />
                        ) : (
                          <span className="text-[var(--pm-text-dim)]">{bar.barNumber}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[var(--pm-text-primary)]">{formatNumber(origGross, 2)}</td>
                      <td className="py-2.5 px-3 text-right">
                        {isPorValidar ? (
                          <input type="number" step="any" value={edit?.grossWeight ?? ''}
                            onChange={e => onEditChange(bar.id, 'grossWeight', e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded px-2 py-1 text-[10px] font-mono text-[var(--pm-text-primary)] text-right focus:outline-none focus:border-[var(--pm-accent-gold)]" />
                        ) : (
                          <span className="text-[var(--pm-text-dim)]">{formatNumber(origGross, 2)}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[var(--pm-text-primary)]">{formatNumber(origPurity, 1)}</td>
                      <td className="py-2.5 px-3 text-right">
                        {isPorValidar ? (
                          <input type="number" step="any" min="0" max="1000" value={edit?.purity ?? ''}
                            onChange={e => onEditChange(bar.id, 'purity', e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded px-2 py-1 text-[10px] font-mono text-[var(--pm-text-primary)] text-right focus:outline-none focus:border-[var(--pm-accent-gold)]" />
                        ) : (
                          <span className="text-[var(--pm-text-dim)]">{formatNumber(origPurity, 1)}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={bar.status} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Device Simulation Modal */}
          <DeviceSimulationModal
            confirmModal={confirmModal}
            selectedPackingBars={selectedPacking?.bars}
            cameraMode={cameraMode}
            photoPreviewUrl={photoPreviewUrl}
            photoUploadedUrl={photoUploadedUrl}
            modalLiveFA={modalLiveFA}
            isPending={isPending}
            onClose={onDeviceClose}
            onSyncValidate={onSyncValidate}
            onCameraModeChange={onCameraModeChange}
            onCapture={onCapture}
            onRepeat={onRepeatPhoto}
            onFieldChange={onDeviceFieldChange}
          />
        </div>
      )}
    </motion.div>
  );
}
