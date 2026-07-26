'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useClients } from '@/hooks/useClients';
import { useProcesses } from '@/hooks/useProcesses';
import { useBars } from '@/hooks/useBars';
import { useCreateMaterialExit } from '@/hooks/useExits';
import { formatNumber } from '@/lib/format';
import { generateDispatchPDF, type DispatchResult } from '@/lib/generateDispatchPDF';
import {
  ArrowLeftRight, X, AlertTriangle, Package,
} from 'lucide-react';
import type { Bar, Client } from '@/types/api';
import { LotDetailModal } from '@/components/egresos/LotDetailModal';
import { ConfirmDispatchModal } from '@/components/egresos/ConfirmDispatchModal';
import { DispatchSuccessOverlay } from '@/components/egresos/DispatchSuccessOverlay';
import { AvailableLotsPanel } from '@/components/egresos/AvailableLotsPanel';
import { BarSelectionPanel } from '@/components/egresos/BarSelectionPanel';
import { CheckoutSummaryPanel } from '@/components/egresos/CheckoutSummaryPanel';

interface AvailableLot {
  id: string;
  name: string;
  processName: string;
  clientId: string;
  clientName: string;
  clientRif: string;
  availableWeight: number;
  barCount: number;
}

export default function V2EgresosPage() {
  const { data: clients = [] } = useClients();
  const { data: bars = [] } = useBars();
  const { data: processes = [] } = useProcesses();
  const createExit = useCreateMaterialExit();

  const [activeTab, setActiveTab] = useState<'lots' | 'bars'>('lots');
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

  const isBarMode = activeTab === 'bars';

  // --- LOTS LOGIC ---
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
          return {
            id: l.id,
            name: l.name,
            processName: p.name,
            clientId: p.clientId,
            clientName: client?.name || 'DESCONOCIDO',
            clientRif: client?.rif || '—',
            availableWeight: Number(
              eligibleBars.reduce((s, b) => s + Number(b.fineWeight), 0),
            ),
            barCount: eligibleBars.length,
          };
        }),
      )
      .filter((l): l is AvailableLot => l !== null && l.availableWeight > 0);
  }, [processes, bars, clients]);

  // --- BARS LOGIC ---
  const availableBars = useMemo(() => {
    return bars.filter(
      b => (b.status === 'IN_STOCK' || b.status === 'COMPLETADO') && !b.lotId,
    ).map(b => ({
      ...b,
      client: b.client || clients.find(c => c.id === b.clientId) || { id: b.clientId, name: 'DESCONOCIDO' },
    }));
  }, [bars, clients]);

  const buyerClients = useMemo(() =>
    clients.filter(c => c.role === 'CLIENTE' || c.role === 'AMBOS'),
  [clients]);

  // --- LOTS GROUP EXPANSION ---
  const allLotClientIds = useMemo(() =>
    [...new Set(allAvailableLots.map(l => l.clientId))],
  [allAvailableLots]);

  const allBarClientIds = useMemo(() =>
    [...new Set(availableBars.map(b => b.clientId))],
  [availableBars]);

  React.useEffect(() => {
    const ids = isBarMode ? allBarClientIds : allLotClientIds;
    setOpenGroups(prev => {
      const next = new Set(prev);
      ids.forEach(id => { if (!next.has(id)) next.add(id); });
      return next;
    });
  }, [allLotClientIds.join(','), allBarClientIds.join(','), isBarMode]);

  // --- FILTERED LOTS ---
  const filteredLots = useMemo(() => {
    if (!searchQuery) return allAvailableLots;
    const q = searchQuery.toLowerCase();
    return allAvailableLots.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.processName.toLowerCase().includes(q) ||
      l.clientName.toLowerCase().includes(q),
    );
  }, [allAvailableLots, searchQuery]);

  const groupedFilteredLots = useMemo(() => {
    const groups: Record<string, AvailableLot[]> = {};
    filteredLots.forEach(l => {
      if (!groups[l.clientId]) groups[l.clientId] = [];
      groups[l.clientId].push(l);
    });
    return groups;
  }, [filteredLots]);

  const selectedLots = useMemo(
    () => allAvailableLots.filter(l => selectedLotIds.has(l.id)),
    [allAvailableLots, selectedLotIds],
  );

  const lotGroupedByClient = useMemo(() => {
    const groups: Record<string, AvailableLot[]> = {};
    selectedLots.forEach(l => {
      if (!groups[l.clientId]) groups[l.clientId] = [];
      groups[l.clientId].push(l);
    });
    return groups;
  }, [selectedLots]);

  const lotTotalWeight = useMemo(
    () => selectedLots.reduce((s, l) => s + l.availableWeight, 0),
    [selectedLots],
  );

  const lotClientCount = Object.keys(lotGroupedByClient).length;

  // --- FILTERED BARS ---
  const filteredBars = useMemo(() => {
    if (!searchQuery) return availableBars;
    const q = searchQuery.toLowerCase();
    return availableBars.filter(b =>
      b.barNumber.toLowerCase().includes(q) ||
      (b.client?.name || '').toLowerCase().includes(q),
    );
  }, [availableBars, searchQuery]);

  const groupedFilteredBars = useMemo(() => {
    const groups: Record<string, typeof availableBars> = {};
    filteredBars.forEach(b => {
      const cId = b.clientId;
      if (!groups[cId]) groups[cId] = [];
      groups[cId].push(b);
    });
    return groups;
  }, [filteredBars]);

  const selectedBars = useMemo(
    () => availableBars.filter(b => selectedBarIds.has(b.id)),
    [availableBars, selectedBarIds],
  );

  const barGroupedByClient = useMemo(() => {
    const groups: Record<string, typeof availableBars> = {};
    selectedBars.forEach(b => {
      if (!groups[b.clientId]) groups[b.clientId] = [];
      groups[b.clientId].push(b);
    });
    return groups;
  }, [selectedBars]);

  const barTotalWeight = useMemo(
    () => selectedBars.reduce((s, b) => s + Number(b.fineWeight), 0),
    [selectedBars],
  );

  const barClientCount = Object.keys(barGroupedByClient).length;

  const totalWeight = isBarMode ? barTotalWeight : lotTotalWeight;
  const clientCount = isBarMode ? barClientCount : lotClientCount;

  // --- TOGGLES ---
  const toggleLot = useCallback((id: string) => {
    setSelectedLotIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleBar = useCallback((id: string) => {
    setSelectedBarIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isSupplierAllSelected = useCallback((clientId: string) => {
    if (isBarMode) {
      const b = groupedFilteredBars[clientId] || [];
      return b.length > 0 && b.every(bar => selectedBarIds.has(bar.id));
    }
    const lots = groupedFilteredLots[clientId] || [];
    return lots.length > 0 && lots.every(l => selectedLotIds.has(l.id));
  }, [isBarMode, groupedFilteredBars, groupedFilteredLots, selectedBarIds, selectedLotIds]);

  const toggleSupplierItems = useCallback((clientId: string) => {
    if (isBarMode) {
      const items = groupedFilteredBars[clientId] || [];
      if (isSupplierAllSelected(clientId)) {
        setSelectedBarIds(prev => {
          const next = new Set(prev);
          items.forEach(b => next.delete(b.id));
          return next;
        });
      } else {
        setSelectedBarIds(prev => {
          const next = new Set(prev);
          items.forEach(b => next.add(b.id));
          return next;
        });
      }
    } else {
      const items = groupedFilteredLots[clientId] || [];
      if (isSupplierAllSelected(clientId)) {
        setSelectedLotIds(prev => {
          const next = new Set(prev);
          items.forEach(l => next.delete(l.id));
          return next;
        });
      } else {
        setSelectedLotIds(prev => {
          const next = new Set(prev);
          items.forEach(l => next.add(l.id));
          return next;
        });
      }
    }
  }, [isBarMode, groupedFilteredBars, groupedFilteredLots, isSupplierAllSelected]);

  const toggleSupplier = useCallback((clientId: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }, []);

  const handleTabSwitch = useCallback((tab: 'lots' | 'bars') => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setDestinationClient(null);
    setSearchQuery('');
    setStatus('idle');
    if (tab === 'bars') {
      setSelectedLotIds(new Set());
      setDetailLotId(null);
    } else {
      setSelectedBarIds(new Set());
    }
  }, [activeTab]);

  const handleOpenConfirm = () => {
    if ((isBarMode ? selectedBars.length : selectedLots.length) === 0 || !destinationClient) return;
    setShowConfirmModal(true);
  };

  const handleDispatch = async () => {
    if (!destinationClient) return;
    if (isBarMode && selectedBars.length === 0) return;
    if (!isBarMode && selectedLots.length === 0) return;

    setShowConfirmModal(false);
    setStatus('processing');
    setMessage('');

    try {
      const payload = isBarMode
        ? { destination: destinationClient.name.toUpperCase(), barIds: selectedBars.map(b => b.id) }
        : { destination: destinationClient.name.toUpperCase(), lotIds: selectedLots.map(l => l.id) };

      const result = await createExit.mutateAsync(payload);

      if (isBarMode) {
        const providers = Object.entries(barGroupedByClient).map(([cId, b]) => ({
          name: b[0].client?.name || 'DESCONOCIDO',
          count: b.length,
          weight: b.reduce((s, bar) => s + Number(bar.fineWeight), 0),
        }));

        setDispatchResult({
          reference: `DESP-${Date.now().toString(36).toUpperCase()}`,
          destination: result.destination,
          totalWeight: Number(result.totalWeight),
          barCount: selectedBars.length,
          providerCount: barClientCount,
          bars: selectedBars.map(b => ({
            barNumber: b.barNumber,
            grossWeight: Number(b.grossWeight),
            purity: Number(b.purity),
            fineWeight: Number(b.fineWeight),
            provider: b.client?.name || 'DESCONOCIDO',
          })),
          providers,
          createdAt: new Date().toISOString(),
          type: 'bars' as const,
        });
      } else {
        const providers = Object.entries(lotGroupedByClient).map(([cId, lots]) => ({
          name: lots[0].clientName,
          count: lots.length,
          weight: lots.reduce((s, l) => s + l.availableWeight, 0),
        }));

        setDispatchResult({
          reference: `DESP-${Date.now().toString(36).toUpperCase()}`,
          destination: result.destination,
          totalWeight: Number(result.totalWeight),
          lotCount: selectedLots.length,
          providerCount: lotClientCount,
          lots: selectedLots.map(l => ({ name: l.name, weight: l.availableWeight, provider: l.clientName })),
          providers,
          createdAt: new Date().toISOString(),
          type: 'lots' as const,
        });
      }

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--pm-text-primary)] font-sans flex items-center gap-2.5">
            <ArrowLeftRight className="w-6 h-6 text-[var(--pm-accent-gold)]" />
            Salida de <span className="text-[var(--pm-accent-gold)]">Material</span>
          </h1>
          <p className="text-xs text-[var(--pm-text-dim)] mt-0.5">Despacho global multi-proveedor con destinatario final.</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--pm-text-dim)]">
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3 text-[var(--pm-accent-gold)]" />
            {isBarMode ? `${availableBars.length} barras disponibles` : `${allAvailableLots.length} lotes disponibles`}
          </span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl border border-[var(--pm-border)]/30 bg-[var(--pm-bg-base)]/30 w-fit">
        <button type="button" onClick={() => handleTabSwitch('lots')}
          className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'lots'
              ? 'bg-[var(--pm-accent-gold)]/15 text-[var(--pm-accent-gold)] border border-[var(--pm-accent-gold)]/30'
              : 'text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)]'
          }`}>
          Lotes Refundidos
        </button>
        <button type="button" onClick={() => handleTabSwitch('bars')}
          className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'bars'
              ? 'bg-[var(--pm-accent-gold)]/15 text-[var(--pm-accent-gold)] border border-[var(--pm-accent-gold)]/30'
              : 'text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)]'
          }`}>
          Barras Individuales
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        {isBarMode ? (
          <BarSelectionPanel
            bars={availableBars}
            searchQuery={searchQuery} onSearchChange={setSearchQuery}
            filteredBars={filteredBars}
            groupedFilteredBars={groupedFilteredBars}
            openGroups={openGroups}
            selectedBarIds={selectedBarIds}
            onToggleBar={toggleBar}
            onToggleSupplier={toggleSupplier}
            onToggleSupplierBars={toggleSupplierItems}
            isSupplierAllSelected={isSupplierAllSelected}
          />
        ) : (
          <AvailableLotsPanel
            lots={allAvailableLots}
            searchQuery={searchQuery} onSearchChange={setSearchQuery}
            filteredLots={filteredLots}
            groupedFilteredLots={groupedFilteredLots}
            openGroups={openGroups}
            selectedLotIds={selectedLotIds}
            onToggleLot={toggleLot}
            onToggleSupplier={toggleSupplier}
            onToggleSupplierLots={toggleSupplierItems}
            isSupplierAllSelected={isSupplierAllSelected}
            onSetDetailLotId={setDetailLotId}
          />
        )}

        <CheckoutSummaryPanel
          selectedLots={isBarMode ? [] : selectedLots}
          selectedBars={isBarMode ? selectedBars : []}
          isBarMode={isBarMode}
          groupedByClient={isBarMode ? barGroupedByClient : lotGroupedByClient}
          totalWeight={totalWeight}
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
        isBarMode={isBarMode}
        selectedBars={isBarMode ? selectedBars : []}
        selectedLots={isBarMode ? [] : selectedLots}
        totalWeight={totalWeight}
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

      <p className="text-[9px] text-[var(--pm-text-dim)] font-mono text-center opacity-50">
        Bandes v2 Premium · {isBarMode ? `${availableBars.length} barras disponibles` : `${allAvailableLots.length} lotes disponibles`} · {isBarMode ? selectedBars.length : selectedLots.length} seleccionados
      </p>
    </motion.div>
  );
}
