'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Plus, Weight, Microscope, AlertTriangle, Zap } from 'lucide-react';
import { formatNumber } from '@/lib/format';

interface BarRegistrationFormProps {
  clients: { id: string; name: string }[];
  clientId: string;
  isPending: boolean;
  onClientIdChange: (v: string) => void;
  onSubmit: (data: { barNumber: string; grossWeight: number; purity: number; clientId: string; leyAg?: number }) => void;
}

export function BarRegistrationForm({ clients, clientId, isPending, onClientIdChange, onSubmit }: BarRegistrationFormProps) {
  const [barNumber, setBarNumber] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [purity, setPurity] = useState('');
  const [leyAg, setLeyAg] = useState('');
  const [formError, setFormError] = useState('');

  const liveFA = useMemo(() => {
    const w = parseFloat(grossWeight);
    if (isNaN(w)) return 0;
    const p = parseFloat(purity);
    if (isNaN(p)) return 0;
    return w * (p / 1000);
  }, [grossWeight, purity]);

  const weightWarning = useMemo(() => {
    const w = parseFloat(grossWeight);
    if (isNaN(w)) return false;
    return w > 24900;
  }, [grossWeight]);

  const resetForm = () => {
    setBarNumber(''); setGrossWeight(''); setPurity(''); setLeyAg('');
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!barNumber.trim() || !grossWeight || !purity || !clientId) {
      setFormError('Complete todos los campos obligatorios.');
      return;
    }
    const g = parseFloat(grossWeight);
    if (isNaN(g) || g <= 0) { setFormError('Peso bruto debe ser un número positivo.'); return; }
    const p = parseFloat(purity);
    if (isNaN(p) || p < 0 || p > 1000) { setFormError('Ley Au debe estar entre 0 y 1000‰.'); return; }
    const ag = parseFloat(leyAg) || 0;

    onSubmit({
      barNumber: barNumber.toUpperCase().trim(),
      grossWeight: g,
      purity: p,
      clientId,
      leyAg: ag || undefined,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
      className="premium-card overflow-hidden"
    >
      <div className="px-5 pt-5 pb-2 border-b border-[var(--pm-border)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <Plus className="w-3.5 h-3.5 text-[var(--pm-accent-gold)]" />
          </div>
          <span className="text-xs font-mono font-bold text-[var(--pm-accent-gold)] uppercase tracking-wider">Registro Individual</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Client selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Proveedor</label>
          <select value={clientId} onChange={e => onClientIdChange(e.target.value)}
            className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-sans text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors cursor-pointer"
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Bar code */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">Código de Barra</label>
            <input type="text" placeholder="Ej: BARRA-A001" value={barNumber}
              onChange={e => setBarNumber(e.target.value.toUpperCase())}
              className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors uppercase placeholder:text-[var(--pm-text-dim)]/30"
              required
            />
          </div>

          {/* Gross weight */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
              <Weight className="w-3 h-3" /> Peso Bruto
            </label>
              <input type="number" step="any" placeholder="0.00" value={grossWeight}
                onChange={e => setGrossWeight(e.target.value)}
                className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30"
                required
              />
            {weightWarning && (
              <span className="text-[9px] font-mono text-[var(--pm-accent-amber)] flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" /> Peso superior a 24,900 g
              </span>
            )}
          </div>

          {/* Purity */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
              <Microscope className="w-3 h-3" /> Ley Au (‰)
            </label>
            <input type="number" min="0" max="1000" step="0.1" placeholder="999.9" value={purity}
              onChange={e => setPurity(e.target.value)}
              className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30"
              required
            />
          </div>
        </div>

        {/* Ley Ag */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
            <Microscope className="w-3 h-3" /> Ley Ag (‰)
          </label>
          <input type="number" min="0" max="1000" step="0.1" placeholder="0.0" value={leyAg}
            onChange={e => setLeyAg(e.target.value)}
            className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30"
          />
        </div>

        {/* Live calculation box */}
        {(parseFloat(grossWeight) > 0 && parseFloat(purity) > 0) && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border" style={{ background: 'rgba(212,175,55,0.06)', borderColor: 'rgba(212,175,55,0.2)' }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3.5 h-3.5 text-[var(--pm-accent-gold)]" />
              <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-gold)] uppercase tracking-wider">Cálculo en Tiempo Real</span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-center">
              <div>
                <span className="text-[9px] font-mono text-[var(--pm-text-dim)] block">Peso Fino</span>
                <span className="text-sm font-mono font-bold text-[var(--pm-text-primary)]">{formatNumber(liveFA, 4)} g</span>
              </div>
            </div>
          </motion.div>
        )}

        {formError && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-xs font-mono bg-[var(--pm-accent-red)]/10 border border-[var(--pm-accent-red)]/25 text-[var(--pm-accent-red)]">
            <AlertTriangle className="w-4 h-4 shrink-0" />{formError}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={resetForm}
            className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          >Limpiar</button>
          <button type="submit" disabled={isPending}
            className="flex-[2] py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))',
              color: 'var(--pm-accent-gold)', border: '1px solid rgba(212,175,55,0.3)',
            }}
          >
            {isPending ? (
              <><div className="w-3.5 h-3.5 border-2 border-[var(--pm-accent-gold)] border-t-transparent rounded-full animate-spin" /> Registrando...</>
            ) : (
              <><Plus className="w-3.5 h-3.5" /> Registrar Barra</>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
