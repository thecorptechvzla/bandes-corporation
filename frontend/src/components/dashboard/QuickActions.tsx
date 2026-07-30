'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Scale, Flame, Warehouse, Inbox,
  ArrowRight, Zap,
} from 'lucide-react';

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
  shortcut: string;
  onClick: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4 }}
      className="hud-card overflow-hidden"
    >
      <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-white/5">
        <Zap className="w-3.5 h-3.5 text-[var(--hud-accent-gold)]" />
        <h3 className="text-[10px] font-bold text-[var(--hud-text-primary)] font-mono tracking-wider uppercase">
          Acciones Rápidas
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2 p-4">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.label}
              onClick={act.onClick}
              className="group relative flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-150 active:scale-[0.97] cursor-pointer text-left"
              style={{
                background: `${act.accent}08`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${act.accent}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `${act.accent}08`;
              }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                style={{ background: `${act.accent}15` }}
              >
                <Icon className="w-4 h-4" style={{ color: act.accent }} />
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="text-[10px] font-mono font-bold block truncate"
                  style={{ color: act.accent }}
                >
                  {act.label}
                </span>
                <span className="text-[8px] font-mono text-[var(--hud-text-dim)] block mt-0.5">
                  {act.shortcut}
                </span>
              </div>
              <ArrowRight
                className="w-3 h-3 text-[var(--hud-text-dim)]/30 group-hover:text-[var(--hud-text-dim)]/60 transition-all -ml-1"
              />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
