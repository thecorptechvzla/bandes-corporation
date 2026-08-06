import ExcelJS from 'exceljs';
import type { EgresosReportData, EgresoReportType } from '@/components/reportes/egresos/types';

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
  filterCell.value = `Cliente: ${clienteName} | Período: ${dateFrom} al ${dateTo} | Tipo: ${reportType === 'detallado' ? 'Detallado' : 'Resumido'} | ID: ${reportId} | Generado: ${generatedAt}`;
  filterCell.font = { size: 9, color: { argb: 'FF888888' } };
  filterCell.alignment = { horizontal: 'center' };

  // Empty row
  sheet.getRow(4).height = 8;

  // KPIs
  const kpiRow = 5;
  const kpiFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${greenLight}` } };
  const kpiBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: `FF${green}` } },
    bottom: { style: 'thin', color: { argb: `FF${green}` } },
    left: { style: 'thin', color: { argb: `FF${green}` } },
    right: { style: 'thin', color: { argb: `FF${green}` } },
  };

  sheet.getCell(`A${kpiRow}`).value = 'TOTAL EGRESOS';
  sheet.getCell(`A${kpiRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
  sheet.getCell(`A${kpiRow}`).fill = kpiFill;
  sheet.getCell(`A${kpiRow}`).border = kpiBorder;
  sheet.getCell(`B${kpiRow}`).value = summary.totalEgresos;
  sheet.getCell(`B${kpiRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };
  sheet.getCell(`B${kpiRow}`).fill = kpiFill;
  sheet.getCell(`B${kpiRow}`).border = kpiBorder;

  sheet.getCell(`C${kpiRow}`).value = 'TOTAL LINGOTES';
  sheet.getCell(`C${kpiRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
  sheet.getCell(`C${kpiRow}`).fill = kpiFill;
  sheet.getCell(`C${kpiRow}`).border = kpiBorder;
  sheet.getCell(`D${kpiRow}`).value = summary.totalLingotes;
  sheet.getCell(`D${kpiRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };
  sheet.getCell(`D${kpiRow}`).fill = kpiFill;
  sheet.getCell(`D${kpiRow}`).border = kpiBorder;

  sheet.getCell(`E${kpiRow}`).value = 'PESO BRUTO TOTAL';
  sheet.getCell(`E${kpiRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
  sheet.getCell(`E${kpiRow}`).fill = kpiFill;
  sheet.getCell(`E${kpiRow}`).border = kpiBorder;
  sheet.getCell(`F${kpiRow}`).value = summary.pesoBrutoTotal;
  sheet.getCell(`F${kpiRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };
  sheet.getCell(`F${kpiRow}`).numFmt = '#,##0.00';
  sheet.getCell(`F${kpiRow}`).fill = kpiFill;
  sheet.getCell(`F${kpiRow}`).border = kpiBorder;

  sheet.getRow(kpiRow).height = 22;

  // Empty row
  sheet.getRow(6).height = 8;

  if (reportType === 'resumido') {
    const showFecha = dateFrom !== dateTo;

    // Summary table headers
    const headers = [
      'N° Egreso',
      'Guía',
      'Cliente',
      ...(showFecha ? ['Fecha'] : []),
      'Lingotes',
      'Peso Bruto (gr)',
      'Ley Prom.',
    ];
    const headerRow = sheet.getRow(7);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${green}` } };
      cell.alignment = { horizontal: i < 3 ? 'left' : i < 3 + (showFecha ? 1 : 0) ? 'right' : 'left', vertical: 'middle' };
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
      const r = sheet.getRow(8 + idx);
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
      r.getCell(col).value = row.leyProm;
      r.getCell(col).font = { size: 10 };
      r.getCell(col).numFmt = '0.0000';
      r.getCell(col).alignment = { horizontal: 'center' };

      const totalCols = 3 + (showFecha ? 1 : 0) + 3;
      if (idx % 2 === 1) {
        for (let c = 1; c <= totalCols; c++) {
          r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBFDFC' } };
        }
      }
    });

    // Totals row
    const totalRowIdx = 8 + records.length;
    const tr = sheet.getRow(totalRowIdx);
    const totalCols = 3 + (showFecha ? 1 : 0) + 3;
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
    let currentRow = 7;

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

      // Lingote headers
      const lingoteHeaders = ['Lote / Barra', 'Lingote / Serie', 'Peso Bruto', 'Ley', 'Peso Fino'];
      const lhr = sheet.getRow(currentRow);
      lingoteHeaders.forEach((h, i) => {
        const cell = lhr.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${green}` } };
        cell.alignment = { horizontal: i < 2 ? 'left' : i === 2 || i === 4 ? 'right' : 'center' };
      });
      currentRow++;

      // Lingote data
      egreso.items.forEach((item, itemIdx) => {
        const lr = sheet.getRow(currentRow);
        lr.getCell(1).value = item.lote;
        lr.getCell(1).font = { size: 9 };
        lr.getCell(2).value = item.lingoteId;
        lr.getCell(2).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
        lr.getCell(3).value = item.pesoBruto;
        lr.getCell(3).font = { size: 9 };
        lr.getCell(3).numFmt = '#,##0.00';
        lr.getCell(3).alignment = { horizontal: 'right' };
        lr.getCell(4).value = item.ley;
        lr.getCell(4).font = { size: 9 };
        lr.getCell(4).numFmt = '0.0000';
        lr.getCell(4).alignment = { horizontal: 'center' };
        lr.getCell(5).value = item.pesoFino;
        lr.getCell(5).font = { size: 9 };
        lr.getCell(5).numFmt = '#,##0.00';
        lr.getCell(5).alignment = { horizontal: 'right' };

        if (itemIdx % 2 === 1) {
          for (let c = 1; c <= 5; c++) {
            lr.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBFDFC' } };
          }
        }
        currentRow++;
      });

      // Subtotal
      const stRow = sheet.getRow(currentRow);
      stRow.getCell(1).value = `Subtotal — ${egreso.lingotes} Lingotes`;
      stRow.getCell(1).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
      stRow.getCell(3).value = egreso.pesoBruto;
      stRow.getCell(3).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
      stRow.getCell(3).numFmt = '#,##0.00';
      stRow.getCell(3).alignment = { horizontal: 'right' };
      stRow.getCell(5).value = egreso.pesoFino;
      stRow.getCell(5).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
      stRow.getCell(5).numFmt = '#,##0.00';
      stRow.getCell(5).alignment = { horizontal: 'right' };
      for (let c = 1; c <= 5; c++) {
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

    sheet.getCell(`C${currentRow}`).value = 'Peso Bruto Total';
    sheet.getCell(`C${currentRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
    sheet.getCell(`D${currentRow}`).value = summary.pesoBrutoTotal;
    sheet.getCell(`D${currentRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };
    sheet.getCell(`D${currentRow}`).numFmt = '#,##0.00';

    sheet.getCell(`E${currentRow}`).value = 'Peso Bruto Total';
    sheet.getCell(`E${currentRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
    sheet.getCell(`F${currentRow}`).value = summary.pesoFinoTotal;
    sheet.getCell(`F${currentRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };
    sheet.getCell(`F${currentRow}`).numFmt = '#,##0.00';
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
