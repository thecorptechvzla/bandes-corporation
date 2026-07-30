'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, X } from 'lucide-react';
import { SupplierDirectory } from '@/components/SupplierDirectory';
import type { Bar, Client } from '@/types/api';

function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);
}

const springTransition = { type: 'spring', damping: 25, stiffness: 300 } as const;

interface SupplierDirectoryModalProps {
  isOpen: boolean;
  title: string;
  filterSupplierId?: string | null;
  showSearch?: boolean;
  bars: Bar[];
  clients: Client[];
  onClose: () => void;
  onBarClick: (id: string) => void;
}

export function SupplierDirectoryModal({
  isOpen,
  title,
  filterSupplierId,
  showSearch,
  bars,
  clients,
  onClose,
  onBarClick,
}: SupplierDirectoryModalProps) {
  useBodyScrollLock(isOpen);
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={springTransition}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={springTransition}
            className="relative w-full max-w-4xl h-[80vh] max-h-[800px] rounded-xl border border-[rgba(30,41,59,0.5)] bg-[var(--hud-bg-card)] shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--hud-border)]">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-[var(--hud-accent-gold)]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--hud-text-primary)]">
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-[var(--hud-bg-deepest)]/50 border border-[var(--hud-border)] flex items-center justify-center text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <SupplierDirectory
              bars={bars}
              clients={clients}
              filterSupplierId={filterSupplierId}
              purityFirst
              showSearch={showSearch}
              onBarClick={onBarClick}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
