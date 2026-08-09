'use client';

import { formatLey, formatNumber } from '@/lib/format';
import type { SaldoDetailedRecord } from './types';

interface SaldoReportDetailTableProps {
  records: SaldoDetailedRecord[];
}

export default function SaldoReportDetailTable({ records }: SaldoReportDetailTableProps) {
  const totalIngresado = records.reduce((a, r) => a + r.totalRecibido, 0);
  const totalEgresado = records.reduce((a, r) => a + r.totalEgresado, 0);
  const totalEgresadoBR = records.reduce((a, r) => a + r.totalEgresadoBR, 0);
  const mermaTotal = records.reduce((a, r) => a + r.merma, 0);
  const saldoTotal = records.reduce((a, r) => a + r.saldoActual, 0);

  return (
    <div className="space-y-4">
      {records.map((cliente) => (
        <div
          key={cliente.cliente}
          className="rounded-lg overflow-hidden"
          style={{
            border: '1px solid var(--report-border-color)',
          }}
        >
          {/* Banner del cliente */}
          <div
            className="px-4 py-3 flex-wrap"
            style={{
              background: 'linear-gradient(135deg, rgba(19, 145, 105, 0.15), rgba(19, 145, 105, 0.05))',
              borderBottom: '2px solid var(--report-color-primary)',
            }}
          >
            <span
              className="text-[12px] font-bold block"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {cliente.cliente}
            </span>
            <div className="flex items-center gap-4 text-[10px] mt-1" style={{ color: 'var(--report-text-muted)' }}>
              <span>Peso Bruto Recibido: <strong style={{ color: 'var(--report-text-main)' }}>{formatNumber(cliente.totalRecibido)} g</strong></span>
              <span>Egresado BI: <strong style={{ color: 'var(--report-text-main)' }}>{formatNumber(cliente.totalEgresado)} g</strong></span>
              <span>Egresado BR: <strong style={{ color: 'var(--report-text-main)' }}>{formatNumber(cliente.totalEgresadoBR)} g</strong></span>
              <span>MERMA: <strong style={{ color: 'var(--report-text-main)' }}>{formatNumber(cliente.merma)} g</strong></span>
              <span>BALANCE PESO BRUTO: <strong style={{ color: 'var(--report-color-primary)' }}>{formatNumber(cliente.saldoActual)} g</strong></span>
            </div>
          </div>

          {/* Tabla de barras en bóveda */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[850px]">
              <thead>
                <tr>
                  {[
                    { label: 'N° Lote / ID Barra', align: 'left' },
                    { label: 'Packing de Origen', align: 'left' },
                    { label: 'Fecha Recepción', align: 'center' },
                    { label: 'Peso Bruto Recibido (g)', align: 'right' },
                    { label: 'Ley (‰)', align: 'center' },
                    { label: 'Peso Fino Disponible (g)', align: 'right' },
                    { label: 'Peso en Bóveda / Egreso (BI/BR/M)', align: 'right' },
                    { label: 'Fecha Egreso / Estatus', align: 'center' },
                  ].map((h) => (
                    <th
                      key={h.label}
                      className={`px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-${h.align} whitespace-nowrap`}
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
                {cliente.barras.map((barra, barraIdx) => (
                  <tr
                    key={barra.loteId}
                    style={{
                      backgroundColor: barraIdx % 2 === 0 ? 'transparent' : 'var(--report-bg-table-row-even)',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}
                  >
                    <td className="px-3 py-3">
                      <span
                        className="font-mono text-[11px] font-semibold"
                        style={{ color: 'var(--report-color-primary)' }}
                      >
                        {barra.loteId}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="font-mono text-[11px] font-semibold"
                        style={{ color: 'var(--report-text-table)' }}
                      >
                        {barra.packingOrigen}
                      </span>
                    </td>
                    <td
                      className="px-3 py-3 text-center text-[11px]"
                      style={{ color: 'var(--report-text-main)' }}
                    >
                      {barra.fechaRecepcion}
                    </td>
                    <td
                      className="px-3 py-3 text-right text-[11px] font-medium"
                      style={{ color: 'var(--report-text-main)' }}
                    >
                      {formatNumber(barra.pesoBrutoRecibido)}
                    </td>
                    <td
                      className="px-3 py-3 text-center text-[11px] font-medium"
                      style={{ color: 'var(--report-text-table)' }}
                    >
                      {formatLey(barra.ley)}
                    </td>
                    <td
                      className="px-3 py-3 text-right text-[11px] font-medium"
                      style={{ color: 'var(--report-text-main)' }}
                    >
                      {formatNumber(barra.pesoFinoDisponible)}
                    </td>
                    <td
                      className="px-3 py-3 text-right text-[11px]"
                      style={{ color: 'var(--report-text-main)' }}
                    >
                      {barra.fueEgresado ? (
                        <span className="text-[10px] whitespace-nowrap">
                          BI: {formatNumber(barra.pesoBrutoRecibido)}
                          {' · '}BR: {formatNumber(barra.pesoBrutoEnBoveda)}
                          {' · '}M: {formatNumber(barra.pesoBrutoRecibido - barra.pesoBrutoEnBoveda)}
                        </span>
                      ) : (
                        <span className="font-medium">{formatNumber(barra.pesoBrutoEnBoveda)}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {barra.fueEgresado ? (
                        <span className="text-[11px]" style={{ color: 'var(--report-text-main)' }}>
                          {barra.fechaEgreso}
                        </span>
                      ) : (
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: 'rgba(19, 145, 105, 0.15)',
                            color: 'var(--report-color-primary)',
                            border: '1px solid var(--report-color-primary)',
                          }}
                        >
                          EN BÓVEDA
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Subtotal por cliente */}
                <tr
                  style={{
                    backgroundColor: 'var(--report-bg-main)',
                    borderTop: '2px solid var(--report-color-primary)',
                  }}
                >
                  <td
                    className="px-3 py-3 text-[11px] font-bold"
                    style={{ color: 'var(--report-color-primary)' }}
                  >
                    Subtotal — {cliente.barrasEnBoveda} Barras en Bóveda
                  </td>
                  <td className="px-3 py-3" />
                  <td className="px-3 py-3" />
                  <td
                    className="px-3 py-3 text-right text-[11px] font-bold"
                    style={{ color: 'var(--report-color-primary)' }}
                  >
                    {formatNumber(cliente.barras.reduce((a, b) => a + b.pesoBrutoRecibido, 0))} g
                  </td>
                  <td className="px-3 py-3" />
                  <td
                    className="px-3 py-3 text-right text-[11px] font-bold"
                    style={{ color: 'var(--report-color-primary)' }}
                  >
                    {formatNumber(cliente.barras.reduce((a, b) => a + b.pesoFinoDisponible, 0))} g
                  </td>
                  <td
                    className="px-3 py-3 text-right text-[11px] font-bold"
                    style={{ color: 'var(--report-color-primary)' }}
                  >
                    {formatNumber(cliente.barras.reduce((a, b) => a + b.pesoBrutoEnBoveda, 0))} g
                  </td>
                  <td className="px-3 py-3" />
                </tr>
              </tbody>
            </table>
          </div>
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
            TOTALES GENERALES — BALANCE CONSOLIDADO
          </span>
        </div>
        <div
          className="grid grid-cols-5 gap-px"
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
              Total Peso Bruto Ingresado
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(totalIngresado)} g
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
              Total Egresado BI
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(totalEgresado)} g
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
              Total Egresado BR
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(totalEgresadoBR)} g
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
              MERMA Total
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(mermaTotal)} g
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
              Balance Final (BR)
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(saldoTotal)} g
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
