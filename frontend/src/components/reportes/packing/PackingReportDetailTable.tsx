'use client';

import type { CSSProperties } from 'react';
import { formatLey, formatNumber } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { BarRecord, PackingDetailedRecord, PackingSummary } from './types';

interface PackingReportDetailTableProps {
  records: PackingDetailedRecord[];
  summary: PackingSummary;
}

const spWeightFor = (bar: BarRecord): number | null => {
  if (bar.spGrossWeight != null) return bar.spGrossWeight;
  if (bar.status === 'POR_VALIDAR') return bar.pesoBruto;
  return null;
};

const spPurityFor = (bar: BarRecord): number | null => {
  if (bar.spPurity != null) return bar.spPurity;
  if (bar.status === 'POR_VALIDAR') return bar.ley;
  return null;
};

const fmtWeight = (v: number | null | undefined): string => (v != null ? formatNumber(Number(v), 2) : '-');
const fmtLeyVal = (v: number | null | undefined): string => (v != null ? formatLey(v) : '-');
const fmtSigned = (v: number | null | undefined): string => (v != null ? `${v > 0 ? '+' : ''}${formatNumber(Number(v), 2)}` : '-');

export default function PackingReportDetailTable({ records, summary }: PackingReportDetailTableProps) {
  const headers = ['Código Barra', 'Bruto SP', 'Ley SP (‰)', 'Bruto Val.', 'Ley Val. (‰)', 'Dif. Bruto', 'Dif. Ley', 'Estado'];

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

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[900px]">
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-center whitespace-nowrap"
                      style={{
                        backgroundColor: 'var(--report-bg-main)',
                        color: 'var(--report-text-muted)',
                        borderBottom: '1px solid var(--report-border-color)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {packing.bars.map((bar, barIdx) => {
                  const isPorValidar = bar.status === 'POR_VALIDAR';
                  const spW = spWeightFor(bar);
                  const spP = spPurityFor(bar);
                  const difW = !isPorValidar && bar.spGrossWeight != null ? Math.round((bar.pesoBruto - bar.spGrossWeight) * 100) / 100 : null;
                  const difP = !isPorValidar && bar.spPurity != null ? Math.round((bar.ley - bar.spPurity) * 100) / 100 : null;

                  const diffStyle = (dif: number | null): CSSProperties =>
                    dif != null
                      ? { color: 'var(--report-color-primary)', fontWeight: 700 }
                      : { color: 'var(--report-text-muted)' };

                  const base: CSSProperties = {
                    padding: '5px 8px',
                    fontSize: '11px',
                    backgroundColor: barIdx % 2 === 0 ? 'transparent' : 'var(--report-bg-table-row-even)',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  };

                  return (
                    <tr
                      key={`${packing.uid}-${bar.barId}-${barIdx}`}
                      style={{ backgroundColor: 'inherit' }}
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
                      <td style={{ ...base }}>{fmtWeight(spW)}</td>
                      <td style={{ ...base }}>{fmtLeyVal(spP)}</td>
                      <td style={{ ...base, color: isPorValidar ? 'var(--report-text-muted)' : 'var(--report-text-main)' }}>
                        {isPorValidar ? '-' : fmtWeight(bar.pesoBruto)}
                      </td>
                      <td style={{ ...base, color: isPorValidar ? 'var(--report-text-muted)' : 'var(--report-text-table)' }}>
                        {isPorValidar ? '-' : fmtLeyVal(bar.ley)}
                      </td>
                      <td style={{ ...base, ...diffStyle(difW) }}>{fmtSigned(difW)}</td>
                      <td style={{ ...base, ...diffStyle(difP) }}>{fmtSigned(difP)}</td>
                      <td style={{ ...base }}>
                        <StatusBadge status={bar.status} size="sm" />
                      </td>
                    </tr>
                  );
                })}

                {(() => {
                  const validTotal = packing.bars.reduce((acc, b) => acc + (b.status === 'POR_VALIDAR' ? 0 : b.pesoBruto), 0);
                  const spTotal = packing.bars.reduce((acc, b) => acc + Number(spWeightFor(b) ?? 0), 0);
                  const difWTotal = packing.bars.reduce(
                    (acc, b) => acc + (b.status !== 'POR_VALIDAR' && b.spGrossWeight != null ? b.pesoBruto - b.spGrossWeight : 0),
                    0,
                  );
                  const cell = { padding: '5px 8px', fontSize: '11px' } as CSSProperties;
                  return (
                    <tr
                      style={{
                        backgroundColor: 'var(--report-bg-main)',
                        borderTop: '2px solid var(--report-color-primary)',
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[12px] font-bold whitespace-nowrap"
                        style={{ color: 'var(--report-color-primary)' }}
                      >
                        Subtotal — {packing.barras} Barras
                      </td>
                      <td style={{ ...cell, color: 'var(--report-color-primary)', fontWeight: 700, textAlign: 'center' }}>{fmtWeight(spTotal)}</td>
                      <td style={{ ...cell, color: 'var(--report-text-muted)' }}>Σ Ley SP</td>
                      <td style={{ ...cell, color: 'var(--report-color-primary)', fontWeight: 700, textAlign: 'center' }}>{fmtWeight(validTotal)}</td>
                      <td style={{ ...cell, color: 'var(--report-text-muted)' }}>Σ Ley Val.</td>
                      <td style={{ ...cell, color: difWTotal > 0 ? 'var(--report-color-primary)' : 'var(--report-text-muted)', fontWeight: 700, textAlign: 'center' }}>{fmtSigned(difWTotal)}</td>
                      <td style={{ ...cell, color: 'var(--report-color-primary)', fontWeight: 700, textAlign: 'center' }}>Σ Dif. Ley</td>
                      <td style={{ ...cell, color: 'var(--report-color-primary)', fontWeight: 700, textAlign: 'center' }}>
                        {packing.barras} ({packing.barrasValidadas} / {packing.barrasPendientes})
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
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
              Total Barras (Val / Pend)
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {summary.totalBarras} ({summary.totalValidadas} / {summary.totalPendientes})
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
          </div>
          <div
            className="px-4 py-3 text-center"
            style={{ backgroundColor: 'var(--report-bg-card)' }}
          >
            <div
              className="text-[10px] font-bold uppercase tracking-wider mb-1"
              style={{ color: 'var(--report-text-muted)' }}
            >
              Barras Validadas
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {summary.totalValidadas}
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
              Barras Pendientes
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {summary.totalPendientes}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}