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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[var(--pm-border)]/60" style={{ background: 'rgba(15,17,26,0.4)' }}>
      <div className="flex gap-0.5 p-0.5 rounded-xl border border-[var(--pm-border)]/60" style={{ background: 'rgba(15,17,26,0.5)' }}>
        {(['TODOS', 'PROVEEDORES', 'CLIENTES'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => onFilterTabChange(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider font-bold transition-all active:scale-95 cursor-pointer ${
              filterTab === tab
                ? 'text-[var(--pm-accent-gold)] shadow-[0_0_12px_rgba(212,175,55,0.08)]'
                : 'text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)]'
            }`}
            style={filterTab === tab ? { background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' } : { border: '1px solid transparent' }}
          >
            {tab === 'TODOS' ? 'Todos' : tab === 'CLIENTES' ? 'Clientes' : 'Proveedores'}
          </button>
        ))}
      </div>
      <div className="flex items-center w-full sm:w-60 bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg overflow-hidden transition-colors focus-within:border-[var(--pm-accent-gold)]">
        <div className="pl-3 flex items-center justify-center">
          <Search className="w-3.5 h-3.5 text-[var(--pm-text-dim)]/40" />
        </div>
        <input
          type="text"
          placeholder="Buscar por RIF o nombre..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent py-2 px-3 outline-none text-xs font-mono text-[var(--pm-text-primary)] placeholder:text-[var(--pm-text-dim)]/30"
        />
      </div>
    </div>
  );
}
