'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import type { Process, Lot } from '@/types/api';
import type { Client } from '@/types/api';

interface CompletedProcessesSectionProps {
  completedProcesses: Process[];
  groupedCompleted: Record<string, Process[]>;
  processLotsMap: Record<string, Lot[]>;
  clients: Client[];
  isExpanded: boolean;
  onToggle: () => void;
  onViewDetail: (id: string) => void;
}

export function CompletedProcessesSection({
  completedProcesses, groupedCompleted, processLotsMap, clients,
  isExpanded, onToggle, onViewDetail,
}: CompletedProcessesSectionProps) {
  if (completedProcesses.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}
      className="premium-card overflow-hidden"
    >
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 active:scale-[0.99] transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[var(--pm-accent-emerald)]" />
          <span className="text-xs font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Completados</span>
          <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">{completedProcesses.length} procesos</span>
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-[var(--pm-text-dim)]" /> : <ChevronRight className="w-4 h-4 text-[var(--pm-text-dim)]" />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="divide-y divide-[var(--pm-border)] border-t border-[var(--pm-border)]">
              {Object.entries(groupedCompleted).map(([cId, procs]) => (
                <div key={cId} className="px-5 py-3">
                  <span className="text-[10px] font-mono font-semibold text-[var(--pm-text-primary)] block mb-2">
                    {clients.find(c => c.id === cId)?.name || cId}
                  </span>
                  {procs.map(proc => {
                    const pLots = processLotsMap[proc.id] || [];
                    return (
                      <div key={proc.id} onClick={() => onViewDetail(proc.id)}
                        className="flex items-center justify-between py-1.5 px-1 text-[10px] font-mono cursor-pointer active:scale-[0.99] transition-all rounded-lg hover:bg-[var(--pm-bg-tertiary)]/40 group"
                      >
                        <span className="text-[var(--pm-text-dim)]">{proc.name}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-[var(--pm-accent-emerald)]">
                            {pLots.filter(l => l.recovered).reduce((s, l) => s + Number(l.recovered), 0).toFixed(2)} g recuperados
                          </span>
                          <Eye className="w-3.5 h-3.5 text-[var(--pm-text-dim)]/40 group-hover:text-[var(--pm-accent-gold)] transition-colors" />
                        </span>
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
