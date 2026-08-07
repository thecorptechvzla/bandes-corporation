'use client';

import React from 'react';
import { Search, Calendar, Building2, X } from 'lucide-react';

interface HistoryFiltersProps {
  activeTab: 'packings' | 'exits';
  searchQuery: string;
  dateFrom: string;
  dateTo: string;
  selectedProvider: string;
  providers: string[];
  hasAnyFilter: boolean;
  onSearchChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onProviderChange: (v: string) => void;
  onClear: () => void;
}

export function HistoryFilters({
  activeTab, searchQuery, dateFrom, dateTo, selectedProvider,
  providers, hasAnyFilter, onSearchChange, onDateFromChange,
  onDateToChange, onProviderChange, onClear,
}: HistoryFiltersProps) {
  return (
    <div className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider mb-1.5">
            <Search className="w-3 h-3 inline mr-1" />
            Buscar
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder={activeTab === 'packings' ? 'Buscar por proveedor, #packing...' : 'Buscar por destino, proveedor o código...'}
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full bg-[var(--pm-bg-primary)] border border-[var(--pm-border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] placeholder:text-[var(--pm-text-dim)]/50 focus:outline-none focus:border-[var(--pm-accent-gold)]/50 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider mb-1.5">
            <Calendar className="w-3 h-3 inline mr-1" />
            Desde
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => onDateFromChange(e.target.value)}
            className="bg-[var(--pm-bg-primary)] border border-[var(--pm-border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)]/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider mb-1.5">
            <Calendar className="w-3 h-3 inline mr-1" />
            Hasta
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={e => onDateToChange(e.target.value)}
            className="bg-[var(--pm-bg-primary)] border border-[var(--pm-border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)]/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono font-bold text-[var(--pm-text-dim)] uppercase tracking-wider mb-1.5">
            <Building2 className="w-3 h-3 inline mr-1" />
            Proveedor
          </label>
          <select
            value={selectedProvider}
            onChange={e => onProviderChange(e.target.value)}
            className="bg-[var(--pm-bg-primary)] border border-[var(--pm-border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)]/50 transition-colors min-w-[160px]"
          >
            <option value="">Todos</option>
            {providers.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {hasAnyFilter && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold font-mono text-[var(--pm-text-dim)] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
