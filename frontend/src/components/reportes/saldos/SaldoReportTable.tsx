'use client';

import { formatNumber } from '@/lib/format';
import type { SaldoRecord } from './types';

interface SaldoReportTableProps {
  records: SaldoRecord[];
}

export default function SaldoReportTable({ records }: SaldoReportTableProps) {
  const totalIngresado = records.reduce((a, r) => a + r.totalRecibido, 0);
  const totalEgresado = records.reduce((a, r) => a + r.totalEgresado, 0);
  const totalEgresadoBR = records.reduce((a, r) => a + r.totalEgresadoBR, 0);
  const mermaTotal = records.reduce((a, r) => a + r.merma, 0);
  const saldoTotal = records.reduce((a, r) => a + r.saldoActual, 0);
  const barrasTotal = records.reduce((a, r) => a + r.barrasEnBoveda, 0);

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
              { label: 'Cliente / Proveedor', align: 'left' },
              { label: 'Total Peso Bruto Recibido (g)', align: 'right' },
              { label: 'Egresado BI (g)', align: 'right' },
              { label: 'Egresado BR (g)', align: 'right' },
              { label: 'MERMA (g)', align: 'right' },
              { label: 'Balance Peso Bruto Restante (g)', align: 'right' },
              { label: 'Barras en Bóveda', align: 'center' },
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
              key={row.cliente}
              style={{
                backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--report-bg-table-row-even)',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <td className="px-4 py-3">
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: 'var(--report-text-table)' }}
                >
                  {row.cliente}
                </span>
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-medium"
                style={{ color: 'var(--report-text-main)' }}
              >
                {formatNumber(row.totalRecibido)}
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-medium"
                style={{ color: 'var(--report-text-main)' }}
              >
                {formatNumber(row.totalEgresado)}
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-medium"
                style={{ color: 'var(--report-text-main)' }}
              >
                {formatNumber(row.totalEgresadoBR)}
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-medium"
                style={{ color: 'var(--report-text-main)' }}
              >
                {formatNumber(row.merma)}
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-bold"
                style={{ color: 'var(--report-color-primary)' }}
              >
                {formatNumber(row.saldoActual)}
              </td>
              <td
                className="px-4 py-3 text-center text-[12px] font-medium"
                style={{ color: 'var(--report-text-table)' }}
              >
                {row.barrasEnBoveda}
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
              TOTALES ({records.length} Clientes)
            </td>
            <td
              className="px-4 py-3 text-right text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(totalIngresado)} g
            </td>
            <td
              className="px-4 py-3 text-right text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(totalEgresado)} g
            </td>
            <td
              className="px-4 py-3 text-right text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(totalEgresadoBR)} g
            </td>
            <td
              className="px-4 py-3 text-right text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(mermaTotal)} g
            </td>
            <td
              className="px-4 py-3 text-right text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(saldoTotal)} g
            </td>
            <td
              className="px-4 py-3 text-center text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {barrasTotal} Barras
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
