'use client';

import { formatLey, formatNumber } from '@/lib/format';
import type { PackingDetailedRecord, PackingSummary } from './types';

interface PackingReportDetailTableProps {
  records: PackingDetailedRecord[];
  summary: PackingSummary;
}

export default function PackingReportDetailTable({ records, summary }: PackingReportDetailTableProps) {
  return (
    <div className="space-y-4">
      {records.map((packing) => (
        <div
          key={packing.uid}
          className="rounded-lg overflow-hidden"
          style={{
            border: '1px solid var(--report-border-color)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
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
                {packing.id}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--report-text-muted)' }}>|</span>
              <span
                className="text-[11px]"
                style={{ color: 'var(--report-text-table)' }}
              >
                {packing.file}
              </span>
            </div>
            <span
              className="text-[12px] font-semibold"
              style={{ color: 'var(--report-text-main)' }}
            >
              {packing.client}
            </span>
          </div>

          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {[
                  { label: 'N° Lote / ID Barra', align: 'left' },
                  { label: 'Peso Bruto (gr)', align: 'right' },
                  { label: 'Ley', align: 'center' },
                  { label: 'Peso Fino (gr)', align: 'right' },
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
              {packing.bars.map((bar, barIdx) => (
                <tr
                  key={`${packing.uid}-${bar.barId}-${barIdx}`}
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
                    className="px-4 py-3 text-right text-[12px] font-medium"
                    style={{ color: 'var(--report-text-main)' }}
                  >
                    {formatNumber(bar.pesoBruto)}
                  </td>
                  <td
                    className="px-4 py-3 text-center text-[12px] font-medium"
                    style={{ color: 'var(--report-text-table)' }}
                  >
                    {formatLey(bar.ley)}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[12px] font-medium"
                    style={{ color: 'var(--report-text-main)' }}
                  >
                    {formatNumber(bar.pesoFino)}
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
                  Subtotal — {packing.barras} Barras
                </td>
                <td
                  className="px-4 py-3 text-right text-[12px] font-bold"
                  style={{ color: 'var(--report-color-primary)' }}
                >
                  {formatNumber(packing.pesoBruto)} gr
                </td>
                <td
                  className="px-4 py-3 text-center text-[12px] font-bold"
                  style={{ color: 'var(--report-color-primary)' }}
                >
                  {formatLey(packing.ley)}
                </td>
                <td
                  className="px-4 py-3 text-right text-[12px] font-bold"
                  style={{ color: 'var(--report-color-primary)' }}
                >
                  {formatNumber(packing.pesoFino)} gr
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

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
            TOTALES GENERALES — {summary.totalPackings} Packings
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
              Peso Bruto Total
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(summary.pesoBrutoTotal)} gr
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
              Peso Fino Total
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(summary.pesoFinoTotal)} gr
            </div>
            <div
              className="text-[10px] mt-0.5"
              style={{ color: 'var(--report-text-muted)' }}
            >
              Ley Prom: {formatLey(summary.leyProm)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
