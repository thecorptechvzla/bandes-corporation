'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { formatLey, formatNumber } from '@/lib/format';
import { User, Building, ChevronDown, ChevronRight } from 'lucide-react';
import type { CopyType } from '@/lib/generateDispatchPDF';
import type { EgresoDetailedRecord, EgresoSummary } from './types';

interface EgresosReportDetailTableProps {
  records: EgresoDetailedRecord[];
  summary: EgresoSummary;
  onReprint?: (record: EgresoDetailedRecord, copyType: CopyType) => void;
}

export default function EgresosReportDetailTable({ records, summary, onReprint }: EgresosReportDetailTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setExpandedIds(new Set(records.map((e) => e.id)));
  }, [records]);

  const toggleEgreso = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
            className="flex items-center justify-between px-4 py-3 flex-wrap cursor-pointer select-none"
            style={{
              background: 'linear-gradient(135deg, rgba(19, 145, 105, 0.15), rgba(19, 145, 105, 0.05))',
              borderBottom: '2px solid var(--report-color-primary)',
            }}
            onClick={() => toggleEgreso(egreso.id)}
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
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onReprint?.(egreso, 'CLIENTE')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 cursor-pointer border"
                style={{ background: 'rgba(19,145,105,0.08)', color: 'var(--report-color-primary)', borderColor: 'rgba(19,145,105,0.25)' }}
                title="Reimprimir comprobante Cliente"
              >
                <User className="w-3 h-3" /> Cliente
              </button>
              <button
                type="button"
                onClick={() => onReprint?.(egreso, 'EMPRESA')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 cursor-pointer border"
                style={{ background: 'rgba(19,145,109,0.06)', color: 'var(--report-color-primary)', borderColor: 'rgba(19,145,109,0.15)' }}
                title="Descargar comprobante Empresa"
              >
                <Building className="w-3 h-3" /> Empresa
              </button>
              {expandedIds.has(egreso.id) ? (
                <ChevronDown className="w-4 h-4" style={{ color: 'var(--report-color-primary)' }} />
              ) : (
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--report-text-muted)' }} />
              )}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {expandedIds.has(egreso.id) && (
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
          {/* Lotes con sus barras */}
          {egreso.lotes.map((lote, loteIdx) => (
            <div
              key={`${egreso.id}-lote-${loteIdx}`}
              className="rounded-lg overflow-hidden"
              style={{
                border: '1px solid var(--report-border-color)',
                marginBottom: '8px',
              }}
            >
              {/* Cabecera del lote */}
              <div
                className="flex items-center justify-between px-4 py-2"
                style={{
                  backgroundColor: 'var(--report-bg-main)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="font-mono font-bold text-[11px]"
                    style={{ color: 'var(--report-text-table)' }}
                  >
                    {lote.loteName}
                  </span>
                  {lote.recovered != null && (
                    <span
                      className="text-[10px]"
                      style={{ color: 'var(--report-text-muted)' }}
                    >
                      Peso Bruto Recuperado: {formatNumber(lote.recovered)} gr
                    </span>
                  )}
                  {lote.ley != null && (
                    <span
                      className="text-[10px]"
                      style={{ color: 'var(--report-text-muted)' }}
                    >
                      Ley (‰): {formatLey(lote.ley)}
                    </span>
                  )}
                </div>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: 'var(--report-text-muted)' }}
                >
                  {lote.barras.length} {lote.barras.length === 1 ? 'barra' : 'barras'}
                </span>
              </div>

              {/* Sub-tabla de barras */}
              {lote.barras.length > 0 && (
                <table className="w-full border-collapse table-fixed">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[16%]" />
                    <col className="w-[16%]" />
                    <col className="w-[12%]" />
                    <col className="w-[14%]" />
                    <col className="w-[20%]" />
                  </colgroup>
                  <thead>
                    <tr>
                      {[
                        { label: 'Código Barra', align: 'left' as const },
                        { label: 'BI (gr)', align: 'right' as const },
                        { label: 'BR (gr)', align: 'right' as const },
                        { label: 'M (gr)', align: 'right' as const },
                        { label: 'Ley (‰)', align: 'center' as const },
                        { label: 'Proveedor', align: 'left' as const },
                      ].map((h) => (
                        <th
                          key={h.label}
                          className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            textAlign: h.align,
                            backgroundColor: 'rgba(19, 145, 105, 0.06)',
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
                    {lote.barras.map((barra, barraIdx) => (
                      <tr
                        key={`${egreso.id}-lote-${loteIdx}-barra-${barraIdx}`}
                        style={{
                          backgroundColor: barraIdx % 2 === 0 ? 'transparent' : 'var(--report-bg-table-row-even)',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                        }}
                      >
                        <td className="px-4 py-2">
                          <span
                            className="font-mono text-[11px] font-semibold"
                            style={{ color: 'var(--report-color-primary)' }}
                          >
                            {barra.barCode}
                          </span>
                        </td>
                        <td
                          className="px-4 py-2 text-right text-[11px] font-medium"
                          style={{ color: 'var(--report-text-main)' }}
                        >
                          {formatNumber(barra.pesoBruto)}
                        </td>
                        <td
                          className="px-4 py-2 text-right text-[11px] font-medium"
                          style={{ color: 'var(--report-text-main)' }}
                        >
                          {formatNumber(barra.pesoBalanza ?? barra.pesoBruto)}
                        </td>
                        <td
                          className="px-4 py-2 text-right text-[11px] font-medium"
                          style={{
                            color: (barra.pesoBalanza ?? barra.pesoBruto) >= barra.pesoBruto
                              ? 'var(--report-text-main)'
                              : '#c0392b',
                          }}
                        >
                          {formatNumber(barra.pesoBruto - (barra.pesoBalanza ?? barra.pesoBruto))}
                        </td>
                        <td
                          className="px-4 py-2 text-center text-[11px] font-medium"
                          style={{ color: 'var(--report-text-table)' }}
                        >
                          {formatLey(barra.ley)}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className="text-[11px]"
                            style={{ color: 'var(--report-text-table)' }}
                          >
                            {barra.proveedor}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: 'var(--report-bg-main)', borderTop: '2px solid var(--report-color-primary)' }}>
                      <td className="px-4 py-3 text-[12px] font-bold" style={{ color: 'var(--report-color-primary)' }}>
                        Subtotal — {egreso.lingotes} {egreso.lingotes === 1 ? 'Lingote' : 'Lingotes'}
                      </td>
                      <td className="px-4 py-3 text-right text-[12px] font-bold" style={{ color: 'var(--report-color-primary)' }}>
                        {formatNumber(egreso.pesoBruto)}
                      </td>
                      <td className="px-4 py-3 text-right text-[12px] font-bold" style={{ color: 'var(--report-color-primary)' }}>
                        {formatNumber(egreso.pesoBrutoBalanza)}
                      </td>
                      <td className="px-4 py-3 text-right text-[12px] font-bold" style={{ color: 'var(--report-color-primary)' }}>
                        {formatNumber(egreso.merma)}
                      </td>
                      <td className="px-4 py-3 text-center text-[12px] font-bold" style={{ color: 'var(--report-color-primary)' }}>
                        {formatLey(egreso.leyProm)}‰
                      </td>
                      <td className="px-4 py-3 text-right text-[12px] font-bold" style={{ color: 'var(--report-color-primary)' }}>
                        Fino: {formatNumber(egreso.pesoFino)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          ))}


              </motion.div>
            )}
          </AnimatePresence>
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
              Peso Bruto Total (BI)
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
              Peso Balanza Total (BR)
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(summary.pesoBrutoBalanzaTotal)} gr
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
              Merma Total
            </div>
            <div
              className="text-[14px] font-bold"
              style={{ color: 'var(--report-color-primary)' }}
            >
              {formatNumber(summary.mermaTotal)} gr
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
