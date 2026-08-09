'use client';

import React, { useMemo } from 'react';
import { ScanSearch, X } from 'lucide-react';
import { formatNumber, formatWeight } from '@/lib/format';
import { ModalShell } from '@/components/ui/ModalShell';
import type { Process, Lot, Bar, Client } from '@/types/api';

interface ProcessAuditModalProps {
  process: Process;
  lots: Lot[];
  lotBarsMap: Record<string, Bar[]>;
  clients: Client[];
  onClose: () => void;
}

interface BarRow {
  bar: Bar;
  bruto: number;
  fa: number;
  fe: number;
  r: number;
  ley: number;
}

interface ProviderGroup {
  clientId: string;
  clientName: string;
  rows: BarRow[];
  bruto: number;
  fa: number;
  fe: number;
  r: number;
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'text-[var(--pm-accent-cyan)] bg-cyan-500/10 border-cyan-500/30',
  CLOSED: 'text-[var(--pm-accent-emerald)] bg-emerald-500/10 border-emerald-500/30',
  CANCELLED: 'text-[var(--pm-accent-red)] bg-rose-500/10 border-rose-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'EN FUNDICIÓN',
  CLOSED: 'CERRADO',
  CANCELLED: 'CANCELADO',
};

export function ProcessAuditModal({ process, lots, lotBarsMap, clients, onClose }: ProcessAuditModalProps) {
  const groups = useMemo<ProviderGroup[]>(() => {
    const lotFA = new Map<string, number>();
    lots.forEach(l => {
      const lb = lotBarsMap[l.id] || [];
      lotFA.set(l.id, lb.reduce((s, b) => s + (Number(b.fineWeight) || 0), 0));
    });

    const byClient = new Map<string, BarRow[]>();
    const order: string[] = [];

    lots.forEach(l => {
      const lb = lotBarsMap[l.id] || [];
      const recovered = Number(l.recovered ?? 0);
      const faLot = lotFA.get(l.id) || 0;
      lb.forEach(b => {
        const fa = Number(b.fineWeight) || 0;
        const r = recovered > 0 && faLot > 0 ? recovered * (fa / faLot) : 0;
        const row: BarRow = {
          bar: b,
          bruto: Number(b.grossWeight) || 0,
          fa,
          fe: fa * 0.99,
          r,
          ley: Number(b.purity) || 0,
        };
        if (!byClient.has(b.clientId)) {
          byClient.set(b.clientId, []);
          order.push(b.clientId);
        }
        byClient.get(b.clientId)!.push(row);
      });
    });

    return order.map(cid => {
      const rows = byClient.get(cid)!;
      const sum = (k: (r: BarRow) => number) => rows.reduce((s, r) => s + k(r), 0);
      const first = rows[0];
      return {
        clientId: cid,
        clientName: clients.find(c => c.id === cid)?.name || first?.bar.client?.name || 'DESCONOCIDO',
        rows,
        bruto: sum(r => r.bruto),
        fa: sum(r => r.fa),
        fe: sum(r => r.fe),
        r: sum(r => r.r),
      };
    });
  }, [process.id, lots, lotBarsMap, clients]);

  const grand = useMemo(() => {
    const sum = (k: (g: ProviderGroup) => number) => groups.reduce((s, g) => s + k(g), 0);
    return {
      bruto: sum(g => g.bruto),
      fa: sum(g => g.fa),
      fe: sum(g => g.fe),
      r: sum(g => g.r),
      bars: groups.reduce((s, g) => s + g.rows.length, 0),
    };
  }, [groups]);

  const totalBars = grand.bars;
  const date = process.createdAt
    ? new Date(process.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
  const statusStyle = STATUS_STYLES[process.status] || '';
  const statusLabel = STATUS_LABELS[process.status] || process.status;

  return (
    <ModalShell isOpen onClose={onClose} noHeader noPadding size="lg" className="!backdrop-blur-md !bg-black/90">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--pm-border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}>
            <ScanSearch className="w-4 h-4 text-[var(--pm-accent-cyan)]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-cyan)] uppercase tracking-wider">Ficha Técnica del Proceso</span>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-sm font-sans font-semibold text-[var(--pm-text-primary)]">
                {process.name}
              </h3>
              {process.isMixed && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/40 text-purple-300">MIXTO</span>
              )}
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${statusStyle}`}>{statusLabel}</span>
            </div>
            <p className="text-[10px] font-mono text-[var(--pm-text-dim)] mt-1">
              {date} · {totalBars} barra{totalBars !== 1 ? 's' : ''} · {groups.length} proveedor{groups.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] active:scale-90 transition-all cursor-pointer"
        ><X className="w-4 h-4" /></button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6 overflow-y-auto max-h-[55vh] v2-scroll">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ScanSearch className="w-10 h-10 text-[var(--pm-text-dim)]/20 mb-3" />
            <span className="text-sm font-sans text-[var(--pm-text-dim)]">Sin barras registradas en este proceso</span>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.clientId} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">
                  Proveedor: <span className="text-[var(--pm-accent-gold)]">{group.clientName}</span>
                </span>
                <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">
                  {group.rows.length} barra{group.rows.length !== 1 ? 's' : ''} · {formatWeight(group.bruto)}
                </span>
              </div>

              <div className="rounded-xl border border-[var(--pm-border)] overflow-hidden bg-[var(--pm-bg-deepest)]/40">
                <table className="w-full table-fixed border-collapse font-sans text-xs">
                  <thead>
                    <tr className="border-b border-[var(--pm-border)]">
                      <th className="w-[16%] text-left px-4 py-2.5 text-[var(--pm-text-dim)] font-semibold uppercase tracking-wider">Código</th>
                      <th className="w-[16.8%] text-right px-4 py-2.5 text-[var(--pm-accent-gold)] font-bold uppercase tracking-wider">Bruto (g)</th>
                      <th className="w-[16.8%] text-right px-4 py-2.5 text-[var(--pm-accent-cyan)] font-bold uppercase tracking-wider">FA (g)</th>
                      <th className="w-[16.8%] text-right px-4 py-2.5 text-[var(--pm-text-dim)] font-semibold uppercase tracking-wider">FE (g)</th>
                      <th className="w-[16.8%] text-right px-4 py-2.5 text-[var(--pm-text-dim)] font-semibold uppercase tracking-wider">R (g)</th>
                      <th className="w-[16.8%] text-right px-4 py-2.5 text-[var(--pm-text-dim)] font-semibold uppercase tracking-wider">Ley Au (‰)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--pm-border)]/40">
                    {group.rows.map((row, ri) => (
                      <tr key={row.bar.id} className={`${ri % 2 === 1 ? 'bg-black/20' : ''} hover:bg-[var(--pm-accent-gold)]/[0.03] transition-colors`}>
                        <td className="text-left px-4 py-2.5 font-mono font-semibold text-[var(--pm-accent-gold)]">{row.bar.barNumber}</td>
                        <td className="text-right px-4 py-2.5 font-mono font-bold text-[var(--pm-accent-gold)]">{formatNumber(row.bruto, 2)}</td>
                        <td className="text-right px-4 py-2.5 font-mono font-bold text-[var(--pm-accent-cyan)]">{formatNumber(row.fa, 2)}</td>
                        <td className="text-right px-4 py-2.5 font-mono text-[var(--pm-text-primary)]">{formatNumber(row.fe, 2)}</td>
                        <td className="text-right px-4 py-2.5 font-mono text-[var(--pm-accent-emerald)]">{formatNumber(row.r, 2)}</td>
                        <td className="text-right px-4 py-2.5 font-mono text-[var(--pm-text-primary)]">{formatNumber(row.ley, 2)}</td>
                      </tr>
                    ))}
                    {group.rows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-[10px] text-[var(--pm-text-dim)] font-mono italic">
                          Sin barras registradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[var(--pm-border)] bg-[var(--pm-bg-primary)]/60">
                      <td className="text-left px-4 py-2.5 font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">Subtotal</td>
                      <td className="text-right px-4 py-2.5 font-mono font-bold text-[var(--pm-accent-gold)]">{formatNumber(group.bruto, 2)}</td>
                      <td className="text-right px-4 py-2.5 font-mono font-bold text-[var(--pm-accent-cyan)]">{formatNumber(group.fa, 2)}</td>
                      <td className="text-right px-4 py-2.5 font-mono text-[var(--pm-text-primary)]">{formatNumber(group.fe, 2)}</td>
                      <td className="text-right px-4 py-2.5 font-mono text-[var(--pm-accent-emerald)]">{formatNumber(group.r, 2)}</td>
                      <td className="text-right px-4 py-2.5 font-mono text-[var(--pm-text-dim)]">—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer — Gran Total */}
      {groups.length > 0 && (
        <div className="px-6 pb-6 pt-0">
          <div className="rounded-xl border border-[var(--pm-accent-gold)]/25 bg-[var(--pm-accent-gold)]/[0.05] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] font-mono font-bold text-[var(--pm-text-primary)] uppercase tracking-wider">
              Gran Total del Proceso
            </span>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px]">
              <span className="text-[var(--pm-text-dim)]">BRUTO <b className="text-[var(--pm-accent-gold)]">{formatNumber(grand.bruto, 2)} g</b></span>
              <span className="text-[var(--pm-text-dim)]">FA <b className="text-[var(--pm-accent-cyan)]">{formatNumber(grand.fa, 2)} g</b></span>
              <span className="text-[var(--pm-text-dim)]">FE <b className="text-[var(--pm-text-primary)]">{formatNumber(grand.fe, 2)} g</b></span>
              <span className="text-[var(--pm-text-dim)]">R <b className="text-[var(--pm-accent-emerald)]">{formatNumber(grand.r, 2)} g</b></span>
            </div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}