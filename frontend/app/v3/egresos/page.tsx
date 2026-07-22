'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { useClients } from '@/hooks/useClients';
import { useProcesses } from '@/hooks/useProcesses';
import { useBars } from '@/hooks/useBars';
import { useCreateMaterialExit } from '@/hooks/useExits';
import { formatWeight } from '@/lib/format';
import { useRole } from '@/context/RoleContext';
import { ScannerTable, type ColumnDef } from '@/components/tactical/ScannerTable';
import { TerminalPanel } from '@/components/tactical/TerminalPanel';
import { HudButton } from '@/components/tactical/HudButton';
import { TacticalCard } from '@/components/tactical/TacticalCard';
import { Check, Plus, X, ArrowUpRight, FileDown, Package, Users, AlertTriangle, ShieldOff } from 'lucide-react';

interface AvailableLotItem {
  id: string;
  name: string;
  processName: string;
  processId: string;
  clientId: string;
  clientName: string;
  availableWeight: number;
  barCount: number;
}

interface DispatchClientEntry {
  clientName: string;
  clientRif: string;
  lotCount: number;
  weightSum: number;
  lots: { name: string; weight: number }[];
}

interface DispatchResultData {
  clients: DispatchClientEntry[];
  destination: string;
  reference: string;
  totalWeight: number;
  lotCount: number;
  createdAt: string;
}

