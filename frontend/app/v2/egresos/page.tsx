'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { useClients } from '@/hooks/useClients';
import { useProcesses } from '@/hooks/useProcesses';
import { useBars } from '@/hooks/useBars';
import { useCreateMaterialExit } from '@/hooks/useExits';
import { formatNumber } from '@/lib/format';
import { useGoldTraceability } from '@/context/GoldTraceabilityContext';
import type { WeightUnit } from '@/lib/format';
import {
  ArrowLeftRight, Check, Send, Search, X, Download,
  AlertTriangle, Package, Users, Building2, MapPin,
} from 'lucide-react';

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
  clientName: string;
  destination: string;
  reference: string;
  totalWeight: number;
  lotCount: number;
  clientCount: number;
  lots: { name: string; weight: number }[];
  createdAt: string;
}

export default function V2EgresosPage() {
  const { data: clients = [] } = useClients({ role: 'CLIENTE' });
  const { data: bars = [] } = useBars();
  const { data: processes = [] } = useProcesses();
  const createExit = useCreateMaterialExit();
  const { weightUnit } = useGoldTraceability();

  const [selectedLotIds, setSelectedLotIds] = useState<Set<string>>(new Set());
  const [destination, setDestination] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [dispatchResult, setDispatchResult] = useState<DispatchResult | null>(null);
  const [message, setMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const allAvailableLots: AvailableLot[] = useMemo(() => {
    return processes
      .filter(p => p.status === 'CLOSED')
      .flatMap(p => (p.lots || [])
        .filter(l => l.recovered !== null && Number(l.recovered) > 0)
        .map(l => {
          const client = clients.find(c => c.id === p.clientId);
          return {
            id: l.id,
            name: l.name,
            processName: p.name,
            clientId: p.clientId,
            clientName: client?.name || 'DESCONOCIDO',
            clientRif: client?.rif || '—',
            availableWeight: Number(l.recovered),
            barCount: bars.filter(b => b.lotId === l.id && b.status !== 'EXITED').length,
          };
        })
      );
  }, [processes, bars, clients]);

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

  const toggleAll = () => {
    if (selectedLotIds.size === filteredLots.length) {
      setSelectedLotIds(new Set());
    } else {
      setSelectedLotIds(new Set(filteredLots.map(l => l.id)));
    }
  };

  const generatePDF = useCallback((data: DispatchResult) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = 210, m = 15, cw = pw - m * 2;
    let y = 15;

    doc.setFillColor(7, 11, 20);
    doc.rect(0, 0, pw, 48, 'F');
    doc.setFillColor(212, 175, 55);
    doc.rect(0, 46, pw, 2, 'F');

    doc.setTextColor(212, 175, 55);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('BANDES', m, y + 10);

    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Trazabilidad de Oro Fino', m, y + 18);

    doc.setTextColor(212, 175, 55);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROBANTE DE DESPACHO', pw - m, y + 10, { align: 'right' });

    doc.setTextColor(160, 160, 160);
    doc.setFontSize(7);
    doc.text(`Ref: ${data.reference}`, pw - m, y + 18, { align: 'right' });

    y = 58;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.4);
    doc.line(m, y, pw - m, y);
    y += 10;

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL DESPACHO', m, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Destino: ${data.destination}`, m, y); y += 6;
    doc.text(`Clientes: ${data.clientName}`, m, y); y += 6;
    doc.text(`Lotes: ${data.lotCount}`, m, y); y += 6;
    doc.text(`Peso Total: ${weightUnit === 'kg' ? `${(data.totalWeight / 1000).toFixed(4)} kg` : `${data.totalWeight.toFixed(2)} g`}`, m, y); y += 6;
    doc.text(`Fecha: ${new Date(data.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, m, y);
    y += 10;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(m, y, pw - m, y);
    y += 8;

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE LOTES', m, y);
    y += 8;

    doc.setFillColor(7, 11, 20);
    doc.rect(m, y - 4, cw, 8, 'F');
    doc.setTextColor(212, 175, 55);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('LOTE', m + 2, y + 1);
    doc.text('PESO', pw - m - 2, y + 1, { align: 'right' });
    y += 8;

    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    data.lots.forEach((lot, idx) => {
      if (y > 260) { doc.addPage(); y = 20; }
      if (idx % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(m, y - 4, cw, 8, 'F');
      }
      doc.text(lot.name, m + 2, y + 1);
      const display = weightUnit === 'kg'
        ? `${(lot.weight / 1000).toFixed(4)} kg`
        : `${lot.weight.toFixed(2)} g`;
      doc.text(display, pw - m - 2, y + 1, { align: 'right' });
      y += 8;
    });

    y += 8;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.6);
    doc.line(m, y, pw - m, y);
    y += 8;

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const totalDisp = weightUnit === 'kg'
      ? `${(data.totalWeight / 1000).toFixed(4)} kg`
      : `${data.totalWeight.toFixed(2)} g`;
    doc.text(`PESO TOTAL: ${totalDisp}`, m, y);
    y += 8;
    doc.text(`LOTES: ${data.lotCount}`, m, y);
    y += 20;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(m, y, pw - m, y);
    y += 8;
    doc.setTextColor(140, 140, 140);
    doc.setFontSize(8);
    doc.text('_________________________', m, y); y += 5;
    doc.text('Firma Autorizada', m, y);
    doc.text('_________________________', pw - m - 40, y - 5);
    doc.text('Sello Receptor', pw - m - 40, y);

    doc.save(`Comprobante_${data.reference.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`);
  }, [weightUnit]);

  const handleOpenConfirm = () => {
    if (selectedLots.length === 0 || !destination.trim()) return;
    setShowConfirmModal(true);
  };

  const handleDispatch = async () => {
    if (selectedLots.length === 0 || !destination) return;
    setShowConfirmModal(false);
    setStatus('processing');
    setMessage('');

    try {
      const result = await createExit.mutateAsync({
        destination: destination.toUpperCase(),
        lotIds: selectedLots.map(l => l.id),
      });

      const clientNames = [...new Set(selectedLots.map(l => l.clientName))].join(', ');

      setDispatchResult({
        clientName: clientNames,
        destination: result.destination,
        reference: `DESP-${Date.now().toString(36).toUpperCase()}`,
        totalWeight: result.totalWeight,
        lotCount: selectedLots.length,
        clientCount,
        lots: selectedLots.map(l => ({ name: l.name, weight: l.availableWeight })),
        createdAt: new Date().toISOString(),
      });

      setStatus('success');
      setMessage(`Despacho completado — ${result.destination}`);
      setSelectedLotIds(new Set());
      setDestination('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.response?.data?.message || 'Error en el despacho');
    }
  };

  const fmtWeightDisplay = (val: number) =>
    weightUnit === 'kg' ? `${formatNumber(val / 1000, 4)} kg` : `${formatNumber(val, 2)} g`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-xl font-semibold text-[var(--pm-text-primary)] font-sans flex items-center gap-2.5">
            <ArrowLeftRight className="w-6 h-6 text-[var(--pm-accent-gold)]" />
            Salida de <span className="text-[var(--pm-accent-gold)]">Material</span>
          </h1>
          <p className="text-xs text-[var(--pm-text-dim)] mt-0.5">Gestión de despachos multi-cliente con comprobante digital.</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--pm-text-dim)]">
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3 text-[var(--pm-accent-gold)]" />
            {allAvailableLots.length} lotes disponibles
          </span>
        </div>
      </motion.div>

      {/* Split pane */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        {/* ═══ LEFT: Available Lots ═══ */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
          className="xl:col-span-3 premium-card overflow-hidden"
        >
          <div className="px-5 py-3.5 border-b border-[var(--pm-border)] flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--pm-text-dim)]/40" />
              <input type="text" placeholder="Buscar lote, proceso o cliente..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={toggleAll}
                className="text-[9px] font-mono text-[var(--pm-accent-gold)] hover:text-[var(--pm-accent-amber)] active:scale-95 transition-all cursor-pointer"
              >
                {selectedLotIds.size === filteredLots.length ? 'Deseleccionar' : 'Todo'}
              </button>
              <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">{filteredLots.length} lotes</span>
            </div>
          </div>

          {filteredLots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--pm-text-dim)]">
              <Package className="w-10 h-10 text-[var(--pm-accent-gold)]/20 mb-3 animate-pulse" />
              <span className="text-sm font-sans">Sin lotes disponibles</span>
              <p className="text-[10px] font-mono mt-1">Asegúrese de que haya procesos cerrados con recuperación.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="premium-table w-full">
                <thead>
                  <tr>
                    <th className="w-10 text-center">
                      <input type="checkbox" checked={selectedLotIds.size === filteredLots.length && filteredLots.length > 0}
                        onChange={toggleAll} className="accent-[var(--pm-accent-gold)] cursor-pointer" />
                    </th>
                    <th className="sticky left-0 bg-[var(--pm-bg-secondary)] z-10 min-w-[140px]">Cliente</th>
                    <th>Proceso</th>
                    <th>Lote</th>
                    <th className="text-right">R (g)</th>
                    <th className="text-center">Barras</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLots.map((lot, idx) => (
                    <motion.tr key={lot.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.008, duration: 0.15 }}
                      onClick={() => toggleLot(lot.id)}
                      className={`odd:bg-[var(--pm-bg-deepest)]/30 hover:bg-[var(--pm-bg-tertiary)]/50 transition-all cursor-pointer ${selectedLotIds.has(lot.id) ? 'bg-[var(--pm-accent-gold)]/5' : ''}`}
                    >
                      <td className="text-center" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedLotIds.has(lot.id)}
                          onChange={() => toggleLot(lot.id)} className="accent-[var(--pm-accent-gold)] cursor-pointer active:scale-90" />
                      </td>
                      <td className="sticky left-0 bg-[var(--pm-bg-secondary)] z-10 font-sans font-semibold text-[var(--pm-text-primary)] text-[11px]">
                        <span className="block truncate max-w-[140px]">{lot.clientName}</span>
                        <span className="text-[8px] font-mono text-[var(--pm-text-dim)]">{lot.clientRif}</span>
                      </td>
                      <td className="font-mono text-[var(--pm-text-dim)] text-[11px]">{lot.processName}</td>
                      <td className="font-mono font-bold text-[var(--pm-accent-gold)] tracking-wider text-[11px]">{lot.name}</td>
                      <td className="text-right font-mono text-[var(--pm-text-primary)]">{formatNumber(lot.availableWeight, 4)}</td>
                      <td className="text-center">
                        <span className="text-[9px] font-mono text-[var(--pm-text-dim)] bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] px-1.5 py-0.5 rounded">
                          {lot.barCount} u
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* ═══ RIGHT: Checkout Summary ═══ */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
          className="xl:col-span-2 premium-card overflow-hidden"
        >
          <div className="px-5 py-3.5 border-b border-[var(--pm-border)]">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-[var(--pm-accent-gold)]" />
              <span className="text-xs font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Caja de Salida</span>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Empty state */}
            {selectedLots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--pm-text-dim)]">
                <Package className="w-8 h-8 text-[var(--pm-text-dim)]/30 mb-2" />
                <span className="text-[11px] font-mono text-center">Seleccione lotes del panel izquierdo</span>
                <p className="text-[9px] font-mono mt-1 text-center">Todos los pesos se agruparán automáticamente.</p>
              </div>
            ) : (
              <>
                {/* Total weight */}
                <div className="text-center py-4 px-4 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50">
                  <span className="text-[9px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block mb-1">
                    Peso Total Acumulado
                  </span>
                  <span className="text-2xl font-mono font-bold text-[var(--pm-accent-gold)] tracking-tight">
                    {fmtWeightDisplay(totalWeight)}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--pm-text-dim)] block mt-1">
                    {clientCount} cliente{clientCount !== 1 ? 's' : ''} involucrado{clientCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Grouped by client */}
                <div className="space-y-3">
                  <span className="text-[9px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider block">
                    Desglose por Cliente ({selectedLots.length} lotes)
                  </span>
                  {Object.entries(groupedByClient).map(([cId, lots]) => {
                    const client = lots[0];
                    const clientTotal = lots.reduce((s, l) => s + l.availableWeight, 0);
                    return (
                      <div key={cId} className="p-3 rounded-lg border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/40">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Building2 className="w-3.5 h-3.5 shrink-0 text-[var(--pm-accent-gold)]" />
                            <span className="text-[11px] font-sans font-semibold text-[var(--pm-text-primary)] truncate">{client.clientName}</span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-[var(--pm-accent-gold)]">{fmtWeightDisplay(clientTotal)}</span>
                        </div>
                        <div className="space-y-1">
                          {lots.map(l => (
                            <div key={l.id} className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-[var(--pm-text-dim)]">{l.name}</span>
                              <span className="text-[var(--pm-text-primary)]">{formatNumber(l.availableWeight, 4)} g</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Destination input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Destino
                  </label>
                  <input type="text" placeholder="Ej: CLIENTE FINAL / FUNDICIÓN ABC" value={destination}
                    onChange={e => setDestination(e.target.value.toUpperCase())}
                    className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors uppercase placeholder:text-[var(--pm-text-dim)]/30"
                    required
                  />
                </div>

                {/* Dispatch button */}
                <button type="button" onClick={handleOpenConfirm}
                  disabled={selectedLots.length === 0 || !destination.trim() || status === 'processing'}
                  className="w-full py-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{
                    background: selectedLots.length > 0 && destination.trim()
                      ? 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))'
                      : 'transparent',
                    color: selectedLots.length > 0 && destination.trim() ? 'var(--pm-accent-gold)' : 'var(--pm-text-dim)',
                    border: `1px solid ${selectedLots.length > 0 && destination.trim() ? 'rgba(212,175,55,0.3)' : 'var(--pm-border)'}`,
                  }}
                >
                  <Send className="w-4 h-4" />
                  Ejecutar Despacho ({selectedLots.length} lotes)
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div key="confirm-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md glass-panel rounded-2xl overflow-hidden"
            >
              <div className="px-6 pt-6 pb-4 border-b border-[var(--pm-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
                    <Send className="w-4 h-4 text-[var(--pm-accent-gold)]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-gold)] uppercase tracking-wider">Confirmar Despacho</span>
                    <h3 className="text-sm font-sans font-semibold text-[var(--pm-text-primary)] mt-0.5">Resumen de Salida</h3>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 space-y-2 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-[var(--pm-text-dim)]">Destino:</span>
                    <span className="text-[var(--pm-accent-gold)] font-bold">{destination.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--pm-text-dim)]">Lotes:</span>
                    <span className="text-[var(--pm-text-primary)] font-bold">{selectedLots.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--pm-text-dim)]">Clientes:</span>
                    <span className="text-[var(--pm-text-primary)] font-bold">{clientCount}</span>
                  </div>
                  <div className="border-t border-[var(--pm-border)] pt-2 flex justify-between">
                    <span className="text-[var(--pm-text-dim)]">Peso Total:</span>
                    <span className="text-lg font-bold text-[var(--pm-accent-gold)]">{fmtWeightDisplay(totalWeight)}</span>
                  </div>
                  <div className="pt-1 text-[9px] text-[var(--pm-text-dim)]">
                    Se entregarán {selectedLots.length} lote{selectedLots.length !== 1 ? 's' : ''} con un peso total de {fmtWeightDisplay(totalWeight)} a <strong className="text-[var(--pm-text-primary)]">{destination.toUpperCase()}</strong>.
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                  >Cancelar</button>
                  <button type="button" onClick={handleDispatch}
                    className="flex-1 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))',
                      color: 'var(--pm-accent-gold)', border: '1px solid rgba(212,175,55,0.3)',
                    }}
                  ><Send className="w-4 h-4" /> Confirmar Despacho</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success overlay */}
      <AnimatePresence>
        {status === 'success' && dispatchResult && (
          <motion.div key="success-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md glass-panel rounded-2xl overflow-hidden p-6"
            >
              <div className="flex flex-col items-center space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.25)' }}>
                  <Check className="w-8 h-8 text-[var(--pm-accent-emerald)]" strokeWidth={2.5} />
                </motion.div>

                <span className="text-sm font-sans font-bold text-[var(--pm-accent-emerald)]">Despacho Exitoso</span>
                <span className="text-xs text-[var(--pm-text-dim)] text-center">{message}</span>

                <div className="w-full p-4 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 space-y-2 text-[10px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-[var(--pm-text-dim)]">Destino:</span>
                    <span className="text-[var(--pm-accent-gold)] font-bold">{dispatchResult.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--pm-text-dim)]">Cliente(s):</span>
                    <span className="text-[var(--pm-text-primary)] font-bold">{dispatchResult.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--pm-text-dim)]">Lotes:</span>
                    <span className="text-[var(--pm-text-primary)] font-bold">{dispatchResult.lotCount}</span>
                  </div>
                  <div className="border-t border-[var(--pm-border)] pt-2 flex justify-between">
                    <span className="text-[var(--pm-text-dim)]">Peso Total:</span>
                    <span className="text-sm font-bold text-[var(--pm-accent-gold)]">{fmtWeightDisplay(dispatchResult.totalWeight)}</span>
                  </div>
                </div>

                <div className="flex gap-3 w-full">
                  <button type="button" onClick={() => generatePDF(dispatchResult)}
                    className="flex-[2] py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))',
                      color: 'var(--pm-accent-gold)', border: '1px solid rgba(212,175,55,0.3)',
                    }}
                  ><Download className="w-4 h-4" /> Descargar PDF</button>
                  <button type="button" onClick={() => { setDispatchResult(null); setStatus('idle'); }}
                    className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                  >Cerrar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {status === 'error' && (
          <motion.div key="error-banner" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-4 rounded-xl border text-xs font-mono bg-[var(--pm-accent-red)]/10 border-[var(--pm-accent-red)]/25 text-[var(--pm-accent-red)]"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />{message}
            <button type="button" onClick={() => setStatus('idle')}
              className="ml-auto p-1 rounded hover:bg-[var(--pm-accent-red)]/10 transition-colors cursor-pointer"
            ><X className="w-3.5 h-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[9px] text-[var(--pm-text-dim)] font-mono text-center opacity-50">
        Bandes v2 Premium · {allAvailableLots.length} lotes disponibles · {selectedLots.length} seleccionados
      </p>
    </motion.div>
  );
}
