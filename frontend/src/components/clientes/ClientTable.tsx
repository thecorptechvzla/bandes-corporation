'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Users, Plus, Pencil, Trash2, Database,
} from 'lucide-react';
import type { Client } from '@/types/api';
import { formatRif } from '@/lib/format';

const ROLE_STYLES: Record<string, string> = {
  PROVEEDOR: 'text-sky-400 border-sky-500/25 bg-sky-500/10',
  CLIENTE: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10',
  AMBOS: 'text-purple-400 border-purple-500/25 bg-purple-500/10',
};

const ROLE_LABELS: Record<string, string> = {
  PROVEEDOR: 'Proveedor',
  CLIENTE: 'Cliente',
  AMBOS: 'Mixto',
};

interface ClientTableProps {
  clients: Client[];
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  error: any;
  searchQuery: string;
  filterTab: string;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onCreate: () => void;
}

export function ClientTable({
  clients, totalCount, isLoading, isError, error,
  searchQuery, filterTab, onEdit, onDelete, onCreate,
}: ClientTableProps) {
  const providerCount = clients.filter(c => c.role === 'PROVEEDOR' || c.role === 'AMBOS').length;
  const clientCount = clients.filter(c => c.role === 'CLIENTE' || c.role === 'AMBOS').length;

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--pm-text-dim)]">
          <div className="w-8 h-8 border-2 border-[var(--pm-accent-gold)] border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-sm font-sans">Cargando directorio...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--pm-accent-red)]">
          <span className="text-sm font-sans">Error al cargar el directorio</span>
          <span className="text-xs text-[var(--pm-text-dim)] mt-1">
            {(error as any)?.message || 'Error de conexión'}
          </span>
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--pm-text-dim)]">
          <Users className="w-10 h-10 text-[var(--pm-accent-gold)]/20 mb-3 animate-pulse" />
          <span className="text-sm font-sans">
            {searchQuery
              ? 'No se encontraron resultados'
              : filterTab === 'PROVEEDORES'
                ? 'No hay proveedores registrados'
                : filterTab === 'CLIENTES'
                  ? 'No hay clientes registrados'
                  : 'No hay entidades registradas'}
          </span>
          {!searchQuery && (
            <button
              onClick={onCreate}
              className="mt-4 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
              style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--pm-accent-gold)', border: '1px solid rgba(212,175,55,0.2)' }}
            >
              <Plus className="w-3 h-3 inline mr-1" /> Registrar Primera Entidad
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="premium-table w-full">
            <thead>
              <tr>
                <th className="text-center">RIF</th>
                <th>Nombre</th>
                <th className="text-center">Rol</th>
                <th className="hidden sm:table-cell">Contacto</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, idx) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.03, duration: 0.25 }}
                  className="odd:bg-[var(--pm-bg-deepest)]/40 hover:bg-[var(--pm-bg-tertiary)]/60 transition-all duration-150 hover:shadow-[inset_0_0_20px_rgba(212,175,55,0.04)]"
                >
                  <td className="text-center font-mono font-bold text-[var(--pm-accent-gold)] tracking-wider text-[11px]">
                    {formatRif(client.rif)}
                  </td>
                  <td className="font-sans font-bold text-[var(--pm-text-primary)]">
                    {client.name}
                  </td>
                  <td className="text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold border rounded ${ROLE_STYLES[client.role] || ''}`}>
                      {ROLE_LABELS[client.role] || client.role}
                    </span>
                  </td>
                  <td className="text-[var(--pm-text-dim)] text-xs hidden sm:table-cell">
                    {client.contactInfo || <span className="opacity-30">&mdash;</span>}
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit(client)}
                        className="p-1.5 rounded hover:bg-[var(--pm-accent-gold)]/10 text-[var(--pm-text-dim)] hover:text-[var(--pm-accent-gold)] active:scale-90 transition-all cursor-pointer"
                        title="Editar entidad"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(client)}
                        className="p-1.5 rounded hover:bg-[var(--pm-accent-red)]/10 text-[var(--pm-text-dim)] hover:text-[var(--pm-accent-red)] active:scale-90 transition-all cursor-pointer"
                        title="Eliminar entidad"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-[var(--pm-border)] text-[10px] font-mono text-[var(--pm-text-dim)] flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              {totalCount} entidad{totalCount !== 1 ? 'es' : ''}
            </span>
            <span className="hidden sm:inline">
              {providerCount} proveedores
            </span>
            <span className="hidden sm:inline">
              {clientCount} clientes
            </span>
          </div>
        </div>
      )}
    </>
  );
}
