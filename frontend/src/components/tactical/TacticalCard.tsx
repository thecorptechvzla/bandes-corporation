'use client';

import React, { type ReactNode } from 'react';

interface TacticalCardProps {
  title?: string;
  icon?: ReactNode;
  accent?: 'cyan' | 'green' | 'amber' | 'red';
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const accentBorders = {
  cyan: 'border-[var(--tac-accent-cyan)]/30 hover:border-[var(--tac-accent-cyan)]/60',
  green: 'border-[var(--tac-accent-green)]/30 hover:border-[var(--tac-accent-green)]/60',
  amber: 'border-[var(--tac-accent-amber)]/30 hover:border-[var(--tac-accent-amber)]/60',
  red: 'border-[var(--tac-accent-red)]/30 hover:border-[var(--tac-accent-red)]/60',
};

const accentGlows = {
  cyan: 'shadow-[0_0_12px_rgba(0,229,255,0.06)]',
  green: 'shadow-[0_0_12px_rgba(57,255,20,0.06)]',
  amber: 'shadow-[0_0_12px_rgba(255,176,0,0.06)]',
  red: 'shadow-[0_0_12px_rgba(255,51,85,0.06)]',
};

export function TacticalCard({ title, icon, accent = 'cyan', children, className = '', onClick, hoverable }: TacticalCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative bg-[var(--tac-bg-secondary)] border ${accentBorders[accent]} ${accentGlows[accent]}
        ${hoverable ? 'cursor-pointer transition-all duration-200 active:scale-[0.98] hover:bg-[var(--tac-bg-tertiary)]' : ''}
        ${className}
      `}
    >
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[var(--tac-accent-cyan)]/40 pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[var(--tac-accent-cyan)]/40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[var(--tac-accent-cyan)]/40 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[var(--tac-accent-cyan)]/40 pointer-events-none" />

      {title && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--tac-border)]">
          {icon && <span className="text-[var(--tac-accent-cyan)]">{icon}</span>}
          <span className="text-[10px] font-mono font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.15em]">
            {title}
          </span>
        </div>
      )}

      <div className="p-3">
        {children}
      </div>
    </div>
  );
}
