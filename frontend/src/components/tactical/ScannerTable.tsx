'use client';

import React, { type ReactNode } from 'react';

export interface ColumnDef<T> {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render: (row: T) => ReactNode;
  width?: string;
}

interface ScannerTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  stickyFirst?: boolean;
}

export function ScannerTable<T>({ columns, data, onRowClick, keyExtractor, emptyMessage, stickyFirst = true }: ScannerTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--tac-text-dim)]">
        <span className="text-[11px] font-mono">{emptyMessage || 'NO DATA'}</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[11px] font-mono">
        <thead>
          <tr className="border-b border-[var(--tac-border)]">
            {columns.map((col, ci) => (
              <th
                key={col.key}
                className={`py-2 px-2 text-[9px] font-bold text-[var(--tac-text-dim)] uppercase tracking-[0.12em]
                  ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                  ${stickyFirst && ci === 0 ? 'sticky left-0 bg-[var(--tac-bg-secondary)] z-10' : ''}
                `}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--tac-border)]/50">
          {data.map((row, idx) => (
            <tr
              key={keyExtractor(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`
                group transition-colors duration-100
                ${onRowClick ? 'cursor-pointer' : ''}
                ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--tac-bg-primary)]/30'}
                hover:bg-[var(--tac-bg-tertiary)] relative
              `}
            >
              <td className="absolute inset-y-0 left-0 w-0.5 bg-[var(--tac-accent-cyan)] opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none" />
              {columns.map((col, ci) => (
                <td
                  key={col.key}
                  className={`py-2.5 px-2 text-[var(--tac-text-primary)]
                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                    ${stickyFirst && ci === 0 ? 'sticky left-0 bg-[var(--tac-bg-secondary)] z-10' : ''}
                  `}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
