'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useClients } from '@/hooks/useClients';
import { useProcesses } from '@/hooks/useProcesses';
import { useBars } from '@/hooks/useBars';
import { useCreateMaterialExit } from '@/hooks/useExits';
import { formatNumber } from '@/lib/format';
import { generateDispatchPDF, type DispatchResult } from '@/lib/generateDispatchPDF';
import { computeComposition, isMixedLot } from '@/lib/composition';
import {
  ArrowLeftRight, X, AlertTriangle, Package,
} from 'lucide-react';
import type { Bar, Client } from '@/types/api';
import { LotDetailModal } from '@/components/egresos/LotDetailModal';
import { EvidenceModal } from '@/components/packing/EvidenceModal';
import { ConfirmDispatchModal } from '@/components/egresos/ConfirmDispatchModal';
import { DispatchSuccessOverlay } from '@/components/egresos/DispatchSuccessOverlay';
import { UnifiedItemPanel, type UnifiedItem } from '@/components/egresos/UnifiedItemPanel';
import { CheckoutSummaryPanel } from '@/components/egresos/CheckoutSummaryPanel';
import { ExitsHistoryView } from '@/components/egresos/ExitsHistoryView';

interface AvailableLot {
  id: string;
  name: string;
  processName: string;
  clientId: string;
  clientName: string;
  clientRif: string;
  availableWeight: number;
  grossWeight: number;
  recovered: number;
  photoUrl: string | null;
  barCount: number;
  isMixed: boolean;
  composition: { clientId: string; clientName: string; weight: number; percentage: number }[];
  inputBars: { barNumber: string; grossWeight: number; purity: number; fineWeight: number; provider: string }[];
}

const MIXED_GROUP_KEY = '__MIXED__';

