import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-[var(--pm-text-dim)] ${className}`}>
      {icon}
      <span className="text-xs font-mono">{title}</span>
      {description && (
        <p className="text-[11px] font-mono text-[var(--pm-text-dim)]">{description}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="text-[11px] font-bold font-mono text-[var(--pm-accent-gold)] hover:underline cursor-pointer">
          {action.label}
        </button>
      )}
    </div>
  );
}
