'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Terminal, PackageCheck, Truck, ArrowRightLeft, Circle } from 'lucide-react';
import type { Bar, MaterialExit, Process } from '@/types/api';
import { formatNumber } from '@/lib/format';

interface ActivityTerminalProps {
  bars: Bar[];
  exits: MaterialExit[];
  processes: Process[];
}

type ActivityKind = 'ingreso' | 'fundido' | 'despacho';

interface Activity {
  id: string;
  kind: ActivityKind;
  label: string;
  detail: string;
  weight: number;
  timestamp: Date;
}

function kindConfig(kind: ActivityKind) {
  switch (kind) {
    case 'ingreso':
      return { icon: PackageCheck, color: '#10B981', label: 'INGRESO' };
    case 'fundido':
      return { icon: ArrowRightLeft, color: '#F59E0B', label: 'FUNDIDO' };
    case 'despacho':
      return { icon: Truck, color: '#06B6D4', label: 'DESPACHO' };
  }
}

export function ActivityTerminal({ bars, exits, processes }: ActivityTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const activities = useMemo<Activity[]>(() => {
    const list: Activity[] = [];

    for (const bar of bars.slice(0, 30)) {
      list.push({
        id: `bar-${bar.id}`,
        kind: 'ingreso',
        label: `Barra ${bar.barNumber}`,
        detail: `${bar.client?.name ?? '—'} · ${formatNumber(Number(bar.fineWeight), 2)} g`,
        weight: Number(bar.fineWeight),
        timestamp: new Date(bar.createdAt),
      });
    }

    for (const exit of exits.slice(0, 20)) {
      list.push({
        id: `exit-${exit.id}`,
        kind: 'despacho',
        label: `Despacho #${exit.id.slice(0, 8)}`,
        detail: `${exit.destination} · ${formatNumber(Number(exit.totalWeight), 2)} g`,
        weight: Number(exit.totalWeight),
        timestamp: new Date(exit.createdAt),
      });
    }

    for (const process of processes.slice(0, 20)) {
      const recovered = process.lots?.reduce((s, l) => s + Number(l.recovered ?? 0), 0) ?? 0;
      if (recovered > 0) {
        list.push({
          id: `proc-${process.id}`,
          kind: 'fundido',
          label: process.name || process.id.slice(0, 8),
          detail: `Recuperado: ${formatNumber(recovered, 2)} g`,
          weight: recovered,
          timestamp: new Date(process.createdAt),
        });
      }
    }

    return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 50);
  }, [bars, exits, processes]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activities]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="hud-card overflow-hidden"
    >
      <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-white/5">
        <Terminal className="w-3.5 h-3.5 text-[var(--hud-accent-emerald)]" />
        <h3 className="text-[10px] font-bold text-[var(--hud-text-primary)] font-mono tracking-wider uppercase">
          Terminal de Actividad
        </h3>
        <span className="text-[8px] font-mono text-[var(--hud-text-dim)] ml-auto">
          {activities.length} eventos
        </span>
      </div>

      <div
        ref={scrollRef}
        className="overflow-y-auto max-h-[220px] scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        {activities.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <span className="text-[10px] font-mono text-[var(--hud-text-dim)]/50">
              Sin actividad reciente
            </span>
          </div>
        ) : (
          <div className="py-1">
            {activities.map((act, idx) => {
              const cfg = kindConfig(act.kind);
              const Icon = cfg.icon;
              const timeStr = act.timestamp.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              });
              return (
                <div
                  key={act.id}
                  className="flex items-start gap-3 px-5 py-1.5 transition-colors hover:bg-[var(--hud-bg-hover)]/40"
                  style={{
                    borderTop: idx === 0 ? 'none' : undefined,
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-[44px] pt-0.5">
                    <Circle
                      className="w-1.5 h-1.5 shrink-0"
                      style={{ fill: cfg.color, color: cfg.color }}
                    />
                    <span className="text-[9px] font-mono text-[var(--hud-text-muted)] tabular-nums">
                      {timeStr}
                    </span>
                  </div>
                  <Icon
                    className="w-3 h-3 shrink-0 mt-0.5"
                    style={{ color: cfg.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono text-[var(--hud-text-primary)] truncate block">
                      <span
                        className="font-bold text-[9px] uppercase tracking-wider mr-1.5"
                        style={{ color: cfg.color }}
                      >
                        [{cfg.label}]
                      </span>
                      {act.label}
                    </span>
                    <span className="text-[8px] font-mono text-[var(--hud-text-dim)] block truncate">
                      {act.detail}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-5 py-2 border-t border-white/5">
        <span className="text-[7px] font-mono text-[var(--hud-text-dim)]/40 uppercase tracking-widest">
          Últimos eventos en tiempo real
        </span>
      </div>
    </motion.div>
  );
}
