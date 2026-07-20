'use client';

import React, { useState, useEffect, type ReactNode } from 'react';

interface HudButtonProps {
  variant?: 'primary' | 'ghost' | 'danger';
  prefix?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  type?: 'button' | 'submit';
}

const variants = {
  primary:
    'bg-[var(--tac-bg-tertiary)] border-[var(--tac-accent-cyan)]/50 text-[var(--tac-accent-cyan)] hover:bg-[var(--tac-bg-elevated)] hover:border-[var(--tac-accent-cyan)]/80 shadow-[0_0_8px_rgba(0,229,255,0.04)]',
  ghost:
    'bg-transparent border-[var(--tac-border)] text-[var(--tac-text-dim)] hover:border-[var(--tac-border-light)] hover:text-[var(--tac-text-primary)]',
  danger:
    'bg-[var(--tac-bg-tertiary)] border-[var(--tac-accent-red)]/50 text-[var(--tac-accent-red)] hover:bg-[var(--tac-bg-elevated)] hover:border-[var(--tac-accent-red)]/80',
};

export function HudButton({ variant = 'primary', prefix, loading, disabled, onClick, children, className = '', type = 'button' }: HudButtonProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative overflow-hidden font-mono text-[10px] font-bold uppercase tracking-[0.12em]
        px-3 py-2 border transition-all duration-150
        active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant]}
        ${className}
      `}
    >
      {mounted && (
        <span className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      <span className="relative z-10 flex items-center justify-center gap-1.5">
        {prefix && <span className="text-[var(--tac-text-dim)]/60">{prefix}</span>}
        {loading ? (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {children}
          </span>
        ) : (
          children
        )}
      </span>
    </button>
  );
}
