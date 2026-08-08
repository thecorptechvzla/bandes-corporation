'use client';

import { formatNumber } from '@/lib/format';
import type { EgresosReportData, EgresoReportType } from './types';

interface EgresosReportPdfTemplateProps {
  data: EgresosReportData;
  reportId: string;
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  clienteName: string;
  reportType: EgresoReportType;
}

export default function EgresosReportPdfTemplate({
  data,
  reportId,
  generatedAt,
  dateFrom,
  dateTo,
  clienteName,
  reportType,
}: EgresosReportPdfTemplateProps) {
  const { summary, records, detailed = [] } = data;

  return (
    <div id="egresos-pdf-template" className={reportType === 'detallado' ? 'pdf-container-detailed' : 'pdf-container'}>
      {/* MEMBRETE OFICIAL */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', borderBottom: '2px solid #139169', paddingBottom: '6px' }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'middle' }}>
              <div className="pdf-brand-logo" style={{ fontWeight: 900, color: '#139169', letterSpacing: '1.5px', textTransform: 'uppercase' }}>BANDES</div>
              <div className="pdf-brand-subtext" style={{ color: '#555555', marginTop: '1px', fontWeight: 600 }}>Banco de Desarrollo Económico y Social de Venezuela</div>
            </td>
            <td className="pdf-brand-rif" style={{ verticalAlign: 'middle', textAlign: 'right', color: '#444444' }}>
              <div><strong>R.I.F.:</strong> G-20001643-0</div>
              <div>Gerencia General de Operaciones</div>
              <div>Caracas, Venezuela</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* TÍTULO DEL REPORTE */}
      <div className="pdf-title-block" style={{ backgroundColor: '#f8faf9', borderLeft: '4px solid #139169', borderRadius: '0 6px 6px 0' }}>
        <div className="pdf-main-title" style={{ color: '#139169', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Reporte Desglosado de Egresos de Material
        </div>
        <div className="pdf-subtitle" style={{ color: '#666666', marginTop: '1px' }}>
          {reportType === 'detallado'
            ? 'Desglose por lingote individual de cada egreso'
            : 'Resumen consolidado de salidas de material'}
        </div>
      </div>

      {/* DATOS DE FILTRO Y GENERACIÓN */}
      <div className="pdf-meta-grid" style={{ display: 'table', width: '100%', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
        <div style={{ display: 'table-cell', width: '50%', verticalAlign: 'top' }}>
          <div className="pdf-meta-label" style={{ marginBottom: '1px' }}>
            <span style={{ fontWeight: 700, color: '#139169' }}>Rango de Fechas:</span>{' '}
            <span className="pdf-meta-value">{dateFrom} al {dateTo}</span>
          </div>
          <div className="pdf-meta-label" style={{ marginBottom: '1px' }}>
            <span style={{ fontWeight: 700, color: '#139169' }}>Cliente:</span>{' '}
            <span className="pdf-meta-value">{clienteName}</span>
          </div>
          <div className="pdf-meta-label">
            <span style={{ fontWeight: 700, color: '#139169' }}>Tipo de Reporte:</span>{' '}
            <span className="pdf-meta-value">{reportType === 'detallado' ? 'Detallado' : 'Resumido'}</span>
          </div>
        </div>
        <div style={{ display: 'table-cell', width: '50%', verticalAlign: 'top', textAlign: 'right', borderLeft: '1px solid #f0f0f0', paddingLeft: '10px' }}>
          <div className="pdf-meta-label" style={{ marginBottom: '1px' }}>
            <span style={{ fontWeight: 700, color: '#139169' }}>ID Documento:</span>{' '}
            <span className="pdf-meta-value">{reportId}</span>
          </div>
          <div className="pdf-meta-label">
            <span style={{ fontWeight: 700, color: '#139169' }}>Fecha de Generación:</span>{' '}
            <span className="pdf-meta-value">{generatedAt}</span>
          </div>
        </div>
      </div>

      {/* MÉTRICAS RESUMEN */}
      <div style={{ display: 'table', width: '100%', tableLayout: 'fixed', marginBottom: '8px' }}>
        <div style={{ display: 'table-cell', width: '31%', backgroundColor: '#f4f9f7', border: '1px solid #c2e5d9', borderRadius: '4px', padding: '4px', textAlign: 'center', boxSizing: 'border-box' }}>
          <div className="pdf-metric-title" style={{ fontWeight: 700, color: '#139169', textTransform: 'uppercase' }}>Total Egresos</div>
          <div className="pdf-metric-value" style={{ fontWeight: 700, color: '#111111', fontSize: '11px', margin: '1px 0' }}>{summary.totalEgresos}</div>
          <div className="pdf-metric-footer" style={{ color: '#666666', fontSize: '7px' }}>Salidas en el período</div>
        </div>
        <div style={{ display: 'table-cell', width: '3.5%' }} />
        <div style={{ display: 'table-cell', width: '31%', backgroundColor: '#f4f9f7', border: '1px solid #c2e5d9', borderRadius: '4px', padding: '4px', textAlign: 'center', boxSizing: 'border-box' }}>
          <div className="pdf-metric-title" style={{ fontWeight: 700, color: '#139169', textTransform: 'uppercase' }}>Total Lingotes</div>
          <div className="pdf-metric-value" style={{ fontWeight: 700, color: '#111111', fontSize: '11px', margin: '1px 0' }}>{summary.totalLingotes}</div>
          <div className="pdf-metric-footer" style={{ color: '#666666', fontSize: '7px' }}>Egresados</div>
        </div>
        <div style={{ display: 'table-cell', width: '3.5%' }} />
        <div style={{ display: 'table-cell', width: '31%', backgroundColor: '#f4f9f7', border: '1px solid #c2e5d9', borderRadius: '4px', padding: '4px', textAlign: 'center', boxSizing: 'border-box' }}>
          <div className="pdf-metric-title" style={{ fontWeight: 700, color: '#139169', textTransform: 'uppercase' }}>Peso Bruto Total</div>
          <div className="pdf-metric-value" style={{ fontWeight: 700, color: '#111111', fontSize: '11px', margin: '1px 0' }}>{formatNumber(summary.pesoBrutoTotal)} g</div>
          <div className="pdf-metric-footer" style={{ color: '#666666', fontSize: '7px' }}>Fino: {formatNumber(summary.pesoFinoTotal)} g</div>
        </div>
      </div>

      {/* TABLA */}
      {reportType === 'resumido' ? (() => {
        const showFecha = dateFrom !== dateTo;
        return (
        <table className="pdf-table" style={{ marginBottom: '8px' }}>
          <thead>
            <tr>
              {[
                { label: 'N° Egreso / Guía', width: '20%' },
                { label: 'Cliente', width: '25%' },
                ...(showFecha ? [{ label: 'Fecha', width: '10%' }] : []),
                { label: 'Lingotes', width: '8%' },
                { label: 'Peso Bruto (g)', width: '15%' },
                { label: 'Ley Prom.', width: '10%' },
              ].map((h) => (
                <th key={h.label} style={{ backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7.5px', padding: '3px 4px', textAlign: 'left', border: '1px solid #139169', width: h.width }}>
                  {h.label.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((row, idx) => (
              <tr key={row.id}>
                <td style={{ padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #e6e6e6', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>
                  <span style={{ fontWeight: 700, color: '#139169', fontFamily: 'monospace' }}>{row.id}</span>
                  <span style={{ fontSize: '6.5px', color: '#777777', display: 'block' }}>{row.guia}</span>
                </td>
                <td style={{ padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #e6e6e6', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>
                  <strong>{row.cliente}</strong>
                </td>
                {showFecha && (
                  <td style={{ padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #e6e6e6', textAlign: 'center', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{row.fecha}</td>
                )}
                <td style={{ padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #e6e6e6', textAlign: 'center', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{row.lingotes}</td>
                <td style={{ padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #e6e6e6', textAlign: 'right', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(row.pesoBruto)}</td>
                <td style={{ padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #e6e6e6', textAlign: 'center', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(row.leyProm, 2)}</td>
              </tr>
            ))}
            <tr>
              {[
                { text: `TOTALES (${summary.totalEgresos} Egresos)`, align: 'left' as const },
                { text: '', align: 'left' as const },
                ...(showFecha ? [{ text: '', align: 'center' as const }] : []),
                { text: String(summary.totalLingotes), align: 'center' as const },
                { text: `${formatNumber(summary.pesoBrutoTotal)} g`, align: 'right' as const },
                { text: '', align: 'center' as const },
              ].map((cell, i) => (
                <td key={i} style={{ padding: '2px 4px', fontSize: '7.5px', backgroundColor: '#eaf4f0', fontWeight: 700, color: '#139169', borderTop: '2px solid #139169', borderBottom: '2px solid #139169', textAlign: cell.align }}>
                  {cell.text}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        );
      })(      ) : (
        <>
          {detailed.map((egreso) => (
            <div key={egreso.id} className="pdf-packing-block" style={{ border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px', breakInside: 'avoid' }}>
              {/* Banner */}
              <div className="pdf-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(19,145,105,0.12), rgba(19,145,105,0.04))', borderBottom: '2px solid #139169', padding: '2px 6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, color: '#139169', fontFamily: 'monospace', fontSize: '8px' }}>{egreso.id}</span>
                  <span style={{ color: '#cccccc', fontSize: '7px' }}>|</span>
                  <span style={{ color: '#333333', fontSize: '7px', fontWeight: 600 }}>{egreso.cliente}</span>
                </div>
                <span style={{ color: '#777777', fontSize: '6.5px' }}>{egreso.fecha} | {egreso.destino}</span>
              </div>
              {/* Tabla de lingotes */}
              <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', boxSizing: 'border-box' }}>
                <thead>
                  <tr>
                    <th style={{ width: '20%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7px', padding: '2px 4px', textAlign: 'left', border: '1px solid #139169' }}>LOTE / BARRA</th>
                    <th style={{ width: '18%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7px', padding: '2px 4px', textAlign: 'left', border: '1px solid #139169' }}>LINGOTE / SERIE</th>
                    <th style={{ width: '20%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7px', padding: '2px 4px', textAlign: 'right', border: '1px solid #139169' }}>PESO BRUTO (GR)</th>
                    <th style={{ width: '14%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7px', padding: '2px 4px', textAlign: 'center', border: '1px solid #139169' }}>LEY</th>
                    <th style={{ width: '28%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7px', padding: '2px 4px', textAlign: 'right', border: '1px solid #139169' }}>PESO FINO (GR)</th>
                  </tr>
                </thead>
                <tbody>
                  {egreso.items.map((item, itemIdx) => (
                    <tr key={`${egreso.id}-${item.lingoteId}-${itemIdx}`}>
                      <td style={{ padding: '2px 4px', fontSize: '7px', borderBottom: '1px solid #f0f0f0', backgroundColor: itemIdx % 2 === 1 ? '#fbfdfc' : 'transparent', wordWrap: 'break-word', overflow: 'hidden' }}>
                        <span style={{ fontFamily: 'monospace', color: '#333' }}>{item.lote}</span>
                      </td>
                      <td style={{ padding: '2px 4px', fontSize: '7px', borderBottom: '1px solid #f0f0f0', backgroundColor: itemIdx % 2 === 1 ? '#fbfdfc' : 'transparent', wordWrap: 'break-word', overflow: 'hidden' }}>
                        <span style={{ fontFamily: 'monospace', color: '#139169', fontWeight: 700 }}>{item.lingoteId}</span>
                      </td>
                      <td style={{ padding: '2px 4px', fontSize: '7px', borderBottom: '1px solid #f0f0f0', textAlign: 'right', backgroundColor: itemIdx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(item.pesoBruto)}</td>
                      <td style={{ padding: '2px 4px', fontSize: '7px', borderBottom: '1px solid #f0f0f0', textAlign: 'center', backgroundColor: itemIdx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(item.ley, 2)}</td>
                      <td style={{ padding: '2px 4px', fontSize: '7px', borderBottom: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 700, backgroundColor: itemIdx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(item.pesoFino)}</td>
                    </tr>
                  ))}
                  {/* Subtotal */}
                  <tr>
                    <td style={{ padding: '2px 4px', fontSize: '7px', backgroundColor: '#eaf4f0', fontWeight: 700, color: '#139169', borderTop: '2px solid #139169' }}>Subtotal — {egreso.lingotes} Lingotes</td>
                    <td style={{ padding: '2px 4px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169' }} />
                    <td style={{ padding: '2px 4px', fontSize: '7px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169', textAlign: 'right', fontWeight: 700, color: '#139169' }}>{formatNumber(egreso.pesoBruto)} g</td>
                    <td style={{ padding: '2px 4px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169' }} />
                    <td style={{ padding: '2px 4px', fontSize: '7px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169', textAlign: 'right', fontWeight: 700, color: '#139169' }}>{formatNumber(egreso.pesoFino)} g</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}

          {/* Totales Generales */}
          <div className="pdf-totals-card" style={{ border: '2px solid #139169', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
            <div className="pdf-totals-header" style={{ backgroundColor: '#139169', padding: '2px 6px' }}>
              <span className="pdf-totals-header-text" style={{ fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '7.5px' }}>TOTALES GENERALES — {summary.totalEgresos} Egresos</span>
            </div>
            <div style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
              <div style={{ display: 'table-cell', width: '33.33%', padding: '4px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>
                <div className="pdf-totals-label" style={{ fontWeight: 700, color: '#666666', textTransform: 'uppercase', fontSize: '6px', marginBottom: '1px' }}>Total Lingotes</div>
                <div className="pdf-totals-value" style={{ fontWeight: 700, color: '#139169', fontSize: '10px' }}>{summary.totalLingotes}</div>
              </div>
              <div style={{ display: 'table-cell', width: '33.33%', padding: '4px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>
                <div className="pdf-totals-label" style={{ fontWeight: 700, color: '#666666', textTransform: 'uppercase', fontSize: '6px', marginBottom: '1px' }}>Peso Bruto Total</div>
                <div className="pdf-totals-value" style={{ fontWeight: 700, color: '#139169', fontSize: '10px' }}>{formatNumber(summary.pesoBrutoTotal)} g</div>
              </div>
              <div style={{ display: 'table-cell', width: '33.34%', padding: '4px', textAlign: 'center' }}>
                <div className="pdf-totals-label" style={{ fontWeight: 700, color: '#666666', textTransform: 'uppercase', fontSize: '6px', marginBottom: '1px' }}>Peso Fino Total</div>
                <div className="pdf-totals-value" style={{ fontWeight: 700, color: '#139169', fontSize: '10px' }}>{formatNumber(summary.pesoFinoTotal)} g</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
