'use client';

import { useMemo } from 'react';
import { formatWeight } from '@/lib/format';

interface BovedaLotData {
  id: string;
  name: string;
  processName: string;
  clientName: string;
  recovered?: number;
  grossWeight?: number;
  bars?: {
    barNumber: string;
    grossWeight: number;
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
  estado: string;
  condicion: string;
  origen: string;
  pesoBruto: number;
}

export default function BovedaReportDetailTable({ lots, bars }: BovedaReportDetailTableProps) {
  const rows = useMemo(() => {
    const result: DetailRow[] = [];

    for (const lot of lots) {
      const proveedor = lot.clientName || 'DESCONOCIDO';
      const origen = (lot.bars && lot.bars.length > 0)
        ? lot.bars.map(b => b.barNumber).join(', ')
        : lot.processName;
      result.push({
        proveedor,
        codigo: lot.name,
        estado: 'Validado',
        condicion: 'Refundido',
        origen,
        pesoBruto: Number(lot.recovered ?? 0),
      });
    }

    for (const bar of bars) {
      result.push({
        proveedor: bar.clientName || 'DESCONOCIDO',
        codigo: bar.barNumber,
        estado: 'Validado',
        condicion: 'Sin refundir',
        origen: 'Ingreso directo',
        pesoBruto: bar.grossWeight,
      });
    }

    result.sort((a, b) => a.proveedor.localeCompare(b.proveedor) || a.codigo.localeCompare(b.codigo));
    return result;
  }, [lots, bars]);

  const totalPeso = useMemo(() => rows.reduce((a, r) => a + r.pesoBruto, 0), [rows]);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        border: '1px solid var(--report-border-color)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left table-fixed" style={{ minWidth: '960px' }}>
          <colgroup>
            <col style={{ width: '17%' }} />
            <col style={{ width: '19%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '34%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead>
            <tr>
              {[
                { label: 'Proveedor', align: 'left' },
                { label: 'Código', align: 'left' },
                { label: 'Estado', align: 'right' },
                { label: 'Condición', align: 'right' },
                { label: 'Origen', align: 'left' },
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
            {rows.map((row, idx) => (
              <tr
                key={`${row.codigo}-${idx}`}
                style={{
                  backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--report-bg-table-row-even)',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                }}
              >
                <td className="px-4 py-3 align-top">
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: 'var(--report-text-table)', wordBreak: 'break-word', lineHeight: '1.4' }}
                  >
                    {row.proveedor}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <span
                    className="font-mono text-[11px] font-semibold"
                    style={{ color: 'var(--report-color-primary)', wordBreak: 'break-all', lineHeight: '1.4' }}
                  >
                    {row.codigo}
                  </span>
                </td>
                <td
                  className="px-4 py-3 text-right text-[12px] font-medium align-top"
                  style={{ color: 'var(--report-text-main)' }}
                >
                  {row.estado}
                </td>
                <td
                  className="px-4 py-3 text-right text-[12px] font-medium align-top"
                  style={{ color: 'var(--report-text-main)' }}
                >
                  {row.condicion}
                </td>
                <td className="px-4 py-3 align-top">
                  <span
                    className="text-[12px]"
                    style={{ color: 'var(--report-text-main)', wordBreak: 'break-word', lineHeight: '1.4' }}
                  >
                    {row.origen}
                  </span>
                </td>
                <td
                  className="px-4 py-3 text-right text-[12px] font-bold"
                  style={{ color: 'var(--report-color-primary)' }}
                >
                  {formatWeight(row.pesoBruto)}
                </td>
              </tr>
            ))}
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
                TOTALES GENERALES — {rows.length} registro(s)
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