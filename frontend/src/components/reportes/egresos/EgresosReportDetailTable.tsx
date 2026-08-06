'use client';

import { formatNumber } from '@/lib/format';
import { User, Building } from 'lucide-react';
import type { CopyType } from '@/lib/generateDispatchPDF';
import type { EgresoDetailedRecord, EgresoSummary } from './types';

interface EgresosReportDetailTableProps {
  records: EgresoDetailedRecord[];
  summary: EgresoSummary;
  onReprint?: (record: EgresoDetailedRecord, copyType: CopyType) => void;
}

export default function EgresosReportDetailTable({ records, summary, onReprint }: EgresosReportDetailTableProps) {
  return (
    <div className="space-y-4">
      {records.map((egreso) => (
        <div
          key={egreso.id}
          className="rounded-lg overflow-hidden"
          style={{
            border: '1px solid var(--report-border-color)',
          }}
        >
          {/* Banner del egreso */}
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
                {egreso.id}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--report-text-muted)' }}>|</span>
              <span
                className="text-[11px] font-semibold"
                style={{ color: 'var(--report-text-table)' }}
              >
                {egreso.clienteDestino || '—'}
              </span>
            </div>
            <span
              className="text-[10px]"
              style={{ color: 'var(--report-text-muted)' }}
            >
              {egreso.fecha} | {egreso.destino}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onReprint?.(egreso, 'CLIENTE')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer border"
                style={{ background: 'rgba(19,145,105,0.08)', color: 'var(--report-color-primary)', borderColor: 'rgba(19,145,105,0.25)' }}
                title="Reimprimir comprobante Cliente"
              >
                <User className="w-3 h-3" /> Cliente
              </button>
              <button
                type="button"
                onClick={() => onReprint?.(egreso, 'EMPRESA')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer border"
                style={{ background: 'rgba(19,145,109,0.06)', color: 'var(--report-color-primary)', borderColor: 'rgba(19,145,109,0.15)' }}
                title="Descargar comprobante Empresa"
              >
                <Building className="w-3 h-3" /> Empresa
              </button>
            </div>
          </div>

          {/* Tabla de lingotes */}
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {[
                  { label: 'N° Lote / ID Barra', align: 'left' },
                  { label: 'N° Lingote / Serie', align: 'left' },
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
              {egreso.items.map((item, itemIdx) => (
                <tr
                  key={`${egreso.id}-${item.lingoteId}-${itemIdx}`}
                  style={{
                    backgroundColor: itemIdx % 2 === 0 ? 'transparent' : 'var(--report-bg-table-row-even)',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  <td className="px-4 py-3">
                    <span
                      className="font-mono text-[12px] font-semibold"
                      style={{ color: 'var(--report-text-table)' }}
                    >
                      {item.lote}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-mono text-[12px] font-semibold"
                      style={{ color: 'var(--report-color-primary)' }}
                    >
                      {item.lingoteId}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[12px] font-medium"
                    style={{ color: 'var(--report-text-main)' }}
                  >
                    {formatNumber(item.pesoBruto)}
                  </td>
                  <td
                    className="px-4 py-3 text-center text-[12px] font-medium"
                    style={{ color: 'var(--report-text-table)' }}
                  >
                    {formatNumber(item.ley, 4)}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[12px] font-medium"
                    style={{ color: 'var(--report-text-main)' }}
                  >
                    {formatNumber(item.pesoFino)}
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
                  Subtotal — {egreso.lingotes} Lingotes
                </td>
                <td className="px-4 py-3" />
                <td
                  className="px-4 py-3 text-right text-[12px] font-bold"
                  style={{ color: 'var(--report-color-primary)' }}
                >
                  {formatNumber(egreso.pesoBruto)} gr
                </td>
                <td className="px-4 py-3" />
                <td
                  className="px-4 py-3 text-right text-[12px] font-bold"
                  style={{ color: 'var(--report-color-primary)' }}
                >
                  {formatNumber(egreso.pesoFino)} gr
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
            TOTALES GENERALES — {summary.totalEgresos} Egresos
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
              Total Lingotes
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {summary.totalLingotes}
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
        </div>
      </div>
    </div>
  );
}
