'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Plus, Weight, Microscope, AlertTriangle, Zap } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Client } from '@/types/api';

interface BarRegistrationFormProps {
  clients: Client[];
  clientId: string;
  onClientIdChange: (v: string) => void;
  barNumber: string;
  onBarNumberChange: (v: string) => void;
  grossWeight: string;
  onGrossWeightChange: (v: string) => void;
  purity: string;
  onPurityChange: (v: string) => void;
  leyAg: string;
  onLeyAgChange: (v: string) => void;
  formError: string;
  weightWarning: boolean;
  liveFA: number;
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}

export function BarRegistrationForm({
  clients, clientId, onClientIdChange, barNumber, onBarNumberChange,
  grossWeight, onGrossWeightChange, purity, onPurityChange, leyAg, onLeyAgChange,
  formError, weightWarning, liveFA, isPending, onSubmit, onReset,
}: BarRegistrationFormProps) {
  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
      className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden">
      <div className="px-5 pt-5 pb-2 border-b border-[var(--pm-border)]/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Plus className="w-3.5 h-3.5 text-[var(--pm-accent-emerald)]" />
          </div>
          <span className="text-xs font-mono font-bold text-[var(--pm-accent-emerald)] uppercase tracking-wider">Registro Individual</span>
        </div>
      </div>
      <form onSubmit={onSubmit} className="p-5 space-y-4">
        <div className="space-y-1">
          <label className="text-[11px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Proveedor</label>
          <select value={clientId} onChange={e => onClientIdChange(e.target.value)}
            className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-sans text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors cursor-pointer">
            <option value="" disabled>Seleccionar...</option>
            {clients.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Código de Barra</label>
            <input type="text" placeholder="Ej: BARRA-A001" value={barNumber}
              onChange={e => onBarNumberChange(e.target.value.toUpperCase())}
              className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors uppercase placeholder:text-[var(--pm-text-dim)]/30" required />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
              <Weight className="w-3 h-3" /> Peso Bruto
            </label>
            <input type="number" step="any" placeholder="0.00" value={grossWeight}
              onChange={e => onGrossWeightChange(e.target.value)}
              className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30" required />
            {weightWarning && (
              <span className="text-[10px] font-mono text-[var(--pm-accent-amber)] flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" /> Peso superior a 24,900 g
              </span>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
              <Microscope className="w-3 h-3" /> Ley Au (‰)
            </label>
            <input type="number" min="0" max="1000" step="0.1" placeholder="999.9" value={purity}
              onChange={e => onPurityChange(e.target.value)}
              className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30" required />
          </div>
        </div>
        {(parseFloat(grossWeight) > 0 && parseFloat(purity) > 0) && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border" style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.2)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-[var(--pm-accent-emerald)]" />
              <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-emerald)] uppercase tracking-wider">Cálculo en Tiempo Real</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-mono text-[var(--pm-text-dim)] block">Peso Fino</span>
              <span className="text-sm font-mono font-bold text-[var(--pm-text-primary)]">{formatNumber(liveFA, 2)} g</span>
            </div>
          </motion.div>
        )}
        {formError && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-mono bg-[var(--pm-accent-red)]/10 border border-[var(--pm-accent-red)]/25 text-[var(--pm-accent-red)]">
            <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onReset}
            className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer">Limpiar</button>
          <button type="submit" disabled={isPending}
            className="flex-[2] py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))', color: 'var(--pm-accent-emerald)', border: '1px solid rgba(16,185,129,0.3)' }}>
            {isPending ? (
              <><LoadingSpinner size="sm" className="text-[var(--pm-accent-emerald)]" /> Registrando...</>
            ) : (<><Plus className="w-3.5 h-3.5" /> Registrar Barra</>)}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