export default function TacticalEgresosPage() {
  const { data: clients = [] } = useClients({ role: 'CLIENTE' });
  const { data: bars = [] } = useBars();
  const { data: processes = [] } = useProcesses();
  const createExit = useCreateMaterialExit();
  const { hasRole } = useRole();
  const canDispatch = hasRole('OWNER', 'SUPERADMIN');

  const [activeClientIds, setActiveClientIds] = useState<string[]>([]);
  const [selectedTerminalClientId, setSelectedTerminalClientId] = useState<string>('');
  const [assignedLots, setAssignedLots] = useState<Record<string, string[]>>({});
  const [clientRequiredGrams, setClientRequiredGrams] = useState<Record<string, string>>({});
  const [destination, setDestination] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [dispatchResult, setDispatchResult] = useState<DispatchResultData | null>(null);
  const [message, setMessage] = useState('');

  const allAvailableLots = useMemo(() => {
    return processes
      .filter(p => p.status === 'CLOSED')
      .flatMap(p => (p.lots || [])
        .filter(l => l.recovered !== null && l.recovered !== undefined && Number(l.recovered) > 0)
        .map(l => {
          const client = clients.find(c => c.id === p.clientId);
          return {
            id: l.id,
            name: l.name,
            processName: p.name,
            processId: p.id,
            clientId: p.clientId,
            clientName: client?.name || 'DESCONOCIDO',
            availableWeight: Number(l.recovered),
            barCount: bars.filter(b => b.lotId === l.id && b.status !== 'EXITED').length,
          } as AvailableLotItem;
        })
      );
  }, [processes, bars, clients]);

  const focusedClientLots = useMemo(() => {
    if (!selectedTerminalClientId) return [];
    return allAvailableLots.filter(l => {
      const assignees = assignedLots[l.id] || [];
      return assignees.includes(selectedTerminalClientId);
    });
  }, [allAvailableLots, assignedLots, selectedTerminalClientId]);

  const unassignedLots = useMemo(() => {
    if (!selectedTerminalClientId) return [];
    return allAvailableLots.filter(l => {
      const assignees = assignedLots[l.id] || [];
      return !assignees.includes(selectedTerminalClientId);
    });
  }, [allAvailableLots, assignedLots, selectedTerminalClientId]);

  const focusedClientGrams = useMemo(() => {
    return focusedClientLots.reduce((sum, l) => sum + l.availableWeight, 0);
  }, [focusedClientLots]);

  const requiredGramsVal = useMemo(() => {
    const val = clientRequiredGrams[selectedTerminalClientId];
    return val ? parseFloat(val) : 0;
  }, [clientRequiredGrams, selectedTerminalClientId]);

  const remainingNeeded = useMemo(() => {
    if (!requiredGramsVal || requiredGramsVal <= 0) return 0;
    return Math.max(0, requiredGramsVal - focusedClientGrams);
  }, [requiredGramsVal, focusedClientGrams]);

  const progressPct = useMemo(() => {
    if (!requiredGramsVal || requiredGramsVal <= 0) return 0;
    return Math.min(100, (focusedClientGrams / requiredGramsVal) * 100);
  }, [requiredGramsVal, focusedClientGrams]);

  const showNoGoldAlert = useMemo(() => {
    if (!selectedTerminalClientId || !requiredGramsVal || requiredGramsVal <= 0) return false;
    if (remainingNeeded <= 0) return false;
    const totalUnassigned = unassignedLots.reduce((sum, l) => sum + l.availableWeight, 0);
    return totalUnassigned < remainingNeeded;
  }, [selectedTerminalClientId, requiredGramsVal, remainingNeeded, unassignedLots]);

  const getClientTotals = useCallback((clientId: string) => {
    const clientLots = allAvailableLots.filter(l => {
      const assignees = assignedLots[l.id] || [];
      return assignees.includes(clientId);
    });
    return { count: clientLots.length, grams: clientLots.reduce((sum, l) => sum + l.availableWeight, 0) };
  }, [allAvailableLots, assignedLots]);

  const handleToggleClient = (clientId: string) => {
    setActiveClientIds(prev => {
      if (prev.includes(clientId)) {
        setAssignedLots(curr => {
          const updated = { ...curr };
          Object.keys(updated).forEach(lotId => {
            updated[lotId] = updated[lotId].filter(cid => cid !== clientId);
            if (updated[lotId].length === 0) delete updated[lotId];
          });
          return updated;
        });
        return prev.filter(id => id !== clientId);
      } else {
        if (prev.length === 0) setSelectedTerminalClientId(clientId);
        return [...prev, clientId];
      }
    });
  };

  const handleAssignLot = (lotId: string) => {
    if (!selectedTerminalClientId) return;
    setAssignedLots(prev => {
      const current = prev[lotId] || [];
      if (!current.includes(selectedTerminalClientId)) {
        return { ...prev, [lotId]: [...current, selectedTerminalClientId] };
      }
      return prev;
    });
  };

  const handleRemoveLot = (lotId: string) => {
    setAssignedLots(prev => {
      const updated = { ...prev };
      if (updated[lotId]) {
        updated[lotId] = updated[lotId].filter(cid => cid !== selectedTerminalClientId);
        if (updated[lotId].length === 0) delete updated[lotId];
      }
      return updated;
    });
  };

  const generateDispatchPDF = useCallback((data: DispatchResultData) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = 210;
    const m = 15;
    const cw = pw - m * 2;
    let y = 15;

    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, pw, 45, 'F');

    doc.setTextColor(213, 176, 66);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BANDES CORPORATION', m, y + 8);

    doc.setTextColor(200, 200, 200);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Trazabilidad de Oro Fino', m, y + 15);

    doc.setTextColor(213, 176, 66);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROBANTE DE DESPACHO', pw - m, y + 8, { align: 'right' });

    doc.setTextColor(160, 160, 160);
    doc.setFontSize(8);
    doc.text(`Ref: ${data.reference}`, pw - m, y + 15, { align: 'right' });

    y = 55;
    doc.setDrawColor(213, 176, 66);
    doc.setLineWidth(0.5);
    doc.line(m, y, pw - m, y);
    y += 8;

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL DESPACHO', m, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Destino: ${data.destination}`, m, y); y += 6;
    doc.text(`Fecha: ${new Date(data.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, m, y);
    y += 6;
    doc.text(`Clientes: ${data.clients.map(c => c.clientName).join(', ')}`, m, y);
    y += 10;

    // Per-client section
    for (const entry of data.clients) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(m, y, pw - m, y);
      y += 7;

      doc.setTextColor(40, 40, 40);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${entry.clientName} (${entry.clientRif})`, m, y);
      y += 7;

      doc.setFillColor(45, 45, 45);
      doc.rect(m, y - 4, cw, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('LOTE', m + 2, y + 1);
      doc.text('PESO ASIGNADO (g)', m + 120, y + 1);
      y += 8;

      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      entry.lots.forEach((lot, idx) => {
        if (y > 260) { doc.addPage(); y = 20; }
        if (idx % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(m, y - 4, cw, 8, 'F');
        }
        doc.text(lot.name, m + 2, y + 1);
        doc.setFont('helvetica', 'bold');
        doc.text(`${lot.weight.toFixed(4)} g`, m + 120, y + 1);
        doc.setFont('helvetica', 'normal');
        y += 8;
      });

      doc.setFont('helvetica', 'bold');
      doc.text(`Subtotal ${entry.clientName}: ${entry.weightSum.toFixed(4)} g`, m + 2, y + 2);
      doc.setFont('helvetica', 'normal');
      y += 10;
    }

    y += 4;
    doc.setDrawColor(213, 176, 66);
    doc.setLineWidth(0.8);
    doc.line(m, y, pw - m, y);
    y += 8;

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`PESO TOTAL DESPACHADO: ${data.totalWeight.toFixed(4)} g`, m, y);
    y += 8;
    doc.text(`LOTES DESPACHADOS: ${data.lotCount}`, m, y);
    y += 16;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(m, y, pw - m, y);
    y += 8;

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('_________________________', m, y); y += 5;
    doc.text('Firma Autorizada', m, y);
    doc.text('_________________________', pw - m - 40, y - 5);
    doc.text('Sello Receptor', pw - m - 40, y);

    doc.save(`Comprobante_Despacho_${data.reference.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`);
  }, []);

  const allAssignedLotIds = useMemo(() => Object.keys(assignedLots), [assignedLots]);

  const allAssignedLots = useMemo(() => {
    return allAvailableLots.filter(l => allAssignedLotIds.includes(l.id));
  }, [allAvailableLots, allAssignedLotIds]);

  const handleDispatch = async () => {
    if (allAssignedLots.length === 0 || !destination) return;
    setStatus('processing');
    setMessage('');

    try {
      const result = await createExit.mutateAsync({
        destination: destination.toUpperCase(),
        lotIds: allAssignedLots.map(l => l.id),
      });

      const clientsInvolved = [...new Set(allAssignedLots.map(l => l.clientId))];
      const clientEntries: DispatchClientEntry[] = clientsInvolved.map(cid => {
        const client = clients.find(c => c.id === cid);
        const clientLots = allAssignedLots.filter(l => l.clientId === cid);
        return {
          clientName: client?.name || 'DESCONOCIDO',
          clientRif: client?.rif || '—',
          lotCount: clientLots.length,
          weightSum: clientLots.reduce((s, l) => s + l.availableWeight, 0),
          lots: clientLots.map(l => ({ name: l.name, weight: l.availableWeight })),
        };
      });

      setDispatchResult({
        clients: clientEntries,
        destination: result.destination,
        reference: `DESP-${Date.now().toString(36).toUpperCase()}`,
        totalWeight: result.totalWeight,
        lotCount: allAssignedLots.length,
        createdAt: new Date().toISOString(),
      });

      setStatus('success');
      setMessage(`EGRESO DESPLEGADO — ${result.destination} — ${formatWeight(result.totalWeight)}`);

      setAssignedLots({});
      setActiveClientIds([]);
      setSelectedTerminalClientId('');
      setDestination('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.response?.data?.message || 'ERROR EN DESPLIEGUE');
    }
  };

  const hasActiveClients = activeClientIds.length > 0;
  const focusedClient = clients.find(c => c.id === selectedTerminalClientId);

  const lotColumns: ColumnDef<AvailableLotItem>[] = [
    {
      key: 'name',
      label: 'LOTE',
      render: r => (
        <span className="font-bold text-[var(--tac-accent-amber)]">{r.name}</span>
      ),
    },
    {
      key: 'processName',
      label: 'PROCESO',
      render: r => (
        <span className="text-[var(--tac-text-dim)]">{r.processName}</span>
      ),
    },
    {
      key: 'clientName',
      label: 'CLIENTE ORIGEN',
      render: r => (
        <span className="text-[var(--tac-text-primary)]">{r.clientName}</span>
      ),
    },
    {
      key: 'availableWeight',
      label: 'DISPONIBLE (g)',
      align: 'right',
      render: r => (
        <span className="text-[var(--tac-accent-green)] font-bold">{formatWeight(r.availableWeight)}</span>
      ),
    },
    {
      key: 'barCount',
      label: 'BARRAS',
      align: 'center',
      render: r => (
        <span className="text-[var(--tac-text-dim)]">{r.barCount} u</span>
      ),
    },
    {
      key: 'actions',
      label: 'ACCIÓN',
      align: 'center',
      width: '80px',
      render: r => (
        <div onClick={(e) => e.stopPropagation()}>
          <HudButton
            variant="primary"
            onClick={() => handleAssignLot(r.id)}
            className="text-[8px] px-2 py-1 mx-auto"
          >
            <Plus className="w-3 h-3" />
          </HudButton>
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <span className="text-[9px] font-mono font-bold text-[var(--tac-accent-cyan)] uppercase tracking-[0.2em]">
          {'>'} LOGÍSTICA DE MATERIAL — DESPACHO TERMINAL
        </span>
        <p className="text-[10px] font-mono text-[var(--tac-text-dim)] mt-1">
          GESTIÓN DE SALIDAS DE ORO FINO POR DESTINO
        </p>
      </motion.div>

      {/* Client chips bar */}
      <AnimatePresence>
        {hasActiveClients && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2 px-3 py-2 bg-[var(--tac-bg-secondary)] border border-[var(--tac-border)]"
          >
            <span className="text-[8px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.12em] flex items-center gap-1">
              <Users className="w-3 h-3 text-[var(--tac-accent-cyan)]" />
              CLIENTES ACTIVOS:
            </span>
            {activeClientIds.map(cid => {
              const client = clients.find(c => c.id === cid);
              if (!client) return null;
              const totals = getClientTotals(cid);
              const isActive = selectedTerminalClientId === cid;
              return (
                <div key={cid}
                  onClick={() => setSelectedTerminalClientId(cid)}
                  className={`flex items-center gap-1.5 px-2 py-1 border text-[10px] font-mono cursor-pointer transition-all active:scale-95
                    ${isActive
                      ? 'border-[var(--tac-accent-cyan)]/60 bg-[var(--tac-accent-cyan)]/10 text-[var(--tac-text-primary)]'
                      : 'border-[var(--tac-border)] bg-[var(--tac-bg-primary)] text-[var(--tac-text-dim)] hover:text-[var(--tac-text-primary)]'
                    }`}
                >
                  <span className="truncate max-w-[90px]">{client.name}</span>
                  <span className={`text-[8px] font-bold ${isActive ? 'text-[var(--tac-accent-cyan)]' : 'text-[var(--tac-text-dim)]'}`}>
                    {formatWeight(totals.grams)}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); handleToggleClient(cid); }}
                    className="p-0.5 text-[var(--tac-text-dim)] hover:text-[var(--tac-accent-red)] active:scale-90 transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client selector when no active clients */}
      {!hasActiveClients && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 bg-[var(--tac-bg-secondary)] border border-dashed border-[var(--tac-border)] space-y-4"
        >
          <Package className="w-10 h-10 text-[var(--tac-text-dim)]/30" />
          <span className="text-[11px] font-mono text-[var(--tac-text-dim)]">SELECCIONE CLIENTE</span>
          <p className="text-[9px] font-mono text-[var(--tac-text-dim)]/50 max-w-xs text-center leading-relaxed">
            Seleccione uno o más clientes para iniciar la gestión de despacho de material.
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-lg">
            {clients.map(c => (
              <HudButton key={c.id} variant="ghost" onClick={() => handleToggleClient(c.id)} className="text-[9px]">
                {c.name}
              </HudButton>
            ))}
            {clients.length === 0 && (
              <span className="text-[9px] font-mono text-[var(--tac-text-dim)]/40">NO HAY CLIENTES DISPONIBLES</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Main workspace */}
      {hasActiveClients && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
          {/* Selected Terminal Panel */}
          <AnimatePresence>
            {selectedTerminalClientId && focusedClient && (
              <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }} className="xl:col-span-2 space-y-4"
              >
                <TerminalPanel title={`DESPACHO: ${focusedClient.name}`} accent="cyan">
                  <div className="space-y-3">
                    {/* Client info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-[var(--tac-text-primary)]">{focusedClient.name}</span>
                        <p className="text-[8px] font-mono text-[var(--tac-text-dim)]">RIF: {focusedClient.rif}</p>
                      </div>
                      <HudButton variant="ghost" onClick={() => handleToggleClient(selectedTerminalClientId)}
                        className="text-[8px] px-2 py-1">
                        <X className="w-2.5 h-2.5" />
                      </HudButton>
                    </div>

                    {/* Required grams input */}
                    <div>
                      <label className="text-[8px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.12em] block mb-1">
                        GRAMOS REQUERIDOS <span className="text-[var(--tac-text-dim)]/40">(OPCIONAL)</span>
                      </label>
                      <input type="number" placeholder="EJ: 500"
                        value={clientRequiredGrams[selectedTerminalClientId] || ''}
                        onChange={(e) => setClientRequiredGrams(prev => ({ ...prev, [selectedTerminalClientId]: e.target.value }))}
                        className="w-full bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] px-2 py-1.5 text-[10px] font-mono text-[var(--tac-text-primary)] focus:outline-none focus:border-[var(--tac-accent-cyan)] placeholder:text-[var(--tac-text-dim)]/30"
                      />
                    </div>

                    {/* Assigned lots list */}
                    <div>
                      <span className="text-[8px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.12em] block mb-1">
                        LOTES ASIGNADOS
                      </span>

                      {showNoGoldAlert && (
                        <div className="p-2 border border-[var(--tac-accent-red)]/30 bg-[var(--tac-accent-red)]/5 text-[var(--tac-accent-red)] text-[9px] font-mono flex items-start gap-1.5 mb-2">
                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold uppercase text-[8px] tracking-wider">ALERTA</span>
                            <br />No hay suficiente oro disponible. Faltan <strong className="text-[var(--tac-text-primary)]">{remainingNeeded.toFixed(1)} g</strong>.
                          </div>
                        </div>
                      )}

                      {focusedClientLots.length === 0 ? (
                        <div className="py-6 text-center bg-[var(--tac-bg-primary)] border border-dashed border-[var(--tac-border)] text-[var(--tac-text-dim)]">
                          <span className="text-[10px] font-mono">NINGÚN LOTE ASIGNADO</span>
                        </div>
                      ) : (
                        <div className="bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] divide-y divide-[var(--tac-border)]/50 max-h-40 overflow-y-auto">
                          {focusedClientLots.map(lot => (
                            <div key={lot.id} className="flex items-center justify-between px-2 py-1.5 text-[10px] font-mono">
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-[var(--tac-text-primary)] truncate block">{lot.name}</span>
                                <span className="text-[8px] text-[var(--tac-text-dim)]/50">{lot.processName}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-bold text-[var(--tac-accent-amber)]">{formatWeight(lot.availableWeight)}</span>
                                <button onClick={() => handleRemoveLot(lot.id)}
                                  className="p-0.5 text-[var(--tac-text-dim)] hover:text-[var(--tac-accent-red)] active:scale-90 transition-colors">
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    {requiredGramsVal > 0 && focusedClientLots.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-[8px] font-mono text-[var(--tac-text-dim)] mb-1">
                          <span>PROGRESO</span>
                          <span>{progressPct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1 bg-[var(--tac-bg-primary)] relative overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[var(--tac-accent-amber)] to-[var(--tac-accent-cyan)] transition-all duration-300"
                            style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    <div className="bg-[var(--tac-bg-primary)] p-2 border border-[var(--tac-border)]">
                      <span className="text-[8px] font-mono text-[var(--tac-text-dim)] uppercase tracking-[0.12em] block">MASA ACUMULADA</span>
                      <span className="text-[var(--tac-accent-cyan)] font-bold text-xs font-mono">{formatWeight(focusedClientGrams)}</span>
                      {requiredGramsVal > 0 && (
                        <span className="text-[8px] font-mono text-[var(--tac-text-dim)] ml-1">/ {requiredGramsVal.toFixed(0)} g req</span>
                      )}
                    </div>

                    {/* Destination input */}
                    <div>
                      <label className="text-[8px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.12em] block mb-1">
                        DESTINO <span className="text-[var(--tac-accent-red)]">*</span>
                      </label>
                      <input type="text" placeholder="EJ: REFINERÍA X / ZONA INDUSTRIAL"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] px-2 py-1.5 text-[10px] font-mono text-[var(--tac-text-primary)] focus:outline-none focus:border-[var(--tac-accent-cyan)] placeholder:text-[var(--tac-text-dim)]/30 uppercase"
                      />
                    </div>

                    {/* Dispatch button */}
                    <HudButton
                      variant={canDispatch ? 'primary' : 'ghost'}
                      prefix=">"
                      loading={status === 'processing'}
                      disabled={allAssignedLots.length === 0 || !destination || !canDispatch}
                      onClick={handleDispatch}
                      className="w-full"
                    >
                      {canDispatch ? <ArrowUpRight className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                      {canDispatch
                        ? `DESPACHAR ${allAssignedLots.length > 0 ? `${allAssignedLots.length} LOTE${allAssignedLots.length > 1 ? 'S' : ''}` : ''}`
                        : 'SIN PERMISO — SÓLO OWNER/SUPERADMIN'}
                    </HudButton>
                  </div>
                </TerminalPanel>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Available Lots Panel */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className={`${selectedTerminalClientId && focusedClient ? 'xl:col-span-3' : 'xl:col-span-5'} space-y-4`}
          >
            <TacticalCard title={`LOTES DISPONIBLES — ${allAvailableLots.length} REGISTROS`} accent="cyan">
              {!selectedTerminalClientId ? (
                <div className="flex flex-col items-center justify-center py-12 text-[var(--tac-text-dim)]">
                  <span className="text-[11px] font-mono">SELECCIONE UN CLIENTE PARA VER LOTES DISPONIBLES</span>
                </div>
              ) : unassignedLots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[var(--tac-text-dim)]">
                  <Package className="w-6 h-6 text-[var(--tac-text-dim)]/30 mb-2" />
                  <span className="text-[10px] font-mono">NO HAY LOTES DISPONIBLES</span>
                </div>
              ) : (
                <ScannerTable
                  columns={lotColumns}
                  data={unassignedLots}
                  onRowClick={(row) => handleAssignLot(row.id)}
                  keyExtractor={r => r.id}
                  stickyFirst={true}
                  emptyMessage="NO HAY LOTES DISPONIBLES"
                />
              )}
            </TacticalCard>
          </motion.div>
        </div>
      )}

      {/* MISSION_COMPLETE Overlay */}
      <AnimatePresence>
        {status === 'success' && dispatchResult && (
          <motion.div key="dispatch-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md bg-[var(--tac-bg-secondary)] border border-[var(--tac-accent-green)]/30">
              <div className="p-6 flex flex-col items-center space-y-4 text-center">
                {/* Check icon */}
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }}
                  className="w-14 h-14 border-2 border-[var(--tac-accent-green)]/40 flex items-center justify-center">
                  <Check className="w-7 h-7 text-[var(--tac-accent-green)]" strokeWidth={2.5} />
                </motion.div>

                <span className="text-sm font-mono font-bold text-[var(--tac-accent-green)] tracking-[0.15em]">
                  DESPACHO EXITOSO
                </span>

                {/* Details */}
                <div className="w-full p-3 bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] space-y-1.5 text-[10px] font-mono text-left">
                  <div className="flex justify-between">
                    <span className="text-[var(--tac-text-dim)]">DESTINO:</span>
                    <span className="text-[var(--tac-accent-cyan)] font-bold">{dispatchResult.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--tac-text-dim)]">PESO TOTAL:</span>
                    <span className="text-[var(--tac-accent-amber)] font-bold">{formatWeight(dispatchResult.totalWeight)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--tac-text-dim)]">LOTES:</span>
                    <span className="text-[var(--tac-text-primary)] font-bold">{dispatchResult.lotCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--tac-text-dim)]">CLIENTES:</span>
                    <span className="text-[var(--tac-text-primary)] font-bold">{dispatchResult.clients.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--tac-text-dim)]">REF:</span>
                    <span className="text-[var(--tac-text-dim)] font-mono">{dispatchResult.reference}</span>
                  </div>
                </div>

                {/* Per-client breakdown */}
                <div className="w-full space-y-1.5">
                  {dispatchResult.clients.map(c => (
                    <div key={c.clientRif} className="p-2 bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] text-[9px] font-mono">
                      <div className="flex justify-between text-[var(--tac-text-dim)]">
                        <span className="font-bold text-[var(--tac-text-primary)]">{c.clientName}</span>
                        <span className="text-[var(--tac-accent-amber)]">{formatWeight(c.weightSum)}</span>
                      </div>
                      <span className="text-[8px] text-[var(--tac-text-dim)]">{c.lotCount} lote(s) · RIF: {c.clientRif}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 w-full">
                  <HudButton variant="primary" prefix=">" onClick={() => generateDispatchPDF(dispatchResult)} className="flex-1">
                    <FileDown className="w-3 h-3" /> DESCARGAR PDF
                  </HudButton>
                  <HudButton variant="ghost" onClick={() => { setDispatchResult(null); setStatus('idle'); }} className="flex-1">
                    CERRAR
                  </HudButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {status === 'error' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-3 border text-[10px] font-mono flex items-center gap-2 border-[var(--tac-accent-red)]/30 bg-[var(--tac-accent-red)]/5 text-[var(--tac-accent-red)]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {message}
            <HudButton variant="ghost" onClick={() => setStatus('idle')} className="ml-auto text-[8px] px-2 py-1">
              <X className="w-2.5 h-2.5" />
            </HudButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System status footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="flex items-center gap-3 text-[8px] font-mono text-[var(--tac-text-dim)] border-t border-[var(--tac-border)] pt-3">
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-[var(--tac-accent-green)] animate-pulse" />
          DB ONLINE
        </span>
        <span>{allAvailableLots.length} LOTES DISPONIBLES</span>
        <span>{activeClientIds.length} CLIENTES ACTIVOS</span>
      </motion.div>
    </motion.div>
  );
}
