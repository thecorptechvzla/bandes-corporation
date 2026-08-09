import ExcelJS from 'exceljs';
import type { PackingReportData, ReportType } from '@/components/reportes/packing/types';
import { formatLey, formatNumber, truncateLey } from '@/lib/format';

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
  const { summary, records, detailed } = data;

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
    { width: reportType === 'detallado' ? 22 : 15 },  // C: Cant. Barras or Código Barra
    { width: 14 },  // D: (resumido) Peso Bruto / (detallado) Bruto SP
    { width: 14 },  // E: (resumido) Ley / (detallado) Ley SP
    { width: 14 },  // F: (resumido) Peso Fino / (detallado) Bruto Val.
    { width: 14 },  // G: (detallado) Ley Val.
    { width: 14 },  // H: (detallado) Dif. Bruto
    { width: 14 },  // I: (detallado) Dif. Ley
    { width: 18 },  // J: (detallado) Estado
  ];

  const TOTAL_COLS = reportType === 'detallado' ? 10 : 6;
  const mergeRange = (row: number) => `A${row}:${String.fromCharCode(64 + TOTAL_COLS)}${row}`;
  const allCols = Array.from({ length: TOTAL_COLS }, (_, i) => i + 1);

  // ── ROW 1: Title ──
  const titleRow = ws.addRow([`REPORTE ${reportType === 'detallado' ? 'DETALLADO' : 'DESGLOSADO'} DE PACKINGS RECIBIDOS`]);
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: C.green }, name: 'Segoe UI' } as ExcelJS.Font;
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.mergeCells(mergeRange(titleRow.number));
  titleRow.height = 28;
  allCols.forEach((col) => {
    titleRow.getCell(col).fill = fill(C.greenLight);
  });

  // ── ROW 2: Subtitle ──
  const subRow = ws.addRow([reportType === 'detallado' ? 'Desglose por barra individual de cada packing recibido' : 'Resumen consolidado de recepciones de material valioso']);
  subRow.getCell(1).font = { size: 10, color: { argb: C.textMuted }, name: 'Segoe UI' } as ExcelJS.Font;
  ws.mergeCells(mergeRange(subRow.number));

  // ── ROW 3: Metadata (single centered line) ──
  const metaRow = ws.addRow([`Cliente: ${clientName} | Periodo: ${dateFrom} al ${dateTo} | ID: ${reportId} | Generado: ${generatedAt}`]);
  ws.mergeCells(mergeRange(metaRow.number));
  metaRow.getCell(1).font = { size: 9, color: { argb: C.textMuted }, name: 'Segoe UI' } as ExcelJS.Font;
  metaRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  // ── ROW 4: Spacer ──
  ws.addRow([]);

  // ── KPI Cards (merged in pairs) ──
  const kpiTitleRow = ws.addRow(['TOTAL PACKINGS', '', 'TOTAL BARRAS', '', 'TOTAL PESO FINO', '']);
  const kn = kpiTitleRow.number;
  ws.mergeCells(`A${kn}:B${kn}`);
  ws.mergeCells(`C${kn}:D${kn}`);
  ws.mergeCells(`E${kn}:F${kn}`);
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

  const kpiValueRow = ws.addRow([summary.totalPackings, '', `${summary.totalBarras} (${summary.totalValidadas} / ${summary.totalPendientes})`, '', `${formatNumber(summary.pesoFinoTotal)} g`, '']);
  const vn = kpiValueRow.number;
  ws.mergeCells(`A${vn}:B${vn}`);
  ws.mergeCells(`C${vn}:D${vn}`);
  ws.mergeCells(`E${vn}:F${vn}`);
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

  const kpiSubRow = ws.addRow(['Procesados', '', 'Unidades recibidas', '', `Ley Promedio: ${formatLey(summary.leyProm)}`, '']);
  const sn = kpiSubRow.number;
  ws.mergeCells(`A${sn}:B${sn}`);
  ws.mergeCells(`C${sn}:D${sn}`);
  ws.mergeCells(`E${sn}:F${sn}`);
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
    const headers = ws.addRow(['N° Packing / Archivo', 'Cliente / Razón Social', 'Barras (Val. / Pend.)', 'Peso Bruto (gr)', 'Ley (‰)', 'Peso Fino (gr)']);
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
      const dataRow = ws.addRow([`${row.id} — ${row.file}`, row.client, `${row.barras} (${row.barrasValidadas} / ${row.barrasPendientes})`, row.pesoBruto, truncateLey(row.ley), row.pesoFino]);
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
      dataRow.getCell(5).numFmt = '0.00';
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

    const totalsValueRow = ws.addRow(['', '', `${summary.totalBarras} (${summary.totalValidadas} / ${summary.totalPendientes})`, summary.pesoBrutoTotal, truncateLey(summary.leyProm), summary.pesoFinoTotal]);
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
    totalsValueRow.getCell(5).numFmt = '0.00';
    totalsValueRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    totalsValueRow.getCell(6).numFmt = '#,##0.00';
    totalsValueRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
  } else {
    // Detallado mode — independent blocks per packing
    const detailedBlocks = detailed ?? [];
    const spWeightFor = (b: NonNullable<PackingReportData['detailed']>[number]['bars'][number]) =>
      b.spGrossWeight != null ? Number(b.spGrossWeight) : b.status === 'POR_VALIDAR' ? Number(b.pesoBruto) : null;
    const spPurityFor = (b: NonNullable<PackingReportData['detailed']>[number]['bars'][number]) =>
      b.spPurity != null ? Number(b.spPurity) : b.status === 'POR_VALIDAR' ? Number(b.ley) : null;
    const fmtSigned = (v: number | null) => (v != null ? `${v > 0 ? '+' : ''}${formatNumber(Number(v), 2)}` : '-');

    detailedBlocks.forEach((packing, packIdx) => {
      // ── Banner: Packing ID + file + client ──
      const bannerRow = ws.addRow([
        `${packing.id}  —  ${packing.file}    |    ${packing.client}`,
        ...Array(TOTAL_COLS - 1).fill(''),
      ]);
      bannerRow.height = 22;
      ws.mergeCells(mergeRange(bannerRow.number));
      bannerRow.getCell(1).font = { bold: true, size: 10, color: { argb: C.white }, name: 'Segoe UI' } as ExcelJS.Font;
      bannerRow.getCell(1).fill = fill('FF0E4231');
      bannerRow.getCell(1).alignment = { vertical: 'middle' };
      allCols.forEach((col) => {
        const cell = bannerRow.getCell(col);
        cell.fill = fill('FF0E4231');
        cell.border = thinBorder(C.green);
      });

      // ── 8-column header ──
      const barHeaders = ws.addRow(['Código Barra', 'Bruto SP', 'Ley SP (‰)', 'Bruto Val.', 'Ley Val. (‰)', 'Dif. Bruto', 'Dif. Ley', 'Estado']);
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
        const isPorValidar = bar.status === 'POR_VALIDAR';
        const spW = spWeightFor(bar);
        const spP = spPurityFor(bar);
        const difW = !isPorValidar && bar.spGrossWeight != null ? Math.round((bar.pesoBruto - bar.spGrossWeight) * 100) / 100 : null;
        const difP = !isPorValidar && bar.spPurity != null ? Math.round((bar.ley - bar.spPurity) * 100) / 100 : null;
        const barRow = ws.addRow([
          `${bar.lote} — ${bar.barId}`,
          spW != null ? formatNumber(spW, 2) : '-',
          spP != null ? truncateLey(spP) : '-',
          isPorValidar ? '-' : bar.pesoBruto,
          isPorValidar ? '-' : truncateLey(bar.ley),
          fmtSigned(difW),
          fmtSigned(difP),
          isPorValidar ? 'POR VALIDAR' : 'VALIDADA',
        ]);
        barRow.eachCell((cell) => {
          cell.fill = fill(rowFill);
          cell.font = { size: 10, color: { argb: C.textDark }, name: 'Segoe UI' } as ExcelJS.Font;
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
        });
        barRow.getCell(1).font = { size: 10, color: { argb: C.textDark }, name: 'Segoe UI', family: 2 } as ExcelJS.Font;
        barRow.getCell(2).numFmt = '#,##0.00';
        barRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
        barRow.getCell(3).numFmt = '0.00';
        barRow.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
        barRow.getCell(4).numFmt = '#,##0.00';
        barRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
        barRow.getCell(5).numFmt = '0.00';
        barRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
        barRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
        barRow.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
        barRow.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
        [6, 7].forEach((col) => {
          const dif = (col === 6 ? difW : difP);
          if (dif != null) {
            barRow.getCell(col).font = { bold: true, size: 10, color: { argb: C.green }, name: 'Segoe UI' } as ExcelJS.Font;
          }
        });
      });

      // ── Subtotal row ──
      const spTotal = packing.bars.reduce((a, b) => a + Number(spWeightFor(b) ?? 0), 0);
      const valTotal = packing.bars.reduce((a, b) => a + (b.status === 'POR_VALIDAR' ? 0 : b.pesoBruto), 0);
      const difTotal = packing.bars.reduce(
        (a, b) => a + (b.status !== 'POR_VALIDAR' && b.spGrossWeight != null ? b.pesoBruto - b.spGrossWeight : 0),
        0,
      );
      const subRow = ws.addRow([
        `Subtotal — ${packing.barras} Barras`,
        formatNumber(spTotal, 2),
        'Σ Ley SP',
        formatNumber(valTotal, 2),
        'Σ Ley Val.',
        `${difTotal > 0 ? '+' : ''}${formatNumber(difTotal, 2)}`,
        'Σ Dif. Ley',
        `${packing.barras} (${packing.barrasValidadas} / ${packing.barrasPendientes})`,
        '',
        '',
      ]);
      subRow.height = 22;
      subRow.eachCell((cell) => {
        cell.fill = fill(C.greenLight);
        cell.font = { bold: true, size: 10, color: { argb: C.green }, name: 'Segoe UI' } as ExcelJS.Font;
        cell.border = thinBorder(C.green);
      });
      subRow.getCell(1).alignment = { vertical: 'middle' };
      subRow.getCell(2).numFmt = '#,##0.00';
      subRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
      subRow.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
      subRow.getCell(4).numFmt = '#,##0.00';
      subRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
      subRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      subRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
      subRow.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
      subRow.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };

      // ── Spacer between blocks ──
      if (packIdx < detailedBlocks.length - 1) {
        const spacer = ws.addRow([]);
        spacer.height = 8;
      }
    });

    // ── Grand totals: Row 1 = label (merged), Row 2 = values ──
    const totalsLabelRow = ws.addRow([`TOTALES GENERALES — ${summary.totalPackings} Packings | ${summary.totalBarras} Barras (${summary.totalValidadas} / ${summary.totalPendientes})`]);
    totalsLabelRow.height = 20;
    ws.mergeCells(mergeRange(totalsLabelRow.number));
    totalsLabelRow.getCell(1).font = { bold: true, size: 11, color: { argb: C.white }, name: 'Segoe UI' } as ExcelJS.Font;
    totalsLabelRow.getCell(1).fill = fill(C.green);
    totalsLabelRow.getCell(1).alignment = { vertical: 'middle' };
    allCols.forEach((col) => {
      const cell = totalsLabelRow.getCell(col);
      cell.fill = fill(C.green);
      cell.border = { top: { style: 'double', color: { argb: C.green } }, left: { style: 'double', color: { argb: C.green } }, right: { style: 'double', color: { argb: C.green } }, bottom: { style: 'thin', color: { argb: C.green } } };
    });

    const totalsValueRow = ws.addRow([
      `${summary.totalBarras} Barras`,
      formatNumber(summary.pesoBrutoTotal, 2),
      truncateLey(summary.leyProm),
      formatNumber(summary.pesoFinoTotal, 2),
      '',
      '',
      '',
      `${summary.totalValidadas} Val.`,
      `${summary.totalPendientes} Pend.`,
      '',
    ]);
    totalsValueRow.height = 22;
    allCols.forEach((col) => {
      const cell = totalsValueRow.getCell(col);
      cell.fill = fill(C.greenLight);
      cell.font = { bold: true, size: 11, color: { argb: C.green }, name: 'Segoe UI' } as ExcelJS.Font;
      cell.border = { bottom: { style: 'double', color: { argb: C.green } }, left: { style: 'double', color: { argb: C.green } }, right: { style: 'double', color: { argb: C.green } }, top: { style: 'thin', color: { argb: C.green } } };
    });
    totalsValueRow.getCell(1).alignment = { vertical: 'middle' };
    totalsValueRow.getCell(2).numFmt = '#,##0.00';
    totalsValueRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };
    totalsValueRow.getCell(3).numFmt = '0.00';
    totalsValueRow.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
    totalsValueRow.getCell(4).numFmt = '#,##0.00';
    totalsValueRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    totalsValueRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    totalsValueRow.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
    totalsValueRow.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };
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
