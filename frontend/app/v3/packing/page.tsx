'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useBulkUploads } from '@/hooks/useBulkUploads';
import { useClients } from '@/hooks/useClients';
import { MetricsHUD, type MetricItem } from '@/components/tactical/MetricsHUD';
import { TacticalCard } from '@/components/tactical/TacticalCard';
import {
  FileSpreadsheet, Download, AlertTriangle,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; style: string; icon: typeof CheckCircle2 }> = {
  COMPLETED: {
    label: 'COMPLETED',
    style: 'text-[var(--tac-accent-green)] bg-[var(--tac-accent-green)]/10 border border-[var(--tac-accent-green)]/20',
    icon: CheckCircle2,
  },
  PARTIAL: {
    label: 'PARTIAL',
    style: 'text-[var(--tac-accent-amber)] bg-[var(--tac-accent-amber)]/10 border border-[var(--tac-accent-amber)]/20',
    icon: AlertTriangle,
  },
  FAILED: {
    label: 'FAILED',
    style: 'text-[var(--tac-accent-red)] bg-[var(--tac-accent-red)]/10 border border-[var(--tac-accent-red)]/20',
    icon: XCircle,
  },
};

function resolveClient(clientId: string, clients: { id: string; name: string }[]): string {
  const found = clients.find(c => c.id === clientId);
  if (found) return found.name;
  const fallback: Record<string, string> = {
    'mock-client-1': 'Minera Aurífera del Sur C.A.',
    'mock-client-2': 'Refinería Oro Puro S.A.',
    'mock-client-3': 'Minera Los Andes C.A.',
  };
  return fallback[clientId] || clientId.slice(0, 8);
}

