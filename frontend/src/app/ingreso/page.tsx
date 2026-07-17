'use client';

import { FormEvent, useEffect, useState } from 'react';
import { WeightInput } from '@/components/ui/weight-input';
import { parseWeight } from '@/lib/utils';

const API = 'http://localhost:3001';

export default function IngresoPage() {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [barNumber, setBarNumber] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [purity, setPurity] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState<'idle' | 'arming' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [calculatedFine, setCalculatedFine] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API}/clients`)
      .then((r) => r.json())
      .then(setClients)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const g = parseWeight(grossWeight);
    const p = parseFloat(purity);
    if (g > 0 && p > 0) {
      setCalculating(true);
      const timer = setTimeout(() => {
        setCalculatedFine(g * (p / 1000));
        setCalculating(false);
      }, 400);
      return () => clearTimeout(timer);
    }
    setCalculatedFine(null);
    setCalculating(false);
  }, [grossWeight, purity]);

  const lowPurity = purity && parseFloat(purity) < 900;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('arming');

    try {
      const res = await fetch(`${API}/bars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barNumber: barNumber.toUpperCase(),
          grossWeight: parseWeight(grossWeight),
          purity: parseFloat(purity),
          clientId,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      setStatus('success');
      setMessage(`BARRA #${barNumber} REGISTRADA`);
      setBarNumber('');
      setGrossWeight('');
      setPurity('');
      setCalculatedFine(null);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'ERROR AL REGISTRAR');
    }
  }

  return (
    <div className="p-6 space-y-6" style={{ animation: 'fade-in 0.6s ease-out' }}>
      <header>
        <h2 className="text-hud-amber text-lg font-bold tracking-wider">INGRESO DE BARRAS</h2>
        <p className="text-hud-muted text-[10px] mt-1">CARGA DE ARMAMENTO // REGISTRO DE ORO</p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        <div className="space-y-1">
          <label className="text-[10px] text-hud-muted tracking-wider">NÚMERO DE BARRA</label>
          <input
            value={barNumber}
            onChange={(e) => setBarNumber(e.target.value.toUpperCase())}
            required
            className="w-full bg-hud-dark border border-hud-border px-3 py-2 text-sm text-hud-text font-mono focus:border-hud-amber focus:outline-none transition-colors uppercase"
            placeholder="Ej: GOLD-001"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-hud-muted tracking-wider">PESO BRUTO (kg)</label>
          <WeightInput
            value={grossWeight}
            onChange={setGrossWeight}
            required
            className="w-full bg-hud-dark border border-hud-border px-3 py-2 text-sm text-hud-text font-mono focus:border-hud-amber focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-hud-muted tracking-wider">FINEZA (‰)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1000"
            value={purity}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '' || (parseFloat(v) >= 0 && parseFloat(v) <= 1000)) {
                setPurity(v);
              }
            }}
            required
            className={`w-full bg-hud-dark border px-3 py-2 text-sm text-hud-text font-mono focus:outline-none transition-colors ${
              lowPurity
                ? 'border-hud-danger animate-[glitch_0.3s_ease-in-out_3]'
                : 'border-hud-border focus:border-hud-amber'
            }`}
            placeholder="999.9"
          />
          {purity && parseFloat(purity) > 1000 && (
            <p className="text-[9px] text-hud-danger">LÍMITE EXCEDIDO (MÁX: 1000‰)</p>
          )}
        </div>

        <div className="bg-hud-surface border border-hud-border p-3 clip-tactical">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-hud-muted tracking-wider">PESO FINO CALCULADO</p>
            {calculating ? (
              <p className="text-[11px] text-hud-amber animate-pulse">CALCULANDO...</p>
            ) : calculatedFine !== null ? (
              <p className="text-sm text-hud-amber font-bold animate-[fade-in_0.3s_ease-out]">
                {calculatedFine.toFixed(4)} kg
              </p>
            ) : (
              <p className="text-[11px] text-hud-muted">—</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-hud-muted tracking-wider">CLIENTE</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="w-full bg-hud-dark border border-hud-border px-3 py-2 text-sm text-hud-text font-mono focus:border-hud-amber focus:outline-none transition-colors"
          >
            <option value="">SELECCIONAR...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={status === 'arming'}
          className="w-full py-3 text-sm font-bold tracking-wider bg-hud-amber/10 border border-hud-amber text-hud-amber hover:bg-hud-amber/20 transition-colors disabled:opacity-50 clip-tactical"
        >
          {status === 'arming' ? 'ARMANDO...' : 'ARMAR CARGA'}
        </button>

        {status === 'success' && (
          <p className="text-[11px] text-hud-success animate-[fade-in_0.3s_ease-out]">
            ✅ {message}
          </p>
        )}
        {status === 'error' && (
          <p className="text-[11px] text-hud-danger animate-[fade-in_0.3s_ease-out]">
            ❌ {message}
          </p>
        )}
      </form>
    </div>
  );
}
