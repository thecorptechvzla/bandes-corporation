'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  User, Thermometer, Play, Sparkles, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Bar, Client } from '@/types/api';

interface SmeltingConfigFormProps {
  clients: Client[];
  clientFilteredBars: Bar[];
  selectedClientId: string;
  selectedBarIds: string[];
  selectedMetrics: { count: number; gross: number; fa: number };
  operator: string;
  moldCode: string;
  castingTemp: string;
  formError: string;
  formSuccess: string;
  creating: boolean;
  onOperatorChange: (v: string) => void;
  onMoldCodeChange: (v: string) => void;
  onCastingTempChange: (v: string) => void;
  onClientChange: (cId: string) => void;
  onBarToggle: (id: string) => void;
  onSelectAllBars: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SmeltingConfigForm({
  clients, clientFilteredBars, selectedClientId, selectedBarIds, selectedMetrics,
  operator, moldCode, castingTemp, formError, formSuccess, creating,
  onOperatorChange, onMoldCodeChange, onCastingTempChange, onClientChange,
  onBarToggle, onSelectAllBars, onSubmit,
}: SmeltingConfigFormProps) {
  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
      className="premium-card overflow-hidden"
    >
      <div className="px-5 pt-5 pb-2 border-b border-[var(--pm-border)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Play className="w-3.5 h-3.5 text-[var(--pm-accent-amber)]" />
          </div>
          <span className="text-xs font-mono font-bold text-[var(--pm-accent-amber)] uppercase tracking-wider">Configurar Fundición</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3" /> Operador
            </label>
            <input type="text" placeholder="Nombre del operador" value={operator}
              onChange={e => onOperatorChange(e.target.value)}
              className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-sans text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-amber)] transition-colors placeholder:text-[var(--pm-text-dim)]/30"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Crisol / Molde</label>
            <input type="text" placeholder="Ej: CR-001" value={moldCode}
              onChange={e => onMoldCodeChange(e.target.value.toUpperCase())}
              className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-amber)] transition-colors uppercase placeholder:text-[var(--pm-text-dim)]/30"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
              <Thermometer className="w-3 h-3" /> Temp. Colada (°C)
            </label>
            <input type="number" min="800" max="1400" value={castingTemp}
              onChange={e => onCastingTempChange(e.target.value)}
              className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-amber)] transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Cliente</label>
            <select value={selectedClientId} onChange={e => onClientChange(e.target.value)}
              className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-sans text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-amber)] transition-colors cursor-pointer"
            >
              <option value="">Seleccionar proveedor</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bar selection */}
        {selectedClientId && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">
                Barras Disponibles ({clientFilteredBars.length})
              </span>
              <button type="button" onClick={onSelectAllBars}
                className="text-[9px] font-mono text-[var(--pm-accent-amber)] hover:text-[var(--pm-accent-gold)] active:scale-95 transition-all cursor-pointer"
              >
                {selectedBarIds.length === clientFilteredBars.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
            </div>
            <div className="max-h-52 overflow-y-auto v2-scroll border border-[var(--pm-border)] rounded-lg">
              <table className="premium-table w-full">
                <thead>
                  <tr>
                    <th className="w-8 text-center">
                      <input type="checkbox" checked={selectedBarIds.length === clientFilteredBars.length && clientFilteredBars.length > 0}
                        onChange={onSelectAllBars}
                        className="accent-[var(--pm-accent-amber)] cursor-pointer"
                      />
                    </th>
                    <th>Código</th>
                    <th className="text-right">Peso Bruto (g)</th>
                    <th className="text-right">Peso Fino (g)</th>
                    <th className="text-right">Ley Au (‰)</th>
                  </tr>
                </thead>
                <tbody>
                  {clientFilteredBars.map((bar, idx) => (
                    <tr key={bar.id} onClick={() => onBarToggle(bar.id)}
                      className={`odd:bg-[var(--pm-bg-deepest)]/30 hover:bg-[var(--pm-bg-tertiary)]/50 transition-all cursor-pointer ${selectedBarIds.includes(bar.id) ? 'bg-[var(--pm-accent-amber)]/5' : ''}`}
                    >
                      <td className="text-center">
                        <input type="checkbox" checked={selectedBarIds.includes(bar.id)}
                          onChange={() => onBarToggle(bar.id)}
                          className="accent-[var(--pm-accent-amber)] cursor-pointer"
                        />
                      </td>
                      <td className="font-mono font-bold text-[var(--pm-accent-gold)] tracking-wider text-[11px]">{bar.barNumber}</td>
                      <td className="text-right font-mono text-[var(--pm-text-primary)]">{formatNumber(Number(bar.grossWeight), 2)}</td>
                      <td className="text-right font-mono text-[var(--pm-text-primary)]">{formatNumber(Number(bar.fineWeight), 4)}</td>
                      <td className="text-right font-mono text-[var(--pm-text-dim)]">{bar.purity}‰</td>
                    </tr>
                  ))}
                  {clientFilteredBars.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-6 text-[10px] text-[var(--pm-text-dim)] font-mono italic">Sin barras disponibles</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedMetrics.count > 0 && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 px-3 py-2 rounded-lg border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-[10px] font-mono"
              >
                <span className="text-[var(--pm-text-dim)]">{selectedMetrics.count} barras</span>
                <span className="text-[var(--pm-accent-amber)]">Peso Bruto: {formatNumber(selectedMetrics.gross, 2)} g</span>
                <span className="text-[var(--pm-accent-gold)]">Peso Fino: {formatNumber(selectedMetrics.fa, 4)} g</span>
              </motion.div>
            )}
          </div>
        )}

        {formError && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-mono bg-[var(--pm-accent-red)]/10 border border-[var(--pm-accent-red)]/25 text-[var(--pm-accent-red)]">
            <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
          </div>
        )}
        {formSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-mono bg-[var(--pm-accent-emerald)]/10 border border-[var(--pm-accent-emerald)]/25 text-[var(--pm-accent-emerald)]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />{formSuccess}
          </div>
        )}

        <button type="submit" disabled={creating || selectedBarIds.length === 0}
          className="w-full py-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.1))',
            color: 'var(--pm-accent-amber)', border: '1px solid rgba(245,158,11,0.3)',
          }}
        >
          {creating ? (
            <><LoadingSpinner size="sm" className="text-[var(--pm-accent-amber)]" /> Iniciando Fundición...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Iniciar Fundición ({selectedBarIds.length} barras)</>
          )}
        </button>
      </form>
    </motion.div>
  );
}
