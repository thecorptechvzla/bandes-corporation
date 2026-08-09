import ExcelJS from 'exceljs';
import type { EgresosReportData, EgresoReportType } from '@/components/reportes/egresos/types';
import { formatLey, formatNumber, truncateLey } from '@/lib/format';

interface GenerateEgresosReportExcelParams {
  data: EgresosReportData;
  reportId: string;
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  clienteName: string;
  reportType: EgresoReportType;
}

export async function generateEgresosReportExcel(params: GenerateEgresosReportExcelParams) {
  const { data, reportId, generatedAt, dateFrom, dateTo, clienteName, reportType } = params;
  const { summary, records, detailed = [] } = data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BANDES - Sistema de Custodia';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Reporte Egresos', {
    properties: { defaultColWidth: 18 },
  });

  const green = '139169';
  const greenLight = 'EAF4F0';

  // Title
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'REPORTE DESGLOSADO DE EGRESOS DE MATERIAL';
  titleCell.font = { bold: true, size: 14, color: { argb: `FF${green}` } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${greenLight}` } };
  sheet.getRow(1).height = 30;

  // Subtitle
  sheet.mergeCells('A2:H2');
  const subCell = sheet.getCell('A2');
  subCell.value = `Banco de Desarrollo Económico y Social de Venezuela — R.I.F. G-20001643-0`;
  subCell.font = { size: 10, color: { argb: 'FF666666' } };
  subCell.alignment = { horizontal: 'center' };

  // Filter info
  sheet.mergeCells('A3:H3');
  const filterCell = sheet.getCell('A3');
  filterCell.value = `Cliente: ${clienteName} | Período: ${dateFrom} al ${dateTo} | ID: ${reportId} | Generado: ${generatedAt}`;
  filterCell.font = { size: 9, color: { argb: 'FF888888' } };
  filterCell.alignment = { horizontal: 'center' };

  // Empty row
  sheet.getRow(4).height = 8;

  // ── KPI Cards (3-row layout: header / value / subtitle) ──
  const fillGreen = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: `FF${green}` } };
  const fillGreenLight = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: `FF${greenLight}` } };
  const borderGreen = {
    top: { style: 'thin' as const, color: { argb: `FF${green}` } },
    bottom: { style: 'thin' as const, color: { argb: `FF${green}` } },
    left: { style: 'thin' as const, color: { argb: `FF${green}` } },
    right: { style: 'thin' as const, color: { argb: `FF${green}` } },
  };

  // ── KPI Header Row ──
  const kpiHeaderRow = sheet.addRow(['TOTAL EGRESOS', '', 'TOTAL LINGOTES', '', 'PESO BRUTO EGRESADO (BR)', '', '', '']);
  const kHn = kpiHeaderRow.number;
  sheet.mergeCells(`A${kHn}:B${kHn}`);
  sheet.mergeCells(`C${kHn}:D${kHn}`);
  sheet.mergeCells(`E${kHn}:H${kHn}`);
  kpiHeaderRow.height = 20;
  [1, 3, 5].forEach((col) => {
    const cell = kpiHeaderRow.getCell(col);
    cell.fill = fillGreen;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Segoe UI' } as ExcelJS.Font;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderGreen;
  });
  [2, 4, 6, 7, 8].forEach((col) => {
    const cell = kpiHeaderRow.getCell(col);
    cell.fill = fillGreen;
    cell.border = borderGreen;
  });

  // ── KPI Value Row ──
  const kpiValueRow = sheet.addRow([summary.totalEgresos, '', summary.totalLingotes, '', `${formatNumber(summary.pesoBrutoBalanzaTotal)} g`, '', '', '']);
  const kVn = kpiValueRow.number;
  sheet.mergeCells(`A${kVn}:B${kVn}`);
  sheet.mergeCells(`C${kVn}:D${kVn}`);
  sheet.mergeCells(`E${kVn}:H${kVn}`);
  kpiValueRow.height = 26;
  [1, 3, 5].forEach((col) => {
    const cell = kpiValueRow.getCell(col);
    cell.fill = fillGreenLight;
    cell.font = { bold: true, size: 13, color: { argb: 'FF333333' }, name: 'Segoe UI' } as ExcelJS.Font;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderGreen;
  });
  [2, 4, 6, 7, 8].forEach((col) => {
    const cell = kpiValueRow.getCell(col);
    cell.fill = fillGreenLight;
    cell.border = borderGreen;
  });

  // ── KPI Subtitle Row ──
  const kpiSubRow = sheet.addRow(['Egresos registrados', '', 'Piezas extraídas', '', `BI: ${formatNumber(summary.pesoBrutoTotal)} g | M: ${formatNumber(summary.mermaTotal)} g`, '', '', '']);
  const kSn = kpiSubRow.number;
  sheet.mergeCells(`A${kSn}:B${kSn}`);
  sheet.mergeCells(`C${kSn}:D${kSn}`);
  sheet.mergeCells(`E${kSn}:H${kSn}`);
  [1, 3, 5].forEach((col) => {
    const cell = kpiSubRow.getCell(col);
    cell.fill = fillGreenLight;
    cell.font = { size: 9, color: { argb: 'FF666666' }, name: 'Segoe UI' } as ExcelJS.Font;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderGreen;
  });
  [2, 4, 6, 7, 8].forEach((col) => {
    const cell = kpiSubRow.getCell(col);
    cell.fill = fillGreenLight;
    cell.border = borderGreen;
  });

  // ── Spacer ──
  sheet.getRow(kpiSubRow.number + 1).height = 8;

  if (reportType === 'resumido') {
    const showFecha = dateFrom !== dateTo;

    // Summary table headers
    const headers = [
      'N° Egreso',
      'Guía',
      'Cliente',
      ...(showFecha ? ['Fecha'] : []),
      'Lingotes',
      'BI (gr)',
      'BR (gr)',
      'M (gr)',
      'Ley Prom. (‰)',
    ];
    const headerRow = sheet.getRow(9);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${green}` } };
      const isWeight = h === 'BI (gr)' || h === 'BR (gr)' || h === 'M (gr)';
      const isCentered = h === 'Fecha' || h === 'Lingotes' || h === 'Ley Prom. (‰)';
      cell.alignment = { horizontal: isWeight ? 'right' : isCentered ? 'center' : 'left', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: `FF${green}` } },
        bottom: { style: 'thin', color: { argb: `FF${green}` } },
        left: { style: 'thin', color: { argb: `FF${green}` } },
        right: { style: 'thin', color: { argb: `FF${green}` } },
      };
    });
    headerRow.height = 20;

    // Data rows
    records.forEach((row, idx) => {
      const r = sheet.getRow(10 + idx);
      let col = 1;
      r.getCell(col).value = row.id;
      r.getCell(col).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
      col++;
      r.getCell(col).value = row.guia;
      r.getCell(col).font = { size: 10 };
      col++;
      r.getCell(col).value = row.cliente;
      r.getCell(col).font = { size: 10 };
      col++;
      if (showFecha) {
        r.getCell(col).value = row.fecha;
        r.getCell(col).font = { size: 10 };
        r.getCell(col).alignment = { horizontal: 'center' };
        col++;
      }
      r.getCell(col).value = row.lingotes;
      r.getCell(col).font = { size: 10 };
      r.getCell(col).alignment = { horizontal: 'center' };
      col++;
      r.getCell(col).value = row.pesoBruto;
      r.getCell(col).font = { size: 10 };
      r.getCell(col).numFmt = '#,##0.00';
      r.getCell(col).alignment = { horizontal: 'right' };
      col++;
      r.getCell(col).value = row.pesoBrutoBalanza;
      r.getCell(col).font = { size: 10 };
      r.getCell(col).numFmt = '#,##0.00';
      r.getCell(col).alignment = { horizontal: 'right' };
      col++;
      r.getCell(col).value = row.merma;
      r.getCell(col).font = { size: 10 };
      r.getCell(col).numFmt = '#,##0.00';
      r.getCell(col).alignment = { horizontal: 'right' };
      col++;
      r.getCell(col).value = truncateLey(row.leyProm);
      r.getCell(col).font = { size: 10 };
      r.getCell(col).numFmt = '0.00';
      r.getCell(col).alignment = { horizontal: 'center' };

      const totalCols = 4 + (showFecha ? 1 : 0) + 4;
      if (idx % 2 === 1) {
        for (let c = 1; c <= totalCols; c++) {
          r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBFDFC' } };
        }
      }
    });

    // Totals row
    const totalRowIdx = 10 + records.length;
    const tr = sheet.getRow(totalRowIdx);
    const totalCols = 4 + (showFecha ? 1 : 0) + 4;
    let tc = 1;
    tr.getCell(tc).value = `TOTALES (${summary.totalEgresos} Egresos)`;
    tr.getCell(tc).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tc++; tc++; tc++; // guia, cliente
    if (showFecha) tc++; // fecha
    tr.getCell(tc).value = summary.totalLingotes;
    tr.getCell(tc).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tr.getCell(tc).alignment = { horizontal: 'center' };
    tc++;
    tr.getCell(tc).value = summary.pesoBrutoTotal;
    tr.getCell(tc).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tr.getCell(tc).numFmt = '#,##0.00';
    tr.getCell(tc).alignment = { horizontal: 'right' };
    tc++;
    tr.getCell(tc).value = summary.pesoBrutoBalanzaTotal;
    tr.getCell(tc).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tr.getCell(tc).numFmt = '#,##0.00';
    tr.getCell(tc).alignment = { horizontal: 'right' };
    tc++;
    tr.getCell(tc).value = summary.mermaTotal;
    tr.getCell(tc).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tr.getCell(tc).numFmt = '#,##0.00';
    tr.getCell(tc).alignment = { horizontal: 'right' };

    for (let c = 1; c <= totalCols; c++) {
      tr.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${greenLight}` } };
      tr.getCell(c).border = {
        top: { style: 'medium', color: { argb: `FF${green}` } },
        bottom: { style: 'medium', color: { argb: `FF${green}` } },
        left: { style: 'thin', color: { argb: `FF${green}` } },
        right: { style: 'thin', color: { argb: `FF${green}` } },
      };
    }
  } else {
    // Detailed mode
    let currentRow = 9;

    detailed.forEach((egreso) => {
      // Egreso banner
      sheet.mergeCells(`A${currentRow}:H${currentRow}`);
      const bannerCell = sheet.getCell(`A${currentRow}`);
      bannerCell.value = `${egreso.id} | ${egreso.guia} | ${egreso.cliente} | ${egreso.fecha} | ${egreso.destino}`;
      bannerCell.font = { bold: true, size: 10, color: { argb: `FF${green}` } };
      bannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${greenLight}` } };
      bannerCell.alignment = { vertical: 'middle' };
      sheet.getRow(currentRow).height = 22;
      currentRow++;

      // Each lot with its bars
      egreso.lotes.forEach((lote) => {
        const lotStartRow = currentRow;

        // Lot header
        sheet.mergeCells(`A${currentRow}:H${currentRow}`);
        const lotHeaderCell = sheet.getCell(`A${currentRow}`);
        const recoveredText = lote.recovered != null ? ` | Peso Bruto Recuperado: ${formatNumber(lote.recovered)} gr` : '';
        const leyText = lote.ley != null ? ` | Ley (‰): ${formatLey(lote.ley)}` : '';
        lotHeaderCell.value = `${lote.loteName}${recoveredText}${leyText} | ${lote.barras.length} ${lote.barras.length === 1 ? 'barra' : 'barras'}`;
        lotHeaderCell.font = { bold: true, size: 9, color: { argb: 'FF333333' } };
        lotHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F8F7' } };
        lotHeaderCell.alignment = { vertical: 'middle' };
        sheet.getRow(currentRow).height = 18;
        currentRow++;

        // Bars sub-headers
        const barHeaders = ['Código Barra', 'BI (gr)', 'BR (gr)', 'M (gr)', 'Ley (‰)', 'Proveedor'];
        const bhRow = sheet.getRow(currentRow);
        barHeaders.forEach((h, i) => {
          const cell = bhRow.getCell(i + 1);
          cell.value = h;
          cell.font = { bold: true, size: 8, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${green}` } };
          const isWeight = h === 'BI (gr)' || h === 'BR (gr)' || h === 'M (gr)';
          cell.alignment = { horizontal: i === 0 || i === 5 ? 'left' : i === 4 ? 'center' : 'right', vertical: 'middle' };
        });
        currentRow++;

        // Bars data
        lote.barras.forEach((barra, barraIdx) => {
          const br = sheet.getRow(currentRow);
          br.getCell(1).value = barra.barCode;
          br.getCell(1).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
          br.getCell(2).value = barra.pesoBruto;
          br.getCell(2).font = { size: 9 };
          br.getCell(2).numFmt = '#,##0.00';
          br.getCell(2).alignment = { horizontal: 'right' };
          br.getCell(3).value = barra.pesoBalanza ?? barra.pesoBruto;
          br.getCell(3).font = { size: 9 };
          br.getCell(3).numFmt = '#,##0.00';
          br.getCell(3).alignment = { horizontal: 'right' };
          br.getCell(4).value = barra.pesoBruto - (barra.pesoBalanza ?? barra.pesoBruto);
          br.getCell(4).font = { size: 9 };
          br.getCell(4).numFmt = '#,##0.00';
          br.getCell(4).alignment = { horizontal: 'right' };
          br.getCell(5).value = truncateLey(barra.ley);
          br.getCell(5).font = { size: 9 };
          br.getCell(5).numFmt = '0.00';
          br.getCell(5).alignment = { horizontal: 'center' };
          br.getCell(6).value = barra.proveedor;
          br.getCell(6).font = { size: 9 };

          if (barraIdx % 2 === 1) {
            for (let c = 1; c <= 6; c++) {
              br.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBFDFC' } };
            }
          }
          currentRow++;
        });

        // Apply border around the lot block
        const lotEndRow = currentRow - 1;
        for (let r = lotStartRow; r <= lotEndRow; r++) {
          for (let c = 1; c <= 6; c++) {
            const cell = sheet.getRow(r).getCell(c);
            cell.border = borderGreen;
          }
        }
      });

      // Subtotal
      const stRow = sheet.getRow(currentRow);
      stRow.getCell(1).value = `Subtotal — ${egreso.lingotes} Lingotes`;
      stRow.getCell(1).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
      stRow.getCell(2).value = egreso.pesoBruto;
      stRow.getCell(2).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
      stRow.getCell(2).numFmt = '#,##0.00';
      stRow.getCell(2).alignment = { horizontal: 'right' };
      stRow.getCell(3).value = egreso.pesoBrutoBalanza;
      stRow.getCell(3).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
      stRow.getCell(3).numFmt = '#,##0.00';
      stRow.getCell(3).alignment = { horizontal: 'right' };
      stRow.getCell(4).value = egreso.merma;
      stRow.getCell(4).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
      stRow.getCell(4).numFmt = '#,##0.00';
      stRow.getCell(4).alignment = { horizontal: 'right' };
      stRow.getCell(6).value = egreso.pesoFino;
      stRow.getCell(6).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
      stRow.getCell(6).numFmt = '#,##0.00';
      stRow.getCell(6).alignment = { horizontal: 'right' };
      for (let c = 1; c <= 6; c++) {
        stRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${greenLight}` } };
        stRow.getCell(c).border = { top: { style: 'medium', color: { argb: `FF${green}` } } };
      }
      currentRow += 2;
    });

    // General totals
    sheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const gtCell = sheet.getCell(`A${currentRow}`);
    gtCell.value = `TOTALES GENERALES — ${summary.totalEgresos} Egresos`;
    gtCell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    gtCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${green}` } };
    gtCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(currentRow).height = 24;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value = 'Total Lingotes';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
    sheet.getCell(`B${currentRow}`).value = summary.totalLingotes;
    sheet.getCell(`B${currentRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };

    sheet.getCell(`C${currentRow}`).value = 'Peso Bruto Total (BI)';
    sheet.getCell(`C${currentRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
    sheet.getCell(`D${currentRow}`).value = summary.pesoBrutoTotal;
    sheet.getCell(`D${currentRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };
    sheet.getCell(`D${currentRow}`).numFmt = '#,##0.00';

    sheet.getCell(`E${currentRow}`).value = 'Peso Balanza Total (BR)';
    sheet.getCell(`E${currentRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
    sheet.getCell(`F${currentRow}`).value = summary.pesoBrutoBalanzaTotal;
    sheet.getCell(`F${currentRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };
    sheet.getCell(`F${currentRow}`).numFmt = '#,##0.00';

    sheet.getCell(`G${currentRow}`).value = 'Merma Total';
    sheet.getCell(`G${currentRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
    sheet.getCell(`H${currentRow}`).value = summary.mermaTotal;
    sheet.getCell(`H${currentRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };
    sheet.getCell(`H${currentRow}`).numFmt = '#,##0.00';
  }

  // Column widths
  sheet.columns.forEach((col) => {
    if (col) col.width = col.width && col.width < 14 ? 14 : col.width;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Reporte_Egresos_BANDES_${params.reportId.replace('#', '')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
