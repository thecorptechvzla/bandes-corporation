'use client';

import { formatLey, formatNumber } from '@/lib/format';
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
          <div className="pdf-metric-title" style={{ fontWeight: 700, color: '#139169', textTransform: 'uppercase' }}>Peso Bruto Egresado (BR)</div>
          <div className="pdf-metric-value" style={{ fontWeight: 700, color: '#111111', fontSize: '11px', margin: '1px 0' }}>{formatNumber(summary.pesoBrutoBalanzaTotal)} g</div>
          <div className="pdf-metric-footer" style={{ color: '#666666', fontSize: '7px' }}>BI: {formatNumber(summary.pesoBrutoTotal)} g | M: {formatNumber(summary.mermaTotal)} g</div>
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
                { label: 'N° Egreso / Guía', width: '16%' },
                { label: 'Cliente', width: '18%' },
                ...(showFecha ? [{ label: 'Fecha', width: '9%' }] : []),
                { label: 'Lingotes', width: '6%' },
                { label: 'BI (g)', width: '12%' },
                { label: 'BR (g)', width: '12%' },
                { label: 'M (g)', width: '12%' },
                { label: 'Ley Prom. (‰)', width: '8%' },
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
                <td style={{ padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #e6e6e6', textAlign: 'right', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(row.pesoBrutoBalanza)}</td>
                <td style={{ padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #e6e6e6', textAlign: 'right', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(row.merma)}</td>
                <td style={{ padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #e6e6e6', textAlign: 'center', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatLey(row.leyProm)}</td>
              </tr>
            ))}
            <tr>
              {[
                { text: `TOTALES (${summary.totalEgresos} Egresos)`, align: 'left' as const },
                { text: '', align: 'left' as const },
                ...(showFecha ? [{ text: '', align: 'center' as const }] : []),
                { text: String(summary.totalLingotes), align: 'center' as const },
                { text: `${formatNumber(summary.pesoBrutoTotal)} g`, align: 'right' as const },
                { text: `${formatNumber(summary.pesoBrutoBalanzaTotal)} g`, align: 'right' as const },
                { text: `${formatNumber(summary.mermaTotal)} g`, align: 'right' as const },
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

              {/* Lotes con sus barras */}
              {egreso.lotes.map((lote, loteIdx) => (
                <div key={`${egreso.id}-lote-${loteIdx}`} style={{ borderBottom: loteIdx < egreso.lotes.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                  {/* Cabecera del lote */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f5f8f7', padding: '2px 6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '7px', color: '#333333' }}>{lote.loteName}</span>
                      {lote.recovered != null && (
                        <span style={{ fontSize: '6px', color: '#777777' }}>Peso Bruto Recuperado: {formatNumber(lote.recovered)} gr</span>
                      )}
                      {lote.ley != null && (
                        <span style={{ fontSize: '6px', color: '#777777' }}>Ley (‰): {formatLey(lote.ley)}</span>
                      )}
                    </div>
                    <span style={{ fontSize: '6px', fontWeight: 600, color: '#777777' }}>
                      {lote.barras.length} {lote.barras.length === 1 ? 'barra' : 'barras'}
                    </span>
                  </div>

                  {/* Sub-tabla de barras */}
                  {lote.barras.length > 0 && (
                    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', boxSizing: 'border-box' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '14%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '6px', padding: '2px 4px', textAlign: 'left', border: '1px solid #139169' }}>CÓDIGO BARRA</th>
                          <th style={{ width: '14%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '6px', padding: '2px 4px', textAlign: 'right', border: '1px solid #139169' }}>BI (GR)</th>
                          <th style={{ width: '14%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '6px', padding: '2px 4px', textAlign: 'right', border: '1px solid #139169' }}>BR (GR)</th>
                          <th style={{ width: '14%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '6px', padding: '2px 4px', textAlign: 'right', border: '1px solid #139169' }}>M (GR)</th>
                          <th style={{ width: '10%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '6px', padding: '2px 4px', textAlign: 'center', border: '1px solid #139169' }}>LEY (‰)</th>
                          <th style={{ width: '34%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '6px', padding: '2px 4px', textAlign: 'left', border: '1px solid #139169' }}>PROVEEDOR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lote.barras.map((barra, barraIdx) => (
                          <tr key={`${egreso.id}-lote-${loteIdx}-barra-${barraIdx}`}>
                            <td style={{ padding: '1px 4px', fontSize: '6.5px', borderBottom: '1px solid #f0f0f0', backgroundColor: barraIdx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>
                              <span style={{ fontFamily: 'monospace', color: '#139169', fontWeight: 700 }}>{barra.barCode}</span>
                            </td>
                            <td style={{ padding: '1px 4px', fontSize: '6.5px', borderBottom: '1px solid #f0f0f0', textAlign: 'right', backgroundColor: barraIdx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(barra.pesoBruto)}</td>
                            <td style={{ padding: '1px 4px', fontSize: '6.5px', borderBottom: '1px solid #f0f0f0', textAlign: 'right', backgroundColor: barraIdx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(barra.pesoBalanza ?? barra.pesoBruto)}</td>
                            <td style={{ padding: '1px 4px', fontSize: '6.5px', borderBottom: '1px solid #f0f0f0', textAlign: 'right', color: (barra.pesoBalanza ?? barra.pesoBruto) < barra.pesoBruto ? '#c0392b' : 'inherit', backgroundColor: barraIdx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(barra.pesoBruto - (barra.pesoBalanza ?? barra.pesoBruto))}</td>
                            <td style={{ padding: '1px 4px', fontSize: '6.5px', borderBottom: '1px solid #f0f0f0', textAlign: 'center', backgroundColor: barraIdx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatLey(barra.ley)}</td>
                            <td style={{ padding: '1px 4px', fontSize: '6.5px', borderBottom: '1px solid #f0f0f0', backgroundColor: barraIdx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>
                              {barra.proveedor}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}

              {/* Subtotal */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169', padding: '2px 6px' }}>
                <span style={{ fontSize: '7px', fontWeight: 700, color: '#139169' }}>Subtotal — {egreso.lingotes} Lingotes</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '7px', fontWeight: 700, color: '#139169' }}>BI: {formatNumber(egreso.pesoBruto)} gr</span>
                  <span style={{ fontSize: '7px', fontWeight: 700, color: '#139169' }}>BR: {formatNumber(egreso.pesoBrutoBalanza)} gr</span>
                  <span style={{ fontSize: '7px', fontWeight: 700, color: '#139169' }}>M: {formatNumber(egreso.merma)} gr</span>
                  <span style={{ fontSize: '7px', fontWeight: 700, color: '#139169' }}>Fino: {formatNumber(egreso.pesoFino)} gr</span>
                </div>
              </div>
            </div>
          ))}

          {/* Totales Generales */}
          <div className="pdf-totals-card" style={{ border: '2px solid #139169', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
            <div className="pdf-totals-header" style={{ backgroundColor: '#139169', padding: '2px 6px' }}>
              <span className="pdf-totals-header-text" style={{ fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '7.5px' }}>TOTALES GENERALES — {summary.totalEgresos} Egresos</span>
            </div>
            <div style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
              <div style={{ display: 'table-cell', width: '20%', padding: '4px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>
                <div className="pdf-totals-label" style={{ fontWeight: 700, color: '#666666', textTransform: 'uppercase', fontSize: '6px', marginBottom: '1px' }}>Total Lingotes</div>
                <div className="pdf-totals-value" style={{ fontWeight: 700, color: '#139169', fontSize: '10px' }}>{summary.totalLingotes}</div>
              </div>
              <div style={{ display: 'table-cell', width: '20%', padding: '4px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>
                <div className="pdf-totals-label" style={{ fontWeight: 700, color: '#666666', textTransform: 'uppercase', fontSize: '6px', marginBottom: '1px' }}>Peso Bruto Total (BI)</div>
                <div className="pdf-totals-value" style={{ fontWeight: 700, color: '#139169', fontSize: '10px' }}>{formatNumber(summary.pesoBrutoTotal)} g</div>
              </div>
              <div style={{ display: 'table-cell', width: '20%', padding: '4px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>
                <div className="pdf-totals-label" style={{ fontWeight: 700, color: '#666666', textTransform: 'uppercase', fontSize: '6px', marginBottom: '1px' }}>Peso Balanza Total (BR)</div>
                <div className="pdf-totals-value" style={{ fontWeight: 700, color: '#139169', fontSize: '10px' }}>{formatNumber(summary.pesoBrutoBalanzaTotal)} g</div>
              </div>
              <div style={{ display: 'table-cell', width: '20%', padding: '4px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>
                <div className="pdf-totals-label" style={{ fontWeight: 700, color: '#666666', textTransform: 'uppercase', fontSize: '6px', marginBottom: '1px' }}>Merma Total</div>
                <div className="pdf-totals-value" style={{ fontWeight: 700, color: '#139169', fontSize: '10px' }}>{formatNumber(summary.mermaTotal)} g</div>
              </div>
              <div style={{ display: 'table-cell', width: '20%', padding: '4px', textAlign: 'center' }}>
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
