'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Flame, Boxes, GitMerge, ChevronDown, X, XCircle, AlertTriangle } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Process, Lot, Bar, Client } from '@/types/api';

interface ActiveProcessesMatrixProps {
  activeProcesses: Process[];
  clients: Client[];
  lotBarsMap: Record<string, Bar[]>;
  processLotsMap: Record<string, Lot[]>;
  onOpenRecovery: (lot: Lot) => void;
  onCancelProcess?: (processId: string) => Promise<void>;
  onOpenProcess?: (process: Process) => void;
}

export function ActiveProcessesMatrix({ activeProcesses, lotBarsMap, processLotsMap, onOpenRecovery, onCancelProcess, onOpenProcess }: ActiveProcessesMatrixProps) {
  const [pendingCancel, setPendingCancel] = useState<{ id: string; name: string } | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(['estandar', 'mixtos']));

  const toggleSection = (key: string) => setOpenSections(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const handleConfirmCancel = async () => {
    if (!pendingCancel || !onCancelProcess) return;
    setCancelLoading(true);
    setCancelError('');
    try {
      await onCancelProcess(pendingCancel.id);
      setPendingCancel(null);
    } catch (err: any) {
      setCancelError(err?.response?.data?.message || err?.message || 'Error al cancelar el proceso');
    } finally {
      setCancelLoading(false);
    }
  };

  const estandar = activeProcesses.filter(p => !p.isMixed);
  const mixtos = activeProcesses.filter(p => p.isMixed);

  const renderCard = (proc: Process) => {
    const pLots = processLotsMap[proc.id] || [];
    const allBars = pLots.flatMap(l => lotBarsMap[l.id] || []);
    const totalBars = allBars.length;
    const totalGross = allBars.reduce((s, b) => s + Number(b.grossWeight), 0);
    const lot = pLots[0];
    const mixed = !!proc.isMixed;
    const glow = mixed
      ? 'shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_18px_48px_rgba(168,85,247,0.15)]'
      : 'shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_18px_48px_rgba(0,0,0,0.5)]';

    return (
      <div key={proc.id}
        role="button"
        tabIndex={0}
        onClick={() => onOpenProcess?.(proc)}
        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && onOpenProcess) { e.preventDefault(); onOpenProcess(proc); } }}
        className={`p-6 rounded-lg border border-[var(--pm-border)] border-l-4 transition-all active:scale-95 cursor-pointer bg-[var(--pm-bg-deepest)]/40 ${glow} ${mixed ? 'border-l-purple-500/50' : 'border-l-blue-500/50'}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-[var(--pm-accent-emerald)]">
              {proc.name}
            </span>
            {mixed && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-[var(--pm-accent-emerald)]/15 border border-[var(--pm-accent-emerald)]/30 text-[var(--pm-accent-emerald)]">
                MIXTO
              </span>
            )}
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-[var(--pm-accent-cyan)]/10 border border-[var(--pm-accent-cyan)]/25 text-[var(--pm-accent-cyan)]">
              EN FUNDICIÓN
            </span>
          </div>
          <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">
            {totalBars} barra{totalBars !== 1 ? 's' : ''} · <span className="text-[var(--pm-accent-gold)] font-bold">{formatNumber(totalGross, 2)} g bruto</span>
          </span>
        </div>
        {lot && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-[8px] font-mono text-[var(--pm-text-dim)] opacity-80">
              <span>{lot.name}</span>
              {lot.moldCode && <span>({lot.moldCode})</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onCancelProcess && (
                <button type="button" onClick={e => { e.stopPropagation(); setCancelError(''); setPendingCancel({ id: proc.id, name: proc.name }); }}
                  className="px-2.5 py-1.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                  style={{ background: 'rgba(244,63,94,0.1)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.25)' }}
                ><X className="w-3 h-3" /> Cancelar Proceso</button>
              )}
              <button type="button" onClick={e => { e.stopPropagation(); onOpenRecovery(lot); }}
                className="px-3 py-1.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider transition-all active:scale-90 cursor-pointer"
                style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--pm-accent-emerald)', border: '1px solid rgba(16,185,129,0.2)' }}
              >⚡ Calibrar Colada</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEmpty = (message: string) => (
    <div className="flex flex-col items-center justify-center py-8 text-[var(--pm-text-dim)]">
      <Flame className="w-8 h-8 text-[var(--pm-text-dim)]/20 mb-2" />
      <span className="text-xs font-sans">{message}</span>
    </div>
  );

  const renderSection = (
    key: string,
    title: string,
    icon: React.ReactNode,
    procs: Process[],
    emptyMessage: string,
    containerClass: string,
  ) => {
    const isOpen = openSections.has(key);
    return (
      <div className={containerClass}>
        <button type="button" onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between gap-3 border-b border-neutral-800/50 pb-3 mb-6 cursor-pointer select-none text-left"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)' }}>
              {icon}
            </span>
            <span className="text-xs font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[var(--pm-text-dim)]">{procs.length} proceso{procs.length !== 1 ? 's' : ''}</span>
            <ChevronDown className={`w-4 h-4 text-[var(--pm-text-dim)] transition-transform duration-300 ease-out ${isOpen ? '' : '-rotate-90'}`} />
          </div>
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div key="list"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              {procs.length === 0 ? renderEmpty(emptyMessage) : (
                <div className="space-y-6">{procs.map(renderCard)}</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
      className="premium-card overflow-hidden"
    >
      <div className="px-5 py-3.5 border-b border-[var(--pm-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--pm-accent-emerald)]" />
          <span className="text-xs font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Núcleos Activos</span>
        </div>
        <span className="text-[11px] font-mono text-[var(--pm-text-dim)]">
          {activeProcesses.length} procesos
        </span>
      </div>

      <div className="p-5 overflow-y-auto max-h-[calc(100vh-280px)] v2-scroll">
        {renderSection(
          'estandar',
          'Procesos Estándar',
          <Boxes className="w-3.5 h-3.5 text-[var(--pm-accent-cyan)]" />,
          estandar,
          'Sin procesos estándar activos.',
          'mb-12',
        )}

        {renderSection(
          'mixtos',
          'Procesos Mixtos',
          <GitMerge className="w-3.5 h-3.5 text-[var(--pm-accent-emerald)]" />,
          mixtos,
          'Sin procesos mixtos activos.',
          'mt-2 glass-panel rounded-2xl border border-cyan-500/20 p-5 shadow-[0_4px_16px_rgba(34,211,238,0.06)]',
        )}
      </div>

      <ConfirmDialog
        isOpen={!!pendingCancel}
        onClose={() => { if (!cancelLoading) setPendingCancel(null); }}
        onConfirm={handleConfirmCancel}
        icon={<XCircle className="w-4 h-4 text-rose-500" />}
        title="Cancelar Proceso"
        description="¿Está seguro de cancelar la fundición? Esto liberará todas las barras asociadas al inventario."
        confirmLabel="CONFIRMAR Y LIBERAR"
        cancelLabel="VOLVER"
        variant="danger"
        loading={cancelLoading}
        size="md"
      >
        {pendingCancel && (
          <p className="text-[10px] font-mono text-[var(--pm-text-dim)]">
            Proceso: <span className="text-[var(--pm-text-primary)] font-bold">{pendingCancel.name}</span>
          </p>
        )}
        {cancelError && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg text-[11px] font-mono bg-[var(--pm-accent-red)]/10 border border-[var(--pm-accent-red)]/25 text-[var(--pm-accent-red)]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{cancelError}
          </div>
        )}
      </ConfirmDialog>
    </motion.div>
  );
}
