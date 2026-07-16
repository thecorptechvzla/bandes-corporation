'use client';

import { useEffect, useState } from 'react';

const API = 'http://localhost:3001';

export default function ReportesPage() {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [loading, setLoading] = useState<'idle' | 'client' | 'company'>('idle');

  useEffect(() => {
    fetch(`${API}/clients`)
      .then((r) => r.json())
      .then(setClients)
      .catch(() => {});
  }, []);

  function downloadClientReport() {
    if (!selectedClient) return;
    setLoading('client');
    const link = document.createElement('a');
    link.href = `${API}/reports/client/${selectedClient}`;
    link.target = '_blank';
    link.onload = () => setLoading('idle');
    link.click();
    setTimeout(() => setLoading('idle'), 2000);
  }

  function downloadCompanyReport() {
    setLoading('company');
    const link = document.createElement('a');
    link.href = `${API}/reports/company`;
    link.target = '_blank';
    link.onload = () => setLoading('idle');
    link.click();
    setTimeout(() => setLoading('idle'), 2000);
  }

  return (
    <div className="p-6 space-y-6" style={{ animation: 'fade-in 0.6s ease-out' }}>
      <header>
        <h2 className="text-hud-gold text-lg font-bold tracking-wider">PANEL DE REPORTES</h2>
        <p className="text-hud-muted text-[10px] mt-1">EXTRACCIÓN DE DATOS // TRAZABILIDAD</p>
      </header>

      <div className="grid grid-cols-2 gap-6 max-w-2xl">
        <div className="bg-hud-surface rounded p-5 neon-border-gold space-y-4">
          <p className="text-xs text-hud-gold font-bold tracking-wider">
            REPORTE 01 // CLIENTE
          </p>
          <p className="text-[10px] text-hud-muted">
            Peso recibido, peso entregado y saldo actual por cliente.
          </p>
          <div className="space-y-1">
            <label className="text-[9px] text-hud-muted">CLIENTE</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full bg-hud-dark border border-hud-border px-2 py-1.5 text-xs text-hud-text font-mono focus:border-hud-gold focus:outline-none"
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
            onClick={downloadClientReport}
            disabled={!selectedClient || loading === 'client'}
            className="w-full py-2 text-xs font-bold tracking-wider bg-hud-gold/10 border border-hud-gold text-hud-gold hover:bg-hud-gold/20 transition-colors disabled:opacity-50"
          >
            {loading === 'client' ? 'GENERANDO...' : 'DESCARGAR PDF'}
          </button>
        </div>

        <div className="bg-hud-surface rounded p-5 neon-border-blue space-y-4">
          <p className="text-xs text-hud-blue font-bold tracking-wider">
            REPORTE 02 // EMPRESA
          </p>
          <p className="text-[10px] text-hud-muted">
            Trazabilidad completa de egresos con desglose por cliente y barras afectadas.
          </p>
          <button
            onClick={downloadCompanyReport}
            disabled={loading === 'company'}
            className="w-full py-2 text-xs font-bold tracking-wider bg-hud-blue/10 border border-hud-blue text-hud-blue hover:bg-hud-blue/20 transition-colors disabled:opacity-50"
          >
            {loading === 'company' ? 'GENERANDO...' : 'DESCARGAR PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
