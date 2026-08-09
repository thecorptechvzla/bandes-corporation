import ExcelJS from 'exceljs';
import type { SaldoRecord, SaldoDetailedRecord, SaldoReportType } from '@/components/reportes/saldos/types';
import { formatNumber, truncateLey } from '@/lib/format';

interface GenerateSaldosReportExcelParams {
  records: SaldoRecord[];
  detailedRecords: SaldoDetailedRecord[];
  reportId: string;
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  clienteName: string;
  reportType: SaldoReportType;
}

export async function generateSaldosReportExcel(params: GenerateSaldosReportExcelParams) {
  const { records, detailedRecords, reportId, generatedAt, dateFrom, dateTo, clienteName, reportType } = params;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BANDES - Sistema de Custodia';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Reporte Balance', {
    properties: { defaultColWidth: 18 },
  });

  const green = '139169';
  const greenLight = 'EAF4F0';

  // Title
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'REPORTE DE BALANCE POR PROVEEDOR';
  titleCell.font = { bold: true, size: 14, color: { argb: `FF${green}` } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${greenLight}` } };
  sheet.getRow(1).height = 30;

  // Subtitle
  sheet.mergeCells('A2:H2');
  const subCell = sheet.getCell('A2');
  subCell.value = 'Banco de Desarrollo Economico y Social de Venezuela — R.I.F. G-20001643-0 — Gerencia General de Operaciones';
  subCell.font = { size: 10, color: { argb: 'FF666666' } };
  subCell.alignment = { horizontal: 'center' };

  // Filter info
  sheet.mergeCells('A3:H3');
  const filterCell = sheet.getCell('A3');
  filterCell.value = `Proveedor: ${clienteName} | Periodo: ${dateFrom} al ${dateTo} | ID: ${reportId} | Generado: ${generatedAt}`;
  filterCell.font = { size: 9, color: { argb: 'FF888888' } };
  filterCell.alignment = { horizontal: 'center' };

  // Empty row
  sheet.getRow(4).height = 8;

  // KPI calculations
  const totalIngresado = records.reduce((a, r) => a + r.totalRecibido, 0);
  const totalEgresadoBI = records.reduce((a, r) => a + r.totalEgresado, 0);
  const totalEgresadoBR = records.reduce((a, r) => a + r.totalEgresadoBR, 0);
  const mermaTotal = records.reduce((a, r) => a + r.merma, 0);
  const saldoActual = records.reduce((a, r) => a + r.saldoActual, 0);

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
  const kpiHeaderRow = sheet.addRow(['TOTAL PESO BRUTO INGRESADO', '', 'TOTAL PESO BRUTO EGRESADO (BR)', '', 'BALANCE PESO BRUTO ACTUAL', '']);
  const kHn = kpiHeaderRow.number;
  sheet.mergeCells(`A${kHn}:B${kHn}`);
  sheet.mergeCells(`C${kHn}:D${kHn}`);
  sheet.mergeCells(`E${kHn}:F${kHn}`);
  kpiHeaderRow.height = 20;
  [1, 3, 5].forEach((col) => {
    const cell = kpiHeaderRow.getCell(col);
    cell.fill = fillGreen;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Segoe UI' } as ExcelJS.Font;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderGreen;
  });
  [2, 4, 6].forEach((col) => {
    const cell = kpiHeaderRow.getCell(col);
    cell.fill = fillGreen;
    cell.border = borderGreen;
  });

  // ── KPI Value Row ──
  const kpiValueRow = sheet.addRow([`${formatNumber(totalIngresado)} g`, '', `${formatNumber(totalEgresadoBR)} g`, '', `${formatNumber(saldoActual)} g`, '']);
  const kVn = kpiValueRow.number;
  sheet.mergeCells(`A${kVn}:B${kVn}`);
  sheet.mergeCells(`C${kVn}:D${kVn}`);
  sheet.mergeCells(`E${kVn}:F${kVn}`);
  kpiValueRow.height = 26;
  [1, 3, 5].forEach((col) => {
    const cell = kpiValueRow.getCell(col);
    cell.fill = fillGreenLight;
    cell.font = { bold: true, size: 13, color: { argb: 'FF333333' }, name: 'Segoe UI' } as ExcelJS.Font;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderGreen;
  });
  [2, 4, 6].forEach((col) => {
    const cell = kpiValueRow.getCell(col);
    cell.fill = fillGreenLight;
    cell.border = borderGreen;
  });

  // ── KPI Subtitle Row ──
  const kpiSubRow = sheet.addRow(['Material recibido', '', `BI: ${formatNumber(totalEgresadoBI)} g | M: ${formatNumber(mermaTotal)} g`, '', 'Saldo en bóveda', '']);
  const kSn = kpiSubRow.number;
  sheet.mergeCells(`A${kSn}:B${kSn}`);
  sheet.mergeCells(`C${kSn}:D${kSn}`);
  sheet.mergeCells(`E${kSn}:F${kSn}`);
  [1, 3, 5].forEach((col) => {
    const cell = kpiSubRow.getCell(col);
    cell.fill = fillGreenLight;
    cell.font = { size: 9, color: { argb: 'FF666666' }, name: 'Segoe UI' } as ExcelJS.Font;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderGreen;
  });
  [2, 4, 6].forEach((col) => {
    const cell = kpiSubRow.getCell(col);
    cell.fill = fillGreenLight;
    cell.border = borderGreen;
  });

  // ── Spacer ──
  sheet.getRow(kpiSubRow.number + 1).height = 8;

  if (reportType === 'resumido') {
    // Summary table headers — Cliente spans A:B, rest shift right
    const headers = [
      'Cliente / Proveedor',
      '',
      'Total Peso Bruto Recibido (g)',
      'Egresado BI (g)',
      'Egresado BR (g)',
      'MERMA (g)',
      'Balance Peso Bruto Restante (g)',
      'Barras en Boveda',
    ];
    const headerRow = sheet.getRow(9);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${green}` } };
      cell.alignment = { horizontal: i < 2 ? 'left' : i === 7 ? 'center' : 'right', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: `FF${green}` } },
        bottom: { style: 'thin', color: { argb: `FF${green}` } },
        left: { style: 'thin', color: { argb: `FF${green}` } },
        right: { style: 'thin', color: { argb: `FF${green}` } },
      };
    });
    // Merge A7:B7 for "Cliente / Proveedor"
    sheet.mergeCells('A9:B9');
    headerRow.height = 20;

    // Data rows
    records.forEach((row, idx) => {
      const r = sheet.getRow(10 + idx);
      r.getCell(1).value = row.cliente;
      r.getCell(1).font = { size: 10, bold: true };
      // B is merged with A, no value needed
      r.getCell(3).value = row.totalRecibido;
      r.getCell(3).font = { size: 10 };
      r.getCell(3).numFmt = '#,##0.00';
      r.getCell(3).alignment = { horizontal: 'right' };
      r.getCell(4).value = row.totalEgresado;
      r.getCell(4).font = { size: 10 };
      r.getCell(4).numFmt = '#,##0.00';
      r.getCell(4).alignment = { horizontal: 'right' };
      r.getCell(5).value = row.totalEgresadoBR;
      r.getCell(5).font = { size: 10 };
      r.getCell(5).numFmt = '#,##0.00';
      r.getCell(5).alignment = { horizontal: 'right' };
      r.getCell(6).value = row.merma;
      r.getCell(6).font = { size: 10 };
      r.getCell(6).numFmt = '#,##0.00';
      r.getCell(6).alignment = { horizontal: 'right' };
      r.getCell(7).value = row.saldoActual;
      r.getCell(7).font = { size: 10, bold: true, color: { argb: `FF${green}` } };
      r.getCell(7).numFmt = '#,##0.00';
      r.getCell(7).alignment = { horizontal: 'right' };
      r.getCell(8).value = row.barrasEnBoveda;
      r.getCell(8).font = { size: 10 };
      r.getCell(8).alignment = { horizontal: 'center' };

      // Merge A:B for client name
      sheet.mergeCells(`A${10 + idx}:B${10 + idx}`);

      if (idx % 2 === 1) {
        for (let c = 1; c <= 8; c++) {
          r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBFDFC' } };
        }
      }
    });

    // Totals row
    const totalRowIdx = 10 + records.length;
    const tr = sheet.getRow(totalRowIdx);
    const totalBarras = records.reduce((a, r) => a + r.barrasEnBoveda, 0);
    tr.getCell(1).value = `TOTALES (${records.length} PROVEEDORES)`;
    tr.getCell(1).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tr.getCell(3).value = totalIngresado;
    tr.getCell(3).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tr.getCell(3).numFmt = '#,##0.00';
    tr.getCell(3).alignment = { horizontal: 'right' };
    tr.getCell(4).value = totalEgresadoBI;
    tr.getCell(4).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tr.getCell(4).numFmt = '#,##0.00';
    tr.getCell(4).alignment = { horizontal: 'right' };
    tr.getCell(5).value = totalEgresadoBR;
    tr.getCell(5).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tr.getCell(5).numFmt = '#,##0.00';
    tr.getCell(5).alignment = { horizontal: 'right' };
    tr.getCell(6).value = mermaTotal;
    tr.getCell(6).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tr.getCell(6).numFmt = '#,##0.00';
    tr.getCell(6).alignment = { horizontal: 'right' };
    tr.getCell(7).value = saldoActual;
    tr.getCell(7).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tr.getCell(7).numFmt = '#,##0.00';
    tr.getCell(7).alignment = { horizontal: 'right' };
    tr.getCell(8).value = `${totalBarras} Barras`;
    tr.getCell(8).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tr.getCell(8).alignment = { horizontal: 'center' };

    // Merge A:B for totals label
    sheet.mergeCells(`A${totalRowIdx}:B${totalRowIdx}`);

    for (let c = 1; c <= 8; c++) {
      tr.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${greenLight}` } };
      tr.getCell(c).border = {
        top: { style: 'medium', color: { argb: `FF${green}` } },
        bottom: { style: 'medium', color: { argb: `FF${green}` } },
      };
    }
  } else {
    // Detailed mode
    let currentRow = 9;

    detailedRecords.forEach((cliente) => {
      // Client banner — merge A:H for 8 columns
      sheet.mergeCells(`A${currentRow}:H${currentRow}`);
      const bannerCell = sheet.getCell(`A${currentRow}`);
      bannerCell.value = `${cliente.cliente}\nPeso Bruto Recibido: ${formatNumber(cliente.totalRecibido)} g  |  Egresado BI: ${formatNumber(cliente.totalEgresado)} g  |  Egresado BR: ${formatNumber(cliente.totalEgresadoBR)} g  |  MERMA: ${formatNumber(cliente.merma)} g  |  BALANCE PESO BRUTO: ${formatNumber(cliente.saldoActual)} g`;
      bannerCell.font = { bold: true, size: 10, color: { argb: `FF${green}` } };
      bannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${greenLight}` } };
      bannerCell.alignment = { vertical: 'middle', wrapText: true };
      sheet.getRow(currentRow).height = 44;
      currentRow++;

      // Bar headers — 8 columns
      const barHeaders = ['N Lote / ID Barra', 'Packing Origen', 'Fecha Recepcion', 'Peso Bruto Recibido (g)', 'Ley (‰)', 'Peso Fino Disponible (g)', 'Boveda / Egreso (BI-BR-M)', 'Fecha Egreso / Estatus'];
      const bhr = sheet.getRow(currentRow);
      barHeaders.forEach((h, i) => {
        const cell = bhr.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${green}` } };
        cell.alignment = { horizontal: i < 3 ? 'left' : i === 4 ? 'center' : i === 7 ? 'center' : 'right', vertical: 'middle' };
      });
      currentRow++;

      // Bar data — 8 columns
      cliente.barras.forEach((barra, barraIdx) => {
        const lr = sheet.getRow(currentRow);
        lr.getCell(1).value = barra.loteId;
        lr.getCell(1).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
        lr.getCell(2).value = barra.packingOrigen;
        lr.getCell(2).font = { size: 9 };
        lr.getCell(3).value = barra.fechaRecepcion;
        lr.getCell(3).font = { size: 9 };
        lr.getCell(3).alignment = { horizontal: 'center' };
        lr.getCell(4).value = barra.pesoBrutoRecibido;
        lr.getCell(4).font = { size: 9 };
        lr.getCell(4).numFmt = '#,##0.00';
        lr.getCell(4).alignment = { horizontal: 'right' };
        lr.getCell(5).value = truncateLey(barra.ley);
        lr.getCell(5).font = { size: 9 };
        lr.getCell(5).numFmt = '0.00';
        lr.getCell(5).alignment = { horizontal: 'center' };
        lr.getCell(6).value = barra.pesoFinoDisponible;
        lr.getCell(6).font = { size: 9 };
        lr.getCell(6).numFmt = '#,##0.00';
        lr.getCell(6).alignment = { horizontal: 'right' };
        lr.getCell(7).value = barra.fueEgresado
          ? `BI: ${formatNumber(barra.pesoBrutoRecibido)} g | BR: ${formatNumber(barra.pesoBrutoEnBoveda)} g | M: ${formatNumber(barra.pesoBrutoRecibido - barra.pesoBrutoEnBoveda)} g`
          : barra.pesoBrutoEnBoveda;
        lr.getCell(7).font = { size: 9 };
        if (!barra.fueEgresado) {
          lr.getCell(7).numFmt = '#,##0.00';
          lr.getCell(7).alignment = { horizontal: 'right' };
        } else {
          lr.getCell(7).alignment = { horizontal: 'left' };
        }
        lr.getCell(8).value = barra.fueEgresado ? (barra.fechaEgreso ?? '') : 'EN BÓVEDA';
        lr.getCell(8).font = barra.fueEgresado ? { size: 9 } : { bold: true, size: 9, color: { argb: `FF${green}` } };
        lr.getCell(8).alignment = { horizontal: 'center' };

        if (barraIdx % 2 === 1) {
          for (let c = 1; c <= 8; c++) {
            lr.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBFDFC' } };
          }
        }
        currentRow++;
      });

      // Subtotal — 8 columns
      const stRow = sheet.getRow(currentRow);
      const totBrutoRecibido = cliente.barras.reduce((a, b) => a + b.pesoBrutoRecibido, 0);
      const totFino = cliente.barras.reduce((a, b) => a + b.pesoFinoDisponible, 0);
      const totBrutoBoveda = cliente.barras.reduce((a, b) => a + b.pesoBrutoEnBoveda, 0);
      stRow.getCell(1).value = `Subtotal — ${cliente.barrasEnBoveda} Barras`;
      stRow.getCell(1).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
      stRow.getCell(4).value = totBrutoRecibido;
      stRow.getCell(4).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
      stRow.getCell(4).numFmt = '#,##0.00';
      stRow.getCell(4).alignment = { horizontal: 'right' };
      stRow.getCell(6).value = totFino;
      stRow.getCell(6).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
      stRow.getCell(6).numFmt = '#,##0.00';
      stRow.getCell(6).alignment = { horizontal: 'right' };
      stRow.getCell(7).value = totBrutoBoveda;
      stRow.getCell(7).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
      stRow.getCell(7).numFmt = '#,##0.00';
      stRow.getCell(7).alignment = { horizontal: 'right' };
      for (let c = 1; c <= 8; c++) {
        stRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${greenLight}` } };
        stRow.getCell(c).border = { top: { style: 'medium', color: { argb: `FF${green}` } } };
      }
      currentRow += 2;
    });

    // General totals — merge A:H for 8 columns
    sheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const gtCell = sheet.getCell(`A${currentRow}`);
    gtCell.value = 'TOTALES GENERALES — BALANCE CONSOLIDADO';
    gtCell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    gtCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${green}` } };
    gtCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(currentRow).height = 24;
    currentRow++;

    const totalBarras = records.reduce((a, r) => a + r.barrasEnBoveda, 0);
    sheet.getCell(`A${currentRow}`).value = 'Total Peso Bruto Ingresado (BI)';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
    sheet.getCell(`B${currentRow}`).value = totalIngresado;
    sheet.getCell(`B${currentRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };
    sheet.getCell(`B${currentRow}`).numFmt = '#,##0.00';

    sheet.getCell(`C${currentRow}`).value = 'Total Egresado BI';
    sheet.getCell(`C${currentRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
    sheet.getCell(`D${currentRow}`).value = totalEgresadoBI;
    sheet.getCell(`D${currentRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };
    sheet.getCell(`D${currentRow}`).numFmt = '#,##0.00';

    sheet.getCell(`E${currentRow}`).value = 'Total Egresado BR';
    sheet.getCell(`E${currentRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
    sheet.getCell(`F${currentRow}`).value = totalEgresadoBR;
    sheet.getCell(`F${currentRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };
    sheet.getCell(`F${currentRow}`).numFmt = '#,##0.00';

    sheet.getCell(`G${currentRow}`).value = 'MERMA Total';
    sheet.getCell(`G${currentRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
    sheet.getCell(`H${currentRow}`).value = mermaTotal;
    sheet.getCell(`H${currentRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };
    sheet.getCell(`H${currentRow}`).numFmt = '#,##0.00';
  }

  // Column widths — 8 columns for detailed
  sheet.getColumn(1).width = 22;
  sheet.getColumn(2).width = 18;
  sheet.getColumn(3).width = 18;
  sheet.getColumn(4).width = 22;
  sheet.getColumn(5).width = 12;
  sheet.getColumn(6).width = 24;
  sheet.getColumn(7).width = 22;
  sheet.getColumn(8).width = 20;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Reporte_Balance_BANDES_${params.reportId.replace('#', '')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
