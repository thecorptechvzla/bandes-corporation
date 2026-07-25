'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

interface DeleteStatusOverlayProps {
  deleteStatus: 'idle' | 'deleting' | 'success';
}

export function DeleteStatusOverlay({ deleteStatus }: DeleteStatusOverlayProps) {
  return (
    <AnimatePresence>
      {deleteStatus !== 'idle' && (
        <motion.div key="del-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
            className="w-full max-w-xs glass-panel rounded-2xl p-8 flex flex-col items-center gap-4"
          >
            {deleteStatus === 'deleting' ? (
              <><div className="w-10 h-10 border-2 border-[var(--pm-accent-red)] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono text-[var(--pm-text-dim)]">Eliminando...</span></>
            ) : (
              <><div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.25)' }}>
                <Check className="w-7 h-7 text-[var(--pm-accent-emerald)]" strokeWidth={2.5} /></div>
                <span className="text-sm font-sans font-bold text-[var(--pm-accent-emerald)]">Barra Eliminada</span></>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
