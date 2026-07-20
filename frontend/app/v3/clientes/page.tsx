'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from '@/hooks/useClients';
import { TacticalCard } from '@/components/tactical/TacticalCard';
import { ScannerTable, type ColumnDef } from '@/components/tactical/ScannerTable';
import { TerminalPanel } from '@/components/tactical/TerminalPanel';
import { HudButton } from '@/components/tactical/HudButton';
import { Search, Pencil, Trash2, UserPlus, Check } from 'lucide-react';
import type { Client } from '@/types/api';

type ShellStep = 'RIF' | 'NAME' | 'ROLE' | 'CONTACT' | 'CONFIRM';
type FilterTab = 'TODOS' | 'PROVEEDORES' | 'CLIENTES';

const ROL_ICONS: Record<string, string> = {
  PROVEEDOR: '\u2B06',
  CLIENTE: '\u2B07',
  AMBOS: '\u27F3',
};

const ROL_COLORS: Record<string, string> = {
  PROVEEDOR: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  CLIENTE: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  AMBOS: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
};

const ROL_LABELS: Record<string, string> = {
  PROVEEDOR: 'PROVEEDOR',
  CLIENTE: 'CLIENTE',
  AMBOS: 'AMBOS',
};

function formatRif(raw: string) {
  if (raw.length !== 10) return raw;
  return `${raw[0]}-${raw.slice(1, 9)}-${raw[9]}`;
}

