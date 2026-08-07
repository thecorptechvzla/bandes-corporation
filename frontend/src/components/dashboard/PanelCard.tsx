'use client';

import React from 'react';
import { motion } from 'motion/react';

interface PanelCardProps {
  accent: string;
  title?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function PanelCard({
  accent,
  title,
  headerRight,
  children,
  className,
  delay = 0.15,
}: PanelCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      className={`relative overflow-hidden rounded-xl bg-[#0D1117] border border-white/5 flex flex-col ${className ?? ''}`}
    >
      {/* Neon top accent line */}
      <div
        className="absolute top-0 left-0 w-full h-[3px] pointer-events-none z-10"
        style={{ background: accent }}
      />
      {title != null && (
        <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-2.5 border-b border-[var(--hud-border)]">
          <div className="flex items-center gap-2 min-w-0">{title}</div>
          {headerRight}
        </div>
      )}
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </motion.div>
  );
}
