'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useMaterialExits } from '@/hooks/useExits';
import { convertExitToDispatchResult, generateDispatchPDF } from '@/lib/generateDispatchPDF';
import { ExitsTable } from '@/components/historicos/ExitsTable';
import { HistoryFilters } from '@/components/historicos/HistoryFilters';
import type { MaterialExit } from '@/types/api';

type ViewLote = {
  id?: string;
  name?: string;
  recovered?: number | null;
  photoUrl?: string | null;
  process?: { id?: string; name?: string; client?: { id?: string; name?: string; rif?: string } };
};

type ViewDetalle = {
  id: string;
  lot?: ViewLote | null;
  bars?: { id: string; barNumber: string; fineWeight?: number; grossWeight?: number; clientId?: string; client?: { id?: string; name?: string } }[];
  weightAported: string | number;
};

type ViewExit = {
  id: string;
  destination: string;
  grossWeight: number;
  totalBR: number;
  createdAt: string;
  exitDetails: ViewDetalle[];
  bars?: { id: string; barNumber: string; grossWeight?: number; fineWeight?: number; client?: { name?: string } }[];
};

export function ExitsHistoryView() {
  const { data: exits = [], isLoading } = useMaterialExits();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [expandedExitId, setExpandedExitId] = useState<string | null>(null);

  const exitProviders = useMemo(() => {
    const set = new Set<string>();
    exits.forEach(e => {
      (e.exitDetails || []).forEach(d => {
        const name = d.lot?.process?.client?.name;
        if (name) set.add(name);
      });
    });
    return [...set].sort();
  }, [exits]);

  const rows: ViewExit[] = useMemo(() => {
    return exits.map(ex => ({
      id: ex.id,
      destination: ex.destination || '',
      grossWeight:
        (ex.bars || []).reduce((s, b) => s + Number(b.grossWeight || 0), 0) +
        (ex.exitDetails || []).reduce(
          (sum, d) =>
            sum +
            (d.bars || []).reduce((s, b) => s + Number(b.grossWeight || 0), 0),
          0,
        ),
      totalBR:
        (ex.exitDetails || []).reduce((sum, d) => {
          const lotGross = (d.bars || []).reduce((s, b) => s + Number(b.grossWeight || 0), 0);
          return sum + (Number(d.lot?.recovered) > 0 ? Number(d.lot?.recovered) : lotGross);
        }, 0) +
        (ex.bars || []).reduce((s, b) => s + Number(b.grossWeight || 0), 0),
      createdAt: ex.createdAt,
      exitDetails: (ex.exitDetails || []).map<ViewDetalle>(d => ({
        id: d.id,
        lot: d.lot
          ? {
              id: d.lot.id,
              name: d.lot.name,
              recovered: d.lot.recovered ?? null,
              photoUrl: d.lot.photoUrl ?? null,
              process: d.lot.process
                ? {
                    id: d.lot.process.id,
                    name: d.lot.process.name,
                    client: d.lot.process.client
                      ? { id: d.lot.process.client.id, name: d.lot.process.client.name, rif: d.lot.process.client.rif }
                      : undefined,
                  }
                : undefined,
            }
          : null,
        bars: (d.bars || []).map(b => ({
          id: b.id,
          barNumber: b.barNumber,
          fineWeight: b.fineWeight,
          grossWeight: b.grossWeight,
          clientId: b.clientId,
          client: b.client ? { id: b.client.id, name: b.client.name } : undefined,
        })),
        weightAported: d.weightAported,
      })),
      bars: (ex.bars || []).map(b => ({
        id: b.id,
        barNumber: b.barNumber,
        grossWeight: b.grossWeight,
        fineWeight: b.fineWeight,
        client: b.client ? { name: b.client.name } : undefined,
      })),
    }));
  }, [exits]);

  const filteredExits = useMemo(() => {
    return rows.filter(e => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const destMatch = e.destination?.toLowerCase().includes(q) ?? false;
        const providerMatch = e.exitDetails.some(
          d => d.lot?.process?.client?.name?.toLowerCase().includes(q),
        );
        const codeMatch = e.id.toLowerCase().includes(q);
        if (!destMatch && !providerMatch && !codeMatch) return false;
      }
      if (dateFrom && new Date(e.createdAt) < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(e.createdAt) > end) return false;
      }
      if (selectedProvider) {
        const hasProvider = e.exitDetails.some(
          d => d.lot?.process?.client?.name === selectedProvider,
        );
        if (!hasProvider) return false;
      }
      return true;
    });
  }, [rows, searchQuery, dateFrom, dateTo, selectedProvider]);

  const hasAnyFilter = !!(searchQuery || dateFrom || dateTo || selectedProvider);

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setSelectedProvider('');
    setExpandedExitId(null);
  };

  const handlePDF = useCallback((exit: { id: string }, copy: 'CLIENTE' | 'EMPRESA') => {
    const source = exits.find(e => e.id === exit.id) as MaterialExit | undefined;
    if (!source) return;
    const result = convertExitToDispatchResult(source);
    generateDispatchPDF(result, undefined, copy);
  }, [exits]);

  return (
    <div className="space-y-4">
      <HistoryFilters
        activeTab="exits"
        searchQuery={searchQuery}
        dateFrom={dateFrom}
        dateTo={dateTo}
        selectedProvider={selectedProvider}
        providers={exitProviders}
        hasAnyFilter={hasAnyFilter}
        onSearchChange={setSearchQuery}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onProviderChange={setSelectedProvider}
        onClear={clearFilters}
      />
      <ExitsTable
        exits={filteredExits}
        isLoading={isLoading}
        hasAnyFilter={hasAnyFilter}
        expandedExitId={expandedExitId}
        onExpand={setExpandedExitId}
        onClearFilters={clearFilters}
        onPDFCliente={e => handlePDF(e, 'CLIENTE')}
        onPDFEmpresa={e => handlePDF(e, 'EMPRESA')}
      />
    </div>
  );
}