'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Warehouse, X, ChevronDown, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { SupplierDirectory } from '@/components/SupplierDirectory';
import { BarDetailModal } from '@/components/packing/BarDetailModal';
import { LotDetailModal } from '@/components/egresos/LotDetailModal';
import type { Lot, Process, Client, Bar } from '@/types/api';

function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);
}

const springTransition = { type: 'spring', damping: 25, stiffness: 300 } as const;

interface BovedaLot extends Lot {
  process: Process & { client?: { id: string; name: string } };
  client?: { id: string; name: string };
}

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

type Tab = 'fundido' | 'sinFundir';

interface BovedaModalProps {
  isOpen: boolean;
  lots: BovedaLot[];
  bars: Bar[];
  allBars?: Bar[];
  clients: Client[];
  lotGrossWeight?: Record<string, number>;
  lotFineWeight?: Record<string, number>;
  onClose: () => void;
  onBarClick?: (barId: string) => void;
}

export function BovedaModal({ isOpen, lots, bars, allBars, clients, lotGrossWeight, lotFineWeight, onClose, onBarClick }: BovedaModalProps) {
  const [tab, setTab] = useState<Tab>('fundido');
  const [expandedFundidoId, setExpandedFundidoId] = useState<string | null>(null);
  const [fundidoLotPages, setFundidoLotPages] = useState<Record<string, number>>({});
  const [selectedBarForModal, setSelectedBarForModal] = useState<Bar | null>(null);
  const [selectedLotForModal, setSelectedLotForModal] = useState<{ lot: AvailableLot; bars: Bar[] } | null>(null);
  useBodyScrollLock(isOpen);

  const LOTS_PER_PAGE = 10;

  const clientMap = useMemo(() => {
    const map = new Map<string, { name: string; rif: string }>();
    for (const c of clients) map.set(c.id, { name: c.name, rif: c.rif });
    return map;
  }, [clients]);

  const grouped = useMemo(() => {
    const map = new Map<string, { clientName: string; rif: string; lots: BovedaLot[] }>();
    for (const lot of lots) {
      const clientId = lot.client?.id ?? lot.process?.clientId ?? 'unknown';
      const clientName = lot.client?.name ?? lot.process?.client?.name ?? 'Desconocido';
      const rif = clientMap.get(clientId)?.rif ?? '—';
      if (!map.has(clientId)) map.set(clientId, { clientName, rif, lots: [] });
      map.get(clientId)!.lots.push(lot);
    }
    return Array.from(map.entries())
      .map(([id, g]) => ({ id, clientName: g.clientName, rif: g.rif, lots: g.lots }))
      .sort((a, b) => b.lots.length - a.lots.length);
  }, [lots, clientMap]);

  const totalRecovered = useMemo(
    () => lots.reduce((s, l) => s + Number(l.recovered ?? 0), 0),
    [lots],
  );

  const totalFundidoBrutoOriginal = useMemo(
    () => lots.reduce((s, l) => s + (lotGrossWeight?.[l.id] ?? 0), 0),
    [lots, lotGrossWeight],
  );

  const totalFundidoBruto = totalRecovered;

  const totalFundidoFino = useMemo(
    () => lots.reduce((s, l) => s + (lotFineWeight?.[l.id] ?? 0), 0),
    [lots, lotFineWeight],
  );

  const totalMerma = Math.max(0, totalFundidoBrutoOriginal - totalRecovered);

  const totalFineWeight = useMemo(
    () => bars.reduce((s, b) => s + Number(b.fineWeight ?? 0), 0),
    [bars],
  );

  const totalGrossWeight = useMemo(
    () => bars.reduce((s, b) => s + Number(b.grossWeight ?? 0), 0),
    [bars],
  );

  const grandTotalBruto = tab === 'fundido' ? totalFundidoBruto : totalGrossWeight;
  const grandTotalFino = tab === 'fundido' ? totalFundidoFino : totalFineWeight;

  const tabDefs: { key: Tab; label: string; count: number }[] = [
    { key: 'fundido', label: 'REFUNDIDO', count: lots.length },
    { key: 'sinFundir', label: 'SIN REFUNDIR', count: bars.length },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={springTransition}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={springTransition}
            className="relative w-full max-w-5xl h-[80vh] max-h-[850px] rounded-xl border border-[rgba(30,41,59,0.5)] bg-[var(--hud-bg-card)] shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--hud-border)]">
              <div className="flex items-center gap-3">
                <Warehouse className="w-5 h-5 text-[var(--hud-accent-gold)]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--hud-text-primary)]">
                  Oro en Bóveda
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-[var(--hud-bg-deepest)]/50 border border-[var(--hud-border)] flex items-center justify-center text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-4 sm:px-5 pt-3 border-b border-[var(--hud-border)]">
              {tabDefs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 text-[11px] font-mono font-bold tracking-wider rounded-t-lg transition-all border-b-2 ${
                    tab === t.key
                      ? 'bg-[var(--hud-bg-deepest)]/50 text-[var(--hud-accent-gold)] border-[var(--hud-accent-gold)]'
                      : 'text-[var(--hud-text-dim)] border-transparent hover:text-[var(--hud-text-primary)] hover:bg-[var(--hud-bg-deepest)]/30'
                  }`}
                >
                  {t.label}
                  <span className="ml-1.5 text-[10px] opacity-60">({t.count})</span>
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {tab === 'fundido' ? (
                <div className="p-4 sm:p-5 space-y-3">
                  {grouped.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                      <Warehouse className="w-10 h-10 text-[var(--hud-text-dim)] mb-3 opacity-40" />
                      <p className="text-[11px] font-mono text-[var(--hud-text-dim)]">
                        No hay lotes refinados en bóveda
                      </p>
                    </div>
                  )}

                  {grouped.map(({ id, clientName, rif, lots: clientLots }) => {
                    const isExpanded = expandedFundidoId === id;
                    const clientTotal = clientLots.reduce((s, l) => s + Number(l.recovered ?? 0), 0);
                    return (
                      <div key={id}>
                        <div
                          className="glass-panel cursor-pointer active:scale-[0.98] transition-all hover:bg-[var(--hud-accent-gold)]/[0.04] rounded-xl border border-[var(--hud-border)]/40 overflow-hidden"
                          onClick={() => setExpandedFundidoId(prev => prev === id ? null : id)}
                        >
                          <div className="p-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Building2 className="w-5 h-5 text-[var(--hud-accent-gold)] flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[var(--hud-text-primary)] uppercase tracking-wider truncate">
                                  {clientName}
                                </p>
                                <p className="text-[11px] text-[var(--hud-text-dim)] font-mono truncate">
                                  RIF: {rif}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-[11px] font-mono text-[var(--hud-text-dim)] whitespace-nowrap">
                                Bruto: {formatNumber(clientTotal, 2)} g
                              </span>
                              <span className="text-[11px] font-mono text-[var(--hud-text-dim)] bg-[var(--hud-bg-deepest)]/50 px-2 py-0.5 border border-[var(--hud-border)] rounded whitespace-nowrap">
                                {clientLots.length} LOTES
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 text-[var(--hud-text-dim)] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              {(() => {
                                const lotPage = fundidoLotPages[id] ?? 1;
                                const lotTotalPages = Math.max(1, Math.ceil(clientLots.length / LOTS_PER_PAGE));
                                const safeLotPage = Math.min(lotPage, lotTotalPages);
                                const paginatedLots = clientLots.slice((safeLotPage - 1) * LOTS_PER_PAGE, safeLotPage * LOTS_PER_PAGE);
                                return (
                                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 overflow-hidden">
                                    <div className="overflow-x-auto rounded-xl border border-[var(--hud-border)]/20">
                                      <table className="w-full table-fixed border-collapse text-xs font-sans">
                                        <thead>
                                          <tr>
                                            <th className="w-[20%] text-left px-4 py-3 bg-[var(--hud-bg-primary)]">
                                              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--hud-text-muted)]">Proceso</span>
                                            </th>
                                            <th className="w-[15%] text-left px-4 py-3 bg-[var(--hud-bg-primary)]">
                                              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--hud-text-muted)]">Lote</span>
                                            </th>
                                            <th className="w-[15%] text-left px-4 py-3 bg-[var(--hud-bg-primary)]">
                                              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--hud-text-muted)]">Operador</span>
                                            </th>
                                            <th className="w-[25%] text-right px-4 py-3 bg-[var(--hud-bg-primary)]">
                                              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--hud-text-muted)]">Peso Bruto (g)</span>
                                            </th>
                                            <th className="w-[25%] text-right px-4 py-3 bg-[var(--hud-bg-primary)]">
                                              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--hud-text-muted)]">Fecha</span>
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
{paginatedLots.map((lot, lotIdx) => (
                                            <tr
                                              key={lot.id}
                                              onClick={() => {
                                                const lotBars = (allBars ?? []).length > 0
                                                  ? (allBars ?? []).filter((b) => b.lotId === lot.id)
                                                  : (lot.bars ?? []);
                                                const grossWeight = lotBars.reduce((s, b) => s + Number(b.grossWeight || 0), 0);
                                                setSelectedLotForModal({
                                                  lot: {
                                                    id: lot.id,
                                                    name: lot.name,
                                                    processName: lot.process?.name ?? '—',
                                                    clientId: lot.client?.id ?? lot.process?.clientId ?? 'unknown',
                                                    clientName: lot.client?.name ?? lot.process?.client?.name ?? 'Desconocido',
                                                    clientRif: clientMap.get(lot.client?.id ?? lot.process?.clientId ?? 'unknown')?.rif ?? '—',
                                                    availableWeight: Number(lot.fineWeight ?? 0),
                                                    recovered: Number(lot.recovered ?? 0),
                                                    grossWeight,
                                                    photoUrl: lot.photoUrl ?? null,
                                                    barCount: lotBars.length,
                                                  },
                                                  bars: lotBars,
                                                });
                                              }}
                                              className={`${lotIdx % 2 === 1 ? 'bg-[var(--hud-bg-deepest)]/30' : ''} cursor-pointer hover:bg-[#1A202C]/50 transition-colors`}
                                            >
                                              <td className="text-left px-4 py-3 sticky left-0 bg-[var(--hud-bg-primary)] font-semibold text-[var(--hud-accent-gold)]">
                                                <span className="text-[11px]">{lot.process?.name ?? '—'}</span>
                                              </td>
                                              <td className="text-left px-4 py-3 font-mono text-[11px] text-[var(--hud-text-primary)]">
                                                {lot.name}
                                              </td>
                                              <td className="text-left px-4 py-3 font-mono text-[11px] text-[var(--hud-text-dim)]">
                                                {lot.operator ?? '—'}
                                              </td>
                                              <td className="text-right px-4 py-3 font-mono text-[11px] text-[var(--hud-accent-gold)] tabular-nums">
                                                {formatNumber(Number(lot.recovered ?? 0), 2)}
                                              </td>
                                              <td className="text-right px-4 py-3 font-mono text-[11px] text-[var(--hud-text-dim)]">
                                                {lot.recoveryAt
                                                  ? new Date(lot.recoveryAt).toLocaleDateString('es-AR')
                                                  : '—'}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                        {clientLots.length > 0 && (
                                          <tfoot>
                                            <tr className="border-t border-[var(--hud-border)] bg-[var(--hud-bg-deepest)]/50">
                                              <td className="sticky left-0 bg-[var(--hud-bg-deepest)]/50 px-3 py-2 text-[10px] font-bold text-[var(--hud-text-dim)] uppercase tracking-wider">
                                                Total {clientName}
                                              </td>
                                              <td />
                                              <td />
                                              <td className="text-right px-4 py-3 font-mono text-xs text-[var(--hud-accent-gold)]">
                                                {formatNumber(clientTotal, 2)}
                                              </td>
                                              <td />
                                            </tr>
                                          </tfoot>
                                        )}
                                      </table>
                                    </div>
                                    {lotTotalPages > 1 && (
                                      <div className="flex items-center justify-center gap-3 pt-2">
                                        <span className="text-[10px] font-mono text-[var(--hud-text-dim)]">
                                          Página {safeLotPage} de {lotTotalPages}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => setFundidoLotPages(prev => ({ ...prev, [id]: safeLotPage - 1 }))}
                                            disabled={safeLotPage <= 1}
                                            className="p-1 text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] disabled:text-[var(--hud-text-dim)]/30 disabled:cursor-not-allowed transition-all"
                                          >
                                            <ChevronLeft className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => setFundidoLotPages(prev => ({ ...prev, [id]: safeLotPage + 1 }))}
                                            disabled={safeLotPage >= lotTotalPages}
                                            className="p-1 text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] disabled:text-[var(--hud-text-dim)]/30 disabled:cursor-not-allowed transition-all"
                                          >
                                            <ChevronRight className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 sm:p-5">
                  {bars.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                      <Warehouse className="w-10 h-10 text-[var(--hud-text-dim)] mb-3 opacity-40" />
                      <p className="text-[11px] font-mono text-[var(--hud-text-dim)]">
                        No hay barras en stock para refundir
                      </p>
                    </div>
                  ) : (
                    <SupplierDirectory
                      bars={bars}
                      clients={clients}
                      purityFirst
                      showSearch
                      hideFooter
                      onBarClick={(barId) => {
                        const bar = bars.find((b) => b.id === barId);
                        if (bar) setSelectedBarForModal(bar);
                        else onBarClick?.(barId);
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Unified GRAN TOTAL Footer */}
            <div className="flex-shrink-0 border-t border-[var(--hud-accent-gold)]/30 bg-[var(--hud-bg-deepest)]">
              <div className="hidden sm:flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5">
                <span className="text-xs font-bold text-[var(--hud-text-primary)] uppercase tracking-wider">
                  GRAN TOTAL
                </span>
                <div className="flex items-center gap-5">
                  <span className="text-xs font-mono text-[var(--hud-text-dim)]">
                    Peso Bruto:{' '}
                    <span className="text-[var(--hud-accent-gold)] font-bold text-sm">
                      {formatNumber(grandTotalBruto, 2)}
                    </span>{' '}
                    <span className="text-[11px] text-[var(--hud-text-dim)]">g</span>
                  </span>
                  <span className="text-[11px] text-[var(--hud-text-dim)]/30">|</span>
                  <span className="text-xs font-mono text-[var(--hud-text-dim)]">
                    Peso Fino:{' '}
                    <span className="text-[var(--hud-accent-gold)] font-bold text-sm">
                      {formatNumber(grandTotalFino, 2)}
                    </span>{' '}
                    <span className="text-[11px] text-[var(--hud-text-dim)]">g</span>
                  </span>
                  {tab === 'fundido' && (
                    <>
                      <span className="text-[11px] text-[var(--hud-text-dim)]/30">|</span>
                      <span className="text-xs font-mono text-[var(--hud-text-dim)]">
                        Merma:{' '}
                        <span className="text-[var(--hud-accent-amber)] font-bold text-sm">
                          {formatNumber(totalMerma, 2)}
                        </span>{' '}
                        <span className="text-[11px] text-[var(--hud-text-dim)]">g</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="sm:hidden px-4 py-3">
                <div className="text-[11px] font-bold text-[var(--hud-text-primary)] uppercase tracking-wider mb-2">
                  GRAN TOTAL
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="text-[10px] text-[var(--hud-text-dim)] uppercase tracking-wider">Peso Bruto</div>
                    <div className="text-[13px] font-mono font-bold text-[var(--hud-accent-gold)] leading-tight whitespace-nowrap">
                      {formatNumber(grandTotalBruto, 2)}{' '}
                      <span className="text-[11px] font-normal text-[var(--hud-text-dim)]">g</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--hud-text-dim)] uppercase tracking-wider">Peso Fino</div>
                    <div className="text-[13px] font-mono font-bold text-[var(--hud-accent-gold)] leading-tight whitespace-nowrap">
                      {formatNumber(grandTotalFino, 2)}{' '}
                      <span className="text-[11px] font-normal text-[var(--hud-text-dim)]">g</span>
                    </div>
                  </div>
                  {tab === 'fundido' && (
                    <div>
                      <div className="text-[10px] text-[var(--hud-text-dim)] uppercase tracking-wider">Merma</div>
                      <div className="text-[13px] font-mono font-bold text-[var(--hud-accent-amber)] leading-tight whitespace-nowrap">
                        {formatNumber(totalMerma, 2)}{' '}
                        <span className="text-[11px] font-normal text-[var(--hud-text-dim)]">g</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {selectedBarForModal && (
        <BarDetailModal
          bar={selectedBarForModal}
          onClose={() => setSelectedBarForModal(null)}
          readOnly
          zIndex="z-[150]"
        />
      )}

      {selectedLotForModal && (
        <LotDetailModal
          lot={selectedLotForModal.lot}
          bars={selectedLotForModal.bars}
          onClose={() => setSelectedLotForModal(null)}
          zIndex="z-[130]"
        />
      )}
    </>
  );
}
