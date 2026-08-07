'use client';

import { formatNumber } from '@/lib/format';
import type { ProcesosReportData, ProcesoReportType } from './types';

interface ProcesosReportPdfTemplateProps {
  data: ProcesosReportData;
  reportId: string;
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  proveedorName: string;
  reportType: ProcesoReportType;
}

export default function ProcesosReportPdfTemplate({
  data,
  reportId,
  generatedAt,
  dateFrom,
  dateTo,
  proveedorName,
  reportType,
}: ProcesosReportPdfTemplateProps) {
  const { summary, records, detailed = [] } = data;

  return (
    <div id="procesos-pdf-template" className={reportType === 'detallado' ? 'pdf-container-detailed' : 'pdf-container'}>
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
          Reporte de Procesos Recibidos y Procesados
        </div>
        <div className="pdf-subtitle" style={{ color: '#666666', marginTop: '1px' }}>
          {reportType === 'detallado'
            ? 'Desglose por barra individual de cada proceso'
            : 'Resumen consolidado de procesos de fundición y refinación'}
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
            <span style={{ fontWeight: 700, color: '#139169' }}>Proveedor:</span>{' '}
            <span className="pdf-meta-value">{proveedorName}</span>
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
          <div className="pdf-metric-title" style={{ fontWeight: 700, color: '#139169', textTransform: 'uppercase' }}>Total Procesos</div>
          <div className="pdf-metric-value" style={{ fontWeight: 700, color: '#111111', fontSize: '11px', margin: '1px 0' }}>{summary.totalProcesos}</div>
          <div className="pdf-metric-footer" style={{ color: '#666666', fontSize: '7px' }}>Activos y Completados</div>
        </div>
        <div style={{ display: 'table-cell', width: '3.5%' }} />
        <div style={{ display: 'table-cell', width: '31%', backgroundColor: '#f4f9f7', border: '1px solid #c2e5d9', borderRadius: '4px', padding: '4px', textAlign: 'center', boxSizing: 'border-box' }}>
          <div className="pdf-metric-title" style={{ fontWeight: 700, color: '#139169', textTransform: 'uppercase' }}>Total Barras</div>
          <div className="pdf-metric-value" style={{ fontWeight: 700, color: '#111111', fontSize: '11px', margin: '1px 0' }}>{summary.totalBarras}</div>
          <div className="pdf-metric-footer" style={{ color: '#666666', fontSize: '7px' }}>Ingresadas a proceso</div>
        </div>
        <div style={{ display: 'table-cell', width: '3.5%' }} />
        <div style={{ display: 'table-cell', width: '31%', backgroundColor: '#f4f9f7', border: '1px solid #c2e5d9', borderRadius: '4px', padding: '4px', textAlign: 'center', boxSizing: 'border-box' }}>
          <div className="pdf-metric-title" style={{ fontWeight: 700, color: '#139169', textTransform: 'uppercase' }}>Peso Bruto Resultante</div>
          <div className="pdf-metric-value" style={{ fontWeight: 700, color: '#111111', fontSize: '11px', margin: '1px 0' }}>{formatNumber(summary.pesoResultanteTotal)} g</div>
          <div className="pdf-metric-footer" style={{ color: '#666666', fontSize: '7px' }}>Rendimiento: {formatNumber(summary.rendimientoProm, 1)}%</div>
        </div>
      </div>

      {/* TABLA */}
      {reportType === 'resumido' ? (
        <table className="pdf-table" style={{ marginBottom: '8px' }}>
          <thead>
            <tr>
              {[
                { label: 'N° Proceso / Tipo', width: '18%' },
                { label: 'Proveedor(es)', width: '22%' },
                { label: 'Mixto', width: '8%' },
                { label: 'Barras', width: '7%' },
                { label: 'Peso Bruto (g)', width: '13%' },
                { label: 'Peso Bruto de Salida (g)', width: '13%' },
                { label: 'Estatus', width: '10%' },
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
                  <span style={{ fontSize: '6.5px', color: '#777777', display: 'block' }}>{row.tipo}</span>
                </td>
                <td style={{ padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #e6e6e6', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent', verticalAlign: 'middle' }}>
                  {row.proveedores.map((prov, i) => (
                    <span key={i} style={{ display: 'block', fontWeight: 700, color: '#e1e3e6', marginBottom: i < row.proveedores.length - 1 ? '1px' : 0 }}>{prov}</span>
                  ))}
                </td>
                <td style={{ padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #e6e6e6', textAlign: 'center', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>
                  <span style={{ padding: '1px 4px', borderRadius: '3px', fontSize: '6.5px', fontWeight: 700, backgroundColor: row.esMixto ? '#e0f2fe' : '#f3f4f6', color: row.esMixto ? '#0284c7' : '#6b7280' }}>
                    {row.esMixto ? 'SÍ' : 'NO'}
                  </span>
                </td>
                <td style={{ padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #e6e6e6', textAlign: 'center', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{row.barras}</td>
                <td style={{ padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #e6e6e6', textAlign: 'right', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(row.pesoInicial)}</td>
                <td style={{ padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #e6e6e6', textAlign: 'right', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(row.pesoObtenido)}</td>
                <td style={{ padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #e6e6e6', textAlign: 'center', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>
                  <span style={{ padding: '1px 4px', borderRadius: '3px', fontSize: '6.5px', fontWeight: 700, backgroundColor: row.estatus === 'Completado' ? '#eaf4f0' : '#e8f4fd', color: row.estatus === 'Completado' ? '#139169' : '#0ea5e9' }}>
                    {row.estatus}
                  </span>
                </td>
              </tr>
            ))}
            <tr>
              {[
                { text: `TOTALES (${summary.totalProcesos} Procesos)`, align: 'left' as const },
                { text: '—', align: 'left' as const },
                { text: '', align: 'center' as const },
                { text: String(summary.totalBarras), align: 'center' as const },
                { text: `${formatNumber(records.reduce((a, r) => a + r.pesoInicial, 0))} g`, align: 'right' as const },
                { text: `${formatNumber(summary.pesoResultanteTotal)} g`, align: 'right' as const },
                { text: `Rend: ${formatNumber(summary.rendimientoProm, 1)}%`, align: 'left' as const },
              ].map((cell, i) => (
                <td key={i} style={{ padding: '2px 4px', fontSize: '7.5px', backgroundColor: '#eaf4f0', fontWeight: 700, color: '#139169', borderTop: '2px solid #139169', borderBottom: '2px solid #139169', textAlign: cell.align }}>
                  {cell.text}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      ) : (
        <>
          {detailed.map((proceso) => (
            <div key={proceso.id} className="pdf-packing-block" style={{ border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
              {/* Banner */}
              <div className="pdf-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(19,145,105,0.12), rgba(19,145,105,0.04))', borderBottom: '2px solid #139169', padding: '2px 6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, color: '#139169', fontFamily: 'monospace', fontSize: '8px' }}>{proceso.id}</span>
                  {proceso.esMixto && (
                    <span style={{ padding: '1px 4px', borderRadius: '3px', fontSize: '6.5px', fontWeight: 700, backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid rgba(0,180,216,0.4)' }}>MIXTO</span>
                  )}
                </div>
                <span style={{ padding: '1px 4px', borderRadius: '3px', fontSize: '6.5px', fontWeight: 700, backgroundColor: proceso.estatus === 'Completado' ? '#eaf4f0' : '#e8f4fd', color: proceso.estatus === 'Completado' ? '#139169' : '#0ea5e9' }}>
                  {proceso.estatus}
                </span>
              </div>
              {/* Tabla de barras */}
              <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', boxSizing: 'border-box' }}>
                <thead>
                  <tr>
                    <th style={{ width: '17%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7px', padding: '2px 4px', textAlign: 'left', border: '1px solid #139169' }}>LOTE / BARRA</th>
                    <th style={{ width: '14%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7px', padding: '2px 4px', textAlign: 'left', border: '1px solid #139169' }}>PACKING</th>
                    <th style={{ width: '22%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7px', padding: '2px 4px', textAlign: 'left', border: '1px solid #139169' }}>PROVEEDOR</th>
                    <th style={{ width: '15%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7px', padding: '2px 4px', textAlign: 'right', border: '1px solid #139169' }}>P. INICIAL</th>
                    <th style={{ width: '14%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7px', padding: '2px 4px', textAlign: 'center', border: '1px solid #139169' }}>ESTATUS</th>
                    <th style={{ width: '18%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7px', padding: '2px 4px', textAlign: 'right', border: '1px solid #139169' }}>P. RESULTANTE</th>
                  </tr>
                </thead>
                <tbody>
                  {proceso.bars.map((bar, barIdx) => (
                    <tr key={bar.barId}>
                      <td style={{ padding: '2px 4px', fontSize: '7px', borderBottom: '1px solid #f0f0f0', backgroundColor: barIdx % 2 === 1 ? '#fbfdfc' : 'transparent', wordWrap: 'break-word', overflow: 'hidden' }}>
                        <span style={{ fontFamily: 'monospace', color: '#333' }}>{bar.lote}</span>
                        <span style={{ display: 'block', fontFamily: 'monospace', color: '#139169', fontSize: '6px' }}>{bar.barId}</span>
                      </td>
                      <td style={{ padding: '2px 4px', fontSize: '7px', borderBottom: '1px solid #f0f0f0', backgroundColor: barIdx % 2 === 1 ? '#fbfdfc' : 'transparent', wordWrap: 'break-word', overflow: 'hidden' }}>{bar.packingOrigen}</td>
                      <td style={{ padding: '2px 4px', fontSize: '7px', borderBottom: '1px solid #f0f0f0', backgroundColor: barIdx % 2 === 1 ? '#fbfdfc' : 'transparent', wordWrap: 'break-word', overflow: 'hidden' }}>{bar.proveedorOrigen}</td>
                      <td style={{ padding: '2px 4px', fontSize: '7px', borderBottom: '1px solid #f0f0f0', textAlign: 'right', backgroundColor: barIdx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(bar.pesoInicial)}</td>
                      <td style={{ padding: '2px 4px', fontSize: '7px', borderBottom: '1px solid #f0f0f0', textAlign: 'center', backgroundColor: barIdx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>
                        <span style={{ padding: '0 3px', borderRadius: '2px', fontSize: '6px', fontWeight: 700, backgroundColor: bar.estatusBarra === 'Procesada' ? '#eaf4f0' : bar.estatusBarra === 'Fundida' ? '#fef9c3' : '#e8f4fd', color: bar.estatusBarra === 'Procesada' ? '#139169' : bar.estatusBarra === 'Fundida' ? '#a16207' : '#0ea5e9' }}>
                          {bar.estatusBarra}
                        </span>
                      </td>
                      <td style={{ padding: '2px 4px', fontSize: '7px', borderBottom: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 700, backgroundColor: barIdx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(bar.pesoResultante)}</td>
                    </tr>
                  ))}
                  {/* Subtotal */}
                  <tr>
                    <td style={{ padding: '2px 4px', fontSize: '7px', backgroundColor: '#eaf4f0', fontWeight: 700, color: '#139169', borderTop: '2px solid #139169' }}>Subtotal — {proceso.barras} Barras</td>
                    <td style={{ padding: '2px 4px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169' }} />
                    <td style={{ padding: '2px 4px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169' }} />
                    <td style={{ padding: '2px 4px', fontSize: '7px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169', textAlign: 'right', fontWeight: 700, color: '#139169' }}>{formatNumber(proceso.pesoInicial)} g</td>
                    <td style={{ padding: '2px 4px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169' }} />
                    <td style={{ padding: '2px 4px', fontSize: '7px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169', textAlign: 'right', fontWeight: 700, color: '#139169' }}>{formatNumber(proceso.pesoObtenido)} g</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}

          {/* Totales Generales */}
          <div className="pdf-totals-card" style={{ border: '2px solid #139169', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
            <div className="pdf-totals-header" style={{ backgroundColor: '#139169', padding: '2px 6px' }}>
              <span className="pdf-totals-header-text" style={{ fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '7.5px' }}>TOTALES GENERALES — {summary.totalProcesos} Procesos</span>
            </div>
            <div style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
              <div style={{ display: 'table-cell', width: '33.33%', padding: '4px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>
                <div className="pdf-totals-label" style={{ fontWeight: 700, color: '#666666', textTransform: 'uppercase', fontSize: '6px', marginBottom: '1px' }}>Total Barras</div>
                <div className="pdf-totals-value" style={{ fontWeight: 700, color: '#139169', fontSize: '10px' }}>{summary.totalBarras}</div>
              </div>
              <div style={{ display: 'table-cell', width: '33.33%', padding: '4px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>
                <div className="pdf-totals-label" style={{ fontWeight: 700, color: '#666666', textTransform: 'uppercase', fontSize: '6px', marginBottom: '1px' }}>Peso Bruto Resultante</div>
                <div className="pdf-totals-value" style={{ fontWeight: 700, color: '#139169', fontSize: '10px' }}>{formatNumber(summary.pesoResultanteTotal)} g</div>
              </div>
              <div style={{ display: 'table-cell', width: '33.34%', padding: '4px', textAlign: 'center' }}>
                <div className="pdf-totals-label" style={{ fontWeight: 700, color: '#666666', textTransform: 'uppercase', fontSize: '6px', marginBottom: '1px' }}>Rendimiento Prom.</div>
                <div className="pdf-totals-value" style={{ fontWeight: 700, color: '#139169', fontSize: '10px' }}>{formatNumber(summary.rendimientoProm, 1)}%</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
