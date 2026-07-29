'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, SlidersHorizontal, RotateCcw, Search } from 'lucide-react';
import type { Client, ClientRole } from '@/types/api';
import { useClients } from '@/hooks/useClients';

interface DashboardFiltersProps {
  startDate: string;
  endDate: string;
  supplierId: string;
  clientId: string;
  onChange: (filters: { startDate: string; endDate: string; supplierId: string; clientId: string }) => void;
}

type Preset = 'today' | '7d' | 'month' | 'custom';

function todayRange() {
  const d = new Date();
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const e = new Date(s);
  e.setDate(e.getDate() + 1);
  return { start: toDateInput(s), end: toDateInput(e) };
}

function last7dRange() {
  const e = new Date();
  const s = new Date(e);
  s.setDate(s.getDate() - 6);
  return { start: toDateInput(s), end: toDateInput(e) };
}

function thisMonthRange() {
  const now = new Date();
  const s = new Date(now.getFullYear(), now.getMonth(), 1);
  const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toDateInput(s), end: toDateInput(e) };
}

function toDateInput(d: Date) {
  return d.toISOString().split('T')[0];
}

function toISO(d: string) {
  return d ? new Date(d).toISOString() : '';
}

function AutocompleteSelect({
  label,
  items,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  items: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = items.find((i) => i.id === value);

  const filtered = useMemo(
    () =>
      query
        ? items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
        : items,
    [items, query],
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <span className="text-[9px] font-mono font-bold tracking-[0.1em] uppercase text-[var(--pm-text-dim)] block mb-1">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg text-[11px] font-mono text-left transition-colors hover:border-[var(--pm-accent-gold)]/30"
      >
        <Search className="w-3 h-3 text-[var(--pm-text-dim)] shrink-0" />
        <span className={selected ? 'text-[var(--pm-text-primary)]' : 'text-[var(--pm-text-dim)]'}>
          {selected ? selected.name : placeholder}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-[var(--pm-bg-secondary)] border border-[var(--pm-border)] rounded-xl shadow-xl max-h-56 overflow-hidden flex flex-col"
          >
            <div className="p-2 border-b border-[var(--pm-border)]">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full px-2.5 py-1.5 bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg text-[11px] font-mono text-[var(--pm-text-primary)] placeholder:text-[var(--pm-text-dim)]/30 outline-none"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <div className="p-3 text-[10px] text-[var(--pm-text-dim)] text-center">Sin resultados</div>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange(item.id);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full text-left px-3 py-2 text-[11px] font-mono transition-colors hover:bg-white/[0.04] ${
                      item.id === value ? 'text-[var(--pm-accent-gold)]' : 'text-[var(--pm-text-primary)]'
                    }`}
                  >
                    {item.name}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardFilters({
  startDate,
  endDate,
  supplierId,
  clientId,
  onChange,
}: DashboardFiltersProps) {
  const { data: allClients = [] } = useClients();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [preset, setPreset] = useState<Preset>('custom');

  const suppliers = useMemo(
    () => allClients.filter((c) => c.role === 'PROVEEDOR' || c.role === 'AMBOS'),
    [allClients],
  );
  const clients = useMemo(
    () => allClients.filter((c) => c.role === 'CLIENTE' || c.role === 'AMBOS'),
    [allClients],
  );

  function applyPreset(p: Preset) {
    setPreset(p);
    if (p === 'custom') return;
    const range = p === 'today' ? todayRange() : p === '7d' ? last7dRange() : thisMonthRange();
    onChange({ startDate: range.start, endDate: range.end, supplierId, clientId });
  }

  function handleClear() {
    setPreset('custom');
    onChange({ startDate: '', endDate: '', supplierId: '', clientId: '' });
  }

  const hasFilters = startDate || endDate || supplierId || clientId;

  return (
    <>
      {/* Floating pill */}
      <div className="inline-flex flex-wrap items-center justify-center gap-4 bg-[var(--pm-bg-primary)]/40 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] px-6 py-3 rounded-full max-md:rounded-2xl max-md:flex-col w-full md:w-fit mx-auto overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {/* Date inputs */}
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onChange({ startDate: e.target.value, endDate, supplierId, clientId })}
            className="w-24 md:w-28 px-2 py-1 bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg text-[10px] font-mono text-[var(--pm-text-primary)] outline-none transition-colors focus:border-emerald-500/40 [color-scheme:dark]"
          />
          <span className="text-[10px] text-[var(--pm-text-dim)]">—</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onChange({ startDate, endDate: e.target.value, supplierId, clientId })}
            className="w-24 md:w-28 px-2 py-1 bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg text-[10px] font-mono text-[var(--pm-text-primary)] outline-none transition-colors focus:border-emerald-500/40 [color-scheme:dark]"
          />
        </div>

        <div className="w-px h-5 bg-white/[0.06] shrink-0" />

        {/* Presets */}
        <div className="flex gap-1 shrink-0">
          {([
            ['Hoy', 'today'],
            ['7D', '7d'],
            ['Mes', 'month'],
          ] as const).map(([lbl, val]) => (
            <button
              key={val}
              type="button"
              onClick={() => applyPreset(val)}
              className={`px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider rounded-full transition-all ${
                preset === val
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-transparent text-[var(--pm-text-dim)] border border-transparent hover:border-white/[0.06] hover:text-[var(--pm-text-primary)]'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-white/[0.06] shrink-0" />

        {/* Advanced filters toggle */}
        <button
          type="button"
          onClick={() => setAdvancedOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-wider transition-all shrink-0 ${
            supplierId || clientId
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              : 'bg-transparent text-[var(--pm-text-dim)] border border-transparent hover:border-white/[0.06] hover:text-[var(--pm-text-primary)]'
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span className="hidden md:inline">Filtros</span>
        </button>

        {/* Clear */}
        {hasFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 px-2 py-1 text-[9px] font-mono text-[var(--pm-text-dim)] hover:text-emerald-400 transition-all shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Limpiar</span>
          </button>
        )}
      </div>

      {/* Advanced Filters Drawer */}
      <AnimatePresence>
        {advancedOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setAdvancedOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative bg-[#0A0F1C]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-6 w-full max-w-md space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--pm-text-primary)]">
                  Filtros Avanzados
                </h3>
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-4">
                <AutocompleteSelect
                  label="Proveedor"
                  items={suppliers}
                  value={supplierId}
                  onChange={(id) => onChange({ startDate, endDate, supplierId: id, clientId })}
                  placeholder="Todos los proveedores"
                />
                <AutocompleteSelect
                  label="Cliente"
                  items={clients}
                  value={clientId}
                  onChange={(id) => onChange({ startDate, endDate, supplierId, clientId: id })}
                  placeholder="Todos los clientes"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
