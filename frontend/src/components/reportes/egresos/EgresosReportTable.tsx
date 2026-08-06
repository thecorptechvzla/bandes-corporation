'use client';

import { formatNumber } from '@/lib/format';
import type { EgresoRecord, EgresoSummary } from './types';

interface EgresosReportTableProps {
  records: EgresoRecord[];
  summary: EgresoSummary;
  dateFrom: string;
  dateTo: string;
}

export default function EgresosReportTable({ records, summary, dateFrom, dateTo }: EgresosReportTableProps) {
  const showFecha = dateFrom !== dateTo;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        border: '1px solid var(--report-border-color)',
      }}
    >
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {[
              { label: 'N° Egreso / Guía', align: 'left' },
              { label: 'Cliente / Razón Social', align: 'left' },
              ...(showFecha ? [{ label: 'Fecha Egreso', align: 'center' }] : []),
              { label: 'Cant. Lingotes', align: 'center' },
              { label: 'Peso Bruto (gr)', align: 'right' },
              { label: 'Ley Prom.', align: 'center' },
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
          {records.map((row, idx) => (
            <tr
              key={row.id}
              style={{
                backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--report-bg-table-row-even)',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <td className="px-4 py-3">
                <span
                  className="font-mono font-bold text-[12px]"
                  style={{ color: 'var(--report-color-primary)' }}
                >
                  {row.id}
                </span>
                <span
                  className="block text-[10px] mt-0.5"
                  style={{ color: 'var(--report-text-muted)' }}
                >
                  {row.guia}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-[12px] font-semibold" style={{ color: 'var(--report-text-table)' }}>
                  {row.clienteDestino || '—'}
                </span>
              </td>
              {showFecha && (
                <td
                  className="px-4 py-3 text-center text-[12px]"
                  style={{ color: 'var(--report-text-main)' }}
                >
                  {row.fecha}
                </td>
              )}
              <td
                className="px-4 py-3 text-center text-[12px] font-medium"
                style={{ color: 'var(--report-text-table)' }}
              >
                {row.lingotes}
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-medium"
                style={{ color: 'var(--report-text-main)' }}
              >
                {formatNumber(row.pesoBruto)}
              </td>
              <td
                className="px-4 py-3 text-center text-[12px] font-medium"
                style={{ color: 'var(--report-text-table)' }}
              >
                {formatNumber(row.leyProm, 4)}
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
            >
              TOTALES ({summary.totalEgresos} Egresos)
            </td>
            {showFecha && <td className="px-4 py-3" />}
            <td className="px-4 py-3" />
            <td
              className="px-4 py-3 text-center text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {summary.totalLingotes} Lingotes
            </td>
            <td
              className="px-4 py-3 text-right text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(summary.pesoBrutoTotal)} gr
            </td>
            <td className="px-4 py-3" />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
