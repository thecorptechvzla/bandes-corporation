'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBulkUploads } from '@/hooks/useBulkUploads';
import { useClients } from '@/hooks/useClients';
import {
  FolderUp, FileSpreadsheet, Download, Search, AlertTriangle,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, HardDrive,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; style: string; icon: typeof CheckCircle2 }> = {
  COMPLETED: { label: 'Completado', style: 'text-[var(--pm-accent-emerald)] bg-[var(--pm-accent-emerald)]/10 border border-[var(--pm-accent-emerald)]/20', icon: CheckCircle2 },
  PARTIAL: { label: 'Parcial', style: 'text-[var(--pm-accent-amber)] bg-[var(--pm-accent-amber)]/10 border border-[var(--pm-accent-amber)]/20', icon: AlertTriangle },
  FAILED: { label: 'Fallado', style: 'text-[var(--pm-accent-red)] bg-[var(--pm-accent-red)]/10 border border-[var(--pm-accent-red)]/20', icon: XCircle },
};

const MOCK_CLIENTS: Record<string, string> = {
  'mock-client-1': 'Minera Aurífera del Sur C.A.',
  'mock-client-2': 'Refinería Oro Puro S.A.',
  'mock-client-3': 'Minera Los Andes C.A.',
};

function fmtDate(raw: string) {
  return new Date(raw).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function resolveClient(clientId: string, clients: { id: string; name: string }[]): string {
  const found = clients.find(c => c.id === clientId);
  return found?.name ?? MOCK_CLIENTS[clientId] ?? clientId.slice(0, 8);
}

export default function PackingPage() {
  const { data: records = [], isLoading } = useBulkUploads();
  const { data: clients = [] } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!searchTerm) return records;
    const q = searchTerm.toLowerCase();
    return records.filter(r => r.fileName.toLowerCase().includes(q));
  }, [records, searchTerm]);

  const stats = useMemo(() => ({
    total: records.length,
    created: records.reduce((s, r) => s + r.created, 0),
    errors: records.reduce((s, r) => s + r.errors.length, 0),
  }), [records]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-sans font-medium text-[var(--pm-text-primary)] tracking-tight flex items-center gap-2">
            <FolderUp className="w-8 h-8 text-[var(--pm-accent-gold)] drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
            Packing
            <span className="text-[var(--pm-accent-gold)] font-semibold ml-1">— Carga Masiva</span>
          </h1>
          <p className="text-[11px] font-mono text-[var(--pm-text-dim)] mt-1">
            Historial de archivos subidos al sistema. Descargue los originales y revise errores de validaci&oacute;n.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Cargas Realizadas', value: stats.total, color: 'text-[var(--pm-accent-gold)]', border: 'hover:border-[var(--pm-accent-gold)]/30', icon: FolderUp },
          { label: 'Registros Creados', value: stats.created, color: 'text-[var(--pm-accent-emerald)]', border: 'hover:border-[var(--pm-accent-emerald)]/30', icon: CheckCircle2 },
          { label: 'Errores Totales', value: stats.errors, color: 'text-[var(--pm-accent-red)]', border: 'hover:border-[var(--pm-accent-red)]/30', icon: AlertTriangle },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`glass-panel p-4 rounded-xl border border-[var(--pm-border)]/40 shadow-[0_4px_12px_rgba(0,0,0,0.3)] flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] ${s.border}`}>
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <div>
              <p className="text-[9px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">{s.label}</p>
              <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value.toLocaleString()}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-panel rounded-2xl border border-[var(--pm-border)]/40 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <div className="p-5 border-b border-[var(--pm-border)]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] font-semibold text-[var(--pm-text-primary)] uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[var(--pm-accent-gold)]" />
            Archivos Subidos
          </span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--pm-text-dim)]/50" />
            <input type="text" placeholder="Buscar archivo..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 bg-[var(--pm-bg-base)]/60 border border-[var(--pm-border)]/40 rounded-lg pl-8 pr-2 py-1.5 text-[11px] font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] placeholder:text-[var(--pm-text-dim)]/30" />
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center">
            <div className="w-6 h-6 border-2 border-[var(--pm-accent-gold)]/30 border-t-[var(--pm-accent-gold)] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[11px] font-mono text-[var(--pm-text-dim)]">Cargando historial...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <FolderUp className="w-10 h-10 text-[var(--pm-text-dim)]/30 mx-auto mb-3" />
            <p className="text-sm text-[var(--pm-text-primary)] font-semibold">
              {searchTerm ? 'Sin resultados' : 'No hay cargas masivas registradas'}
            </p>
            <p className="text-[11px] font-mono text-[var(--pm-text-dim)] mt-1 max-w-md mx-auto">
              {searchTerm
                ? 'Ningún archivo coincide con el criterio de búsqueda.'
                : 'Las cargas realizadas desde Ingresos de Material aparecerán aquí automáticamente.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto premium-table">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-[var(--pm-border)]/20 text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider">
                  <th className="py-3 bg-[var(--pm-bg-base)]/50 text-center w-10"></th>
                  <th className="py-3 bg-[var(--pm-bg-base)]/50 text-left pl-2">Archivo</th>
                  <th className="py-3 bg-[var(--pm-bg-base)]/50 text-left">Cliente</th>
                  <th className="py-3 bg-[var(--pm-bg-base)]/50 text-center">Fecha</th>
                  <th className="py-3 bg-[var(--pm-bg-base)]/50 text-center">Filas</th>
                  <th className="py-3 bg-[var(--pm-bg-base)]/50 text-center">Creados</th>
                  <th className="py-3 bg-[var(--pm-bg-base)]/50 text-center">Errores</th>
                  <th className="py-3 bg-[var(--pm-bg-base)]/50 text-center">Estado</th>
                  <th className="py-3 bg-[var(--pm-bg-base)]/50 text-center">Descargar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--pm-border)]/20">
                {filtered.map((record, idx) => {
                  const cfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.FAILED;
                  const Icon = cfg.icon;
                  const isExpanded = expandedId === record.id;
                  const hasErrors = record.errors.length > 0;
                  return (
                    <React.Fragment key={record.id}>
                      <tr className={`group transition-all duration-150 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--pm-bg-base)]/20'} hover:bg-[var(--pm-bg-hover)]/40 hover:shadow-[inset_0_0_20px_rgba(212,175,55,0.03)]`}>
                        <td className="py-3 text-center relative">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-[var(--pm-accent-gold)] opacity-0 group-hover:opacity-60 transition-opacity rounded-r" />
                          <FileSpreadsheet className="w-4 h-4 text-[var(--pm-accent-gold)]/60 mx-auto" />
                        </td>
                        <td className="py-3 font-mono text-[var(--pm-text-primary)] text-[11px] truncate max-w-[200px] pl-2" title={record.fileName}>
                          {record.fileName}
                        </td>
                        <td className="py-3 font-mono text-[var(--pm-text-dim)]">{resolveClient(record.clientId, clients)}</td>
                        <td className="py-3 font-mono text-[var(--pm-text-dim)] text-[10px] text-center">{fmtDate(record.createdAt)}</td>
                        <td className="py-3 text-center font-mono text-[var(--pm-text-primary)]">{record.totalRows}</td>
                        <td className="py-3 text-center font-mono text-[var(--pm-accent-emerald)]">{record.created}</td>
                        <td className="py-3 text-center">
                          {hasErrors ? (
                            <button type="button" onClick={() => setExpandedId(isExpanded ? null : record.id)}
                              className="font-mono text-[var(--pm-accent-red)] hover:text-[var(--pm-accent-red)]/80 flex items-center justify-center gap-0.5 mx-auto active:scale-95 transition-all cursor-pointer">
                              {record.errors.length}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          ) : (
                            <span className="font-mono text-neutral-600">0</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${cfg.style}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <a href={`http://localhost:3001/bulk-uploads/${record.id}/download`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--pm-bg-base)]/60 border border-[var(--pm-border)]/40 text-[var(--pm-accent-gold)] hover:bg-[var(--pm-accent-gold)]/10 hover:border-[var(--pm-accent-gold)]/30 active:scale-95 transition-all text-[9px] font-mono font-bold uppercase tracking-wider">
                            <Download className="w-3 h-3" />
                            Excel
                          </a>
                        </td>
                      </tr>
                      <AnimatePresence>
                        {isExpanded && hasErrors && (
                          <motion.tr key={`errors-${record.id}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}>
                            <td colSpan={9} className="p-0">
                              <div className="bg-[var(--pm-bg-base)]/60 border-t border-[var(--pm-border)]/20 px-5 py-3 space-y-1.5">
                                <p className="text-[9px] font-mono text-[var(--pm-accent-red)] uppercase tracking-wider font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Errores de validaci&oacute;n ({record.errors.length})
                                </p>
                                {record.errors.map((err, ei) => (
                                  <div key={ei} className="flex gap-3 text-[10px] font-mono">
                                    <span className="text-[var(--pm-text-dim)] shrink-0 w-12">Fila {err.row}:</span>
                                    <span className="text-red-300">{err.message}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="flex items-center gap-4 text-[9px] font-mono text-[var(--pm-text-dim)]/70 border-t border-[var(--pm-border)]/20 pt-3">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--pm-accent-emerald)] shadow-[0_0_6px_var(--pm-accent-emerald)]" />
          DB ONLINE
        </span>
        <HardDrive className="w-3 h-3" />
        <span>{records.length} cargas totales</span>
        <span>{stats.created} registros creados</span>
        <span>{stats.errors} errores</span>
      </motion.div>
    </motion.div>
  );
}
