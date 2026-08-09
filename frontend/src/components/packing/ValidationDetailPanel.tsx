'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardCheck, Shield, Check, Lock, FileDown } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Bar, Packing } from '@/types/api';

type SelectedPacking = Packing;

interface ValidationDetailPanelProps {
  selectedPacking: SelectedPacking | null;
  validationResult: { total: number; success: number; error: number } | null;
  validationEdits: Record<string, { barNumber: string; grossWeight: string; purity: string; leyAg: string }>;
  allBarsValidated: boolean;
  validatedCount: number;
  totalCount: number;
  isPending: boolean;
  onRowClick: (bar: Bar) => void;
  onSetEvidenceBarId: (id: string | null) => void;
  onSetConfirmFinalizeModal: (v: boolean) => void;
  onDownloadReport?: (packing: SelectedPacking) => void;
}

export function ValidationDetailPanel({
  selectedPacking, validationResult, validationEdits,
  allBarsValidated, validatedCount, totalCount, isPending,
  onRowClick, onSetEvidenceBarId, onSetConfirmFinalizeModal, onDownloadReport,
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
              <p className="text-[10px] font-mono text-[var(--pm-text-dim)] mt-0.5">
                {selectedPacking.client?.name} · {new Date(selectedPacking.createdAt).toLocaleDateString('es-ES')} · {selectedPacking.bars?.length ?? 0} barras
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-mono whitespace-nowrap ${allBarsValidated ? 'text-[var(--pm-accent-emerald)]' : 'text-[var(--pm-text-dim)]'}`}>
                {validatedCount} de {totalCount} barras validadas
              </span>
              <button onClick={() => onDownloadReport?.(selectedPacking)}
                className="px-4 py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                style={{
                  background: 'rgba(217,167,41,0.08)',
                  color: 'var(--pm-accent-gold)',
                  border: '1px solid rgba(217,167,41,0.25)',
                }}>
                <FileDown className="w-3.5 h-3.5" /> DESCARGAR REPORTE
              </button>
              <button onClick={() => onSetConfirmFinalizeModal(true)} disabled={!allBarsValidated || isPending}
                className={`px-4 py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 ${allBarsValidated ? 'active:scale-95' : ''}`}
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

          {/* Security Notice */}
          <div className="px-4 py-2 border-b border-[var(--pm-border)]/20 flex items-center gap-2 bg-[var(--pm-accent-gold)]/3">
            <Shield className="w-3 h-3 text-[var(--pm-accent-gold)]" />
            <span className="text-[10px] font-mono text-[var(--pm-text-dim)] tracking-wider">
              {'>_ TOQUE UNA BARRA PARA VER DETALLE — EDICIÓN REQUIERE PIN'}
            </span>
          </div>

          {/* Editable Bars Table */}
          <div className="overflow-x-auto premium-table">
            <table className="w-full text-left text-[11px] font-mono">
              <thead>
                <tr className="border-b border-[var(--pm-border)]/20 text-[10px] text-[var(--pm-text-dim)] uppercase tracking-wider">
                  <th className="px-4 py-3 text-center min-w-[120px]">Código</th>
                  <th className="px-4 py-3 text-right">Según Packing (SP)</th>
                  <th className="px-4 py-3 text-right min-w-[110px]">Peso Físico (g)</th>
                  <th className="px-4 py-3 text-right">Ley SP (‰)</th>
                  <th className="px-4 py-3 text-right min-w-[100px]">Ley Física (‰)</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center w-12">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--pm-border)]/20">
                {(selectedPacking.bars ?? []).map((bar, idx) => {
                  const edit = validationEdits[bar.id];
                  const isPorValidar = bar.status === 'POR_VALIDAR';
                  const isValidated = !isPorValidar && bar.status !== 'IN_STOCK' && bar.status !== 'COMPLETADO';
                  const origGross = Number(bar.grossWeight);
                  const origPurity = Number(bar.purity);

                  return (
                    <tr key={bar.id} onClick={() => onRowClick(bar)}
                      className={`
                        ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--pm-bg-base)]/20'}
                        hover:bg-[var(--pm-bg-hover)]/40 transition-all cursor-pointer
                        ${isPorValidar ? 'hover:bg-[var(--pm-accent-gold)]/5' : ''}
                        ${bar.status === 'IN_STOCK' || bar.status === 'COMPLETADO' ? 'hover:bg-[var(--pm-accent-emerald)]/5' : ''}
                        ${isValidated ? 'opacity-70' : ''}
                      `}>
                      <td className="px-4 py-3 text-center font-mono font-bold text-[var(--pm-accent-gold)] tracking-wider text-[11px]">
                        {bar.barNumber}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-200">{formatNumber(origGross, 2)}</td>
                      <td className="px-4 py-3 text-right">
                        {isPorValidar ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Lock className="w-3 h-3 text-[var(--pm-text-dim)]/30" />
                            <span className="text-[var(--pm-text-dim)] bg-[var(--pm-bg-deepest)]/50 border border-[var(--pm-border)]/40 rounded px-2 py-1 text-[11px] font-mono">
                              {edit?.grossWeight ? formatNumber(Number(edit.grossWeight), 2) : '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono font-medium text-slate-200">{formatNumber(isValidated ? Number(edit?.grossWeight ?? origGross) : origGross, 2)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-200">{formatNumber(origPurity, 2)}</td>
                      <td className="px-4 py-3 text-right">
                        {isPorValidar ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Lock className="w-3 h-3 text-[var(--pm-text-dim)]/30" />
                            <span className="text-[var(--pm-text-dim)] bg-[var(--pm-bg-deepest)]/50 border border-[var(--pm-border)]/40 rounded px-2 py-1 text-[11px] font-mono">
                              {edit?.purity ? formatNumber(Number(edit.purity), 2) : '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono font-medium text-slate-200">{formatNumber(isValidated ? Number(edit?.purity ?? origPurity) : origPurity, 2)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={bar.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isPorValidar ? (
                          <Shield className="w-3.5 h-3.5 text-[var(--pm-accent-gold)]/40 mx-auto" />
                        ) : isValidated ? (
                          <Check className="w-3.5 h-3.5 text-[var(--pm-accent-emerald)]/50 mx-auto" />
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