export default function TacticalClientesPage() {
  const { data: clients = [], isLoading, isError, error } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [showTerminal, setShowTerminal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [step, setStep] = useState<ShellStep>('RIF');
  const [rif, setRif] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'PROVEEDOR' | 'CLIENTE' | 'AMBOS'>('PROVEEDOR');
  const [contact, setContact] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');
  const [registering, setRegistering] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showTerminal && inputRef.current) inputRef.current.focus();
  }, [showTerminal, step]);

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

  const openTerminal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setRif(client.rif.replace(/^J/, '').replace(/\D/g, ''));
      setName(client.name);
      setRole(client.role as any);
      setContact(client.contactInfo || '');
      setStep('CONFIRM');
    } else {
      setEditingClient(null);
      setRif('');
      setName('');
      setRole('PROVEEDOR');
      setContact('');
      setStep('RIF');
    }
    setFormError('');
    setFormSuccess('');
    setShowTerminal(true);
  };

  const closeTerminal = () => {
    setShowTerminal(false);
    setEditingClient(null);
    setStep('RIF');
    setRif('');
    setName('');
    setRole('PROVEEDOR');
    setContact('');
    setFormError('');
    setFormSuccess('');
  };

  const advanceStep = () => {
    if (step === 'RIF' && rif.replace(/\D/g, '').length < 9) {
      setFormError('El RIF debe tener exactamente 9 dígitos numéricos.');
      return;
    }
    setFormError('');
    if (step === 'RIF') setStep('NAME');
    else if (step === 'NAME') setStep('ROLE');
    else if (step === 'ROLE') setStep('CONTACT');
    else if (step === 'CONTACT') setStep('CONFIRM');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step !== 'CONFIRM') advanceStep();
    if (e.key === 'Escape') closeTerminal();
  };

  const handleRifChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 9);
    setRif(digits);
    if (formError && digits.length === 9) setFormError('');
  };

  const handleNameChange = (val: string) => {
    setName(val.toUpperCase());
  };

  const handleRoleSelect = (r: 'PROVEEDOR' | 'CLIENTE' | 'AMBOS') => {
    setRole(r);
    setStep('CONTACT');
  };

  const handleSubmit = async () => {
    setFormError('');
    setRegistering(true);
    try {
      const safeRif = rif.replace(/\D/g, '').slice(0, 9);
      if (editingClient) {
        await updateClient.mutateAsync({
          id: editingClient.id,
          data: {
            rif: safeRif,
            name: name.trim(),
            contactInfo: contact.trim() || undefined,
            role: role,
          },
        });
        setFormSuccess('EXPEDIENTE ACTUALIZADO');
      } else {
        await createClient.mutateAsync({
          rif: safeRif,
          name: name.trim(),
          contactInfo: contact.trim() || undefined,
          role: role,
        });
        setFormSuccess('EXPEDIENTE CREADO');
      }
      setRegistering(false);
      setTimeout(() => { closeTerminal(); setFormSuccess(''); }, 1200);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'ERROR AL GUARDAR EXPEDIENTE');
      setRegistering(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null);
    setDeleteStatus('deleting');
    try {
      await deleteClient.mutateAsync(id);
      setDeleteStatus('success');
      setTimeout(() => setDeleteStatus('idle'), 2000);
    } catch {
      setDeleteStatus('error');
      setTimeout(() => setDeleteStatus('idle'), 2000);
    }
  };

  const formattedRif = (digits: string) => {
    const d = digits.replace(/\D/g, '');
    return d.length === 0 ? 'J-·········' : `J-${d.slice(0, 8)}${d.length > 8 ? `-${d[8]}` : ''}`;
  };

  const columns: ColumnDef<Client>[] = [
    {
      key: 'rif',
      label: 'RIF',
      align: 'center',
      width: '140px',
      render: r => (
        <span className="font-mono font-bold text-[var(--tac-accent-cyan)] tracking-wider">
          {formatRif(r.rif)}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'NOMBRE',
      render: r => <span className="font-bold text-[var(--tac-text-primary)]">{r.name}</span>,
    },
    {
      key: 'role',
      label: 'ROL',
      align: 'center',
      width: '120px',
      render: r => (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold border ${ROL_COLORS[r.role] || ''}`}>
          {ROL_ICONS[r.role] || ''} {ROL_LABELS[r.role] || r.role}
        </span>
      ),
    },
    {
      key: 'contact',
      label: 'CONTACTO',
      render: r => (
        <span className="text-[var(--tac-text-dim)]">
          {r.contactInfo || <span className="opacity-40">&mdash;</span>}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      align: 'center',
      width: '90px',
      render: () => (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--tac-accent-green)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--tac-accent-green)] animate-pulse" />
          ACTIVO
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      align: 'center',
      width: '90px',
      render: r => (
        <div className="flex items-center justify-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); openTerminal(r); }}
            className="p-1 text-[var(--tac-text-dim)] hover:text-[var(--tac-accent-cyan)] active:scale-90 transition-all"
            title="Editar expediente"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(r.id); }}
            className="p-1 text-[var(--tac-text-dim)] hover:text-[var(--tac-accent-red)] active:scale-90 transition-all"
            title="Eliminar expediente"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

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
          <span className="text-[9px] font-mono font-bold text-[var(--tac-accent-cyan)] uppercase tracking-[0.2em]">
            {'>'} Proveedores — INTEL TERMINAL
          </span>
          <p className="text-[10px] font-mono text-[var(--tac-text-dim)] mt-1">
            GESTIÓN DE EXPEDIENTES DE CLIENTES Y PROVEEDORES
          </p>
        </div>
        <HudButton
          variant="primary"
          prefix=">"
          onClick={() => showTerminal ? closeTerminal() : openTerminal()}
          className="shrink-0 self-start sm:self-center"
        >
          <UserPlus className="w-3.5 h-3.5" />
          {showTerminal ? 'CERRAR TERMINAL' : 'NUEVO EXPEDIENTE'}
        </HudButton>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Terminal Panel */}
        <AnimatePresence>
          {showTerminal && (
            <motion.div
              key="terminal-panel"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="lg:col-span-2 space-y-4"
            >
              <TerminalPanel
                title={editingClient ? `EDITAR: ${editingClient.name}` : 'REGISTRO NUEVO EXPEDIENTE'}
                accent={formError ? 'red' : 'cyan'}
              >
                <div className="space-y-3" onKeyDown={handleKeyDown}>
                  {/* RIF Step */}
                  <div>
                    <div className={`transition-opacity ${step === 'RIF' ? 'opacity-100' : 'opacity-40'}`}>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-[var(--tac-text-dim)]">IDENTIFICACIÓN_RIF</span>
                        <span className="text-[var(--tac-accent-cyan)]">&gt;</span>
                        {step === 'RIF' ? (
                          <div className="relative flex-1">
                            <span className="text-[var(--tac-accent-cyan)] font-bold">J-</span>
                            <input
                              ref={inputRef}
                              type="text"
                              maxLength={9}
                              value={rif}
                              onChange={(e) => handleRifChange(e.target.value)}
                              className="w-28 bg-transparent border-b border-[var(--tac-accent-cyan)]/40 text-[var(--tac-text-primary)] font-mono text-[11px] focus:outline-none focus:border-[var(--tac-accent-cyan)] px-1 pb-0.5"
                              placeholder="123456789"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span className="text-[var(--tac-accent-cyan)] font-bold">
                            {formattedRif(rif)}
                          </span>
                        )}
                      </div>
                      {step === 'RIF' && (
                        <span className="text-[8px] font-mono text-[var(--tac-text-dim)] ml-[188px] block">
                          {rif.length}/9 DÍGITOS {rif.length === 9 ? '✓' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* NAME Step */}
                  {step !== 'RIF' && (
                    <div className={`transition-opacity ${step === 'NAME' ? 'opacity-100' : 'opacity-40'}`}>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-[var(--tac-text-dim)]">NOMBRE_ENTIDAD</span>
                        <span className="text-[var(--tac-accent-cyan)]">&gt;</span>
                        {step === 'NAME' ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            className="flex-1 bg-transparent border-b border-[var(--tac-accent-cyan)]/40 text-[var(--tac-text-primary)] font-mono text-[11px] focus:outline-none focus:border-[var(--tac-accent-cyan)] px-1 pb-0.5 uppercase"
                            placeholder="NOMBRE DEL CLIENTE"
                            autoFocus
                          />
                        ) : (
                          <span className="text-[var(--tac-text-primary)]">{name || '—'}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ROLE Step */}
                  {step !== 'RIF' && step !== 'NAME' && (
                    <div className={`transition-opacity ${step === 'ROLE' ? 'opacity-100' : 'opacity-40'}`}>
                      <div className="flex items-center gap-2 text-[11px] font-mono mb-2">
                        <span className="text-[var(--tac-text-dim)]">ASIGNAR_ROL</span>
                        <span className="text-[var(--tac-accent-cyan)]">&gt;</span>
                        {step !== 'ROLE' && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold border ${ROL_COLORS[role]}`}>
                            {ROL_ICONS[role]} {ROL_LABELS[role]}
                          </span>
                        )}
                      </div>
                      {step === 'ROLE' && (
                        <div className="flex gap-2">
                          {(['PROVEEDOR', 'CLIENTE', 'AMBOS'] as const).map(r => (
                            <HudButton
                              key={r}
                              variant={role === r ? 'primary' : 'ghost'}
                              onClick={() => handleRoleSelect(r)}
                              className="flex-1 text-[9px]"
                            >
                              {ROL_ICONS[r]} {r.slice(0, 4)}
                            </HudButton>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONTACT Step */}
                  {step !== 'RIF' && step !== 'NAME' && step !== 'ROLE' && (
                    <div className={`transition-opacity ${step === 'CONTACT' ? 'opacity-100' : 'opacity-40'}`}>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-[var(--tac-text-dim)]">CONTACTO</span>
                        <span className="text-[var(--tac-text-dim)]/50">(OPCIONAL)</span>
                        <span className="text-[var(--tac-accent-cyan)]">&gt;</span>
                        {step === 'CONTACT' ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            className="flex-1 bg-transparent border-b border-[var(--tac-accent-cyan)]/40 text-[var(--tac-text-primary)] font-mono text-[11px] focus:outline-none focus:border-[var(--tac-accent-cyan)] px-1 pb-0.5"
                            placeholder="TELÉFONO / EMAIL"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') advanceStep(); }}
                          />
                        ) : (
                          <span className="text-[var(--tac-text-dim)]">{contact || '—'}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CONFIRM Step */}
                  {step === 'CONFIRM' && (
                    <div className="space-y-3 pt-2 border-t border-[var(--tac-border)]">
                      <div className="text-[9px] font-mono text-[var(--tac-text-dim)] uppercase tracking-[0.12em]">
                        RESUMEN DEL EXPEDIENTE
                      </div>
                      <div className="space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-[var(--tac-text-dim)]">RIF:</span>
                          <span className="text-[var(--tac-accent-cyan)] font-bold">
                            {formattedRif(rif)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--tac-text-dim)]">NOMBRE:</span>
                          <span className="text-[var(--tac-text-primary)] font-bold">{name || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--tac-text-dim)]">ROL:</span>
                          <span className={`px-2 text-[9px] font-mono font-bold border ${ROL_COLORS[role]}`}>
                            {ROL_ICONS[role]} {ROL_LABELS[role]}
                          </span>
                        </div>
                        {contact && (
                          <div className="flex justify-between">
                            <span className="text-[var(--tac-text-dim)]">CONTACTO:</span>
                            <span className="text-[var(--tac-text-primary)]">{contact}</span>
                          </div>
                        )}
                      </div>

                      {formError && (
                        <div className="p-2 border border-[var(--tac-accent-red)]/40 text-[var(--tac-accent-red)] text-[9px] font-mono">
                          ! {formError}
                        </div>
                      )}

                      {formSuccess && (
                        <div className="p-2 border border-[var(--tac-accent-green)]/40 text-[var(--tac-accent-green)] text-[9px] font-mono flex items-center gap-1">
                          <Check className="w-3 h-3" /> {formSuccess}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <HudButton variant="ghost" onClick={closeTerminal} className="flex-1">
                          CANCELAR
                        </HudButton>
                        <HudButton
                          variant="primary"
                          prefix=">"
                          loading={registering}
                          onClick={handleSubmit}
                          className="flex-1"
                        >
                          {editingClient ? 'ACTUALIZAR' : 'EJECUTAR REGISTRO'}
                        </HudButton>
                      </div>
                    </div>
                  )}

                  {/* Navigation hint for non-confirm steps */}
                  {step !== 'CONFIRM' && (
                    <div className="flex justify-end pt-1">
                      <HudButton variant="ghost" onClick={advanceStep} disabled={step === 'ROLE'} className="text-[9px]">
                        SIGUIENTE &gt;&gt;
                      </HudButton>
                    </div>
                  )}
                </div>
              </TerminalPanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanner Table */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className={`${showTerminal ? 'lg:col-span-3' : 'lg:col-span-5'} space-y-4`}
        >
          <TacticalCard title={`EXPEDIENTES — ${visibleClients.length} REGISTROS`} accent="cyan">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex gap-1">
                {(['TODOS', 'PROVEEDORES', 'CLIENTES'] as const).map(tab => (
                  <HudButton
                    key={tab}
                    variant={filterTab === tab ? 'primary' : 'ghost'}
                    onClick={() => setFilterTab(tab)}
                    className="text-[8px] px-2 py-1"
                  >
                    {tab === 'TODOS' ? 'TODOS' : tab === 'PROVEEDORES' ? '⬆ PROV' : '⬇ CLI'}
                  </HudButton>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-[var(--tac-text-dim)]/40" />
                <input
                  type="text"
                  placeholder="BUSCAR POR RIF O NOMBRE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-56 bg-[var(--tac-bg-primary)] border border-[var(--tac-border)] pl-8 pr-2 py-1.5 text-[10px] font-mono text-[var(--tac-text-primary)] focus:outline-none focus:border-[var(--tac-accent-cyan)] placeholder:text-[var(--tac-text-dim)]/30"
                />
              </div>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-[var(--tac-text-dim)]">
                <span className="w-2 h-2 rounded-full bg-[var(--tac-accent-amber)] animate-pulse mb-2" />
                <span className="text-[10px] font-mono">CARGANDO DIRECTORIO...</span>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-12 border border-[var(--tac-accent-red)]/30 text-[var(--tac-accent-red)]">
                <span className="text-[10px] font-mono">ERROR DE CARGA</span>
                <span className="text-[9px] font-mono text-[var(--tac-text-dim)] mt-1">
                  {(error as any)?.message || 'ERROR DE CONEXIÓN'}
                </span>
              </div>
            ) : (
              <ScannerTable
                columns={columns}
                data={visibleClients}
                keyExtractor={r => r.id}
                emptyMessage={
                  searchQuery
                    ? 'NO SE ENCONTRARON COINCIDENCIAS'
                    : 'NO HAY EXPEDIENTES REGISTRADOS'
                }
              />
            )}
          </TacticalCard>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (() => {
          const target = clients.find(c => c.id === confirmDeleteId);
          if (!target) return null;
          return (
            <motion.div
              key="delete-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md"
              >
                <TacticalCard accent="red" className="shadow-[0_0_40px_rgba(255,51,85,0.12)]">
                  <div className="space-y-4 text-center">
                    <div className="w-10 h-10 mx-auto border-2 border-[var(--tac-accent-red)] flex items-center justify-center">
                      <span className="text-[var(--tac-accent-red)] font-mono font-bold text-lg">!</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-bold text-[var(--tac-accent-red)] uppercase tracking-[0.15em]">
                        ADVERTENCIA DE SEGURIDAD
                      </span>
                      <h3 className="text-sm font-mono font-bold text-[var(--tac-text-primary)] mt-1">
                        ELIMINACIÓN DE EXPEDIENTE PERMANENTE
                      </h3>
                    </div>
                    <div className="bg-[var(--tac-bg-primary)] p-3 space-y-1 text-[10px] font-mono text-left">
                      <div className="flex justify-between">
                        <span className="text-[var(--tac-text-dim)]">CLIENTE:</span>
                        <span className="text-[var(--tac-text-primary)] font-bold">{target.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--tac-text-dim)]">RIF:</span>
                        <span className="text-[var(--tac-accent-cyan)] font-bold">{formatRif(target.rif)}</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-mono text-[var(--tac-text-dim)] leading-relaxed">
                      Esta acción no se puede deshacer. Solo se eliminará si no tiene barras en el historial.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <HudButton variant="ghost" onClick={() => setConfirmDeleteId(null)} className="flex-1">
                        CANCELAR
                      </HudButton>
                      <HudButton variant="danger" prefix="!" onClick={() => handleDelete(confirmDeleteId)} className="flex-1">
                        CONFIRMAR
                      </HudButton>
                    </div>
                  </div>
                </TacticalCard>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Delete status overlay */}
      <AnimatePresence>
        {deleteStatus !== 'idle' && (
          <motion.div
            key="delete-status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm"
            >
              <TacticalCard accent={deleteStatus === 'deleting' ? 'amber' : deleteStatus === 'success' ? 'green' : 'red'}>
                <div className="flex flex-col items-center py-4 space-y-3">
                  {deleteStatus === 'deleting' && (
                    <>
                      <span className="w-8 h-8 border-2 border-[var(--tac-accent-amber)] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-mono text-[var(--tac-text-dim)]">ELIMINANDO EXPEDIENTE...</span>
                    </>
                  )}
                  {deleteStatus === 'success' && (
                    <>
                      <Check className="w-8 h-8 text-[var(--tac-accent-green)]" />
                      <span className="text-[10px] font-mono text-[var(--tac-accent-green)]">EXPEDIENTE ELIMINADO</span>
                    </>
                  )}
                  {deleteStatus === 'error' && (
                    <>
                      <span className="text-[var(--tac-accent-red)] font-mono font-bold text-lg">!</span>
                      <span className="text-[10px] font-mono text-[var(--tac-accent-red)]">ERROR AL ELIMINAR</span>
                    </>
                  )}
                </div>
              </TacticalCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System status */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="flex items-center gap-3 text-[8px] font-mono text-[var(--tac-text-dim)] border-t border-[var(--tac-border)] pt-3"
      >
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-[var(--tac-accent-green)] animate-pulse" />
          DB ONLINE
        </span>
        <span>{clients.length} EXPEDIENTES ACTIVOS</span>
        {clients.filter(c => c.role === 'PROVEEDOR' || c.role === 'AMBOS').length > 0 && (
          <span>{clients.filter(c => c.role === 'PROVEEDOR' || c.role === 'AMBOS').length} PROVEEDORES</span>
        )}
        {clients.filter(c => c.role === 'CLIENTE' || c.role === 'AMBOS').length > 0 && (
          <span>{clients.filter(c => c.role === 'CLIENTE' || c.role === 'AMBOS').length} CLIENTES</span>
        )}
      </motion.div>
    </motion.div>
  );
}
