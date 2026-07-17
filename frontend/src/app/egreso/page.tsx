'use client';

import { FormEvent, useEffect, useState } from 'react';
import { DeploymentModule } from '@/components/egreso/deployment-module';
import { parseWeight } from '@/lib/utils';

const API = 'http://localhost:3001';

interface Contribution {
  clientId: string;
  weightAported: string;
}

export default function EgresoPage() {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [destination, setDestination] = useState('');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [status, setStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API}/clients`)
      .then((r) => r.json())
      .then(setClients)
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('deploying');

    const payload = {
      destination,
      contributions: contributions.map((c) => ({
        clientId: c.clientId,
        weightAported: parseWeight(c.weightAported),
      })),
    };

    try {
      const res = await fetch(`${API}/material-exits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      setStatus('success');
      setMessage(`EGRESO DESPLEGADO — Destino: ${destination}`);
      setContributions([]);
      setDestination('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'ERROR EN DESPLIEGUE');
    }
  }

  function addContribution() {
    setContributions((prev) => [...prev, { clientId: '', weightAported: '' }]);
  }

  function updateContribution(index: number, field: keyof Contribution, value: string) {
    setContributions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function removeContribution(index: number) {
    setContributions((prev) => prev.filter((_, i) => i !== index));
  }

  const totalWeight = contributions.reduce((s, c) => {
    return s + parseWeight(c.weightAported);
  }, 0);

  return (
    <div className="p-6 space-y-6" style={{ animation: 'fade-in 0.6s ease-out' }}>
      <header>
        <h2 className="text-hud-amber text-lg font-bold tracking-wider">EGRESO // DEPLOYMENT</h2>
        <p className="text-hud-muted text-[10px] mt-1">MULTI-CLIENTE // RETIRO DE ORO</p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <div className="space-y-1">
          <label className="text-[10px] text-hud-muted tracking-wider">DESTINO</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value.toUpperCase())}
            required
            className="w-full bg-hud-dark border border-hud-border px-3 py-2 text-sm text-hud-text font-mono focus:border-hud-amber focus:outline-none transition-colors uppercase"
            placeholder="Nombre del destino / entidad receptora"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-hud-muted tracking-wider">MÓDULOS DE DESPLIEGUE</p>
          </div>

          {contributions.map((contribution, i) => (
            <DeploymentModule
              key={i}
              index={i}
              clients={clients}
              value={contribution}
              onChange={(field, val) => updateContribution(i, field, val)}
              onRemove={() => removeContribution(i)}
            />
          ))}

          {contributions.length === 0 && (
            <p className="text-[10px] text-hud-muted py-4 text-center border border-dashed border-hud-border clip-tactical">
              NO HAY MÓDULOS DE DESPLIEGUE — AÑADE AL MENOS UNO
            </p>
          )}

          <button
            type="button"
            onClick={addContribution}
            className="w-full py-3 text-sm font-bold tracking-wider bg-hud-amber/10 border border-hud-amber text-hud-amber hover:bg-hud-amber/20 transition-colors clip-tactical"
          >
            [+ AÑADIR CLIENTE]
          </button>
        </div>

        <div className="flex items-center justify-between py-2 border-t border-hud-border">
          <p className="text-xs text-hud-muted">PESO TOTAL A RETIRAR:</p>
          <p className="text-lg text-hud-amber font-bold">
            {totalWeight.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
          </p>
        </div>

        <button
          type="submit"
          disabled={status === 'deploying' || contributions.length === 0}
          className="w-full py-3 text-sm font-bold tracking-wider bg-hud-amber/10 border border-hud-amber text-hud-amber hover:bg-hud-amber/20 transition-colors disabled:opacity-50 clip-tactical"
        >
          {status === 'deploying' ? 'DESPLEGANDO...' : 'DESPLEGAR EGRESO'}
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
