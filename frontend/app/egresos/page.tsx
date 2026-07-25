'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useClients } from '@/hooks/useClients';
import { useProcesses } from '@/hooks/useProcesses';
import { useBars } from '@/hooks/useBars';
import { useCreateMaterialExit } from '@/hooks/useExits';
import { formatNumber } from '@/lib/format';
import { generateDispatchPDF } from '@/lib/generateDispatchPDF';
import {
  ArrowLeftRight, X, AlertTriangle, Package,
} from 'lucide-react';
import { LotDetailModal } from '@/components/egresos/LotDetailModal';
import { ConfirmDispatchModal } from '@/components/egresos/ConfirmDispatchModal';
import { DispatchSuccessOverlay } from '@/components/egresos/DispatchSuccessOverlay';
import { AvailableLotsPanel } from '@/components/egresos/AvailableLotsPanel';
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

interface DispatchResult {
  reference: string;
  destination: string;
  totalWeight: number;
  lotCount: number;
  providerCount: number;
  lots: { name: string; weight: number; provider: string }[];
  providers: { name: string; lots: number; weight: number }[];
  createdAt: string;
}

export default function V2EgresosPage() {
  const { data: clients = [] } = useClients();
  const { data: bars = [] } = useBars();
  const { data: processes = [] } = useProcesses();
  const createExit = useCreateMaterialExit();

  const [selectedLotIds, setSelectedLotIds] = useState<Set<string>>(new Set());
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [destinationClient, setDestinationClient] = useState<{ id: string; name: string; rif: string; contactInfo?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [dispatchResult, setDispatchResult] = useState<DispatchResult | null>(null);
  const [message, setMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [detailLotId, setDetailLotId] = useState<string | null>(null);

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

  const buyerClients = useMemo(() =>
    clients.filter(c => c.role === 'CLIENTE' || c.role === 'AMBOS'),
  [clients]);

  const allClientIds = useMemo(() =>
    [...new Set(allAvailableLots.map(l => l.clientId))],
  [allAvailableLots]);

  React.useEffect(() => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      allClientIds.forEach(id => { if (!next.has(id)) next.add(id); });
      return next;
    });
  }, [allClientIds.join(',')]);

  const filteredLots = useMemo(() => {
    if (!searchQuery) return allAvailableLots;
    const q = searchQuery.toLowerCase();
    return allAvailableLots.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.processName.toLowerCase().includes(q) ||
      l.clientName.toLowerCase().includes(q),
    );
  }, [allAvailableLots, searchQuery]);

  const selectedLots = useMemo(
    () => allAvailableLots.filter(l => selectedLotIds.has(l.id)),
    [allAvailableLots, selectedLotIds],
  );

  const groupedByClient = useMemo(() => {
    const groups: Record<string, AvailableLot[]> = {};
    selectedLots.forEach(l => {
      if (!groups[l.clientId]) groups[l.clientId] = [];
      groups[l.clientId].push(l);
    });
    return groups;
  }, [selectedLots]);

  const totalWeight = useMemo(
    () => selectedLots.reduce((s, l) => s + l.availableWeight, 0),
    [selectedLots],
  );

  const clientCount = Object.keys(groupedByClient).length;

  const toggleLot = (id: string) => {
    setSelectedLotIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const groupedFilteredLots = useMemo(() => {
    const groups: Record<string, AvailableLot[]> = {};
    filteredLots.forEach(l => {
      if (!groups[l.clientId]) groups[l.clientId] = [];
      groups[l.clientId].push(l);
    });
    return groups;
  }, [filteredLots]);

  const isSupplierAllSelected = (clientId: string) => {
    const lots = groupedFilteredLots[clientId] || [];
    return lots.length > 0 && lots.every(l => selectedLotIds.has(l.id));
  };

  const toggleSupplierLots = (clientId: string) => {
    const lots = groupedFilteredLots[clientId] || [];
    if (isSupplierAllSelected(clientId)) {
      setSelectedLotIds(prev => {
        const next = new Set(prev);
        lots.forEach(l => next.delete(l.id));
        return next;
      });
    } else {
      setSelectedLotIds(prev => {
        const next = new Set(prev);
        lots.forEach(l => next.add(l.id));
        return next;
      });
    }
  };

  const toggleSupplier = (clientId: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  const handleOpenConfirm = () => {
    if (selectedLots.length === 0 || !destinationClient) return;
    setShowConfirmModal(true);
  };

  const handleDispatch = async () => {
    if (selectedLots.length === 0 || !destinationClient) return;
    setShowConfirmModal(false);
    setStatus('processing');
    setMessage('');

    try {
      const result = await createExit.mutateAsync({
        destination: destinationClient.name.toUpperCase(),
        lotIds: selectedLots.map(l => l.id),
      });

      const providers = Object.entries(groupedByClient).map(([cId, lots]) => ({
        name: lots[0].clientName,
        lots: lots.length,
        weight: lots.reduce((s, l) => s + l.availableWeight, 0),
      }));

      setDispatchResult({
        reference: `DESP-${Date.now().toString(36).toUpperCase()}`,
        destination: result.destination,
        totalWeight: Number(result.totalWeight),
        lotCount: selectedLots.length,
        providerCount: clientCount,
        lots: selectedLots.map(l => ({ name: l.name, weight: l.availableWeight, provider: l.clientName })),
        providers,
        createdAt: new Date().toISOString(),
      });

      setStatus('success');
      setMessage(`Despacho completado — ${destinationClient.name}`);
      setSelectedLotIds(new Set());
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
            {allAvailableLots.length} lotes disponibles
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <AvailableLotsPanel
          lots={allAvailableLots}
          searchQuery={searchQuery} onSearchChange={setSearchQuery}
          filteredLots={filteredLots}
          groupedFilteredLots={groupedFilteredLots}
          openGroups={openGroups}
          selectedLotIds={selectedLotIds}
          onToggleLot={toggleLot}
          onToggleSupplier={toggleSupplier}
          onToggleSupplierLots={toggleSupplierLots}
          isSupplierAllSelected={isSupplierAllSelected}
          onSetDetailLotId={setDetailLotId}
        />

        <CheckoutSummaryPanel
          selectedLots={selectedLots}
          groupedByClient={groupedByClient}
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
        selectedLots={selectedLots}
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
          onPDF={() => generateDispatchPDF(dispatchResult, destinationClient ?? undefined)}
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
        Bandes v2 Premium · {allAvailableLots.length} lotes disponibles de todos los proveedores · {selectedLots.length} seleccionados
      </p>
    </motion.div>
  );
}
