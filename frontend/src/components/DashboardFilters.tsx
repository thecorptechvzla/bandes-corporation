'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, SlidersHorizontal, RotateCcw, Search } from 'lucide-react';
import type { Client, ClientRole } from '@/types/api';
import { useClients } from '@/hooks/useClients';

function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);
}

const springTransition = { type: 'spring', damping: 25, stiffness: 300 } as const;

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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
      <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--hud-text-dim)] block mb-1">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2 px-3 py-2 bg-[var(--hud-bg-deepest)] border border-[var(--hud-border)] rounded-lg text-[11px] font-mono text-left transition-colors hover:border-[var(--hud-accent-gold)]/30"
        >
          <Search className="w-3 h-3 text-[var(--hud-text-dim)] shrink-0" />
          <span className={selected ? 'text-[var(--hud-text-primary)]' : 'text-[var(--hud-text-dim)]'}>
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
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-[var(--hud-bg-card)] border border-[var(--hud-border)] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.6)] max-h-56 overflow-hidden flex flex-col"
          >
            <div className="p-2 border-b border-[var(--hud-border)]">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full px-2.5 py-1.5 bg-[var(--hud-bg-deepest)] border border-[var(--hud-border)] rounded-lg text-[11px] font-mono text-[var(--hud-text-primary)] placeholder:text-[var(--hud-text-dim)]/30 outline-none"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <div className="p-3 text-[11px] text-[var(--hud-text-dim)] text-center">Sin resultados</div>
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
                    className={`w-full text-left px-3 py-2 text-[11px] font-mono transition-colors hover:bg-[var(--hud-bg-hover)] ${
                      item.id === value ? 'text-[var(--hud-accent-gold)]' : 'text-[var(--hud-text-primary)]'
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

  useBodyScrollLock(advancedOpen);

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
      <div className="inline-flex flex-wrap items-center justify-center gap-4 bg-[var(--hud-bg-card)]/80 shadow-[0_8px_40px_rgba(0,0,0,0.25)] px-6 py-3 rounded-full max-md:rounded-2xl max-md:flex-col w-full md:w-fit mx-auto overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {/* Date inputs */}
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onChange({ startDate: e.target.value, endDate, supplierId, clientId })}
            className="w-36 md:w-40 min-w-[140px] px-2 pr-10 py-1 bg-[var(--hud-bg-deepest)] border border-[var(--hud-border)] rounded-lg text-[11px] font-mono text-[var(--hud-text-primary)] outline-none transition-colors focus:border-emerald-500/40 [color-scheme:dark]"
          />
          <span className="text-[11px] text-[var(--hud-text-dim)]">—</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onChange({ startDate, endDate: e.target.value, supplierId, clientId })}
            className="w-36 md:w-40 min-w-[140px] px-2 pr-10 py-1 bg-[var(--hud-bg-deepest)] border border-[var(--hud-border)] rounded-lg text-[11px] font-mono text-[var(--hud-text-primary)] outline-none transition-colors focus:border-emerald-500/40 [color-scheme:dark]"
          />
        </div>

        <div className="w-px h-5 bg-[var(--hud-border)] shrink-0" />

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
              className={`px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider rounded-lg transition-all ${
                preset === val
                  ? 'bg-[var(--hud-accent-gold)]/10 text-[var(--hud-accent-gold)] border border-[var(--hud-accent-gold)]/25'
                  : 'bg-transparent text-[var(--hud-text-dim)] border border-transparent hover:border-[var(--hud-border)] hover:text-[var(--hud-text-primary)]'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-[var(--hud-border)] shrink-0" />

        {/* Advanced filters toggle */}
        <button
          type="button"
          onClick={() => setAdvancedOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all shrink-0 ${
            supplierId || clientId
              ? 'bg-[var(--hud-accent-gold)]/10 text-[var(--hud-accent-gold)] border border-[var(--hud-accent-gold)]/25'
              : 'bg-transparent text-[var(--hud-text-dim)] border border-transparent hover:border-[var(--hud-border)] hover:text-[var(--hud-text-primary)]'
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
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-[var(--hud-text-muted)] hover:text-[var(--hud-accent-gold)] transition-all shrink-0"
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
            transition={springTransition}
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
              transition={springTransition}
              className="relative bg-[var(--hud-bg-card)]/95 border border-[var(--hud-border)] rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.6)] p-6 w-full max-w-md space-y-5 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--hud-text-primary)]">
                  Filtros Avanzados
                </h3>
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(false)}
                  className="w-7 h-7 rounded-lg bg-[var(--hud-bg-hover)] border border-[var(--hud-border)] flex items-center justify-center text-[var(--hud-text-dim)] hover:text-[var(--hud-text-primary)] transition-colors"
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
