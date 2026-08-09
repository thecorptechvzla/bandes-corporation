'use client';

import type { CSSProperties } from 'react';

import { formatLey, formatNumber } from '@/lib/format';
import type { PackingReportData, ReportType } from './types';

interface PackingReportPdfTemplateProps {
  data: PackingReportData;
  reportId: string;
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  clientName: string;
  reportType: ReportType;
}

export default function PackingReportPdfTemplate({
  data,
  reportId,
  generatedAt,
  dateFrom,
  dateTo,
  clientName,
  reportType,
}: PackingReportPdfTemplateProps) {
  const { summary, records } = data;

  return (
    <div id="packing-pdf-template" className={reportType === 'detallado' ? 'pdf-container-detailed' : 'pdf-container'}>
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
          Reporte {reportType === 'detallado' ? 'Detallado' : 'Desglosado'} de Packings Recibidos
        </div>
        <div className="pdf-subtitle" style={{ color: '#666666', marginTop: '1px' }}>
          {reportType === 'detallado'
            ? 'Desglose por barra individual de cada packing recibido'
            : 'Resumen consolidado de recepciones de material valioso'}
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
            <span style={{ fontWeight: 700, color: '#139169' }}>Cliente / Entidad:</span>{' '}
            <span className="pdf-meta-value">{clientName}</span>
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

      {/* MÉTRICAS RESUMEN (3 TARJETAS EN 750PX) */}
      <div style={{ display: 'table', width: '100%', tableLayout: 'fixed', marginBottom: '8px' }}>
        <div style={{ display: 'table-cell', width: '31%', backgroundColor: '#f4f9f7', border: '1px solid #c2e5d9', borderRadius: '4px', padding: '4px', textAlign: 'center', boxSizing: 'border-box' }}>
          <div className="pdf-metric-title" style={{ fontWeight: 700, color: '#139169', textTransform: 'uppercase' }}>Total Packings</div>
          <div className="pdf-metric-value" style={{ fontWeight: 700, color: '#111111', fontSize: '11px', margin: '1px 0' }}>{summary.totalPackings}</div>
          <div className="pdf-metric-footer" style={{ color: '#666666', fontSize: '7px' }}>Procesados</div>
        </div>
        <div style={{ display: 'table-cell', width: '3.5%' }} />
        <div style={{ display: 'table-cell', width: '31%', backgroundColor: '#f4f9f7', border: '1px solid #c2e5d9', borderRadius: '4px', padding: '4px', textAlign: 'center', boxSizing: 'border-box' }}>
          <div className="pdf-metric-title" style={{ fontWeight: 700, color: '#139169', textTransform: 'uppercase' }}>Total Barras</div>
          <div className="pdf-metric-value" style={{ fontWeight: 700, color: '#111111', fontSize: '11px', margin: '1px 0' }}>{summary.totalBarras} ({summary.totalValidadas} / {summary.totalPendientes})</div>
          <div className="pdf-metric-footer" style={{ color: '#666666', fontSize: '7px' }}>Unidades recibidas — Validas / Pend</div>
        </div>
        <div style={{ display: 'table-cell', width: '3.5%' }} />
        <div style={{ display: 'table-cell', width: '31%', backgroundColor: '#f4f9f7', border: '1px solid #c2e5d9', borderRadius: '4px', padding: '4px', textAlign: 'center', boxSizing: 'border-box' }}>
          <div className="pdf-metric-title" style={{ fontWeight: 700, color: '#139169', textTransform: 'uppercase' }}>Total Peso Bruto</div>
          <div className="pdf-metric-value" style={{ fontWeight: 700, color: '#111111', fontSize: '11px', margin: '1px 0' }}>{formatNumber(summary.pesoBrutoTotal)} g</div>
          <div className="pdf-metric-footer" style={{ color: '#666666', fontSize: '7px' }}>Ley Prom: {formatLey(summary.leyProm)}</div>
        </div>
      </div>

      {/* TABLA */}
      {reportType === 'resumido' ? (
        <table className="pdf-table" style={{ marginBottom: '8px' }}>
          <thead>
            <tr>
              {[
                { label: 'N° Packing / Archivo', width: '22%' },
                { label: 'Cliente / Razón Social', width: '30%' },
                { label: 'Barras (Val/Pend)', width: '14%' },
                { label: 'Peso Bruto (g)', width: '12%' },
                { label: 'Ley', width: '10%' },
                { label: 'Peso Fino (g)', width: '12%' },
              ].map((h, i) => (
                <th key={h.label} style={{ backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, textTransform: 'uppercase', border: '1px solid #139169', textAlign: i < 2 ? 'left' : i < 3 ? 'center' : 'right', width: h.width }}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((row, idx) => (
              <tr key={row.uid}>
                <td style={{ borderBottom: '1px solid #e6e6e6', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>
                  <span style={{ fontWeight: 700, color: '#139169', fontFamily: 'monospace', fontSize: '8px' }}>{row.id}</span>
                  <span style={{ fontSize: '7px', color: '#777777', display: 'block' }}>{row.file}</span>
                </td>
                <td style={{ borderBottom: '1px solid #e6e6e6', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>
                  <strong>{row.client}</strong>
                </td>
                <td style={{ borderBottom: '1px solid #e6e6e6', textAlign: 'center', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{row.barras} ({row.barrasValidadas} / {row.barrasPendientes})</td>
                <td style={{ borderBottom: '1px solid #e6e6e6', textAlign: 'right', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(row.pesoBruto)}</td>
                <td style={{ borderBottom: '1px solid #e6e6e6', textAlign: 'right', backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatLey(row.ley)}</td>
                <td style={{ borderBottom: '1px solid #e6e6e6', textAlign: 'right', fontWeight: 700, backgroundColor: idx % 2 === 1 ? '#fbfdfc' : 'transparent' }}>{formatNumber(row.pesoFino)}</td>
              </tr>
            ))}
            <tr>
              {[
                { text: `TOTALES (${summary.totalPackings} Packings)`, align: 'left' as const },
                { text: '—', align: 'left' as const },
                { text: `${summary.totalBarras} (${summary.totalValidadas} / ${summary.totalPendientes})`, align: 'center' as const },
                { text: `${formatNumber(summary.pesoBrutoTotal)} g`, align: 'right' as const },
                { text: formatLey(summary.leyProm), align: 'right' as const },
                { text: `${formatNumber(summary.pesoFinoTotal)} g`, align: 'right' as const },
              ].map((cell, i) => (
                <td key={i} style={{ backgroundColor: '#eaf4f0', fontWeight: 700, color: '#139169', borderTop: '2px solid #139169', borderBottom: '2px solid #139169', textAlign: cell.align }}>
                  {cell.text}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      ) : (
        <>
          {(data.detailed ?? []).map((packing) => (
            <div key={packing.uid} className="pdf-packing-block" style={{ border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
              {/* Banner de identificación */}
              <div className="pdf-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(19,145,105,0.12), rgba(19,145,105,0.04))', borderBottom: '2px solid #139169' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="pdf-banner-id" style={{ fontWeight: 700, color: '#139169', fontFamily: 'monospace' }}>{packing.id}</span>
                  <span style={{ color: '#cccccc', fontSize: '8px' }}>|</span>
                  <span className="pdf-banner-file" style={{ color: '#777777' }}>{packing.file}</span>
                </div>
                <span className="pdf-banner-client" style={{ fontWeight: 600, color: '#333333' }}>{packing.client}</span>
              </div>
              {/* Tabla de barras (8 columnas espejo) */}
              <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', boxSizing: 'border-box' }}>
                <thead>
                  <tr>
                    <th style={{ width: '16%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7.5px', padding: '3px 4px', textAlign: 'left', border: '1px solid #139169' }}>
                      CÓDIGO BARRA
                    </th>
                    <th style={{ width: '12%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7.5px', padding: '3px 4px', textAlign: 'right', border: '1px solid #139169' }}>
                      BRUTO SP
                    </th>
                    <th style={{ width: '11%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7.5px', padding: '3px 4px', textAlign: 'right', border: '1px solid #139169' }}>
                      LEY SP (‰)
                    </th>
                    <th style={{ width: '12%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7.5px', padding: '3px 4px', textAlign: 'right', border: '1px solid #139169' }}>
                      BRUTO VAL.
                    </th>
                    <th style={{ width: '11%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7.5px', padding: '3px 4px', textAlign: 'right', border: '1px solid #139169' }}>
                      LEY VAL. (‰)
                    </th>
                    <th style={{ width: '12%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7.5px', padding: '3px 4px', textAlign: 'right', border: '1px solid #139169' }}>
                      DIF. BRUTO
                    </th>
                    <th style={{ width: '11%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7.5px', padding: '3px 4px', textAlign: 'right', border: '1px solid #139169' }}>
                      DIF. LEY
                    </th>
                    <th style={{ width: '15%', backgroundColor: '#139169', color: '#ffffff', fontWeight: 700, fontSize: '7.5px', padding: '3px 4px', textAlign: 'center', border: '1px solid #139169' }}>
                      ESTADO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {packing.bars.map((bar, barIdx) => {
                    const isPorValidar = bar.status === 'POR_VALIDAR';
                    const spW = bar.spGrossWeight ?? (isPorValidar ? bar.pesoBruto : null);
                    const spP = bar.spPurity ?? (isPorValidar ? bar.ley : null);
                    const difW = !isPorValidar && bar.spGrossWeight != null ? Math.round((bar.pesoBruto - bar.spGrossWeight) * 100) / 100 : null;
                    const difP = !isPorValidar && bar.spPurity != null ? Math.round((bar.ley - bar.spPurity) * 100) / 100 : null;
                    const rowBg = barIdx % 2 === 1 ? '#fbfdfc' : 'transparent';
                    const cellBase: CSSProperties = { padding: '2px 4px', fontSize: '7.5px', borderBottom: '1px solid #f0f0f0', backgroundColor: rowBg, wordWrap: 'break-word', overflow: 'hidden' };
                    const diffColor = (dif: number | null) => dif != null
                      ? { color: '#139169', fontWeight: 700 }
                      : {};
                    return (
                      <tr key={`${packing.uid}-${bar.barId}-${barIdx}`}>
                        <td style={{ ...cellBase, textAlign: 'left' }}>
                          <span style={{ fontFamily: 'monospace', color: '#333', fontSize: '7.5px' }}>{bar.lote}</span>
                          <span style={{ display: 'block', fontFamily: 'monospace', color: '#139169', fontSize: '6.5px' }}>{bar.barId}</span>
                        </td>
                        <td style={{ ...cellBase, textAlign: 'right' }}>{spW != null ? formatNumber(spW) : '-'}</td>
                        <td style={{ ...cellBase, textAlign: 'right' }}>{spP != null ? formatLey(spP) : '-'}</td>
                        <td style={{ ...cellBase, textAlign: 'right' }}>{isPorValidar ? '-' : formatNumber(bar.pesoBruto)}</td>
                        <td style={{ ...cellBase, textAlign: 'right' }}>{isPorValidar ? '-' : formatLey(bar.ley)}</td>
                        <td style={{ ...cellBase, textAlign: 'right', ...(difW != null ? diffColor(difW) : {}) }}>{difW != null ? `${difW > 0 ? '+' : ''}${formatNumber(difW)}` : '-'}</td>
                        <td style={{ ...cellBase, textAlign: 'right', ...(difP != null ? diffColor(difP) : {}) }}>{difP != null ? `${difP > 0 ? '+' : ''}${formatLey(difP)}` : '-'}</td>
                        <td style={{ ...cellBase, textAlign: 'center' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '7px', fontWeight: 700, padding: '1px 5px', border: '1px solid', borderRadius: '2px', color: isPorValidar ? '#996F00' : '#139169', borderColor: isPorValidar ? '#E3C98A' : '#13916955', backgroundColor: isPorValidar ? '#F7EFD8' : '#EAF4F0' }}>
                            {isPorValidar ? 'POR VALIDAR' : 'VALIDADA'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Subtotal */}
                  {(() => {
                    const spTotal = packing.bars.reduce((a, b) => a + (b.spGrossWeight ?? (b.status === 'POR_VALIDAR' ? b.pesoBruto : 0)), 0);
                    const valTotal = packing.bars.reduce((a, b) => a + (b.status === 'POR_VALIDAR' ? 0 : b.pesoBruto), 0);
                    const difTotal = packing.bars.reduce((a, b) => a + (b.status !== 'POR_VALIDAR' && b.spGrossWeight != null ? b.pesoBruto - b.spGrossWeight : 0), 0);
                    return (
                      <tr className="pdf-subtotal-row">
                        <td style={{ padding: '2px 4px', fontSize: '7.5px', backgroundColor: '#eaf4f0', fontWeight: 700, color: '#139169', borderTop: '2px solid #139169' }}>Subtotal — {packing.barras} Barras</td>
                        <td style={{ padding: '2px 4px', fontSize: '7.5px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169', textAlign: 'right', fontWeight: 700, color: '#139169' }}>{formatNumber(spTotal)} g</td>
                        <td style={{ padding: '2px 4px', fontSize: '7.5px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169', textAlign: 'right', fontWeight: 700, color: '#139169' }}>Σ Ley SP</td>
                        <td style={{ padding: '2px 4px', fontSize: '7.5px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169', textAlign: 'right', fontWeight: 700, color: '#139169' }}>{formatNumber(valTotal)} g</td>
                        <td style={{ padding: '2px 4px', fontSize: '7.5px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169', textAlign: 'right', fontWeight: 700, color: '#139169' }}>Σ Ley Val.</td>
                        <td style={{ padding: '2px 4px', fontSize: '7.5px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169', textAlign: 'right', fontWeight: 700, color: '#139169' }}>{difTotal > 0 ? '+' : ''}{formatNumber(difTotal)} g</td>
                        <td style={{ padding: '2px 4px', fontSize: '7.5px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169', textAlign: 'right', fontWeight: 700, color: '#139169' }}>Σ Dif. Ley</td>
                        <td style={{ padding: '2px 4px', fontSize: '7.5px', backgroundColor: '#eaf4f0', borderTop: '2px solid #139169', textAlign: 'right', fontWeight: 700, color: '#139169' }}>{packing.barras}</td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          ))}

          {/* Totales Generales */}
          <div className="pdf-totals-card" style={{ border: '2px solid #139169', borderRadius: '4px', overflow: 'hidden' }}>
            <div className="pdf-totals-header" style={{ backgroundColor: '#139169' }}>
              <span className="pdf-totals-header-text" style={{ fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTALES GENERALES — {summary.totalPackings} Packings</span>
            </div>
            <div style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
              <div style={{ display: 'table-cell', width: '33.33%', padding: '6px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>
                <div className="pdf-totals-label" style={{ fontWeight: 700, color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>Total Barras</div>
                <div className="pdf-totals-value" style={{ fontWeight: 700, color: '#139169' }}>{summary.totalBarras} ({summary.totalValidadas} / {summary.totalPendientes})</div>
              </div>
              <div style={{ display: 'table-cell', width: '33.33%', padding: '6px', textAlign: 'center', borderRight: '1px solid #e0e0e0' }}>
                <div className="pdf-totals-label" style={{ fontWeight: 700, color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>Peso Bruto Total</div>
                <div className="pdf-totals-value" style={{ fontWeight: 700, color: '#139169' }}>{formatNumber(summary.pesoBrutoTotal)} g</div>
              </div>
              <div style={{ display: 'table-cell', width: '33.34%', padding: '6px', textAlign: 'center' }}>
                <div className="pdf-totals-label" style={{ fontWeight: 700, color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>Peso Fino Total</div>
                <div className="pdf-totals-value" style={{ fontWeight: 700, color: '#139169' }}>{formatNumber(summary.pesoFinoTotal)} g</div>
                <div className="pdf-totals-sub" style={{ color: '#666666', marginTop: '1px' }}>Ley Prom: {formatLey(summary.leyProm)}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
