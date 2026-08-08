'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  Users, Plus, Pencil, Trash2, Database,
} from 'lucide-react';
import type { Client } from '@/types/api';
import { formatRif } from '@/lib/format';

const ROLE_BADGE_CLASS: Record<string, string> = {
  PROVEEDOR: 'pm-badge--proveedor',
  CLIENTE: 'pm-badge--cliente',
  AMBOS: 'pm-badge--ambos',
};

const ROLE_LABELS: Record<string, string> = {
  PROVEEDOR: 'Proveedor',
  CLIENTE: 'Cliente',
  AMBOS: 'Mixto',
};

const TH = 'text-[10px] text-[var(--pm-text-dim)] font-mono font-bold uppercase tracking-widest';

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

function SkeletonRows() {
  return (
    <tbody>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-[var(--pm-border)]/50">
          <td className="pl-6 py-3.5"><div className="skeleton h-4 w-24 rounded" /></td>
          <td className="px-4 py-3.5"><div className="skeleton h-4 w-40 rounded" /></td>
          <td className="px-4 py-3.5"><div className="skeleton h-5 w-16 rounded mx-auto" /></td>
          <td className="px-4 py-3.5 hidden sm:table-cell"><div className="skeleton h-4 w-28 rounded" /></td>
          <td className="pr-6 py-3.5"><div className="skeleton h-4 w-12 rounded ml-auto" /></td>
        </tr>
      ))}
    </tbody>
  );
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
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-[var(--pm-border)]">
                <th className={`w-[15%] text-left pl-6 py-3 ${TH}`}>RIF</th>
                <th className={`w-[35%] text-left px-4 py-3 ${TH}`}>Nombre</th>
                <th className={`w-[15%] text-center px-4 py-3 ${TH}`}>Rol</th>
                <th className={`w-[20%] text-left px-4 py-3 hidden sm:table-cell ${TH}`}>Contacto</th>
                <th className={`w-[15%] text-right pr-6 py-3 ${TH}`}>Acciones</th>
              </tr>
            </thead>
            <SkeletonRows />
          </table>
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
          <table className="w-full table-fixed border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-[var(--pm-border)]">
                <th className={`w-[15%] text-left pl-6 py-3 ${TH}`}>RIF</th>
                <th className={`w-[35%] text-left px-4 py-3 ${TH}`}>Nombre</th>
                <th className={`w-[15%] text-center px-4 py-3 ${TH}`}>Rol</th>
                <th className={`w-[20%] text-left px-4 py-3 hidden sm:table-cell ${TH}`}>Contacto</th>
                <th className={`w-[15%] text-right pr-6 py-3 ${TH}`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, idx) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.03, duration: 0.25 }}
                  className="pm-table-row border-b border-[var(--pm-border)]/30"
                >
                  <td className="text-left pl-6 py-3 font-mono font-bold text-cyan-400 tracking-wider text-[11px]">
                    {formatRif(client.rif)}
                  </td>
                  <td className="text-left px-4 py-3 font-sans font-bold text-[var(--pm-text-primary)]">
                    {client.name}
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className={`pm-badge ${ROLE_BADGE_CLASS[client.role] || ''}`}>
                      {ROLE_LABELS[client.role] || client.role}
                    </span>
                  </td>
                  <td className="text-left px-4 py-3 font-mono text-[var(--pm-text-dim)] hidden sm:table-cell">
                    {client.contactInfo || <span className="opacity-30">&mdash;</span>}
                  </td>
                  <td className="text-right pr-6 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(client)}
                        className="p-1.5 rounded-lg hover:bg-[var(--pm-accent-gold)]/10 text-[var(--pm-text-dim)] hover:text-[var(--pm-accent-gold)] active:scale-90 transition-all cursor-pointer"
                        title="Editar entidad"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(client)}
                        className="p-1.5 rounded-lg hover:bg-[var(--pm-accent-red)]/10 text-[var(--pm-text-dim)] hover:text-[var(--pm-accent-red)] active:scale-90 transition-all cursor-pointer"
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
          <div className="px-5 py-3 border-t border-[var(--pm-border)] text-[11px] font-mono text-[var(--pm-text-dim)] flex items-center gap-4">
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
