'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from '@/hooks/useClients';
import { useBars } from '@/hooks/useBars';
import { useProcesses } from '@/hooks/useProcesses';
import {
  Plus, AlertTriangle, Trash2, Check,
  Package, Layers, Shield,
} from 'lucide-react';
import type { Client, ClientRole } from '@/types/api';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatRif } from '@/lib/format';
import { ClientFormModal } from '@/components/clientes/ClientFormModal';
import { ClientTable } from '@/components/clientes/ClientTable';
import { ClientFilterBar } from '@/components/clientes/ClientFilterBar';

type FilterTab = 'TODOS' | 'PROVEEDORES' | 'CLIENTES';

export default function V2ClientesPage() {
  const { data: clients = [], isLoading, isError, error } = useClients();
  const { data: bars = [] } = useBars();
  const { data: processes = [] } = useProcesses();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ client: Client; barCount: number; processCount: number } | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success'>('idle');

  const visibleClients = useMemo(() => {
    let result = clients;
    if (filterTab === 'PROVEEDORES') {
      result = result.filter(c => c.role === 'PROVEEDOR' || c.role === 'AMBOS');
    } else if (filterTab === 'CLIENTES') {
      result = result.filter(c => c.role === 'CLIENTE' || c.role === 'AMBOS');
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) || c.rif.toLowerCase().includes(q),
      );
    }
    return result;
  }, [clients, filterTab, searchQuery]);

  const openCreateModal = () => {
    setEditingClient(null);
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const openDeleteModal = (client: Client) => {
    const barCount = bars.filter(b => b.clientId === client.id).length;
    const processCount = processes.filter(p => p.clientId === client.id).length;
    setDeleteTarget({ client, barCount, processCount });
  };

  const handleSubmit = async (data: { rif: string; name: string; contactInfo?: string; role: ClientRole; id?: string }) => {
    if (data.id) {
      await updateClient.mutateAsync({
        id: data.id,
        data: { rif: data.rif, name: data.name, contactInfo: data.contactInfo, role: data.role },
      });
    } else {
      await createClient.mutateAsync({
        rif: data.rif, name: data.name, contactInfo: data.contactInfo, role: data.role,
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteStatus('deleting');
    try {
      await deleteClient.mutateAsync(deleteTarget.client.id);
      setDeleteStatus('success');
      setTimeout(() => { setDeleteTarget(null); setDeleteStatus('idle'); }, 1500);
    } catch {
      setDeleteTarget(null);
      setDeleteStatus('idle');
    }
  };

  const isLoadingMutation = createClient.isPending || updateClient.isPending;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Shield className="w-4 h-4 text-[var(--pm-accent-emerald)]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--pm-text-primary)] font-sans tracking-tight">
              Directorio Comercial
            </h1>
            <p className="text-[11px] text-[var(--pm-text-dim)] font-mono uppercase tracking-wider mt-0.5">
              Registro oficial de entidades autorizadas
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="premium-card px-4 py-2.5 rounded-xl font-mono text-[11px] uppercase tracking-wider font-bold flex items-center gap-2 active:scale-95 transition-all duration-150 cursor-pointer hover:border-[var(--pm-accent-emerald)]/40"
          style={{ borderColor: 'rgba(16,185,129,0.25)' }}
        >
          <Plus className="w-3.5 h-3.5 text-[var(--pm-accent-emerald)]" />
          <span style={{ color: 'var(--pm-accent-emerald)' }}>Nuevo Registro</span>
        </button>
      </motion.div>

      {/* ═══ BENTO GRID ═══ */}
      <div className="grid grid-cols-1 gap-6">
        {/* ═══ FILTER + TABLE PANEL ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="glass-panel overflow-hidden"
        >
          <ClientFilterBar
            filterTab={filterTab}
            searchQuery={searchQuery}
            onFilterTabChange={setFilterTab}
            onSearchChange={setSearchQuery}
          />
          <ClientTable
            clients={visibleClients}
            totalCount={clients.length}
            isLoading={isLoading}
            isError={isError}
            error={error}
            searchQuery={searchQuery}
            filterTab={filterTab}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
            onCreate={openCreateModal}
          />
        </motion.div>
      </div>

      {/* ═══ FORM MODAL ═══ */}
      <ClientFormModal
        isOpen={showModal}
        editingClient={editingClient}
        isPending={isLoadingMutation}
        onSubmit={handleSubmit}
        onClose={() => { setShowModal(false); setEditingClient(null); }}
      />

      {/* ═══ DELETE IMPACT MODAL ═══ */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        icon={<AlertTriangle className="w-4 h-4 text-[var(--pm-accent-red)]" />}
        title="Impacto de Eliminación"
        description={deleteTarget?.client.name}
        confirmLabel={deleteTarget && (deleteTarget.barCount > 0 || deleteTarget.processCount > 0) ? 'Bloqueado' : 'Eliminar'}
        confirmIcon={<Trash2 className="w-3.5 h-3.5" />}
        variant="danger"
        disabled={!!deleteTarget && (deleteTarget.barCount > 0 || deleteTarget.processCount > 0)}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50">
            <div className="flex items-center gap-2 text-[var(--pm-text-dim)] text-[11px] font-mono mb-1">
              <Package className="w-3.5 h-3.5" />
              Barras asociadas
            </div>
            <span className={`text-lg font-mono font-bold ${deleteTarget && deleteTarget.barCount > 0 ? 'text-[var(--pm-accent-red)]' : 'text-[var(--pm-accent-emerald)]'}`}>
              {deleteTarget?.barCount || 0}
            </span>
            <span className="text-[11px] font-mono text-[var(--pm-text-dim)] ml-1">barras</span>
          </div>
          <div className="p-3 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50">
            <div className="flex items-center gap-2 text-[var(--pm-text-dim)] text-[11px] font-mono mb-1">
              <Layers className="w-3.5 h-3.5" />
              Procesos vinculados
            </div>
            <span className={`text-lg font-mono font-bold ${deleteTarget && deleteTarget.processCount > 0 ? 'text-[var(--pm-accent-red)]' : 'text-[var(--pm-accent-emerald)]'}`}>
              {deleteTarget?.processCount || 0}
            </span>
            <span className="text-[11px] font-mono text-[var(--pm-text-dim)] ml-1">procesos</span>
          </div>
        </div>
        <div className="p-3 rounded-lg border" style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <p className="text-[11px] font-mono text-[var(--pm-accent-red)] leading-relaxed">
            {deleteTarget && (deleteTarget.barCount > 0 || deleteTarget.processCount > 0)
              ? `Esta entidad tiene ${deleteTarget.barCount} barra${deleteTarget.barCount !== 1 ? 's' : ''} y ${deleteTarget.processCount} proceso${deleteTarget.processCount !== 1 ? 's' : ''} asociados. La eliminación no se completará hasta que se reasignen o eliminen estos registros.`
              : 'Esta entidad no tiene barras ni procesos asociados. Se puede eliminar de forma segura.'}
          </p>
        </div>
        <div className="flex justify-between items-center px-3 py-2 rounded-lg border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-[11px] font-mono">
          <span className="text-[var(--pm-text-dim)]">RIF:</span>
          <span className="text-[var(--pm-accent-gold)] font-bold">{deleteTarget ? formatRif(deleteTarget.client.rif) : ''}</span>
        </div>
      </ConfirmDialog>

      {/* ═══ DELETE STATUS OVERLAY ═══ */}
      <AnimatePresence>
        {deleteStatus !== 'idle' && (
          <motion.div
            key="delete-status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-xs glass-panel rounded-2xl overflow-hidden p-8 flex flex-col items-center gap-4"
            >
              {deleteStatus === 'deleting' ? (
                <>
                  <div className="w-10 h-10 border-2 border-[var(--pm-accent-red)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono text-[var(--pm-text-dim)]">Eliminando...</span>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.25)' }}>
                    <Check className="w-7 h-7 text-[var(--pm-accent-emerald)]" strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-sans font-bold text-[var(--pm-accent-emerald)]">Entidad Eliminada</span>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
