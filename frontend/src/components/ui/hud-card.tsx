'use client';

import { cn } from '@/lib/utils';

interface HudCardProps {
  title: string;
  value: string;
  subtitle?: string;
  accent?: 'gold' | 'blue' | 'success' | 'danger';
  className?: string;
}

export function HudCard({ title, value, subtitle, accent = 'gold', className }: HudCardProps) {
  const accentBorder = {
    gold: 'neon-border-gold',
    blue: 'neon-border-blue',
    success: 'border-hud-success/40 shadow-[0_0_4px_#22c55e20]',
    danger: 'border-hud-danger/40 shadow-[0_0_4px_#ef444420]',
  };

  return (
    <div
      className={cn(
        'relative scan-line bg-hud-surface rounded p-4 overflow-hidden',
        accentBorder[accent],
        className,
      )}
    >
      <p className="text-[11px] text-hud-muted tracking-wider mb-1">
        {title.toUpperCase()}
      </p>
      <p className={cn(
        'text-2xl font-bold tracking-tight',
        accent === 'gold' && 'text-hud-gold',
        accent === 'blue' && 'text-hud-blue',
        accent === 'success' && 'text-hud-success',
        accent === 'danger' && 'text-hud-danger',
      )}>
        {value}
      </p>
      {subtitle && (
        <p className="text-[10px] text-hud-muted mt-1">{subtitle}</p>
      )}
    </div>
  );
}
