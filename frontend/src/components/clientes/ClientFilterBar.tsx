'use client';

import React from 'react';
import { Search } from 'lucide-react';

type FilterTab = 'TODOS' | 'PROVEEDORES' | 'CLIENTES';

interface ClientFilterBarProps {
  filterTab: FilterTab;
  searchQuery: string;
  onFilterTabChange: (tab: FilterTab) => void;
  onSearchChange: (v: string) => void;
}

export function ClientFilterBar({ filterTab, searchQuery, onFilterTabChange, onSearchChange }: ClientFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-[var(--pm-border)]">
      <div className="flex gap-1 bg-[var(--pm-bg-deepest)] p-0.5 rounded-lg border border-[var(--pm-border)]">
        {(['TODOS', 'PROVEEDORES', 'CLIENTES'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => onFilterTabChange(tab)}
            className={`px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-bold transition-all active:scale-95 cursor-pointer ${
              filterTab === tab
                ? 'text-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)]/10 border border-[var(--pm-accent-gold)]/20'
                : 'text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] border border-transparent'
            }`}
          >
            {tab === 'TODOS' ? 'Todos' : tab === 'CLIENTES' ? 'Clientes' : 'Proveedores'}
          </button>
        ))}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--pm-text-dim)]/40" />
        <input
          type="text"
          placeholder="Buscar por RIF o nombre..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:w-60 bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] placeholder:text-[var(--pm-text-dim)]/30 transition-colors"
        />
      </div>
    </div>
  );
}