export default function V2EgresosPage() {
  const { data: clients = [] } = useClients();
  const { data: bars = [] } = useBars();
  const { data: processes = [] } = useProcesses();
  const createExit = useCreateMaterialExit();

const [selectedLotIds, setSelectedLotIds] = useState<Set<string>>(new Set());
  const [selectedBarIds, setSelectedBarIds] = useState<Set<string>>(new Set());
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [destinationClient, setDestinationClient] = useState<{ id: string; name: string; rif: string; contactInfo?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [dispatchResult, setDispatchResult] = useState<DispatchResult | null>(null);
  const [message, setMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [detailLotId, setDetailLotId] = useState<string | null>(null);
  const [evidenceBarId, setEvidenceBarId] = useState<string | null>(null);

  const allAvailableLots: AvailableLot[] = useMemo(() => {
    return processes
      .filter(p => p.status === 'CLOSED')
      .flatMap(p => (p.lots || [])
        .filter(l => l.recovered !== null && Number(l.recovered) > 0)
        .map(l => {
          const client = clients.find(c => c.id === p.clientId);
          const eligibleBars = bars.filter(
            b => b.lotId === l.id && (b.status === 'IN_STOCK' || b.status === 'COMPLETADO'),
          );
          if (eligibleBars.length === 0) return null;
          const recovered = Number(l.recovered);
          const composition = computeComposition(
            eligibleBars.map(b => ({
              clientId: b.clientId,
              clientName: clients.find(c => c.id === b.clientId)?.name || 'DESCONOCIDO',
              fineWeight: Number(b.fineWeight),
            })),
          );
          const fineFromBars = eligibleBars.reduce((s, b) => s + Number(b.fineWeight), 0);
          const grossFromBars = eligibleBars.reduce((s, b) => s + Number(b.grossWeight), 0);
          return {
            id: l.id,
            name: l.name,
            processName: p.name,
            clientId: p.clientId,
            clientName: client?.name || 'DESCONOCIDO',
            clientRif: client?.rif || '—',
            availableWeight: Number(
              l.fineWeight != null ? l.fineWeight : fineFromBars,
            ),
            grossWeight: grossFromBars,
            recovered,
            photoUrl: l.photoUrl || null,
            barCount: eligibleBars.length,
            isMixed: isMixedLot(eligibleBars),
            composition,
            inputBars: eligibleBars.map(b => ({
              barNumber: b.barNumber,
              grossWeight: Number(b.grossWeight),
              purity: Number(b.purity),
              fineWeight: Number(b.fineWeight),
              provider: clients.find(c => c.id === b.clientId)?.name || b.client?.name || 'DESCONOCIDO',
            })),
          };
        }),
      )
      .filter((l): l is AvailableLot => l !== null && l.availableWeight > 0);
  }, [processes, bars, clients]);

  const availableBars = useMemo(() => {
    return bars.filter(
      b => (b.status === 'IN_STOCK' || b.status === 'COMPLETADO') && !b.lotId,
    ).map(b => ({
      ...b,
      client: b.client || clients.find(c => c.id === b.clientId) || { id: b.clientId, name: 'DESCONOCIDO' },
    }));
  }, [bars, clients]);

  const barPhotoUrls = useMemo(
    () => Object.fromEntries(bars.map(b => [b.id, b.photoUrl || '']).filter(([, v]) => v)),
    [bars],
  );

  const buyerClients = useMemo(() =>
    clients.filter(c => c.role === 'CLIENTE' || c.role === 'AMBOS'),
  [clients]);

  const allUnifiedItems: UnifiedItem[] = useMemo(() => {
    const lotItems: UnifiedItem[] = allAvailableLots.map(l => ({
      type: 'lot' as const,
      id: l.id,
      code: l.name,
      provider: l.clientName,
      clientId: l.clientId,
      clientName: l.clientName,
      clientRif: l.clientRif,
      pesoBruto: l.recovered ?? l.grossWeight,
      leyAu: l.recovered > 0 && l.availableWeight > 0
        ? (l.availableWeight / l.recovered) * 1000
        : null,
      pesoFino: l.availableWeight,
      barCount: l.barCount,
      isMixed: l.isMixed,
      composition: l.composition,
    }));
    const barItems: UnifiedItem[] = availableBars.map(b => ({
      type: 'bar' as const,
      id: b.id,
      code: b.barNumber,
      provider: b.client?.name || 'DESCONOCIDO',
      clientId: b.clientId,
      clientName: b.client?.name || 'DESCONOCIDO',
      clientRif: clients.find(c => c.id === b.clientId)?.rif || '—',
      pesoBruto: Number(b.grossWeight),
      leyAu: Number(b.purity),
      pesoFino: Number(b.fineWeight),
    }));
    return [...lotItems, ...barItems];
  }, [allAvailableLots, availableBars, clients]);

  const filteredItems = useMemo(() => {
    let items = allUnifiedItems;
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i =>
      i.code.toLowerCase().includes(q) ||
      i.clientName.toLowerCase().includes(q),
    );
  }, [allUnifiedItems, searchQuery]);

  const hasMixedItems = useMemo(
    () => allUnifiedItems.some(i => i.type === 'lot' && i.isMixed),
    [allUnifiedItems],
  );

  const groupedItems = useMemo(() => {
    const groups: Record<string, UnifiedItem[]> = {};
    filteredItems.forEach(i => {
      const key = i.type === 'lot' && i.isMixed ? MIXED_GROUP_KEY : i.clientId;
      if (!groups[key]) groups[key] = [];
      groups[key].push(i);
    });
    return groups;
  }, [filteredItems]);

  const allClientIds = useMemo(() => {
    const ids = [...new Set(allUnifiedItems.map(i => i.clientId))];
    if (hasMixedItems) ids.unshift(MIXED_GROUP_KEY);
    return ids;
  }, [allUnifiedItems, hasMixedItems]);

  React.useEffect(() => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      allClientIds.forEach(id => { if (!next.has(id)) next.add(id); });
      return next;
    });
  }, [allClientIds.join(',')]);

  const selectedIds = useMemo(() => {
    const ids = new Set<string>();
    selectedLotIds.forEach(id => ids.add(id));
    selectedBarIds.forEach(id => ids.add(id));
    return ids;
  }, [selectedLotIds, selectedBarIds]);

  const selectedLots = useMemo(
    () => allAvailableLots.filter(l => selectedLotIds.has(l.id)),
    [allAvailableLots, selectedLotIds],
  );

  const selectedBars = useMemo(
    () => availableBars.filter(b => selectedBarIds.has(b.id)),
    [availableBars, selectedBarIds],
  );

  const lotGroupedByClient = useMemo(() => {
    const groups: Record<string, AvailableLot[]> = {};
    selectedLots.forEach(l => {
      if (!groups[l.clientId]) groups[l.clientId] = [];
      groups[l.clientId].push(l);
    });
    return groups;
  }, [selectedLots]);

  const barGroupedByClient = useMemo(() => {
    const groups: Record<string, typeof availableBars> = {};
    selectedBars.forEach(b => {
      const cId = b.clientId;
      if (!groups[cId]) groups[cId] = [];
      groups[cId].push(b);
    });
    return groups;
  }, [selectedBars]);

  const lotTotalWeight = useMemo(
    () => selectedLots.reduce((s, l) => s + l.availableWeight, 0),
    [selectedLots],
  );

  const barTotalWeight = useMemo(
    () => selectedBars.reduce((s, b) => s + Number(b.fineWeight), 0),
    [selectedBars],
  );

  const lotTotalGross = useMemo(
    () => selectedLots.reduce((s, l) => s + l.grossWeight, 0),
    [selectedLots],
  );

  const barTotalGross = useMemo(
    () => selectedBars.reduce((s, b) => s + Number(b.grossWeight), 0),
    [selectedBars],
  );

  const totalWeight = lotTotalWeight + barTotalWeight;

  const combinedGroupedByClient = useMemo(() => {
    const groups: Record<string, UnifiedItem[]> = {};
    selectedLots.forEach(l => {
      if (!groups[l.clientId]) groups[l.clientId] = [];
      groups[l.clientId].push({
        type: 'lot', id: l.id, code: l.name, provider: l.clientName,
        clientId: l.clientId, clientName: l.clientName, clientRif: l.clientRif,
        pesoBruto: l.recovered ?? l.grossWeight,
        leyAu: l.recovered > 0 && l.availableWeight > 0
          ? (l.availableWeight / l.recovered) * 1000
          : null,
        pesoFino: l.availableWeight, barCount: l.barCount,
        isMixed: l.isMixed, composition: l.composition,
      });
    });
    selectedBars.forEach(b => {
      if (!groups[b.clientId]) groups[b.clientId] = [];
      groups[b.clientId].push({
        type: 'bar', id: b.id, code: b.barNumber, provider: b.client?.name || 'DESCONOCIDO',
        clientId: b.clientId, clientName: b.client?.name || 'DESCONOCIDO', clientRif: clients.find(c => c.id === b.clientId)?.rif || '—',
        pesoBruto: Number(b.grossWeight), leyAu: Number(b.purity), pesoFino: Number(b.fineWeight),
      });
    });
    return groups;
  }, [selectedLots, selectedBars]);

  const clientCount = Object.keys(combinedGroupedByClient).length;

  const toggleItem = useCallback((id: string) => {
    const lotItem = allAvailableLots.find(l => l.id === id);
    if (lotItem) {
      setSelectedLotIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    } else {
      setSelectedBarIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    }
  }, [allAvailableLots]);

  const isSupplierAllSelected = useCallback((clientId: string) => {
    const items = groupedItems[clientId] || [];
    return items.length > 0 && items.every(i => selectedIds.has(i.id));
  }, [groupedItems, selectedIds]);

  const toggleSupplierItems = useCallback((clientId: string) => {
    const items = groupedItems[clientId] || [];
    if (isSupplierAllSelected(clientId)) {
      items.forEach(item => {
        if (item.type === 'lot') {
          setSelectedLotIds(prev => { const next = new Set(prev); next.delete(item.id); return next; });
        } else {
          setSelectedBarIds(prev => { const next = new Set(prev); next.delete(item.id); return next; });
        }
      });
    } else {
      items.forEach(item => {
        if (item.type === 'lot') {
          setSelectedLotIds(prev => { const next = new Set(prev); next.add(item.id); return next; });
        } else {
          setSelectedBarIds(prev => { const next = new Set(prev); next.add(item.id); return next; });
        }
      });
    }
  }, [groupedItems, isSupplierAllSelected]);

  const toggleSupplier = useCallback((clientId: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId); else next.add(clientId);
      return next;
    });
  }, []);

  const handleOpenConfirm = () => {
    if (selectedLots.length === 0 && selectedBars.length === 0) return;
    if (!destinationClient) return;
    setShowConfirmModal(true);
  };

  const handleOpenDetail = useCallback((id: string) => {
    const isLot = allAvailableLots.some(l => l.id === id);
    if (isLot) setDetailLotId(id);
    else setEvidenceBarId(id);
  }, [allAvailableLots]);

  const handleDispatch = async () => {
    if (!destinationClient) return;
    if (selectedLots.length === 0 && selectedBars.length === 0) return;

    setShowConfirmModal(false);
    setStatus('processing');
    setMessage('');

    try {
      const payload: { destination: string; clientId?: string; lotIds?: string[]; barIds?: string[] } = {
        destination: destinationClient.name.toUpperCase(),
        clientId: destinationClient.id,
      };
      if (selectedLots.length > 0) payload.lotIds = selectedLots.map(l => l.id);
      if (selectedBars.length > 0) payload.barIds = selectedBars.map(b => b.id);

      const result = await createExit.mutateAsync(payload);

      const lotEntries = selectedLots.map(l => {
        const physical = {
          grossWeight: l.grossWeight,
          recovered: l.recovered ?? l.grossWeight,
          fineWeight: l.availableWeight,
          purity: l.grossWeight > 0 ? (l.availableWeight / l.grossWeight) * 1000 : 0,
        };
        return {
          name: l.name,
          weight: l.availableWeight,
          provider: l.clientName,
          isMixed: l.isMixed,
          inputBars: l.inputBars,
          composition: l.isMixed && l.composition.length > 1 ? l.composition : undefined,
          ...physical,
        };
      });

      const allProviders = new Map<string, { count: number; weight: number }>();
      lotEntries.forEach(l => {
        const prev = allProviders.get(l.provider) || { count: 0, weight: 0 };
        allProviders.set(l.provider, { count: prev.count + 1, weight: prev.weight + l.weight });
      });
      selectedBars.forEach(b => {
        const name = b.client?.name || 'DESCONOCIDO';
        const prev = allProviders.get(name) || { count: 0, weight: 0 };
        allProviders.set(name, { count: prev.count + 1, weight: prev.weight + Number(b.fineWeight) });
      });

      const hasBoth = selectedLots.length > 0 && selectedBars.length > 0;

      const despachoGrossSP = lotTotalGross + barTotalGross;
      const despachoBalanza =
        selectedLots.reduce((s, l) => s + (Number(l.recovered) > 0 ? Number(l.recovered) : Number(l.grossWeight)), 0) +
        selectedBars.reduce((s, b) => s + Number(b.grossWeight), 0);
      const despachoFino =
        selectedLots.reduce((s, l) => s + Number(l.availableWeight ?? 0), 0) +
        selectedBars.reduce((s, b) => s + Number(b.fineWeight ?? 0), 0);
      const despachoMerma = despachoGrossSP - despachoBalanza;
      const leyPromedio = despachoBalanza > 0 ? (despachoFino / despachoBalanza) * 1000 : 0;

      setDispatchResult({
        reference: `DESP-${Date.now().toString(36).toUpperCase()}`,
        destination: result.destination,
        totalWeight: Number(result.totalWeight),
        grossWeight: Number((lotTotalGross + barTotalGross).toFixed(2)),
        totalGrossSP: Number(despachoGrossSP),
        totalFino: Number(despachoFino),
        totalBalanza: Number(despachoBalanza),
        totalMerma: Number(despachoMerma),
        leyPromedio: Number(leyPromedio),
        lotCount: selectedLots.length || undefined,
        barCount: selectedBars.length || undefined,
        providerCount: allProviders.size,
        lots: lotEntries.length > 0 ? lotEntries : undefined,
        bars: selectedBars.length > 0
          ? selectedBars.map(b => ({
              barNumber: b.barNumber,
              grossWeight: Number(b.grossWeight),
              purity: Number(b.purity),
              fineWeight: Number(b.fineWeight),
              provider: b.client?.name || 'DESCONOCIDO',
            }))
          : undefined,
        providers: Array.from(allProviders.entries()).map(([name, v]) => ({ name, count: v.count, weight: v.weight })),
        createdAt: new Date().toISOString(),
        type: hasBoth ? 'mixed' : selectedBars.length > 0 ? 'bars' : 'lots',
      });

      setStatus('success');
      setMessage(`Despacho completado — ${destinationClient.name}`);
      setSelectedLotIds(new Set());
      setSelectedBarIds(new Set());
      setDestinationClient(null);
    } catch (err: any) {
      setStatus('error');
      const msg = err?.response?.data?.message || 'Error en el despacho';
      const lotMatch = msg.match(/El lote (.+?) no tiene barras disponibles/);
      setMessage(
        lotMatch
          ? `El lote ${lotMatch[1]} ya no tiene barras disponibles (fueron egresadas o están en proceso). Desmarque ese lote e intente de nuevo.`
          : msg,
      );
    }
  };

  const detailLot = detailLotId ? allAvailableLots.find(l => l.id === detailLotId) ?? null : null;

  const totalSelectedCount = selectedLots.length + selectedBars.length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--pm-text-primary)] font-sans flex items-center gap-2.5">
            <ArrowLeftRight className="w-6 h-6 text-[var(--pm-accent-emerald)]" />
            Salida de <span className="text-[var(--pm-accent-emerald)]">Material</span>
          </h1>
          <p className="text-xs text-[var(--pm-text-dim)] mt-0.5">Despacho global multi-proveedor con destinatario final.</p>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--pm-text-dim)]">
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3 text-[var(--pm-accent-amber)]" />
            {allAvailableLots.length} lotes
          </span>
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3 text-[var(--pm-accent-teal)]" />
            {availableBars.length} barras
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <UnifiedItemPanel
          items={allUnifiedItems}
          searchQuery={searchQuery} onSearchChange={setSearchQuery}
          filteredItems={filteredItems}
          groupedItems={groupedItems}
          openGroups={openGroups}
          selectedIds={selectedIds}
          onToggleItem={toggleItem}
          onToggleSupplier={toggleSupplier}
          onToggleSupplierItems={toggleSupplierItems}
          isSupplierAllSelected={isSupplierAllSelected}
          onOpenDetail={handleOpenDetail}
          mixedGroupKey={MIXED_GROUP_KEY}
        />

        <CheckoutSummaryPanel
          selectedLots={selectedLots}
          selectedBars={selectedBars}
          groupedByClient={combinedGroupedByClient}
          totalWeight={totalWeight}
          grossTotal={lotTotalGross + barTotalGross}
          clientCount={clientCount}
          destinationClient={destinationClient}
          onDestinationChange={setDestinationClient}
          buyerClients={buyerClients}
          status={status}
          onOpenConfirm={handleOpenConfirm}
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmDispatchModal
        isOpen={showConfirmModal}
        destinationClient={destinationClient}
        clientCount={clientCount}
        selectedBars={selectedBars}
        selectedLots={selectedLots}
        onConfirm={handleDispatch}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Success overlay */}
      {status === 'success' && dispatchResult && (
        <DispatchSuccessOverlay
          isOpen
          result={dispatchResult}
          message={message}
          onPDFCliente={() => generateDispatchPDF(dispatchResult, destinationClient ?? undefined, 'CLIENTE')}
          onPDFEmpresa={() => generateDispatchPDF(dispatchResult, destinationClient ?? undefined, 'EMPRESA')}
          onClose={() => { setDispatchResult(null); setStatus('idle'); }}
        />
      )}

      {/* Error */}
      <AnimatePresence>
        {status === 'error' && (
          <motion.div key="error-banner" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-4 rounded-xl border text-xs font-mono bg-[var(--pm-accent-red)]/10 border-[var(--pm-accent-red)]/25 text-[var(--pm-accent-red)]">
            <AlertTriangle className="w-4 h-4 shrink-0" />{message}
            <button type="button" onClick={() => setStatus('idle')}
              className="ml-auto p-1 rounded hover:bg-[var(--pm-accent-red)]/10 transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      {detailLotId && detailLot && (
        <LotDetailModal lot={detailLot} bars={bars} onClose={() => setDetailLotId(null)} />
      )}

      {/* Evidence Modal — Bar detail from Eye icon */}
      <EvidenceModal
        barId={evidenceBarId}
        bars={bars}
        spValues={{}}
        barPhotoUrls={barPhotoUrls}
        label="DETALLE DE BARRA"
        onClose={() => setEvidenceBarId(null)}
      />

      <p className="text-[10px] text-[var(--pm-text-dim)] font-mono text-center opacity-70">
        Bandes v2 Premium · {allAvailableLots.length} lotes + {availableBars.length} barras disponibles · {totalSelectedCount} seleccionados
      </p>

      {/* Historial de operaciones */}
      <div className="mt-8 border-t border-[var(--pm-border)] pt-6">
        <h3 className="text-sm font-semibold text-[var(--pm-text-secondary)] uppercase tracking-wider mb-4">
          Historial de Operaciones
        </h3>
        <ExitsHistoryView />
      </div>
    </motion.div>
  );
}
