'use client';

import { formatNumber } from '@/lib/format';
import type { ProcesoDetailedRecord, ProcesoSummary } from './types';

interface ProcesosReportDetailTableProps {
  records: ProcesoDetailedRecord[];
  summary: ProcesoSummary;
}

export default function ProcesosReportDetailTable({ records, summary }: ProcesosReportDetailTableProps) {
  return (
    <div className="space-y-4">
      {records.map((proceso) => (
        <div
          key={proceso.id}
          className="rounded-lg overflow-hidden"
          style={{
            border: '1px solid var(--report-border-color)',
          }}
        >
          {/* Banner del proceso */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-wrap"
            style={{
              background: 'linear-gradient(135deg, rgba(19, 145, 105, 0.15), rgba(19, 145, 105, 0.05))',
              borderBottom: '2px solid var(--report-color-primary)',
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="font-mono font-bold text-[12px]"
                style={{ color: 'var(--report-color-primary)' }}
              >
                {proceso.id}
              </span>
              {proceso.esMixto && (
                <span
                  className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38BDF8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  MIXTO
                </span>
              )}
            </div>
            <span
              className="inline-block px-2 py-0.5 rounded text-[10px] font-bold"
              style={{
                backgroundColor: proceso.estatus === 'Completado' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                color: proceso.estatus === 'Completado' ? '#10B981' : '#0EA5E9',
                border: `1px solid ${proceso.estatus === 'Completado' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(14, 165, 233, 0.3)'}`,
              }}
            >
              {proceso.estatus}
            </span>
          </div>

          {/* Tabla de barras */}
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {[
                  { label: 'N° Lote / ID Barra', align: 'left' },
                  { label: 'Packing Origen', align: 'left' },
                  { label: 'Proveedor Origen', align: 'left' },
                  { label: 'Peso Bruto de Entrada (gr)', align: 'right' },
                  { label: 'Estatus Barra', align: 'center' },
                  { label: 'Peso Bruto de Salida (gr)', align: 'right' },
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
              {proceso.bars.map((bar, barIdx) => (
                <tr
                  key={bar.barId}
                  style={{
                    backgroundColor: barIdx % 2 === 0 ? 'transparent' : 'var(--report-bg-table-row-even)',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  <td className="px-4 py-3">
                    <span
                      className="font-mono text-[12px] font-semibold"
                      style={{ color: 'var(--report-text-table)' }}
                    >
                      {bar.lote}
                    </span>
                    <span
                      className="block font-mono text-[10px] mt-0.5"
                      style={{ color: 'var(--report-color-primary-light)' }}
                    >
                      {bar.barId}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-[12px]"
                    style={{ color: 'var(--report-text-table)' }}
                  >
                    {bar.packingOrigen}
                  </td>
                  <td
                    className="px-4 py-3 text-[12px]"
                    style={{ color: 'var(--report-text-table)' }}
                  >
                    {bar.proveedorOrigen}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[12px] font-medium"
                    style={{ color: 'var(--report-text-main)' }}
                  >
                    {formatNumber(bar.pesoInicial)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{
                        backgroundColor: bar.estatusBarra === 'Procesada' ? 'rgba(16, 185, 129, 0.12)' : bar.estatusBarra === 'Fundida' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(14, 165, 233, 0.12)',
                        color: bar.estatusBarra === 'Procesada' ? '#10B981' : bar.estatusBarra === 'Fundida' ? '#FBBF24' : '#0EA5E9',
                      }}
                    >
                      {bar.estatusBarra}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[12px] font-medium"
                    style={{ color: 'var(--report-text-main)' }}
                  >
                    {formatNumber(bar.pesoResultante)}
                  </td>
                </tr>
              ))}

              {/* Subtotal */}
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
                  Subtotal — {proceso.barras} Barras
                </td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td
                  className="px-4 py-3 text-right text-[12px] font-bold"
                  style={{ color: 'var(--report-color-primary)' }}
                >
                  {formatNumber(proceso.pesoInicial)} gr
                </td>
                <td className="px-4 py-3" />
                <td
                  className="px-4 py-3 text-right text-[12px] font-bold"
                  style={{ color: 'var(--report-color-primary)' }}
                >
                  {formatNumber(proceso.pesoObtenido)} gr
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      {/* Totales Generales */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          border: '2px solid var(--report-color-primary)',
        }}
      >
        <div
          className="px-4 py-3"
          style={{
            background: 'var(--report-color-primary-bg-gradient)',
          }}
        >
          <span
            className="font-bold text-[12px] uppercase tracking-wider"
            style={{ color: '#ffffff' }}
          >
            TOTALES GENERALES — {summary.totalProcesos} Procesos
          </span>
        </div>
        <div
          className="grid grid-cols-3 gap-px"
          style={{
            backgroundColor: 'var(--report-border-color)',
          }}
        >
          <div
            className="px-4 py-3 text-center"
            style={{ backgroundColor: 'var(--report-bg-card)' }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: 'var(--report-text-muted)' }}
            >
              Total Barras
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {summary.totalBarras}
            </div>
          </div>
          <div
            className="px-4 py-3 text-center"
            style={{ backgroundColor: 'var(--report-bg-card)' }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: 'var(--report-text-muted)' }}
            >
              Peso Bruto Resultante Total
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(summary.pesoResultanteTotal)} gr
            </div>
          </div>
          <div
            className="px-4 py-3 text-center"
            style={{ backgroundColor: 'var(--report-bg-card)' }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: 'var(--report-text-muted)' }}
            >
              Rendimiento Promedio
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(summary.rendimientoProm, 1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
