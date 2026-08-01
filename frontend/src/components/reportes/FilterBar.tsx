'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Filter, Search, X } from 'lucide-react';

type StatusFilter = 'ALL' | 'IN_STOCK' | 'COMPLETADO' | 'EXITED';

interface FilterBarProps {
  dateFrom: string;
  dateTo: string;
  filterClientId: string;
  statusFilter: StatusFilter;
  clientSearch: string;
  clientOptions: { id: string; name: string }[];
  clients: { id: string; name: string }[];
  hasActiveFilters: boolean;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onFilterClientIdChange: (v: string) => void;
  onStatusFilterChange: (v: StatusFilter) => void;
  onClientSearchChange: (v: string) => void;
  onClearFilters: () => void;
}

export function FilterBar({
  dateFrom, dateTo, filterClientId, statusFilter, clientSearch,
  clientOptions, clients, hasActiveFilters,
  onDateFromChange, onDateToChange, onFilterClientIdChange,
  onStatusFilterChange, onClientSearchChange, onClearFilters,
}: FilterBarProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
      className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-[var(--pm-accent-gold)]" />
          <span className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider font-bold">Filtros</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-[var(--pm-text-dim)] uppercase">Desde</span>
            <input type="date" value={dateFrom} onChange={e => onDateFromChange(e.target.value)}
              className="w-32 bg-[var(--pm-bg-base)]/60 border border-[var(--pm-border)]/40 rounded-lg px-2 py-1.5 text-[11px] font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)]" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-[var(--pm-text-dim)] uppercase">Hasta</span>
            <input type="date" value={dateTo} onChange={e => onDateToChange(e.target.value)}
              className="w-32 bg-[var(--pm-bg-base)]/60 border border-[var(--pm-border)]/40 rounded-lg px-2 py-1.5 text-[11px] font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)]" />
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center w-40 bg-[var(--pm-bg-base)]/60 border border-[var(--pm-border)]/40 rounded-lg overflow-hidden transition-colors focus-within:border-[var(--pm-accent-gold)]">
            <div className="pl-2 flex items-center justify-center">
              <Search className="w-3 h-3 text-[var(--pm-text-dim)]/50" />
            </div>
            <input type="text" placeholder="Buscar cliente..." value={clientSearch}
              onChange={e => onClientSearchChange(e.target.value)}
              className="flex-1 bg-transparent py-1.5 px-2 outline-none text-[11px] font-mono text-[var(--pm-text-primary)] placeholder:text-[var(--pm-text-dim)]/30" />
          </div>
          {filterClientId && (
            <div className="absolute left-0 top-full mt-1 z-20 w-56 max-h-40 overflow-y-auto bg-[var(--pm-bg-secondary)] border border-[var(--pm-border)] rounded-lg p-1 shadow-xl">
              {clientOptions.map(c => (
                <button key={c.id} onClick={() => { onFilterClientIdChange(c.id); onClientSearchChange(''); }}
                  className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-mono transition-colors active:scale-[0.98]
                    ${filterClientId === c.id ? 'bg-[var(--pm-accent-gold)]/10 text-[var(--pm-accent-gold)]' : 'text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-hover)]'}`}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <select value={statusFilter} onChange={e => onStatusFilterChange(e.target.value as StatusFilter)}
          className="bg-[var(--pm-bg-base)]/60 border border-[var(--pm-border)]/40 rounded-lg px-2 py-1.5 text-[11px] font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)]">
          <option value="ALL">Todos los estados</option>
          <option value="IN_STOCK">VALIDADO</option>
          <option value="COMPLETADO">VALIDADO</option>
          <option value="EXITED">EGRESADO</option>
        </select>

        {hasActiveFilters && (
          <button onClick={onClearFilters}
            className="flex items-center gap-1 px-2 py-1.5 bg-[var(--pm-accent-red)]/10 border border-[var(--pm-accent-red)]/20 text-[var(--pm-accent-red)] rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer">
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      {filterClientId && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] font-mono text-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)]/10 px-2 py-0.5 rounded border border-[var(--pm-accent-gold)]/20">
            Cliente: {clients.find(c => c.id === filterClientId)?.name || filterClientId}
          </span>
          <button onClick={() => onFilterClientIdChange('')}
            className="text-[var(--pm-text-dim)] hover:text-[var(--pm-accent-red)] text-[10px] cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
