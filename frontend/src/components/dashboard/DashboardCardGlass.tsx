'use client';

import React from 'react';

interface DashboardCardGlassProps {
  children: React.ReactNode;
}

export function DashboardCardGlass({ children }: DashboardCardGlassProps) {
  return (
    <section className="relative h-[400px] overflow-hidden rounded-2xl bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl border border-white/10">
      {/* Resplandor difuminado superior */}
      <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-3/4 -translate-x-1/2 rounded-full bg-gold-500/10 blur-[80px]" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-4">
          <h3 className="font-mono text-[11px] font-bold tracking-wider uppercase text-slate-200">
            ↗ FLUJO DE MATERIAL (30 DÍAS)
          </h3>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </section>
  );
}