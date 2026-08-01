'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Pencil, Hash, Building2, Tags, Phone,
  Check, AlertCircle, X,
} from 'lucide-react';
import type { Client, ClientRole } from '@/types/api';
import { formatRifDisplay, sanitizeRifInput } from '@/lib/format';

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

interface ClientFormModalProps {
  isOpen: boolean;
  editingClient: Client | null;
  isPending: boolean;
  onSubmit: (data: { rif: string; name: string; contactInfo?: string; role: ClientRole; id?: string }) => Promise<void>;
  onClose: () => void;
}

export function ClientFormModal({ isOpen, editingClient, isPending, onSubmit, onClose }: ClientFormModalProps) {
  const [rif, setRif] = useState('');
  const [name, setName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [role, setRole] = useState<ClientRole>('PROVEEDOR');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const rifRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && rifRef.current) rifRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (editingClient) {
        setRif(editingClient.rif);
        setName(editingClient.name);
        setContactInfo(editingClient.contactInfo || '');
        setRole(editingClient.role);
      } else {
        setRif('');
        setName('');
        setContactInfo('');
        setRole('PROVEEDOR');
      }
      setFormError('');
      setFormSuccess('');
    }
  }, [isOpen, editingClient]);

  const handleRifInput = (val: string) => {
    const digits = sanitizeRifInput(val);
    setRif(digits);
    if (formError && digits.length > 0) setFormError('');
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
      await onSubmit({
        rif: cleanRif,
        name: name.trim().toUpperCase(),
        contactInfo: contactInfo.trim() || undefined,
        role,
        id: editingClient?.id,
      });
      setFormSuccess(editingClient ? 'Cliente actualizado correctamente.' : 'Cliente registrado correctamente.');
      setSaving(false);
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Error al guardar el cliente.');
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            {/* ═══ HEADER ═══ */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--pm-border)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  {editingClient ? <Pencil className="w-4 h-4 text-[var(--pm-accent-gold)]" /> : <Plus className="w-4 h-4 text-[var(--pm-accent-gold)]" />}
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-[var(--pm-accent-gold)] uppercase tracking-wider">
                    {editingClient ? 'Editar Entidad' : 'Nuevo Registro'}
                  </span>
                  <h3 className="text-sm font-sans font-semibold text-[var(--pm-text-primary)] mt-0.5">
                    {editingClient ? editingClient.name : 'Registrar Entidad Comercial'}
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[var(--pm-bg-tertiary)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] active:scale-90 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ═══ FORM BODY ═══ */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* RIF */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
                  <Hash className="w-3 h-3" /> RIF
                </label>
                <div className="flex items-center w-full bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg overflow-hidden transition-colors focus-within:border-[var(--pm-accent-gold)]">
                  <div className="pl-3 flex items-center justify-center">
                    <span className="text-xs font-mono font-bold text-[var(--pm-accent-gold)] select-none pointer-events-none">
                      J-
                    </span>
                  </div>
                  <input
                    ref={rifRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="123456789"
                    value={rif.replace(/\D/g, '')}
                    onChange={(e) => handleRifInput(e.target.value)}
                    className="flex-1 bg-transparent py-2.5 px-3 outline-none text-xs font-mono text-[var(--pm-text-primary)] placeholder:text-[var(--pm-text-dim)]/30"
                    required
                  />
                </div>
                <span className="text-[10px] font-mono text-[var(--pm-text-dim)]">
                  {formatRifDisplay(rif)} · {rif.replace(/\D/g, '').length}/9 dígitos
                </span>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Nombre de la Entidad
                </label>
                <input
                  type="text"
                  placeholder="Nombre del cliente o proveedor"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  className="pm-input font-sans uppercase"
                  required
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
                  <Tags className="w-3 h-3" /> Tipo / Rol
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PROVEEDOR', 'CLIENTE', 'AMBOS'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`pm-badge justify-center py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                        role === r
                          ? ROLE_BADGE_CLASS[r]
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
                <label className="text-[11px] font-mono text-[var(--pm-text-dim)] uppercase tracking-wider flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Contacto <span className="opacity-40">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Teléfono, email o persona de contacto"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="pm-input font-sans"
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
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || saving}
                  className="flex-1 py-2.5 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.1))',
                    color: 'var(--pm-accent-gold)',
                    border: '1px solid rgba(212,175,55,0.3)',
                  }}
                >
                  {saving || isPending
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
  );
}
