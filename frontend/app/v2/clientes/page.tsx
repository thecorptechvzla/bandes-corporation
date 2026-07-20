'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Users, Plus, Pencil, Trash2, AlertTriangle, Check,
  Search, Building2, Phone, Hash, Tags, X, AlertCircle,
  Package, Layers, Database,
} from 'lucide-react';
import type { Client, ClientRole } from '@/types/api';

type FilterTab = 'TODOS' | 'PROVEEDORES' | 'CLIENTES';

const ROLE_STYLES: Record<string, string> = {
  PROVEEDOR: 'text-sky-400 border-sky-500/25 bg-sky-500/10',
  CLIENTE: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10',
  AMBOS: 'text-purple-400 border-purple-500/25 bg-purple-500/10',
};

const ROLE_LABELS: Record<string, string> = {
  PROVEEDOR: 'Proveedor',
  CLIENTE: 'Cliente',
  AMBOS: 'Ambos',
};

function formatRif(raw: string) {
  if (raw.length !== 10) return raw;
  return `${raw[0]}-${raw.slice(1, 9)}-${raw[9]}`;
}

export default function V2ClientesPage() {
  const { data: clients = [], isLoading, isError, error } = useClients();
  const { data: bars = [] } = useBars();
  const { data: processes = [] } = useProcesses();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [rif, setRif] = useState('');
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [role, setRole] = useState<ClientRole>('PROVEEDOR');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ client: Client; barCount: number; processCount: number } | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success'>('idle');
  const [saving, setSaving] = useState(false);

  const rifRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal && rifRef.current) rifRef.current.focus();
  }, [showModal]);

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
    setRif('');
    setName('');
    setContactInfo('');
    setRole('PROVEEDOR');
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setRif(client.rif);
    setName(client.name);
    setContactInfo(client.contactInfo || '');
    setRole(client.role);
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setRif('');
    setName('');
    setContactInfo('');
    setRole('PROVEEDOR');
    setFormError('');
    setFormSuccess('');
  };

  const openDeleteModal = (client: Client) => {
    const barCount = bars.filter(b => b.clientId === client.id).length;
    const processCount = processes.filter(p => p.clientId === client.id).length;
    setDeleteTarget({ client, barCount, processCount });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const cleanRif = rif.replace(/^J/i, '').replace(/\D/g, '').slice(0, 9);
    if (!cleanRif || cleanRif.length < 9) {
      setFormError('El RIF debe contener exactamente 9 dígitos numéricos.');
      return;
    }
    if (!name.trim()) {
      setFormError('El nombre de la entidad es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      if (editingClient) {
        await updateClient.mutateAsync({
          id: editingClient.id,
          data: {
            rif: cleanRif,
            name: name.trim().toUpperCase(),
            contactInfo: contactInfo.trim() || undefined,
            role,
          },
        });
        setFormSuccess('Cliente actualizado correctamente.');
      } else {
        await createClient.mutateAsync({
          rif: cleanRif,
          name: name.trim().toUpperCase(),
          contactInfo: contactInfo.trim() || undefined,
          role,
        });
        setFormSuccess('Cliente registrado correctamente.');
      }
      setSaving(false);
      setTimeout(() => closeModal(), 1000);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Error al guardar el cliente.');
      setSaving(false);
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

  const handleRifInput = (val: string) => {
    const digits = val.replace(/^J/i, '').replace(/\D/g, '').slice(0, 9);
    setRif(digits);
    if (formError && digits.length > 0) setFormError('');
  };

  const displayedRif = (digits: string) => {
    const d = digits.replace(/\D/g, '');
    if (!d) return 'J-';
    return d.length < 9 ? `J-${d}` : `J-${d.slice(0, 8)}-${d[8]}`;
  };

  const isLoadingMutation = createClient.isPending || updateClient.isPending;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-semibold text-[var(--pm-text-primary)] font-sans flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[var(--pm-accent-gold)]" />
            Directorio <span className="text-[var(--pm-accent-gold)]">Comercial</span>
          </h1>
          <p className="text-xs text-[var(--pm-text-dim)] mt-1">
            Gestión centralizada de entidades y balances.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="premium-card px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2 active:scale-95 transition-all duration-150 cursor-pointer border-[var(--pm-accent-gold)]/30 hover:border-[var(--pm-accent-gold)]/60"
          style={{ background: 'rgba(212,175,55,0.08)' }}
        >
          <Plus className="w-4 h-4 text-[var(--pm-accent-gold)]" />
          <span style={{ color: 'var(--pm-accent-gold)' }}>Nuevo Registro</span>
        </button>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="premium-card overflow-hidden"
      >
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-[var(--pm-border)]">
          <div className="flex gap-1 bg-[var(--pm-bg-deepest)] p-0.5 rounded-lg border border-[var(--pm-border)]">
            {(['TODOS', 'PROVEEDORES', 'CLIENTES'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-bold transition-all active:scale-95 cursor-pointer ${
                  filterTab === tab
                    ? 'text-[var(--pm-accent-gold)] bg-[var(--pm-accent-gold)]/10 border border-[var(--pm-accent-gold)]/20'
                    : 'text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] border border-transparent'
                }`}
              >
                {tab === 'TODOS' ? 'Todos' : tab === 'CLIENTES' ? 'Clientes' : 'Proveedores'}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--pm-text-dim)]/40" />
            <input
              type="text"
              placeholder="Buscar por RIF o nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-60 bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] placeholder:text-[var(--pm-text-dim)]/30 transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--pm-text-dim)]">
            <div className="w-8 h-8 border-2 border-[var(--pm-accent-gold)] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-sm font-sans">Cargando directorio...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--pm-accent-red)]">
            <AlertTriangle className="w-8 h-8 mb-3" />
            <span className="text-sm font-sans">Error al cargar el directorio</span>
            <span className="text-xs text-[var(--pm-text-dim)] mt-1">
              {(error as any)?.message || 'Error de conexión'}
            </span>
          </div>
        ) : visibleClients.length === 0 ? (
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
                onClick={openCreateModal}
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
                {visibleClients.map((client, idx) => (
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
                          onClick={() => openEditModal(client)}
                          className="p-1.5 rounded hover:bg-[var(--pm-accent-gold)]/10 text-[var(--pm-text-dim)] hover:text-[var(--pm-accent-gold)] active:scale-90 transition-all cursor-pointer"
                          title="Editar entidad"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(client)}
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
                {visibleClients.length} entidad{visibleClients.length !== 1 ? 'es' : ''}
              </span>
              <span className="hidden sm:inline">
                {clients.filter(c => c.role === 'PROVEEDOR' || c.role === 'AMBOS').length} proveedores
              </span>
              <span className="hidden sm:inline">
                {clients.filter(c => c.role === 'CLIENTE' || c.role === 'AMBOS').length} clientes
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            key="form-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg glass-panel rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--pm-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
                    {editingClient ? <Pencil className="w-4 h-4 text-[var(--pm-accent-gold)]" /> : <Plus className="w-4 h-4 text-[var(--pm-accent-gold)]" />}
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-gold)] uppercase tracking-wider">
                      {editingClient ? 'Editar Entidad' : 'Nuevo Registro'}
                    </span>
                    <h3 className="text-sm font-sans font-semibold text-[var(--pm-text-primary)] mt-0.5">
                      {editingClient ? editingClient.name : 'Registrar Entidad Comercial'}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg hover:bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] active:scale-90 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* RIF */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
                    <Hash className="w-3 h-3" /> RIF
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[var(--pm-accent-gold)] select-none pointer-events-none">
                      J-
                    </span>
                    <input
                      ref={rifRef}
                      type="text"
                      inputMode="numeric"
                      maxLength={9}
                      placeholder="123456789"
                      value={rif.replace(/\D/g, '')}
                      onChange={(e) => handleRifInput(e.target.value)}
                      className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg pl-9 pr-3 py-2.5 text-xs font-mono text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30"
                      required
                    />
                  </div>
                  <span className="text-[9px] font-mono text-[var(--pm-text-dim)]">
                    {displayedRif(rif)} · {rif.replace(/\D/g, '').length}/9 dígitos
                  </span>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Nombre de la Entidad
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del cliente o proveedor"
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase())}
                    className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-sans text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors uppercase placeholder:text-[var(--pm-text-dim)]/30"
                    required
                  />
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
                    <Tags className="w-3 h-3" /> Tipo / Rol
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['PROVEEDOR', 'CLIENTE', 'AMBOS'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`px-3 py-2.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border transition-all active:scale-95 cursor-pointer ${
                          role === r
                            ? `${ROLE_STYLES[r]} bg-opacity-20`
                            : 'border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:border-[var(--pm-text-dim)]/30 hover:text-[var(--pm-text-primary)]'
                        }`}
                      >
                        {ROLE_LABELS[r]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Contacto <span className="opacity-40">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Teléfono, email o persona de contacto"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg px-3 py-2.5 text-xs font-sans text-[var(--pm-text-primary)] focus:outline-none focus:border-[var(--pm-accent-gold)] transition-colors placeholder:text-[var(--pm-text-dim)]/30"
                  />
                </div>

                {/* Messages */}
                {formError && (
                  <div className="flex items-center gap-2 p-3 bg-[var(--pm-accent-red)]/10 border border-[var(--pm-accent-red)]/25 rounded-lg text-[var(--pm-accent-red)] text-xs font-mono">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-[var(--pm-accent-emerald)]/10 border border-[var(--pm-accent-emerald)]/25 rounded-lg text-[var(--pm-accent-emerald)] text-xs font-mono">
                    <Check className="w-4 h-4 shrink-0" />
                    {formSuccess}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 px-4 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoadingMutation || saving}
                    className="flex-1 py-2.5 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))',
                      color: 'var(--pm-accent-gold)',
                      border: '1px solid rgba(212,175,55,0.3)',
                    }}
                  >
                    {saving || isLoadingMutation
                      ? 'Guardando...'
                      : editingClient
                        ? 'Actualizar'
                        : 'Registrar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Impact Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            key="delete-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md glass-panel rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-5">
                {/* Icon + Title */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <AlertTriangle className="w-5 h-5 text-[var(--pm-accent-red)]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold text-[var(--pm-accent-red)] uppercase tracking-wider bg-[var(--pm-accent-red)]/10 px-2 py-0.5 rounded border border-[var(--pm-accent-red)]/20">
                      Impacto de Eliminación
                    </span>
                    <h3 className="text-sm font-sans font-bold text-[var(--pm-text-primary)] mt-1">
                      {deleteTarget.client.name}
                    </h3>
                  </div>
                </div>

                {/* Impact details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50">
                    <div className="flex items-center gap-2 text-[var(--pm-text-dim)] text-[10px] font-mono mb-1">
                      <Package className="w-3.5 h-3.5" />
                      Barras asociadas
                    </div>
                    <span className={`text-lg font-mono font-bold ${deleteTarget.barCount > 0 ? 'text-[var(--pm-accent-red)]' : 'text-[var(--pm-accent-emerald)]'}`}>
                      {deleteTarget.barCount}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--pm-text-dim)] ml-1">barras</span>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50">
                    <div className="flex items-center gap-2 text-[var(--pm-text-dim)] text-[10px] font-mono mb-1">
                      <Layers className="w-3.5 h-3.5" />
                      Procesos vinculados
                    </div>
                    <span className={`text-lg font-mono font-bold ${deleteTarget.processCount > 0 ? 'text-[var(--pm-accent-red)]' : 'text-[var(--pm-accent-emerald)]'}`}>
                      {deleteTarget.processCount}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--pm-text-dim)] ml-1">procesos</span>
                  </div>
                </div>

                {/* Warning */}
                <div className="p-3 rounded-lg border" style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}>
                  <p className="text-[10px] font-mono text-[var(--pm-accent-red)] leading-relaxed">
                    {deleteTarget.barCount > 0 || deleteTarget.processCount > 0
                      ? `Esta entidad tiene ${deleteTarget.barCount} barra${deleteTarget.barCount !== 1 ? 's' : ''} y ${deleteTarget.processCount} proceso${deleteTarget.processCount !== 1 ? 's' : ''} asociados. La eliminación no se completará hasta que se reasignen o eliminen estos registros.`
                      : 'Esta entidad no tiene barras ni procesos asociados. Se puede eliminar de forma segura.'}
                  </p>
                </div>

                {/* RIF summary */}
                <div className="flex justify-between items-center px-3 py-2 rounded-lg border border-[var(--pm-border)] bg-[var(--pm-bg-deepest)]/50 text-[10px] font-mono">
                  <span className="text-[var(--pm-text-dim)]">RIF:</span>
                  <span className="text-[var(--pm-accent-gold)] font-bold">{formatRif(deleteTarget.client.rif)}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 py-2.5 px-4 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteTarget.barCount > 0 || deleteTarget.processCount > 0}
                    className="flex-1 py-2.5 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: deleteTarget.barCount > 0 || deleteTarget.processCount > 0
                        ? 'rgba(239,68,68,0.08)'
                        : 'rgba(239,68,68,0.15)',
                      color: 'var(--pm-accent-red)',
                      border: '1px solid rgba(239,68,68,0.3)',
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                    {deleteTarget.barCount > 0 || deleteTarget.processCount > 0
                      ? 'Bloqueado'
                      : 'Eliminar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete status overlay */}
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
