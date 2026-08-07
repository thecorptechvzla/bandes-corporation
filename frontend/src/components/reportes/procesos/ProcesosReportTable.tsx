'use client';

import { formatNumber } from '@/lib/format';
import type { ProcesoRecord, ProcesoSummary } from './types';

interface ProcesosReportTableProps {
  records: ProcesoRecord[];
  summary: ProcesoSummary;
}

export default function ProcesosReportTable({ records, summary }: ProcesosReportTableProps) {
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
              { label: 'N° Proceso / Tipo', align: 'left' },
              { label: 'Proveedor(es)', align: 'left' },
              { label: 'Mixto', align: 'center' },
              { label: 'Cant. Barras', align: 'center' },
              { label: 'Peso Bruto (gr)', align: 'right' },
              { label: 'Peso Bruto de Salida (gr)', align: 'right' },
              { label: 'Estatus', align: 'center' },
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
                  className="block text-[11px] mt-0.5"
                  style={{ color: 'var(--report-text-muted)' }}
                >
                  {row.tipo}
                </span>
              </td>
              <td className="px-4 py-3" style={{ verticalAlign: 'middle' }}>
                {row.proveedores.map((prov, i) => (
                  <span
                    key={i}
                    className="block text-[12px] font-semibold"
                    style={{ color: 'var(--report-text-table)', marginBottom: i < row.proveedores.length - 1 ? '2px' : 0 }}
                  >
                    {prov}
                  </span>
                ))}
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                  style={{
                    backgroundColor: row.esMixto ? 'rgba(56, 189, 248, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                    color: row.esMixto ? '#38BDF8' : '#6B7280',
                    border: `1px solid ${row.esMixto ? 'rgba(56, 189, 248, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`,
                  }}
                >
                  {row.esMixto ? 'SÍ' : 'NO'}
                </span>
              </td>
              <td
                className="px-4 py-3 text-center text-[12px] font-medium"
                style={{ color: 'var(--report-text-table)' }}
              >
                {row.barras}
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-medium"
                style={{ color: 'var(--report-text-main)' }}
              >
                {formatNumber(row.pesoInicial)}
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-medium"
                style={{ color: 'var(--report-text-main)' }}
              >
                {formatNumber(row.pesoObtenido)}
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    backgroundColor: row.estatus === 'Completado' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                    color: row.estatus === 'Completado' ? '#10B981' : '#0EA5E9',
                    border: `1px solid ${row.estatus === 'Completado' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(14, 165, 233, 0.3)'}`,
                  }}
                >
                  {row.estatus}
                </span>
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
              TOTALES ({summary.totalProcesos} Procesos)
            </td>
            <td className="px-4 py-3" style={{ color: 'var(--report-text-muted)' }}>—</td>
            <td className="px-4 py-3" style={{ color: 'var(--report-text-muted)' }}>—</td>
            <td
              className="px-4 py-3 text-center text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {summary.totalBarras} Barras
            </td>
            <td
              className="px-4 py-3 text-right text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(records.reduce((a, r) => a + r.pesoInicial, 0))} gr
            </td>
            <td
              className="px-4 py-3 text-right text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(summary.pesoResultanteTotal)} gr
            </td>
            <td
              className="px-4 py-3 text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              Rendimiento: {formatNumber(summary.rendimientoProm, 1)}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