function fmtDate(raw: string) {
  return new Date(raw).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function PackingPage() {
  const { data: records = [], isLoading } = useBulkUploads();
  const { data: clients = [] } = useClients();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const metrics: MetricItem[] = useMemo(() => [
    {
      key: 'cargas',
      label: 'CARGAS REALIZADAS',
      value: records.length.toLocaleString(),
      accent: 'cyan',
    },
    {
      key: 'creados',
      label: 'REGISTROS CREADOS',
      value: records.reduce((s, r) => s + r.created, 0).toLocaleString(),
      accent: 'green',
    },
    {
      key: 'errores',
      label: 'ERRORES TOTALES',
      value: records.reduce((s, r) => s + r.errors.length, 0).toLocaleString(),
      accent: 'red',
    },
  ], [records]);

  const totalCreated = useMemo(() =>
    records.reduce((s, r) => s + r.created, 0),
  [records]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="text-[9px] font-mono font-bold text-[var(--tac-accent-cyan)] uppercase tracking-[0.2em]">
          {'>'} PACKING — REGISTRO DE CARGA MASIVA
        </span>
        <p className="text-[10px] font-mono text-[var(--tac-text-dim)] mt-1">
          HISTORIAL DE ARCHIVOS SUBIDOS AL SISTEMA
        </p>
      </motion.div>

      {/* Metrics */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4 }}
      >
        <MetricsHUD items={metrics} cols={4} />
      </motion.div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.4 }}
      >
        <TacticalCard title="ARCHIVOS SUBIDOS" accent="cyan">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--tac-text-dim)]">
              <span className="w-2 h-2 rounded-full bg-[var(--tac-accent-amber)] animate-pulse mb-2" />
              <span className="text-[10px] font-mono">CARGANDO HISTORIAL...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--tac-text-dim)]">
              <FileSpreadsheet className="w-8 h-8 text-[var(--tac-text-dim)]/30 mb-2" />
              <span className="text-[11px] font-mono font-bold text-[var(--tac-text-primary)]">
                NO HAY REGISTROS DE CARGA MASIVA
              </span>
              <span className="text-[9px] font-mono mt-1 max-w-xs text-center">
                Las cargas realizadas desde Ingresos de Material aparecer&aacute;n aqu&iacute; autom&aacute;ticamente.
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-[var(--tac-border)]">
                    {[
                      { key: 'archivo', label: 'ARCHIVO', align: 'left', sticky: true },
                      { key: 'cliente', label: 'CLIENTE', align: 'left' },
                      { key: 'fecha', label: 'FECHA', align: 'center' },
                      { key: 'filas', label: 'FILAS', align: 'center' },
                      { key: 'creados', label: 'CREADOS', align: 'center' },
                      { key: 'errores', label: 'ERRORES', align: 'center' },
                      { key: 'status', label: 'STATUS', align: 'center' },
                      { key: 'descargar', label: 'DESCARGAR', align: 'center' },
                    ].map((col, ci) => (
                      <th
                        key={col.key}
                        className={`py-2 px-2 text-[9px] font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.12em]
                          ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                          ${col.sticky ? 'sticky left-0 bg-[var(--tac-bg-secondary)] z-10' : ''}
                        `}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--tac-border)]/50">
                  {records.map((r, idx) => {
                    const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.FAILED;
                    const Icon = cfg.icon;
                    const isExpanded = expandedId === r.id;
                    const hasErrors = r.errors.length > 0;
                    const baseRow = (
                      <tr
                        key={r.id}
                        className={`
                          group transition-colors duration-100 relative
                          ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--tac-bg-primary)]/30'}
                          hover:bg-[var(--tac-bg-tertiary)]
                        `}
                      >
                        <td className="absolute inset-y-0 left-0 w-0.5 bg-[var(--tac-accent-cyan)] opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none" />
                        {/* ARCHIVO */}
                        <td className="sticky left-0 bg-[var(--tac-bg-secondary)] z-10 py-2.5 px-2">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-[var(--tac-accent-cyan)]/60" />
                            <span className="text-[var(--tac-text-primary)] truncate max-w-[200px]" title={r.fileName}>
                              {r.fileName}
                            </span>
                          </div>
                        </td>
                        {/* CLIENTE */}
                        <td className="py-2.5 px-2 text-[var(--tac-text-dim)]">
                          {resolveClient(r.clientId, clients)}
                        </td>
                        {/* FECHA */}
                        <td className="py-2.5 px-2 text-center text-[10px] text-[var(--tac-text-dim)]">
                          {fmtDate(r.createdAt)}
                        </td>
                        {/* FILAS */}
                        <td className="py-2.5 px-2 text-center text-[var(--tac-text-primary)]">
                          {r.totalRows}
                        </td>
                        {/* CREADOS */}
                        <td className="py-2.5 px-2 text-center text-[var(--tac-accent-green)]">
                          {r.created}
                        </td>
                        {/* ERRORES */}
                        <td className="py-2.5 px-2 text-center">
                          {hasErrors ? (
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : r.id)}
                              className="inline-flex items-center gap-1 text-[var(--tac-accent-red)] hover:text-[var(--tac-accent-red)]/80 active:scale-95 transition-all cursor-pointer"
                            >
                              {r.errors.length}
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          ) : (
                            <span className="text-[var(--tac-text-dim)]/50">0</span>
                          )}
                        </td>
                        {/* STATUS */}
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold font-mono ${cfg.style}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        {/* DESCARGAR */}
                        <td className="py-2.5 px-2 text-center">
                          <a
                            href={`http://localhost:3001/bulk-uploads/${r.id}/download`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[9px] font-bold font-mono uppercase tracking-wider
                              bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] text-[var(--tac-accent-cyan)]
                              hover:bg-[var(--tac-bg-tertiary)] hover:border-[var(--tac-accent-cyan)]/40
                              active:scale-95 transition-all"
                          >
                            <Download className="w-3 h-3" />
                            Excel
                          </a>
                        </td>
                      </tr>
                    );

                    const errorRow = (
                      <tr key={`${r.id}-errors`}>
                        <td colSpan={8} className="p-0 overflow-hidden">
                          <motion.div
                            initial={false}
                            animate={{
                              height: isExpanded && hasErrors ? 'auto' : 0,
                              opacity: isExpanded && hasErrors ? 1 : 0,
                            }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                          >
                            {hasErrors && (
                              <div className="bg-[var(--tac-bg-primary)] border-t border-[var(--tac-border)] px-4 py-3 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-[var(--tac-accent-red)] uppercase tracking-[0.12em] mb-2">
                                  <AlertTriangle className="w-3 h-3" />
                                  Errores de validaci&oacute;n ({r.errors.length})
                                </div>
                                {r.errors.map((err, ei) => (
                                  <div key={ei} className="flex gap-3 text-[10px] font-mono">
                                    <span className="text-[var(--tac-text-dim)] shrink-0 w-16">
                                      Fila {err.row}:
                                    </span>
                                    <span className="text-[var(--tac-accent-red)]/90">
                                      {err.message}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        </td>
                      </tr>
                    );

                    return [baseRow, errorRow];
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TacticalCard>
      </motion.div>

      {/* System Status Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-3 text-[8px] font-mono text-[var(--tac-text-dim)] border-t border-[var(--tac-border)] pt-3"
      >
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-[var(--tac-accent-green)] animate-pulse" />
          DB ONLINE
        </span>
        <span>{records.length} cargas totales</span>
        <span>{totalCreated} registros creados</span>
      </motion.div>
    </motion.div>
  );
}
