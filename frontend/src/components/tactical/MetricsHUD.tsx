'use client';

import React, { type ReactNode } from 'react';

export interface MetricItem {
  key: string;
  label: string;
  value: string;
  sublabel?: string;
  accent?: 'cyan' | 'green' | 'amber' | 'red';
  icon?: ReactNode;
  health?: number;
}

interface MetricsHUDProps {
  items: MetricItem[];
  cols?: 2 | 4;
}

const accentColors = {
  cyan: 'text-[var(--tac-accent-cyan)]',
  green: 'text-[var(--tac-accent-green)]',
  amber: 'text-[var(--tac-accent-amber)]',
  red: 'text-[var(--tac-accent-red)]',
};

const accentBorders = {
  cyan: 'border-[var(--tac-accent-cyan)]/30',
  green: 'border-[var(--tac-accent-green)]/30',
  amber: 'border-[var(--tac-accent-amber)]/30',
  red: 'border-[var(--tac-accent-red)]/30',
};

const healthColors = {
  cyan: 'from-[var(--tac-accent-cyan)] to-[var(--tac-accent-cyan)]/50',
  green: 'from-[var(--tac-accent-green)] to-[var(--tac-accent-green)]/50',
  amber: 'from-[var(--tac-accent-amber)] to-[var(--tac-accent-amber)]/50',
  red: 'from-[var(--tac-accent-red)] to-[var(--tac-accent-red)]/50',
};

export function MetricsHUD({ items, cols = 4 }: MetricsHUDProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${cols === 4 ? 'lg:grid-cols-4' : ''} gap-3`}>
      {items.map(m => {
        const accent = m.accent || 'cyan';
        return (
          <div
            key={m.key}
            className={`relative bg-[var(--tac-bg-secondary)] border ${accentBorders[accent]} p-3`}
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{ borderColor: `var(--tac-${accent}-color, var(--tac-accent-cyan))` }} />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r" style={{ borderColor: `var(--tac-${accent}-color, var(--tac-accent-cyan))` }} />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l" style={{ borderColor: `var(--tac-${accent}-color, var(--tac-accent-cyan))` }} />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{ borderColor: `var(--tac-${accent}-color, var(--tac-accent-cyan))` }} />

            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.12em]">
                {m.label}
              </span>
              {m.icon && <span className={accentColors[accent]}>{m.icon}</span>}
            </div>

            <div className={`text-xl font-mono font-bold tracking-tight ${accentColors[accent]} mb-1`}>
              {m.value}
            </div>

            {m.sublabel && (
              <div className="text-[10px] font-mono text-[var(--tac-text-dim)] border-t border-[var(--tac-border)] pt-1.5 mt-1">
                {m.sublabel}
              </div>
            )}

            {m.health !== undefined && (
              <div className="mt-2 h-1 bg-[var(--tac-bg-primary)] relative overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${healthColors[accent]} transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(0, m.health))}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
