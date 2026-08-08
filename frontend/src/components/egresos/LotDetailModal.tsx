'use client';

import React, { useMemo, useState } from 'react';
import { Package, GitMerge, Camera } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { BarDetailModal } from '@/components/packing/BarDetailModal';
import { formatNumber } from '@/lib/format';
import type { Bar } from '@/types/api';

interface AvailableLot {
  id: string;
  name: string;
  processName: string;
  clientId: string;
  clientName: string;
  clientRif: string;
  availableWeight: number;
  recovered?: number;
  grossWeight?: number;
  photoUrl?: string | null;
  barCount: number;
  isMixed?: boolean;
  composition?: { clientId: string; clientName: string; weight: number; percentage: number }[];
}

interface LotDetailModalProps {
  lot: AvailableLot;
  bars: Bar[];
  onClose: () => void;
  zIndex?: string;
}

export function LotDetailModal({ lot, bars, onClose, zIndex = 'z-[130]' }: LotDetailModalProps) {
  const [selectedBarForModal, setSelectedBarForModal] = useState<Bar | null>(null);
  const lotBars = useMemo(() => bars.filter(b => b.lotId === lot.id), [bars, lot.id]);
  const totalGross = useMemo(() => lotBars.reduce((s, b) => s + Number(b.grossWeight || 0), 0), [lotBars]);
  const totalFine = useMemo(() => lotBars.reduce((s, b) => s + Number(b.fineWeight || 0), 0), [lotBars]);
  const efficiency = useMemo(
    () => totalFine > 0 ? (Number(lot.availableWeight || 0) / totalFine) * 100 : null,
    [totalFine, lot],
  );

  const lotPhotoUrl = useMemo(
    () => lot.photoUrl || lotBars.find(b => b.photoUrl)?.photoUrl || null,
    [lot, lotBars],
  );
  const srcProxy = lotPhotoUrl?.startsWith('data:')
    ? lotPhotoUrl
    : `/api/blob/view?url=${encodeURIComponent(lotPhotoUrl || '')}`;

  return (
    <ModalShell isOpen onClose={onClose} size="lg" noPadding zIndex={zIndex}>
      <div className="px-6 pt-5 sm:pt-6 pb-4 border-b border-[var(--pm-border)]/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Package className="w-4 h-4 text-[var(--pm-accent-gold)]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-gold)] uppercase tracking-wider">Detalle de Lote</span>
              <h3 className="text-sm font-sans font-semibold text-[var(--pm-text-primary)] mt-0.5 truncate">{lot.name}</h3>
              <p className="text-[11px] font-mono text-[var(--pm-text-dim)] mt-0.5 truncate">Proceso: {lot.processName} · {lot.clientName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto v2-scroll p-6 max-h-[75vh]">
        {lotBars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-[var(--pm-text-dim)]">
            <Package className="w-8 h-8 text-[var(--pm-text-dim)]/30 mb-2" />
            <span className="text-xs font-sans mb-1">Sin barras asociadas</span>
            <p className="text-[10px] font-mono">No se encontraron barras para este lote.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="relative aspect-video overflow-hidden rounded-xl border border-[var(--pm-border)] bg-black/60">
              {lotPhotoUrl ? (
                <img
                  src={srcProxy}
                  alt={`Lote ${lot.name}`}
                  className="w-full h-full object-cover object-center absolute inset-0"
                />
              ) : (
                <div className="text-center p-6">
                  <Camera className="w-8 h-8 text-[var(--pm-text-dim)]/30 mx-auto mb-2" />
                  <p className="text-[11px] font-mono text-[var(--pm-text-dim)]/60">Sin evidencia fotográfica registrada</p>
                </div>
              )}
            </div>

            {lot.isMixed && lot.composition && lot.composition.length > 1 && (
              <div className="p-4 rounded-xl border border-[rgba(168,85,247,0.3)] bg-[rgba(168,85,247,0.06)]">
                <div className="flex items-center gap-2 mb-3">
                  <GitMerge className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">Composición Multi-Proveedor</span>
                  <span className="ml-auto text-[9px] font-mono text-purple-300/70">Lote Mixto</span>
                </div>
                <div className="space-y-2">
                  {lot.composition.map(entry => (
                    <div key={entry.clientId} className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-[var(--pm-text-primary)] w-32 truncate">{entry.clientName}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--pm-bg-deepest)]/80 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(entry.percentage, 100)}%`, background: 'linear-gradient(90deg, rgba(168,85,247,0.7), rgba(168,85,247,0.4))' }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-purple-300 w-16 text-right">{entry.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 divide-x divide-[var(--pm-border)] rounded-xl border border-[var(--pm-accent-gold)]/30 bg-[var(--pm-accent-gold)]/[0.08]">
              <div className="flex flex-col items-center justify-center gap-0.5 py-4 px-4 text-center">
                <span className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Peso Bruto (SP)</span>
                <span className="text-lg font-mono font-bold text-slate-400">{formatNumber(totalGross, 2)} g</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-0.5 py-4 px-4 text-center">
                <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-gold)] uppercase tracking-wider">Peso Balanza</span>
                <span className="text-2xl font-mono font-bold text-[var(--pm-accent-gold)]">{formatNumber(Number(lot.recovered ?? lot.grossWeight ?? 0), 2)} g</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">
              <span>Material de Entrada (Desglose)</span>
              <span>{lotBars.length} barra{lotBars.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="overflow-x-auto w-full">
              <div className="rounded-xl border border-[var(--pm-border)]/30 w-full">
                <table className="w-full table-fixed border-collapse text-xs font-sans">
                  <thead>
                    <tr className="text-[11px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">
                      <th className="w-[25%] text-left px-4 py-3 border-b border-[var(--pm-border)]/50">Código</th>
                      <th className="w-[25%] text-right px-4 py-3 border-b border-[var(--pm-border)]/50">Peso Bruto (g)</th>
                      <th className="w-[25%] text-right px-4 py-3 border-b border-[var(--pm-border)]/50">Ley Au (‰)</th>
                      <th className="w-[25%] text-right px-4 py-3 border-b border-[var(--pm-border)]/50">Peso Fino (g)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--pm-border)]/20">
                    {lotBars.map((b, i) => (
                      <tr key={b.id}
                        onClick={() => setSelectedBarForModal(b)}
                        className={`${i % 2 === 0 ? 'bg-transparent' : 'bg-[var(--pm-bg-base)]/20'} hover:bg-[var(--pm-bg-hover)]/30 transition-colors cursor-pointer`}>
                        <td className="text-left px-4 py-3 font-mono font-bold text-[var(--pm-accent-gold)] tracking-wider">{b.barNumber}</td>
                        <td className="text-right px-4 py-3 font-mono text-[var(--pm-text-primary)]">{formatNumber(Number(b.grossWeight || 0), 2)}</td>
                        <td className="text-right px-4 py-3 font-mono text-[var(--pm-text-primary)]">{b.purity}</td>
                        <td className="text-right px-4 py-3 font-mono font-semibold text-[var(--pm-text-primary)]">{formatNumber(Number(b.fineWeight || 0), 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[var(--pm-bg-deepest)]/50 border-t border-[var(--pm-border)]/50">
                      <td className="text-left px-4 py-3 font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Total</td>
                      <td className="text-right px-4 py-3 font-mono font-bold text-[var(--pm-text-primary)]">{formatNumber(totalGross, 2)}</td>
                      <td className="text-right px-4 py-3 font-mono text-[var(--pm-text-dim)]">—</td>
                      <td className="text-right px-4 py-3 font-mono font-bold text-[var(--pm-accent-gold)]">{formatNumber(totalFine, 2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-[var(--pm-bg-deepest)]/40 flex items-center gap-3"
              style={{ borderColor: efficiency !== null && efficiency >= 99 ? 'rgba(16,185,129,0.3)' : efficiency !== null && efficiency >= 95 ? 'rgba(212,175,55,0.3)' : 'rgba(239,68,68,0.3)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: efficiency !== null && efficiency >= 99 ? 'rgba(16,185,129,0.1)' : efficiency !== null && efficiency >= 95 ? 'rgba(212,175,55,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${efficiency !== null && efficiency >= 99 ? 'rgba(16,185,129,0.2)' : efficiency !== null && efficiency >= 95 ? 'rgba(212,175,55,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ color: efficiency !== null && efficiency >= 99 ? 'var(--pm-accent-emerald)' : efficiency !== null && efficiency >= 95 ? 'var(--pm-accent-gold)' : 'var(--pm-accent-red)' }}>
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Eficiencia</span>
                  <p className={`text-sm font-mono font-bold ${
                    efficiency !== null && efficiency >= 99
                      ? 'text-[var(--pm-accent-emerald)]'
                      : efficiency !== null && efficiency >= 95
                        ? 'text-[var(--pm-accent-gold)]'
                        : 'text-[var(--pm-accent-red)]'
                  }`}>
                    {efficiency !== null ? `${efficiency.toFixed(1)}%` : '—'}
                  </p>
                </div>
              </div>
          </div>
        )}
      </div>

      {selectedBarForModal && (
        <BarDetailModal
          bar={selectedBarForModal}
          onClose={() => setSelectedBarForModal(null)}
          readOnly
          zIndex="z-[140]"
        />
      )}
    </ModalShell>
  );
}
