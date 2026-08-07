'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, ChevronDown, ChevronRight, Eye, CircleDot, CheckCircle2, XCircle } from 'lucide-react';
import type { Process, Lot } from '@/types/api';
import type { Client } from '@/types/api';
import { formatNumber } from '@/lib/format';

const statusStyles: Record<Process['status'], { cls: string; bg: string; border: string; Icon: React.FC<{ className?: string; style?: React.CSSProperties }>; label: string }> = {
  OPEN: { cls: 'var(--pm-accent-cyan)', bg: 'rgba(34,211,238,0.10)', border: 'rgba(34,211,238,0.25)', Icon: CircleDot, label: 'EN CURSO' },
  CLOSED: { cls: 'var(--pm-accent-emerald)', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)', Icon: CheckCircle2, label: 'COMPLETADO' },
  CANCELLED: { cls: '#fb7185', bg: 'rgba(244,63,94,0.10)', border: 'rgba(244,63,94,0.25)', Icon: XCircle, label: 'CANCELADO' },
};

function StatusBadge({ status }: { status: Process['status'] }) {
  const st = statusStyles[status];
  const Icon = st.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit"
      style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.cls }}
    >
      <Icon className="w-2.5 h-2.5" style={{ color: 'inherit' }} />
      {st.label}
    </span>
  );
}

interface HistoryProcessesSectionProps {
  processes: Process[];
  groupedProcesses: Record<string, Process[]>;
  processLotsMap: Record<string, Lot[]>;
  clients: Client[];
  isExpanded: boolean;
  onToggle: () => void;
  onViewDetail: (id: string) => void;
}

export function CompletedProcessesSection({
  processes, groupedProcesses, processLotsMap, clients,
  isExpanded, onToggle, onViewDetail,
}: HistoryProcessesSectionProps) {
  if (processes.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}
      className="premium-card overflow-hidden"
    >
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 active:scale-[0.99] transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--pm-accent-emerald)]" />
          <span className="text-xs font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Historial de Procesos</span>
          <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">{processes.length} procesos</span>
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-[var(--pm-text-dim)]" /> : <ChevronRight className="w-4 h-4 text-[var(--pm-text-dim)]" />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="divide-y divide-[var(--pm-border)] border-t border-[var(--pm-border)]">
              {Object.entries(groupedProcesses).map(([cId, procs]) => (
                <div key={cId} className="px-5 py-3">
                  <span className="text-[11px] font-mono font-semibold text-[var(--pm-text-primary)] block mb-2">
                    {clients.find(c => c.id === cId)?.name || cId}
                  </span>
                  {procs.map(proc => {
                    const pLots = processLotsMap[proc.id] || [];
                    const firstLot = pLots[0];
                    const totalRecovered = pLots
                      .filter(l => l.recovered)
                      .reduce((s, l) => s + Number(l.recovered), 0);
                    return (
                      <div key={proc.id} onClick={() => onViewDetail(proc.id)}
                        className="grid grid-cols-[14%_20%_14%_20%_18%_14%] items-center py-2 px-1 text-[11px] font-mono cursor-pointer active:scale-[0.99] transition-all rounded-lg hover:bg-[var(--pm-bg-tertiary)]/40 group"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-[var(--pm-text-dim)] font-bold truncate">{proc.name}</span>
                        </div>
                        <StatusBadge status={proc.status} />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[var(--pm-text-dim)]/70 uppercase tracking-wider">Operador</span>
                          <span className="text-xs font-mono text-[var(--pm-text-primary)] truncate">
                            {firstLot?.operator || '—'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[var(--pm-text-dim)]/70 uppercase tracking-wider">Recuperado</span>
                          <span className="text-xs font-mono font-bold text-[var(--pm-accent-emerald)]">
                            {formatNumber(totalRecovered, 2)} g
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[var(--pm-text-dim)]/70 uppercase tracking-wider">Fecha</span>
                          <span className="text-xs font-mono text-[var(--pm-text-primary)]">
                            {new Date(proc.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-end">
                          <Eye className="w-3.5 h-3.5 text-[var(--pm-text-dim)]/40 group-hover:text-[var(--pm-accent-gold)] transition-colors shrink-0" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}