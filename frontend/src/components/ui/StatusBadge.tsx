import React from 'react';

type BadgeType = 'bar' | 'packing';
type BadgeSize = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
  status: string;
  type?: BadgeType;
  size?: BadgeSize;
  className?: string;
}

const BAR_STATUS_LABELS: Record<string, string> = {
  POR_VALIDAR: 'POR VALIDAR',
  IN_STOCK: 'VALIDADO',
  PROCESANDO: 'EN PROCESO',
  COMPLETADO: 'VALIDADO',
  EXITED: 'EGRESADO',
};

const BAR_STATUS_STYLES: Record<string, string> = {
  POR_VALIDAR: 'text-[var(--hud-accent-amber)] bg-[var(--hud-accent-amber)]/10 border-[var(--hud-accent-amber)]/25',
  IN_STOCK: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  PROCESANDO: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
  COMPLETADO: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  EXITED: 'text-[var(--hud-text-dim)] bg-[var(--hud-bg-hover)] border-[var(--hud-border)]',
};

const PACKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'PENDIENTE',
  VALIDATED: 'VALIDADO',
};

const PACKING_STATUS_STYLES: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  VALIDATED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-[11px]',
  lg: 'px-2.5 py-1 text-[11px]',
};

export function StatusBadge({ status, type = 'bar', size = 'md', className = '' }: StatusBadgeProps) {
  const labels = type === 'packing' ? PACKING_STATUS_LABELS : BAR_STATUS_LABELS;
  const styles = type === 'packing' ? PACKING_STATUS_STYLES : BAR_STATUS_STYLES;

  const label = labels[status] ?? status;
  const style = styles[status] ?? '';

  return (
    <span className={`inline-flex items-center gap-1 font-mono font-bold border rounded ${sizeClasses[size]} ${style} ${className}`}>
      {label}
    </span>
  );
}
