'use client';

import { useMemo } from 'react';
import { formatWeight, formatLey } from '@/lib/format';

interface BovedaLotData {
  id: string;
  name: string;
  processName: string;
  clientName: string;
  recovered?: number;
  grossWeight?: number;
  purity?: number | null;
  bars?: {
    barNumber: string;
    grossWeight: number;
    purity?: number;
    clientId?: string;
    clientName?: string;
  }[];
}

interface BovedaBarData {
  barNumber: string;
  grossWeight: number;
  purity: number;
  fineWeight: number;
  clientName: string;
}

interface BovedaReportDetailTableProps {
  lots: BovedaLotData[];
  bars: BovedaBarData[];
}

interface DetailRow {
  proveedor: string;
  codigo: string;
  tipo: string;
  origen: string;
  ley: number;
  pesoBruto: number;
  level: 0 | 1;
}

export default function BovedaReportDetailTable({ lots, bars }: BovedaReportDetailTableProps) {
  const rows = useMemo(() => {
    const result: DetailRow[] = [];

    for (const lot of lots) {
      const proveedor = lot.clientName || 'DESCONOCIDO';
      result.push({
        proveedor,
        codigo: lot.name,
        tipo: 'Refundido',
        origen: lot.processName || '—',
        ley: Number(lot.purity ?? 0),
        pesoBruto: Number(lot.recovered ?? 0),
        level: 0,
      });
      for (const b of lot.bars ?? []) {
        result.push({
          proveedor: b.clientName || '',
          codigo: b.barNumber,
          tipo: '',
          origen: '',
          ley: Number(b.purity ?? 0),
          pesoBruto: Number(b.grossWeight ?? 0),
          level: 1,
        });
      }
    }

    for (const bar of bars) {
      result.push({
        proveedor: bar.clientName || 'DESCONOCIDO',
        codigo: bar.barNumber,
        tipo: 'Sin refundir',
        origen: 'Ingreso directo',
        ley: Number(bar.purity ?? 0),
        pesoBruto: bar.grossWeight,
        level: 0,
      });
    }

    return result;
  }, [lots, bars]);

  const mainRows = useMemo(() => rows.filter((r) => r.level === 0), [rows]);
  const totalPeso = useMemo(() => mainRows.reduce((a, r) => a + r.pesoBruto, 0), [mainRows]);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        border: '1px solid var(--report-border-color)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left table-fixed" style={{ minWidth: '1020px' }}>
          <colgroup>
            <col style={{ width: '16%' }} />
            <col style={{ width: '19%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '14%' }} />
          </colgroup>
          <thead>
            <tr>
              {[
                { label: 'Proveedor', align: 'left' },
                { label: 'Código', align: 'left' },
                { label: 'TIPO', align: 'right' },
                { label: 'Origen', align: 'left' },
                { label: 'Ley (‰)', align: 'right' },
                { label: 'Peso Bruto (g)', align: 'right' },
              ].map((h) => (
                <th
                  key={h.label}
                  className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-${h.align}`}
                  style={{
                    backgroundColor: 'var(--report-bg-main)',
                    color: 'var(--report-text-muted)',
                    borderBottom: '1px solid var(--report-border-color)',
                  }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isChild = row.level === 1;
              return (
                <tr
                  key={`${row.codigo}-${idx}`}
                  style={{
                    backgroundColor: isChild
                      ? 'rgba(19, 145, 105, 0.06)'
                      : idx % 2 === 0
                        ? 'transparent'
                        : 'var(--report-bg-table-row-even)',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  <td className={`px-4 py-3 align-top ${isChild ? 'pl-8' : ''}`}>
                    <span
                      className={`text-[12px] ${isChild ? 'font-normal' : 'font-semibold'}`}
                      style={{
                        color: isChild ? 'var(--report-text-muted)' : 'var(--report-text-table)',
                        wordBreak: 'break-word',
                        lineHeight: '1.4',
                      }}
                    >
                      {isChild ? '' : row.proveedor}
                    </span>
                  </td>
                  <td className={`px-4 py-3 align-top ${isChild ? 'pl-8' : ''}`}>
                    <span
                      className="font-mono text-[11px] font-semibold"
                      style={{
                        color: isChild ? 'var(--report-text-muted)' : 'var(--report-color-primary)',
                        wordBreak: 'break-all',
                        lineHeight: '1.4',
                      }}
                    >
                      {isChild ? `   - ${row.codigo}` : row.codigo}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[12px] font-medium align-top"
                    style={{ color: isChild ? 'var(--report-text-muted)' : 'var(--report-color-primary)' }}
                  >
                    {isChild ? '' : row.tipo}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className="text-[12px]"
                      style={{ color: 'var(--report-text-main)', wordBreak: 'break-word', lineHeight: '1.4' }}
                    >
                      {isChild ? '' : row.origen}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[12px] font-medium align-top"
                    style={{ color: isChild ? 'var(--report-text-muted)' : 'var(--report-color-primary)' }}
                  >
                    {formatLey(row.ley)}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[12px] font-bold"
                    style={{ color: isChild ? 'var(--report-text-muted)' : 'var(--report-color-primary)' }}
                  >
                    {formatWeight(row.pesoBruto)}
                  </td>
                </tr>
              );
            })}
            <tr
              style={{
                backgroundColor: 'var(--report-bg-main)',
                borderTop: '2px solid var(--report-color-primary)',
              }}
            >
              <td
                className="px-4 py-3 text-[12px] font-bold"
                style={{ color: 'var(--report-color-primary)' }}
                colSpan={5}
              >
                TOTALES GENERALES — {mainRows.length} registro(s)
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-bold"
                style={{ color: 'var(--report-color-primary)' }}
              >
                {formatWeight(totalPeso)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}