'use client';

import { cn } from '@/lib/utils';

interface HudCardProps {
  title: string;
  value: string;
  subtitle?: string;
  accent?: 'amber' | 'success' | 'danger';
  className?: string;
}

export function HudCard({ title, value, subtitle, accent = 'amber', className }: HudCardProps) {
  const accentStyles: Record<string, string> = {
    amber: 'neon-border-amber',
    success: 'border-hud-success/40 shadow-[0_0_4px_#22c55e20]',
    danger: 'border-hud-danger/40 shadow-[0_0_4px_#ef444420]',
  };

  const textStyles: Record<string, string> = {
    amber: 'text-hud-amber',
    success: 'text-hud-success',
    danger: 'text-hud-danger',
  };

  return (
    <div
      className={cn(
        'relative scan-line bg-hud-surface p-4 overflow-hidden clip-tactical',
        accentStyles[accent],
        className,
      )}
    >
      <p className="text-[11px] text-hud-muted tracking-wider mb-1">
        {title.toUpperCase()}
      </p>
      <p className={cn('text-2xl font-bold tracking-tight', textStyles[accent])}>
        {value}
      </p>
      {subtitle && (
        <p className="text-[10px] text-hud-muted mt-1">{subtitle}</p>
      )}
    </div>
  );
}
