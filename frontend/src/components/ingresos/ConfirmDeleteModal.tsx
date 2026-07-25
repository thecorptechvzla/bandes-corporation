'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, Check, X } from 'lucide-react';
import type { Bar } from '@/types/api';

interface ConfirmDeleteModalProps {
  barId: string | null;
  bars: Bar[];
  onConfirm: (id: string) => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({ barId, bars, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  const target = bars.find(b => b.id === barId);

  return (
    <AnimatePresence>
      {barId && (
        <motion.div key="del-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm glass-panel rounded-2xl overflow-hidden p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle className="w-4 h-4 text-[var(--pm-accent-red)]" />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-red)] uppercase tracking-wider">Eliminar Barra</span>
                <p className="text-xs font-sans font-semibold text-[var(--pm-text-primary)] mt-0.5">{target?.barNumber || ''}</p>
              </div>
            </div>
            <p className="text-xs text-[var(--pm-text-dim)] font-sans leading-relaxed">
              ¿Eliminar definitivamente esta barra del registro? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onCancel}
                className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
              >Cancelar</button>
              <button type="button" onClick={() => barId && onConfirm(barId)}
                className="flex-1 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--pm-accent-red)', border: '1px solid rgba(239,68,68,0.3)' }}
              ><Trash2 className="w-3.5 h-3.5 inline mr-1" /> Eliminar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
