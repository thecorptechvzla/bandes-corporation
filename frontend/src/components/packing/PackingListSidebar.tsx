'use client';

import React from 'react';
import { motion } from 'motion/react';
import { FileSpreadsheet, ClipboardCheck } from 'lucide-react';

interface PackingListSidebarProps {
  pendingPackings: Array<{
    id: string;
    fileName: string;
    clientId?: string;
    client?: { name: string };
    createdAt: string;
    _count?: { bars?: number; pending?: number };
  }>;
  selectedPackingId: string | null;
  onSelectPacking: (id: string) => void;
}

export function PackingListSidebar({ pendingPackings, selectedPackingId, onSelectPacking }: PackingListSidebarProps) {
  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
      className="xl:col-span-2 glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
      <div className="p-4 border-b border-[var(--pm-border)]/20">
        <span className="text-[11px] font-mono font-bold text-[var(--pm-accent-gold)] uppercase tracking-wider flex items-center gap-2">
          <FileSpreadsheet className="w-3.5 h-3.5" /> Packings Pendientes
          {pendingPackings.length > 0 && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-[var(--pm-accent-amber)]/15 text-[var(--pm-accent-amber)] text-[10px]">{pendingPackings.length}</span>
          )}
        </span>
      </div>
      <div className="divide-y divide-[var(--pm-border)]/20 overflow-y-auto max-h-[calc(100vh-320px)] v2-scroll">
        {pendingPackings.length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardCheck className="w-8 h-8 text-[var(--pm-accent-emerald)]/30 mx-auto mb-2" />
            <p className="text-[11px] font-mono text-[var(--pm-text-dim)]">No hay packings pendientes de validación</p>
          </div>
        ) : (
          pendingPackings.map(p => {
            const isSelected = selectedPackingId === p.id;
            return (
              <button key={p.id} onClick={() => onSelectPacking(p.id)}
                className={`w-full text-left px-4 py-3.5 transition-all active:scale-[0.99] cursor-pointer ${isSelected ? 'bg-[var(--pm-accent-gold)]/8 border-l-2 border-[var(--pm-accent-gold)]' : 'hover:bg-[var(--pm-bg-tertiary)]/40 border-l-2 border-transparent'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold text-[var(--pm-text-primary)] truncate">{p.fileName}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isSelected ? 'text-[var(--pm-accent-amber)] bg-[var(--pm-accent-amber)]/10' : 'text-[var(--pm-text-dim)]'}`}>
                    {p._count?.pending ?? '?'} pend.
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[var(--pm-text-dim)]">
                  <span>{p.client?.name || p.clientId?.slice(0, 8)}</span>
                  <span>·</span>
                  <span>{new Date(p.createdAt).toLocaleDateString('es-ES')}</span>
                  <span>·</span>
                  <span>{(p._count?.bars ?? 0)} barras</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
