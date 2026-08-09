'use client';

import { formatLey, formatNumber } from '@/lib/format';
import { User, Building } from 'lucide-react';
import type { CopyType } from '@/lib/generateDispatchPDF';
import type { EgresoRecord, EgresoSummary } from './types';

interface EgresosReportTableProps {
  records: EgresoRecord[];
  summary: EgresoSummary;
  dateFrom: string;
  dateTo: string;
  onReprint?: (record: EgresoRecord, copyType: CopyType) => void;
}

export default function EgresosReportTable({ records, summary, dateFrom, dateTo, onReprint }: EgresosReportTableProps) {
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
              { label: 'BI (gr)', align: 'right' },
              { label: 'BR (gr)', align: 'right' },
              { label: 'M (gr)', align: 'right' },
              { label: 'Ley Prom. (‰)', align: 'center' },
              { label: 'Comprobantes', align: 'center' },
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
                className="px-4 py-3 text-right text-[12px] font-medium"
                style={{ color: 'var(--report-text-main)' }}
              >
                {formatNumber(row.pesoBrutoBalanza)}
              </td>
              <td
                className="px-4 py-3 text-right text-[12px] font-medium"
                style={{ color: 'var(--report-text-main)' }}
              >
                {formatNumber(row.merma)}
              </td>
              <td
                className="px-4 py-3 text-center text-[12px] font-medium"
                style={{ color: 'var(--report-text-table)' }}
              >
                {formatLey(row.leyProm)}
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onReprint?.(row, 'CLIENTE')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer border"
                    style={{ background: 'rgba(19,145,105,0.08)', color: 'var(--report-color-primary)', borderColor: 'rgba(19,145,105,0.25)' }}
                    title="Reimprimir comprobante Cliente"
                  >
                    <User className="w-3 h-3" /> Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => onReprint?.(row, 'EMPRESA')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer border"
                    style={{ background: 'rgba(19,145,109,0.06)', color: 'var(--report-color-primary)', borderColor: 'rgba(19,145,109,0.15)' }}
                    title="Descargar comprobante Empresa"
                  >
                    <Building className="w-3 h-3" /> Empresa
                  </button>
                </div>
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
            <td
              className="px-4 py-3 text-right text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(summary.pesoBrutoBalanzaTotal)} gr
            </td>
            <td
              className="px-4 py-3 text-right text-[12px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(summary.mermaTotal)} gr
            </td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3" />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
