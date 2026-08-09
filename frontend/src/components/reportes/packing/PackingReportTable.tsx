'use client';

import { formatLey, formatNumber } from '@/lib/format';
import type { PackingRecord, PackingSummary } from './types';

interface PackingReportTableProps {
  records: PackingRecord[];
  summary: PackingSummary;
}

export default function PackingReportTable({ records, summary }: PackingReportTableProps) {
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
            <th
              className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: 'var(--report-bg-main)',
                color: 'var(--report-text-muted)',
                borderBottom: '1px solid var(--report-border-color)',
              }}
            >
              N° Packing / Archivo
            </th>
            <th
              className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: 'var(--report-bg-main)',
                color: 'var(--report-text-muted)',
                borderBottom: '1px solid var(--report-border-color)',
              }}
            >
              Cliente / Razón Social
            </th>
            <th
              className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center"
              style={{
                backgroundColor: 'var(--report-bg-main)',
                color: 'var(--report-text-muted)',
                borderBottom: '1px solid var(--report-border-color)',
              }}
            >
              BARRAS (VAL. / PEND.)
            </th>
            <th
              className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-right"
              style={{
                backgroundColor: 'var(--report-bg-main)',
                color: 'var(--report-text-muted)',
                borderBottom: '1px solid var(--report-border-color)',
              }}
            >
              Peso Bruto (gr)
            </th>
            <th
              className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-right"
              style={{
                backgroundColor: 'var(--report-bg-main)',
                color: 'var(--report-text-muted)',
                borderBottom: '1px solid var(--report-border-color)',
              }}
            >
Ley (‰)
            </th>
            <th
              className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-right"
              style={{
                backgroundColor: 'var(--report-bg-main)',
                color: 'var(--report-text-muted)',
                borderBottom: '1px solid var(--report-border-color)',
              }}
            >
              Peso Fino (gr)
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((row, idx) => (
            <tr
              key={row.uid}
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
                  className="block text-[11px] mt-0.5"
                  style={{ color: 'var(--report-text-muted)' }}
                >
                  {row.file}
                </span>
              </td>
              <td className="px-4 py-3">
                <strong className="text-[12px] font-semibold" style={{ color: 'var(--report-text-table)' }}>{row.client}</strong>
              </td>
              <td
                className="px-4 py-3 text-center text-[12px] font-medium"
                style={{ color: 'var(--report-text-table)' }}
              >
                {row.barras} ({row.barrasValidadas} / {row.barrasPendientes})
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-medium"
                style={{ color: 'var(--report-text-main)' }}
              >
                {formatNumber(row.pesoBruto)}
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-medium"
                style={{ color: 'var(--report-text-table)' }}
              >
                {formatLey(row.ley)}
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-medium"
                style={{ color: 'var(--report-text-main)' }}
              >
                {formatNumber(row.pesoFino)}
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
              TOTALES ({summary.totalPackings} Packings)
            </td>
            <td className="px-4 py-3" style={{ color: 'var(--report-text-muted)' }}>—</td>
            <td
              className="px-4 py-3 text-center text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {summary.totalBarras} ({summary.totalValidadas} / {summary.totalPendientes}) Barras
            </td>
            <td
              className="px-4 py-3 text-right text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(summary.pesoBrutoTotal)} gr
            </td>
            <td
              className="px-4 py-3 text-right text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatLey(summary.leyProm)} (Prom)
            </td>
            <td
              className="px-4 py-3 text-right text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(summary.pesoFinoTotal)} gr
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
