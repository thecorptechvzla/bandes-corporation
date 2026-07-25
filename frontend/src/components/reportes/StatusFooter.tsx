'use client';

import React from 'react';
import { motion } from 'motion/react';
import { HardDrive } from 'lucide-react';
import { formatWeight } from '@/lib/format';

interface StatusFooterProps {
  activeClientCount: number;
  totalFA: number;
  barCount: number;
}

export function StatusFooter({ activeClientCount, totalFA, barCount }: StatusFooterProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      className="flex items-center gap-4 text-[9px] font-mono text-[var(--pm-text-dim)]/70 border-t border-[var(--pm-border)]/20 pt-3">
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--pm-accent-emerald)] shadow-[0_0_6px_var(--pm-accent-emerald)]" />
        DB ONLINE
      </span>
      <HardDrive className="w-3 h-3" />
      <span>{activeClientCount} clientes activos</span>
      <span className="text-[var(--pm-accent-gold)]">{formatWeight(totalFA)} Peso Fino total</span>
      <span>{barCount} barras registradas</span>
    </motion.div>
  );
}
