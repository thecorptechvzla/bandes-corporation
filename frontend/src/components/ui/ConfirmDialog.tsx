'use client';

import React from 'react';
import { ModalShell } from './ModalShell';

type ConfirmVariant = 'danger' | 'success' | 'warning' | 'info';

const VARIANT_STYLES: Record<ConfirmVariant, { bg: string; border: string; text: string; btnBg: string; btnBorder: string }> = {
  danger:  { bg: 'rgba(239,68,68,0.1)',  border: '1px solid rgba(239,68,68,0.25)',  text: 'var(--pm-accent-red)',    btnBg: 'rgba(239,68,68,0.15)',  btnBorder: '1px solid rgba(239,68,68,0.3)' },
  success: { bg: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', text: 'var(--pm-accent-emerald)', btnBg: 'rgba(16,185,129,0.15)', btnBorder: '1px solid rgba(16,185,129,0.3)' },
  warning: { bg: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', text: 'var(--pm-accent-amber)',  btnBg: 'rgba(245,158,11,0.15)', btnBorder: '1px solid rgba(245,158,11,0.3)' },
  info:    { bg: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', text: 'var(--pm-accent-cyan)',   btnBg: 'rgba(56,189,248,0.15)', btnBorder: '1px solid rgba(56,189,248,0.3)' },
};

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  icon: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmIcon?: React.ReactNode;
  variant?: ConfirmVariant;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  children?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  icon,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmIcon,
  variant = 'danger',
  loading = false,
  disabled = false,
  size = 'sm',
  children,
}: ConfirmDialogProps) {
  const v = VARIANT_STYLES[variant];

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      noHeader
      noPadding
      size={size}
      closeOnBackdrop={!loading}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: v.bg, border: v.border }}>
            {icon}
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: v.text }}>
              {title}
            </span>
            {description && (
              <p className="text-xs font-sans font-semibold text-[var(--pm-text-primary)] mt-0.5">{description}</p>
            )}
          </div>
        </div>

        {children}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg border border-[var(--pm-border)] text-[var(--pm-text-dim)] hover:text-[var(--pm-text-primary)] hover:bg-[var(--pm-bg-tertiary)] text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled || loading}
            className="flex-1 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            style={{ background: v.btnBg, color: v.text, border: v.btnBorder }}
          >
            {confirmIcon}
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
