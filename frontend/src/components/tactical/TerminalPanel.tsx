'use client';

import React, { type ReactNode } from 'react';

interface TerminalPanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
  accent?: 'cyan' | 'green' | 'amber' | 'red';
}

const accentBorders = {
  cyan: 'border-[var(--tac-accent-cyan)]/30',
  green: 'border-[var(--tac-accent-green)]/30',
  amber: 'border-[var(--tac-accent-amber)]/30',
  red: 'border-[var(--tac-accent-red)]/30',
};

export function TerminalPanel({ title, children, className = '', scrollable, accent = 'cyan' }: TerminalPanelProps) {
  return (
    <div className={`bg-[var(--tac-bg-secondary)] border ${accentBorders[accent]} ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--tac-border)] bg-[var(--tac-bg-primary)]/50">
        <span className="w-2 h-2 rounded-full bg-[var(--tac-accent-red)]" />
        <span className="w-2 h-2 rounded-full bg-[var(--tac-accent-amber)]" />
        <span className="w-2 h-2 rounded-full bg-[var(--tac-accent-green)]" />
        <span className="ml-2 text-[10px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.12em]">
          &gt; {title}
        </span>
        <span className="w-1.5 h-4 bg-[var(--tac-accent-cyan)] animate-pulse ml-1" />
      </div>
      <div className={`${scrollable ? 'max-h-64 overflow-y-auto' : ''} p-3`}>
        {children}
      </div>
    </div>
  );
}
