import ExcelJS from 'exceljs';
import type { PackingReportData, ReportType } from '@/components/reportes/packing/mockData';
import { MOCK_DETAILED_DATA } from '@/components/reportes/packing/mockData';
import { formatNumber } from '@/lib/format';

interface GeneratePackingReportExcelParams {
  data: PackingReportData;
  reportId: string;
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  clientName: string;
  reportType: ReportType;
}

// Palette — green & white only
const C = {
  green: 'FF139169',
  greenLight: 'FFEAF4F0',
  greenSoft: 'FFF4F9F7',
  white: 'FFFFFFFF',
  textDark: 'FF333333',
  textMuted: 'FF666666',
} as const;

const fill = (argb: string): ExcelJS.Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb },
});

const thinBorder = (color: string): ExcelJS.Borders => ({
  top: { style: 'thin', color: { argb: color } },
  bottom: { style: 'thin', color: { argb: color } },
  left: { style: 'thin', color: { argb: color } },
  right: { style: 'thin', color: { argb: color } },
  diagonal: { style: 'thin', color: { argb: color } },
});

const doubleBorder = (color: string): ExcelJS.Borders => ({
  top: { style: 'double', color: { argb: color } },
  bottom: { style: 'double', color: { argb: color } },
  left: { style: 'double', color: { argb: color } },
  right: { style: 'double', color: { argb: color } },
  diagonal: { style: 'double', color: { argb: color } },
});

