'use client';

import { FormEvent, useEffect, useState } from 'react';

const API = 'http://localhost:3001';

export default function IngresoPage() {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [barNumber, setBarNumber] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [purity, setPurity] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState<'idle' | 'arming' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API}/clients`)
      .then((r) => r.json())
      .then(setClients)
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('arming');

    try {
      const res = await fetch(`${API}/bars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barNumber,
          grossWeight: parseFloat(grossWeight),
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
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'ERROR AL REGISTRAR');
    }
  }

  return (
    <div className="p-6 space-y-6" style={{ animation: 'fade-in 0.6s ease-out' }}>
      <header>
        <h2 className="text-hud-gold text-lg font-bold tracking-wider">INGRESO DE BARRAS</h2>
        <p className="text-hud-muted text-[10px] mt-1">CARGA DE ARMAMENTO // REGISTRO DE ORO</p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        <div className="space-y-1">
          <label className="text-[10px] text-hud-muted tracking-wider">NÚMERO DE BARRA</label>
          <input
            value={barNumber}
            onChange={(e) => setBarNumber(e.target.value)}
            required
            className="w-full bg-hud-dark border border-hud-border px-3 py-2 text-sm text-hud-text font-mono focus:border-hud-gold focus:outline-none transition-colors"
            placeholder="Ej: GOLD-001"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-hud-muted tracking-wider">PESO BRUTO (kg)</label>
          <input
            type="number"
            step="0.0001"
            value={grossWeight}
            onChange={(e) => setGrossWeight(e.target.value)}
            required
            className="w-full bg-hud-dark border border-hud-border px-3 py-2 text-sm text-hud-text font-mono focus:border-hud-gold focus:outline-none transition-colors"
            placeholder="0.0000"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-hud-muted tracking-wider">FINEZA (‰)</label>
          <input
            type="number"
            step="0.01"
            value={purity}
            onChange={(e) => setPurity(e.target.value)}
            required
            className="w-full bg-hud-dark border border-hud-border px-3 py-2 text-sm text-hud-text font-mono focus:border-hud-gold focus:outline-none transition-colors"
            placeholder="999.9"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-hud-muted tracking-wider">CLIENTE</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="w-full bg-hud-dark border border-hud-border px-3 py-2 text-sm text-hud-text font-mono focus:border-hud-gold focus:outline-none transition-colors"
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
          className="w-full py-3 text-sm font-bold tracking-wider bg-hud-gold/10 border border-hud-gold text-hud-gold hover:bg-hud-gold/20 transition-colors disabled:opacity-50"
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
