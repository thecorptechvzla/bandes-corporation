'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Package } from 'lucide-react';
import { BarAccordion, type BarAccordionRow } from '@/components/selection/BarAccordion';
import type { UnifiedItem } from '@/types/egresos';
export type { UnifiedItem };

interface UnifiedItemPanelProps {
  items: UnifiedItem[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filteredItems: UnifiedItem[];
  groupedItems: Record<string, UnifiedItem[]>;
  openGroups: Set<string>;
  selectedIds: Set<string>;
  onToggleItem: (id: string) => void;
  onToggleSupplier: (clientId: string) => void;
  onToggleSupplierItems: (clientId: string) => void;
  isSupplierAllSelected: (clientId: string) => boolean;
  onOpenDetail?: (id: string) => void;
  mixedGroupKey?: string;
}

export function UnifiedItemPanel({
  items, searchQuery, onSearchChange, filteredItems, groupedItems,
  openGroups, selectedIds, onToggleItem, onToggleSupplier, onToggleSupplierItems,
  isSupplierAllSelected, onOpenDetail, mixedGroupKey,
}: UnifiedItemPanelProps) {
  const accordionGroups = useMemo(() => {
    const result: Record<string, BarAccordionRow[]> = {};
    Object.entries(groupedItems).forEach(([clientId, uiItems]) => {
      result[clientId] = uiItems.map(item => ({
        id: item.id,
        code: item.code,
        type: item.type,
        pesoBruto: item.pesoBruto,
        leyAu: item.leyAu,
        pesoFino: item.pesoFino,
        clientName: item.clientName,
        clientRif: item.clientRif,
        isMixed: item.isMixed,
        barCount: item.barCount,
        composition: item.composition,
      }));
    });
    return result;
  }, [groupedItems]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="xl:col-span-3 glass-panel rounded-2xl border border-[var(--pm-border)]/40 overflow-hidden"
    >
      {/* Search header */}
      <div className="px-5 py-3.5 border-b border-[var(--pm-border)]/20 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="flex items-center flex-1 max-w-xs bg-[var(--pm-bg-deepest)] border border-[var(--pm-border)] rounded-lg overflow-hidden transition-colors focus-within:border-[var(--pm-accent-gold)]">
            <div className="pl-3 flex items-center justify-center">
              <Search className="w-3.5 h-3.5 text-[var(--pm-text-dim)]/40" />
            </div>
            <input
              type="text"
              placeholder="Buscar lote, barra o proveedor..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="flex-1 bg-transparent py-2 px-3 outline-none text-xs font-mono text-[var(--pm-text-primary)] placeholder:text-[var(--pm-text-dim)]/30"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--pm-text-dim)]">
          <span>{filteredItems.filter(i => i.type === 'lot').length} lotes</span>
          <span className="text-[var(--pm-border)]">·</span>
          <span>{filteredItems.filter(i => i.type === 'bar').length} barras</span>
        </div>
      </div>

      {/* Accordion body */}
      <div className="p-3 overflow-y-auto max-h-[calc(100vh-280px)] v2-scroll">
        <BarAccordion
          groups={accordionGroups}
          openGroups={openGroups}
          selectedIds={selectedIds}
          onToggleItem={onToggleItem}
          onToggleSupplier={onToggleSupplier}
          onToggleSupplierItems={onToggleSupplierItems}
          isSupplierAllSelected={isSupplierAllSelected}
          onOpenDetail={onOpenDetail}
          mixedGroupKey={mixedGroupKey}
        />
      </div>
    </motion.div>
  );
}