export async function generatePackingReportExcel(params: GeneratePackingReportExcelParams) {
  const { data, reportId, generatedAt, dateFrom, dateTo, clientName, reportType } = params;
  const { summary, records } = data;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'BANDES - Sistema de Custodia';
  wb.created = new Date();

  const ws = wb.addWorksheet('Reporte Packings', {
    pageSetup: { paperSize: 9, orientation: 'portrait' },
  });

  // Column widths
  ws.columns = [
    { width: 35 },  // A: N° Packing / Archivo
    { width: 50 },  // B: Cliente / Razón Social
    { width: reportType === 'detallado' ? 22 : 15 },  // C: Cant. Barras or N° Lote / ID Barra
    { width: 18 },  // D: Peso Bruto (gr)
    { width: 12 },  // E: Ley
    { width: 18 },  // F: Peso Fino (gr)
  ];

  // ── ROW 1: Title ──
  const titleRow = ws.addRow([`REPORTE ${reportType === 'detallado' ? 'DETALLADO' : 'DESGLOSADO'} DE PACKINGS RECIBIDOS`]);
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: C.green }, name: 'Segoe UI' } as ExcelJS.Font;
  titleRow.getCell(1).alignment = { vertical: 'middle' };
  ws.mergeCells('A1:F1');
  titleRow.height = 28;

  // ── ROW 2: Subtitle ──
  const subRow = ws.addRow([reportType === 'detallado' ? 'Desglose por barra individual de cada packing recibido' : 'Resumen consolidado de recepciones de material valioso']);
  subRow.getCell(1).font = { size: 10, color: { argb: C.textMuted }, name: 'Segoe UI' } as ExcelJS.Font;
  ws.mergeCells('A2:F2');

  // ── ROW 3: Spacer ──
  ws.addRow([]);

  // ── ROW 4-5: Metadata (merged blocks) ──
  const metaRow1 = ws.addRow([
    `Rango de Fechas: ${dateFrom} al ${dateTo}`,
    '', '',
    `ID Documento: ${reportId}`,
    '', '',
  ]);
  ws.mergeCells('A4:C4');
  ws.mergeCells('D4:F4');
  metaRow1.getCell(1).font = { bold: true, size: 10, color: { argb: C.textDark }, name: 'Segoe UI' } as ExcelJS.Font;
  metaRow1.getCell(4).font = { bold: true, size: 10, color: { argb: C.textDark }, name: 'Segoe UI' } as ExcelJS.Font;
  [1, 2, 3, 4, 5, 6].forEach((col) => {
    const cell = metaRow1.getCell(col);
    cell.fill = fill(C.greenSoft);
    cell.border = thinBorder(C.green);
  });

  const metaRow2 = ws.addRow([
    `Cliente / Entidad: ${clientName}`,
    '', '',
    `Tipo de Reporte: ${reportType === 'detallado' ? 'Detallado' : 'Resumido'}`,
    '', '',
  ]);
  ws.mergeCells('A5:C5');
  ws.mergeCells('D5:F5');
  metaRow2.getCell(1).font = { bold: true, size: 10, color: { argb: C.textDark }, name: 'Segoe UI' } as ExcelJS.Font;
  metaRow2.getCell(4).font = { bold: true, size: 10, color: { argb: C.textDark }, name: 'Segoe UI' } as ExcelJS.Font;
  [1, 2, 3, 4, 5, 6].forEach((col) => {
    const cell = metaRow2.getCell(col);
    cell.fill = fill(C.greenSoft);
    cell.border = thinBorder(C.green);
  });

  const metaRow3 = ws.addRow([
    `Fecha de Generación: ${generatedAt}`,
    '', '', '', '', '',
  ]);
  ws.mergeCells('A6:F6');
  metaRow3.getCell(1).font = { bold: true, size: 10, color: { argb: C.textDark }, name: 'Segoe UI' } as ExcelJS.Font;
  [1, 2, 3, 4, 5, 6].forEach((col) => {
    const cell = metaRow3.getCell(col);
    cell.fill = fill(C.greenSoft);
    cell.border = thinBorder(C.green);
  });

  // ── ROW 7: Spacer ──
  ws.addRow([]);

  // ── ROW 8-10: KPI Cards (merged in pairs) ──
  const kpiTitleRow = ws.addRow(['TOTAL PACKINGS', '', 'TOTAL BARRAS', '', 'TOTAL PESO FINO', '']);
  ws.mergeCells('A8:B8');
  ws.mergeCells('C8:D8');
  ws.mergeCells('E8:F8');
  kpiTitleRow.height = 20;
  [1, 3, 5].forEach((col) => {
    const cell = kpiTitleRow.getCell(col);
    cell.fill = fill(C.green);
    cell.font = { bold: true, color: { argb: C.white }, size: 10, name: 'Segoe UI' } as ExcelJS.Font;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder(C.green);
  });
  [2, 4, 6].forEach((col) => {
    const cell = kpiTitleRow.getCell(col);
    cell.fill = fill(C.green);
    cell.border = thinBorder(C.green);
  });

  const kpiValueRow = ws.addRow([summary.totalPackings, '', summary.totalBarras, '', `${formatNumber(summary.pesoFinoTotal)} g`, '']);
  ws.mergeCells('A9:B9');
  ws.mergeCells('C9:D9');
  ws.mergeCells('E9:F9');
  kpiValueRow.height = 26;
  [1, 3, 5].forEach((col) => {
    const cell = kpiValueRow.getCell(col);
    cell.fill = fill(C.greenLight);
    cell.font = { bold: true, size: 13, color: { argb: C.textDark }, name: 'Segoe UI' } as ExcelJS.Font;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder(C.green);
  });
  [2, 4, 6].forEach((col) => {
    const cell = kpiValueRow.getCell(col);
    cell.fill = fill(C.greenLight);
    cell.border = thinBorder(C.green);
  });

  const kpiSubRow = ws.addRow(['Procesados', '', 'Unidades recibidas', '', `Ley Promedio: ${formatNumber(summary.leyProm, 4)}`, '']);
  ws.mergeCells('A10:B10');
  ws.mergeCells('C10:D10');
  ws.mergeCells('E10:F10');
  [1, 3, 5].forEach((col) => {
    const cell = kpiSubRow.getCell(col);
    cell.fill = fill(C.greenLight);
    cell.font = { size: 9, color: { argb: C.textMuted }, name: 'Segoe UI' } as ExcelJS.Font;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder(C.green);
  });
  [2, 4, 6].forEach((col) => {
    const cell = kpiSubRow.getCell(col);
    cell.fill = fill(C.greenLight);
    cell.border = thinBorder(C.green);
  });

  // ── ROW 11: Spacer ──
  ws.addRow([]);

  // ── TABLE ──
  if (reportType === 'resumido') {
    // Resumido mode
    const headers = ws.addRow(['N° Packing / Archivo', 'Cliente / Razón Social', 'Cant. Barras', 'Peso Bruto (gr)', 'Ley', 'Peso Fino (gr)']);
    headers.height = 22;
    headers.eachCell((cell) => {
      cell.fill = fill(C.green);
      cell.font = { bold: true, color: { argb: C.white }, size: 10, name: 'Segoe UI' } as ExcelJS.Font;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder(C.green);
    });

    records.forEach((row, idx) => {
      const isEven = idx % 2 === 0;
      const rowFill = isEven ? C.white : C.greenSoft;
      const dataRow = ws.addRow([`${row.id} — ${row.file}`, row.client, row.barras, row.pesoBruto, row.ley, row.pesoFino]);
      dataRow.eachCell((cell) => {
        cell.fill = fill(rowFill);
        cell.font = { size: 10, color: { argb: C.textDark }, name: 'Segoe UI' } as ExcelJS.Font;
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
      });
      dataRow.getCell(1).alignment = { vertical: 'middle' };
      dataRow.getCell(2).alignment = { vertical: 'middle', wrapText: true };
      dataRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      dataRow.getCell(4).numFmt = '#,##0.00';
      dataRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
      dataRow.getCell(5).numFmt = '0.0000';
      dataRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
      dataRow.getCell(6).numFmt = '#,##0.00';
      dataRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    });

    const totalsLabelRow = ws.addRow([`TOTALES (${summary.totalPackings} Packings)`]);
    totalsLabelRow.height = 20;
    ws.mergeCells(`A${totalsLabelRow.number}:F${totalsLabelRow.number}`);
    totalsLabelRow.getCell(1).font = { bold: true, size: 11, color: { argb: C.white }, name: 'Segoe UI' } as ExcelJS.Font;
    totalsLabelRow.getCell(1).fill = fill(C.green);
    totalsLabelRow.getCell(1).alignment = { vertical: 'middle' };
    [1, 2, 3, 4, 5, 6].forEach((col) => {
      const cell = totalsLabelRow.getCell(col);
      cell.fill = fill(C.green);
      cell.border = { top: { style: 'double', color: { argb: C.green } }, left: { style: 'double', color: { argb: C.green } }, right: { style: 'double', color: { argb: C.green } }, bottom: { style: 'thin', color: { argb: C.green } } };
    });

    const totalsValueRow = ws.addRow(['', '', summary.totalBarras, summary.pesoBrutoTotal, summary.leyProm, summary.pesoFinoTotal]);
    totalsValueRow.height = 22;
    [1, 2, 3, 4, 5, 6].forEach((col) => {
      const cell = totalsValueRow.getCell(col);
      cell.fill = fill(C.greenLight);
      cell.font = { bold: true, size: 11, color: { argb: C.green }, name: 'Segoe UI' } as ExcelJS.Font;
      cell.border = { bottom: { style: 'double', color: { argb: C.green } }, left: { style: 'double', color: { argb: C.green } }, right: { style: 'double', color: { argb: C.green } }, top: { style: 'thin', color: { argb: C.green } } };
    });
    totalsValueRow.getCell(1).alignment = { vertical: 'middle' };
    totalsValueRow.getCell(2).alignment = { vertical: 'middle' };
    totalsValueRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    totalsValueRow.getCell(4).numFmt = '#,##0.00';
    totalsValueRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    totalsValueRow.getCell(5).numFmt = '0.0000';
    totalsValueRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    totalsValueRow.getCell(6).numFmt = '#,##0.00';
    totalsValueRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
  } else {
    // Detallado mode — independent blocks per packing
    MOCK_DETAILED_DATA.forEach((packing, packIdx) => {
      // ── Banner: Packing ID + file + client ──
      const bannerRow = ws.addRow([
        `${packing.id}  —  ${packing.file}    |    ${packing.client}`,
        '', '', '',
      ]);
      bannerRow.height = 22;
      ws.mergeCells(`A${bannerRow.number}:D${bannerRow.number}`);
      bannerRow.getCell(1).font = { bold: true, size: 10, color: { argb: C.white }, name: 'Segoe UI' } as ExcelJS.Font;
      bannerRow.getCell(1).fill = fill('FF0E4231');
      bannerRow.getCell(1).alignment = { vertical: 'middle' };
      [1, 2, 3, 4].forEach((col) => {
        const cell = bannerRow.getCell(col);
        cell.fill = fill('FF0E4231');
        cell.border = thinBorder(C.green);
      });

      // ── 4-column header ──
      const barHeaders = ws.addRow(['N° Lote / ID Barra', 'Peso Bruto (gr)', 'Ley', 'Peso Fino (gr)']);
      barHeaders.height = 20;
      barHeaders.eachCell((cell) => {
        cell.fill = fill(C.green);
        cell.font = { bold: true, color: { argb: C.white }, size: 9, name: 'Segoe UI' } as ExcelJS.Font;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = thinBorder(C.green);
      });

      // ── Bar rows ──
      packing.bars.forEach((bar, barIdx) => {
        const rowFill = barIdx % 2 === 0 ? C.white : C.greenSoft;
        const barRow = ws.addRow([`${bar.lote} — ${bar.barId}`, bar.pesoBruto, bar.ley, bar.pesoFino]);
        barRow.eachCell((cell) => {
          cell.fill = fill(rowFill);
          cell.font = { size: 10, color: { argb: C.textDark }, name: 'Segoe UI' } as ExcelJS.Font;
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
        });
        barRow.getCell(1).font = { size: 10, color: { argb: C.textDark }, name: 'Segoe UI', family: 2 } as ExcelJS.Font;
        barRow.getCell(2).numFmt = '#,##0.00';
        barRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
        barRow.getCell(3).numFmt = '0.0000';
        barRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        barRow.getCell(4).numFmt = '#,##0.00';
        barRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
      });

      // ── Subtotal row ──
      const subRow = ws.addRow([`Subtotal — ${packing.barras} Barras`, packing.pesoBruto, packing.ley, packing.pesoFino]);
      subRow.height = 22;
      subRow.eachCell((cell) => {
        cell.fill = fill(C.greenLight);
        cell.font = { bold: true, size: 10, color: { argb: C.green }, name: 'Segoe UI' } as ExcelJS.Font;
        cell.border = thinBorder(C.green);
      });
      subRow.getCell(1).alignment = { vertical: 'middle' };
      subRow.getCell(2).numFmt = '#,##0.00';
      subRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
      subRow.getCell(3).numFmt = '0.0000';
      subRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      subRow.getCell(4).numFmt = '#,##0.00';
      subRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };

      // ── Spacer between blocks ──
      if (packIdx < MOCK_DETAILED_DATA.length - 1) {
        const spacer = ws.addRow([]);
        spacer.height = 8;
      }
    });

    // ── Grand totals: Row 1 = label (merged), Row 2 = values ──
    const totalsLabelRow = ws.addRow([`TOTALES GENERALES — ${summary.totalPackings} Packings | ${summary.totalBarras} Barras`]);
    totalsLabelRow.height = 20;
    ws.mergeCells(`A${totalsLabelRow.number}:D${totalsLabelRow.number}`);
    totalsLabelRow.getCell(1).font = { bold: true, size: 11, color: { argb: C.white }, name: 'Segoe UI' } as ExcelJS.Font;
    totalsLabelRow.getCell(1).fill = fill(C.green);
    totalsLabelRow.getCell(1).alignment = { vertical: 'middle' };
    [1, 2, 3, 4].forEach((col) => {
      const cell = totalsLabelRow.getCell(col);
      cell.fill = fill(C.green);
      cell.border = { top: { style: 'double', color: { argb: C.green } }, left: { style: 'double', color: { argb: C.green } }, right: { style: 'double', color: { argb: C.green } }, bottom: { style: 'thin', color: { argb: C.green } } };
    });

    const totalsValueRow = ws.addRow(['', summary.pesoBrutoTotal, summary.leyProm, summary.pesoFinoTotal]);
    totalsValueRow.height = 22;
    [1, 2, 3, 4].forEach((col) => {
      const cell = totalsValueRow.getCell(col);
      cell.fill = fill(C.greenLight);
      cell.font = { bold: true, size: 11, color: { argb: C.green }, name: 'Segoe UI' } as ExcelJS.Font;
      cell.border = { bottom: { style: 'double', color: { argb: C.green } }, left: { style: 'double', color: { argb: C.green } }, right: { style: 'double', color: { argb: C.green } }, top: { style: 'thin', color: { argb: C.green } } };
    });
    totalsValueRow.getCell(1).alignment = { vertical: 'middle' };
    totalsValueRow.getCell(2).numFmt = '#,##0.00';
    totalsValueRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
    totalsValueRow.getCell(3).numFmt = '0.0000';
    totalsValueRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    totalsValueRow.getCell(4).numFmt = '#,##0.00';
    totalsValueRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
  }

  // ── Spacer + Footer ──
  ws.addRow([]);
  const footerRow = ws.addRow([
    'Documento generado automáticamente por el Sistema de Custodia y Control - BANDES.',
    '', '', '', '',
    `Generado: ${generatedAt}`,
  ]);
  ws.mergeCells(`A${footerRow.number}:E${footerRow.number}`);
  footerRow.getCell(1).font = { size: 8, color: { argb: C.textMuted }, name: 'Segoe UI' } as ExcelJS.Font;
  footerRow.getCell(6).font = { size: 8, color: { argb: C.textMuted }, name: 'Segoe UI' } as ExcelJS.Font;
  footerRow.getCell(6).alignment = { horizontal: 'right' };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Reporte_Packings_BANDES_${reportId.replace('#', '')}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
