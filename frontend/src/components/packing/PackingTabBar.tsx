'use client';

import React from 'react';
import { FileSpreadsheet, ClipboardCheck } from 'lucide-react';

interface PackingTabBarProps {
  activeTab: 'registro' | 'validacion';
  onTabChange: (tab: 'registro' | 'validacion') => void;
  pendingCount: number;
}

export function PackingTabBar({ activeTab, onTabChange, pendingCount }: PackingTabBarProps) {
  return (
    <div className="flex gap-1 glass-panel rounded-xl border border-[var(--pm-border)]/40 p-1 w-fit">
      <button onClick={() => onTabChange('registro')}
        className={`px-5 py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer
          ${activeTab === 'registro' ? 'bg-[var(--pm-accent-emerald)]/15 text-[var(--pm-accent-emerald)] border border-[var(--pm-accent-emerald)]/25 shadow-[0_0_12px_rgba(16,185,129,0.1)]' : 'text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)]'}`}>
        <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1.5" />
        Registro de Packing
      </button>
      <button onClick={() => onTabChange('validacion')}
        className={`px-5 py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer
          ${activeTab === 'validacion' ? 'bg-[var(--pm-accent-emerald)]/15 text-[var(--pm-accent-emerald)] border border-[var(--pm-accent-emerald)]/25 shadow-[0_0_12px_rgba(16,185,129,0.1)]' : 'text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)]'}`}>
        <ClipboardCheck className="w-3.5 h-3.5 inline mr-1.5" />
        Validación de Packing
        {pendingCount > 0 && (
          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[var(--pm-accent-amber)]/15 text-[var(--pm-accent-amber)] text-[9px]">
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  );
}
